// AI Assistant 模块导出

export { GlobalAIAssistant } from './GlobalAIAssistant'
export { MultiTabChat } from './MultiTabChat'
export { TextSelector } from './TextSelector'
export { LearningStats } from './LearningStats'

export type {
  AIAssistantState,
  ChatMessage,
  ChatSession,
  LearningProgress
} from './types'

export {
  isAssistantAvailable,
  getLearningProgress,
  getLearningStats,
  createChatSession,
  getChatSessions,
  updateSessionTitle
} from './service' 