import { 
  getCourseUnits,
  createCourseUnit,
  updateCourseUnit,
  addCoreEvent,
  agentToolExecutor
} from '../coreData'
import { getAIResponse } from '../../components/AIAssistant/service'
import { log } from '../../utils/logger'
import { 
  ContentGenerationConfig, 
  Exercise, 
  ProjectTemplate, 
  AssessmentResult,
  CourseProgress 
} from './types'

export class CourseContentService {

  /**
   * 为路径节点生成课程内容
   */
  async generateCourseContent(
    nodeId: string, 
    config: ContentGenerationConfig
  ): Promise<any> {
    try {
      // 构建内容生成提示词
      const prompt = this.buildContentGenerationPrompt(nodeId, config)
      
      // 调用AI生成内容
      const aiResponse = await getAIResponse(prompt)
      const contentStructure = this.parseContentStructure(aiResponse)

      // 使用Agent工具创建课程单元
      const unit = await agentToolExecutor.executeTool('create_course_unit', {
        nodeId,
        title: contentStructure.title || '课程单元',
        description: contentStructure.description || 'AI生成的课程内容',
        type: config.contentType,
        content: contentStructure.content || {},
        metadata: {
          difficulty: config.difficulty,
          estimatedTime: contentStructure.estimatedTime || 60,
          keywords: contentStructure.keywords || [],
          learningObjectives: contentStructure.learningObjectives || []
        }
      })

      // 记录内容生成事件
      addCoreEvent({
        type: 'course_content_generated',
        details: {
          nodeId,
          unitId: unit.id,
          contentType: config.contentType,
          difficulty: config.difficulty,
          config
        }
      })

      log('[CourseContent] Course content generated for node:', nodeId)
      return unit

    } catch (error) {
      log('[CourseContent] Failed to generate course content:', error)
      throw error
    }
  }

  /**
   * 生成练习题
   */
  async generateExercises(
    unitId: string, 
    count: number = 3,
    difficulty: number = 3
  ): Promise<Exercise[]> {
    try {
      const unit = getCourseUnits().find(u => u.id === unitId)
      if (!unit) {
        throw new Error('Course unit not found')
      }

      const prompt = this.buildExerciseGenerationPrompt(unit, count, difficulty)
      const response = await getAIResponse(prompt)
      const exercises = this.parseExercises(response)

      // 记录练习生成事件
      addCoreEvent({
        type: 'exercises_generated',
        details: {
          unitId,
          exerciseCount: exercises.length,
          difficulty
        }
      })

      log('[CourseContent] Exercises generated:', exercises.length)
      return exercises

    } catch (error) {
      log('[CourseContent] Failed to generate exercises:', error)
      return []
    }
  }

  /**
   * 生成项目模板
   */
  async generateProject(
    nodeId: string,
    requirements: string[]
  ): Promise<ProjectTemplate> {
    try {
      const prompt = this.buildProjectGenerationPrompt(nodeId, requirements)
      const response = await getAIResponse(prompt)
      const project = this.parseProject(response)

      // 记录项目生成事件
      addCoreEvent({
        type: 'project_generated',
        details: {
          nodeId,
          projectTitle: project.title,
          difficulty: project.difficulty,
          technologies: project.technologies
        }
      })

      log('[CourseContent] Project template generated:', project.title)
      return project

    } catch (error) {
      log('[CourseContent] Failed to generate project:', error)
      throw error
    }
  }

  /**
   * 评估学习进度
   */
  async assessLearning(
    unitId: string,
    userAnswers: Record<string, any>
  ): Promise<AssessmentResult> {
    try {
      const unit = getCourseUnits().find(u => u.id === unitId)
      if (!unit) {
        throw new Error('Course unit not found')
      }

      const prompt = this.buildAssessmentPrompt(unit, userAnswers)
      const response = await getAIResponse(prompt)
      const result = this.parseAssessmentResult(response, unitId)

      // 记录评估事件
      addCoreEvent({
        type: 'learning_assessed',
        details: {
          unitId,
          score: result.score,
          maxScore: result.maxScore,
          percentage: Math.round((result.score / result.maxScore) * 100)
        }
      })

      log('[CourseContent] Learning assessed for unit:', unitId, 'Score:', result.score)
      return result

    } catch (error) {
      log('[CourseContent] Failed to assess learning:', error)
      throw error
    }
  }

  /**
   * 个性化内容推荐
   */
  async recommendContent(
    userId: string,
    learningHistory: any[]
  ): Promise<string[]> {
    try {
      const prompt = this.buildRecommendationPrompt(userId, learningHistory)
      const response = await getAIResponse(prompt)
      const recommendations = this.parseRecommendations(response)

      log('[CourseContent] Content recommendations generated:', recommendations.length)
      return recommendations

    } catch (error) {
      log('[CourseContent] Failed to generate recommendations:', error)
      return []
    }
  }

  /**
   * 获取学习进度
   */
  getLearningProgress(unitId: string): CourseProgress | null {
    // 这里应该从localStorage或coreData获取进度
    // 简化实现，返回模拟数据
    return {
      unitId,
      completedSections: ['introduction', 'theory'],
      currentSection: 'practice',
      score: 85,
      timeSpent: 45,
      startedAt: new Date(Date.now() - 86400000).toISOString(), // 1天前
      lastActivity: new Date().toISOString()
    }
  }

  // ========== 私有方法 ==========

  private buildContentGenerationPrompt(
    nodeId: string, 
    config: ContentGenerationConfig
  ): string {
    return `作为课程内容设计专家，请为学习节点生成高质量的课程内容：

节点ID：${nodeId}
内容类型：${config.contentType}
难度等级：${config.difficulty}/5
学习风格：${config.learningStyle}
包含示例：${config.includeExamples ? '是' : '否'}
包含练习：${config.includeExercises ? '是' : '否'}
语言：${config.language === 'chinese' ? '中文' : '英文'}

请生成以下结构的课程内容（JSON格式）：
{
  "title": "课程标题",
  "description": "课程描述",
  "estimatedTime": 60,
  "learningObjectives": ["学习目标1", "学习目标2"],
  "keywords": ["关键词1", "关键词2"],
  "content": {
    ${config.contentType === 'theory' ? `
    "markdown": "理论内容的Markdown格式文本，包含：
    - 概念解释
    - 原理阐述  
    - 实际应用
    - 注意事项"
    ` : ''}
    ${config.contentType === 'example' ? `
    "markdown": "示例说明",
    "code": {
      "language": "编程语言",
      "source": "示例代码",
      "explanation": "代码解释"
    }
    ` : ''}
    ${config.contentType === 'exercise' ? `
    "exercises": [
      {
        "question": "题目描述",
        "type": "single|multiple|code",
        "options": ["选项1", "选项2"],
        "correctAnswer": "正确答案",
        "explanation": "解题思路"
      }
    ]
    ` : ''}
    ${config.contentType === 'project' ? `
    "project": {
      "requirements": ["需求1", "需求2"],
      "starter": "起始代码",
      "solution": "参考解决方案",
      "evaluation": "评估标准"
    }
    ` : ''}
    ${config.contentType === 'quiz' ? `
    "quiz": {
      "questions": [
        {
          "id": "q1",
          "type": "single",
          "question": "题目",
          "options": ["A选项", "B选项"],
          "correctAnswer": "A",
          "explanation": "解释"
        }
      ]
    }
    ` : ''}
  }
}

要求：
1. 内容准确、易懂
2. 符合指定难度等级
3. 包含实际应用场景
4. 提供足够的练习机会
5. 适合中国学习者的习惯`
  }

  private buildExerciseGenerationPrompt(
    unit: any, 
    count: number, 
    difficulty: number
  ): string {
    return `基于课程单元生成${count}道练习题：

课程标题：${unit.title}
课程描述：${unit.description}
难度要求：${difficulty}/5

请生成多样化的练习题（JSON数组格式）：
[
  {
    "id": "exercise_1",
    "type": "coding|multiple-choice|fill-blank",
    "title": "练习标题",
    "description": "练习说明",
    "difficulty": ${difficulty},
    "estimatedTime": 15,
    "content": {
      "question": "题目描述",
      "options": ["选项1", "选项2"] (选择题),
      "correctAnswer": "正确答案",
      "code": {
        "starter": "起始代码",
        "solution": "标准答案",
        "language": "编程语言",
        "tests": "测试用例"
      } (编程题),
      "hints": ["提示1", "提示2"],
      "explanation": "详细解释"
    },
    "metadata": {
      "skills": ["涉及技能"],
      "concepts": ["相关概念"],
      "prerequisites": ["前置知识"]
    }
  }
]

要求：
1. 题目类型多样化
2. 难度递进合理
3. 包含详细解释
4. 提供适当提示`
  }

  private buildProjectGenerationPrompt(
    nodeId: string, 
    requirements: string[]
  ): string {
    return `为学习节点设计实战项目：

节点ID：${nodeId}
项目要求：${requirements.join('、')}

请设计一个完整的项目模板（JSON格式）：
{
  "id": "project_${nodeId}",
  "title": "项目标题",
  "description": "项目描述和背景",
  "difficulty": 3,
  "estimatedHours": 8,
  "category": "项目类别",
  "technologies": ["技术1", "技术2"],
  "requirements": [
    "功能需求1",
    "功能需求2",
    "技术需求1"
  ],
  "deliverables": [
    "交付物1",
    "交付物2"
  ],
  "evaluation": {
    "criteria": ["评估标准1", "评估标准2"],
    "rubric": {
      "功能完整性": 40,
      "代码质量": 30,
      "用户体验": 20,
      "创新性": 10
    }
  },
  "resources": [
    {
      "type": "tutorial",
      "title": "相关教程",
      "description": "教程说明"
    }
  ]
}

要求：
1. 项目实用性强
2. 难度适中
3. 有明确的评估标准
4. 提供充分的资源支持`
  }

  private buildAssessmentPrompt(unit: any, userAnswers: Record<string, any>): string {
    return `评估学习者的学习成果：

课程单元：${unit.title}
学习目标：${unit.metadata?.learningObjectives?.join('、') || '未知'}
用户答案：${JSON.stringify(userAnswers)}

请提供详细的评估结果（JSON格式）：
{
  "score": 85,
  "maxScore": 100,
  "feedback": "总体评价和建议",
  "strengths": ["优势1", "优势2"],
  "improvements": ["需要改进的地方1", "需要改进的地方2"],
  "nextSteps": ["下一步学习建议1", "下一步学习建议2"]
}

评估要求：
1. 客观公正
2. 建设性反馈
3. 具体可操作的建议
4. 鼓励性语言`
  }

  private buildRecommendationPrompt(userId: string, learningHistory: any[]): string {
    return `基于学习历史推荐个性化内容：

用户ID：${userId}
学习历史：${JSON.stringify(learningHistory.slice(-10))} // 最近10条记录

请推荐5个最适合的学习内容，以JSON数组格式返回内容标题。`
  }

  private parseContentStructure(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return {}
    } catch (error) {
      log('[CourseContent] Failed to parse content structure:', error)
      return {}
    }
  }

  private parseExercises(response: string): Exercise[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch (error) {
      log('[CourseContent] Failed to parse exercises:', error)
      return []
    }
  }

  private parseProject(response: string): ProjectTemplate {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('Failed to parse project')
    } catch (error) {
      log('[CourseContent] Failed to parse project:', error)
      // 返回默认项目模板
      return {
        id: 'default_project',
        title: '实战练习项目',
        description: 'AI生成的实战练习项目',
        difficulty: 3,
        estimatedHours: 8,
        category: '综合实践',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        requirements: ['实现基本功能', '确保代码质量'],
        deliverables: ['完整代码', '使用说明'],
        evaluation: {
          criteria: ['功能完整性', '代码质量'],
          rubric: { '功能完整性': 70, '代码质量': 30 }
        },
        resources: []
      }
    }
  }

  private parseAssessmentResult(response: string, unitId: string): AssessmentResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          unitId,
          score: parsed.score || 0,
          maxScore: parsed.maxScore || 100,
          feedback: parsed.feedback || '评估完成',
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          nextSteps: parsed.nextSteps || [],
          timestamp: new Date().toISOString()
        }
      }
      throw new Error('Failed to parse assessment result')
    } catch (error) {
      log('[CourseContent] Failed to parse assessment result:', error)
      return {
        unitId,
        score: 75,
        maxScore: 100,
        feedback: '评估已完成，继续加油！',
        strengths: ['基础知识掌握良好'],
        improvements: ['需要更多实践'],
        nextSteps: ['继续下一个学习单元'],
        timestamp: new Date().toISOString()
      }
    }
  }

  private parseRecommendations(response: string): string[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch (error) {
      log('[CourseContent] Failed to parse recommendations:', error)
      return []
    }
  }
} 