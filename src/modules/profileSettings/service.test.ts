import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAPIConfig,
  saveAPIConfig,
  validateAPIKey,
  addActivityRecord,
  getActivityHistory,
  clearActivityHistory,
  getSupportedModels,
  getSupportedParams,
  resetParamsToDefault
} from './service'
import { createProfile, setCurrentProfile, getCurrentProfile } from '../../utils/profile'

describe('ProfileSettings Service', () => {
  beforeEach(() => {
    localStorage.clear()
    // 创建测试用户
    const profile = createProfile('test-user', '123456')
    setCurrentProfile(profile.id)
    
    // 验证当前 profile 是否设置成功
    const currentProfile = getCurrentProfile()
    console.log('Current profile after setup:', currentProfile)
  })

  describe('API Configuration', () => {
    it('should return default API config when no config exists', () => {
      const config = getAPIConfig()
      expect(config).toEqual({
        model: 'openai',
        key: '',
        specificModel: 'gpt-4o',
        params: expect.objectContaining({
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9
        })
      })
    })

    it('should save and retrieve complete API config', () => {
      const testConfig = {
        model: 'claude' as const,
        key: 'sk-ant-test-key',
        specificModel: 'claude-3-5-sonnet-20241022',
        params: {
          temperature: 0.8,
          maxTokens: 2000,
          topP: 0.95,
          topK: 50,
          systemPrompt: 'You are a helpful assistant.'
        }
      }
      
      saveAPIConfig(testConfig)
      
      const retrieved = getAPIConfig()
      expect(retrieved).toEqual(testConfig)
    })

    it('should add activity record when saving API config', () => {
      const testConfig = {
        model: 'openai' as const,
        key: 'sk-test-key',
        specificModel: 'gpt-4o',
        params: {
          temperature: 0.7,
          maxTokens: 1000
        }
      }
      
      saveAPIConfig(testConfig)
      const history = getActivityHistory()
      
      expect(history).toHaveLength(1)
      expect(history[0].type).toBe('profile_update')
      expect(history[0].action).toBe('API 配置更新')
      expect(history[0].details?.model).toBe('openai')
      expect(history[0].details?.specificModel).toBe('gpt-4o')
      expect(history[0].details?.paramsCount).toBe(2)
    })

    it('should handle backward compatibility for old config format', () => {
      // 模拟旧格式的配置
      const oldConfig = {
        model: 'openai' as const,
        key: 'sk-test-key'
        // 缺少 specificModel 和 params
      }
      
      // 直接设置到 localStorage 模拟旧数据
      const currentProfile = getCurrentProfile()
      if (currentProfile) {
        currentProfile.data.settings = {
          apiConfig: oldConfig,
          preferences: {},
          activityHistory: []
        }
        localStorage.setItem('profiles', JSON.stringify([currentProfile]))
      }
      
      const config = getAPIConfig()
      
      // 应该自动添加缺失的字段
      expect(config.specificModel).toBe('gpt-4o')
      expect(config.params).toBeDefined()
      expect(config.params.temperature).toBe(0.7)
    })
  })

  describe('Model Management', () => {
    it('should return supported models for each provider', () => {
      const openaiModels = getSupportedModels('openai')
      expect(openaiModels).toHaveLength(7)
      expect(openaiModels[0]).toEqual({
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: '最新多模态模型，支持图像和文本'
      })

      const claudeModels = getSupportedModels('claude')
      expect(claudeModels).toHaveLength(6)
      expect(claudeModels[0].id).toBe('claude-3-5-sonnet-20241022')

      const qwenModels = getSupportedModels('qwen')
      expect(qwenModels).toHaveLength(6)
      expect(qwenModels[0].id).toBe('qwen-max')
    })

    it('should return supported parameters for each provider', () => {
      const openaiParams = getSupportedParams('openai')
      expect(openaiParams).toContain('temperature')
      expect(openaiParams).toContain('maxTokens')
      expect(openaiParams).toContain('topP')

      const claudeParams = getSupportedParams('claude')
      expect(claudeParams).toContain('temperature')
      expect(claudeParams).toContain('topK')
      expect(claudeParams).toContain('systemPrompt')

      const qwenParams = getSupportedParams('qwen')
      expect(qwenParams).toContain('temperature')
      expect(qwenParams).toContain('topK')
    })

    it('should reset parameters to default values', () => {
      const openaiDefaults = resetParamsToDefault('openai')
      expect(openaiDefaults.temperature).toBe(0.7)
      expect(openaiDefaults.maxTokens).toBe(1000)
      expect(openaiDefaults.topP).toBe(0.9)

      const claudeDefaults = resetParamsToDefault('claude')
      expect(claudeDefaults.temperature).toBe(0.7)
      expect(claudeDefaults.topK).toBe(40)

      const qwenDefaults = resetParamsToDefault('qwen')
      expect(qwenDefaults.temperature).toBe(0.7)
      expect(qwenDefaults.topK).toBe(40)
    })
  })

  describe('API Key Validation', () => {
    it('should validate OpenAI key format', () => {
      expect(validateAPIKey('openai', 'sk-1234567890123456789012345')).toBe(true)
      expect(validateAPIKey('openai', 'invalid-key')).toBe(false)
      expect(validateAPIKey('openai', '')).toBe(false)
      expect(validateAPIKey('openai', 'sk-short')).toBe(false)
    })

    it('should validate Claude key format', () => {
      expect(validateAPIKey('claude', 'sk-ant-1234567890123456789012345')).toBe(true)
      expect(validateAPIKey('claude', 'sk-1234567890123456789012345')).toBe(false)
      expect(validateAPIKey('claude', '')).toBe(false)
    })

    it('should validate Qwen key format', () => {
      expect(validateAPIKey('qwen', '1234567890123456789012345')).toBe(true)
      expect(validateAPIKey('qwen', 'short')).toBe(false)
      expect(validateAPIKey('qwen', '')).toBe(false)
    })
  })

  describe('Activity History', () => {
    it('should add and retrieve activity records', () => {
      addActivityRecord({
        type: 'assessment',
        action: '完成能力评估',
        details: { score: 85 }
      })

      addActivityRecord({
        type: 'goal_set',
        action: '设定学习目标',
        details: { goal: '成为全栈工程师' }
      })

      const history = getActivityHistory()
      
      expect(history).toHaveLength(2)
      expect(history[0].type).toBe('goal_set') // 最新的在前
      expect(history[1].type).toBe('assessment')
      
      // 检查自动生成的字段
      expect(history[0].id).toBeTruthy()
      expect(history[0].timestamp).toBeTruthy()
    })

    it('should limit activity history to 100 records', () => {
      // 添加 105 条记录
      for (let i = 0; i < 105; i++) {
        addActivityRecord({
          type: 'code_run',
          action: `运行代码 ${i}`,
          details: { index: i }
        })
      }

      const history = getActivityHistory()
      expect(history).toHaveLength(100)
      expect(history[0].details?.index).toBe(104) // 最新的
      expect(history[99].details?.index).toBe(5) // 最老的保留的
    })

    it('should clear activity history', () => {
      addActivityRecord({
        type: 'course_view',
        action: '查看课程',
        details: { course: 'Python 基础' }
      })

      expect(getActivityHistory()).toHaveLength(1)
      
      clearActivityHistory()
      
      expect(getActivityHistory()).toHaveLength(0)
    })
  })
}) 