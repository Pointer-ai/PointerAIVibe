import { 
  createLearningGoal, 
  getAbilityProfile, 
  getLearningGoals,
  addCoreEvent
} from '../coreData'
import { LearningGoal } from '../coreData/types'
import { callAI } from '../../utils/ai'
import { log, error } from '../../utils/logger'
import { 
  GoalCategory, 
  GoalQuestionnaire, 
  GoalRecommendation,
  NaturalLanguageInput,
  ParsedGoalData,
  AIGoalParseResult
} from './types'
import { 
  generateNaturalLanguageGoalPrompt,
  cleanupGoalJSONString,
  validateAndFixGoalParseResult
} from './prompt'

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
   * 基于自然语言解析生成学习目标
   */
  async parseNaturalLanguageGoal(input: NaturalLanguageInput): Promise<AIGoalParseResult> {
    log('[GoalSetting] Starting natural language goal parsing')
    
    try {
      // 获取用户能力概况作为上下文
      const userProfile = getAbilityProfile()
      
      // 生成AI提示词
      const prompt = generateNaturalLanguageGoalPrompt(input.description, userProfile)
      
      // 调用AI服务
      const aiResponse = await callAI(prompt)
      
      log('[GoalSetting] AI response received, parsing...')
      
      // 解析AI响应
      const parseResult = this.parseAIGoalResponse(aiResponse, input.description)
      
      // 记录解析事件
      addCoreEvent({
        type: 'natural_language_goal_parsed',
        details: {
          originalInput: input.description,
          parseSuccess: parseResult.success,
          goalCount: parseResult.goals.length,
          confidence: parseResult.goals.reduce((sum, goal) => sum + goal.confidence, 0) / parseResult.goals.length
        }
      })
      
      log('[GoalSetting] Natural language parsing completed successfully')
      return parseResult
      
    } catch (err) {
      error('[GoalSetting] Failed to parse natural language goal:', err)
      
      // 返回失败结果，包含基本的错误处理
      return {
        success: false,
        goals: [],
        originalInput: input.description,
        parseErrors: [err instanceof Error ? err.message : '解析失败'],
        suggestions: [
          '请尝试更具体地描述你的学习目标',
          '可以包含想要学习的技术或想要达成的具体效果',
          '例如："我想学会用Python自动化处理Excel表格"'
        ]
      }
    }
  }

  /**
   * 将解析出的目标转换为学习目标
   */
  async createGoalFromParsedData(parsedGoal: ParsedGoalData): Promise<void> {
    try {
      // 构建学习目标对象 - 默认为paused状态，让用户选择激活
      const learningGoal: Omit<LearningGoal, 'id' | 'createdAt' | 'updatedAt'> = {
        title: parsedGoal.title,
        description: parsedGoal.description,
        category: parsedGoal.category as any,
        priority: parsedGoal.priority,
        targetLevel: this.mapDifficultyToLevel(parsedGoal.difficulty) as any,
        estimatedTimeWeeks: parsedGoal.estimatedTimeWeeks,
        requiredSkills: parsedGoal.requiredSkills,
        outcomes: parsedGoal.outcomes,
        status: 'paused' // 默认为暂停状态，避免激活限制
      }

      // 创建学习目标
      await createLearningGoal(learningGoal)
      
      // 记录创建事件，包含AI生成的元数据
      addCoreEvent({
        type: 'goal_created_from_natural_language',
        details: {
          goalTitle: parsedGoal.title,
          category: parsedGoal.category,
          estimatedWeeks: parsedGoal.estimatedTimeWeeks,
          pathNodeCount: parsedGoal.learningPath.length,
          aiMetadata: {
            source: 'natural_language',
            aiGenerated: true,
            confidence: parsedGoal.confidence,
            reasoning: parsedGoal.reasoning,
            learningPath: parsedGoal.learningPath
          }
        }
      })
      
      log('[GoalSetting] Goal created from parsed data:', parsedGoal.title)
      
    } catch (err) {
      error('[GoalSetting] Failed to create goal from parsed data:', err)
      throw err
    }
  }

  /**
   * 私有方法：解析AI目标响应
   */
  private parseAIGoalResponse(aiResponse: string, originalInput: string): AIGoalParseResult {
    log('[parseAIGoalResponse] Starting goal response parsing')
    
    try {
      // 使用与评测系统相同的强健解析逻辑
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
      let rawJson = ''
      
      if (!jsonMatch) {
        log('[parseAIGoalResponse] Standard JSON format not found, trying alternative formats')
        
        // 尝试其他格式的 JSON 提取
        const altJsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                            aiResponse.match(/```\s*\{[\s\S]*?\}\s*```/) ||
                            aiResponse.match(/\{[\s\S]*\}/)
        
        if (altJsonMatch) {
          log('[parseAIGoalResponse] Found JSON in alternative format')
          rawJson = altJsonMatch[1] || altJsonMatch[0]
        } else {
          error('[parseAIGoalResponse] No valid JSON format found in AI response')
          throw new Error('AI响应格式错误 - 未找到有效的JSON格式')
        }
      } else {
        log('[parseAIGoalResponse] Using standard JSON format')
        rawJson = jsonMatch[1]
      }
      
      // 清理JSON
      const cleanJson = cleanupGoalJSONString(rawJson.trim())
      
      // 解析JSON
      const result = JSON.parse(cleanJson)
      log('[parseAIGoalResponse] JSON parsing successful')
      
      // 验证和修复数据结构
      const validatedResult = validateAndFixGoalParseResult(result)
      
      // 确保originalInput字段正确
      validatedResult.originalInput = originalInput
      
      log('[parseAIGoalResponse] Goal response validation successful')
      
      return validatedResult
      
    } catch (err) {
      error('[parseAIGoalResponse] Failed to parse AI goal response:', err)
      
      // 提供更详细的错误信息和兜底策略
      if (err instanceof SyntaxError) {
        log('[parseAIGoalResponse] JSON syntax error. Providing fallback structure...')
        
        // 尝试提供一个最小的可用结构
        return {
          success: false,
          goals: [],
          originalInput,
          parseErrors: ['JSON格式错误: ' + err.message],
          suggestions: [
            '请尝试重新描述你的目标，使用更简单明确的语言',
            '可以分步骤描述，比如：第一步学什么，第二步做什么',
            '参考示例：我想学会Python编程，用来自动化处理工作中的数据'
          ]
        }
      }
      
      throw new Error('解析AI目标响应失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 私有方法：映射难度等级
   */
  private mapDifficultyToLevel(difficulty: string): string {
    const mapping: Record<string, string> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate', 
      'advanced': 'advanced'
    }
    return mapping[difficulty] || 'intermediate'
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
      const response = await callAI(prompt)
      
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
        status: 'paused' // 默认为暂停状态，让用户选择激活
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
    let abilityAnalysis = ''
    
    if (ability) {
      // 构建详细的5维度能力分析
      const dimensionAnalysis = Object.entries(ability.dimensions).map(([dimensionName, data]: [string, any]) => {
        const dimensionInfo = this.getDimensionDisplayInfo(dimensionName)
        const levelDescription = this.getScoreLevelDescription(data.score)
        
        // 找出该维度下的薄弱技能
        const weakSkills = Object.entries(data.skills || {})
          .filter(([_, skillData]: [string, any]) => {
            const score = typeof skillData === 'number' ? skillData : skillData.score
            return score < data.score - 10 // 低于维度平均分10分以上的技能
          })
          .map(([skillName]) => skillName)
          .slice(0, 3)
        
        // 找出该维度下的强项技能
        const strongSkills = Object.entries(data.skills || {})
          .filter(([_, skillData]: [string, any]) => {
            const score = typeof skillData === 'number' ? skillData : skillData.score
            return score > data.score + 10 // 高于维度平均分10分以上的技能
          })
          .map(([skillName]) => skillName)
          .slice(0, 3)

        return `**${dimensionInfo.name}**: ${data.score}/100 (${levelDescription}) [权重: ${(data.weight * 100).toFixed(0)}%]
   - 强项: ${strongSkills.length > 0 ? strongSkills.join('、') : '暂无明显强项'}
   - 薄弱: ${weakSkills.length > 0 ? weakSkills.join('、') : '整体均衡'}
   - 建议重点: ${this.getDimensionRecommendation(dimensionName, data.score, weakSkills)}`
      }).join('\n')

      // 计算维度平衡度
      const scores = Object.values(ability.dimensions).map((d: any) => d.score)
      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)
      const balanceLevel = maxScore - minScore < 20 ? '均衡' : maxScore - minScore < 40 ? '不太均衡' : '严重不均衡'
      
      abilityAnalysis = `
## 📊 用户5维能力画像分析
**总体评分**: ${ability.overallScore}/100 (${this.getScoreLevelDescription(ability.overallScore)})
**能力平衡度**: ${balanceLevel} (最高${maxScore}分，最低${minScore}分，差距${maxScore - minScore}分)

### 各维度详细分析:
${dimensionAnalysis}

### 🎯 基于能力分析的推荐策略:
${this.generateStrategicRecommendations(ability)}
`
    }

    return `作为专业编程学习顾问，请基于用户的5维能力评估和学习偏好，为用户推荐3个最合适的学习目标：

## 📋 用户基础信息
**感兴趣领域**: ${categories.join('、')}
**编程经验**: ${answers.experience_level || '未填写'}
**学习时间投入**: ${answers.learning_time || '未填写'}
**学习目标**: ${Array.isArray(answers.learning_goal) ? answers.learning_goal.join('、') : answers.learning_goal || '未填写'}
**学习偏好**: ${Array.isArray(answers.project_preference) ? answers.project_preference.join('、') : answers.project_preference || '未填写'}
**职业方向**: ${answers.career_direction || '未填写'}

${abilityAnalysis || '⚠️ 用户尚未完成能力评估，建议推荐先完成能力评估以获得更精准的学习建议'}

${existingGoals.length > 0 ? `## 📚 已有学习目标
${existingGoals.map((g: any) => `- ${g.title} (${g.status})`).join('\n')}
**注意**: 避免重复推荐相似目标` : '## 📚 暂无现有目标'}

---

## 🎯 推荐要求

### 核心原则
1. **个性化匹配**: 必须基于用户的5维能力评估结果进行精准推荐
2. **补强导向**: 优先推荐能补强用户薄弱维度的学习目标
3. **发挥优势**: 在用户强项基础上进一步提升和扩展
4. **循序渐进**: 确保推荐的目标符合用户当前水平，难度适中
5. **实用价值**: 推荐的目标应对用户的职业发展有实际帮助

### 推荐策略
${ability ? `
**基于用户能力评估的具体策略**:
- 重点补强: ${this.getWeakestDimensions(ability).join('、')}
- 巩固优势: ${this.getStrongestDimensions(ability).join('、')}
- 平衡发展: ${this.getBalanceDevelopmentStrategy(ability)}
` : `
**通用推荐策略** (建议用户先完成能力评估):
- 基础扎实: 确保编程基础牢固
- 实践导向: 通过项目实践提升技能
- 全面发展: 兼顾技术能力和软技能
`}

### 输出格式
请以JSON格式返回推荐结果，每个推荐必须包含：

\`\`\`json
[
  {
    "category": "类别ID (与用户选择的感兴趣领域对应)",
    "title": "目标标题 (不超过20字，具体明确)",
    "description": "详细描述 (150-250字，必须说明为什么适合用户当前水平)",
    "priority": "优先级 (1-5，基于用户能力缺口和学习目标匹配度)",
    "reasoning": "推荐理由 (80-120字，必须明确说明基于用户哪些维度的评估结果)",
    "estimatedTimeWeeks": "预计学习周数 (基于用户当前水平调整)",
    "requiredSkills": ["需要掌握的具体技能列表"],
    "outcomes": ["学习成果列表，必须可衡量"],
    "targetDimensions": ["主要提升的能力维度"],
    "difficultyLevel": "难度等级 (beginner/intermediate/advanced，必须匹配用户水平)"
  }
]
\`\`\`

**🔥 特别要求**: 推荐结果必须充分体现对用户5维能力评估的深度分析和个性化考虑，不能是通用化的建议！`
  }

  // 新增辅助方法
  private getDimensionDisplayInfo(dimensionName: string): { name: string; description: string } {
    const infoMap: Record<string, { name: string; description: string }> = {
      programming: { name: '编程基本功', description: '编程语法、数据结构、代码质量等基础能力' },
      algorithm: { name: '算法能力', description: '算法思维、数据结构应用、问题解决能力' },
      project: { name: '项目能力', description: '项目规划、架构设计、实现和测试能力' },
      systemDesign: { name: '系统设计', description: '系统架构、可扩展性、性能优化能力' },
      communication: { name: '沟通协作', description: '团队协作、代码评审、技术表达能力' }
    }
    return infoMap[dimensionName] || { name: dimensionName, description: '未知维度' }
  }

  private getScoreLevelDescription(score: number): string {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '及格'
    if (score >= 20) return '较弱'
    return '很弱'
  }

  private getDimensionRecommendation(dimensionName: string, score: number, weakSkills: string[]): string {
    const recommendations: Record<string, string[]> = {
      programming: ['加强基础语法练习', '提升代码质量意识', '学习开发工具使用'],
      algorithm: ['多做算法题', '学习常用数据结构', '培养算法思维'],
      project: ['参与实际项目', '学习项目管理', '提升架构设计能力'],
      systemDesign: ['学习系统架构', '关注性能优化', '了解分布式系统'],
      communication: ['参与代码评审', '提升技术写作', '加强团队协作']
    }
    
    const baseRecommendations = recommendations[dimensionName] || ['持续学习提升']
    
    if (score >= 80) {
      return '继续保持优势，可以尝试更高难度挑战'
    } else if (score >= 60) {
      return baseRecommendations[0] + '，进一步深化理解'
    } else {
      return baseRecommendations.slice(0, 2).join('，') + '，重点补强基础'
    }
  }

  private generateStrategicRecommendations(ability: any): string {
    const dimensions = Object.entries(ability.dimensions)
    const sortedByScore = dimensions.sort(([,a]: any, [,b]: any) => b.score - a.score)
    const strongest = sortedByScore.slice(0, 2).map(([name]) => this.getDimensionDisplayInfo(name).name)
    const weakest = sortedByScore.slice(-2).map(([name]) => this.getDimensionDisplayInfo(name).name)
    
    return `• **发挥优势**: 基于您在${strongest.join('和')}方面的优势，推荐选择能进一步发挥这些能力的学习目标
• **补强短板**: 重点关注${weakest.join('和')}的提升，建议选择相关的基础强化目标
• **平衡发展**: 在保持优势的同时，适度补强薄弱环节，实现全面提升
• **实践导向**: 选择包含项目实践的目标，在实战中综合提升各维度能力`
  }

  private getWeakestDimensions(ability: any): string[] {
    return Object.entries(ability.dimensions)
      .sort(([,a]: any, [,b]: any) => a.score - b.score)
      .slice(0, 2)
      .map(([name]) => this.getDimensionDisplayInfo(name).name)
  }

  private getStrongestDimensions(ability: any): string[] {
    return Object.entries(ability.dimensions)
      .sort(([,a]: any, [,b]: any) => b.score - a.score)
      .slice(0, 2)
      .map(([name]) => this.getDimensionDisplayInfo(name).name)
  }

  private getBalanceDevelopmentStrategy(ability: any): string {
    const scores = Object.values(ability.dimensions).map((d: any) => d.score)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const gap = maxScore - minScore
    
    if (gap < 20) {
      return '能力较为均衡，可以选择综合性较强的学习目标'
    } else if (gap < 40) {
      return '存在一定能力差距，建议优先补强薄弱维度'
    } else {
      return '能力差距较大，强烈建议先专注补强最薄弱的维度'
    }
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