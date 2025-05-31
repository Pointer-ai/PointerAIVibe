import { log, error } from './logger'
import { getAPIConfig } from '../modules/profileSettings/service'

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
  const apiConfig = getAPIConfig()
  
  if (!apiConfig.key) {
    return {
      content: '',
      model: apiConfig.model,
      error: '请先在 Profile 设置中配置 API Key'
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
  const apiConfig = getAPIConfig()
  const modelName = apiConfig.specificModel || 'gpt-4o'
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.temperature ?? apiConfig.params?.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? apiConfig.params?.maxTokens ?? 2000,
        top_p: apiConfig.params?.topP ?? 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    log('[aiClient] OpenAI API call successful')
    return {
      content,
      model: 'openai'
    }
  } catch (e) {
    error('[aiClient] OpenAI API call failed:', e)
    throw e
  }
}

/**
 * Claude API 调用
 */
const callClaude = async (request: AIRequest, apiKey: string): Promise<AIResponse> => {
  const apiConfig = getAPIConfig()
  const modelName = apiConfig.specificModel || 'claude-3-5-sonnet-20241022'
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: request.maxTokens ?? apiConfig.params?.maxTokens ?? 2000,
        temperature: request.temperature ?? apiConfig.params?.temperature ?? 0.7,
        top_p: apiConfig.params?.topP ?? 1,
        system: apiConfig.params?.systemPrompt || '你是一个专业的编程教育助手，请用中文回答问题。',
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Claude API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    
    log('[aiClient] Claude API call successful')
    return {
      content,
      model: 'claude'
    }
  } catch (e) {
    error('[aiClient] Claude API call failed:', e)
    throw e
  }
}

/**
 * Qwen API 调用
 */
const callQwen = async (request: AIRequest, apiKey: string): Promise<AIResponse> => {
  const apiConfig = getAPIConfig()
  const modelName = apiConfig.specificModel || 'qwen-max'
  
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        input: {
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ]
        },
        parameters: {
          temperature: request.temperature ?? apiConfig.params?.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? apiConfig.params?.maxTokens ?? 2000,
          top_p: apiConfig.params?.topP ?? 0.8,
          top_k: apiConfig.params?.topK ?? 50
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Qwen API Error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.output?.text || ''
    
    log('[aiClient] Qwen API call successful')
    return {
      content,
      model: 'qwen'
    }
  } catch (e) {
    error('[aiClient] Qwen API call failed:', e)
    throw e
  }
} 