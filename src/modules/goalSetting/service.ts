import { 
  createLearningGoal, 
  getAbilityProfile, 
  getLearningGoals,
  addCoreEvent
} from '../coreData'
import { getAIResponse } from '../../components/AIAssistant/service'
import { log } from '../../utils/logger'
import { GoalCategory, GoalQuestionnaire, GoalRecommendation } from './types'

/**
 * 预设的目标类别
 */
export const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: 'frontend',
    name: '前端开发',
    description: '学习前端技术，构建用户界面和交互体验',
    icon: '🎨',
    popular: true,
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'TypeScript'],
    estimatedTimeWeeks: 12,
    difficulty: 'beginner'
  },
  {
    id: 'backend',
    name: '后端开发',
    description: '学习服务器端技术，构建API和数据处理',
    icon: '⚙️',
    popular: true,
    skills: ['Python', 'Node.js', 'SQL', 'API设计', '数据库', '服务器'],
    estimatedTimeWeeks: 16,
    difficulty: 'intermediate'
  },
  {
    id: 'fullstack',
    name: '全栈开发',
    description: '掌握前后端技术，成为全能开发者',
    icon: '🚀',
    popular: true,
    skills: ['前端技术栈', '后端技术栈', '数据库', 'DevOps', '项目管理'],
    estimatedTimeWeeks: 24,
    difficulty: 'advanced'
  },
  {
    id: 'automation',
    name: '办公自动化',
    description: '学习Python自动化，提高工作效率',
    icon: '🤖',
    popular: true,
    skills: ['Python', '数据处理', 'Excel自动化', '爬虫', '脚本编程'],
    estimatedTimeWeeks: 8,
    difficulty: 'beginner'
  },
  {
    id: 'ai',
    name: 'AI与机器学习',
    description: '探索人工智能和机器学习技术',
    icon: '🧠',
    popular: false,
    skills: ['Python', '机器学习', '深度学习', '数据科学', 'TensorFlow'],
    estimatedTimeWeeks: 20,
    difficulty: 'advanced'
  },
  {
    id: 'mobile',
    name: '移动开发',
    description: '开发iOS和Android移动应用',
    icon: '📱',
    popular: false,
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', '移动UI'],
    estimatedTimeWeeks: 18,
    difficulty: 'intermediate'
  },
  {
    id: 'game',
    name: '游戏开发',
    description: '学习游戏编程和游戏引擎',
    icon: '🎮',
    popular: false,
    skills: ['Unity', 'C#', '游戏设计', '3D建模', '游戏物理'],
    estimatedTimeWeeks: 22,
    difficulty: 'intermediate'
  },
  {
    id: 'data',
    name: '数据分析',
    description: '学习数据分析和可视化技能',
    icon: '📊',
    popular: false,
    skills: ['Python', 'SQL', '数据可视化', '统计学', 'Pandas'],
    estimatedTimeWeeks: 14,
    difficulty: 'intermediate'
  }
]

/**
 * 目标设定问卷
 */
export const GOAL_QUESTIONNAIRE: GoalQuestionnaire[] = [
  {
    id: 'experience_level',
    question: '你的编程经验如何？',
    type: 'single',
    options: ['完全零基础', '有一些基础', '有一定经验', '比较熟练'],
    required: true
  },
  {
    id: 'learning_time',
    question: '你每周能投入多少时间学习？',
    type: 'single',
    options: ['少于5小时', '5-10小时', '10-20小时', '20小时以上'],
    required: true
  },
  {
    id: 'learning_goal',
    question: '你的学习目标是什么？',
    type: 'multiple',
    options: ['找工作', '提升技能', '兴趣爱好', '创业项目', '学术研究'],
    required: true
  },
  {
    id: 'project_preference',
    question: '你更喜欢哪种学习方式？',
    type: 'multiple',
    options: ['理论学习', '动手实践', '项目驱动', '团队协作'],
    required: false
  },
  {
    id: 'career_direction',
    question: '你希望在哪个方向发展？',
    type: 'text',
    required: false
  }
]

export class GoalSettingService {
  constructor() {
    // 移除AI服务实例化
  }

  /**
   * 获取目标类别列表
   */
  getCategories(): GoalCategory[] {
    return GOAL_CATEGORIES
  }

  /**
   * 获取问卷题目
   */
  getQuestionnaire(): GoalQuestionnaire[] {
    return GOAL_QUESTIONNAIRE
  }

  /**
   * 基于用户输入生成目标推荐
   */
  async generateGoalRecommendations(
    selectedCategories: string[],
    questionnaireAnswers: Record<string, any>
  ): Promise<GoalRecommendation[]> {
    try {
      const abilityProfile = getAbilityProfile()
      const existingGoals = getLearningGoals()

      // 构建推荐提示词
      const prompt = this.buildRecommendationPrompt(
        selectedCategories,
        questionnaireAnswers,
        abilityProfile,
        existingGoals
      )

      // 调用AI生成推荐
      const response = await getAIResponse(prompt)
      
      // 解析AI响应
      const recommendations = this.parseRecommendations(response)

      // 记录推荐事件
      addCoreEvent({
        type: 'goal_recommendation_generated',
        details: {
          selectedCategories,
          questionnaireAnswers,
          recommendationCount: recommendations.length
        }
      })

      log('[GoalSetting] Generated recommendations:', recommendations.length)
      return recommendations

    } catch (error) {
      log('[GoalSetting] Failed to generate recommendations:', error)
      
      // 返回基于规则的兜底推荐
      return this.getFallbackRecommendations(selectedCategories, questionnaireAnswers)
    }
  }

  /**
   * 创建学习目标
   */
  async createGoal(recommendation: GoalRecommendation): Promise<void> {
    try {
      const goal = createLearningGoal({
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category as any,
        priority: recommendation.priority,
        targetLevel: this.inferTargetLevel(recommendation),
        estimatedTimeWeeks: recommendation.estimatedTimeWeeks,
        requiredSkills: recommendation.requiredSkills,
        outcomes: recommendation.outcomes,
        status: 'active'
      })

      log('[GoalSetting] Goal created:', goal.title)

    } catch (error) {
      log('[GoalSetting] Failed to create goal:', error)
      throw error
    }
  }

  // ========== 私有方法 ==========

  private buildRecommendationPrompt(
    categories: string[],
    answers: Record<string, any>,
    ability: any,
    existingGoals: any[]
  ): string {
    return `作为编程学习顾问，请根据以下信息为用户推荐3个最合适的学习目标：

用户选择的感兴趣领域：${categories.join('、')}

问卷回答：
- 编程经验：${answers.experience_level || '未填写'}
- 学习时间：${answers.learning_time || '未填写'}
- 学习目标：${Array.isArray(answers.learning_goal) ? answers.learning_goal.join('、') : answers.learning_goal || '未填写'}
- 学习偏好：${Array.isArray(answers.project_preference) ? answers.project_preference.join('、') : answers.project_preference || '未填写'}
- 职业方向：${answers.career_direction || '未填写'}

${ability ? `用户能力评估：
- 总体分数：${ability.overallScore}/10
- 主要维度：${Object.entries(ability.dimensions).map(([dim, data]: [string, any]) => `${dim}: ${data.score}/10`).join('、')}
` : '用户尚未完成能力评估'}

${existingGoals.length > 0 ? `已有目标：${existingGoals.map((g: any) => g.title).join('、')}` : '暂无现有目标'}

请以JSON格式返回推荐结果，每个推荐包含：
- category: 类别ID
- title: 目标标题（不超过20字）
- description: 详细描述（100-200字）
- priority: 优先级（1-5）
- reasoning: 推荐理由（50-100字）
- estimatedTimeWeeks: 预计学习周数
- requiredSkills: 需要掌握的技能列表
- outcomes: 学习成果列表

请确保推荐符合用户当前水平，循序渐进，实用性强。`
  }

  private parseRecommendations(response: string): GoalRecommendation[] {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 如果无法解析JSON，返回空数组
      return []
    } catch (error) {
      log('[GoalSetting] Failed to parse AI response:', error)
      return []
    }
  }

  private getFallbackRecommendations(
    categories: string[],
    answers: Record<string, any>
  ): GoalRecommendation[] {
    // 基于规则的兜底推荐逻辑
    const recommendations: GoalRecommendation[] = []

    categories.slice(0, 3).forEach((categoryId, index) => {
      const category = GOAL_CATEGORIES.find(c => c.id === categoryId)
      if (category) {
        recommendations.push({
          category: categoryId,
          title: `${category.name}入门之路`,
          description: category.description,
          priority: 5 - index,
          reasoning: '基于您选择的学习方向推荐',
          estimatedTimeWeeks: category.estimatedTimeWeeks,
          requiredSkills: category.skills.slice(0, 5),
          outcomes: [`掌握${category.name}基础技能`, '完成实际项目', '具备就业竞争力']
        })
      }
    })

    return recommendations
  }

  private inferTargetLevel(recommendation: GoalRecommendation): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // 根据推荐内容推断目标级别
    if (recommendation.estimatedTimeWeeks <= 10) return 'beginner'
    if (recommendation.estimatedTimeWeeks <= 18) return 'intermediate'
    if (recommendation.estimatedTimeWeeks <= 25) return 'advanced'
    return 'expert'
  }
} 