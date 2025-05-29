import { log } from '../../utils/logger'

/**
 * 生成学习路径
 */
export const generatePath = async (): Promise<void> => {
  log('[pathPlan] Generating learning path')
  // TODO: 实现路径生成逻辑
}

/**
 * 更新路径进度
 */
export const updateProgress = (stepId: string): void => {
  log(`[pathPlan] Updating progress for step: ${stepId}`)
  // TODO: 实现进度更新逻辑
} 