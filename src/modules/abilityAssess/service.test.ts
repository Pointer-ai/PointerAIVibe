import { describe, it, expect, beforeEach, vi } from 'vitest'
import { analyzeAbility, getCurrentAssessment, generateImprovementPlan } from './service'
import * as aiClient from '../../utils/aiClient'
import * as profile from '../../utils/profile'
import { AssessmentInput, AbilityAssessment } from './types'

// Mock dependencies
vi.mock('../../utils/aiClient')
vi.mock('../../utils/profile')
vi.mock('../../utils/logger')

describe('abilityAssess/service', () => {
  const mockAssessment: AbilityAssessment = {
    overallScore: 65,
    dimensions: {
      programming: {
        score: 70,
        weight: 0.25,
        skills: {
          syntax: 80,
          dataStructures: 70,
          errorHandling: 65,
          codeQuality: 70,
          tooling: 65
        }
      },
      algorithm: {
        score: 60,
        weight: 0.25,
        skills: {
          stringProcessing: 70,
          recursion: 55,
          dynamicProgramming: 40,
          graph: 45,
          tree: 60,
          sorting: 75,
          searching: 70,
          greedy: 65
        }
      },
      project: {
        score: 65,
        weight: 0.20,
        skills: {
          planning: 70,
          architecture: 60,
          implementation: 70,
          testing: 60,
          deployment: 55,
          documentation: 70
        }
      },
      systemDesign: {
        score: 60,
        weight: 0.15,
        skills: {
          scalability: 55,
          reliability: 60,
          performance: 65,
          security: 55,
          databaseDesign: 65
        }
      },
      communication: {
        score: 70,
        weight: 0.15,
        skills: {
          codeReview: 70,
          technicalWriting: 75,
          teamCollaboration: 75,
          mentoring: 60,
          presentation: 70
        }
      }
    },
    metadata: {
      assessmentDate: new Date().toISOString(),
      assessmentMethod: 'resume',
      confidence: 0.85
    },
    report: {
      summary: '候选人具有中级开发者水平，基础扎实但算法能力需要加强',
      strengths: ['编程基础扎实', '团队协作能力强'],
      improvements: ['算法能力需要提升', '系统设计经验不足'],
      recommendations: ['多刷算法题', '参与开源项目']
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(profile.getProfileData).mockReturnValue(null)
    vi.mocked(profile.setProfileData).mockImplementation(() => {})
  })

  describe('analyzeAbility', () => {
    it('should analyze ability from resume text', async () => {
      const input: AssessmentInput = {
        type: 'resume',
        content: '我是一名有3年经验的前端开发工程师...'
      }

      const mockAIResponse = {
        content: `分析结果：
\`\`\`json
${JSON.stringify(mockAssessment, null, 2)}
\`\`\``,
        model: 'openai' as const,
        error: undefined
      }

      vi.mocked(aiClient.callAI).mockResolvedValueOnce(mockAIResponse)

      const result = await analyzeAbility(input)

      expect(result).toMatchObject({
        overallScore: expect.any(Number),
        dimensions: expect.any(Object),
        metadata: expect.any(Object),
        report: expect.any(Object)
      })
      expect(vi.mocked(profile.setProfileData)).toHaveBeenCalledWith('abilityAssessment', expect.any(Object))
    })

    it('should throw error when AI returns invalid JSON', async () => {
      const input: AssessmentInput = {
        type: 'resume',
        content: 'test resume'
      }

      vi.mocked(aiClient.callAI).mockResolvedValueOnce({
        content: 'Invalid response without JSON',
        model: 'openai' as const,
        error: undefined
      })

      await expect(analyzeAbility(input)).rejects.toThrow('AI 返回格式错误')
    })
  })

  describe('getCurrentAssessment', () => {
    it('should return null when no assessment exists', () => {
      vi.mocked(profile.getProfileData).mockReturnValueOnce(null)
      
      const result = getCurrentAssessment()
      
      expect(result).toBeNull()
    })

    it('should return existing assessment', () => {
      vi.mocked(profile.getProfileData).mockReturnValueOnce(mockAssessment)
      
      const result = getCurrentAssessment()
      
      expect(result).toEqual(mockAssessment)
    })
  })

  describe('generateImprovementPlan', () => {
    it('should generate improvement plan based on assessment', async () => {
      const mockPlan = '### 30天提升计划\n\n第一周：算法基础...'
      
      vi.mocked(aiClient.callAI).mockResolvedValueOnce({
        content: mockPlan,
        model: 'openai' as const,
        error: undefined
      })

      const result = await generateImprovementPlan(mockAssessment)

      expect(result).toBe(mockPlan)
      expect(vi.mocked(aiClient.callAI)).toHaveBeenCalledWith({
        prompt: expect.stringContaining('30 天提升计划')
      })
    })
  })
}) 