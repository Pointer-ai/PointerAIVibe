import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoalSettingService } from './service'
import { NaturalLanguageInput } from './types'
import * as ai from '../../utils/ai'

// Mock AI service
vi.mock('../../utils/ai', () => ({
  callAI: vi.fn()
}))

// Mock core data
vi.mock('../coreData', () => ({
  createLearningGoal: vi.fn(),
  getAbilityProfile: vi.fn(),
  getLearningGoals: vi.fn(() => []),
  addCoreEvent: vi.fn()
}))

describe('GoalSettingService', () => {
  let service: GoalSettingService

  beforeEach(() => {
    service = new GoalSettingService()
    vi.clearAllMocks()
  })

  describe('parseNaturalLanguageGoal', () => {
    it('should successfully parse natural language input', async () => {
      const mockAIResponse = `\`\`\`json
{
  "success": true,
  "goals": [
    {
      "title": "Python Excel自动化",
      "description": "学习使用Python自动化处理Excel表格",
      "category": "automation",
      "priority": 4,
      "difficulty": "beginner",
      "estimatedTimeWeeks": 6,
      "requiredSkills": ["Python基础", "Excel操作", "pandas库"],
      "learningPath": [
        {
          "id": "node_1",
          "title": "Python基础语法",
          "description": "学习Python基础语法和数据类型",
          "type": "theory",
          "order": 1,
          "estimatedHours": 8,
          "prerequisites": [],
          "skills": ["Python基础"],
          "resources": []
        }
      ],
      "outcomes": ["能够自动化处理Excel文件", "提高工作效率"],
      "reasoning": "基于用户需求，推荐学习Python Excel自动化",
      "confidence": 0.9
    }
  ],
  "originalInput": "我想学会用Python自动化处理工作表格",
  "suggestions": ["建议从Python基础开始学习"]
}
\`\`\``

      vi.mocked(ai.callAI).mockResolvedValue(mockAIResponse)

      const input: NaturalLanguageInput = {
        description: '我想学会用Python自动化处理工作表格'
      }

      const result = await service.parseNaturalLanguageGoal(input)

      expect(result.success).toBe(true)
      expect(result.goals).toHaveLength(1)
      expect(result.goals[0].title).toBe('Python Excel自动化')
      expect(result.goals[0].category).toBe('automation')
      expect(ai.callAI).toHaveBeenCalledWith(expect.stringContaining('我想学会用Python自动化处理工作表格'))
    })

    it('should handle AI parsing errors gracefully', async () => {
      vi.mocked(ai.callAI).mockResolvedValue('Invalid JSON response')

      const input: NaturalLanguageInput = {
        description: '学习编程'
      }

      const result = await service.parseNaturalLanguageGoal(input)

      expect(result.success).toBe(false)
      expect(result.goals).toHaveLength(0)
      expect(result.parseErrors).toBeDefined()
      expect(result.suggestions).toBeDefined()
    })

    it('should handle AI service errors', async () => {
      vi.mocked(ai.callAI).mockRejectedValue(new Error('AI service error'))

      const input: NaturalLanguageInput = {
        description: '学习编程'
      }

      const result = await service.parseNaturalLanguageGoal(input)

      expect(result.success).toBe(false)
      expect(result.parseErrors).toContain('AI service error')
    })
  })

  describe('parseAIGoalResponse', () => {
    it('should parse valid JSON response', () => {
      const service = new GoalSettingService()
      const validResponse = `\`\`\`json
{
  "success": true,
  "goals": [{
    "title": "Test Goal",
    "description": "Test Description",
    "category": "automation",
    "priority": 3,
    "difficulty": "intermediate",
    "estimatedTimeWeeks": 4,
    "requiredSkills": ["Python"],
    "learningPath": [],
    "outcomes": ["Learn Python"],
    "reasoning": "Good for beginners",
    "confidence": 0.8
  }],
  "originalInput": "test input",
  "suggestions": []
}
\`\`\``

      // 我们需要测试私有方法，这里可以通过类型断言来访问
      const result = (service as any).parseAIGoalResponse(validResponse, 'test input')

      expect(result.success).toBe(true)
      expect(result.goals).toHaveLength(1)
      expect(result.goals[0].title).toBe('Test Goal')
    })
  })

  describe('Goal Creation Bug Fix', () => {
    it('should create goals in paused state to avoid activation limit', async () => {
      const mockCreateLearningGoal = vi.fn().mockReturnValue({
        id: '1',
        title: 'Python自动化基础',
        status: 'paused', // 验证默认状态
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // 重新mock createLearningGoal以验证调用参数
      vi.doMock('../coreData', () => ({
        createLearningGoal: mockCreateLearningGoal,
        getAbilityProfile: vi.fn(),
        getLearningGoals: vi.fn(() => []),
        addCoreEvent: vi.fn()
      }))

      const testGoal = {
        title: "Python自动化基础",
        description: "学习Python基础语法和自动化脚本编写",
        category: "automation",
        priority: 4,
        difficulty: "beginner" as const,
        estimatedTimeWeeks: 8,
        requiredSkills: ["Python", "脚本编程"],
        learningPath: [],
        outcomes: ["能够编写简单的自动化脚本"],
        reasoning: "适合初学者",
        confidence: 0.9
      }

      await service.createGoalFromParsedData(testGoal)

      // 验证createLearningGoal被调用时状态为paused
      expect(mockCreateLearningGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Python自动化基础",
          status: 'paused' // 关键验证：默认为暂停状态
        })
      )
    })

    it('should not trigger activation limit when creating multiple goals', async () => {
      const mockCreateLearningGoal = vi.fn()
        .mockReturnValueOnce({ id: '1', status: 'paused' })
        .mockReturnValueOnce({ id: '2', status: 'paused' })
        .mockReturnValueOnce({ id: '3', status: 'paused' })
        .mockReturnValueOnce({ id: '4', status: 'paused' })
        .mockReturnValueOnce({ id: '5', status: 'paused' })

      vi.doMock('../coreData', () => ({
        createLearningGoal: mockCreateLearningGoal,
        getAbilityProfile: vi.fn(),
        getLearningGoals: vi.fn(() => []),
        addCoreEvent: vi.fn()
      }))

      // 创建5个目标应该都不会失败
      for (let i = 0; i < 5; i++) {
        const testGoal = {
          title: `测试目标${i + 1}`,
          description: `第${i + 1}个测试目标`,
          category: "custom",
          priority: 3,
          difficulty: "beginner" as const,
          estimatedTimeWeeks: 4,
          requiredSkills: ["测试"],
          learningPath: [],
          outcomes: ["完成测试"],
          reasoning: "测试用途",
          confidence: 0.8
        }

        // 应该不会抛出激活限制错误
        await expect(service.createGoalFromParsedData(testGoal)).resolves.not.toThrow()
      }

      // 验证所有目标都以paused状态创建
      expect(mockCreateLearningGoal).toHaveBeenCalledTimes(5)
      for (let i = 0; i < 5; i++) {
        expect(mockCreateLearningGoal).toHaveBeenNthCalledWith(i + 1, 
          expect.objectContaining({
            status: 'paused'
          })
        )
      }
    })
  })
}) 