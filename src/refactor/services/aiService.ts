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

// AI服务层 - 统一的AI服务接口

import {
  AIService,
  AIModelConfig,
  AssessmentInput,
  Assessment,
  ChatMessage,
  AIProvider
} from '../types/ai'

// 导入profile service来获取配置
import { refactorProfileService } from './profileService'

/**
 * AI服务实现类
 * 提供统一的AI服务接口，支持多种AI提供商
 */
export class RefactorAIService implements AIService {
  private config: AIModelConfig | null = null
  private configLoading = false

  constructor(config?: AIModelConfig) {
    if (config) {
      this.config = config
    } else {
      // 从profile配置加载
      this.loadConfigFromProfile()
      
      // 监听Profile切换事件，自动重新加载配置
      this.setupProfileSwitchListener()
    }
  }

  /**
   * 设置Profile切换监听器
   */
  private setupProfileSwitchListener(): void {
    const profileSwitchHandler = () => {
      console.log('[RefactorAIService] Profile switched, reloading config...')
      // 延迟一点时间确保Profile切换完成
      setTimeout(() => {
        this.loadConfigFromProfile()
      }, 50)
    }

    // 添加监听器
    refactorProfileService.addProfileSwitchListener(profileSwitchHandler)
  }

  /**
   * 从profile配置加载AI配置
   */
  private loadConfigFromProfile(): void {
    // 防止重复加载
    if (this.configLoading) {
      console.log('[RefactorAIService] Config loading in progress, skipping...')
      return
    }

    this.configLoading = true

    try {
      const currentProfile = refactorProfileService.getCurrentProfile()
      
      if (currentProfile && currentProfile.data.settings.apiConfig) {
        const apiConfig = currentProfile.data.settings.apiConfig
        
        if (apiConfig.key && apiConfig.key.trim()) {
          const newConfig = {
            provider: this.mapServiceToProvider(apiConfig.model),
            model: apiConfig.specificModel || this.getDefaultModel(apiConfig.model),
            apiKey: apiConfig.key,
            temperature: apiConfig.params?.temperature || 0.7,
            maxTokens: apiConfig.params?.maxTokens || 2000
          }

          // 只有配置真正改变时才更新
          if (!this.config || JSON.stringify(this.config) !== JSON.stringify(newConfig)) {
            this.config = newConfig
            console.log(`[RefactorAIService] 成功加载API配置: ${this.config.provider} - ${this.config.model}`)
          }
          return
        }
      }

      // 如果没有有效配置，清空当前配置
      if (this.config) {
        this.config = null
        console.log('[RefactorAIService] 清空API配置 - 当前Profile无有效配置')
      }
    } catch (error) {
      console.warn('[RefactorAIService] Failed to load config from profile:', error)
    } finally {
      this.configLoading = false
    }
  }

  /**
   * 重新加载配置
   */
  reloadConfig(): void {
    this.loadConfigFromProfile()
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIModelConfig | null {
    return this.config
  }

  /**
   * 设置配置
   */
  setConfig(config: AIModelConfig): void {
    this.config = config
  }

  /**
   * 检查服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    if (!this.config) {
      console.error('[RefactorAIService] No AI configuration found')
      return false
    }

    try {
      // 发送简单的测试请求
      const response = await this.chat('测试连接')
      return !!(response && response.length > 0)
    } catch (error) {
      console.error('[RefactorAIService] Health check failed:', error)
      return false
    }
  }

  /**
   * 基础对话功能
   */
  async chat(message: string, context?: any): Promise<string> {
    if (!this.config) {
      throw new Error('AI服务未配置，请在Profile设置中配置API密钥')
    }

    try {
      const response = await this.callAIProvider(message, context)
      return response
    } catch (error) {
      console.error('[RefactorAIService] Chat failed:', error)
      throw new Error(`AI服务调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 流式对话功能
   */
  async *chatStream(message: string, context?: any): AsyncIterableIterator<string> {
    if (!this.config) {
      throw new Error('AI服务未配置，请在Profile设置中配置API密钥')
    }

    try {
      // 对于简化实现，这里先返回完整响应
      // 在实际应用中可以实现真正的流式传输
      const response = await this.chat(message, context)
      yield response
    } catch (error) {
      console.error('[RefactorAIService] Stream chat failed:', error)
      throw new Error(`AI服务调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 能力评估专用接口
   */
  async assessAbility(input: AssessmentInput): Promise<Assessment> {
    if (!this.config) {
      throw new Error('AI服务未配置，请在Profile设置中配置API密钥')
    }

    try {
      const prompt = this.buildAssessmentPrompt(input)
      const response = await this.callAIProvider(prompt, { type: 'assessment' })
      return this.parseAssessmentResponse(response, input)
    } catch (error) {
      console.error('[RefactorAIService] Assessment failed:', error)
      throw new Error(`能力评估失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 生成学习建议
   */
  async generateLearningAdvice(context: any): Promise<string[]> {
    if (!this.config) {
      throw new Error('AI服务未配置，请在Profile设置中配置API密钥')
    }

    try {
      const prompt = this.buildLearningAdvicePrompt(context)
      const response = await this.callAIProvider(prompt, { type: 'learning_advice' })
      return this.parseLearningAdvice(response)
    } catch (error) {
      console.error('[RefactorAIService] Learning advice generation failed:', error)
      return ['建议多练习编程基础', '多参与开源项目', '持续学习新技术']
    }
  }

  /**
   * 调用AI提供商
   */
  private async callAIProvider(message: string, context?: any): Promise<string> {
    if (!this.config) {
      throw new Error('AI配置未找到')
    }

    const { provider, model, apiKey, temperature, maxTokens } = this.config

    try {
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(message, { model, apiKey, temperature, maxTokens }, context)
        case 'claude':
          return await this.callClaude(message, { model, apiKey, temperature, maxTokens }, context)
        case 'qwen':
          return await this.callQwen(message, { model, apiKey, temperature, maxTokens }, context)
        default:
          throw new Error(`不支持的AI提供商: ${provider}`)
      }
    } catch (error) {
      console.error(`[RefactorAIService] ${provider} API call failed:`, error)
      throw error
    }
  }

  /**
   * 调用OpenAI API
   */
  private async callOpenAI(message: string, config: any, context?: any): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`OpenAI API错误: ${response.status} ${errorData?.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * 调用Claude API
   */
  private async callClaude(message: string, config: any, context?: any): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`Claude API错误: ${response.status} ${errorData?.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.content[0]?.text || ''
  }

  /**
   * 调用通义千问API
   */
  private async callQwen(message: string, config: any, context?: any): Promise<string> {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        input: {
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        },
        parameters: {
          temperature: config.temperature,
          max_tokens: config.maxTokens
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`通义千问API错误: ${response.status} ${errorData?.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.output?.text || ''
  }

  /**
   * 构建评估提示词
   */
  private buildAssessmentPrompt(input: AssessmentInput): string {
    if (input.type === 'resume') {
      return `请分析以下简历内容，从编程能力、算法思维、工程实践、团队协作、学习能力这5个维度进行评估。
每个维度给出0-100的分数，并提供具体的优势和改进建议。

简历内容：
${input.data.resumeText}

请以JSON格式返回评估结果：
{
  "overallScore": 总分(0-100),
  "dimensions": {
    "programming": {"score": 分数, "skills": ["技能1", "技能2"]},
    "algorithm": {"score": 分数, "skills": ["技能1", "技能2"]},
    "engineering": {"score": 分数, "skills": ["技能1", "技能2"]},
    "collaboration": {"score": 分数, "skills": ["技能1", "技能2"]},
    "learning": {"score": 分数, "skills": ["技能1", "技能2"]}
  },
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["待改进1", "待改进2"],
  "recommendations": ["建议1", "建议2"]
}`
    } else {
      // 问卷评估
      const questionnaireText = input.data.questionnaire?.map((q, i) => 
        `${i + 1}. 问题ID: ${q.questionId}, 答案: ${q.answer}`
      ).join('\n') || ''

      return `请基于以下问卷回答进行能力评估：
${questionnaireText}

请以相同的JSON格式返回评估结果。`
    }
  }

  /**
   * 构建学习建议提示词
   */
  private buildLearningAdvicePrompt(context: any): string {
    return `基于用户的能力评估结果，请提供3-5条个性化的学习建议。
评估上下文：${JSON.stringify(context)}

请直接返回建议列表，每条建议一行。`
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
        const currentProfile = refactorProfileService.getCurrentProfile()
        
        return {
          id: `assessment_${Date.now()}`,
          profileId: currentProfile?.id || 'unknown',
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
    const currentProfile = refactorProfileService.getCurrentProfile()
    
    return {
      id: `assessment_${Date.now()}`,
      profileId: currentProfile?.id || 'unknown',
      type: input.type,
      overallScore: 50,
      dimensions: {
        programming: { 
          name: '编程能力',
          score: 50, 
          skills: [{
            skill: '基础编程',
            level: 'intermediate',
            score: 50,
            confidence: 0.7,
            evidence: ['基础语法掌握'],
            improvements: ['需要更多实践']
          }],
          summary: '基础编程能力良好',
          recommendations: ['多做编程练习']
        },
        algorithm: { 
          name: '算法思维',
          score: 50, 
          skills: [{
            skill: '基础算法',
            level: 'intermediate',
            score: 50,
            confidence: 0.7,
            evidence: ['基础算法理解'],
            improvements: ['需要更多算法练习']
          }],
          summary: '算法基础良好',
          recommendations: ['多做算法题']
        },
        engineering: { 
          name: '工程实践',
          score: 50, 
          skills: [{
            skill: '基础工程',
            level: 'intermediate',
            score: 50,
            confidence: 0.7,
            evidence: ['基础项目经验'],
            improvements: ['需要更多项目实践']
          }],
          summary: '工程基础良好',
          recommendations: ['参与更多项目']
        },
        collaboration: { 
          name: '团队协作',
          score: 50, 
          skills: [{
            skill: '基础协作',
            level: 'intermediate',
            score: 50,
            confidence: 0.7,
            evidence: ['基础协作经验'],
            improvements: ['需要更多团队经验']
          }],
          summary: '协作能力良好',
          recommendations: ['参与团队项目']
        },
        learning: { 
          name: '学习能力',
          score: 50, 
          skills: [{
            skill: '基础学习',
            level: 'intermediate',
            score: 50,
            confidence: 0.7,
            evidence: ['持续学习态度'],
            improvements: ['需要系统化学习']
          }],
          summary: '学习能力良好',
          recommendations: ['制定学习计划']
        }
      },
      strengths: ['基础能力较好'],
      weaknesses: ['需要更多实践'],
      recommendations: ['建议多做项目练习'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 解析学习建议
   */
  private parseLearningAdvice(content: string): string[] {
    try {
      // 按行分割并过滤空行
      const lines = content.split('\n').filter(line => line.trim().length > 0)
      return lines.length > 0 ? lines : ['建议多练习编程基础', '多参与开源项目', '持续学习新技术']
    } catch (error) {
      console.warn('[RefactorAIService] Failed to parse learning advice:', error)
      return ['建议多练习编程基础', '多参与开源项目', '持续学习新技术']
    }
  }

  /**
   * 映射服务名到提供商
   */
  private mapServiceToProvider(service: string): AIProvider {
    // 支持直接的模型名称映射
    if (service.startsWith('gpt-') || service.includes('openai')) {
      return 'openai'
    }
    if (service.startsWith('claude-') || service.includes('claude')) {
      return 'claude'
    }
    if (service.startsWith('qwen-') || service.includes('qwen')) {
      return 'qwen'
    }

    // 传统的服务名称映射
    switch (service) {
      case 'openai': return 'openai'
      case 'claude': return 'claude'
      case 'qwen': return 'qwen'
      default: return 'openai'
    }
  }

  /**
   * 获取默认模型
   */
  private getDefaultModel(service: string): string {
    // 如果service本身就是一个模型名称，直接返回
    if (service.startsWith('gpt-') || service.startsWith('claude-') || service.startsWith('qwen-')) {
      return service
    }

    // 否则根据服务名称返回默认模型
    switch (service) {
      case 'openai': return 'gpt-4'
      case 'claude': return 'claude-3-5-sonnet-20241022'
      case 'qwen': return 'qwen-plus'
      default: return 'gpt-4'
    }
  }
}

// 创建全局单例实例
export const refactorAIService = new RefactorAIService()

// 将实例挂载到window对象上，便于其他模块访问
if (typeof window !== 'undefined') {
  (window as any).refactorAIService = refactorAIService
} 