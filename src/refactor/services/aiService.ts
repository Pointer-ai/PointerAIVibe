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

// AI服务统一接口实现

import { 
  AIService, 
  AIModelConfig, 
  AIProvider, 
  AIServiceError, 
  AIServiceStatus,
  ChatContext 
} from '../types/ai'
import { Assessment, AssessmentInput } from '../types/assessment'

/**
 * AI服务实现类
 * 提供统一的AI服务接口，支持多种AI提供商
 */
export class RefactorAIService implements AIService {
  private config: AIModelConfig | null = null

  constructor(config?: AIModelConfig) {
    if (config) {
      this.config = config
    } else {
      // 尝试从profile配置加载
      this.loadConfigFromProfile()
    }
  }

  /**
   * 从profile配置加载AI配置
   */
  private loadConfigFromProfile(): void {
    try {
      // 方法1: 从新的profiles系统加载
      const profiles = localStorage.getItem('profiles')
      if (profiles) {
        const profileStore = JSON.parse(profiles)
        const currentProfileId = profileStore.currentProfileId
        
        if (currentProfileId) {
          const currentProfile = profileStore.profiles.find((p: any) => p.id === currentProfileId)
          if (currentProfile && currentProfile.data && currentProfile.data.settings) {
            const apiConfig = currentProfile.data.settings.apiConfig
            if (apiConfig && apiConfig.key) {
              this.config = {
                provider: this.mapServiceToProvider(apiConfig.model),
                model: apiConfig.specificModel || this.getDefaultModel(apiConfig.model),
                apiKey: apiConfig.key,
                temperature: apiConfig.params?.temperature || 0.7,
                maxTokens: apiConfig.params?.maxTokens || 2000
              }
              console.log('[RefactorAIService] 成功从profiles系统加载API配置:', this.config.provider)
              return
            }
          }
        }
      }

      // 方法2: 从旧的profile系统加载（兼容）
      const currentProfile = localStorage.getItem('currentProfile')
      if (currentProfile) {
        const profileData = localStorage.getItem(`profile_${currentProfile}`)
        if (profileData) {
          const profile = JSON.parse(profileData)
          const apiConfig = profile.apiConfig

          if (apiConfig && apiConfig.currentService && apiConfig[apiConfig.currentService]) {
            const serviceConfig = apiConfig[apiConfig.currentService]
            
            this.config = {
              provider: this.mapServiceToProvider(apiConfig.currentService),
              model: serviceConfig.model || this.getDefaultModel(apiConfig.currentService),
              apiKey: serviceConfig.apiKey,
              temperature: 0.7,
              maxTokens: 2000
            }
            console.log('[RefactorAIService] 从旧profile系统加载API配置:', this.config.provider)
            return
          }
        }
      }

      console.log('[RefactorAIService] 未找到有效的API配置')
    } catch (error) {
      console.warn('[RefactorAIService] Failed to load config from profile:', error)
    }
  }

  /**
   * 映射服务名称到提供商类型
   */
  private mapServiceToProvider(service: string): AIProvider {
    switch (service) {
      case 'openai': return 'openai'
      case 'claude': return 'claude'
      case 'qwen': return 'qwen'
      default: return 'openai'
    }
  }

  /**
   * 获取默认模型名称
   */
  private getDefaultModel(service: string): string {
    switch (service) {
      case 'openai': return 'gpt-4'
      case 'claude': return 'claude-3-5-sonnet-20241022'
      case 'qwen': return 'qwen-plus'
      default: return 'gpt-4'
    }
  }

  /**
   * 基础对话功能
   */
  async chat(message: string, context?: ChatContext): Promise<string> {
    if (!this.config) {
      throw new AIServiceError('AI服务未配置', 'openai')
    }

    try {
      const response = await this.makeAPICall(message, context)
      return response.content
    } catch (error) {
      throw new AIServiceError(
        `AI对话失败: ${error instanceof Error ? error.message : '未知错误'}`,
        this.config.provider,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 流式对话功能 (暂时返回普通响应)
   */
  async* chatStream(message: string, context?: ChatContext): AsyncIterableIterator<string> {
    // 暂时简单实现，后续可以添加真正的流式支持
    const response = await this.chat(message, context)
    
    // 模拟流式返回
    const words = response.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  /**
   * 能力评估专用功能
   */
  async assessAbility(input: AssessmentInput): Promise<Assessment> {
    if (!this.config) {
      throw new AIServiceError('AI服务未配置', 'openai')
    }

    try {
      // 构建评估专用的prompt
      const assessmentPrompt = this.buildAssessmentPrompt(input)
      
      const response = await this.makeAPICall(assessmentPrompt)
      
      // 解析评估结果
      return this.parseAssessmentResponse(response.content, input)
    } catch (error) {
      throw new AIServiceError(
        `能力评估失败: ${error instanceof Error ? error.message : '未知错误'}`,
        this.config.provider,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 学习建议生成
   */
  async generateLearningAdvice(context: any): Promise<string[]> {
    if (!this.config) {
      throw new AIServiceError('AI服务未配置', 'openai')
    }

    try {
      const prompt = this.buildAdvicePrompt(context)
      const response = await this.makeAPICall(prompt)
      
      // 解析建议列表
      return this.parseAdviceResponse(response.content)
    } catch (error) {
      throw new AIServiceError(
        `生成学习建议失败: ${error instanceof Error ? error.message : '未知错误'}`,
        this.config.provider,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 检查服务状态
   */
  async checkHealth(): Promise<boolean> {
    if (!this.config) {
      return false
    }

    try {
      await this.makeAPICall('Hello', undefined, true)
      return true
    } catch (error) {
      console.warn('[RefactorAIService] Health check failed:', error)
      return false
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): AIModelConfig | null {
    return this.config
  }

  /**
   * 获取服务状态
   */
  async getStatus(): Promise<AIServiceStatus> {
    const isConfigured = this.config !== null
    const isHealthy = isConfigured ? await this.checkHealth() : false

    return {
      isConfigured,
      provider: this.config?.provider || null,
      model: this.config?.model || null,
      isHealthy,
      lastCheck: new Date()
    }
  }

  /**
   * 核心API调用方法
   */
  private async makeAPICall(
    message: string, 
    context?: ChatContext, 
    isHealthCheck: boolean = false
  ): Promise<{ content: string }> {
    if (!this.config) {
      throw new Error('AI配置未设置')
    }

    const { provider, model, apiKey, temperature, maxTokens } = this.config

    let url: string
    let headers: Record<string, string>
    let body: any

    // 构建请求参数
    const messages = [
      { role: 'system', content: this.getSystemPrompt(context, isHealthCheck) },
      { role: 'user', content: message }
    ]

    switch (provider) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
        body = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        }
        break

      case 'claude':
        url = 'https://api.anthropic.com/v1/messages'
        headers = {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
        body = {
          model,
          messages: messages.filter(m => m.role !== 'system'),
          system: this.getSystemPrompt(context, isHealthCheck),
          max_tokens: maxTokens || 2000
        }
        break

      case 'qwen':
        url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
        body = {
          model,
          input: {
            messages
          },
          parameters: {
            temperature,
            max_tokens: maxTokens
          }
        }
        break

      default:
        throw new Error(`不支持的AI提供商: ${provider}`)
    }

    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // 解析响应
    let content: string
    switch (provider) {
      case 'openai':
        content = data.choices?.[0]?.message?.content || ''
        break
      case 'claude':
        content = data.content?.[0]?.text || ''
        break
      case 'qwen':
        content = data.output?.text || ''
        break
      default:
        content = ''
    }

    return { content }
  }

  /**
   * 获取系统提示词
   */
  private getSystemPrompt(context?: ChatContext, isHealthCheck: boolean = false): string {
    if (isHealthCheck) {
      return '你是一个AI助手，请简单回复"OK"表示服务正常。'
    }

    return `你是Pointer.ai学习平台的AI助手，专门帮助用户进行编程学习和能力评估。

你的核心职责：
1. 帮助用户分析编程能力和技能水平
2. 生成个性化的学习建议和改进计划
3. 回答编程学习相关的问题
4. 提供友好、专业、有建设性的指导

请用中文回复，保持专业且友好的语调。`
  }

  /**
   * 构建评估专用prompt
   */
  private buildAssessmentPrompt(input: AssessmentInput): string {
    const basePrompt = `请根据以下信息进行编程能力评估：

评估类型：${input.type === 'resume' ? '简历分析' : '问卷评估'}

评估内容：
${input.type === 'resume' ? input.data.resumeText : JSON.stringify(input.data.questionnaire, null, 2)}

请从以下维度进行评估（满分100分）：
1. 编程基础能力 (Programming)
2. 算法与数据结构 (Algorithm) 
3. 项目经验 (Project)
4. 系统设计 (System Design)
5. 沟通协作 (Communication)

请返回JSON格式的评估结果，包含：
- overallScore: 总体评分
- dimensions: 各维度详细评分和分析
- strengths: 优势领域
- weaknesses: 待改进领域  
- recommendations: 学习建议`

    return basePrompt
  }

  /**
   * 构建建议生成prompt
   */
  private buildAdvicePrompt(context: any): string {
    return `基于用户的学习情况，请生成3-5条个性化的学习建议：

用户背景：
${JSON.stringify(context, null, 2)}

请生成实用、具体、可操作的学习建议。`
  }

  /**
   * 解析评估响应
   */
  private parseAssessmentResponse(content: string, input: AssessmentInput): Assessment {
    try {
      // 尝试解析JSON响应
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // 构建标准Assessment对象
        return {
          id: `assessment_${Date.now()}`,
          profileId: localStorage.getItem('currentProfile') || 'default',
          type: input.type,
          overallScore: parsed.overallScore || 0,
          dimensions: parsed.dimensions || {},
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          recommendations: parsed.recommendations || [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    } catch (error) {
      console.warn('[RefactorAIService] Failed to parse assessment response:', error)
    }

    // 如果解析失败，返回默认评估结果
    return {
      id: `assessment_${Date.now()}`,
      profileId: localStorage.getItem('currentProfile') || 'default',
      type: input.type,
      overallScore: 50,
      dimensions: {},
      strengths: ['基础能力较好'],
      weaknesses: ['需要更多实践'],
      recommendations: ['建议多做项目练习'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 解析建议响应
   */
  private parseAdviceResponse(content: string): string[] {
    // 提取建议列表
    const lines = content.split('\n')
    const advice: string[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
        advice.push(trimmed.replace(/^[-•\d.\s]+/, ''))
      }
    }
    
    return advice.length > 0 ? advice : [content.trim()]
  }

  /**
   * 重新加载配置
   */
  reloadConfig(): void {
    this.config = null
    this.loadConfigFromProfile()
  }

  /**
   * 手动设置配置
   */
  setConfig(config: AIModelConfig): void {
    this.config = config
  }
}

/**
 * 创建AI服务实例
 */
export const createAIService = (config?: AIModelConfig): RefactorAIService => {
  return new RefactorAIService(config)
}

/**
 * 默认AI服务实例
 */
export const refactorAIService = new RefactorAIService() 