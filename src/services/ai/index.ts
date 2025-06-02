// AI服务统一入口文件

// 导出类型
export * from './types'

// 导出服务
export { agentChatService, AgentChatService } from './agentChat'
export { intentAnalysisService, IntentAnalysisService } from './intentAnalysis'
export { suggestionGeneratorService, SuggestionGeneratorService } from './suggestionGenerator'

// 导出简化的对话接口
import { agentChatService } from './agentChat'
import { AgentChatResponse, ChatContext } from './types'
import { LearningSystemStatus } from '../learning/types'

/**
 * 简化的AI对话接口
 */
export async function chatWithAgent(
  userMessage: string,
  context?: ChatContext,
  getSystemStatus?: () => Promise<LearningSystemStatus>
): Promise<AgentChatResponse> {
  return agentChatService.chatWithAgent(userMessage, context, getSystemStatus)
}

/**
 * 获取交互历史
 */
export function getInteractionHistory() {
  return agentChatService.getInteractionHistory()
}

/**
 * 清除交互历史
 */
export function clearInteractionHistory() {
  return agentChatService.clearInteractionHistory()
} 