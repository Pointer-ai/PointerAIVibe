// AI Assistant 模块导出

export { GlobalAIAssistant } from './GlobalAIAssistant'
export { MultiTabChat } from './MultiTabChat'
export { AIChat } from './AIChat'
export { TextSelector } from './TextSelector'

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
  updateSessionTitle,
  AIChatService
} from './service' 