/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// AI服务相关类型定义

import { Assessment, AssessmentInput } from './assessment'

// 重新导出评估相关类型，便于其他模块使用
export type { Assessment, AssessmentInput }

// AI服务提供商类型
export type AIProvider = 'openai' | 'claude' | 'qwen'

// AI模型配置
export interface AIModelConfig {
  provider: AIProvider
  model: string
  apiKey: string
  temperature?: number
  maxTokens?: number
}

// AI响应类型
export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  provider: AIProvider
  timestamp: Date
}

// AI服务接口
export interface AIService {
  // 基础对话
  chat(message: string, context?: any): Promise<string>
  
  // 流式对话
  chatStream(message: string, context?: any): AsyncIterableIterator<string>
  
  // 能力评估专用
  assessAbility(input: AssessmentInput): Promise<Assessment>
  
  // 学习建议生成
  generateLearningAdvice(context: any): Promise<string[]>
  
  // 检查服务状态
  checkHealth(): Promise<boolean>
  
  // 获取配置信息
  getConfig(): AIModelConfig | null
}

// AI服务状态
export interface AIServiceStatus {
  isConfigured: boolean
  available: boolean
  provider: AIProvider | null
  model: string | null
  isHealthy: boolean
  lastCheck: Date | null
  error?: string
}

// AI对话上下文
export interface ChatContext {
  userProfile?: any
  currentGoals?: any
  learningHistory?: any
  assessmentData?: any
  conversationHistory?: ChatMessage[]
}

// 聊天消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    provider?: AIProvider
    model?: string
    usage?: any
  }
}

// AI能力评估选项
export interface AIAssessmentOptions {
  includeConfidence?: boolean
  includeRecommendations?: boolean
  detailedAnalysis?: boolean
  language?: 'zh' | 'en'
}

// AI服务错误类型
export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
} 