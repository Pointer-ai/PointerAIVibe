// AI Assistant 服务层

import { getAPIConfig } from '../../modules/profileSettings/service'
import { AssistantConfig, ChatSession, LearningProgress, ChatMessage } from './types'
import { log, error } from '../../utils/logger'
import { getProfileData, setProfileData } from '../../utils/profile'

/**
 * 获取学习进度数据
 */
export const getLearningProgress = (): LearningProgress => {
  const progress = getProfileData('aiAssistantProgress') as LearningProgress
  return progress || {
    keywordQueries: {},
    chatSessions: [],
    totalInteractions: 0,
    lastActivity: new Date()
  }
}

/**
 * 保存学习进度数据
 */
export const saveLearningProgress = (progress: LearningProgress): void => {
  setProfileData('aiAssistantProgress', progress)
  log('[AIAssistant] Learning progress saved')
}

/**
 * 创建新的聊天会话
 */
export const createChatSession = (trigger: 'manual' | 'keyword' = 'manual', keyword?: string): ChatSession => {
  const now = new Date()
  const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  
  const session: ChatSession = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title: keyword ? `${keyword}` : `对话 ${timeString}`,
    messages: [],
    createdAt: now,
    lastActivity: now,
    trigger,
    keyword,
    isActive: true
  }
  
  log('[AIAssistant] New chat session created:', session.id, trigger, keyword)
  return session
}

/**
 * 更新会话标题（基于第一条用户消息）
 */
export const updateSessionTitle = (session: ChatSession, firstMessage: string): ChatSession => {
  if (session.messages.length > 0) return session // 已有消息，不更新标题
  
  // 提取第一句话作为标题（最多20个字符）
  const firstSentence = firstMessage.split(/[。！？\.\!\?]/)[0].trim()
  const title = firstSentence.length > 20 
    ? firstSentence.substring(0, 17) + '...' 
    : firstSentence || session.title
  
  return {
    ...session,
    title: title
  }
}

/**
 * 获取所有聊天会话
 */
export const getChatSessions = (): ChatSession[] => {
  const progress = getLearningProgress()
  return progress.chatSessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}

/**
 * 保存聊天会话
 */
export const saveChatSession = (session: ChatSession): void => {
  const progress = getLearningProgress()
  
  // 更新或添加会话
  const sessionIndex = progress.chatSessions.findIndex(s => s.id === session.id)
  if (sessionIndex >= 0) {
    progress.chatSessions[sessionIndex] = session
  } else {
    progress.chatSessions.unshift(session)
  }
  
  // 保持最多10个会话
  progress.chatSessions = progress.chatSessions.slice(0, 10)
  
  // 更新最后活动时间
  progress.lastActivity = new Date()
  progress.totalInteractions++
  
  saveLearningProgress(progress)
}

/**
 * 删除聊天会话
 */
export const deleteChatSession = (sessionId: string): void => {
  const progress = getLearningProgress()
  progress.chatSessions = progress.chatSessions.filter(s => s.id !== sessionId)
  saveLearningProgress(progress)
  log('[AIAssistant] Chat session deleted:', sessionId)
}

/**
 * 获取学习统计
 */
export const getLearningStats = () => {
  const progress = getLearningProgress()
  
  const totalKeywords = Object.keys(progress.keywordQueries).length
  const totalQueries = Object.values(progress.keywordQueries).reduce((sum, q) => sum + q.count, 0)
  const mostQueriedKeywords = Object.entries(progress.keywordQueries)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .map(([keyword, data]) => ({ keyword, count: data.count }))
  
  return {
    totalKeywords,
    totalQueries,
    totalSessions: progress.chatSessions.length,
    totalInteractions: progress.totalInteractions,
    mostQueriedKeywords,
    lastActivity: progress.lastActivity
  }
}

/**
 * 获取AI助手配置
 */
export const getAssistantConfig = (): AssistantConfig | null => {
  try {
    const apiConfig = getAPIConfig()
    
    if (!apiConfig.key) {
      return null
    }
    
    return {
      apiKey: apiConfig.key,
      model: apiConfig.model,
      specificModel: apiConfig.specificModel,
      params: apiConfig.params
    }
  } catch (err) {
    error('[AIAssistant] Failed to get config:', err)
    return null
  }
}

/**
 * 检查AI助手是否可用
 */
export const isAssistantAvailable = (): boolean => {
  const config = getAssistantConfig()
  return config !== null
}

/**
 * 调用AI API获取回复
 */
export const getAIResponse = async (message: string, context?: string): Promise<string> => {
  const config = getAssistantConfig()
  if (!config) {
    throw new Error('AI助手配置不可用')
  }
  
  log('[AIAssistant] Starting API call with config:', {
    model: config.model,
    specificModel: config.specificModel,
    hasApiKey: !!config.apiKey,
    apiKeyPrefix: config.apiKey?.substring(0, 10) + '...',
    params: config.params
  })
  
  try {
    let apiUrl = ''
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    let body: any = {}
    
    const systemPrompt = `你是悟语，一个专业的AI学习助手。你的任务是：
1. 为用户解释、分析各种概念、术语和文本内容
2. 提供清晰、准确、易懂的解释
3. 结合实际应用场景和例子
4. 保持回复简洁但完整
5. 使用中文回复，语气亲切友好

${context ? `上下文信息：${context}` : ''}`
    
    switch (config.model) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${config.apiKey}`
        body = {
          model: config.specificModel || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: config.params?.temperature || 0.7,
          max_tokens: config.params?.maxTokens || 1000
        }
        
        // 添加其他参数（如果存在且有效）
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.top_p = config.params.topP
        }
        if (config.params?.presencePenalty !== undefined) {
          body.presence_penalty = config.params.presencePenalty
        }
        if (config.params?.frequencyPenalty !== undefined) {
          body.frequency_penalty = config.params.frequencyPenalty
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.stop = config.params.stopSequences
        }
        break
        
      case 'claude':
        apiUrl = 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = config.apiKey
        headers['anthropic-version'] = '2023-06-01'
        body = {
          model: config.specificModel || 'claude-3-sonnet-20240229',
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
          max_tokens: config.params?.maxTokens || 1000
        }
        
        // 添加其他参数
        if (config.params?.temperature !== undefined) {
          body.temperature = config.params.temperature
        }
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.top_p = config.params.topP
        }
        if (config.params?.topK !== undefined && config.params.topK > 0) {
          body.top_k = config.params.topK
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.stop_sequences = config.params.stopSequences
        }
        break
        
      case 'qwen':
        apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        headers['Authorization'] = `Bearer ${config.apiKey}`
        body = {
          model: config.specificModel || 'qwen-max',
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ]
          },
          parameters: {
            temperature: config.params?.temperature || 0.7,
            max_tokens: config.params?.maxTokens || 1000
          }
        }
        
        // 添加其他参数
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.parameters.top_p = config.params.topP
        }
        if (config.params?.topK !== undefined && config.params.topK > 0) {
          body.parameters.top_k = config.params.topK
        }
        if (config.params?.presencePenalty !== undefined) {
          body.parameters.presence_penalty = config.params.presencePenalty
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.parameters.stop = config.params.stopSequences
        }
        break
        
      default:
        throw new Error(`不支持的AI模型: ${config.model}`)
    }
    
    log('[AIAssistant] API Request details:', { 
      url: apiUrl,
      headers: { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' },
      bodyKeys: Object.keys(body),
      messageLength: message.length
    })
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    log('[AIAssistant] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        error('[AIAssistant] API Error Details:', errorData)
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage += `\n错误信息: ${errorData.error}`
          } else if (errorData.error.message) {
            errorMessage += `\n错误信息: ${errorData.error.message}`
          } else {
            errorMessage += `\n错误详情: ${JSON.stringify(errorData.error)}`
          }
        }
      } catch (parseError) {
        error('[AIAssistant] Failed to parse error response:', parseError)
        errorMessage += '\n无法解析错误响应'
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    log('[AIAssistant] API Response keys:', Object.keys(data))
    
    // 解析不同AI服务的响应格式
    let aiResponse = ''
    switch (config.model) {
      case 'openai':
        aiResponse = data.choices?.[0]?.message?.content || '抱歉，我无法回答这个问题。'
        break
      case 'claude':
        aiResponse = data.content?.[0]?.text || '抱歉，我无法回答这个问题。'
        break
      case 'qwen':
        aiResponse = data.output?.text || '抱歉，我无法回答这个问题。'
        break
    }
    
    log('[AIAssistant] AI response processed successfully, length:', aiResponse.length)
    return aiResponse
    
  } catch (err) {
    error('[AIAssistant] API call failed:', err)
    if (err instanceof Error) {
      throw new Error(`AI助手调用失败: ${err.message}`)
    } else {
      throw new Error('AI助手暂时不可用，请稍后重试。')
    }
  }
}

/**
 * 流式调用AI API获取回复
 */
export const getAIResponseStream = async (
  message: string, 
  context?: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const config = getAssistantConfig()
  if (!config) {
    throw new Error('AI助手配置不可用')
  }
  
  try {
    let apiUrl = ''
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    let body: any = {}
    
    const systemPrompt = `你是悟语，一个专业的AI学习助手。你的任务是：
1. 为用户解释、分析各种概念、术语和文本内容
2. 提供清晰、准确、易懂的解释
3. 结合实际应用场景和例子
4. 保持回复简洁但完整
5. 使用中文回复，语气亲切友好

${context ? `上下文信息：${context}` : ''}`
    
    switch (config.model) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${config.apiKey}`
        body = {
          model: config.specificModel || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: config.params?.temperature || 0.7,
          max_tokens: config.params?.maxTokens || 1000,
          stream: true // 启用流式输出
        }
        
        // 添加其他参数（如果存在且有效）
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.top_p = config.params.topP
        }
        if (config.params?.presencePenalty !== undefined) {
          body.presence_penalty = config.params.presencePenalty
        }
        if (config.params?.frequencyPenalty !== undefined) {
          body.frequency_penalty = config.params.frequencyPenalty
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.stop = config.params.stopSequences
        }
        break
        
      case 'claude':
        apiUrl = 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = config.apiKey
        headers['anthropic-version'] = '2023-06-01'
        body = {
          model: config.specificModel || 'claude-3-sonnet-20240229',
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
          max_tokens: config.params?.maxTokens || 1000,
          stream: true // 启用流式输出
        }
        
        // 添加其他参数
        if (config.params?.temperature !== undefined) {
          body.temperature = config.params.temperature
        }
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.top_p = config.params.topP
        }
        if (config.params?.topK !== undefined && config.params.topK > 0) {
          body.top_k = config.params.topK
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.stop_sequences = config.params.stopSequences
        }
        break
        
      case 'qwen':
        apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        headers['Authorization'] = `Bearer ${config.apiKey}`
        body = {
          model: config.specificModel || 'qwen-max',
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ]
          },
          parameters: {
            temperature: config.params?.temperature || 0.7,
            max_tokens: config.params?.maxTokens || 1000,
            incremental_output: true // 启用增量输出
          }
        }
        
        // 添加其他参数
        if (config.params?.topP !== undefined && config.params.topP > 0) {
          body.parameters.top_p = config.params.topP
        }
        if (config.params?.topK !== undefined && config.params.topK > 0) {
          body.parameters.top_k = config.params.topK
        }
        if (config.params?.presencePenalty !== undefined) {
          body.parameters.presence_penalty = config.params.presencePenalty
        }
        if (config.params?.stopSequences && config.params.stopSequences.length > 0) {
          body.parameters.stop = config.params.stopSequences
        }
        break
        
      default:
        throw new Error(`不支持的AI模型: ${config.model}`)
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage += `\n错误信息: ${errorData.error}`
          } else if (errorData.error.message) {
            errorMessage += `\n错误信息: ${errorData.error.message}`
          }
        }
      } catch (parseError) {
        errorMessage += '\n无法解析错误响应'
      }
      throw new Error(errorMessage)
    }
    
    // 处理流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }
    
    const decoder = new TextDecoder()
    let fullResponse = ''
    let chunkBuffer = '' // 缓冲区用于累积小的chunk
    
    // 防抖函数，避免过于频繁的更新
    let updateTimer: NodeJS.Timeout | null = null
    const flushBuffer = () => {
      if (chunkBuffer && onChunk) {
        onChunk(chunkBuffer)
        chunkBuffer = ''
      }
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.trim() === '') continue
          
          try {
            let content = ''
            
            if (config.model === 'openai') {
              // OpenAI 流式格式: data: {"choices":[{"delta":{"content":"..."}}]}
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6)
                if (jsonStr === '[DONE]') continue
                
                const data = JSON.parse(jsonStr)
                content = data.choices?.[0]?.delta?.content || ''
              }
            } else if (config.model === 'claude') {
              // Claude 流式格式: event: content_block_delta\ndata: {"delta":{"text":"..."}}
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6))
                content = data.delta?.text || ''
              }
            } else if (config.model === 'qwen') {
              // 通义千问流式格式: data:{"output":{"text":"..."}}
              if (line.startsWith('data:')) {
                const data = JSON.parse(line.slice(5))
                content = data.output?.text || ''
                // 通义千问是增量式的，需要计算差值
                if (content.startsWith(fullResponse)) {
                  content = content.slice(fullResponse.length)
                }
              }
            }
            
            if (content) {
              fullResponse += content
              chunkBuffer += content
              
              // 使用防抖机制，每50ms最多更新一次
              if (updateTimer) {
                clearTimeout(updateTimer)
              }
              updateTimer = setTimeout(flushBuffer, 50)
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理下一行
            continue
          }
        }
      }
      
      // 确保最后的内容被发送
      if (updateTimer) {
        clearTimeout(updateTimer)
      }
      flushBuffer()
      
    } finally {
      reader.releaseLock()
    }
    
    if (!fullResponse) {
      fullResponse = '抱歉，我无法回答这个问题。'
    }
    
    return fullResponse
    
  } catch (err) {
    error('[AIAssistant] Stream API call failed:', err)
    if (err instanceof Error) {
      throw new Error(`AI助手调用失败: ${err.message}`)
    } else {
      throw new Error('AI助手暂时不可用，请稍后重试。')
    }
  }
}

/**
 * AI聊天服务类 - 提供底层聊天功能
 */
export class AIChatService {
  private messages: ChatMessage[] = []
  private isLoading = false
  private streamingMessageId: string | null = null
  private streamingContent = ''
  
  // 事件回调
  private onMessagesUpdate?: (messages: ChatMessage[]) => void
  private onLoadingStateChange?: (isLoading: boolean) => void
  private onStreamingUpdate?: (messageId: string, content: string) => void
  private onStreamingComplete?: (messageId: string, finalContent: string) => void

  constructor(
    callbacks?: {
      onMessagesUpdate?: (messages: ChatMessage[]) => void
      onLoadingStateChange?: (isLoading: boolean) => void
      onStreamingUpdate?: (messageId: string, content: string) => void
      onStreamingComplete?: (messageId: string, finalContent: string) => void
    }
  ) {
    if (callbacks) {
      this.onMessagesUpdate = callbacks.onMessagesUpdate
      this.onLoadingStateChange = callbacks.onLoadingStateChange
      this.onStreamingUpdate = callbacks.onStreamingUpdate
      this.onStreamingComplete = callbacks.onStreamingComplete
    }
  }

  /**
   * 获取当前消息列表
   */
  getMessages(): ChatMessage[] {
    return [...this.messages]
  }

  /**
   * 获取加载状态
   */
  getLoadingState(): boolean {
    return this.isLoading
  }

  /**
   * 获取流式内容
   */
  getStreamingContent(): { messageId: string | null; content: string } {
    return {
      messageId: this.streamingMessageId,
      content: this.streamingContent
    }
  }

  /**
   * 清空聊天记录
   */
  clearMessages(): void {
    this.messages = []
    this.onMessagesUpdate?.(this.messages)
    log('[AIChatService] Messages cleared')
  }

  /**
   * 添加消息
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message)
    this.onMessagesUpdate?.(this.messages)
  }

  /**
   * 更新最后一条消息
   */
  updateLastMessage(updatedMessage: ChatMessage): void {
    if (this.messages.length > 0) {
      this.messages[this.messages.length - 1] = updatedMessage
      this.onMessagesUpdate?.(this.messages)
    }
  }

  /**
   * 移除最后一条消息
   */
  removeLastMessage(): void {
    if (this.messages.length > 0) {
      this.messages.pop()
      this.onMessagesUpdate?.(this.messages)
    }
  }

  /**
   * 发送消息并获取AI回复
   */
  async sendMessage(content: string, keyword?: string): Promise<void> {
    if (!content.trim() || this.isLoading) {
      return
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      keyword
    }

    this.addMessage(userMessage)

    // 设置加载状态
    this.isLoading = true
    this.onLoadingStateChange?.(true)

    try {
      // 创建流式AI消息
      const assistantMessageId = (Date.now() + 1).toString()
      this.streamingMessageId = assistantMessageId
      this.streamingContent = ''
      
      // 先添加一个空的AI消息占位符
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      this.addMessage(placeholderMessage)

      // 获取流式AI回复
      const response = await getAIResponseStream(
        content.trim(),
        undefined,
        (chunk: string) => {
          // 实时更新流式内容
          this.streamingContent += chunk
          this.onStreamingUpdate?.(assistantMessageId, this.streamingContent)
        }
      )
      
      // 完成后更新最终消息
      const finalMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      this.updateLastMessage(finalMessage)
      this.onStreamingComplete?.(assistantMessageId, response)
      
      log('[AIChatService] Message sent and response received')
    } catch (err) {
      error('[AIChatService] Failed to get AI response:', err)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，我暂时无法回答您的问题。请检查网络连接或稍后重试。',
        timestamp: new Date()
      }

      this.updateLastMessage(errorMessage)
    } finally {
      this.isLoading = false
      this.streamingMessageId = null
      this.streamingContent = ''
      this.onLoadingStateChange?.(false)
    }
  }

  /**
   * 销毁服务实例
   */
  destroy(): void {
    this.messages = []
    this.isLoading = false
    this.streamingMessageId = null
    this.streamingContent = ''
    this.onMessagesUpdate = undefined
    this.onLoadingStateChange = undefined
    this.onStreamingUpdate = undefined
    this.onStreamingComplete = undefined
  }
} 