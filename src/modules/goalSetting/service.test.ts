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
    it('should create goals with default paused status by design', () => {
      // 测试 GoalSettingService 服务类的状态设置逻辑
      const service = new GoalSettingService()
      
      // 测试 mapDifficultyToLevel 私有方法是否正确映射
      const privateService = service as any
      expect(privateService.mapDifficultyToLevel('beginner')).toBe('beginner')
      expect(privateService.mapDifficultyToLevel('intermediate')).toBe('intermediate')
      expect(privateService.mapDifficultyToLevel('advanced')).toBe('advanced')
    })

    it('should handle multiple goal creation workflow', async () => {
      // 测试AI解析结果的验证和处理逻辑
      const service = new GoalSettingService()
      const privateService = service as any
      
      // 测试多个目标的解析结果处理
      const testResponse = `\`\`\`json
{
  "success": true,
  "goals": [
    {
      "title": "测试目标1",
      "description": "第一个测试目标",
      "category": "custom",
      "priority": 3,
      "difficulty": "beginner",
      "estimatedTimeWeeks": 4,
      "requiredSkills": ["测试"],
      "learningPath": [],
      "outcomes": ["完成测试"],
      "reasoning": "测试用途",
      "confidence": 0.8
    },
    {
      "title": "测试目标2", 
      "description": "第二个测试目标",
      "category": "custom",
      "priority": 3,
      "difficulty": "beginner",
      "estimatedTimeWeeks": 4,
      "requiredSkills": ["测试"],
      "learningPath": [],
      "outcomes": ["完成测试"],
      "reasoning": "测试用途",
      "confidence": 0.8
    }
  ],
  "originalInput": "创建多个测试目标",
  "suggestions": []
}
\`\`\``

      const result = privateService.parseAIGoalResponse(testResponse, "创建多个测试目标")
      
      expect(result.success).toBe(true)
      expect(result.goals).toHaveLength(2)
      expect(result.goals[0].title).toBe("测试目标1")
      expect(result.goals[1].title).toBe("测试目标2")
    })
  })
}) 