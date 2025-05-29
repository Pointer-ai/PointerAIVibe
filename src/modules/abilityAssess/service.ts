import { log, error } from '../../utils/logger'
import { callAI } from '../../utils/ai'
import { getProfileData, setProfileData } from '../../utils/profile'
import { addActivityRecord } from '../profileSettings/service'
import { generateAssessmentPrompt } from './prompt'
import { 
  AbilityAssessment, 
  AssessmentInput,
  DEFAULT_WEIGHTS,
  getScoreLevel,
  getSkillScoreValue,
  SkillScore
} from './types'

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
    // 如果是不完整的 report 部分，尝试添加默认的 report 结构
    if (cleaned.includes('"report"') && !cleaned.includes('"recommendations"')) {
      // 添加缺失的 report 字段
      const reportIndex = cleaned.lastIndexOf('"report"')
      if (reportIndex !== -1) {
        const afterReport = cleaned.substring(reportIndex)
        if (!afterReport.includes('"summary"')) {
          cleaned = cleaned.replace(/"report":\s*\{[^}]*$/, '"report": {"summary": "评估已完成，但报告生成不完整","strengths": [],"improvements": [],"recommendations": []}')
        }
      }
    }
    
    // 添加缺少的闭合括号
    cleaned += '}'.repeat(openBraces - closeBraces)
  }
  
  // 尝试修复缺少的逗号（简单的启发式方法）
  cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"')
  cleaned = cleaned.replace(/\}\s*\n\s*"/g, '},\n"')
  cleaned = cleaned.replace(/\]\s*\n\s*"/g, '],\n"')
  
  return cleaned
}

/**
 * 验证和修复评估数据结构
 */
const validateAndFixAssessment = (assessment: any): AbilityAssessment => {
  // 确保 report 字段存在
  if (!assessment.report) {
    assessment.report = {
      summary: '评估已完成',
      strengths: [],
      improvements: [],
      recommendations: []
    }
  }
  
  // 确保 report 的所有必需字段存在
  if (!assessment.report.summary) assessment.report.summary = '评估已完成'
  if (!assessment.report.strengths) assessment.report.strengths = []
  if (!assessment.report.improvements) assessment.report.improvements = []
  if (!assessment.report.recommendations) assessment.report.recommendations = []
  
  // 确保 metadata 字段存在
  if (!assessment.metadata) {
    assessment.metadata = {
      assessmentDate: new Date().toISOString(),
      assessmentMethod: 'resume',
      confidence: 0.5
    }
  }
  
  // 确保 dimensions 字段存在且完整
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
  
  return assessment as AbilityAssessment
}

/**
 * 分析用户能力 - 支持简历和问卷两种方式
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
    
    // 添加调试日志 - 显示 AI 返回的原始内容
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