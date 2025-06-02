/**
 * AI Agent交互历史
 */
export interface AgentInteraction {
  id: string
  timestamp: string
  userMessage: string
  agentResponse: string
  toolsUsed: string[]
  context: any
}

/**
 * 用户意图分析结果
 */
export interface UserIntent {
  type: string
  confidence: number
  entities: any[]
  suggestedTools: string[]
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  success: boolean
  results: any[]
  toolsUsed: string[]
  errors: string[]
}

/**
 * AI对话响应
 */
export interface AgentChatResponse {
  response: string
  toolsUsed: string[]
  suggestions: string[]
  systemStatus: any
}

/**
 * AI聊天上下文
 */
export interface ChatContext {
  useRealLLM?: boolean
  chatHistory?: Array<{
    type: 'user' | 'agent'
    content: string
    timestamp: string
  }>
  currentNodeId?: string
  currentPathId?: string
  availableHours?: number
  preferredTimes?: string[]
  learningStyle?: string
  difficulty?: number
  timeRange?: string
  systemStatus?: {
    activeGoals: any[]
    activePaths: any[]
  }
}

/**
 * 意图类型定义
 */
export interface IntentDefinition {
  type: string
  keywords: string[]
  tools: string[]
} 