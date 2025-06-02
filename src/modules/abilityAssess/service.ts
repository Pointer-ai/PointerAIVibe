import { log, error } from '../../utils/logger'
import { callAI } from '../../utils/ai'
import { getProfileData, setProfileData } from '../../utils/profile'
import { addActivityRecord } from '../profileSettings/service'
import { addCoreEvent } from '../coreData'
import { generateAssessmentPrompt } from './prompt'
import { 
  AbilityAssessment, 
  AssessmentInput,
  DEFAULT_WEIGHTS,
  getScoreLevel,
  getSkillScoreValue,
  SkillScore,
  ImprovementPlan,
  GeneratedGoal,
  GeneratedPath,
  SkillGapData,
  TimelineData,
  PriorityData
} from './types'
import { agentToolExecutor } from '../coreData'
import { learningSystemService } from '../learningSystem'

/**
 * 清理并修复常见的 JSON 格式错误
 */
const cleanupJSONString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim()
  
  // 移除可能的 markdown 代码块标记
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  
  // 修复常见的不完整布尔值
  cleaned = cleaned.replace(/"isInferred":\s*f(?![a-z])/g, '"isInferred": false')
  cleaned = cleaned.replace(/"isInferred":\s*t(?![a-z])/g, '"isInferred": true')
  
  // 修复其他常见的不完整值
  cleaned = cleaned.replace(/:\s*fals$/g, ': false')
  cleaned = cleaned.replace(/:\s*tru$/g, ': true')
  cleaned = cleaned.replace(/:\s*nul$/g, ': null')
  
  // 确保字符串末尾有正确的闭合括号
  const openBraces = (cleaned.match(/\{/g) || []).length
  const closeBraces = (cleaned.match(/\}/g) || []).length
  
  if (openBraces > closeBraces) {
    // 只有在真正缺少必要结构时才添加默认内容
    // 不要过度修复，避免覆盖有效内容
    if (cleaned.includes('"report"') && !cleaned.includes('"recommendations"') && !cleaned.includes('"summary"')) {
      log('[cleanupJSONString] Detected incomplete report section, adding minimal structure')
      // 只在完全缺失时添加最小结构
      const reportMatch = cleaned.match(/"report":\s*\{[^}]*$/)
      if (reportMatch) {
        cleaned = cleaned.replace(/"report":\s*\{[^}]*$/, '"report": {"summary": "解析中断，请重试","strengths": [],"improvements": [],"recommendations": []}')
      }
    }
    
    // 添加缺少的闭合括号
    cleaned += '}'.repeat(openBraces - closeBraces)
  }
  
  // 尝试修复缺少的逗号（更保守的方法）
  cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"')
  cleaned = cleaned.replace(/\}\s*\n\s*"/g, '},\n"')
  cleaned = cleaned.replace(/\]\s*\n\s*"/g, '],\n"')
  
  return cleaned
}

/**
 * 验证和修复评估数据结构
 */
const validateAndFixAssessment = (assessment: any): AbilityAssessment => {
  log('[validateAndFixAssessment] Starting validation')
  
  // 确保 report 字段存在，但不覆盖已有内容
  if (!assessment.report) {
    log('[validateAndFixAssessment] No report found, creating default')
    assessment.report = {
      summary: '评估已完成',
      strengths: [],
      improvements: [],
      recommendations: []
    }
  }
  
  // 只在字段真正缺失或为空时才使用默认值 - 更严格的检查
  if (!assessment.report.summary || assessment.report.summary.trim() === '' || assessment.report.summary === '评估已完成') {
    // 只有在真正缺失时才使用默认值，不要覆盖AI生成的内容
    if (!assessment.report.summary || assessment.report.summary.trim() === '') {
      assessment.report.summary = '评估已完成'
    }
  }
  if (!assessment.report.strengths || !Array.isArray(assessment.report.strengths) || assessment.report.strengths.length === 0) {
    // 保持原有结构，即使是空数组也比默认值好
    if (!assessment.report.strengths || !Array.isArray(assessment.report.strengths)) {
      assessment.report.strengths = []
    }
  }
  if (!assessment.report.improvements || !Array.isArray(assessment.report.improvements) || assessment.report.improvements.length === 0) {
    if (!assessment.report.improvements || !Array.isArray(assessment.report.improvements)) {
      assessment.report.improvements = []
    }
  }
  if (!assessment.report.recommendations || !Array.isArray(assessment.report.recommendations) || assessment.report.recommendations.length === 0) {
    if (!assessment.report.recommendations || !Array.isArray(assessment.report.recommendations)) {
      assessment.report.recommendations = []
    }
  }
  
  // 确保其他必要字段存在
  if (!assessment.metadata) {
    assessment.metadata = {
      assessmentDate: new Date().toISOString(),
      assessmentMethod: 'resume',
      confidence: 0.5
    }
  }
  
  if (!assessment.dimensions) {
    assessment.dimensions = {}
  }
  
  // 验证每个维度的数据结构
  const requiredDimensions = ['programming', 'algorithm', 'project', 'systemDesign', 'communication']
  requiredDimensions.forEach(dimKey => {
    if (!assessment.dimensions[dimKey]) {
      assessment.dimensions[dimKey] = {
        score: 0,
        weight: DEFAULT_WEIGHTS[dimKey as keyof typeof DEFAULT_WEIGHTS] || 0.2,
        skills: {}
      }
    }
    
    const dimension = assessment.dimensions[dimKey]
    if (!dimension.skills) dimension.skills = {}
    if (typeof dimension.score !== 'number') dimension.score = 0
    if (typeof dimension.weight !== 'number') {
      dimension.weight = DEFAULT_WEIGHTS[dimKey as keyof typeof DEFAULT_WEIGHTS] || 0.2
    }
  })
  
  log('[validateAndFixAssessment] Validation completed')
  
  return assessment as AbilityAssessment
}

/**
 * 能力评估服务类
 * 提供完整的能力评估功能，包括评估执行、数据管理、分析报告等
 */
export class AbilityAssessmentService {
  constructor() {
    log('[AbilityAssessmentService] Service initialized')
  }

  /**
   * 执行能力评估
   */
  async executeAssessment(input: AssessmentInput): Promise<AbilityAssessment> {
    log('[AbilityAssessmentService] Starting assessment execution')
    
    try {
      const assessment = await this.analyzeAbility(input)
      
      // 记录到统一的核心事件系统
      addCoreEvent({
        type: 'ability_assessment_completed',
        data: {
          method: input.type,
          overallScore: assessment.overallScore,
          level: getScoreLevel(assessment.overallScore),
          assessmentDate: assessment.metadata.assessmentDate
        }
      })
      
      log('[AbilityAssessmentService] Assessment execution completed successfully')
      return assessment
      
    } catch (error) {
      log('[AbilityAssessmentService] Assessment execution failed:', error)
      throw error
    }
  }

  /**
   * 获取当前评估结果
   */
  getCurrentAssessment(): AbilityAssessment | null {
    return getProfileData('abilityAssessment') || null
  }

  /**
   * 获取评估历史
   */
  getAssessmentHistory() {
    return getProfileData('assessmentHistory') || []
  }

  /**
   * 更新评估结果
   */
  async updateAssessment(updates: Partial<AbilityAssessment>): Promise<AbilityAssessment | null> {
    const current = this.getCurrentAssessment()
    if (!current) return null
    
    const updated = { ...current, ...updates }
    await this.saveAssessment(updated)
    
    addCoreEvent({
      type: 'ability_assessment_updated',
      data: {
        updatedFields: Object.keys(updates),
        overallScore: updated.overallScore
      }
    })
    
    return updated
  }

  /**
   * 生成能力提升建议
   */
  async generateImprovementPlan(assessment?: AbilityAssessment): Promise<string> {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      throw new Error('No assessment data available')
    }
    
    return await generateImprovementPlan(targetAssessment)
  }

  /**
   * 导出评估报告
   */
  exportReport(assessment?: AbilityAssessment): string {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      throw new Error('No assessment data available')
    }
    
    return exportAssessmentReport(targetAssessment)
  }

  /**
   * 分析薄弱领域
   */
  analyzeWeakAreas(assessment?: AbilityAssessment) {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      return []
    }
    
    return findWeakAreas(targetAssessment)
  }

  /**
   * 获取能力水平概述
   */
  getAbilitySummary() {
    const assessment = this.getCurrentAssessment()
    if (!assessment) {
      return {
        hasAssessment: false,
        overallScore: 0,
        level: 'unknown',
        assessmentDate: null,
        needsAssessment: true
      }
    }
    
    return {
      hasAssessment: true,
      overallScore: assessment.overallScore,
      level: getScoreLevel(assessment.overallScore),
      assessmentDate: assessment.metadata.assessmentDate,
      strengths: assessment.report.strengths,
      improvements: assessment.report.improvements,
      needsAssessment: false,
      confidence: assessment.metadata.confidence
    }
  }

  /**
   * 私有方法：分析用户能力
   */
  private async analyzeAbility(input: AssessmentInput): Promise<AbilityAssessment> {
    log('[AbilityAssessmentService] Starting ability analysis')
    
    try {
      // 生成评估内容
      const assessmentContent = input.type === 'resume' 
        ? input.content as string
        : JSON.stringify(input.content, null, 2)
      
      // 调用 AI 进行评估
      const prompt = generateAssessmentPrompt(assessmentContent, input.type)
      const result = await callAI(prompt)
      
      log('[AbilityAssessmentService] AI response received, parsing...')
      
      // 解析 AI 返回的 JSON 结果
      const assessment = await this.parseAIResponse(result)
      
      // 保存评估结果到本地存储
      await this.saveAssessment(assessment)
      
      // 记录活动
      addActivityRecord({
        type: 'assessment',
        action: '完成能力评估',
        details: {
          method: input.type,
          overallScore: assessment.overallScore,
          level: getScoreLevel(assessment.overallScore)
        }
      })
      
      log('[AbilityAssessmentService] Assessment analysis completed successfully')
      return assessment
      
    } catch (err) {
      error('[AbilityAssessmentService] Failed to analyze ability:', err)
      throw err
    }
  }

  /**
   * 私有方法：解析AI响应
   */
  private async parseAIResponse(result: string): Promise<AbilityAssessment> {
    log('[parseAIResponse] Starting JSON parsing')
    
    // 解析 AI 返回的 JSON 结果
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      log('[parseAIResponse] Standard JSON format not found, trying alternative formats')
      
      // 尝试其他格式的 JSON 提取
      const altJsonMatch = result.match(/```json([\s\S]*?)```/) || 
                          result.match(/```\s*\{[\s\S]*?\}\s*```/) ||
                          result.match(/\{[\s\S]*\}/)
      
      if (altJsonMatch) {
        log('[parseAIResponse] Found JSON in alternative format')
        const rawJson = altJsonMatch[1] || altJsonMatch[0]
        const cleanJson = cleanupJSONString(rawJson.trim())
        
        try {
          const assessment: AbilityAssessment = JSON.parse(cleanJson)
          log('[parseAIResponse] JSON parsing successful')
          
          // 验证和修复数据结构
          const validatedAssessment = validateAndFixAssessment(assessment)
          
          // 计算并验证总分
          validatedAssessment.overallScore = this.calculateOverallScore(validatedAssessment)
          
          return validatedAssessment
        } catch (parseError) {
          error('[parseAIResponse] JSON parsing failed:', parseError)
          throw parseError
        }
      }
      
      error('[parseAIResponse] No valid JSON format found in AI response')
      throw new Error('No valid JSON found in AI response')
    }
    
    // 标准格式的 JSON 解析
    log('[parseAIResponse] Using standard JSON format')
    const rawJson = jsonMatch[1]
    const cleanJson = cleanupJSONString(rawJson)
    
    try {
      const assessment: AbilityAssessment = JSON.parse(cleanJson)
      log('[parseAIResponse] JSON parsing successful')
      
      // 验证和修复数据结构
      const validatedAssessment = validateAndFixAssessment(assessment)
      
      // 计算并验证总分
      validatedAssessment.overallScore = this.calculateOverallScore(validatedAssessment)
      
      return validatedAssessment
    } catch (parseError) {
      error('[parseAIResponse] JSON parsing failed:', parseError)
      throw parseError
    }
  }

  /**
   * 私有方法：计算总体评分
   */
  private calculateOverallScore(assessment: AbilityAssessment): number {
    const { dimensions } = assessment
    
    // 计算各维度的维度总分（如果 AI 没有正确计算）
    Object.values(dimensions).forEach(dimension => {
      const skills = Object.values(dimension.skills)
      const scores = skills.map(skill => getSkillScoreValue(skill))
      dimension.score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    })
    
    // 计算加权总分
    const weightedSum = Object.values(dimensions).reduce((sum, dim) => {
      return sum + (dim.score * dim.weight)
    }, 0)
    
    return Math.round(weightedSum)
  }

  /**
   * 私有方法：保存评估结果
   */
  private async saveAssessment(assessment: AbilityAssessment): Promise<void> {
    // 保存当前评估
    setProfileData('abilityAssessment', assessment)
    
    // 保存到历史记录
    const history = getProfileData('assessmentHistory') || []
    history.push({
      date: assessment.metadata.assessmentDate,
      overallScore: assessment.overallScore,
      level: getScoreLevel(assessment.overallScore)
    })
    setProfileData('assessmentHistory', history)
  }

  /**
   * 生成智能提升计划 - 自动创建目标和路径
   */
  async generateIntelligentImprovementPlan(assessment?: AbilityAssessment): Promise<ImprovementPlan> {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      throw new Error('No assessment data available for improvement plan generation')
    }

    log('[AbilityAssessmentService] Starting intelligent improvement plan generation')

    // 检查是否已有缓存的提升计划
    const existingPlan = this.getCachedImprovementPlan(targetAssessment)
    if (existingPlan) {
      log('[AbilityAssessmentService] Using cached improvement plan')
      return existingPlan
    }

    try {
      // 1. 分析技能差距和优先级
      const skillGapAnalysis = await this.analyzeSkillGaps(targetAssessment)
      
      // 2. 生成AI提升策略
      const aiStrategy = await this.generateAIStrategy(targetAssessment, skillGapAnalysis)
      
      // 3. 使用Function Calling系统创建实际的目标和路径
      const generatedGoals = await this.createGoalsAndPaths(aiStrategy)
      
      // 4. 构建完整的提升计划
      const improvementPlan: ImprovementPlan = {
        id: `plan_${Date.now()}`,
        createdAt: new Date().toISOString(),
        assessmentId: `assessment_${Date.now()}`,
        metadata: {
          baseScore: targetAssessment.overallScore,
          targetImprovement: aiStrategy.targetImprovement,
          estimatedTimeMonths: aiStrategy.estimatedTimeMonths,
          planType: aiStrategy.planType,
          confidence: targetAssessment.metadata.confidence
        },
        generatedGoals: generatedGoals,
        overallStrategy: aiStrategy.strategy,
        visualData: {
          skillGapChart: skillGapAnalysis.skillGaps,
          progressTimeline: aiStrategy.timeline,
          priorityMatrix: aiStrategy.priorityMatrix
        }
      }

      // 5. 缓存提升计划
      this.cacheImprovementPlan(improvementPlan, targetAssessment)

      // 6. 记录活动
      addActivityRecord({
        type: 'improvement_plan',
        action: '生成智能提升计划',
        details: {
          planId: improvementPlan.id,
          goalsCreated: generatedGoals.shortTerm.length + generatedGoals.mediumTerm.length,
          pathsCreated: generatedGoals.shortTerm.length + generatedGoals.mediumTerm.length,
          estimatedTimeMonths: improvementPlan.metadata.estimatedTimeMonths
        }
      })

      log('[AbilityAssessmentService] Intelligent improvement plan generated successfully')
      return improvementPlan

    } catch (err) {
      error('[AbilityAssessmentService] Failed to generate intelligent improvement plan:', err)
      throw err
    }
  }

  /**
   * 分析技能差距
   */
  private async analyzeSkillGaps(assessment: AbilityAssessment): Promise<{
    skillGaps: SkillGapData[]
    topPriorities: string[]
    overallStrategy: string
  }> {
    const skillGaps: SkillGapData[] = []
    
    // 遍历所有维度和技能
    Object.entries(assessment.dimensions).forEach(([dimensionName, dimension]) => {
      Object.entries(dimension.skills).forEach(([skillName, skillData]) => {
        const currentScore = getSkillScoreValue(skillData)
        const targetScore = Math.min(currentScore + 20, 85) // 目标提升20分，最高85分
        const gap = targetScore - currentScore
        
        if (gap > 5) { // 只关注有显著提升空间的技能
          const priority = this.calculateSkillPriority(currentScore, dimension.weight, skillName)
          skillGaps.push({
            skillName: `${dimensionName}.${skillName}`,
            currentScore,
            targetScore,
            gap,
            priority,
            estimatedWeeks: Math.ceil(gap / 5) // 假设每周能提升5分
          })
        }
      })
    })

    // 按优先级排序
    skillGaps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const topPriorities = skillGaps
      .filter(gap => gap.priority === 'high')
      .slice(0, 5)
      .map(gap => gap.skillName)

    return {
      skillGaps,
      topPriorities,
      overallStrategy: this.determineOverallStrategy(assessment.overallScore, topPriorities)
    }
  }

  /**
   * 计算技能优先级
   */
  private calculateSkillPriority(currentScore: number, dimensionWeight: number, skillName: string): 'high' | 'medium' | 'low' {
    // 低分且权重高的技能优先级最高
    const urgencyScore = (100 - currentScore) * dimensionWeight
    
    // 特定技能的额外权重
    const skillImportance = this.getSkillImportance(skillName)
    const finalScore = urgencyScore * skillImportance
    
    if (finalScore > 15) return 'high'
    if (finalScore > 8) return 'medium'
    return 'low'
  }

  /**
   * 获取技能重要性权重
   */
  private getSkillImportance(skillName: string): number {
    const importanceMap: Record<string, number> = {
      // 编程基础技能
      'syntax': 1.5,
      'dataStructures': 1.8,
      'errorHandling': 1.3,
      'codeQuality': 1.4,
      'tooling': 1.2,
      
      // 算法核心技能
      'recursion': 1.6,
      'dynamicProgramming': 1.7,
      'tree': 1.5,
      'sorting': 1.3,
      
      // 项目关键技能
      'planning': 1.4,
      'architecture': 1.7,
      'implementation': 1.8,
      'testing': 1.5,
      
      // 系统设计重要技能
      'scalability': 1.6,
      'performance': 1.5,
      'security': 1.4,
      
      // 沟通协作基础技能
      'teamCollaboration': 1.3,
      'codeReview': 1.2
    }
    
    return importanceMap[skillName] || 1.0
  }

  /**
   * 确定整体学习策略
   */
  private determineOverallStrategy(overallScore: number, topPriorities: string[]): string {
    if (overallScore < 30) {
      return 'foundation_building' // 基础建设
    } else if (overallScore < 60) {
      return 'skill_strengthening' // 技能强化
    } else if (overallScore < 80) {
      return 'advanced_development' // 进阶发展
    } else {
      return 'specialization' // 专业化
    }
  }

  /**
   * 生成AI策略
   */
  private async generateAIStrategy(assessment: AbilityAssessment, skillGapAnalysis: any): Promise<any> {
    // 根据实际评分确定用户等级和策略方向
    const currentLevel = getScoreLevel(assessment.overallScore)
    const scoreLevel = assessment.overallScore
    
    // 根据评分等级确定开发者级别描述
    let developerLevelDescription = ''
    if (scoreLevel >= 80) {
      developerLevelDescription = '**高级/专家级开发者**'
    } else if (scoreLevel >= 60) {
      developerLevelDescription = '**中级开发者**'
    } else if (scoreLevel >= 40) {
      developerLevelDescription = '**初级开发者**'
    } else {
      developerLevelDescription = '**入门级开发者**'
    }

    // 根据评分等级调整策略重点
    let strategyFocus = ''
    let expectedNodeCount = 0
    let difficultyLevel = 2
    let advancedTopics: string[] = []
    let learningApproach = ''
    
    if (scoreLevel >= 80) {
      strategyFocus = '高级进阶和专业化：重点提升架构设计、系统优化、团队协作等高级能力'
      expectedNodeCount = 12 // 3个月，每周1个节点
      difficultyLevel = 4
      advancedTopics = [
        '微服务架构设计与实现',
        '分布式系统原理与实践',
        '高并发系统性能优化',
        '领域驱动设计（DDD）',
        '技术团队管理与技术决策',
        '代码重构与架构演进',
        'DevOps实践与CI/CD优化',
        '安全架构设计',
        '大数据处理与分析',
        '云原生技术栈'
      ]
      learningApproach = '项目驱动学习，结合实际架构设计和技术决策，强调技术深度和广度的结合'
    } else if (scoreLevel >= 60) {
      strategyFocus = '中级提升和深化：加强项目实战、算法优化、代码质量等中级技能'
      expectedNodeCount = 16 // 4个月，每周1个节点
      difficultyLevel = 3
      advancedTopics = [
        '设计模式应用实践',
        '数据库优化与设计',
        'RESTful API设计',
        '前端框架深入理解',
        '测试驱动开发（TDD）',
        '持续集成实践'
      ]
      learningApproach = '理论与实践并重，通过中等复杂度项目提升技能深度'
    } else if (scoreLevel >= 40) {
      strategyFocus = '基础巩固和技能扩展：强化编程基础、数据结构、基本算法等核心技能'
      expectedNodeCount = 20 // 5个月，每周1个节点
      difficultyLevel = 2
      advancedTopics = [
        '面向对象编程深入',
        '数据结构与算法基础',
        'Web开发基础',
        '数据库基础操作'
      ]
      learningApproach = '系统性基础学习，重点掌握核心概念和基本技能'
    } else {
      strategyFocus = '入门基础建设：从编程语法、基本概念开始系统学习'
      expectedNodeCount = 24 // 6个月，每周1个节点
      difficultyLevel = 1
      advancedTopics = [
        '编程语言基础语法',
        '基本算法思维',
        '简单项目实践'
      ]
      learningApproach = '渐进式学习，从基础概念开始逐步建立编程思维'
    }

    const prompt = `⚠️ **关键要求**：用户评分 ${scoreLevel} 分，属于${developerLevelDescription}，必须生成对应难度的学习内容！

基于以下能力评估和技能差距分析，为一个 ${currentLevel} 级别（${scoreLevel}分）的${developerLevelDescription}生成专业的学习提升策略：

## 当前能力评估
- **总分：${assessment.overallScore}/100 （${currentLevel} 级别）**
- 评估置信度：${(assessment.metadata.confidence * 100).toFixed(0)}%
- 策略重点：${strategyFocus}
- **⚠️ 重要提醒**：用户当前评分为 ${scoreLevel} 分，属于 ${currentLevel} 水平，请确保生成的学习计划与此水平匹配

## 各维度评分
${Object.entries(assessment.dimensions).map(([dim, data]) => 
  `- ${dim}: ${data.score}/100 (权重: ${data.weight})`
).join('\n')}

## 技能差距分析
优先提升技能：
${skillGapAnalysis.topPriorities.slice(0, 5).map((skill: string, index: number) => 
  `${index + 1}. ${skill}`
).join('\n')}

## 优势和薄弱项
优势：${assessment.report.strengths.join(', ')}
待改进：${assessment.report.improvements.join(', ')}

${scoreLevel >= 80 ? `
## 🚨 高级开发者专项要求 - 严格执行！
⚠️ **特别注意**：用户评分为 ${scoreLevel} 分，属于高级/专家水平，**必须生成高级难度的学习内容**！

### 🛑 严格禁止的内容
- **禁止任何基础语法、入门概念的内容**
- **禁止"学习变量、函数"等初级内容** 
- **禁止"基础数据结构"等新手内容**
- **禁止任何适合初学者的学习内容**

### ✅ 必须包含的高级主题
作为${scoreLevel}分的高级开发者，学习计划必须包含：
${advancedTopics.map(topic => `- ${topic}`).join('\n')}

### 🎯 高级学习要求（必须严格遵守）
1. **技术深度**：每个节点必须涉及技术的深层原理、源码分析、最佳实践
2. **架构思维**：必须强调系统性思考、架构设计、技术选型能力
3. **技术领导力**：必须包含团队协作、技术决策、Code Review、技术分享
4. **实战项目**：必须包含复杂的、生产级别的项目实践，不是玩具项目
5. **技术前瞻性**：必须关注新技术趋势、行业最佳实践、开源贡献

### 📚 节点复杂度要求（强制标准）
- **每个节点至少12-20小时学习时间**
- **难度等级必须在4-5之间**
- **必须包含：理论研究→架构设计→代码实现→性能优化→团队分享**
- **必须有明确的技术产出：开源项目、技术博客、架构文档等**
- **🚨 绝对禁止生成任何基础入门内容**

### 🏗️ 高级项目要求
- **微服务架构设计与实现**
- **分布式系统设计**
- **高并发性能优化**
- **技术团队管理实践**
- **开源项目贡献**
- **技术方案设计与评审**

**⚠️ 特别提醒**：如果生成的内容包含任何适合初级或中级开发者的内容，将被视为错误！
` : scoreLevel >= 60 ? `
## 中级开发者专项要求
用户评分为 ${scoreLevel} 分，属于中级水平，应生成中级难度的学习内容：

**中级学习要求**：
1. **技能深化**：在现有基础上深化技能理解
2. **项目实战**：包含中等复杂度的实际项目
3. **最佳实践**：学习行业标准和最佳实践
4. **系统思维**：开始培养系统性思考能力

**节点复杂度要求**：
- 每个节点8-12小时学习时间
- 理论与实践并重
- 避免过于基础的内容，重点提升现有技能
` : scoreLevel >= 40 ? `
## 初级开发者专项要求
用户评分为 ${scoreLevel} 分，属于初级水平，应生成适合初级开发者的学习内容：

**初级学习要求**：
1. **基础巩固**：强化编程基础和核心概念
2. **循序渐进**：从简单到复杂的学习路径
3. **实践导向**：通过实际练习巩固理论知识

**节点复杂度要求**：
- 每个节点6-10小时学习时间
- 重点补强基础技能
` : `
## 入门级开发者专项要求
用户评分为 ${scoreLevel} 分，属于入门水平，应生成适合新手的学习内容：

**入门学习要求**：
1. **基础建设**：从编程语法和基本概念开始
2. **渐进学习**：小步快跑，逐步建立信心
3. **实践为主**：通过大量练习掌握基础技能

**节点复杂度要求**：
- 每个节点4-8小时学习时间
- 重点建立编程基础
`}

**🎯 核心要求总结**：
1. **节点数量要求**：每个学习路径应包含 ${Math.ceil(expectedNodeCount/2)} 个学习节点（平均每周1个节点）
2. **难度适配**：节点难度必须在 ${difficultyLevel}-${difficultyLevel+1} 之间，严格匹配${currentLevel}水平
3. **时间规划**：每个节点${scoreLevel >= 80 ? '12-20' : '8-12'}小时学习时间，符合周度学习节奏
4. **学习方法**：${learningApproach}

${scoreLevel >= 80 ? `
🚨 **对于${scoreLevel}分的高级开发者，再次强调**：
- 短期目标必须聚焦于技术深度突破（如特定架构模式的深入研究）
- 中期目标必须体现系统性提升（如完整的微服务架构设计与实现）
- 每个节点都必须包含技术调研、架构设计、代码实现、性能优化等多个层面
- 必须包含开源贡献、技术分享、团队指导等技术领导力内容
- **绝对不能出现"学习基础语法"、"掌握数据结构"等初级内容**
` : ''}

请生成一个结构化的学习策略，包括：

1. **短期目标 (1个月)**: ${scoreLevel >= 80 ? '1个高挑战性架构级目标' : '1-2个具体目标'}，每个目标包含${scoreLevel >= 80 ? '6-8' : '4-5'}个学习节点
2. **中期目标 (3个月)**: ${scoreLevel >= 80 ? '1个企业级复合目标' : '1-2个具体目标'}，每个目标包含${scoreLevel >= 80 ? '10-15' : '8-12'}个学习节点  
3. **学习策略**: 推荐的学习方法和时间分配
4. **关键里程碑**: 3-4个重要的检查点
5. **优先级矩阵**: 各技能的影响度、难度、紧急度评分

请用JSON格式返回，严格按照以下结构：

\`\`\`json
{
  "targetImprovement": ${Math.min(20, 95 - scoreLevel)},
  "estimatedTimeMonths": ${Math.ceil(expectedNodeCount/4)},
  "planType": "${scoreLevel >= 80 ? 'advanced_specialization' : scoreLevel >= 60 ? 'intermediate_enhancement' : scoreLevel >= 40 ? 'foundation_strengthening' : 'basic_building'}",
  "strategy": {
    "focusAreas": [${scoreLevel >= 80 ? '"架构设计与系统优化", "技术领导力与团队协作", "前沿技术研究与应用"' : '"针对' + currentLevel + '级别的具体领域1", "针对' + currentLevel + '级别的具体领域2", "针对' + currentLevel + '级别的具体领域3"'}],
    "learningApproach": "${learningApproach}",
    "timeAllocation": "每周${scoreLevel >= 80 ? '10-15' : '8-12'}小时的时间分配建议",
    "milestones": [
      {
        "id": "milestone_1",
        "title": "里程碑标题",
        "description": "详细描述",
        "targetDate": "2024-02-01",
        "associatedSkills": ["技能1", "技能2"],
        "successCriteria": ["成功标准1", "成功标准2"]
      }
    ]
  },
  "shortTermGoals": [
    {
      "title": "${scoreLevel >= 80 ? '分布式架构深度优化专项' : scoreLevel >= 60 ? '中级技能深化提升' : scoreLevel >= 40 ? '基础技能强化训练' : '编程入门基础建设'}",
      "description": "${scoreLevel >= 80 ? '深入研究微服务治理、服务网格架构，设计高可用分布式系统，完成生产级性能优化' : scoreLevel >= 60 ? '在现有技能基础上进行深化学习和实践' : scoreLevel >= 40 ? '巩固编程基础，提升核心技能水平' : '从编程语法开始，建立扎实的基础'}",
      "category": "${scoreLevel >= 80 ? 'distributed_architecture' : scoreLevel >= 60 ? 'advanced_development' : scoreLevel >= 40 ? 'skill_building' : 'foundation'}",
      "priority": 5,
      "targetLevel": "${currentLevel === 'expert' ? 'expert' : currentLevel === 'advanced' ? 'advanced' : currentLevel === 'intermediate' ? 'intermediate' : 'beginner'}",
      "estimatedTimeWeeks": 4,
      "requiredSkills": [${scoreLevel >= 80 ? '"微服务架构", "服务网格", "性能调优", "分布式事务", "容器编排"' : scoreLevel >= 60 ? '"设计模式", "代码重构", "项目管理"' : scoreLevel >= 40 ? '"编程基础", "数据结构", "算法思维"' : '"编程语法", "基本概念", "简单练习"'}],
      "outcomes": [${scoreLevel >= 80 ? '"完成企业级分布式架构设计", "实现服务网格技术栈", "产出性能优化技术方案", "建立监控告警体系"' : scoreLevel >= 60 ? '"完成中等复杂度项目", "掌握设计模式应用", "提升代码质量"' : scoreLevel >= 40 ? '"掌握核心编程概念", "完成基础项目实践", "建立编程思维"' : '"熟悉编程语法", "完成简单练习", "建立学习习惯"'}],
      "pathStructure": {
        "title": "${scoreLevel >= 80 ? '分布式系统架构专家路径' : scoreLevel >= 60 ? '中级技能提升路径' : scoreLevel >= 40 ? '基础技能强化路径' : '编程入门学习路径'}",
        "description": "${scoreLevel >= 80 ? '从分布式理论到生产级实现的系统性架构能力培养' : scoreLevel >= 60 ? '在现有基础上深化技能理解和应用' : scoreLevel >= 40 ? '巩固编程基础，建立扎实的技能根基' : '从零开始的编程学习之旅'}",
        "nodes": [
          {
            "title": "${scoreLevel >= 80 ? '服务网格架构设计与实现' : scoreLevel >= 60 ? '设计模式深入理解' : scoreLevel >= 40 ? '数据结构基础' : '编程语言基础语法'}",
            "description": "${scoreLevel >= 80 ? '深入研究Istio、Linkerd等服务网格技术，设计企业级服务治理方案，实现灰度发布、流量管理、安全策略' : scoreLevel >= 60 ? '学习常用设计模式的原理和应用场景' : scoreLevel >= 40 ? '掌握数组、链表、栈、队列等基础数据结构' : '学习变量、函数、控制结构等基本语法'}",
            "type": "${scoreLevel >= 80 ? 'architecture' : scoreLevel >= 60 ? 'concept' : scoreLevel >= 40 ? 'practice' : 'tutorial'}",
            "difficulty": ${scoreLevel >= 80 ? 5 : difficultyLevel},
            "estimatedHours": ${scoreLevel >= 80 ? 20 : scoreLevel >= 60 ? 10 : scoreLevel >= 40 ? 8 : 6},
            "skills": [${scoreLevel >= 80 ? '"服务网格", "Istio", "微服务治理", "云原生架构"' : scoreLevel >= 60 ? '"设计模式", "代码设计"' : scoreLevel >= 40 ? '"数据结构", "算法基础"' : '"编程语法", "基础概念"'}],
            "prerequisites": [${scoreLevel >= 80 ? '"Kubernetes熟练使用", "Docker容器技术", "云原生基础"' : ''}],
            "order": 1
          },
          ${scoreLevel >= 80 ? `{
            "title": "分布式事务与数据一致性",
            "description": "深入理解CAP定理、BASE理论，掌握Saga、TCC等分布式事务模式，实现最终一致性方案",
            "type": "theory_practice",
            "difficulty": 5,
            "estimatedHours": 18,
            "skills": ["分布式事务", "数据一致性", "Saga模式", "TCC模式"],
            "prerequisites": ["分布式系统基础"],
            "order": 2
          },
          {
            "title": "高并发系统性能优化",
            "description": "JVM调优、缓存架构设计、数据库优化、CDN配置，解决实际生产环境性能瓶颈",
            "type": "performance_optimization",
            "difficulty": 5,
            "estimatedHours": 22,
            "skills": ["JVM调优", "Redis集群", "数据库优化", "性能监控"],
            "prerequisites": ["分布式架构基础"],
            "order": 3
          },
          {
            "title": "云原生DevOps实践",
            "description": "构建企业级CI/CD流水线，实现自动化部署、监控告警、故障自愈，掌握GitOps工作流",
            "type": "devops_practice",
            "difficulty": 4,
            "estimatedHours": 16,
            "skills": ["Kubernetes", "GitOps", "Prometheus", "Grafana"],
            "prerequisites": ["容器技术"],
            "order": 4
          }` : `{
            "title": "placeholder_node_2",
            "description": "placeholder_description",
            "type": "concept",
            "difficulty": ${difficultyLevel},
            "estimatedHours": 8,
            "skills": ["placeholder_skill"],
            "prerequisites": [],
            "order": 2
          }`}
          // ... ${scoreLevel >= 80 ? '继续添加更多高级节点' : '根据用户水平添加适当节点'}
        ]
      }
    }
  ],
  "mediumTermGoals": [
    {
      "title": "${scoreLevel >= 80 ? '企业级技术架构设计与落地实施' : scoreLevel >= 60 ? '完整项目开发实践' : scoreLevel >= 40 ? '综合项目能力提升' : '基础项目实践'}",
      "description": "${scoreLevel >= 80 ? '设计并实现完整的企业级技术架构，包含高可用、高并发、高扩展性设计，负责技术选型、架构演进、团队技术培养' : scoreLevel >= 60 ? '独立完成一个具有一定复杂度的完整项目' : scoreLevel >= 40 ? '通过项目实践巩固所学技能，提升综合能力' : '通过简单项目练习，巩固基础知识'}",
      "category": "${scoreLevel >= 80 ? 'enterprise_architecture' : scoreLevel >= 60 ? 'project_development' : scoreLevel >= 40 ? 'skill_application' : 'basic_practice'}", 
      "priority": 4,
      "targetLevel": "${currentLevel === 'expert' ? 'expert' : currentLevel === 'advanced' ? 'advanced' : currentLevel === 'intermediate' ? 'intermediate' : 'beginner'}",
      "estimatedTimeWeeks": 12,
      "requiredSkills": [${scoreLevel >= 80 ? '"企业架构设计", "技术团队管理", "架构治理", "技术决策", "开源贡献"' : scoreLevel >= 60 ? '"项目管理", "系统设计", "测试开发", "部署运维"' : scoreLevel >= 40 ? '"项目规划", "代码组织", "基础测试", "简单部署"' : '"基础编程", "简单逻辑", "代码调试"'}],
      "outcomes": [${scoreLevel >= 80 ? '"完成企业级架构系统实现", "建立技术团队最佳实践", "产出架构设计规范文档", "实现技术债务治理", "贡献开源技术项目"' : scoreLevel >= 60 ? '"完整项目交付", "技术文档编写", "代码质量提升", "团队协作经验"' : scoreLevel >= 40 ? '"项目功能实现", "代码规范改善", "问题解决能力提升"' : '"基础项目完成", "编程信心建立", "学习方法掌握"'}],
      "pathStructure": {
        "title": "${scoreLevel >= 80 ? '企业级架构师成长路径' : scoreLevel >= 60 ? '完整项目开发路径' : scoreLevel >= 40 ? '项目实践提升路径' : '基础项目练习路径'}",
        "description": "${scoreLevel >= 80 ? '从技术专家到架构师的全方位能力提升，涵盖技术、管理、决策等多个维度' : scoreLevel >= 60 ? '从需求分析到项目上线的完整开发流程' : scoreLevel >= 40 ? '通过项目实践提升编程和解决问题的能力' : '通过简单项目巩固基础编程技能'}", 
        "nodes": [
          {
            "title": "${scoreLevel >= 80 ? '企业级架构设计方法论' : scoreLevel >= 60 ? '项目需求分析与设计' : scoreLevel >= 40 ? '项目规划与设计' : '项目需求理解'}",
            "description": "${scoreLevel >= 80 ? '掌握TOGAF、Zachman等企业架构框架，建立架构设计方法论，进行技术选型和架构决策' : scoreLevel >= 60 ? '需求分析、系统设计、技术选型' : scoreLevel >= 40 ? '理解项目需求，设计基本架构' : '理解项目要求，制定简单计划'}",
            "type": "${scoreLevel >= 80 ? 'enterprise_architecture' : 'project'}",
            "difficulty": ${scoreLevel >= 80 ? 5 : difficultyLevel + 1},
            "estimatedHours": ${scoreLevel >= 80 ? 25 : scoreLevel >= 60 ? 12 : scoreLevel >= 40 ? 10 : 8},
            "skills": [${scoreLevel >= 80 ? '"TOGAF框架", "架构设计", "技术选型", "架构治理"' : scoreLevel >= 60 ? '"需求分析", "系统设计"' : scoreLevel >= 40 ? '"项目规划", "基础设计"' : '"需求理解", "简单规划"'}],
            "prerequisites": [${scoreLevel >= 80 ? '"分布式系统架构", "微服务实践经验"' : scoreLevel >= 60 ? '"设计模式基础"' : scoreLevel >= 40 ? '"编程基础"' : '"语法基础"'}],
            "order": 1
          }
          // ... ${scoreLevel >= 80 ? '必须包含10-15个企业级节点' : scoreLevel >= 60 ? '必须包含8-12个节点' : scoreLevel >= 40 ? '必须包含6-10个节点' : '必须包含4-8个节点'}
        ]
      }
    }
  ],
  "timeline": [
    {
      "date": "2024-01-15",
      "milestone": "里程碑名称",
      "description": "详细描述",
      "type": "goal"
    }
  ],
  "priorityMatrix": [
    {
      "skill": "技能名称",
      "impact": 4,
      "difficulty": 3,
      "urgency": 5,
      "priority": 4
    }
  ]
}
\`\`\``

    const aiResponse = await callAI(prompt)
    return this.parseAIStrategyResponse(aiResponse)
  }

  /**
   * 解析AI策略响应
   */
  private parseAIStrategyResponse(aiResponse: string): any {
    log('[parseAIStrategyResponse] Starting strategy response parsing')
    
    try {
      // 使用与parseAIResponse相同的强健解析逻辑
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
      let rawJson = ''
      
      if (!jsonMatch) {
        log('[parseAIStrategyResponse] Standard JSON format not found, trying alternative formats')
        
        // 尝试其他格式的 JSON 提取
        const altJsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                            aiResponse.match(/```\s*\{[\s\S]*?\}\s*```/) ||
                            aiResponse.match(/\{[\s\S]*\}/)
        
        if (altJsonMatch) {
          log('[parseAIStrategyResponse] Found JSON in alternative format')
          rawJson = altJsonMatch[1] || altJsonMatch[0]
        } else {
          error('[parseAIStrategyResponse] No valid JSON format found in AI response')
          throw new Error('Invalid AI response format - no JSON found')
        }
      } else {
        log('[parseAIStrategyResponse] Using standard JSON format')
        rawJson = jsonMatch[1]
      }
      
      // 清理JSON
      const cleanJson = cleanupJSONString(rawJson.trim())
      
      // 解析JSON
      const strategy = JSON.parse(cleanJson)
      log('[parseAIStrategyResponse] JSON parsing successful')
      
      // 验证必需字段
      if (!strategy.shortTermGoals || !Array.isArray(strategy.shortTermGoals)) {
        error('[parseAIStrategyResponse] Missing or invalid shortTermGoals field')
        throw new Error('Missing required shortTermGoals in AI response')
      }
      
      if (!strategy.mediumTermGoals || !Array.isArray(strategy.mediumTermGoals)) {
        error('[parseAIStrategyResponse] Missing or invalid mediumTermGoals field')
        throw new Error('Missing required mediumTermGoals in AI response')
      }
      
      log('[parseAIStrategyResponse] Strategy validation successful')
      
      return strategy
      
    } catch (err) {
      error('[parseAIStrategyResponse] Failed to parse AI strategy response:', err)
      
      // 提供更详细的错误信息
      if (err instanceof SyntaxError) {
        log('[parseAIStrategyResponse] JSON syntax error. Attempting to provide fallback structure...')
        
        // 尝试提供一个最小的可用结构
        return {
          targetImprovement: 15,
          estimatedTimeMonths: 3,
          planType: 'comprehensive',
          strategy: {
            focusAreas: ['基础技能提升'],
            learningApproach: '系统性学习，注重实践',
            timeAllocation: '每天1-2小时学习',
            milestones: []
          },
          shortTermGoals: [{
            title: '基础技能提升',
            description: '专注于基础编程技能的提升',
            category: 'programming',
            priority: 5,
            targetLevel: 'intermediate',
            estimatedTimeWeeks: 4,
            requiredSkills: ['基础语法', '数据结构'],
            outcomes: ['提升编程基础能力'],
            pathStructure: {
              title: '基础编程学习路径',
              description: '系统学习编程基础',
              nodes: [{
                title: '基础语法学习',
                description: '掌握编程语言基础语法',
                type: 'theory',
                difficulty: 2,
                estimatedHours: 8,
                skills: ['基础语法'],
                prerequisites: [],
                order: 1
              }]
            }
          }],
          mediumTermGoals: [{
            title: '项目实践能力',
            description: '通过项目实践提升综合能力',
            category: 'project',
            priority: 4,
            targetLevel: 'advanced',
            estimatedTimeWeeks: 8,
            requiredSkills: ['项目管理', '系统设计'],
            outcomes: ['完成实际项目开发'],
            pathStructure: {
              title: '项目实践路径',
              description: '通过实际项目提升能力',
              nodes: [{
                title: '项目规划',
                description: '学习项目规划和管理',
                type: 'project',
                difficulty: 3,
                estimatedHours: 16,
                skills: ['项目管理'],
                prerequisites: ['基础语法'],
                order: 1
              }]
            }
          }],
          timeline: [],
          priorityMatrix: []
        }
      }
      
      throw new Error('Failed to parse AI strategy response')
    }
  }

  /**
   * 使用Function Calling系统创建目标和路径
   */
  private async createGoalsAndPaths(aiStrategy: any): Promise<{
    shortTerm: GeneratedGoal[]
    mediumTerm: GeneratedGoal[]
  }> {
    const result = {
      shortTerm: [] as GeneratedGoal[],
      mediumTerm: [] as GeneratedGoal[]
    }

    try {
      // 创建短期目标和路径
      for (const goalData of aiStrategy.shortTermGoals) {
        const goal = await this.createSingleGoalAndPath(goalData, 'short')
        result.shortTerm.push(goal)
      }

      // 创建中期目标和路径
      for (const goalData of aiStrategy.mediumTermGoals) {
        const goal = await this.createSingleGoalAndPath(goalData, 'medium')
        result.mediumTerm.push(goal)
      }

      log(`[AbilityAssessmentService] Created ${result.shortTerm.length} short-term and ${result.mediumTerm.length} medium-term goals`)
      return result

    } catch (err) {
      error('[AbilityAssessmentService] Failed to create goals and paths:', err)
      throw err
    }
  }

  /**
   * 创建单个目标和路径
   */
  private async createSingleGoalAndPath(goalData: any, duration: 'short' | 'medium'): Promise<GeneratedGoal> {
    try {
      // 1. 使用Agent工具创建学习目标
      const createdGoal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        targetLevel: goalData.targetLevel,
        estimatedTimeWeeks: goalData.estimatedTimeWeeks,
        requiredSkills: goalData.requiredSkills,
        outcomes: goalData.outcomes
      })

      log(`[AbilityAssessmentService] Created goal: ${createdGoal.id}`)

      // 2. 为目标创建学习路径并自动关联 - 使用正确的关联工具
      const pathNodes = goalData.pathStructure.nodes.map((node: any, index: number) => ({
        ...node,
        id: `node_${Date.now()}_${index}`,
        status: 'not_started',
        progress: 0,
        courseUnitIds: []
      }))

      // 使用create_path_with_goal_link工具自动关联目标和路径
      const createdPath = await agentToolExecutor.executeTool('create_path_with_goal_link', {
        goalId: createdGoal.id,
        title: goalData.pathStructure.title,
        description: goalData.pathStructure.description,
        nodes: pathNodes
      })

      log(`[AbilityAssessmentService] Created and linked path: ${createdPath.path.id}`)

      // 3. 构建返回的目标对象
      return {
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        duration,
        priority: goalData.priority,
        targetLevel: goalData.targetLevel,
        estimatedTimeWeeks: goalData.estimatedTimeWeeks,
        requiredSkills: goalData.requiredSkills,
        outcomes: goalData.outcomes,
        associatedPath: {
          title: goalData.pathStructure.title,
          description: goalData.pathStructure.description,
          totalEstimatedHours: pathNodes.reduce((sum: number, node: any) => sum + (node.estimatedHours || 0), 0),
          nodes: pathNodes,
          milestones: []
        }
      }

    } catch (err) {
      error('[AbilityAssessmentService] Failed to create single goal and path:', err)
      throw err
    }
  }

  /**
   * 缓存提升计划
   */
  private cacheImprovementPlan(plan: ImprovementPlan, assessment: AbilityAssessment): void {
    const cacheKey = `improvementPlan_${assessment.metadata.assessmentDate}`
    setProfileData(cacheKey, {
      plan,
      assessmentHash: this.generateAssessmentHash(assessment),
      cacheTime: new Date().toISOString()
    })
  }

  /**
   * 获取缓存的提升计划
   */
  private getCachedImprovementPlan(assessment: AbilityAssessment): ImprovementPlan | null {
    const cacheKey = `improvementPlan_${assessment.metadata.assessmentDate}`
    const cached = getProfileData(cacheKey)
    
    if (!cached) return null
    
    // 检查评估是否有变化
    const currentHash = this.generateAssessmentHash(assessment)
    if (cached.assessmentHash !== currentHash) {
      return null
    }
    
    // 检查缓存是否过期（24小时）
    const cacheTime = new Date(cached.cacheTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      return null
    }
    
    return cached.plan
  }

  /**
   * 生成评估哈希用于缓存验证
   */
  private generateAssessmentHash(assessment: AbilityAssessment): string {
    const hashContent = {
      overallScore: assessment.overallScore,
      dimensions: Object.entries(assessment.dimensions).map(([key, dim]) => ({
        key,
        score: dim.score
      })),
      strengths: assessment.report.strengths.join(','),
      improvements: assessment.report.improvements.join(',')
    }
    
    return btoa(JSON.stringify(hashContent)).slice(0, 16)
  }

  /**
   * 清除提升计划缓存
   */
  clearImprovementPlanCache(): void {
    const assessment = this.getCurrentAssessment()
    if (assessment) {
      const cacheKey = `improvementPlan_${assessment.metadata.assessmentDate}`
      setProfileData(cacheKey, null)
      
      // 同时清除所有可能的缓存键
      const allKeys = Object.keys(localStorage).filter(key => key.includes('improvementPlan_'))
      allKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      log('[AbilityAssessmentService] Improvement plan cache cleared')
    }
  }
}

/**
 * 分析用户能力 - 支持简历和问卷两种方式
 * @deprecated 使用 AbilityAssessmentService.executeAssessment 替代
 */
export const analyzeAbility = async (input: AssessmentInput): Promise<AbilityAssessment> => {
  log('[abilityAssess] Starting ability analysis')
  
  try {
    // 生成评估内容
    const assessmentContent = input.type === 'resume' 
      ? input.content as string
      : JSON.stringify(input.content, null, 2)
    
    // 调用 AI 进行评估
    const prompt = generateAssessmentPrompt(assessmentContent, input.type)
    const result = await callAI(prompt)
    
    log('[abilityAssess] AI raw response (first 500 chars):', result.substring(0, 500))
    log('[abilityAssess] AI raw response (last 500 chars):', result.substring(Math.max(0, result.length - 500)))
    
    // 解析 AI 返回的 JSON 结果
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      // 尝试其他格式的 JSON 提取
      const altJsonMatch = result.match(/```json([\s\S]*?)```/) || 
                          result.match(/```\s*\{[\s\S]*?\}\s*```/) ||
                          result.match(/\{[\s\S]*\}/)
      
      if (altJsonMatch) {
        log('[abilityAssess] Found JSON in alternative format')
        try {
          const rawJson = altJsonMatch[1] || altJsonMatch[0]
          const cleanJson = cleanupJSONString(rawJson.trim())
          log('[abilityAssess] Attempting to parse JSON (length: ' + cleanJson.length + ')')
          
          const assessment: AbilityAssessment = JSON.parse(cleanJson)
          
          // 验证和修复数据结构
          const validatedAssessment = validateAndFixAssessment(assessment)
          
          // 计算并验证总分
          validatedAssessment.overallScore = calculateOverallScore(validatedAssessment)
          
          // 保存评估结果到本地存储
          await saveAssessment(validatedAssessment)
          
          // 记录活动
          addActivityRecord({
            type: 'assessment',
            action: '完成能力评估',
            details: {
              method: input.type,
              overallScore: validatedAssessment.overallScore,
              level: getScoreLevel(validatedAssessment.overallScore)
            }
          })
          
          log('[abilityAssess] Assessment completed successfully (alternative format)')
          return validatedAssessment
        } catch (parseError) {
          error('[abilityAssess] Failed to parse alternative JSON format:', parseError)
          
          // 显示 JSON 错误的具体位置
          if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
            const match = parseError.message.match(/position (\d+)/)
            if (match) {
              const position = parseInt(match[1])
              const rawJson = altJsonMatch[1] || altJsonMatch[0]
              const cleanJson = cleanupJSONString(rawJson.trim())
              const context = cleanJson.substring(Math.max(0, position - 100), position + 100)
              error('[abilityAssess] JSON error context around position ' + position + ':', context)
            }
          }
        }
      }
      
      // 如果所有格式都失败，提供更详细的错误信息
      error('[abilityAssess] AI response format analysis:', {
        hasJsonCodeBlock: result.includes('```json'),
        hasCodeBlock: result.includes('```'),
        hasJsonObject: result.includes('{'),
        contentLength: result.length,
        firstLine: result.split('\n')[0],
        lastLine: result.split('\n').slice(-1)[0]
      })
      
      throw new Error(`AI 返回格式错误，无法解析评估结果。返回内容开头: "${result.substring(0, 200)}..."`)
    }
    
    // 标准格式的 JSON 解析
    try {
      const rawJson = jsonMatch[1]
      const cleanJson = cleanupJSONString(rawJson)
      log('[abilityAssess] Attempting to parse standard JSON format (length: ' + cleanJson.length + ')')
      
      const assessment: AbilityAssessment = JSON.parse(cleanJson)
      
      // 验证和修复数据结构
      const validatedAssessment = validateAndFixAssessment(assessment)
      
      // 计算并验证总分
      validatedAssessment.overallScore = calculateOverallScore(validatedAssessment)
      
      // 保存评估结果到本地存储
      await saveAssessment(validatedAssessment)
      
      // 记录活动
      addActivityRecord({
        type: 'assessment',
        action: '完成能力评估',
        details: {
          method: input.type,
          overallScore: validatedAssessment.overallScore,
          level: getScoreLevel(validatedAssessment.overallScore)
        }
      })
      
      log('[abilityAssess] Assessment completed successfully')
      return validatedAssessment
      
    } catch (parseError) {
      error('[abilityAssess] Failed to parse standard JSON format:', parseError)
      
      // 显示 JSON 错误的具体位置
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const match = parseError.message.match(/position (\d+)/)
        if (match) {
          const position = parseInt(match[1])
          const rawJson = jsonMatch[1]
          const cleanJson = cleanupJSONString(rawJson)
          const context = cleanJson.substring(Math.max(0, position - 100), position + 100)
          error('[abilityAssess] JSON error context around position ' + position + ':', context)
        }
      }
      
      throw parseError
    }
    
  } catch (err) {
    error('[abilityAssess] Failed to analyze ability:', err)
    throw err
  }
}

/**
 * 计算总体评分
 */
const calculateOverallScore = (assessment: AbilityAssessment): number => {
  const { dimensions } = assessment
  
  // 计算各维度的维度总分（如果 AI 没有正确计算）
  Object.values(dimensions).forEach(dimension => {
    const skills = Object.values(dimension.skills)
    const scores = skills.map(skill => getSkillScoreValue(skill))
    dimension.score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  })
  
  // 计算加权总分
  const weightedSum = Object.values(dimensions).reduce((sum, dim) => {
    return sum + (dim.score * dim.weight)
  }, 0)
  
  return Math.round(weightedSum)
}

/**
 * 保存评估结果
 */
const saveAssessment = async (assessment: AbilityAssessment): Promise<void> => {
  // 保存当前评估
  setProfileData('abilityAssessment', assessment)
  
  // 保存到历史记录
  const history = getProfileData('assessmentHistory') || []
  history.push({
    date: assessment.metadata.assessmentDate,
    overallScore: assessment.overallScore,
    level: getScoreLevel(assessment.overallScore)
  })
  setProfileData('assessmentHistory', history)
}

/**
 * 获取当前用户的能力评估结果
 */
export const getCurrentAssessment = (): AbilityAssessment | null => {
  return getProfileData('abilityAssessment') || null
}

/**
 * 获取评估历史
 */
export const getAssessmentHistory = () => {
  return getProfileData('assessmentHistory') || []
}

/**
 * 生成能力提升建议
 */
export const generateImprovementPlan = async (assessment: AbilityAssessment): Promise<string> => {
  log('[abilityAssess] Generating improvement plan')
  
  const weakAreas = findWeakAreas(assessment)
  
  const prompt = `基于以下能力评估结果，生成具体的能力提升计划：

当前总分：${assessment.overallScore}
薄弱领域：${weakAreas.map(area => `${area.name}: ${area.score}分`).join(', ')}

评估报告：
${assessment.report.summary}

请生成一个具体可执行的 30 天提升计划，包括：
1. 每周学习目标
2. 推荐学习资源
3. 实践项目建议
4. 进度检查点`
  
  const result = await callAI(prompt)
  
  return result
}

/**
 * 找出薄弱领域（评分低于60的技能）
 */
const findWeakAreas = (assessment: AbilityAssessment) => {
  const weakAreas: { name: string; score: number }[] = []
  
  Object.entries(assessment.dimensions).forEach(([dimName, dimension]) => {
    Object.entries(dimension.skills).forEach(([skillName, skillData]) => {
      const score = getSkillScoreValue(skillData)
      if (score < 60) {
        weakAreas.push({
          name: `${dimName}.${skillName}`,
          score
        })
      }
    })
  })
  
  return weakAreas.sort((a, b) => a.score - b.score)
}

/**
 * 导出评估报告
 */
export const exportAssessmentReport = (assessment: AbilityAssessment): string => {
  const level = getScoreLevel(assessment.overallScore)
  
  // 获取技能名称的中文映射
  const skillNameMap: Record<string, string> = {
    syntax: '基础语法',
    dataStructures: '数据结构',
    errorHandling: '错误处理',
    codeQuality: '代码质量',
    tooling: '开发工具',
    stringProcessing: '字符串处理',
    recursion: '递归',
    dynamicProgramming: '动态规划',
    graph: '图算法',
    tree: '树算法',
    sorting: '排序算法',
    searching: '搜索算法',
    greedy: '贪心算法',
    planning: '项目规划',
    architecture: '架构设计',
    implementation: '实现能力',
    testing: '测试能力',
    deployment: '部署运维',
    documentation: '文档能力',
    scalability: '可扩展性',
    reliability: '可靠性',
    performance: '性能优化',
    security: '安全设计',
    databaseDesign: '数据库设计',
    codeReview: '代码评审',
    technicalWriting: '技术写作',
    teamCollaboration: '团队协作',
    mentoring: '指导他人',
    presentation: '演讲展示'
  }
  
  const formatSkillScore = (skill: string, skillData: SkillScore | number): string => {
    const score = getSkillScoreValue(skillData)
    const name = skillNameMap[skill] || skill
    if (typeof skillData === 'object' && skillData.isInferred) {
      return `- ${name}: ${score}分 *（基于整体信息推理）*`
    }
    return `- ${name}: ${score}分`
  }
  
  return `# 能力评估报告

## 基本信息
- 评估日期：${new Date(assessment.metadata.assessmentDate).toLocaleDateString('zh-CN')}
- 评估方式：${assessment.metadata.assessmentMethod === 'resume' ? '简历分析' : '问卷评估'}
- 置信度：${(assessment.metadata.confidence * 100).toFixed(0)}%

## 总体评分
- **总分：${assessment.overallScore}/100**
- **等级：${level}**

## 各维度评分

### 1. 编程基本功 (${assessment.dimensions.programming.score}分)
${Object.entries(assessment.dimensions.programming.skills)
  .map(([skill, skillData]) => formatSkillScore(skill, skillData))
  .join('\n')}

### 2. 算法能力 (${assessment.dimensions.algorithm.score}分)
${Object.entries(assessment.dimensions.algorithm.skills)
  .map(([skill, skillData]) => formatSkillScore(skill, skillData))
  .join('\n')}

### 3. 项目能力 (${assessment.dimensions.project.score}分)
${Object.entries(assessment.dimensions.project.skills)
  .map(([skill, skillData]) => formatSkillScore(skill, skillData))
  .join('\n')}

### 4. 系统设计 (${assessment.dimensions.systemDesign.score}分)
${Object.entries(assessment.dimensions.systemDesign.skills)
  .map(([skill, skillData]) => formatSkillScore(skill, skillData))
  .join('\n')}

### 5. 沟通协作 (${assessment.dimensions.communication.score}分)
${Object.entries(assessment.dimensions.communication.skills)
  .map(([skill, skillData]) => formatSkillScore(skill, skillData))
  .join('\n')}

## 评估总结
${assessment.report.summary}

## 优势领域
${assessment.report.strengths.map(s => `- ${s}`).join('\n')}

## 待改进项
${assessment.report.improvements.map(i => `- ${i}`).join('\n')}

## 发展建议
${assessment.report.recommendations.map(r => `- ${r}`).join('\n')}

---
*注：标有"基于整体信息推理"的分数是 AI 根据您的整体背景推测得出，可能与实际情况有偏差。*
`
} 