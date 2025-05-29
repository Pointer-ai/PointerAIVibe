/**
 * AI 服务调用模块
 * 统一封装各个 AI 服务商的 API 调用
 */

import { getAPIConfig } from '../modules/profileSettings/service'
import { log, error as logError } from './logger'

// API 响应类型
interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// OpenAI API 调用
async function callOpenAI(
  prompt: string, 
  apiKey: string, 
  model: string,
  params: any
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical interviewer and career development consultant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2000,
      top_p: params.topP || 0.9,
      presence_penalty: params.presencePenalty || 0,
      frequency_penalty: params.frequencyPenalty || 0,
      stop: params.stopSequences || []
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    }
  }
}

// Claude API 调用
async function callClaude(
  prompt: string,
  apiKey: string,
  model: string,
  params: any
): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: params.systemPrompt || 'You are a professional technical interviewer and career development consultant.',
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2000,
      top_p: params.topP || 0.9,
      top_k: params.topK || 40,
      stop_sequences: params.stopSequences || []
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens
    }
  }
}

// 通义千问 API 调用
async function callQwen(
  prompt: string,
  apiKey: string,
  model: string,
  params: any
): Promise<AIResponse> {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一位经验丰富的技术面试官和职业发展顾问。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        top_p: params.topP || 0.9,
        top_k: params.topK || 40,
        presence_penalty: params.presencePenalty || 0,
        stop: params.stopSequences || []
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Qwen API error: ${error.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    content: data.output.text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.total_tokens
    }
  }
}

/**
 * 统一的 AI 调用接口
 */
export async function callAI(prompt: string): Promise<string> {
  const config = getAPIConfig()
  
  if (!config.key) {
    throw new Error('请先配置 API Key')
  }

  log(`[AI] Calling ${config.model} API with model ${config.specificModel}`)
  
  try {
    let response: AIResponse
    
    switch (config.model) {
      case 'openai':
        response = await callOpenAI(prompt, config.key, config.specificModel, config.params)
        break
      
      case 'claude':
        response = await callClaude(prompt, config.key, config.specificModel, config.params)
        break
      
      case 'qwen':
        response = await callQwen(prompt, config.key, config.specificModel, config.params)
        break
      
      default:
        throw new Error(`不支持的 AI 模型: ${config.model}`)
    }
    
    if (response.usage) {
      log(`[AI] Token usage: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`)
    }
    
    return response.content
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误'
    logError(`[AI] API call failed: ${errorMessage}`)
    throw new Error(`AI 调用失败: ${errorMessage}`)
  }
} 