import { log, error } from './logger'
import { getState } from './storage'

export type AIModel = 'claude' | 'openai' | 'qwen'

export interface AIRequest {
  prompt: string
  temperature?: number
  maxTokens?: number
}

export interface AIResponse {
  content: string
  model: AIModel
  error?: string
}

/**
 * 调用 AI API
 * 根据配置中的模型类型调用相应的 API
 */
export const callAI = async (request: AIRequest): Promise<AIResponse> => {
  const { apiConfig } = getState()
  
  if (!apiConfig.key) {
    return {
      content: '',
      model: apiConfig.model,
      error: '请先在设置中配置 API Key'
    }
  }

  log(`[aiClient] Calling ${apiConfig.model} API`)

  try {
    switch (apiConfig.model) {
      case 'openai':
        return await callOpenAI(request, apiConfig.key)
      case 'claude':
        return await callClaude(request, apiConfig.key)
      case 'qwen':
        return await callQwen(request, apiConfig.key)
      default:
        throw new Error(`Unsupported model: ${apiConfig.model}`)
    }
  } catch (e) {
    error('[aiClient] API call failed', e)
    return {
      content: '',
      model: apiConfig.model,
      error: e instanceof Error ? e.message : 'API 调用失败'
    }
  }
}

/**
 * OpenAI API 调用
 */
const callOpenAI = async (request: AIRequest, apiKey: string): Promise<AIResponse> => {
  // TODO: 实现 OpenAI API 调用
  log('[aiClient] OpenAI API call - placeholder')
  return {
    content: '这是 OpenAI 的占位响应',
    model: 'openai'
  }
}

/**
 * Claude API 调用
 */
const callClaude = async (request: AIRequest, apiKey: string): Promise<AIResponse> => {
  // TODO: 实现 Claude API 调用
  log('[aiClient] Claude API call - placeholder')
  return {
    content: '这是 Claude 的占位响应',
    model: 'claude'
  }
}

/**
 * Qwen API 调用
 */
const callQwen = async (request: AIRequest, apiKey: string): Promise<AIResponse> => {
  // TODO: 实现 Qwen API 调用
  log('[aiClient] Qwen API call - placeholder')
  return {
    content: '这是 Qwen 的占位响应',
    model: 'qwen'
  }
} 