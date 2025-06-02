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
  addCoreEvent,
  updateLearningGoal,
  updateLearningPath,
  createLearningGoal,
  createLearningPath,
  createCourseUnit
} from './coreData'
import { getCurrentAssessment } from './abilityAssess/service'
import { log, error } from '../utils/logger'
import { getAPIConfig } from './profileSettings/service'
import { addActivityRecord } from './profileSettings/service'
import { AbilityAssessmentService } from './abilityAssess/service'
import { getAIResponseWithTools } from '../components/AIAssistant/service'
import { AGENT_TOOLS } from './coreData/agentTools'

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
  systemHealth: {
    dataIntegrity: boolean
    lastSyncTime: string
    coreDataSize: number
    missingData: string[]
  }
}

/**
 * 学习系统主服务类
 * 提供完整的学习流程：目标设定 → 路径规划 → 内容生成
 */
export class LearningSystemService {
  private goalService: GoalSettingService
  private pathService: PathPlanService
  private contentService: CourseContentService
  private abilityService: AbilityAssessmentService
  private interactionHistory: AgentInteraction[] = []

  constructor() {
    this.goalService = new GoalSettingService()
    this.pathService = new PathPlanService()
    this.contentService = new CourseContentService()
    this.abilityService = new AbilityAssessmentService()
    log('[LearningSystem] All services initialized')
    
    // 初始化时进行数据完整性检查
    this.performDataIntegrityCheck()
  }

  // ========== 数据完整性管理 ==========

  /**
   * 执行数据完整性检查
   */
  private performDataIntegrityCheck(): void {
    try {
      const issues = this.checkDataIntegrity()
      if (issues.length > 0) {
        log('[LearningSystem] Data integrity issues found:', issues)
        this.reportDataIssues(issues)
      } else {
        log('[LearningSystem] Data integrity check passed')
      }
    } catch (error) {
      log('[LearningSystem] Data integrity check failed:', error)
    }
  }

  /**
   * 检查数据完整性
   */
  private checkDataIntegrity(): string[] {
    const issues: string[] = []
    
    try {
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      const units = getCourseUnits()
      const assessment = getCurrentAssessment()
      
      // 检查孤立的学习路径（没有对应目标）
      const orphanedPaths = paths.filter(path => 
        !goals.some(goal => goal.id === path.goalId)
      )
      if (orphanedPaths.length > 0) {
        issues.push(`发现 ${orphanedPaths.length} 个孤立的学习路径`)
      }
      
      // 检查孤立的课程单元（没有对应路径节点）
      const orphanedUnits = units.filter(unit => 
        !paths.some(path => 
          path.nodes.some(node => node.id === unit.nodeId)
        )
      )
      if (orphanedUnits.length > 0) {
        issues.push(`发现 ${orphanedUnits.length} 个孤立的课程单元`)
      }
      
      // 检查缺失的必要数据
      if (!assessment && goals.length > 0) {
        issues.push('有学习目标但缺少能力评估数据')
      }
      
      // 检查数据时间戳一致性
      const outdatedGoals = goals.filter(goal => 
        new Date(goal.updatedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
      )
      if (outdatedGoals.length > 0) {
        issues.push(`发现 ${outdatedGoals.length} 个超过30天未更新的目标`)
      }
      
    } catch (error) {
      issues.push(`数据完整性检查失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
    
    return issues
  }

  /**
   * 报告数据问题到Core Data
   */
  private reportDataIssues(issues: string[]): void {
    addCoreEvent({
      type: 'data_integrity_issues_detected',
      details: {
        issueCount: issues.length,
        issues: issues,
        timestamp: new Date().toISOString(),
        autoFixAttempted: false
      }
    })
  }

  /**
   * 同步Learning System状态到Core Data
   */
  private syncSystemStatus(): void {
    try {
      const systemStatus = this.getBasicSystemStatus()
      
      addCoreEvent({
        type: 'learning_system_status_sync',
        details: {
          activeGoals: systemStatus.activeGoals.length,
          activePaths: systemStatus.activePaths.length,
          totalInteractions: this.interactionHistory.length,
          lastSyncTime: new Date().toISOString()
        }
      })
      
    } catch (error) {
      log('[LearningSystem] Failed to sync system status:', error)
    }
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
      
      // 检查是否要使用真实LLM
      if (context?.useRealLLM) {
        return await this.chatWithRealLLM(userMessage, context)
      }
      
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
      
      // 记录Agent交互事件到Core Data
      addCoreEvent({
        type: 'agent_interaction',
        details: {
          userMessage,
          intent: intent.type,
          toolsUsed: actionResult.toolsUsed,
          success: actionResult.success,
          responseLength: response.length,
          timestamp: interaction.timestamp
        }
      })

      // 记录到活动历史
      addActivityRecord({
        type: 'ai_chat',
        action: `AI对话: ${intent.type}`,
        details: {
          userMessageLength: userMessage.length,
          intent: intent.type,
          toolsUsed: actionResult.toolsUsed,
          responseLength: response.length,
          success: actionResult.success
        }
      })

      // 同步系统状态
      this.syncSystemStatus()

      log(`[LearningSystem] Agent interaction completed`)
      
      return {
        response,
        toolsUsed: actionResult.toolsUsed,
        suggestions,
        systemStatus
      }

    } catch (error) {
      log(`[LearningSystem] Agent chat failed:`, error)
      
      // 记录错误事件
      addCoreEvent({
        type: 'agent_interaction_error',
        details: {
          userMessage,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      return {
        response: '抱歉，我遇到了一些问题。请稍后再试或提供更具体的信息。',
        toolsUsed: [],
        suggestions: ['重新表述您的问题', '检查系统状态', '尝试从基础操作开始'],
        systemStatus: await this.getSystemStatus()
      }
    }
  }

  /**
   * 使用真实LLM进行对话
   */
  private async chatWithRealLLM(userMessage: string, context?: any): Promise<{
    response: string
    toolsUsed: string[]
    suggestions: string[]
    systemStatus: LearningSystemStatus
  }> {
    try {
      log(`[LearningSystem] Using real LLM with intelligent tool calling`)
      
      // 收集当前学习状态信息
      const systemStatus = await this.getSystemStatus()
      const assessment = getCurrentAssessment()
      const abilityProfile = getAbilityProfile()
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
      // 构建上下文信息
      let contextInfo = `学习系统状态：
当前阶段: ${systemStatus.currentPhase}
设置完成度: ${systemStatus.setupComplete ? '已完成' : '进行中'}
学习进度: ${Math.round(systemStatus.progress.overallProgress)}%
活跃目标: ${systemStatus.progress.activeGoals}个
活跃路径: ${systemStatus.progress.activePaths}个`

      if (assessment) {
        contextInfo += `\n\n能力评估信息：
总体评分: ${assessment.overallScore}/100
评估日期: ${assessment.metadata.assessmentDate}
优势领域: ${assessment.report.strengths.join(', ')}
待改进: ${assessment.report.improvements.join(', ')}`
      }

      if (goals.length > 0) {
        contextInfo += `\n\n学习目标：`
        goals.slice(0, 3).forEach((goal, index) => {
          contextInfo += `\n${index + 1}. ${goal.title} (${goal.category}, ${goal.status})`
        })
      }

      if (paths.length > 0) {
        contextInfo += `\n\n学习路径：`
        paths.slice(0, 2).forEach((path, index) => {
          contextInfo += `\n${index + 1}. ${path.title} (${path.nodes.length}个节点, ${path.status})`
        })
      }

      // 添加聊天历史上下文（最近3条消息）
      if (context?.chatHistory && context.chatHistory.length > 0) {
        const recentMessages = context.chatHistory.slice(-3)
        contextInfo += `\n\n对话历史：`
        recentMessages.forEach((msg: any) => {
          if (msg.type === 'user') {
            contextInfo += `\n用户: ${msg.content}`
          } else if (msg.type === 'agent') {
            contextInfo += `\nAI: ${msg.content.substring(0, 100)}...`
          }
        })
      }

      // 导入AI工具定义
      const { AGENT_TOOLS } = await import('./coreData/agentTools')
      
      // 使用LLM进行智能工具调用
      const { getAIResponseWithTools } = await import('../components/AIAssistant/service')
      
      const result = await getAIResponseWithTools(
        userMessage,
        contextInfo,
        AGENT_TOOLS,
        // 工具执行器
        async (toolName: string, parameters: any) => {
          return await agentToolExecutor.executeTool(toolName, parameters)
        }
      )

      // 生成智能建议
      const suggestions = this.generateSmartSuggestions(result.response, systemStatus)

      // 记录LLM工具调用交互
      const interaction: AgentInteraction = {
        id: `interaction_llm_tools_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userMessage,
        agentResponse: result.response,
        toolsUsed: result.toolCalls.map(tc => tc.name),
        context: { 
          useRealLLM: true, 
          systemStatus,
          toolCalls: result.toolCalls 
        }
      }
      this.interactionHistory.push(interaction)

      // 记录LLM工具调用事件
      addCoreEvent({
        type: 'llm_tool_interaction',
        details: {
          userMessage,
          responseLength: result.response.length,
          toolsUsed: result.toolCalls.map(tc => tc.name),
          toolCallsCount: result.toolCalls.length,
          success: true
        }
      })

      // 记录到活动历史
      addActivityRecord({
        type: 'ai_chat',
        action: `真实LLM对话`,
        details: {
          userMessageLength: userMessage.length,
          responseLength: result.response.length,
          toolsUsed: result.toolCalls.map(tc => tc.name),
          toolCallsCount: result.toolCalls.length,
          success: true,
          model: getAPIConfig().model
        }
      })

      log(`[LearningSystem] LLM tool calling completed, tools used:`, result.toolCalls.map(tc => tc.name))

      return {
        response: result.response,
        toolsUsed: result.toolCalls.map(tc => tc.name),
        suggestions,
        systemStatus
      }

    } catch (error) {
      log(`[LearningSystem] LLM tool calling failed:`, error)
      
      // 工具调用失败时回退到基本功能
      const systemStatus = await this.getSystemStatus()
      
      return {
        response: `抱歉，AI助手暂时不可用。错误信息：${error instanceof Error ? error.message : '未知错误'}\n\n请检查：\n1. API Key是否正确配置\n2. 网络连接是否正常\n3. API额度是否充足\n\n您可以尝试使用其他演示功能。`,
        toolsUsed: [],
        suggestions: ['检查API配置', '尝试其他演示功能', '查看系统状态'],
        systemStatus
      }
    }
  }

  /**
   * 从消息中提取可能使用的工具
   */
  private extractToolsFromMessage(userMessage: string, aiResponse: string): string[] {
    const tools: string[] = []
    const message = (userMessage + ' ' + aiResponse).toLowerCase()
    
    if (message.includes('能力') || message.includes('评估') || message.includes('技能')) {
      tools.push('analyze_user_ability')
    }
    if (message.includes('目标') || message.includes('学习计划')) {
      tools.push('create_learning_goal')
    }
    if (message.includes('路径') || message.includes('学习路线')) {
      tools.push('generate_path_nodes')
    }
    if (message.includes('进度') || message.includes('统计')) {
      tools.push('track_learning_progress')
    }
    if (message.includes('困难') || message.includes('不懂') || message.includes('问题')) {
      tools.push('handle_learning_difficulty')
    }
    if (message.includes('建议') || message.includes('推荐')) {
      tools.push('suggest_next_action')
    }
    if (message.includes('时间') || message.includes('计划表') || message.includes('安排')) {
      tools.push('recommend_study_schedule')
    }
    
    return tools.length > 0 ? tools : ['smart_analysis']
  }

  /**
   * 基于AI响应生成智能建议
   */
  private generateSmartSuggestions(aiResponse: string, systemStatus: LearningSystemStatus): string[] {
    const suggestions: string[] = []
    const response = aiResponse.toLowerCase()
    
    // 基于AI响应内容分析
    if (response.includes('评估') || response.includes('能力')) {
      suggestions.push('查看详细能力分析')
    }
    if (response.includes('目标') || response.includes('学习')) {
      suggestions.push('设定新的学习目标')
    }
    if (response.includes('路径') || response.includes('计划')) {
      suggestions.push('生成学习路径')
    }
    if (response.includes('进度') || response.includes('状态')) {
      suggestions.push('查看学习进度')
    }
    if (response.includes('困难') || response.includes('问题')) {
      suggestions.push('获取学习帮助')
    }
    
    // 基于系统状态补充建议
    if (!systemStatus.progress.hasAbilityProfile) {
      suggestions.push('完成能力评估')
    }
    if (systemStatus.progress.activeGoals === 0) {
      suggestions.push('创建学习目标')
    }
    if (systemStatus.progress.activePaths === 0 && systemStatus.progress.activeGoals > 0) {
      suggestions.push('生成学习路径')
    }
    
    // 智能去重和限制数量
    const uniqueSuggestions = [...new Set(suggestions)]
    return uniqueSuggestions.slice(0, 4)
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

      // 记录流程开始事件
      addCoreEvent({
        type: 'complete_learning_path_creation_started',
        details: {
          goalTitle: goalRecommendation.title,
          goalCategory: goalRecommendation.category,
          pathConfig,
          contentConfig,
          timestamp: new Date().toISOString()
        }
      })

      // 1. 创建学习目标 - 直接使用Core Data API确保同步
      const goalData = {
        title: goalRecommendation.title,
        description: goalRecommendation.description,
        category: goalRecommendation.category as 'frontend' | 'backend' | 'fullstack' | 'automation' | 'ai' | 'mobile' | 'game' | 'data' | 'custom',
        priority: goalRecommendation.priority || 3,
        targetLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        estimatedTimeWeeks: goalRecommendation.estimatedTimeWeeks,
        requiredSkills: goalRecommendation.requiredSkills || [],
        outcomes: goalRecommendation.outcomes || [],
        status: 'active' as const
      }
      
      const goal = createLearningGoal(goalData)
      log('[LearningSystem] Goal created via Core Data:', goal.id)

      // 2. 生成学习路径 - 使用PathPlan服务
      const path = await this.pathService.generateLearningPath(goal.id, {
        learningStyle: 'balanced',
        timePreference: 'moderate',
        difficultyProgression: 'linear',
        includeProjects: true,
        includeMilestones: true
      })
      log('[LearningSystem] Path generated:', path.id)

      // 3. 为每个路径节点生成课程内容
      const courseUnits: any[] = []
      for (const node of path.nodes) {
        try {
          const unitData = {
            nodeId: node.id,
            title: `${node.title} - 课程内容`,
            description: node.description || `${node.title}的详细学习内容`,
            type: this.inferContentType(node.type),
            content: {
              markdown: `# ${node.title}\n\n这是${node.title}的详细学习内容。`
            },
            metadata: {
              difficulty: node.difficulty || 3,
              estimatedTime: node.estimatedMinutes || 60,
              keywords: node.skills || [],
              learningObjectives: [`掌握${node.title}的核心概念`, `能够应用${node.title}解决实际问题`],
              prerequisites: node.prerequisites || [],
              order: path.nodes.indexOf(node) + 1
            }
          }
          
          const unit = createCourseUnit(unitData)
          courseUnits.push(unit)
          log('[LearningSystem] Course unit created for node:', node.id)
        } catch (error) {
          log('[LearningSystem] Failed to generate content for node:', node.id, error)
          // 记录课程内容创建失败事件
          addCoreEvent({
            type: 'course_unit_creation_failed',
            details: {
              nodeId: node.id,
              pathId: path.id,
              goalId: goal.id,
              error: error instanceof Error ? error.message : '未知错误'
            }
          })
        }
      }

      // 记录完整流程成功事件
      addCoreEvent({
        type: 'complete_learning_path_created',
        details: {
          goalId: goal.id,
          pathId: path.id,
          nodeCount: path.nodes.length,
          courseUnitCount: courseUnits.length,
          estimatedHours: path.totalEstimatedHours,
          successfulUnits: courseUnits.length,
          failedUnits: path.nodes.length - courseUnits.length,
          completionTime: new Date().toISOString()
        }
      })

      // 记录到活动历史
      addActivityRecord({
        type: 'goal_set',
        action: '完整学习路径创建',
        details: {
          goalTitle: goal.title,
          pathTitle: path.title,
          nodeCount: path.nodes.length,
          unitCount: courseUnits.length,
          estimatedHours: path.totalEstimatedHours
        }
      })

      // 同步系统状态
      this.syncSystemStatus()

      log('[LearningSystem] Complete learning path created successfully')
      return { goal, path, courseUnits }

    } catch (error) {
      log('[LearningSystem] Failed to create complete learning path:', error)
      
      // 记录失败事件
      addCoreEvent({
        type: 'complete_learning_path_creation_failed',
        details: {
          goalTitle: goalRecommendation.title,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
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
    const abilitySummary = this.abilityService.getAbilitySummary()
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()

    const recommendations: string[] = []
    let needsAbilityAssessment = false
    let needsGoalSetting = false
    let needsPathGeneration = false

    // 检查能力评估
    if (!abilitySummary.hasAssessment) {
      needsAbilityAssessment = true
      recommendations.push('建议先完成能力评估，了解当前技能水平')
    } else if (abilitySummary.hasAssessment) {
      // 如果有完整的评估数据，提供更详细的建议
      if (abilitySummary.overallScore < 40) {
        recommendations.push('建议从基础课程开始，夯实编程基础')
      } else if (abilitySummary.overallScore >= 70) {
        recommendations.push('您的基础较好，可以考虑挑战性更高的学习目标')
      }
    }

    // 检查学习目标
    const activeGoals = goals.filter(g => g.status === 'active')
    if (activeGoals.length === 0) {
      needsGoalSetting = true
      if (abilitySummary.hasAssessment && abilitySummary.overallScore >= 50) {
        recommendations.push('基于您的能力评估，建议设定中级水平的学习目标')
      } else {
        recommendations.push('设定明确的学习目标，制定学习方向')
      }
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
      recommendations: recommendations.slice(0, 5) // 限制建议数量
    }
  }

  /**
   * 获取系统完整状态
   */
  async getSystemStatus(): Promise<LearningSystemStatus> {
    const abilitySummary = this.abilityService.getAbilitySummary()
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()

    const activeGoals = goals.filter(g => g.status === 'active')
    const activePaths = paths.filter(p => p.status === 'active')
    const allNodes = activePaths.flatMap(p => p.nodes)
    const completedNodes = allNodes.filter(n => n.status === 'completed')

    // 确定当前阶段
    let currentPhase: LearningSystemStatus['currentPhase'] = 'assessment'
    if (abilitySummary.hasAssessment && activeGoals.length === 0) {
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

    // 执行数据完整性检查
    const dataIntegrityIssues = this.checkDataIntegrity()
    const isDataIntegrityOK = dataIntegrityIssues.length === 0

    // 计算Core Data大小
    const coreDataSize = goals.length + paths.length + units.length + this.interactionHistory.length

    // 识别缺失的数据
    const missingData: string[] = []
    if (!abilitySummary.hasAssessment) missingData.push('ability_assessment')
    if (activeGoals.length === 0) missingData.push('active_goals')
    if (activeGoals.length > 0 && activePaths.length === 0) missingData.push('learning_paths')
    if (activePaths.length > 0 && units.length === 0) missingData.push('course_units')

    const systemStatus: LearningSystemStatus = {
      setupComplete: !!(abilitySummary.hasAssessment && activeGoals.length > 0 && activePaths.length > 0),
      currentPhase,
      progress: {
        hasAbilityProfile: abilitySummary.hasAssessment,
        activeGoals: activeGoals.length,
        activePaths: activePaths.length,
        completedNodes: completedNodes.length,
        totalNodes: allNodes.length,
        overallProgress: allNodes.length > 0 ? (completedNodes.length / allNodes.length) * 100 : 0
      },
      recommendations: smartRecommendations.recommendations,
      nextActions: nextActionResult.suggestions || [],
      systemHealth: {
        dataIntegrity: isDataIntegrityOK,
        lastSyncTime: new Date().toISOString(),
        coreDataSize,
        missingData
      }
    }

    // 记录系统状态快照到Core Data
    addCoreEvent({
      type: 'system_status_snapshot',
      details: {
        currentPhase,
        setupComplete: systemStatus.setupComplete,
        progress: systemStatus.progress,
        systemHealth: systemStatus.systemHealth,
        timestamp: new Date().toISOString()
      }
    })

    return systemStatus
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
      // ========== 查询类意图 ==========
      {
        type: 'query_goals',
        keywords: ['我的目标', '有哪些目标', '查看目标', '显示目标', '目标列表', '学习目标'],
        tools: ['get_learning_goals']
      },
      {
        type: 'query_paths',
        keywords: ['我的路径', '有哪些路径', '查看路径', '显示路径', '路径列表', '学习路径'],
        tools: ['get_learning_paths']
      },
      {
        type: 'query_courses',
        keywords: ['我的课程', '有哪些课程', '查看课程', '显示课程', '课程列表', '学习内容'],
        tools: ['get_course_units']
      },
      {
        type: 'query_progress',
        keywords: ['我的进度', '学习情况', '进度查询', '学习统计', '学习摘要'],
        tools: ['get_learning_summary']
      },
      {
        type: 'query_context',
        keywords: ['我的学习状态', '学习上下文', '整体情况', '学习概况'],
        tools: ['get_learning_context']
      },
      // ========== 分析类意图 ==========
      {
        type: 'ability_analysis',
        keywords: ['能力', '评估', '技能', '水平', '测试'],
        tools: ['analyze_user_ability']
      },
      // ========== 创建/设置类意图 ==========
      {
        type: 'goal_setting',
        keywords: ['创建目标', '设定目标', '新目标', '想学', '学习方向'],
        tools: ['create_learning_goal']
      },
      {
        type: 'path_generation',
        keywords: ['生成路径', '创建路径', '制定计划', '怎么学', '学习路线'],
        tools: ['create_learning_path', 'generate_path_nodes']
      },
      {
        type: 'content_request',
        keywords: ['生成内容', '创建课程', '教程', '学习材料'],
        tools: ['create_course_unit']
      },
      // ========== 状态跟踪类意图 ==========
      {
        type: 'progress_tracking',
        keywords: ['跟踪进度', '完成情况', '学习进度'],
        tools: ['track_learning_progress']
      },
      // ========== 帮助类意图 ==========
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
      // ========== 查询类响应 ==========
      case 'query_goals':
        if (result?.goals?.length > 0) {
          const goalsText = result.goals.map((goal: any, index: number) => 
            `${index + 1}. ${goal.title} (${goal.category}, ${goal.status})`
          ).join('\n')
          return `您当前有 ${result.total} 个学习目标，其中筛选后显示 ${result.filtered} 个：\n\n${goalsText}\n\n${result.total > result.filtered ? '使用筛选条件可以查看更多目标。' : ''}您想了解哪个目标的详细信息吗？`
        } else {
          return '您还没有设定任何学习目标。建议您先创建一个学习目标来开始您的学习之旅！我可以帮您推荐一些适合的目标。'
        }
        
      case 'query_paths':
        if (result?.paths?.length > 0) {
          const pathsText = result.paths.map((path: any, index: number) => 
            `${index + 1}. ${path.title} - 进度: ${path.completedNodes}/${path.totalNodes} 节点 (${path.status})`
          ).join('\n')
          return `您当前有 ${result.total} 条学习路径，其中筛选后显示 ${result.filtered} 条：\n\n${pathsText}\n\n您想查看哪条路径的详细内容吗？`
        } else {
          return '您还没有生成任何学习路径。建议您先设定学习目标，然后我可以为您生成个性化的学习路径。'
        }
        
      case 'query_courses':
        if (result?.units?.length > 0) {
          const unitsText = Object.entries(result.unitsByType || {}).map(([type, count]) => 
            `${type}: ${count} 个`
          ).join('，')
          return `您当前有 ${result.total} 个课程单元，其中筛选后显示 ${result.filtered} 个。\n按类型分布：${unitsText}\n\n您想查看具体的课程内容吗？`
        } else {
          return '您还没有任何课程内容。建议您先创建学习路径，然后为路径节点生成相应的课程内容。'
        }
        
      case 'query_progress':
        if (result?.summary) {
          const summary = result.summary
          return `📊 学习摘要报告：\n\n整体进度：${summary.overallProgress}%\n活跃目标：${summary.activeGoals} 个\n活跃路径：${summary.activePaths} 个\n已完成节点：${summary.completedNodes}/${summary.totalNodes}\n主要学习领域：${summary.topLearningArea || '无'}\n\n💡 建议：${result.recommendations?.[0] || '继续保持学习节奏！'}`
        } else {
          return '暂时无法生成学习摘要。建议您先完成能力评估并设定学习目标。'
        }
        
      case 'query_context':
        if (result) {
          return `📋 学习上下文概览：\n\n${result.hasAbilityProfile ? '✅' : '❌'} 能力档案\n活跃目标：${result.activeGoals} 个\n活跃路径：${result.activePaths} 个\n课程单元：${result.totalCourseUnits} 个\n当前重点：${result.currentFocus}\n\n💡 推荐：${result.nextRecommendation}`
        } else {
          return '无法获取学习上下文信息。请稍后重试。'
        }
        
      // ========== 分析类响应 ==========
      case 'ability_analysis':
        if (result?.hasAbilityData) {
          return `根据您的能力评估，您的总体水平为 ${result.overallScore}/10。优势领域包括：${result.strengths.join(', ')}。建议重点提升：${result.weaknesses.join(', ')}。${result.recommendation}`
        } else {
          return '您还没有完成能力评估。建议先进行能力测试，这样我就能为您提供更个性化的学习建议了。'
        }
        
      // ========== 创建/设置类响应 ==========
      case 'goal_setting':
        return '我已经帮您创建了学习目标。接下来我们可以为这个目标制定详细的学习路径。您希望以什么样的节奏进行学习？'
        
      case 'path_generation':
        if (result?.nodes?.length > 0) {
          return `我为您生成了包含 ${result.nodes.length} 个学习节点的学习路径，预计需要 ${result.totalEstimatedHours} 小时完成。路径包括：${result.nodes.slice(0, 3).map((n: any) => n.title).join('、')}等内容。`
        } else {
          return '生成学习路径需要先设定明确的学习目标。请告诉我您想学习什么？'
        }
        
      // ========== 状态跟踪类响应 ==========
      case 'progress_tracking':
        if (result?.overallProgress !== undefined) {
          return `您当前的学习进度是 ${Math.round(result.overallProgress)}%。已完成 ${result.completedNodes || 0} 个学习节点，还有 ${(result.totalNodes || 0) - (result.completedNodes || 0)} 个待完成。${result.insights?.[0] || '继续保持！'}`
        } else {
          return '您还没有开始任何学习路径。建议先设定学习目标并生成学习计划。'
        }
        
      // ========== 帮助类响应 ==========
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

  /**
   * 执行能力评估 - 通过统一的Learning System管理
   */
  async executeAbilityAssessment(input: any): Promise<any> {
    log('[LearningSystem] Executing ability assessment')
    
    try {
      // 记录评估开始事件
      addCoreEvent({
        type: 'ability_assessment_started',
        details: {
          assessmentType: input.type,
          inputSize: input.content ? input.content.length : 0,
          timestamp: new Date().toISOString()
        }
      })

      const assessment = await this.abilityService.executeAssessment(input)
      
      // 评估完成后，检查是否需要进行下一步操作
      const systemStatus = await this.getSystemStatus()
      
      // 记录评估完成事件（详细版本）
      addCoreEvent({
        type: 'ability_assessment_completed_detailed',
        details: {
          assessmentId: `assessment_${Date.now()}`,
          overallScore: assessment.overallScore,
          level: assessment.report.summary,
          dimensions: Object.keys(assessment.dimensions).map(key => ({
            name: key,
            score: assessment.dimensions[key].score,
            weight: assessment.dimensions[key].weight
          })),
          strengths: assessment.report.strengths,
          improvements: assessment.report.improvements,
          confidence: assessment.metadata.confidence,
          nextRecommendations: systemStatus.recommendations,
          systemPhase: systemStatus.currentPhase,
          timestamp: new Date().toISOString()
        }
      })

      // 记录到活动历史
      addActivityRecord({
        type: 'assessment',
        action: '能力评估完成',
        details: {
          assessmentType: input.type,
          overallScore: assessment.overallScore,
          strengths: assessment.report.strengths.length,
          improvements: assessment.report.improvements.length,
          confidence: assessment.metadata.confidence
        }
      })

      // 同步系统状态
      this.syncSystemStatus()
      
      return {
        assessment,
        systemStatus,
        nextRecommendations: systemStatus.recommendations,
        message: '能力评估完成！系统已为您分析当前技能水平，可以开始设定学习目标。'
      }
      
    } catch (error) {
      log('[LearningSystem] Ability assessment failed:', error)
      
      // 记录评估失败事件
      addCoreEvent({
        type: 'ability_assessment_failed',
        details: {
          assessmentType: input.type,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      throw error
    }
  }

  /**
   * 获取能力概述 - 统一接口
   */
  getAbilitySummary() {
    const summary = this.abilityService.getAbilitySummary()
    
    // 记录能力概述查询事件
    addCoreEvent({
      type: 'ability_summary_accessed',
      details: {
        hasAssessment: summary.hasAssessment,
        overallScore: summary.overallScore,
        accessTime: new Date().toISOString()
      }
    })
    
    return summary
  }

  /**
   * 更新能力评估
   */
  async updateAbilityAssessment(updates: any): Promise<any> {
    log('[LearningSystem] Updating ability assessment')
    
    try {
      // 记录更新开始事件
      addCoreEvent({
        type: 'ability_assessment_update_started',
        details: {
          updateFields: Object.keys(updates),
          timestamp: new Date().toISOString()
        }
      })

      const updatedAssessment = await this.abilityService.updateAssessment(updates)
      
      if (!updatedAssessment) {
        throw new Error('No assessment found to update')
      }
      
      // 重新获取系统状态
      const systemStatus = await this.getSystemStatus()
      
      // 记录更新完成事件
      addCoreEvent({
        type: 'ability_assessment_updated_detailed',
        details: {
          assessmentId: 'current_assessment',
          updatedFields: Object.keys(updates),
          newOverallScore: updatedAssessment.overallScore,
          newConfidence: updatedAssessment.metadata.confidence,
          systemPhase: systemStatus.currentPhase,
          timestamp: new Date().toISOString()
        }
      })

      // 记录到活动历史
      addActivityRecord({
        type: 'assessment',
        action: '能力评估更新',
        details: {
          updatedFields: Object.keys(updates),
          newScore: updatedAssessment.overallScore,
          confidence: updatedAssessment.metadata.confidence
        }
      })

      // 同步系统状态
      this.syncSystemStatus()
      
      return {
        assessment: updatedAssessment,
        systemStatus,
        message: '能力评估已更新，建议重新检查学习目标匹配度。'
      }
      
    } catch (error) {
      log('[LearningSystem] Failed to update ability assessment:', error)
      
      // 记录更新失败事件
      addCoreEvent({
        type: 'ability_assessment_update_failed',
        details: {
          updateFields: Object.keys(updates),
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      throw error
    }
  }

  /**
   * 生成能力提升计划 - 使用新的智能提升计划
   */
  async generateAbilityImprovementPlan(): Promise<any> {
    log('[LearningSystem] Generating ability improvement plan via intelligent system')
    
    try {
      const plan = await this.abilityService.generateIntelligentImprovementPlan()
      
      // 记录生成事件
      addCoreEvent({
        type: 'improvement_plan_generated',
        details: {
          planId: plan.id,
          goalsCreated: plan.generatedGoals.shortTerm.length + plan.generatedGoals.mediumTerm.length,
          estimatedTimeMonths: plan.metadata.estimatedTimeMonths,
          targetImprovement: plan.metadata.targetImprovement,
          timestamp: new Date().toISOString()
        }
      })

      return plan
    } catch (err) {
      error('[LearningSystem] Failed to generate intelligent improvement plan:', err)
      throw err
    }
  }

  // ========== 数据同步验证和修复工具 ==========

  /**
   * 验证数据同步完整性
   */
  async validateDataSync(): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
    autoFixResults?: any[]
  }> {
    log('[LearningSystem] Starting data sync validation')
    
    const issues: string[] = []
    const recommendations: string[] = []
    const autoFixResults: any[] = []
    
    try {
      // 1. 检查Core Data与各服务的一致性
      const coreDataIssues = this.checkDataIntegrity()
      issues.push(...coreDataIssues)
      
      // 2. 检查能力评估数据同步
      const assessment = getCurrentAssessment()
      const abilityProfile = getAbilityProfile()
      
      if (assessment && !abilityProfile) {
        issues.push('能力评估存在但AbilityProfile缺失')
        recommendations.push('重新同步能力评估数据到Core Data')
      }
      
      // 3. 检查学习目标与路径的关联
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
      for (const goal of goals) {
        const relatedPaths = paths.filter(p => p.goalId === goal.id)
        if (goal.status === 'active' && relatedPaths.length === 0) {
          issues.push(`活跃目标 "${goal.title}" 缺少学习路径`)
          recommendations.push(`为目标 "${goal.title}" 生成学习路径`)
        }
      }
      
      // 4. 检查课程内容与路径节点的关联
      const units = getCourseUnits()
      for (const path of paths) {
        if (path.status === 'active') {
          for (const node of path.nodes) {
            const relatedUnits = units.filter(u => u.nodeId === node.id)
            if (relatedUnits.length === 0) {
              issues.push(`路径节点 "${node.title}" 缺少课程内容`)
              recommendations.push(`为节点 "${node.title}" 生成课程内容`)
            }
          }
        }
      }
      
      // 5. 检查事件记录的完整性
      const recentEvents = this.getRecentCoreEvents()
      if (recentEvents.length === 0 && (goals.length > 0 || paths.length > 0)) {
        issues.push('存在学习数据但缺少相关事件记录')
        recommendations.push('补充事件记录或重新同步数据')
      }
      
      // 6. 检查交互历史的有效性
      const invalidInteractions = this.interactionHistory.filter(interaction => 
        !interaction.id || !interaction.timestamp || !interaction.userMessage
      )
      if (invalidInteractions.length > 0) {
        issues.push(`发现 ${invalidInteractions.length} 条无效的交互记录`)
        recommendations.push('清理无效的交互历史')
      }
      
      const isValid = issues.length === 0
      
      // 记录验证结果
      addCoreEvent({
        type: 'data_sync_validation_completed',
        details: {
          isValid,
          issueCount: issues.length,
          issues: issues.slice(0, 10), // 只记录前10个问题
          recommendationCount: recommendations.length,
          validationTime: new Date().toISOString()
        }
      })
      
      log('[LearningSystem] Data sync validation completed:', { isValid, issues: issues.length })
      
      return {
        isValid,
        issues,
        recommendations,
        autoFixResults
      }
      
    } catch (error) {
      log('[LearningSystem] Data sync validation failed:', error)
      
      addCoreEvent({
        type: 'data_sync_validation_failed',
        details: {
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      return {
        isValid: false,
        issues: ['数据同步验证过程失败'],
        recommendations: ['检查系统状态', '重新启动Learning System'],
        autoFixResults: []
      }
    }
  }

  /**
   * 自动修复数据同步问题
   */
  async autoFixDataSync(fixOptions: {
    fixOrphanedData?: boolean
    regenerateMissingPaths?: boolean
    recreateMissingUnits?: boolean
    cleanInvalidRecords?: boolean
  } = {}): Promise<{
    success: boolean
    fixedIssues: string[]
    failedFixes: string[]
    summary: string
  }> {
    log('[LearningSystem] Starting auto-fix for data sync issues')
    
    const fixedIssues: string[] = []
    const failedFixes: string[] = []
    
    try {
      // 记录修复开始事件
      addCoreEvent({
        type: 'data_sync_auto_fix_started',
        details: {
          fixOptions,
          timestamp: new Date().toISOString()
        }
      })
      
      // 1. 清理孤立数据
      if (fixOptions.fixOrphanedData) {
        try {
          const orphanedPaths = this.findOrphanedPaths()
          for (const path of orphanedPaths) {
            updateLearningPath(path.id, { status: 'archived' })
          }
          if (orphanedPaths.length > 0) {
            fixedIssues.push(`归档了 ${orphanedPaths.length} 个孤立的学习路径`)
          }
        } catch (error) {
          failedFixes.push('修复孤立数据失败')
        }
      }
      
      // 2. 为活跃目标生成缺失的路径
      if (fixOptions.regenerateMissingPaths) {
        try {
          const goalsNeedingPaths = this.findGoalsNeedingPaths()
          for (const goal of goalsNeedingPaths) {
            try {
              await this.pathService.generateLearningPath(goal.id, {
                learningStyle: 'balanced',
                timePreference: 'moderate',
                difficultyProgression: 'linear',
                includeProjects: true,
                includeMilestones: true
              })
              fixedIssues.push(`为目标 "${goal.title}" 生成了学习路径`)
            } catch (error) {
              failedFixes.push(`为目标 "${goal.title}" 生成路径失败`)
            }
          }
        } catch (error) {
          failedFixes.push('批量生成学习路径失败')
        }
      }
      
      // 3. 清理无效记录
      if (fixOptions.cleanInvalidRecords) {
        try {
          const validInteractions = this.interactionHistory.filter(interaction => 
            interaction.id && interaction.timestamp && interaction.userMessage
          )
          const removedCount = this.interactionHistory.length - validInteractions.length
          this.interactionHistory = validInteractions
          
          if (removedCount > 0) {
            fixedIssues.push(`清理了 ${removedCount} 条无效的交互记录`)
          }
        } catch (error) {
          failedFixes.push('清理无效记录失败')
        }
      }
      
      const success = failedFixes.length === 0
      const summary = `修复完成：成功修复 ${fixedIssues.length} 个问题，${failedFixes.length} 个修复失败`
      
      // 记录修复结果
      addCoreEvent({
        type: 'data_sync_auto_fix_completed',
        details: {
          success,
          fixedCount: fixedIssues.length,
          failedCount: failedFixes.length,
          fixedIssues,
          failedFixes,
          summary,
          timestamp: new Date().toISOString()
        }
      })
      
      // 同步系统状态
      this.syncSystemStatus()
      
      log('[LearningSystem] Auto-fix completed:', { success, fixed: fixedIssues.length, failed: failedFixes.length })
      
      return {
        success,
        fixedIssues,
        failedFixes,
        summary
      }
      
    } catch (error) {
      log('[LearningSystem] Auto-fix failed:', error)
      
      addCoreEvent({
        type: 'data_sync_auto_fix_failed',
        details: {
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      return {
        success: false,
        fixedIssues,
        failedFixes: [...failedFixes, '自动修复过程失败'],
        summary: '自动修复过程遇到错误'
      }
    }
  }

  /**
   * 获取最近的Core Data事件
   */
  private getRecentCoreEvents(): any[] {
    // 这里应该从Core Data获取最近的事件
    // 暂时返回空数组，实际实现需要访问Core Data的events
    return []
  }

  /**
   * 查找孤立的学习路径
   */
  private findOrphanedPaths(): any[] {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    
    return paths.filter(path => 
      !goals.some(goal => goal.id === path.goalId)
    )
  }

  /**
   * 查找需要路径的目标
   */
  private findGoalsNeedingPaths(): any[] {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    
    return goals.filter(goal => 
      goal.status === 'active' && 
      !paths.some(path => path.goalId === goal.id && path.status !== 'archived')
    )
  }

  /**
   * 强制同步所有数据到Core Data
   */
  async forceSyncAllData(): Promise<{
    success: boolean
    syncedItems: string[]
    errors: string[]
  }> {
    log('[LearningSystem] Force syncing all data to Core Data')
    
    const syncedItems: string[] = []
    const errors: string[] = []
    
    try {
      // 记录强制同步开始
      addCoreEvent({
        type: 'force_sync_all_data_started',
        details: {
          timestamp: new Date().toISOString()
        }
      })
      
      // 1. 同步系统状态
      try {
        this.syncSystemStatus()
        syncedItems.push('系统状态')
      } catch (error) {
        errors.push('系统状态同步失败')
      }
      
      // 2. 同步交互历史总结
      try {
        addCoreEvent({
          type: 'interaction_history_summary',
          details: {
            totalInteractions: this.interactionHistory.length,
            recentInteractions: this.interactionHistory.slice(-5).map(i => ({
              timestamp: i.timestamp,
              toolsUsed: i.toolsUsed,
              success: !!i.context
            })),
            timestamp: new Date().toISOString()
          }
        })
        syncedItems.push('交互历史总结')
      } catch (error) {
        errors.push('交互历史同步失败')
      }
      
      // 3. 同步数据完整性状态
      try {
        const dataIssues = this.checkDataIntegrity()
        addCoreEvent({
          type: 'data_integrity_status_sync',
          details: {
            hasIssues: dataIssues.length > 0,
            issueCount: dataIssues.length,
            issues: dataIssues,
            timestamp: new Date().toISOString()
          }
        })
        syncedItems.push('数据完整性状态')
      } catch (error) {
        errors.push('数据完整性状态同步失败')
      }
      
      const success = errors.length === 0
      
      // 记录强制同步结果
      addCoreEvent({
        type: 'force_sync_all_data_completed',
        details: {
          success,
          syncedCount: syncedItems.length,
          errorCount: errors.length,
          syncedItems,
          errors,
          timestamp: new Date().toISOString()
        }
      })
      
      log('[LearningSystem] Force sync completed:', { success, synced: syncedItems.length, errors: errors.length })
      
      return {
        success,
        syncedItems,
        errors
      }
      
    } catch (error) {
      log('[LearningSystem] Force sync failed:', error)
      
      return {
        success: false,
        syncedItems,
        errors: [...errors, '强制同步过程失败']
      }
    }
  }
}

// 导出单例实例
export const learningSystemService = new LearningSystemService() 