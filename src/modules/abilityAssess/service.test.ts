import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeAbility, getCurrentProfile } from './service'
import * as storage from '../../utils/storage'
import * as aiClient from '../../utils/aiClient'

// Mock 依赖
vi.mock('../../utils/storage')
vi.mock('../../utils/aiClient')
vi.mock('../../utils/logger')

describe('abilityAssess service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeAbility', () => {
    it('应该调用 AI 分析并保存结果', async () => {
      // 准备测试数据
      const resumeText = '我是一名初级前端开发者'
      const mockAIResponse = {
        content: '分析结果：初级水平',
        model: 'openai' as const,
      }

      // 设置 mock 返回值
      vi.mocked(aiClient.callAI).mockResolvedValue(mockAIResponse)

      // 执行测试
      const result = await analyzeAbility(resumeText)

      // 验证结果
      expect(result).toBe('分析结果：初级水平')
      expect(aiClient.callAI).toHaveBeenCalledWith({
        prompt: expect.stringContaining(resumeText)
      })
      expect(storage.updateState).toHaveBeenCalledWith({
        profile: {
          resume: resumeText,
          level: 'beginner'
        }
      })
    })

    it('应该处理 AI 错误', async () => {
      // 设置 mock 返回错误
      vi.mocked(aiClient.callAI).mockResolvedValue({
        content: '',
        model: 'openai',
        error: 'API 调用失败'
      })

      // 验证抛出错误
      await expect(analyzeAbility('test')).rejects.toThrow('API 调用失败')
    })
  })

  describe('getCurrentProfile', () => {
    it('应该返回当前用户档案', () => {
      const mockProfile = {
        name: 'Test User',
        level: 'beginner' as const
      }
      
      vi.mocked(storage.getState).mockReturnValue({
        profile: mockProfile,
        goal: null,
        path: [],
        lessons: {},
        apiConfig: { model: 'openai', key: '' }
      })

      const profile = getCurrentProfile()
      expect(profile).toEqual(mockProfile)
    })
  })
}) 