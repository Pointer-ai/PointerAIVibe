import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeAbility, getCurrentAssessment } from './service'
import { createProfile, setCurrentProfile } from '../../utils/profile'
import * as ai from '../../utils/ai'

// Mock AI service
vi.mock('../../utils/ai', () => ({
  callAI: vi.fn()
}))

// Mock profileSettings service
vi.mock('../profileSettings/service', () => ({
  addActivityRecord: vi.fn()
}))

describe('AbilityAssess Service', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    
    // 创建测试用户
    const profile = createProfile('test-user', '123456')
    setCurrentProfile(profile.id)
  })

  describe('analyzeAbility', () => {
    it('should analyze resume and return assessment', async () => {
      const mockAssessment = {
        overallScore: 75,
        dimensions: {
          programming: {
            score: 80,
            weight: 0.25,
            skills: {
              syntax: 85,
              dataStructures: 80,
              errorHandling: 75,
              codeQuality: 80,
              tooling: 80
            }
          },
          algorithm: {
            score: 70,
            weight: 0.25,
            skills: {
              stringProcessing: 75,
              recursion: 70,
              dynamicProgramming: 65,
              graph: 60,
              tree: 70,
              sorting: 80,
              searching: 75,
              greedy: 65
            }
          },
          project: {
            score: 75,
            weight: 0.20,
            skills: {
              planning: 80,
              architecture: 70,
              implementation: 80,
              testing: 70,
              deployment: 75,
              documentation: 75
            }
          },
          systemDesign: {
            score: 70,
            weight: 0.15,
            skills: {
              scalability: 70,
              reliability: 75,
              performance: 70,
              security: 65,
              databaseDesign: 70
            }
          },
          communication: {
            score: 80,
            weight: 0.15,
            skills: {
              codeReview: 80,
              technicalWriting: 85,
              teamCollaboration: 80,
              mentoring: 75,
              presentation: 80
            }
          }
        },
        metadata: {
          assessmentDate: new Date().toISOString(),
          assessmentMethod: 'resume',
          confidence: 0.85
        },
        report: {
          summary: '候选人展现出良好的编程能力和项目经验',
          strengths: ['编程基本功扎实', '沟通能力出色'],
          improvements: ['算法能力有待提升', '系统设计经验不足'],
          recommendations: ['多练习算法题', '学习系统设计']
        }
      }

      // Mock AI response
      vi.mocked(ai.callAI).mockResolvedValue(
        '```json\n' + JSON.stringify(mockAssessment) + '\n```'
      )

      const input = {
        type: 'resume' as const,
        content: '测试简历内容'
      }

      const result = await analyzeAbility(input)

      expect(result).toBeDefined()
      expect(result.overallScore).toBe(75)
      expect(ai.callAI).toHaveBeenCalledWith(expect.stringContaining('测试简历内容'))
    })

    it('should handle AI response parsing error', async () => {
      vi.mocked(ai.callAI).mockResolvedValue('Invalid JSON response')

      const input = {
        type: 'resume' as const,
        content: '测试简历内容'
      }

      await expect(analyzeAbility(input)).rejects.toThrow('AI 返回格式错误')
    })
  })

  describe('getCurrentAssessment', () => {
    it('should return null when no assessment exists', () => {
      const result = getCurrentAssessment()
      expect(result).toBeNull()
    })

    it('should return saved assessment', async () => {
      // 先进行一次评估
      const mockAssessment = {
        overallScore: 70,
        dimensions: {
          programming: { score: 70, weight: 0.25, skills: {
            syntax: 70, dataStructures: 70, errorHandling: 70, codeQuality: 70, tooling: 70
          }},
          algorithm: { score: 70, weight: 0.25, skills: {
            stringProcessing: 70, recursion: 70, dynamicProgramming: 70, graph: 70, tree: 70, sorting: 70, searching: 70, greedy: 70
          }},
          project: { score: 70, weight: 0.20, skills: {
            planning: 70, architecture: 70, implementation: 70, testing: 70, deployment: 70, documentation: 70
          }},
          systemDesign: { score: 70, weight: 0.15, skills: {
            scalability: 70, reliability: 70, performance: 70, security: 70, databaseDesign: 70
          }},
          communication: { score: 70, weight: 0.15, skills: {
            codeReview: 70, technicalWriting: 70, teamCollaboration: 70, mentoring: 70, presentation: 70
          }}
        },
        metadata: {
          assessmentDate: new Date().toISOString(),
          assessmentMethod: 'resume' as const,
          confidence: 0.8
        },
        report: {
          summary: 'Test',
          strengths: [],
          improvements: [],
          recommendations: []
        }
      }

      vi.mocked(ai.callAI).mockResolvedValue(
        '```json\n' + JSON.stringify(mockAssessment) + '\n```'
      )

      await analyzeAbility({
        type: 'resume',
        content: 'test'
      })

      const saved = getCurrentAssessment()
      expect(saved).toBeDefined()
      expect(saved?.overallScore).toBe(70)
    })
  })
}) 