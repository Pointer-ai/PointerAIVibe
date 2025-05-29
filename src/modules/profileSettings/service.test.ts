import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAPIConfig,
  saveAPIConfig,
  validateAPIKey,
  addActivityRecord,
  getActivityHistory,
  clearActivityHistory
} from './service'
import { createProfile, setCurrentProfile } from '../../utils/profile'

describe('ProfileSettings Service', () => {
  beforeEach(() => {
    localStorage.clear()
    // 创建测试用户
    const profile = createProfile('test-user', '123456')
    setCurrentProfile(profile.id)
  })

  describe('API Configuration', () => {
    it('should return default API config when no config exists', () => {
      const config = getAPIConfig()
      expect(config).toEqual({
        model: 'openai',
        key: ''
      })
    })

    it('should save and retrieve API config', () => {
      const testConfig = {
        model: 'claude' as const,
        key: 'sk-ant-test-key'
      }
      
      saveAPIConfig(testConfig)
      const retrieved = getAPIConfig()
      
      expect(retrieved).toEqual(testConfig)
    })

    it('should add activity record when saving API config', () => {
      const testConfig = {
        model: 'openai' as const,
        key: 'sk-test-key'
      }
      
      saveAPIConfig(testConfig)
      const history = getActivityHistory()
      
      expect(history).toHaveLength(1)
      expect(history[0].type).toBe('profile_update')
      expect(history[0].action).toBe('API 配置更新')
      expect(history[0].details?.model).toBe('openai')
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