/**
 * Learning API AI交互相关类型定义
 * 整合原有的AI工具调用和对话相关类型
 */

// ========== AI工具相关 ==========

export interface AITool {
  name: string
  description: string
  parameters: Record<string, AIToolParameter>
}

export interface AIToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: AIToolParameter
  optional?: boolean
}

export interface AIToolCall {
  name: string
  parameters: Record<string, any>
}

export interface AIToolResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// ========== AI对话相关 ==========

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: any
}

export interface ChatContext {
  chatHistory?: ChatMessage[]
  systemContext?: SystemContext
  userPreferences?: UserPreferences
  useRealLLM?: boolean
  [key: string]: any
}

export interface SystemContext {
  hasAbilityProfile: boolean
  activeGoals: number
  activePaths: number
  currentPhase: string
  overallProgress: number
}

export interface UserPreferences {
  learningStyle?: string
  difficulty?: string
  pace?: string
  interests?: string[]
}

export interface ChatResponse {
  response: string
  toolCalls: AIToolCall[]
  suggestions: string[]
  systemStatus?: any
  confidence?: number
}

// ========== AI Agent相关 ==========

export interface AgentInteraction {
  id: string
  timestamp: string
  userMessage: string
  agentResponse: string
  toolsUsed: string[]
  context: any
  success: boolean
}

export interface AgentContext {
  currentGoals: any[]
  currentPaths: any[]
  userAbility: any
  systemPhase: string
  recentActions: any[]
}

export interface AgentCapability {
  name: string
  description: string
  confidence: number
  supportedTasks: string[]
  limitations: string[]
}

// ========== 智能推荐相关 ==========

export interface SmartRecommendation {
  id: string
  type: 'goal' | 'path' | 'content' | 'action'
  title: string
  description: string
  confidence: number
  reasoning: string
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
  estimatedTime?: number
  benefits?: string[]
  prerequisites?: string[]
}

export interface RecommendationContext {
  userAbility: any
  currentGoals: any[]
  learningProgress: any
  timeAvailable: number
  preferences: UserPreferences
}

// ========== AI服务配置相关 ==========

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'mock'
  model: string
  apiKey?: string
  baseUrl?: string
  temperature: number
  maxTokens: number
  timeout: number
}

export interface AIServiceStatus {
  connected: boolean
  provider: string
  model: string
  lastUsed: string
  tokensUsed: number
  errorRate: number
}

// ========== 工具执行相关 ==========

export interface ToolExecutionContext {
  userId?: string
  sessionId?: string
  requestId: string
  timestamp: string
  systemState: any
}

export interface ToolExecutionResult {
  toolName: string
  parameters: Record<string, any>
  result: any
  success: boolean
  executionTime: number
  errors?: string[]
  warnings?: string[]
  context: ToolExecutionContext
}

export interface ToolExecutionHistory {
  executions: ToolExecutionResult[]
  totalExecutions: number
  averageExecutionTime: number
  successRate: number
  mostUsedTools: { name: string; count: number }[]
}

// ========== AI会话管理相关 ==========

export interface ConversationSession {
  id: string
  startTime: string
  endTime?: string
  messageCount: number
  toolCallCount: number
  lastActivity: string
  context: ChatContext
  summary?: string
}

export interface ConversationHistory {
  sessions: ConversationSession[]
  totalSessions: number
  totalMessages: number
  totalToolCalls: number
  averageSessionLength: number
}

// ========== 上下文管理相关 ==========

export interface ContextManager {
  getCurrentContext(): Promise<ChatContext>
  updateContext(updates: Partial<ChatContext>): Promise<void>
  clearContext(): Promise<void>
  saveContext(sessionId: string): Promise<void>
  loadContext(sessionId: string): Promise<ChatContext | null>
}

export interface ContextMemory {
  shortTerm: Record<string, any> // 当前会话
  longTerm: Record<string, any>  // 持久化信息
  procedural: Record<string, any> // 操作记忆
}

// ========== 智能分析相关 ==========

export interface UserBehaviorPattern {
  preferredLearningTime: string[]
  averageSessionDuration: number
  commonTopics: string[]
  difficultyPreference: string
  learningVelocity: number
  engagementLevel: number
}

export interface LearningInsight {
  type: 'progress' | 'difficulty' | 'preference' | 'recommendation'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  actionable: boolean
  suggestedActions: string[]
  confidence: number
}

// ========== 错误处理相关 ==========

export interface AIError {
  code: string
  message: string
  type: 'network' | 'auth' | 'rate_limit' | 'validation' | 'internal'
  details?: any
  recoverable: boolean
  retryAfter?: number
}

export interface ErrorHandler {
  handleError(error: AIError): Promise<{
    shouldRetry: boolean
    fallbackResponse?: string
    userMessage?: string
  }>
}

// ========== 性能监控相关 ==========

export interface AIPerformanceMetrics {
  responseTime: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  toolExecutionTime: Record<string, number>
  errorRate: number
  cacheHitRate: number
  userSatisfaction?: number
}

export interface PerformanceThresholds {
  maxResponseTime: number
  maxTokensPerRequest: number
  maxToolExecutionTime: number
  minSuccessRate: number
}

// ========== 工具函数类型 ==========

export type AIManager = {
  processMessage(message: string, context?: ChatContext): Promise<ChatResponse>
  executeTool(toolName: string, params: any): Promise<AIToolResult>
  getRecommendations(context?: RecommendationContext): Promise<SmartRecommendation[]>
  getCapabilities(): Promise<AgentCapability[]>
  getStatus(): Promise<AIServiceStatus>
  updateConfig(config: Partial<AIServiceConfig>): Promise<void>
}

export type ToolExecutor = {
  execute(toolName: string, params: any, context?: ToolExecutionContext): Promise<ToolExecutionResult>
  getAvailableTools(): AITool[]
  validateParameters(toolName: string, params: any): { isValid: boolean; errors: string[] }
  getExecutionHistory(limit?: number): Promise<ToolExecutionHistory>
} 