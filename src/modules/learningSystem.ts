// 学习系统统一入口
// 整合目标设定、路径规划、内容生成的完整学习流程

import { 
  GoalSettingService, 
  GoalCategory, 
  GoalRecommendation 
} from './goalSetting'
import { 
  PathPlanService, 
  SkillGapAnalysis, 
  PathGenerationConfig 
} from './pathPlan'
import { 
  CourseContentService, 
  ContentGenerationConfig,
  Exercise,
  ProjectTemplate 
} from './courseContent'
import { 
  agentToolExecutor,
  getAbilityProfile,
  getLearningGoals,
  getLearningPaths,
  getCourseUnits,
  addCoreEvent
} from './coreData'
import { log } from '../utils/logger'

/**
 * AI Agent交互历史
 */
export interface AgentInteraction {
  id: string
  timestamp: string
  userMessage: string
  agentResponse: string
  toolsUsed: string[]
  context: any
}

/**
 * 学习系统状态
 */
export interface LearningSystemStatus {
  setupComplete: boolean
  currentPhase: 'assessment' | 'goal_setting' | 'path_planning' | 'learning' | 'review'
  progress: {
    hasAbilityProfile: boolean
    activeGoals: number
    activePaths: number
    completedNodes: number
    totalNodes: number
    overallProgress: number
  }
  recommendations: string[]
  nextActions: string[]
}

/**
 * 学习系统主服务类
 * 提供完整的学习流程：目标设定 → 路径规划 → 内容生成
 */
export class LearningSystemService {
  private goalService: GoalSettingService
  private pathService: PathPlanService
  private contentService: CourseContentService
  private interactionHistory: AgentInteraction[] = []

  constructor() {
    this.goalService = new GoalSettingService()
    this.pathService = new PathPlanService()
    this.contentService = new CourseContentService()
  }

  // ========== AI Agent 交互系统 ==========

  /**
   * AI Agent智能对话入口
   * 根据用户输入自动判断需要执行的操作
   */
  async chatWithAgent(userMessage: string, context?: any): Promise<{
    response: string
    toolsUsed: string[]
    suggestions: string[]
    systemStatus: LearningSystemStatus
  }> {
    try {
      log(`[LearningSystem] User message: ${userMessage}`)
      
      // 分析用户意图
      const intent = await this.analyzeUserIntent(userMessage, context)
      
      // 根据意图执行相应的操作
      const actionResult = await this.executeIntentActions(intent, userMessage, context)
      
      // 生成AI响应
      const response = await this.generateAgentResponse(intent, actionResult, userMessage)
      
      // 获取系统状态和建议
      const systemStatus = await this.getSystemStatus()
      const suggestions = await this.generateSuggestions(systemStatus, userMessage)
      
      // 记录交互历史
      const interaction: AgentInteraction = {
        id: `interaction_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userMessage,
        agentResponse: response,
        toolsUsed: actionResult.toolsUsed,
        context: { intent, actionResult, systemStatus }
      }
      this.interactionHistory.push(interaction)
      
      // 记录Agent交互事件
      addCoreEvent({
        type: 'agent_interaction',
        details: {
          userMessage,
          intent: intent.type,
          toolsUsed: actionResult.toolsUsed,
          success: actionResult.success
        }
      })

      log(`[LearningSystem] Agent interaction completed`)
      
      return {
        response,
        toolsUsed: actionResult.toolsUsed,
        suggestions,
        systemStatus
      }

    } catch (error) {
      log(`[LearningSystem] Agent chat failed:`, error)
      
      return {
        response: '抱歉，我遇到了一些问题。请稍后再试或提供更具体的信息。',
        toolsUsed: [],
        suggestions: ['重新表述您的问题', '检查系统状态', '尝试从基础操作开始'],
        systemStatus: await this.getSystemStatus()
      }
    }
  }

  /**
   * 快速操作接口 - 让AI Agent执行特定任务
   */
  async executeQuickAction(action: string, params?: any): Promise<any> {
    const actionMap: Record<string, string> = {
      'analyze_ability': 'analyze_user_ability',
      'suggest_next': 'suggest_next_action', 
      'track_progress': 'track_learning_progress',
      'adjust_pace': 'adjust_learning_pace',
      'handle_difficulty': 'handle_learning_difficulty',
      'generate_content': 'generate_personalized_content',
      'recommend_schedule': 'recommend_study_schedule'
    }

    const toolName = actionMap[action]
    if (!toolName) {
      throw new Error(`Unknown action: ${action}`)
    }

    return await agentToolExecutor.executeTool(toolName, params || {})
  }

  // ========== 完整学习流程 ==========

  /**
   * 完整的学习路径创建流程
   * 1. 分析用户能力
   * 2. 设定学习目标
   * 3. 生成学习路径
   * 4. 创建课程内容
   */
  async createCompleteLearningPath(
    goalRecommendation: GoalRecommendation,
    pathConfig: PathGenerationConfig,
    contentConfig: ContentGenerationConfig
  ): Promise<{
    goal: any
    path: any
    courseUnits: any[]
  }> {
    try {
      log('[LearningSystem] Starting complete learning path creation')

      // 1. 创建学习目标
      await this.goalService.createGoal(goalRecommendation)
      const goals = getLearningGoals()
      const goal = goals.find(g => g.title === goalRecommendation.title)
      
      if (!goal) {
        throw new Error('Failed to create goal')
      }

      // 2. 生成学习路径
      const path = await this.pathService.generateLearningPath(goal.id, pathConfig)

      // 3. 为每个路径节点生成课程内容
      const courseUnits = []
      for (const node of path.nodes) {
        try {
          const unit = await this.contentService.generateCourseContent(node.id, {
            ...contentConfig,
            contentType: this.inferContentType(node.type)
          })
          courseUnits.push(unit)
        } catch (error) {
          log('[LearningSystem] Failed to generate content for node:', node.id, error)
          // 继续处理其他节点
        }
      }

      // 记录完整流程事件
      addCoreEvent({
        type: 'complete_learning_path_created',
        details: {
          goalId: goal.id,
          pathId: path.id,
          nodeCount: path.nodes.length,
          courseUnitCount: courseUnits.length,
          estimatedHours: path.totalEstimatedHours
        }
      })

      log('[LearningSystem] Complete learning path created successfully')
      return { goal, path, courseUnits }

    } catch (error) {
      log('[LearningSystem] Failed to create complete learning path:', error)
      throw error
    }
  }

  /**
   * 智能学习建议
   * 基于用户当前状态推荐下一步学习内容
   */
  async getSmartLearningRecommendations(): Promise<{
    needsAbilityAssessment: boolean
    needsGoalSetting: boolean
    needsPathGeneration: boolean
    recommendations: string[]
  }> {
    const ability = getAbilityProfile()
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()

    const recommendations: string[] = []
    let needsAbilityAssessment = false
    let needsGoalSetting = false
    let needsPathGeneration = false

    // 检查能力评估
    if (!ability) {
      needsAbilityAssessment = true
      recommendations.push('建议先完成能力评估，了解当前技能水平')
    }

    // 检查学习目标
    const activeGoals = goals.filter(g => g.status === 'active')
    if (activeGoals.length === 0) {
      needsGoalSetting = true
      recommendations.push('设定明确的学习目标，制定学习方向')
    }

    // 检查学习路径
    if (activeGoals.length > 0) {
      const goalsWithoutPaths = activeGoals.filter(goal => 
        !paths.some(path => path.goalId === goal.id && path.status === 'active')
      )
      if (goalsWithoutPaths.length > 0) {
        needsPathGeneration = true
        recommendations.push('为现有目标生成个性化学习路径')
      }
    }

    // 检查学习进度
    const activePaths = paths.filter(p => p.status === 'active')
    if (activePaths.length > 0) {
      const pathsWithoutContent = activePaths.filter(path =>
        path.nodes.some(node => !units.some(unit => unit.nodeId === node.id))
      )
      if (pathsWithoutContent.length > 0) {
        recommendations.push('为学习路径生成具体的课程内容')
      }
    }

    // 学习进度建议
    if (activePaths.length > 0) {
      const inProgressNodes = activePaths.flatMap(path => 
        path.nodes.filter(node => node.status === 'in_progress')
      )
      if (inProgressNodes.length > 0) {
        recommendations.push('继续完成正在进行的学习节点')
      }
    }

    return {
      needsAbilityAssessment,
      needsGoalSetting,
      needsPathGeneration,
      recommendations
    }
  }

  /**
   * 获取系统完整状态
   */
  async getSystemStatus(): Promise<LearningSystemStatus> {
    const ability = getAbilityProfile()
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()

    const activeGoals = goals.filter(g => g.status === 'active')
    const activePaths = paths.filter(p => p.status === 'active')
    const allNodes = activePaths.flatMap(p => p.nodes)
    const completedNodes = allNodes.filter(n => n.status === 'completed')

    // 确定当前阶段
    let currentPhase: LearningSystemStatus['currentPhase'] = 'assessment'
    if (ability && activeGoals.length === 0) {
      currentPhase = 'goal_setting'
    } else if (activeGoals.length > 0 && activePaths.length === 0) {
      currentPhase = 'path_planning'
    } else if (activePaths.length > 0) {
      const hasInProgress = allNodes.some(n => n.status === 'in_progress')
      currentPhase = hasInProgress ? 'learning' : 'review'
    }

    // 获取推荐和下一步行动
    const smartRecommendations = await this.getSmartLearningRecommendations()
    const nextActionResult = await agentToolExecutor.executeTool('suggest_next_action', {})

    return {
      setupComplete: !!(ability && activeGoals.length > 0 && activePaths.length > 0),
      currentPhase,
      progress: {
        hasAbilityProfile: !!ability,
        activeGoals: activeGoals.length,
        activePaths: activePaths.length,
        completedNodes: completedNodes.length,
        totalNodes: allNodes.length,
        overallProgress: allNodes.length > 0 ? (completedNodes.length / allNodes.length) * 100 : 0
      },
      recommendations: smartRecommendations.recommendations,
      nextActions: nextActionResult.suggestions || []
    }
  }

  // ========== 私有方法 ==========

  /**
   * 分析用户意图
   */
  private async analyzeUserIntent(userMessage: string, context?: any): Promise<{
    type: string
    confidence: number
    entities: any[]
    suggestedTools: string[]
  }> {
    const message = userMessage.toLowerCase()
    
    // 简化的意图识别逻辑
    const intents = [
      {
        type: 'ability_analysis',
        keywords: ['能力', '评估', '技能', '水平', '测试'],
        tools: ['analyze_user_ability']
      },
      {
        type: 'goal_setting',
        keywords: ['目标', '学习', '方向', '规划', '想学'],
        tools: ['create_learning_goal']
      },
      {
        type: 'path_generation',
        keywords: ['路径', '计划', '步骤', '怎么学', '学习路线'],
        tools: ['create_learning_path', 'generate_path_nodes']
      },
      {
        type: 'content_request',
        keywords: ['内容', '课程', '教程', '学习材料'],
        tools: ['create_course_unit']
      },
      {
        type: 'progress_tracking',
        keywords: ['进度', '完成', '学习情况', '统计'],
        tools: ['track_learning_progress']
      },
      {
        type: 'difficulty_help',
        keywords: ['困难', '不懂', '问题', '帮助', '解释'],
        tools: ['handle_learning_difficulty']
      },
      {
        type: 'pace_adjustment',
        keywords: ['快一点', '慢一点', '简单', '复杂', '调整'],
        tools: ['adjust_learning_pace']
      },
      {
        type: 'next_action',
        keywords: ['下一步', '接下来', '什么', '建议'],
        tools: ['suggest_next_action']
      },
      {
        type: 'schedule_planning',
        keywords: ['时间', '安排', '计划', '时间表'],
        tools: ['recommend_study_schedule']
      }
    ]

    let bestMatch: {
      type: string
      confidence: number
      entities: string[]
      suggestedTools: string[]
    } = { 
      type: 'general', 
      confidence: 0, 
      entities: [], 
      suggestedTools: ['suggest_next_action'] 
    }
    
    for (const intent of intents) {
      const matches = intent.keywords.filter(keyword => message.includes(keyword))
      const confidence = matches.length / intent.keywords.length
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type: intent.type,
          confidence,
          entities: matches,
          suggestedTools: intent.tools
        }
      }
    }

    return bestMatch
  }

  /**
   * 执行意图相关的操作
   */
  private async executeIntentActions(intent: any, userMessage: string, context?: any): Promise<{
    success: boolean
    results: any[]
    toolsUsed: string[]
    errors: string[]
  }> {
    const results: any[] = []
    const toolsUsed: string[] = []
    const errors: string[] = []
    
    try {
      for (const toolName of intent.suggestedTools) {
        try {
          // 根据工具类型准备参数
          const params = this.prepareToolParameters(toolName, userMessage, context)
          const result = await agentToolExecutor.executeTool(toolName, params)
          
          results.push(result)
          toolsUsed.push(toolName)
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`${toolName}: ${errorMsg}`)
          log(`[LearningSystem] Tool execution failed: ${toolName}`, error)
        }
      }
      
      return {
        success: errors.length === 0,
        results,
        toolsUsed,
        errors
      }
      
    } catch (error) {
      log('[LearningSystem] Intent execution failed:', error)
      return {
        success: false,
        results: [],
        toolsUsed: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * 为工具准备参数
   */
  private prepareToolParameters(toolName: string, userMessage: string, context?: any): any {
    const systemStatus = context?.systemStatus || this.getBasicSystemStatus()
    
    switch (toolName) {
      case 'handle_learning_difficulty':
        return {
          nodeId: context?.currentNodeId || 'unknown',
          difficulty: userMessage,
          preferredSolution: this.inferPreferredSolution(userMessage)
        }
        
      case 'adjust_learning_pace':
        return {
          pathId: context?.currentPathId || systemStatus.activePaths[0]?.id || 'unknown',
          feedback: userMessage,
          adjustment: this.inferPaceAdjustment(userMessage)
        }
        
      case 'recommend_study_schedule':
        return {
          availableHoursPerWeek: context?.availableHours || 10,
          preferredStudyTimes: context?.preferredTimes || ['evening'],
          goalId: systemStatus.activeGoals[0]?.id || 'unknown'
        }
        
      case 'generate_personalized_content':
        return {
          nodeId: context?.currentNodeId || 'unknown',
          learningStyle: context?.learningStyle || 'visual',
          difficulty: context?.difficulty || 3
        }
        
      case 'track_learning_progress':
        return {
          pathId: context?.pathId,
          timeRange: context?.timeRange || 'week'
        }
        
      default:
        return {}
    }
  }

  /**
   * 生成AI Agent响应
   */
  private async generateAgentResponse(intent: any, actionResult: any, userMessage: string): Promise<string> {
    if (!actionResult.success && actionResult.errors.length > 0) {
      return `我在处理您的请求时遇到了一些问题：${actionResult.errors.join(', ')}。请提供更多信息或尝试其他操作。`
    }

    const result = actionResult.results[0]
    
    switch (intent.type) {
      case 'ability_analysis':
        if (result?.hasAbilityData) {
          return `根据您的能力评估，您的总体水平为 ${result.overallScore}/10。优势领域包括：${result.strengths.join(', ')}。建议重点提升：${result.weaknesses.join(', ')}。${result.recommendation}`
        } else {
          return '您还没有完成能力评估。建议先进行能力测试，这样我就能为您提供更个性化的学习建议了。'
        }
        
      case 'goal_setting':
        return '我已经帮您创建了学习目标。接下来我们可以为这个目标制定详细的学习路径。您希望以什么样的节奏进行学习？'
        
      case 'path_generation':
        if (result?.nodes?.length > 0) {
          return `我为您生成了包含 ${result.nodes.length} 个学习节点的学习路径，预计需要 ${result.totalEstimatedHours} 小时完成。路径包括：${result.nodes.slice(0, 3).map((n: any) => n.title).join('、')}等内容。`
        } else {
          return '生成学习路径需要先设定明确的学习目标。请告诉我您想学习什么？'
        }
        
      case 'progress_tracking':
        if (result?.overallProgress !== undefined) {
          return `您当前的学习进度是 ${Math.round(result.overallProgress)}%。已完成 ${result.completedNodes || 0} 个学习节点，还有 ${(result.totalNodes || 0) - (result.completedNodes || 0)} 个待完成。${result.insights?.[0] || '继续保持！'}`
        } else {
          return '您还没有开始任何学习路径。建议先设定学习目标并生成学习计划。'
        }
        
      case 'difficulty_help':
        return `我理解您遇到的困难。${result?.message || ''}我建议您：${result?.solution?.suggestions?.join('、') || '寻求更详细的解释和练习'}。需要我为您提供更具体的帮助吗？`
        
      case 'pace_adjustment':
        return `${result?.message || '我已经根据您的反馈调整了学习节奏。'}建议：${result?.adjustments?.recommendedAction || '保持当前的学习计划'}`
        
      case 'next_action':
        if (result?.suggestions?.length > 0) {
          return `根据您当前的学习状态，我建议您：${result.suggestions.join('，或者')}。${result.currentStatus ? `您目前有 ${result.currentStatus.activeGoals} 个活跃目标和 ${result.currentStatus.activePaths} 个学习路径。` : ''}`
        } else {
          return '让我分析一下您的学习状态，稍等片刻...'
        }
        
      case 'schedule_planning':
        if (result?.schedule?.length > 0) {
          return `基于您每周 ${result.weeklyHours} 小时的学习时间，我为您制定了学习计划。预计 ${result.estimatedCompletionWeeks} 周完成目标。建议您：${result.tips?.[0] || '保持规律的学习习惯'}`
        } else {
          return '制定学习计划需要了解您的可用时间。请告诉我您每周能投入多少时间学习？'
        }
        
      default:
        return '我正在分析您的请求。根据当前情况，建议您明确学习目标或告诉我您希望我帮您做什么。'
    }
  }

  /**
   * 生成建议
   */
  private async generateSuggestions(systemStatus: LearningSystemStatus, userMessage: string): Promise<string[]> {
    const suggestions: string[] = []
    
    // 基于系统状态的建议
    if (!systemStatus.progress.hasAbilityProfile) {
      suggestions.push('完成能力评估以获得个性化建议')
    }
    
    if (systemStatus.progress.activeGoals === 0) {
      suggestions.push('设定您的第一个学习目标')
    }
    
    if (systemStatus.progress.activePaths === 0 && systemStatus.progress.activeGoals > 0) {
      suggestions.push('为目标生成学习路径')
    }
    
    if (systemStatus.progress.totalNodes > 0 && systemStatus.progress.overallProgress > 0) {
      suggestions.push('查看学习进度报告')
    }
    
    // 基于用户消息的建议
    if (userMessage.includes('困难') || userMessage.includes('不懂')) {
      suggestions.push('获得针对性的学习帮助')
    }
    
    if (userMessage.includes('时间') || userMessage.includes('安排')) {
      suggestions.push('制定个性化学习时间表')
    }
    
    return suggestions.slice(0, 3) // 返回前3个建议
  }

  // ========== 辅助方法 ==========

  private getBasicSystemStatus() {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    return {
      activeGoals: goals.filter(g => g.status === 'active'),
      activePaths: paths.filter(p => p.status === 'active')
    }
  }

  private inferPreferredSolution(message: string): string {
    if (message.includes('例子') || message.includes('示例')) return 'example'
    if (message.includes('练习') || message.includes('练一练')) return 'practice'
    if (message.includes('换个') || message.includes('其他')) return 'alternative'
    return 'explanation'
  }

  private inferPaceAdjustment(message: string): string {
    if (message.includes('快') || message.includes('加速')) return 'faster'
    if (message.includes('慢') || message.includes('减速')) return 'slower'
    if (message.includes('简单') || message.includes('容易')) return 'easier'
    if (message.includes('难') || message.includes('挑战')) return 'harder'
    return 'slower' // 默认放慢节奏
  }

  // ========== 代理方法 ==========

  /**
   * 获取目标类别
   */
  getGoalCategories(): GoalCategory[] {
    return this.goalService.getCategories()
  }

  /**
   * 生成目标推荐
   */
  async generateGoalRecommendations(
    selectedCategories: string[],
    questionnaireAnswers: Record<string, any>
  ): Promise<GoalRecommendation[]> {
    return this.goalService.generateGoalRecommendations(selectedCategories, questionnaireAnswers)
  }

  /**
   * 分析技能差距
   */
  async analyzeSkillGap(goalId: string): Promise<SkillGapAnalysis> {
    return this.pathService.analyzeSkillGap(goalId)
  }

  /**
   * 生成练习题
   */
  async generateExercises(unitId: string, count?: number, difficulty?: number): Promise<Exercise[]> {
    return this.contentService.generateExercises(unitId, count, difficulty)
  }

  /**
   * 生成项目模板
   */
  async generateProject(nodeId: string, requirements: string[]): Promise<ProjectTemplate> {
    return this.contentService.generateProject(nodeId, requirements)
  }

  /**
   * 获取交互历史
   */
  getInteractionHistory(): AgentInteraction[] {
    return this.interactionHistory
  }

  /**
   * 清除交互历史
   */
  clearInteractionHistory(): void {
    this.interactionHistory = []
  }

  private inferContentType(nodeType: string): 'theory' | 'example' | 'exercise' | 'project' | 'quiz' {
    const typeMap: Record<string, 'theory' | 'example' | 'exercise' | 'project' | 'quiz'> = {
      'concept': 'theory',
      'practice': 'exercise', 
      'project': 'project',
      'assessment': 'quiz',
      'milestone': 'example'
    }
    
    return typeMap[nodeType] || 'theory'
  }
}

// 导出单例实例
export const learningSystemService = new LearningSystemService() 