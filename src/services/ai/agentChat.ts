import { 
  AgentInteraction, 
  AgentChatResponse, 
  ChatContext, 
  UserIntent, 
  ToolExecutionResult 
} from './types'
import { LearningSystemStatus } from '../learning/types'
import { intentAnalysisService } from './intentAnalysis'
import { suggestionGeneratorService } from './suggestionGenerator'
import { log } from '../../utils/logger'
import { 
  agentToolExecutor,
  addCoreEvent,
  getAbilityProfile,
  getLearningGoals,
  getLearningPaths
} from '../../modules/coreData'
import { getCurrentAssessment } from '../../modules/abilityAssess/service'
import { addActivityRecord, getAPIConfig } from '../../modules/profileSettings/service'

/**
 * AI Agent 对话核心服务
 */
export class AgentChatService {
  private interactionHistory: AgentInteraction[] = []

  /**
   * AI Agent智能对话入口
   */
  async chatWithAgent(
    userMessage: string, 
    context?: ChatContext,
    getSystemStatus?: () => Promise<LearningSystemStatus>
  ): Promise<AgentChatResponse> {
    try {
      log(`[AgentChat] User message: ${userMessage}`)
      
      // 检查是否要使用真实LLM
      if (context?.useRealLLM) {
        return await this.chatWithRealLLM(userMessage, context, getSystemStatus)
      }
      
      // 分析用户意图
      const intent = await intentAnalysisService.analyzeUserIntent(userMessage, context)
      
      // 根据意图执行相应的操作
      const actionResult = await this.executeIntentActions(intent, userMessage, context)
      
      // 生成AI响应
      const response = await this.generateAgentResponse(intent, actionResult, userMessage)
      
      // 获取系统状态和建议
      const systemStatus = getSystemStatus ? await getSystemStatus() : null
      const suggestions = systemStatus 
        ? await suggestionGeneratorService.generateSuggestions(systemStatus, userMessage)
        : []
      
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

      log(`[AgentChat] Agent interaction completed`)
      
      return {
        response,
        toolsUsed: actionResult.toolsUsed,
        suggestions,
        systemStatus: systemStatus || {} as LearningSystemStatus
      }

    } catch (error) {
      log(`[AgentChat] Agent chat failed:`, error)
      
      // 记录错误事件
      addCoreEvent({
        type: 'agent_interaction_error',
        details: {
          userMessage,
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      })
      
      const fallbackSystemStatus = getSystemStatus ? await getSystemStatus() : {} as LearningSystemStatus
      
      return {
        response: '抱歉，我遇到了一些问题。请稍后再试或提供更具体的信息。',
        toolsUsed: [],
        suggestions: ['重新表述您的问题', '检查系统状态', '尝试从基础操作开始'],
        systemStatus: fallbackSystemStatus
      }
    }
  }

  /**
   * 使用真实LLM进行对话
   */
  private async chatWithRealLLM(
    userMessage: string, 
    context?: ChatContext,
    getSystemStatus?: () => Promise<LearningSystemStatus>
  ): Promise<AgentChatResponse> {
    try {
      log(`[AgentChat] Using real LLM with intelligent tool calling`)
      
      // 收集当前学习状态信息
      const systemStatus = getSystemStatus ? await getSystemStatus() : null
      const assessment = getCurrentAssessment()
      const abilityProfile = getAbilityProfile()
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
      // 构建上下文信息
      let contextInfo = this.buildContextInfo(systemStatus, assessment, goals, paths)

      // 添加聊天历史上下文
      if (context?.chatHistory && context.chatHistory.length > 0) {
        contextInfo += this.buildChatHistoryContext(context.chatHistory)
      }

      // 导入AI工具定义和服务
      const { AGENT_TOOLS } = await import('../../modules/coreData/agentTools')
      const { getAIResponseWithTools } = await import('../../components/AIAssistant/service')
      
      // 使用LLM进行智能工具调用
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
      const suggestions = systemStatus 
        ? suggestionGeneratorService.generateSmartSuggestions(result.response, systemStatus)
        : []

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

      log(`[AgentChat] LLM tool calling completed, tools used:`, result.toolCalls.map(tc => tc.name))

      return {
        response: result.response,
        toolsUsed: result.toolCalls.map(tc => tc.name),
        suggestions,
        systemStatus: systemStatus || {} as LearningSystemStatus
      }

    } catch (error) {
      log(`[AgentChat] LLM tool calling failed:`, error)
      
      // 工具调用失败时回退到基本功能
      const systemStatus = getSystemStatus ? await getSystemStatus() : {} as LearningSystemStatus
      
      return {
        response: `抱歉，AI助手暂时不可用。错误信息：${error instanceof Error ? error.message : '未知错误'}\n\n请检查：\n1. API Key是否正确配置\n2. 网络连接是否正常\n3. API额度是否充足\n\n您可以尝试使用其他演示功能。`,
        toolsUsed: [],
        suggestions: ['检查API配置', '尝试其他演示功能', '查看系统状态'],
        systemStatus
      }
    }
  }

  /**
   * 构建上下文信息
   */
  private buildContextInfo(systemStatus: any, assessment: any, goals: any[], paths: any[]): string {
    let contextInfo = ''

    if (systemStatus) {
      contextInfo = `学习系统状态：
当前阶段: ${systemStatus.currentPhase}
设置完成度: ${systemStatus.setupComplete ? '已完成' : '进行中'}
学习进度: ${Math.round(systemStatus.progress.overallProgress)}%
活跃目标: ${systemStatus.progress.activeGoals}个
活跃路径: ${systemStatus.progress.activePaths}个`
    }

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

    return contextInfo
  }

  /**
   * 构建聊天历史上下文
   */
  private buildChatHistoryContext(chatHistory: any[]): string {
    const recentMessages = chatHistory.slice(-3)
    let historyContext = `\n\n对话历史：`
    recentMessages.forEach((msg: any) => {
      if (msg.type === 'user') {
        historyContext += `\n用户: ${msg.content}`
      } else if (msg.type === 'agent') {
        historyContext += `\nAI: ${msg.content.substring(0, 100)}...`
      }
    })
    return historyContext
  }

  /**
   * 根据意图执行相应的操作
   */
  private async executeIntentActions(
    intent: UserIntent, 
    userMessage: string, 
    context?: ChatContext
  ): Promise<ToolExecutionResult> {
    const results: any[] = []
    const toolsUsed: string[] = []
    const errors: string[] = []
    
    try {
      for (const toolName of intent.suggestedTools) {
        try {
          // 根据工具类型准备参数
          const params = intentAnalysisService.prepareToolParameters(toolName, userMessage, context)
          const result = await agentToolExecutor.executeTool(toolName, params)
          
          results.push(result)
          toolsUsed.push(toolName)
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`${toolName}: ${errorMsg}`)
          log(`[AgentChat] Tool execution failed: ${toolName}`, error)
        }
      }
      
      return {
        success: errors.length === 0,
        results,
        toolsUsed,
        errors
      }
      
    } catch (error) {
      log('[AgentChat] Intent execution failed:', error)
      return {
        success: false,
        results: [],
        toolsUsed: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * 生成AI Agent响应
   */
  private async generateAgentResponse(
    intent: UserIntent, 
    actionResult: ToolExecutionResult, 
    userMessage: string
  ): Promise<string> {
    if (!actionResult.success && actionResult.errors.length > 0) {
      return `我在处理您的请求时遇到了一些问题：${actionResult.errors.join(', ')}。请提供更多信息或尝试其他操作。`
    }

    const result = actionResult.results[0]
    
    return this.generateResponseByIntentType(intent.type, result, userMessage)
  }

  /**
   * 根据意图类型生成响应
   */
  private generateResponseByIntentType(intentType: string, result: any, userMessage: string): string {
    switch (intentType) {
      // 查询类响应
      case 'query_goals':
        return this.generateGoalsQueryResponse(result)
      case 'query_paths':
        return this.generatePathsQueryResponse(result)
      case 'query_courses':
        return this.generateCoursesQueryResponse(result)
      case 'query_progress':
        return this.generateProgressQueryResponse(result)
      case 'query_context':
        return this.generateContextQueryResponse(result)
      
      // 分析类响应
      case 'ability_analysis':
        return this.generateAbilityAnalysisResponse(result)
      
      // 创建/设置类响应
      case 'goal_setting':
        return '我已经帮您创建了学习目标。接下来我们可以为这个目标制定详细的学习路径。您希望以什么样的节奏进行学习？'
      case 'path_generation':
        return this.generatePathGenerationResponse(result)
      
      // 状态跟踪类响应
      case 'progress_tracking':
        return this.generateProgressTrackingResponse(result)
      
      // 帮助类响应
      case 'difficulty_help':
        return `我理解您遇到的困难。${result?.message || ''}我建议您：${result?.solution?.suggestions?.join('、') || '寻求更详细的解释和练习'}。需要我为您提供更具体的帮助吗？`
      case 'pace_adjustment':
        return `${result?.message || '我已经根据您的反馈调整了学习节奏。'}建议：${result?.adjustments?.recommendedAction || '保持当前的学习计划'}`
      case 'next_action':
        return this.generateNextActionResponse(result)
      case 'schedule_planning':
        return this.generateSchedulePlanningResponse(result)
      
      default:
        return '我正在分析您的请求。根据当前情况，建议您明确学习目标或告诉我您希望我帮您做什么。'
    }
  }

  // 响应生成辅助方法
  private generateGoalsQueryResponse(result: any): string {
    if (result?.goals?.length > 0) {
      const goalsText = result.goals.map((goal: any, index: number) => 
        `${index + 1}. ${goal.title} (${goal.category}, ${goal.status})`
      ).join('\n')
      return `您当前有 ${result.total} 个学习目标，其中筛选后显示 ${result.filtered} 个：\n\n${goalsText}\n\n${result.total > result.filtered ? '使用筛选条件可以查看更多目标。' : ''}您想了解哪个目标的详细信息吗？`
    } else {
      return '您还没有设定任何学习目标。建议您先创建一个学习目标来开始您的学习之旅！我可以帮您推荐一些适合的目标。'
    }
  }

  private generatePathsQueryResponse(result: any): string {
    if (result?.paths?.length > 0) {
      const pathsText = result.paths.map((path: any, index: number) => 
        `${index + 1}. ${path.title} - 进度: ${path.completedNodes}/${path.totalNodes} 节点 (${path.status})`
      ).join('\n')
      return `您当前有 ${result.total} 条学习路径，其中筛选后显示 ${result.filtered} 条：\n\n${pathsText}\n\n您想查看哪条路径的详细内容吗？`
    } else {
      return '您还没有生成任何学习路径。建议您先设定学习目标，然后我可以为您生成个性化的学习路径。'
    }
  }

  private generateCoursesQueryResponse(result: any): string {
    if (result?.units?.length > 0) {
      const unitsText = Object.entries(result.unitsByType || {}).map(([type, count]) => 
        `${type}: ${count} 个`
      ).join('，')
      return `您当前有 ${result.total} 个课程单元，其中筛选后显示 ${result.filtered} 个。\n按类型分布：${unitsText}\n\n您想查看具体的课程内容吗？`
    } else {
      return '您还没有任何课程内容。建议您先创建学习路径，然后为路径节点生成相应的课程内容。'
    }
  }

  private generateProgressQueryResponse(result: any): string {
    if (result?.summary) {
      const summary = result.summary
      return `📊 学习摘要报告：\n\n整体进度：${summary.overallProgress}%\n活跃目标：${summary.activeGoals} 个\n活跃路径：${summary.activePaths} 个\n已完成节点：${summary.completedNodes}/${summary.totalNodes}\n主要学习领域：${summary.topLearningArea || '无'}\n\n💡 建议：${result.recommendations?.[0] || '继续保持学习节奏！'}`
    } else {
      return '暂时无法生成学习摘要。建议您先完成能力评估并设定学习目标。'
    }
  }

  private generateContextQueryResponse(result: any): string {
    if (result) {
      return `📋 学习上下文概览：\n\n${result.hasAbilityProfile ? '✅' : '❌'} 能力档案\n活跃目标：${result.activeGoals} 个\n活跃路径：${result.activePaths} 个\n课程单元：${result.totalCourseUnits} 个\n当前重点：${result.currentFocus}\n\n💡 推荐：${result.nextRecommendation}`
    } else {
      return '无法获取学习上下文信息。请稍后重试。'
    }
  }

  private generateAbilityAnalysisResponse(result: any): string {
    if (result?.hasAbilityData) {
      return `根据您的能力评估，您的总体水平为 ${result.overallScore}/10。优势领域包括：${result.strengths.join(', ')}。建议重点提升：${result.weaknesses.join(', ')}。${result.recommendation}`
    } else {
      return '您还没有完成能力评估。建议先进行能力测试，这样我就能为您提供更个性化的学习建议了。'
    }
  }

  private generatePathGenerationResponse(result: any): string {
    if (result?.nodes?.length > 0) {
      return `我为您生成了包含 ${result.nodes.length} 个学习节点的学习路径，预计需要 ${result.totalEstimatedHours} 小时完成。路径包括：${result.nodes.slice(0, 3).map((n: any) => n.title).join('、')}等内容。`
    } else {
      return '生成学习路径需要先设定明确的学习目标。请告诉我您想学习什么？'
    }
  }

  private generateProgressTrackingResponse(result: any): string {
    if (result?.overallProgress !== undefined) {
      return `您当前的学习进度是 ${Math.round(result.overallProgress)}%。已完成 ${result.completedNodes || 0} 个学习节点，还有 ${(result.totalNodes || 0) - (result.completedNodes || 0)} 个待完成。${result.insights?.[0] || '继续保持！'}`
    } else {
      return '您还没有开始任何学习路径。建议先设定学习目标并生成学习计划。'
    }
  }

  private generateNextActionResponse(result: any): string {
    if (result?.suggestions?.length > 0) {
      return `根据您当前的学习状态，我建议您：${result.suggestions.join('，或者')}。${result.currentStatus ? `您目前有 ${result.currentStatus.activeGoals} 个活跃目标和 ${result.currentStatus.activePaths} 个学习路径。` : ''}`
    } else {
      return '让我分析一下您的学习状态，稍等片刻...'
    }
  }

  private generateSchedulePlanningResponse(result: any): string {
    if (result?.schedule?.length > 0) {
      return `基于您每周 ${result.weeklyHours} 小时的学习时间，我为您制定了学习计划。预计 ${result.estimatedCompletionWeeks} 周完成目标。建议您：${result.tips?.[0] || '保持规律的学习习惯'}`
    } else {
      return '制定学习计划需要了解您的可用时间。请告诉我您每周能投入多少时间学习？'
    }
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
}

export const agentChatService = new AgentChatService() 