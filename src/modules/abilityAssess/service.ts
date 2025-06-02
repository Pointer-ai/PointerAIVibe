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

    const prompt = `基于以下能力评估和技能差距分析，为一个 ${currentLevel} 级别（${scoreLevel}分）的**高级开发者**生成专业的学习提升策略：

## 当前能力评估
- 总分：${assessment.overallScore}/100 （${currentLevel} 级别）
- 评估置信度：${(assessment.metadata.confidence * 100).toFixed(0)}%
- 策略重点：${strategyFocus}

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
## 高级开发者专项要求
作为高级开发者（${scoreLevel}分），学习计划应该包含以下高级主题：
${advancedTopics.map(topic => `- ${topic}`).join('\n')}

**高级学习要求**：
1. **技术深度**：每个节点应涉及技术的深层原理和最佳实践
2. **架构思维**：强调系统性思考和架构设计能力
3. **技术领导力**：包含团队协作、技术决策、Code Review等内容
4. **实战项目**：应包含复杂的、生产级别的项目实践
5. **技术前瞻性**：关注新技术趋势和行业最佳实践

**节点复杂度要求**：
- 每个节点至少10-15小时学习时间
- 包含理论学习、实践项目、深度思考等多个环节
- 应有明确的技术产出和成果验证
` : ''}

**重要要求**：
1. **节点数量要求**：每个学习路径应包含 ${Math.ceil(expectedNodeCount/2)} 个学习节点（平均每周1个节点）
2. **难度适配**：节点难度应在 ${difficultyLevel}-${difficultyLevel+1} 之间，匹配${currentLevel}水平
3. **时间规划**：每个节点${scoreLevel >= 80 ? '10-15' : '8-12'}小时学习时间，符合周度学习节奏
4. **学习方法**：${learningApproach}

请生成一个结构化的学习策略，包括：

1. **短期目标 (1个月)**: ${scoreLevel >= 80 ? '1个高挑战性目标' : '1-2个具体目标'}，每个目标包含${scoreLevel >= 80 ? '6-8' : '4-5'}个学习节点
2. **中期目标 (3个月)**: ${scoreLevel >= 80 ? '1个架构级别的复合目标' : '1-2个具体目标'}，每个目标包含${scoreLevel >= 80 ? '10-15' : '8-12'}个学习节点  
3. **学习策略**: 推荐的学习方法和时间分配
4. **关键里程碑**: 3-4个重要的检查点
5. **优先级矩阵**: 各技能的影响度、难度、紧急度评分

${scoreLevel >= 80 ? `
**高级开发者特别注意**：
- 短期目标应聚焦于技术深度突破（如特定架构模式的深入研究）
- 中期目标应体现系统性提升（如完整的微服务架构设计与实现）
- 每个节点都应包含技术调研、架构设计、代码实现、性能优化等多个层面
- 应包含开源贡献、技术分享、团队指导等技术领导力内容
` : ''}

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
      "title": "${scoreLevel >= 80 ? '高级架构设计专项突破' : '短期目标标题'}",
      "description": "${scoreLevel >= 80 ? '深入研究特定架构模式，完成生产级架构设计项目' : '详细描述'}",
      "category": "${scoreLevel >= 80 ? 'architecture' : 'frontend'}",
      "priority": 5,
      "targetLevel": "${currentLevel === 'expert' ? 'expert' : currentLevel === 'advanced' ? 'advanced' : 'intermediate'}",
      "estimatedTimeWeeks": 4,
      "requiredSkills": [${scoreLevel >= 80 ? '"系统架构设计", "性能优化", "技术选型"' : '"技能1", "技能2"'}],
      "outcomes": [${scoreLevel >= 80 ? '"完成复杂系统架构设计", "产出技术方案文档", "实现性能优化方案"' : '"预期成果1", "预期成果2"'}],
      "pathStructure": {
        "title": "${scoreLevel >= 80 ? '高级系统架构设计路径' : '学习路径标题'}",
        "description": "${scoreLevel >= 80 ? '从架构原理到实践落地的系统性学习' : '路径描述'}",
        "nodes": [
          {
            "title": "${scoreLevel >= 80 ? '分布式系统架构原理' : '节点标题'}",
            "description": "${scoreLevel >= 80 ? '深入理解CAP理论、一致性协议、分布式事务等核心概念' : '节点描述'}",
            "type": "${scoreLevel >= 80 ? 'theory' : 'theory'}",
            "difficulty": ${difficultyLevel},
            "estimatedHours": ${scoreLevel >= 80 ? 12 : 10},
            "skills": [${scoreLevel >= 80 ? '"分布式系统", "架构设计"' : '"相关技能"'}],
            "prerequisites": [],
            "order": 1
          }
          // ... 必须包含${scoreLevel >= 80 ? '6-8' : '4-5'}个节点
        ]
      }
    }
  ],
  "mediumTermGoals": [
    {
      "title": "${scoreLevel >= 80 ? '微服务架构实战项目' : '中期目标标题'}",
      "description": "${scoreLevel >= 80 ? '设计并实现完整的微服务架构系统，包含服务治理、监控、容灾等' : '详细描述'}",
      "category": "${scoreLevel >= 80 ? 'system_architecture' : 'fullstack'}", 
      "priority": 4,
      "targetLevel": "${currentLevel === 'expert' ? 'expert' : 'advanced'}",
      "estimatedTimeWeeks": 12,
      "requiredSkills": [${scoreLevel >= 80 ? '"微服务架构", "容器化技术", "服务治理", "监控体系"' : '"技能1", "技能2"'}],
      "outcomes": [${scoreLevel >= 80 ? '"完整微服务系统实现", "技术文档输出", "性能测试报告", "开源项目贡献"' : '"预期成果1", "预期成果2"'}],
      "pathStructure": {
        "title": "${scoreLevel >= 80 ? '微服务架构全栈实战路径' : '学习路径标题'}",
        "description": "${scoreLevel >= 80 ? '从架构设计到部署运维的全流程实践' : '路径描述'}", 
        "nodes": [
          {
            "title": "${scoreLevel >= 80 ? '微服务架构设计' : '节点标题'}",
            "description": "${scoreLevel >= 80 ? '服务拆分策略、API网关设计、服务发现机制' : '节点描述'}",
            "type": "project",
            "difficulty": ${difficultyLevel + 1},
            "estimatedHours": ${scoreLevel >= 80 ? 15 : 12},
            "skills": [${scoreLevel >= 80 ? '"架构设计", "API设计"' : '"相关技能"'}],
            "prerequisites": [${scoreLevel >= 80 ? '"分布式系统基础"' : '"前置技能"'}],
            "order": 1
          }
          // ... 必须包含${scoreLevel >= 80 ? '10-15' : '8-12'}个节点
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