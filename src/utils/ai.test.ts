import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI } from './ai'
import * as profileSettingsService from '../modules/profileSettings/service'

// Mock fetch
global.fetch = vi.fn()

// Mock profileSettings service
vi.mock('../modules/profileSettings/service', () => ({
  getAPIConfig: vi.fn()
}))

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when API key is not configured', async () => {
    vi.mocked(profileSettingsService.getAPIConfig).mockReturnValue({
      model: 'openai',
      key: '',
      specificModel: 'gpt-4',
      params: {}
    })

    await expect(callAI('test prompt')).rejects.toThrow('请先配置 API Key')
  })

  it('should call OpenAI API correctly', async () => {
    vi.mocked(profileSettingsService.getAPIConfig).mockReturnValue({
      model: 'openai',
      key: 'test-key',
      specificModel: 'gpt-4',
      params: { temperature: 0.7, maxTokens: 2000 }
    })

    const mockResponse = {
      choices: [{ message: { content: 'AI response' } }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const result = await callAI('test prompt')

    expect(result).toBe('AI response')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    )
  })

  it('should call Claude API correctly', async () => {
    vi.mocked(profileSettingsService.getAPIConfig).mockReturnValue({
      model: 'claude',
      key: 'test-key',
      specificModel: 'claude-3-sonnet',
      params: { temperature: 0.7, systemPrompt: 'You are helpful.' }
    })

    const mockResponse = {
      content: [{ text: 'Claude response' }],
      usage: {
        input_tokens: 10,
        output_tokens: 20
      }
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const result = await callAI('test prompt')

    expect(result).toBe('Claude response')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-key'
        })
      })
    )
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(profileSettingsService.getAPIConfig).mockReturnValue({
      model: 'openai',
      key: 'test-key',
      specificModel: 'gpt-4',
      params: {}
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'API error' } })
    } as Response)

    await expect(callAI('test prompt')).rejects.toThrow('AI 调用失败: OpenAI API error: API error')
  })
}) 