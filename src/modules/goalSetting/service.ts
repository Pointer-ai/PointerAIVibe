import { log } from '../../utils/logger'

/**
 * 解析用户目标
 */
export const parseGoal = async (goalDescription: string): Promise<void> => {
  log('[goalSetting] Parsing user goal')
  // TODO: 实现目标解析逻辑
}

/**
 * 生成学习差距分析
 */
export const analyzeGap = async (): Promise<string> => {
  log('[goalSetting] Analyzing learning gap')
  // TODO: 实现差距分析逻辑
  return '差距分析占位内容'
} 