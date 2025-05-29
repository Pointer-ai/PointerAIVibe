import { log, error } from '../../utils/logger'
import { callAI } from '../../utils/aiClient'
import { getProfileData, setProfileData } from '../../utils/profile'
import { generateAssessmentPrompt } from './prompt'
import { 
  AbilityAssessment, 
  AssessmentInput,
  DEFAULT_WEIGHTS,
  getScoreLevel 
} from './types'

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
    const result = await callAI({ prompt })
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    // 解析 AI 返回的 JSON 结果
    const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      throw new Error('AI 返回格式错误，无法解析评估结果')
    }
    
    const assessment: AbilityAssessment = JSON.parse(jsonMatch[1])
    
    // 计算并验证总分
    assessment.overallScore = calculateOverallScore(assessment)
    
    // 保存评估结果到本地存储
    await saveAssessment(assessment)
    
    log('[abilityAssess] Assessment completed successfully')
    return assessment
    
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
    dimension.score = Math.round(skills.reduce((sum, score) => sum + score, 0) / skills.length)
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
  
  const result = await callAI({ prompt })
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.content
}

/**
 * 找出薄弱领域（评分低于60的技能）
 */
const findWeakAreas = (assessment: AbilityAssessment) => {
  const weakAreas: { name: string; score: number }[] = []
  
  Object.entries(assessment.dimensions).forEach(([dimName, dimension]) => {
    Object.entries(dimension.skills).forEach(([skillName, score]) => {
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
  .map(([skill, score]) => `- ${skill}: ${score}分`)
  .join('\n')}

### 2. 算法能力 (${assessment.dimensions.algorithm.score}分)
${Object.entries(assessment.dimensions.algorithm.skills)
  .map(([skill, score]) => `- ${skill}: ${score}分`)
  .join('\n')}

### 3. 项目能力 (${assessment.dimensions.project.score}分)
${Object.entries(assessment.dimensions.project.skills)
  .map(([skill, score]) => `- ${skill}: ${score}分`)
  .join('\n')}

### 4. 系统设计 (${assessment.dimensions.systemDesign.score}分)
${Object.entries(assessment.dimensions.systemDesign.skills)
  .map(([skill, score]) => `- ${skill}: ${score}分`)
  .join('\n')}

### 5. 沟通协作 (${assessment.dimensions.communication.score}分)
${Object.entries(assessment.dimensions.communication.skills)
  .map(([skill, score]) => `- ${skill}: ${score}分`)
  .join('\n')}

## 评估总结
${assessment.report.summary}

## 优势领域
${assessment.report.strengths.map(s => `- ${s}`).join('\n')}

## 待改进项
${assessment.report.improvements.map(i => `- ${i}`).join('\n')}

## 发展建议
${assessment.report.recommendations.map(r => `- ${r}`).join('\n')}
`
} 