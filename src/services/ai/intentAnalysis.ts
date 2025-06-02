import { UserIntent, IntentDefinition, ChatContext } from './types'

/**
 * 用户意图分析服务
 */
export class IntentAnalysisService {
  private intentDefinitions: IntentDefinition[] = [
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

  /**
   * 分析用户意图
   */
  async analyzeUserIntent(userMessage: string, context?: ChatContext): Promise<UserIntent> {
    const message = userMessage.toLowerCase()
    
    let bestMatch: UserIntent = { 
      type: 'general', 
      confidence: 0, 
      entities: [], 
      suggestedTools: ['suggest_next_action'] 
    }
    
    for (const intent of this.intentDefinitions) {
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
   * 为工具准备参数
   */
  prepareToolParameters(toolName: string, userMessage: string, context?: ChatContext): any {
    const systemStatus = context?.systemStatus || { activeGoals: [], activePaths: [] }
    
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
          pathId: context?.currentPathId,
          timeRange: context?.timeRange || 'week'
        }
        
      default:
        return {}
    }
  }

  /**
   * 推断用户偏好的解决方案
   */
  private inferPreferredSolution(message: string): string {
    if (message.includes('例子') || message.includes('示例')) return 'example'
    if (message.includes('练习') || message.includes('练一练')) return 'practice'
    if (message.includes('换个') || message.includes('其他')) return 'alternative'
    return 'explanation'
  }

  /**
   * 推断节奏调整方向
   */
  private inferPaceAdjustment(message: string): string {
    if (message.includes('快') || message.includes('加速')) return 'faster'
    if (message.includes('慢') || message.includes('减速')) return 'slower'
    if (message.includes('简单') || message.includes('容易')) return 'easier'
    if (message.includes('难') || message.includes('挑战')) return 'harder'
    return 'slower' // 默认放慢节奏
  }

  /**
   * 从消息中提取可能使用的工具
   */
  extractToolsFromMessage(userMessage: string, aiResponse: string): string[] {
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
}

export const intentAnalysisService = new IntentAnalysisService() 