import { log } from '../../utils/logger'
import { callAI } from '../../utils/aiClient'
import { updateState, getState } from '../../utils/storage'

/**
 * 分析用户能力
 * 基于简历或问卷结果调用 AI 分析
 */
export const analyzeAbility = async (resumeText: string): Promise<string> => {
  log('[abilityAssess] Starting ability analysis')
  
  // TODO: 调用 AI 分析能力
  const result = await callAI({
    prompt: `分析以下简历或技能描述，评估编程能力水平：\n${resumeText}`
  })
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  // 保存分析结果到本地
  updateState({
    profile: {
      resume: resumeText,
      level: 'beginner' // TODO: 从 AI 响应中解析实际水平
    }
  })
  
  return result.content
}

/**
 * 获取当前用户能力档案
 */
export const getCurrentProfile = () => {
  const state = getState()
  return state.profile
} 