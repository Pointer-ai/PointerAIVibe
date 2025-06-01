// AI Agent 工具调用系统
import { 
  createLearningGoal, 
  getLearningGoals, 
  updateLearningGoal,
  deleteLearningGoal,
  createLearningPath, 
  getLearningPaths,
  updateLearningPath,
  deleteLearningPath,
  createCourseUnit, 
  getCourseUnits,
  updateCourseUnit,
  deleteCourseUnit,
  recordAgentAction,
  getAbilityProfile,
  addCoreEvent
} from './service'
import { LearningGoal, LearningPath, PathNode, CourseUnit, AgentTool } from './types'
import { log } from '../../utils/logger'
import { addActivityRecord } from '../profileSettings/service'
import { getCurrentAssessment } from '../abilityAssess/service'
import { setProfileData } from '../../utils/profile'
import { callAI } from '../../utils/ai'
import { AbilityAssessment } from '../abilityAssess/types'
import { 
  goalActivationManager,
  getActivationStats
} from './goalActivationManager'

/**
 * AI Agent 可用工具定义
 */
export const AGENT_TOOLS: AgentTool[] = [
  // ========== 学习目标 CRUD ==========
  {
    name: 'get_learning_goals',
    description: '获取用户的所有学习目标列表，支持按状态筛选',
    parameters: {
      status: { 
        type: 'string', 
        enum: ['active', 'completed', 'paused', 'cancelled', 'all'],
        description: '目标状态筛选，默认all',
        optional: true 
      }
    }
  },
  {
    name: 'get_learning_goal',
    description: '获取特定学习目标的详细信息',
    parameters: {
      goalId: { type: 'string', description: '目标ID' }
    }
  },
  {
    name: 'create_learning_goal',
    description: '创建新的学习目标，支持设置目标状态',
    parameters: {
      title: { type: 'string', description: '目标标题' },
      description: { type: 'string', description: '目标详细描述' },
      category: { 
        type: 'string', 
        enum: ['frontend', 'backend', 'fullstack', 'automation', 'ai', 'mobile', 'game', 'data', 'custom'],
        description: '目标类别' 
      },
      priority: { type: 'number', description: '优先级 (1-5)' },
      targetLevel: { 
        type: 'string', 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        description: '目标水平' 
      },
      estimatedTimeWeeks: { type: 'number', description: '预计完成时间（周）' },
      requiredSkills: { type: 'array', items: { type: 'string' }, description: '需要的技能列表' },
      outcomes: { type: 'array', items: { type: 'string' }, description: '预期学习成果' },
    }
  },
  {
    name: 'update_learning_goal',
    description: '更新现有的学习目标，修改目标属性或状态',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      updates: { type: 'object', description: '要更新的字段' }
    }
  },
  {
    name: 'delete_learning_goal',
    description: '删除学习目标',
    parameters: {
      goalId: { type: 'string', description: '目标ID' }
    }
  },

  // ========== 学习路径 CRUD ==========
  {
    name: 'get_learning_paths',
    description: '获取用户的所有学习路径列表，支持按目标和状态筛选',
    parameters: {
      goalId: { type: 'string', description: '目标ID筛选', optional: true },
      status: { 
        type: 'string', 
        enum: ['draft', 'active', 'completed', 'archived', 'all'],
        description: '路径状态筛选，默认all',
        optional: true 
      }
    }
  },
  {
    name: 'get_learning_path',
    description: '获取特定学习路径的详细信息，包括所有节点和进度',
    parameters: {
      pathId: { type: 'string', description: '路径ID' }
    }
  },
  {
    name: 'create_learning_path',
    description: '根据学习目标和用户能力创建个性化学习路径',
    parameters: {
      goalId: { type: 'string', description: '关联的学习目标ID' },
      title: { type: 'string', description: '路径标题' },
      description: { type: 'string', description: '路径描述' },
      nodes: { 
        type: 'array', 
        items: { type: 'object' },
        description: '学习节点列表' 
      },
      dependencies: { 
        type: 'array', 
        items: { type: 'object' },
        description: '节点依赖关系' 
      },
      milestones: { 
        type: 'array', 
        items: { type: 'object' },
        description: '里程碑设置' 
      }
    }
  },
  {
    name: 'update_learning_path',
    description: '更新学习路径，调整节点顺序、添加新内容或修改现有内容',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      updates: { type: 'object', description: '要更新的字段' }
    }
  },
  {
    name: 'delete_learning_path',
    description: '删除学习路径',
    parameters: {
      pathId: { type: 'string', description: '路径ID' }
    }
  },

  // ========== 课程内容 CRUD ==========
  {
    name: 'get_course_units',
    description: '获取课程单元列表，支持按节点和类型筛选',
    parameters: {
      nodeId: { type: 'string', description: '节点ID筛选', optional: true },
      type: { 
        type: 'string', 
        enum: ['theory', 'example', 'exercise', 'project', 'quiz', 'all'],
        description: '内容类型筛选，默认all',
        optional: true 
      }
    }
  },
  {
    name: 'get_course_unit',
    description: '获取特定课程单元的详细内容',
    parameters: {
      unitId: { type: 'string', description: '课程单元ID' }
    }
  },
  {
    name: 'create_course_unit',
    description: '为学习路径节点创建具体的课程内容',
    parameters: {
      nodeId: { type: 'string', description: '关联的路径节点ID' },
      title: { type: 'string', description: '课程单元标题' },
      description: { type: 'string', description: '课程描述' },
      type: { 
        type: 'string', 
        enum: ['theory', 'example', 'exercise', 'project', 'quiz'],
        description: '课程类型' 
      },
      content: { type: 'object', description: '课程内容对象' },
      metadata: { type: 'object', description: '课程元数据' }
    }
  },
  {
    name: 'update_course_unit',
    description: '更新课程内容，修改教学材料、练习或评估内容',
    parameters: {
      unitId: { type: 'string', description: '课程单元ID' },
      updates: { type: 'object', description: '要更新的字段' }
    }
  },
  {
    name: 'delete_course_unit',
    description: '删除课程单元',
    parameters: {
      unitId: { type: 'string', description: '课程单元ID' }
    }
  },

  // ========== 分析和智能功能 ==========
  {
    name: 'analyze_user_ability',
    description: '分析用户当前能力状况，为路径规划提供依据',
    parameters: {}
  },
  {
    name: 'get_learning_context',
    description: '获取用户的完整学习上下文，包括目标、路径和进度统计',
    parameters: {}
  },
  {
    name: 'get_learning_summary',
    description: '获取学习情况的详细摘要报告',
    parameters: {
      timeRange: { 
        type: 'string', 
        enum: ['week', 'month', 'quarter', 'all'],
        description: '统计时间范围，默认all',
        optional: true 
      }
    }
  },
  {
    name: 'calculate_skill_gap',
    description: '计算用户当前能力与目标要求之间的技能差距',
    parameters: {
      goalId: { type: 'string', description: '目标ID' }
    }
  },
  {
    name: 'generate_path_nodes',
    description: '基于技能差距和学习目标智能生成学习路径节点',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      userLevel: { type: 'string', description: '用户当前水平' },
      preferences: { type: 'object', description: '学习偏好设置' }
    }
  },

  // ========== 学习管理和调整 ==========
  {
    name: 'adjust_learning_pace',
    description: '根据用户反馈调整学习节奏和难度',
    parameters: {
      pathId: { type: 'string', description: '学习路径ID' },
      feedback: { type: 'string', description: '用户反馈' },
      adjustment: { 
        type: 'string', 
        enum: ['faster', 'slower', 'easier', 'harder'],
        description: '调整方向' 
      }
    }
  },
  {
    name: 'suggest_next_action',
    description: '基于当前学习状态建议下一步行动',
    parameters: {
      userId: { type: 'string', description: '用户ID', optional: true }
    }
  },
  {
    name: 'handle_learning_difficulty',
    description: '处理用户遇到的学习困难，提供解决方案',
    parameters: {
      nodeId: { type: 'string', description: '当前学习节点ID' },
      difficulty: { type: 'string', description: '遇到的困难描述' },
      preferredSolution: { 
        type: 'string', 
        enum: ['explanation', 'example', 'practice', 'alternative'],
        description: '偏好的解决方案类型' 
      }
    }
  },
  {
    name: 'generate_personalized_content',
    description: '根据用户学习风格生成个性化内容',
    parameters: {
      nodeId: { type: 'string', description: '学习节点ID' },
      learningStyle: { 
        type: 'string', 
        enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
        description: '学习风格' 
      },
      difficulty: { type: 'number', min: 1, max: 5, description: '内容难度' }
    }
  },
  {
    name: 'track_learning_progress',
    description: '跟踪和分析学习进度，提供进度报告',
    parameters: {
      pathId: { type: 'string', description: '学习路径ID', optional: true },
      timeRange: { type: 'string', description: '时间范围', optional: true }
    }
  },
  {
    name: 'recommend_study_schedule',
    description: '根据用户时间安排推荐学习计划',
    parameters: {
      availableHoursPerWeek: { type: 'number', description: '每周可用学习时间' },
      preferredStudyTimes: { 
        type: 'array', 
        items: { type: 'string' },
        description: '偏好的学习时间段' 
      },
      goalId: { type: 'string', description: '学习目标ID' }
    }
  },

  // ========== 能力档案管理 ==========
  {
    name: 'update_ability_assessment',
    description: '更新能力评估数据，修正或增强现有的技能评分和置信度',
    parameters: {
      dimension: { 
        type: 'string', 
        enum: ['programming', 'algorithm', 'project', 'systemDesign', 'communication'],
        description: '要更新的能力维度'
      },
      skill: { type: 'string', description: '要更新的具体技能名称' },
      newScore: { type: 'number', min: 0, max: 100, description: '新的技能分数', optional: true },
      evidence: { type: 'string', description: '支持该分数的证据或经历描述' },
      confidenceBoost: { type: 'boolean', description: '是否提升该技能的置信度', optional: true }
    }
  },
  {
    name: 'add_skill_evidence',
    description: '为特定技能添加新的证据或经历，提升评估准确性',
    parameters: {
      dimension: { 
        type: 'string', 
        enum: ['programming', 'algorithm', 'project', 'systemDesign', 'communication'],
        description: '技能所属维度'
      },
      skill: { type: 'string', description: '技能名称' },
      evidenceType: { 
        type: 'string',
        enum: ['project', 'work_experience', 'education', 'certification', 'achievement'],
        description: '证据类型'
      },
      description: { type: 'string', description: '详细的证据描述' },
      impact: { 
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '该证据对技能评估的影响程度'
      }
    }
  },
  {
    name: 'correct_ability_profile',
    description: '用户主动修正AI评估的能力档案，提供更准确的自我评价',
    parameters: {
      corrections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dimension: { type: 'string' },
            skill: { type: 'string' },
            actualScore: { type: 'number', min: 0, max: 100 },
            reason: { type: 'string' },
            evidence: { type: 'string', optional: true }
          }
        },
        description: '要修正的技能列表'
      },
      overallFeedback: { type: 'string', description: '对整体评估的反馈', optional: true }
    }
  },
  {
    name: 'enhance_skill_confidence',
    description: '通过提供额外信息来增强特定技能的置信度',
    parameters: {
      targetSkills: {
        type: 'array',
        items: { type: 'string' },
        description: '要增强置信度的技能列表'
      },
      additionalInfo: { type: 'string', description: '额外的技能相关信息或经历' },
      selfRating: {
        type: 'object',
        description: '用户对这些技能的自我评价',
        optional: true
      }
    }
  },
  {
    name: 'reassess_ability_dimension',
    description: '重新评估特定能力维度，基于新提供的信息或反馈',
    parameters: {
      dimension: { 
        type: 'string', 
        enum: ['programming', 'algorithm', 'project', 'systemDesign', 'communication'],
        description: '要重新评估的维度'
      },
      newInformation: { type: 'string', description: '新的技能相关信息' },
      focusSkills: {
        type: 'array',
        items: { type: 'string' },
        description: '重点关注的技能列表',
        optional: true
      }
    }
  },
  {
    name: 'get_ability_improvement_suggestions',
    description: '基于当前能力档案提供具体的能力提升建议',
    parameters: {
      targetDimension: { 
        type: 'string', 
        enum: ['programming', 'algorithm', 'project', 'systemDesign', 'communication', 'all'],
        description: '想要提升的维度，默认all',
        optional: true
      },
      timeFrame: {
        type: 'string',
        enum: ['1_month', '3_months', '6_months', '1_year'],
        description: '期望的提升时间框架',
        optional: true
      }
    }
  },
  // ========== 新增：目标激活管理工具 ==========
  {
    name: 'get_activation_stats_detailed',
    description: '获取目标激活统计详细信息',
    parameters: {}
  },
  {
    name: 'activate_goal_advanced',
    description: '高级激活目标',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      force: { type: 'boolean', description: '是否强制激活', optional: true },
      priority: { type: 'number', description: '优先级', optional: true },
      reason: { type: 'string', description: '激活理由' }
    }
  },
  {
    name: 'pause_goal_advanced',
    description: '高级暂停目标',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      reason: { type: 'string', description: '暂停理由' }
    }
  },
  {
    name: 'complete_goal_advanced',
    description: '高级完成目标',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      achievements: { type: 'array', items: { type: 'string' }, description: '成就列表' }
    }
  },
  {
    name: 'batch_activate_goals',
    description: '批量激活目标',
    parameters: {
      goalIds: { type: 'array', items: { type: 'string' }, description: '目标ID列表' },
      maxConcurrent: { type: 'number', description: '最大并发激活数量', optional: true },
      priorityOrder: { type: 'boolean', description: '是否按优先级顺序激活', optional: true }
    }
  },
  {
    name: 'reorder_active_goals',
    description: '重新排序激活目标',
    parameters: {
      priorityGoalIds: { type: 'array', items: { type: 'string' }, description: '优先级目标ID列表' }
    }
  },
  {
    name: 'get_activation_suggestions',
    description: '获取激活建议',
    parameters: {}
  },
  {
    name: 'configure_goal_activation',
    description: '配置目标激活设置',
    parameters: {
      maxActiveGoals: { type: 'number', description: '最大激活目标数量', optional: true },
      syncRelatedPaths: { type: 'boolean', description: '是否同步相关路径', optional: true },
      allowPriorityOverride: { type: 'boolean', description: '是否允许优先级覆盖', optional: true }
    }
  }
]

/**
 * AI Agent 工具执行器
 */
export class AgentToolExecutor {
  
  /**
   * 执行工具调用
   */
  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    try {
      log(`[AgentTools] Executing tool: ${toolName}`)
      
      let result: any
      
      switch (toolName) {
        // ========== 学习目标 CRUD ==========
        case 'get_learning_goals':
          result = await this.getLearningGoalsTool(parameters)
          break
          
        case 'get_learning_goal':
          result = await this.getLearningGoalTool(parameters)
          break
          
        case 'create_learning_goal':
          result = await this.createLearningGoalTool(parameters)
          break
          
        case 'update_learning_goal':
          result = await this.updateLearningGoalTool(parameters)
          break
          
        case 'delete_learning_goal':
          result = await this.deleteLearningGoalTool(parameters)
          break

        // ========== 学习路径 CRUD ==========
        case 'get_learning_paths':
          result = await this.getLearningPathsTool(parameters)
          break
          
        case 'get_learning_path':
          result = await this.getLearningPathTool(parameters)
          break
          
        case 'create_learning_path':
          result = await this.createLearningPathTool(parameters)
          break
          
        case 'update_learning_path':
          result = await this.updateLearningPathTool(parameters)
          break
          
        case 'delete_learning_path':
          result = await this.deleteLearningPathTool(parameters)
          break

        // ========== 课程内容 CRUD ==========
        case 'get_course_units':
          result = await this.getCourseUnitsTool(parameters)
          break
          
        case 'get_course_unit':
          result = await this.getCourseUnitTool(parameters)
          break
          
        case 'create_course_unit':
          result = await this.createCourseUnitTool(parameters)
          break
          
        case 'update_course_unit':
          result = await this.updateCourseUnitTool(parameters)
          break
          
        case 'delete_course_unit':
          result = await this.deleteCourseUnitTool(parameters)
          break

        // ========== 分析和智能功能 ==========
        case 'analyze_user_ability':
          result = await this.analyzeUserAbilityTool()
          break
          
        case 'get_learning_context':
          result = await this.getLearningContextTool()
          break
          
        case 'get_learning_summary':
          result = await this.getLearningSummaryTool(parameters)
          break
          
        case 'calculate_skill_gap':
          result = await this.calculateSkillGapTool(parameters)
          break
          
        case 'generate_path_nodes':
          result = await this.generatePathNodesTool(parameters)
          break

        // ========== 学习管理和调整 ==========
        case 'adjust_learning_pace':
          result = await this.adjustLearningPaceTool(parameters)
          break

        case 'suggest_next_action':
          result = await this.suggestNextActionTool(parameters)
          break

        case 'handle_learning_difficulty':
          result = await this.handleLearningDifficultyTool(parameters)
          break

        case 'generate_personalized_content':
          result = await this.generatePersonalizedContentTool(parameters)
          break

        case 'track_learning_progress':
          result = await this.trackLearningProgressTool(parameters)
          break

        case 'recommend_study_schedule':
          result = await this.recommendStudyScheduleTool(parameters)
          break
          
        // ========== 能力档案管理 ==========
        case 'update_ability_assessment':
          result = await this.updateAbilityAssessmentTool(parameters)
          break
        case 'add_skill_evidence':
          result = await this.addSkillEvidenceTool(parameters)
          break
        case 'correct_ability_profile':
          result = await this.correctAbilityProfileTool(parameters)
          break
        case 'enhance_skill_confidence':
          result = await this.enhanceSkillConfidenceTool(parameters)
          break
        case 'reassess_ability_dimension':
          result = await this.reassessAbilityDimensionTool(parameters)
          break
        case 'get_ability_improvement_suggestions':
          result = await this.getAbilityImprovementSuggestionsTool(parameters)
          break
        // ========== 新增：目标激活管理工具 ==========
        case 'get_activation_stats_detailed':
          result = await this.getActivationStatsDetailedTool(parameters)
          break
        case 'activate_goal_advanced':
          result = await this.activateGoalAdvancedTool(parameters)
          break
        case 'pause_goal_advanced':
          result = await this.pauseGoalAdvancedTool(parameters)
          break
        case 'complete_goal_advanced':
          result = await this.completeGoalAdvancedTool(parameters)
          break
        case 'batch_activate_goals':
          result = await this.batchActivateGoalsTool(parameters)
          break
        case 'reorder_active_goals':
          result = await this.reorderActiveGoalsTool(parameters)
          break
        case 'configure_goal_activation':
          result = await this.configureGoalActivationTool(parameters)
          break
          
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
      
      // 记录工具执行到coreData（旧的agent actions）
      recordAgentAction({
        toolName,
        parameters,
        result
      })
      
      // 记录工具执行到活动历史（新的活动记录）
      addActivityRecord({
        type: 'function_call',
        action: `AI工具调用: ${toolName}`,
        details: {
          toolName,
          parameterCount: Object.keys(parameters).length,
          success: true,
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
        }
      })
      
      log(`[AgentTools] Tool executed successfully: ${toolName}`)
      return result
      
    } catch (error) {
      log(`[AgentTools] Tool execution failed: ${toolName}`, error)
      
      // 记录失败的工具执行到coreData
      recordAgentAction({
        toolName,
        parameters,
        result: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      // 记录失败的工具执行到活动历史
      addActivityRecord({
        type: 'function_call',
        action: `AI工具调用失败: ${toolName}`,
        details: {
          toolName,
          parameterCount: Object.keys(parameters).length,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }
  
  // ========== 工具实现 ==========
  
  private async createLearningGoalTool(params: any): Promise<LearningGoal> {
    // 检查当前激活目标数量
    const allGoals = getLearningGoals()
    const activeGoals = allGoals.filter(g => g.status === 'active')
    const requestedStatus = 'active' // 默认为active
    
    if (requestedStatus === 'active' && activeGoals.length >= 3) {
      // 如果超出限制，创建为暂停状态
      const goal = createLearningGoal({
        ...params,
        status: 'paused'
      })
      
      // 返回带有系统消息的扩展对象
      return Object.assign(goal, {
        _systemMessage: `由于已有3个激活目标，新目标已创建为暂停状态。可以手动激活。`
      })
    }
    
    // 正常创建
    return createLearningGoal({
      ...params,
      status: requestedStatus
    })
  }
  
  private async updateLearningGoalTool(params: any): Promise<LearningGoal | null> {
    return updateLearningGoal(params.goalId, params.updates)
  }
  
  private async createLearningPathTool(params: any): Promise<LearningPath> {
    // 计算总预估时间
    const totalEstimatedHours = params.nodes?.reduce((total: number, node: PathNode) => {
      return total + (node.estimatedHours || 0)
    }, 0) || 0

    const path = createLearningPath({
      goalId: params.goalId,
      title: params.title,
      description: params.description,
      totalEstimatedHours,
      nodes: params.nodes || [],
      dependencies: params.dependencies || [],
      milestones: params.milestones || [],
      version: '1.0.0',
      status: 'draft'
    })
    return path
  }
  
  private async updateLearningPathTool(params: any): Promise<LearningPath | null> {
    return updateLearningPath(params.pathId, params.updates)
  }
  
  private async createCourseUnitTool(params: any): Promise<CourseUnit> {
    const unit = createCourseUnit({
      nodeId: params.nodeId,
      title: params.title,
      description: params.description,
      type: params.type,
      content: params.content,
      metadata: params.metadata || {
        difficulty: 3,
        estimatedTime: 60,
        keywords: [],
        learningObjectives: []
      }
    })
    
    return unit
  }
  
  private async updateCourseUnitTool(params: any): Promise<CourseUnit | null> {
    return updateCourseUnit(params.unitId, params.updates)
  }
  
  private async analyzeUserAbilityTool(): Promise<any> {
    const ability = getAbilityProfile()
    
    if (!ability) {
      return {
        hasAbilityData: false,
        recommendation: '建议先完成能力评估',
        analysis: null
      }
    }
    
    // 分析能力数据
    const strengths = this.identifyStrengths(ability)
    const weaknesses = this.identifyWeaknesses(ability)
    
    return {
      hasAbilityData: true,
      overallScore: ability.overallScore,
      strengths,
      weaknesses,
      recommendation: this.generateAbilityRecommendation(ability),
      lastAssessed: ability.lastAssessed
    }
  }
  
  private async getLearningContextTool(): Promise<any> {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()
    const ability = getAbilityProfile()
    
    const activeGoals = goals.filter(g => g.status === 'active')
    const activePaths = paths.filter(p => p.status === 'active')
    
    return {
      hasAbilityProfile: !!ability,
      activeGoals: activeGoals.length,
      activePaths: activePaths.length,
      totalCourseUnits: units.length,
      currentFocus: activeGoals[0]?.title || 'None',
      nextRecommendation: this.getContextBasedRecommendation(activeGoals, activePaths, units)
    }
  }
  
  private async calculateSkillGapTool(params: any): Promise<any> {
    const { goalId, context } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    const ability = getAbilityProfile()
    
    if (!goal) {
      throw new Error('Goal not found')
    }
    
    // 如果没有能力数据，返回基础分析
    if (!ability && !context?.abilityProfile) {
      return {
        hasAbilityData: false,
        message: '需要完成能力评估以获得个性化技能差距分析',
        basicRecommendation: '建议先进行能力测试，然后制定学习计划'
      }
    }
    
    // 使用传入的上下文或从系统获取能力数据
    const abilityData = context?.abilityProfile || ability
    
    // 基于目标类别和用户能力计算技能差距
    const requiredSkills = this.getRequiredSkillsForGoal(goal)
    
    const skillGaps = requiredSkills.map(skill => {
      const currentLevel = this.getSkillLevel(abilityData, skill)
      const targetLevel = this.getTargetLevelScore(goal.targetLevel)
      const gap = Math.max(0, targetLevel - currentLevel)
      
      return {
        skill,
        currentLevel,
        targetLevel,
        gap,
        priority: gap > 3 ? 'high' : gap > 1 ? 'medium' : 'low',
        // 如果有上下文，使用增强的优先级计算
        enhancedPriority: context ? this.calculateContextualPriority(skill, gap, context) : undefined
      }
    })
    
    const averageGap = skillGaps.reduce((sum, gap) => sum + gap.gap, 0) / skillGaps.length
    
    return {
      hasAbilityData: true,
      skillGaps,
      summary: {
        averageGap,
        highPriorityCount: skillGaps.filter(g => g.priority === 'high').length,
        estimatedWeeks: Math.ceil(averageGap * 2), // 2周per gap point
        // 如果有上下文，提供增强的分析
        enhancedAnalysis: context ? {
          personalizedEstimate: this.calculatePersonalizedTime(skillGaps, context),
          strengthsToLeverage: this.identifyLeverageableStrengths(skillGaps, context),
          focusAreas: this.identifyFocusAreas(skillGaps, context)
        } : undefined
      },
      contextUsed: !!context,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * 计算基于上下文的优先级
   */
  private calculateContextualPriority(skill: string, gap: number, context: any): 'low' | 'medium' | 'high' {
    let score = gap
    
    // 如果是用户的薄弱技能，提高优先级
    if (context.abilityProfile?.weaknesses?.some((w: string) => w.includes(skill))) {
      score += 2
    }
    
    // 如果与目标直接相关，提高优先级
    if (context.currentGoal?.requiredSkills?.includes(skill)) {
      score += 1
    }
    
    // 如果用户有相关的优势技能，可以降低优先级
    if (context.abilityProfile?.strengths?.some((s: string) => s.includes(skill))) {
      score -= 1
    }
    
    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }
  
  /**
   * 计算个性化学习时间
   */
  private calculatePersonalizedTime(skillGaps: any[], context: any): number {
    let baseTime = skillGaps.reduce((sum: number, gap: any) => sum + gap.gap * 1.5, 0)
    
    // 根据用户能力调整
    if (context.abilityProfile) {
      const score = context.abilityProfile.overallScore
      const multiplier = score >= 70 ? 0.8 : score >= 40 ? 1.0 : 1.3
      baseTime *= multiplier
    }
    
    // 根据学习历史调整
    if (context.learningHistory?.completedGoals > 0) {
      baseTime *= 0.9
    }
    
    return Math.ceil(baseTime)
  }
  
  /**
   * 识别可利用的优势
   */
  private identifyLeverageableStrengths(skillGaps: any[], context: any): string[] {
    const strengths: string[] = []
    
    if (context.abilityProfile?.strengths) {
      context.abilityProfile.strengths.forEach((strength: string) => {
        // 查找与优势相关的技能差距
        const relatedGaps = skillGaps.filter((gap: any) => 
          gap.skill.includes(strength) || strength.includes(gap.skill)
        )
        
        if (relatedGaps.length > 0) {
          strengths.push(`利用您在${strength}方面的优势来学习${relatedGaps[0].skill}`)
        }
      })
    }
    
    return strengths
  }
  
  /**
   * 识别重点关注领域
   */
  private identifyFocusAreas(skillGaps: any[], context: any): string[] {
    const focusAreas: string[] = []
    
    // 基于薄弱点确定重点
    if (context.abilityProfile?.weaknesses) {
      context.abilityProfile.weaknesses.forEach((weakness: string) => {
        const relatedGaps = skillGaps.filter((gap: any) => 
          gap.skill.includes(weakness) && gap.priority === 'high'
        )
        
        if (relatedGaps.length > 0) {
          focusAreas.push(`重点补强${weakness}相关技能`)
        }
      })
    }
    
    // 基于目标优先级确定重点
    const highPriorityGaps = skillGaps.filter((gap: any) => gap.priority === 'high')
    if (highPriorityGaps.length > 0) {
      focusAreas.push(`优先掌握${highPriorityGaps[0].skill}等核心技能`)
    }
    
    return focusAreas
  }
  
  /**
   * 获取目标所需的技能列表
   */
  private getRequiredSkillsForGoal(goal: any): string[] {
    // 基于目标类别返回相关技能
    const skillMap: Record<string, string[]> = {
      frontend: ['HTML', 'CSS', 'JavaScript', 'React', '响应式设计', '前端工具'],
      backend: ['编程语言', '数据库', 'API设计', '服务器管理', '数据结构', '算法'],
      fullstack: ['前端技术', '后端技术', '数据库', '系统设计', '项目管理', 'DevOps'],
      automation: ['Python', '脚本编程', '数据处理', '自动化工具', '流程设计'],
      ai: ['机器学习', '深度学习', '数据科学', 'Python', '统计学', '模型部署'],
      mobile: ['移动开发', 'UI设计', '跨平台开发', '性能优化', '发布流程'],
      data: ['数据分析', '数据库', '统计学', '可视化', '数据挖掘', '商业理解']
    }
    
    return skillMap[goal.category] || goal.requiredSkills || ['编程基础', '逻辑思维', '问题解决']
  }
  
  private async generatePathNodesTool(params: any): Promise<PathNode[]> {
    const goal = getLearningGoals().find(g => g.id === params.goalId)
    const ability = getAbilityProfile()
    
    if (!goal) {
      throw new Error('Goal not found')
    }
    
    // 基于目标和用户能力生成节点
    const nodes: PathNode[] = []
    
    // 基础节点模板
    const baseNodes = this.getBaseNodesForCategory(goal.category)
    
    // 根据用户水平调整节点
    const adjustedNodes = this.adjustNodesForUserLevel(baseNodes, params.userLevel, ability)
    
    // 添加个性化偏好
    const personalizedNodes = this.applyUserPreferences(adjustedNodes, params.preferences)
    
    return personalizedNodes
  }
  
  private async adjustLearningPaceTool(params: any): Promise<any> {
    const { pathId, feedback, adjustment } = params
    const path = getLearningPaths().find(p => p.id === pathId)
    
    if (!path) {
      throw new Error('Learning path not found')
    }

    let adjustments: any = {}
    
    switch (adjustment) {
      case 'faster':
        adjustments = {
          recommendedAction: '增加每日学习时间或跳过部分基础内容',
          timeAdjustment: -0.2, // 减少20%时间
          difficultyAdjustment: 0.1 // 稍微增加难度
        }
        break
      case 'slower':
        adjustments = {
          recommendedAction: '减少每日学习量，增加复习时间',
          timeAdjustment: 0.3, // 增加30%时间
          difficultyAdjustment: 0 // 保持难度
        }
        break
      case 'easier':
        adjustments = {
          recommendedAction: '提供更多基础内容和练习',
          timeAdjustment: 0.2, // 增加20%时间
          difficultyAdjustment: -0.2 // 降低难度
        }
        break
      case 'harder':
        adjustments = {
          recommendedAction: '增加挑战性内容和高级练习',
          timeAdjustment: -0.1, // 减少10%时间
          difficultyAdjustment: 0.3 // 增加难度
        }
        break
    }

    // 记录调整事件
    addCoreEvent({
      type: 'learning_pace_adjusted',
      details: {
        pathId,
        feedback,
        adjustment,
        adjustments
      }
    })

    return {
      success: true,
      adjustments,
      message: `学习节奏已根据您的反馈进行调整：${adjustments.recommendedAction}`
    }
  }
  
  private async suggestNextActionTool(params: any): Promise<any> {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()
    const ability = getAbilityProfile()

    const activeGoals = goals.filter(g => g.status === 'active')
    const activePaths = paths.filter(p => p.status === 'active')

    let suggestions: string[] = []
    let priority = 'medium'

    // 分析当前状态并提供建议
    if (!ability) {
      suggestions.push('完成能力评估，了解您的技能水平')
      priority = 'high'
    } else if (activeGoals.length === 0) {
      suggestions.push('设定学习目标，明确您的学习方向')
      priority = 'high'
    } else if (activePaths.length === 0) {
      suggestions.push('为您的学习目标生成个性化学习路径')
      priority = 'high'
    } else {
      // 检查进行中的学习
      const inProgressNodes = activePaths.flatMap(path => 
        path.nodes.filter(node => node.status === 'in_progress')
      )
      
      if (inProgressNodes.length > 0) {
        suggestions.push(`继续学习：${inProgressNodes[0].title}`)
        priority = 'medium'
      } else {
        // 找到下一个未开始的节点
        const nextNodes = activePaths.flatMap(path => 
          path.nodes.filter(node => node.status === 'not_started')
        ).slice(0, 3)
        
        if (nextNodes.length > 0) {
          suggestions.push(`开始新的学习节点：${nextNodes[0].title}`)
          priority = 'medium'
        } else {
          suggestions.push('恭喜！您已完成所有当前的学习内容。考虑设定新的学习目标。')
          priority = 'low'
        }
      }
    }

    return {
      suggestions,
      priority,
      currentStatus: {
        hasAbility: !!ability,
        activeGoals: activeGoals.length,
        activePaths: activePaths.length,
        totalUnits: units.length
      }
    }
  }
  
  private async handleLearningDifficultyTool(params: any): Promise<any> {
    const { nodeId, difficulty, preferredSolution } = params
    
    // 查找相关的课程单元
    const units = getCourseUnits().filter(u => u.nodeId === nodeId)
    
    let solution: any = {
      type: preferredSolution,
      suggestions: []
    }

    switch (preferredSolution) {
      case 'explanation':
        solution.suggestions = [
          '提供更详细的概念解释',
          '添加图示和示例来说明概念',
          '将复杂概念分解为更小的部分'
        ]
        break
      case 'example':
        solution.suggestions = [
          '提供更多实际应用示例',
          '展示循序渐进的代码示例',
          '提供对比示例说明差异'
        ]
        break
      case 'practice':
        solution.suggestions = [
          '增加基础练习题',
          '提供带提示的练习',
          '创建渐进式难度的练习序列'
        ]
        break
      case 'alternative':
        solution.suggestions = [
          '推荐替代学习资源',
          '调整学习路径顺序',
          '提供不同的学习方法'
        ]
        break
    }

    // 记录困难处理事件
    addCoreEvent({
      type: 'learning_difficulty_handled',
      details: {
        nodeId,
        difficulty,
        preferredSolution,
        solution
      }
    })

    return {
      success: true,
      solution,
      message: '我已经为您准备了针对性的解决方案'
    }
  }
  
  private async generatePersonalizedContentTool(params: any): Promise<any> {
    const { nodeId, learningStyle, difficulty } = params
    
    // 根据学习风格生成个性化内容建议
    let contentSuggestions: any = {
      learningStyle,
      difficulty,
      recommendations: []
    }

    switch (learningStyle) {
      case 'visual':
        contentSuggestions.recommendations = [
          '添加图表、流程图和可视化示例',
          '使用颜色编码和高亮重点',
          '提供视频教程和演示',
          '创建思维导图和概念图'
        ]
        break
      case 'auditory':
        contentSuggestions.recommendations = [
          '提供音频解释和播客资源',
          '建议录制自己的学习笔记',
          '推荐讨论和口头复述',
          '提供音频版本的内容'
        ]
        break
      case 'kinesthetic':
        contentSuggestions.recommendations = [
          '增加动手实践项目',
          '提供交互式编程练习',
          '创建实验性学习任务',
          '鼓励构建实际应用'
        ]
        break
      case 'reading':
        contentSuggestions.recommendations = [
          '提供详细的文档和教程',
          '推荐高质量的技术书籍',
          '创建结构化的阅读材料',
          '提供代码注释和文档示例'
        ]
        break
    }

    // 根据难度调整建议
    if (difficulty <= 2) {
      contentSuggestions.recommendations.push('从基础概念开始，提供充分的背景知识')
    } else if (difficulty >= 4) {
      contentSuggestions.recommendations.push('提供高级应用和挑战性项目')
    }

    return {
      success: true,
      contentSuggestions,
      message: `已为您的${learningStyle}学习风格生成个性化内容建议`
    }
  }
  
  private async trackLearningProgressTool(params: any): Promise<any> {
    const paths = getLearningPaths()
    const units = getCourseUnits()
    
    let targetPaths = paths
    if (params.pathId) {
      targetPaths = paths.filter(p => p.id === params.pathId)
    }

    const progressReport = {
      totalPaths: targetPaths.length,
      activePaths: targetPaths.filter(p => p.status === 'active').length,
      completedPaths: targetPaths.filter(p => p.status === 'completed').length,
      overallProgress: 0,
      detailedProgress: [] as any[],
      insights: [] as string[]
    }

    targetPaths.forEach(path => {
      const pathUnits = units.filter(u => 
        path.nodes.some(node => node.id === u.nodeId)
      )
      
      const completedNodes = path.nodes.filter(n => n.status === 'completed')
      const pathProgress = path.nodes.length > 0 ? 
        (completedNodes.length / path.nodes.length) * 100 : 0

      progressReport.detailedProgress.push({
        pathId: path.id,
        title: path.title,
        progress: pathProgress,
        completedNodes: completedNodes.length,
        totalNodes: path.nodes.length,
        estimatedTimeRemaining: path.totalEstimatedHours * (1 - pathProgress / 100)
      })
    })

    // 计算总体进度
    progressReport.overallProgress = progressReport.detailedProgress.length > 0 ?
      progressReport.detailedProgress.reduce((sum, p) => sum + p.progress, 0) / 
      progressReport.detailedProgress.length : 0

    // 生成学习洞察
    if (progressReport.overallProgress > 80) {
      progressReport.insights.push('恭喜！您的学习进度非常好')
    } else if (progressReport.overallProgress > 50) {
      progressReport.insights.push('保持当前的学习节奏')
    } else {
      progressReport.insights.push('建议加快学习进度或调整学习计划')
    }

    return progressReport
  }
  
  private async recommendStudyScheduleTool(params: any): Promise<any> {
    const { availableHoursPerWeek, preferredStudyTimes, goalId } = params
    
    const goal = getLearningGoals().find(g => g.id === goalId)
    if (!goal) {
      throw new Error('Goal not found')
    }

    const estimatedTotalHours = goal.estimatedTimeWeeks * 10 // 假设每周10小时
    const weeksToComplete = Math.ceil(estimatedTotalHours / availableHoursPerWeek)

    const schedule = {
      totalEstimatedHours: estimatedTotalHours,
      weeklyHours: availableHoursPerWeek,
      estimatedCompletionWeeks: weeksToComplete,
      dailyRecommendation: Math.ceil(availableHoursPerWeek / 7),
      schedule: [] as any[],
      tips: [] as string[]
    }

    // 生成每日学习建议
    const daysPerWeek = Math.min(7, Math.ceil(availableHoursPerWeek / 2)) // 最少2小时/天
    const hoursPerSession = availableHoursPerWeek / daysPerWeek

    for (let i = 0; i < daysPerWeek; i++) {
      schedule.schedule.push({
        day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        duration: Math.round(hoursPerSession * 10) / 10,
        type: i % 3 === 0 ? '理论学习' : i % 3 === 1 ? '实践练习' : '项目应用'
      })
    }

    // 生成学习建议
    schedule.tips = [
      '保持规律的学习时间，建立学习习惯',
      '结合理论学习和实践练习',
      '定期复习已学内容',
      '设定每周小目标，保持学习动力'
    ]

    if (availableHoursPerWeek < 5) {
      schedule.tips.push('考虑增加学习时间以获得更好的学习效果')
    } else if (availableHoursPerWeek > 20) {
      schedule.tips.push('注意避免过度学习，保持学习与休息的平衡')
    }

    return schedule
  }
  
  // ========== 辅助方法 ==========
  
  private identifyStrengths(ability: any): string[] {
    const strengths: string[] = []
    
    Object.entries(ability.dimensions).forEach(([dimension, data]: [string, any]) => {
      if (data.score > 7) {
        strengths.push(dimension)
      }
      
      Object.entries(data.skills).forEach(([skill, score]: [string, any]) => {
        if (score > 8) {
          strengths.push(skill)
        }
      })
    })
    
    return strengths.slice(0, 5) // 返回前5个优势
  }
  
  private identifyWeaknesses(ability: any): string[] {
    const weaknesses: string[] = []
    
    Object.entries(ability.dimensions).forEach(([dimension, data]: [string, any]) => {
      if (data.score < 4) {
        weaknesses.push(dimension)
      }
      
      Object.entries(data.skills).forEach(([skill, score]: [string, any]) => {
        if (score < 3) {
          weaknesses.push(skill)
        }
      })
    })
    
    return weaknesses.slice(0, 5) // 返回前5个弱项
  }
  
  private getSkillLevel(ability: any, skill: string): number {
    // 在所有维度中查找技能
    for (const dimension of Object.values(ability.dimensions) as any[]) {
      if (dimension.skills[skill]) {
        return dimension.skills[skill]
      }
    }
    return 0 // 未找到技能，返回0
  }
  
  private getTargetLevelScore(level: string): number {
    const levelMap = {
      'beginner': 4,
      'intermediate': 6,
      'advanced': 8,
      'expert': 10
    }
    return levelMap[level as keyof typeof levelMap] || 6
  }
  
  private generateAbilityRecommendation(ability: any): string {
    const overallScore = ability.overallScore
    
    if (overallScore < 3) {
      return '建议从基础知识开始，选择入门级的学习目标'
    } else if (overallScore < 6) {
      return '您有一定基础，可以选择中级学习目标并注重实践'
    } else if (overallScore < 8) {
      return '您的技能水平不错，可以挑战高级内容和复杂项目'
    } else {
      return '您是高级学习者，建议探索专业领域和前沿技术'
    }
  }
  
  private getContextBasedRecommendation(activeGoals: any[], activePaths: any[], units: any[]): string {
    if (activeGoals.length === 0) {
      return '设定第一个学习目标'
    }
    
    if (activePaths.length === 0) {
      return '为目标生成学习路径'
    }
    
    const inProgressNodes = activePaths.flatMap(path => 
      path.nodes.filter((node: any) => node.status === 'in_progress')
    )
    
    if (inProgressNodes.length > 0) {
      return `继续学习 ${inProgressNodes[0].title}`
    }
    
    return '开始下一个学习节点'
  }
  
  private getBaseNodesForCategory(category: string): Partial<PathNode>[] {
    const templates: Record<string, Partial<PathNode>[]> = {
      frontend: [
        { title: 'HTML基础', type: 'concept', estimatedHours: 8, difficulty: 1 },
        { title: 'CSS样式', type: 'concept', estimatedHours: 12, difficulty: 2 },
        { title: 'JavaScript基础', type: 'concept', estimatedHours: 20, difficulty: 2 },
        { title: 'DOM操作', type: 'practice', estimatedHours: 10, difficulty: 3 },
        { title: '响应式设计', type: 'practice', estimatedHours: 8, difficulty: 3 },
        { title: '前端框架', type: 'concept', estimatedHours: 30, difficulty: 4 },
        { title: '项目实战', type: 'project', estimatedHours: 40, difficulty: 4 }
      ],
      backend: [
        { title: '编程语言基础', type: 'concept', estimatedHours: 25, difficulty: 2 },
        { title: '数据库设计', type: 'concept', estimatedHours: 15, difficulty: 3 },
        { title: 'API设计', type: 'concept', estimatedHours: 12, difficulty: 3 },
        { title: '服务器配置', type: 'practice', estimatedHours: 10, difficulty: 4 },
        { title: '后端框架', type: 'concept', estimatedHours: 30, difficulty: 4 },
        { title: '项目开发', type: 'project', estimatedHours: 50, difficulty: 4 }
      ],
      automation: [
        { title: 'Python基础', type: 'concept', estimatedHours: 20, difficulty: 1 },
        { title: '文件操作', type: 'practice', estimatedHours: 8, difficulty: 2 },
        { title: 'Excel自动化', type: 'practice', estimatedHours: 12, difficulty: 2 },
        { title: '网络爬虫', type: 'practice', estimatedHours: 15, difficulty: 3 },
        { title: '任务调度', type: 'practice', estimatedHours: 10, difficulty: 3 },
        { title: '自动化项目', type: 'project', estimatedHours: 25, difficulty: 3 }
      ]
    }
    
    return templates[category] || templates.frontend
  }
  
  private adjustNodesForUserLevel(nodes: Partial<PathNode>[], userLevel: string, ability: any): PathNode[] {
    const levelMultiplier = {
      'beginner': 1.2,
      'intermediate': 1.0,
      'advanced': 0.8,
      'expert': 0.6
    }
    
    const multiplier = levelMultiplier[userLevel as keyof typeof levelMultiplier] || 1.0
    
    return nodes.map((node, index) => ({
      id: `node_${Date.now()}_${index}`,
      title: node.title || `学习节点 ${index + 1}`,
      description: node.description || `${node.title}的详细学习内容`,
      type: node.type || 'concept',
      estimatedHours: Math.ceil((node.estimatedHours || 10) * multiplier),
      difficulty: node.difficulty || 3,
      prerequisites: index > 0 ? [`node_${Date.now()}_${index - 1}`] : [],
      skills: [],
      resources: [],
      status: 'not_started' as const,
      progress: 0
    }))
  }
  
  private applyUserPreferences(nodes: PathNode[], preferences: any): PathNode[] {
    if (!preferences) return nodes
    
    // 根据用户偏好调整节点
    if (preferences.learningStyle === 'project-based') {
      // 增加项目类型节点
      nodes.forEach((node: PathNode) => {
        if (node.type === 'concept') {
          node.type = 'practice'
        }
      })
    }
    
    if (preferences.pace === 'fast') {
      // 减少估算时间
      nodes.forEach((node: PathNode) => {
        node.estimatedHours = Math.ceil(node.estimatedHours * 0.8)
      })
    }
    
    return nodes
  }

  // ========== 新增查询和删除工具 ==========
  
  private async getLearningGoalsTool(params: any): Promise<{
    goals: LearningGoal[]
    total: number
    filtered: number
  }> {
    const allGoals = getLearningGoals()
    const status = params.status || 'all'
    
    const filteredGoals = status === 'all' 
      ? allGoals 
      : allGoals.filter(goal => goal.status === status)
    
    return {
      goals: filteredGoals,
      total: allGoals.length,
      filtered: filteredGoals.length
    }
  }
  
  private async getLearningGoalTool(params: any): Promise<any> {
    const goals = getLearningGoals()
    const goal = goals.find(g => g.id === params.goalId)
    
    if (!goal) {
      return null
    }
    
    // 增加关联信息
    const paths = getLearningPaths().filter(p => p.goalId === goal.id)
    
    return {
      ...goal,
      associatedPaths: paths.length,
      pathsInfo: paths.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        nodeCount: p.nodes.length
      }))
    }
  }
  
  private async deleteLearningGoalTool(params: any): Promise<{
    success: boolean
    message: string
  }> {
    const success = deleteLearningGoal(params.goalId)
    
    if (success) {
      // 同时删除关联的学习路径
      const paths = getLearningPaths().filter(p => p.goalId === params.goalId)
      paths.forEach(path => deleteLearningPath(path.id))
      
      return {
        success: true,
        message: `成功删除目标及其关联的 ${paths.length} 条学习路径`
      }
    }
    
    return {
      success: false,
      message: '目标不存在或删除失败'
    }
  }
  
  private async getLearningPathsTool(params: any): Promise<{
    paths: LearningPath[]
    total: number
    filtered: number
  }> {
    const allPaths = getLearningPaths()
    let filteredPaths = allPaths
    
    // 按目标筛选
    if (params.goalId) {
      filteredPaths = filteredPaths.filter(path => path.goalId === params.goalId)
    }
    
    // 按状态筛选
    if (params.status && params.status !== 'all') {
      filteredPaths = filteredPaths.filter(path => path.status === params.status)
    }
    
    // 增加关联信息
    const pathsWithInfo = filteredPaths.map(path => {
      const goal = getLearningGoals().find(g => g.id === path.goalId)
      const units = getCourseUnits().filter(u => 
        path.nodes.some(node => node.id === u.nodeId)
      )
      
      return {
        ...path,
        goalTitle: goal?.title || '未知目标',
        courseUnitsCount: units.length,
        completedNodes: path.nodes.filter(n => n.status === 'completed').length,
        totalNodes: path.nodes.length
      }
    })
    
    return {
      paths: pathsWithInfo,
      total: allPaths.length,
      filtered: filteredPaths.length
    }
  }
  
  private async getLearningPathTool(params: any): Promise<any> {
    const paths = getLearningPaths()
    const path = paths.find(p => p.id === params.pathId)
    
    if (!path) {
      return null
    }
    
    // 获取关联信息
    const goal = getLearningGoals().find(g => g.id === path.goalId)
    const units = getCourseUnits().filter(u => 
      path.nodes.some(node => node.id === u.nodeId)
    )
    
    // 计算进度
    const completedNodes = path.nodes.filter(n => n.status === 'completed').length
    const inProgressNodes = path.nodes.filter(n => n.status === 'in_progress').length
    const progress = path.nodes.length > 0 ? (completedNodes / path.nodes.length) * 100 : 0
    
    return {
      ...path,
      goalInfo: goal ? {
        title: goal.title,
        category: goal.category,
        targetLevel: goal.targetLevel
      } : null,
      progressInfo: {
        completedNodes,
        inProgressNodes,
        totalNodes: path.nodes.length,
        progressPercentage: Math.round(progress)
      },
      courseUnits: units.map(u => ({
        id: u.id,
        title: u.title,
        type: u.type,
        nodeId: u.nodeId
      }))
    }
  }
  
  private async deleteLearningPathTool(params: any): Promise<{
    success: boolean
    message: string
  }> {
    const success = deleteLearningPath(params.pathId)
    
    if (success) {
      // 同时删除关联的课程单元
      const units = getCourseUnits()
      const path = getLearningPaths().find(p => p.id === params.pathId)
      
      if (path) {
        const nodeIds = path.nodes.map(n => n.id)
        const relatedUnits = units.filter(u => nodeIds.includes(u.nodeId))
        relatedUnits.forEach(unit => deleteCourseUnit(unit.id))
        
        return {
          success: true,
          message: `成功删除路径及其关联的 ${relatedUnits.length} 个课程单元`
        }
      }
      
      return {
        success: true,
        message: '成功删除学习路径'
      }
    }
    
    return {
      success: false,
      message: '路径不存在或删除失败'
    }
  }
  
  private async getCourseUnitsTool(params: any): Promise<{
    units: CourseUnit[]
    total: number
    filtered: number
  }> {
    const allUnits = getCourseUnits()
    let filteredUnits = allUnits
    
    // 按节点筛选
    if (params.nodeId) {
      filteredUnits = filteredUnits.filter(unit => unit.nodeId === params.nodeId)
    }
    
    // 按类型筛选
    if (params.type && params.type !== 'all') {
      filteredUnits = filteredUnits.filter(unit => unit.type === params.type)
    }
    
    // 增加关联信息
    const unitsWithInfo = filteredUnits.map(unit => {
      const paths = getLearningPaths()
      const relatedPath = paths.find(p => 
        p.nodes.some(node => node.id === unit.nodeId)
      )
      
      return {
        ...unit,
        pathInfo: relatedPath ? {
          id: relatedPath.id,
          title: relatedPath.title,
          goalId: relatedPath.goalId
        } : null
      }
    })
    
    return {
      units: unitsWithInfo,
      total: allUnits.length,
      filtered: filteredUnits.length
    }
  }
  
  private async getCourseUnitTool(params: any): Promise<any> {
    const { unitId } = params
    const unit = getCourseUnits().find(u => u.id === unitId)
    
    if (!unit) {
      return {
        success: false,
        message: `课程单元 ${unitId} 不存在`,
        unit: null
      }
    }

    // 获取相关路径信息
    const relatedPath = getLearningPaths().find(p => 
      p.nodes.some(n => n.id === unit.nodeId)
    )
    
    let nodeInfo: any = null
    if (relatedPath) {
      const node = relatedPath.nodes.find(n => n.id === unit.nodeId)
      nodeInfo = node ? {
        title: node.title,
        status: node.status,
        estimatedHours: node.estimatedHours
      } : undefined
    }
    
    return {
      ...unit,
      pathInfo: relatedPath ? {
        id: relatedPath.id,
        title: relatedPath.title,
        goalId: relatedPath.goalId
      } : null,
      nodeInfo
    }
  }
  
  private async deleteCourseUnitTool(params: any): Promise<{
    success: boolean
    message: string
  }> {
    const success = deleteCourseUnit(params.unitId)
    
    return {
      success,
      message: success ? '成功删除课程单元' : '课程单元不存在或删除失败'
    }
  }
  
  private async getLearningSummaryTool(params: any): Promise<any> {
    const goals = getLearningGoals()
    const paths = getLearningPaths()
    const units = getCourseUnits()
    const ability = getAbilityProfile()
    const timeRange = params.timeRange || 'all'
    
    // 统计各种状态的数量
    const goalStats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length
    }
    
    const pathStats = {
      total: paths.length,
      active: paths.filter(p => p.status === 'active').length,
      completed: paths.filter(p => p.status === 'completed').length,
      draft: paths.filter(p => p.status === 'draft').length
    }
    
    // 计算总体进度
    const activePaths = paths.filter(p => p.status === 'active')
    const totalNodes = activePaths.reduce((sum, path) => sum + path.nodes.length, 0)
    const completedNodes = activePaths.reduce((sum, path) => 
      sum + path.nodes.filter(n => n.status === 'completed').length, 0
    )
    const overallProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
    
    // 获取最活跃的学习领域
    const categoryStats = goals.reduce((acc: Record<string, number>, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1
      return acc
    }, {})
    
    const topCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '无'
    
    return {
      summary: {
        hasAbilityProfile: !!ability,
        overallProgress: Math.round(overallProgress),
        activeGoals: goalStats.active,
        activePaths: pathStats.active,
        completedNodes,
        totalNodes,
        topLearningArea: topCategory
      },
      goalStats,
      pathStats,
      unitStats: {
        total: units.length,
        byType: units.reduce((acc: Record<string, number>, unit) => {
          acc[unit.type] = (acc[unit.type] || 0) + 1
          return acc
        }, {})
      },
      recommendations: this.generateSummaryRecommendations(goalStats, pathStats, overallProgress, ability),
      timeRange,
      generatedAt: new Date().toISOString()
    }
  }
  
  private generateSummaryRecommendations(
    goalStats: any, 
    pathStats: any, 
    progress: number, 
    ability: any
  ): string[] {
    const recommendations: string[] = []
    
    if (!ability) {
      recommendations.push('完成能力评估以获得个性化学习建议')
    }
    
    if (goalStats.active === 0) {
      recommendations.push('设定新的学习目标开始学习之旅')
    } else if (goalStats.active > 3) {
      recommendations.push('考虑专注于1-2个主要目标，避免分散注意力')
    }
    
    if (pathStats.active === 0 && goalStats.active > 0) {
      recommendations.push('为现有目标生成学习路径')
    }
    
    if (progress < 20 && pathStats.active > 0) {
      recommendations.push('建议先完成当前路径的基础内容')
    } else if (progress > 80) {
      recommendations.push('恭喜！考虑设定更高级的学习目标')
    }
    
    if (pathStats.draft > 0) {
      recommendations.push('激活草稿状态的学习路径开始学习')
    }
    
    return recommendations.slice(0, 3) // 返回前3条建议
  }

  // ========== 能力档案管理工具实现 ==========

  private async updateAbilityAssessmentTool(params: any): Promise<any> {
    const { dimension, skill, newScore, evidence, confidenceBoost } = params
    
    // 获取当前评估数据
    const assessment = getAbilityProfile()
    if (!assessment) {
      return {
        success: false,
        message: '未找到能力评估数据，请先完成能力评估'
      }
    }
    
    // 获取完整的评估数据
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        success: false,
        message: '未找到完整的评估数据'
      }
    }
    
    // 验证维度和技能是否存在
    if (!currentAssessment.dimensions[dimension]) {
      return {
        success: false,
        message: `未找到维度: ${dimension}`
      }
    }
    
    if (!currentAssessment.dimensions[dimension].skills[skill]) {
      return {
        success: false,
        message: `在维度 ${dimension} 中未找到技能: ${skill}`
      }
    }
    
    const currentSkill = currentAssessment.dimensions[dimension].skills[skill]
    const currentScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
    const currentConfidence = typeof currentSkill === 'number' ? 1.0 : currentSkill.confidence
    
    // 更新技能数据
    const updatedSkill = {
      score: newScore !== undefined ? newScore : currentScore,
      confidence: confidenceBoost ? Math.min(1.0, currentConfidence + 0.2) : currentConfidence,
      isInferred: false, // 用户提供的数据不再是推理得出
      lastUpdated: new Date().toISOString(),
      evidence: evidence
    }
    
    // 更新评估数据
    currentAssessment.dimensions[dimension].skills[skill] = updatedSkill
    
    // 重新计算维度分数
    const dimensionSkills = Object.values(currentAssessment.dimensions[dimension].skills)
    const averageScore = (dimensionSkills as any[]).reduce((sum, skillData) => {
      const score = typeof skillData === 'number' ? skillData : (skillData as any).score
      return sum + score
    }, 0) / dimensionSkills.length
    currentAssessment.dimensions[dimension].score = Math.round(averageScore)
    
    // 重新计算总分
    const weightedSum = Object.values(currentAssessment.dimensions).reduce((sum, dim) => {
      return sum + (dim.score * dim.weight)
    }, 0)
    currentAssessment.overallScore = Math.round(weightedSum)
    
    // 保存更新后的数据
    setProfileData('abilityAssessment', currentAssessment)
    
    // 记录活动
    addCoreEvent({
      type: 'ability_assessment_updated',
      data: {
        dimension,
        skill,
        oldScore: currentScore,
        newScore: updatedSkill.score,
        evidence
      }
    })
    
    return {
      success: true,
      message: '技能评估更新成功',
      updatedSkill: {
        dimension,
        skill,
        oldScore: currentScore,
        newScore: updatedSkill.score,
        confidence: updatedSkill.confidence
      },
      dimensionScore: currentAssessment.dimensions[dimension].score,
      overallScore: currentAssessment.overallScore
    }
  }

  private async addSkillEvidenceTool(params: any): Promise<any> {
    const { dimension, skill, evidenceType, description, impact } = params
    
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        success: false,
        message: '未找到能力评估数据，请先完成能力评估'
      }
    }
    
    // 验证维度和技能
    if (!currentAssessment.dimensions[dimension] || !currentAssessment.dimensions[dimension].skills[skill]) {
      return {
        success: false,
        message: `未找到指定的技能: ${dimension}.${skill}`
      }
    }
    
    const currentSkill = currentAssessment.dimensions[dimension].skills[skill]
    const currentScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
    const currentConfidence = typeof currentSkill === 'number' ? 0.5 : currentSkill.confidence
    
    // 根据证据影响程度调整分数和置信度
    let scoreAdjustment = 0
    let confidenceBoost = 0
    
    switch (impact) {
      case 'high':
        scoreAdjustment = 10
        confidenceBoost = 0.3
        break
      case 'medium':
        scoreAdjustment = 5
        confidenceBoost = 0.2
        break
      case 'low':
        scoreAdjustment = 2
        confidenceBoost = 0.1
        break
    }
    
    // 根据证据类型微调
    if (evidenceType === 'certification' || evidenceType === 'achievement') {
      confidenceBoost += 0.1
    }
    
    const newScore = Math.min(100, Math.max(0, currentScore + scoreAdjustment))
    const newConfidence = Math.min(1.0, currentConfidence + confidenceBoost)
    
    // 创建或更新技能数据
    const updatedSkill = {
      score: newScore,
      confidence: newConfidence,
      isInferred: false,
      lastUpdated: new Date().toISOString(),
      evidences: [
        ...(typeof currentSkill === 'object' && currentSkill.evidences ? currentSkill.evidences : []),
        {
          type: evidenceType,
          description,
          impact,
          addedAt: new Date().toISOString()
        }
      ]
    }
    
    // 更新评估数据
    currentAssessment.dimensions[dimension].skills[skill] = updatedSkill
    
    // 重新计算维度和总分
    this.recalculateAssessmentScores(currentAssessment)
    
    // 保存数据
    setProfileData('abilityAssessment', currentAssessment)
    
    // 记录活动
    addCoreEvent({
      type: 'skill_evidence_added',
      data: {
        dimension,
        skill,
        evidenceType,
        impact,
        scoreChange: newScore - currentScore
      }
    })
    
    return {
      success: true,
      message: `已为 ${dimension}.${skill} 添加${impact === 'high' ? '高' : impact === 'medium' ? '中' : '低'}影响力证据`,
      updatedSkill: {
        skill,
        dimension,
        oldScore: currentScore,
        newScore,
        confidenceImprovement: confidenceBoost,
        evidenceAdded: {
          type: evidenceType,
          description
        }
      },
      dimensionScore: currentAssessment.dimensions[dimension].score,
      overallScore: currentAssessment.overallScore
    }
  }

  private async correctAbilityProfileTool(params: any): Promise<any> {
    const { corrections, overallFeedback } = params
    
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        success: false,
        message: '未找到能力评估数据，请先完成能力评估'
      }
    }
    
    const correctionResults: any[] = []
    let totalCorrections = 0
    
    // 处理每个修正
    for (const correction of corrections) {
      const { dimension, skill, actualScore, reason, evidence } = correction
      
      if (!currentAssessment.dimensions[dimension] || !currentAssessment.dimensions[dimension].skills[skill]) {
        correctionResults.push({
          skill: `${dimension}.${skill}`,
          status: 'failed',
          message: '技能不存在'
        })
        continue
      }
      
      const currentSkill = currentAssessment.dimensions[dimension].skills[skill]
      const oldScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
      
      // 更新技能数据
      currentAssessment.dimensions[dimension].skills[skill] = {
        score: actualScore,
        confidence: 1.0, // 用户修正的数据具有最高置信度
        isInferred: false,
        lastUpdated: new Date().toISOString(),
        userCorrected: true,
        correctionReason: reason,
        evidence: evidence
      }
      
      correctionResults.push({
        skill: `${dimension}.${skill}`,
        status: 'success',
        oldScore,
        newScore: actualScore,
        change: actualScore - oldScore,
        reason
      })
      
      totalCorrections++
    }
    
    // 重新计算所有分数
    this.recalculateAssessmentScores(currentAssessment)
    
    // 更新元数据
    if (currentAssessment.metadata) {
      (currentAssessment.metadata as any).lastCorrected = new Date().toISOString();
    }
    (currentAssessment.metadata as any).userFeedback = overallFeedback
    
    // 保存数据
    setProfileData('abilityAssessment', currentAssessment)
    
    // 记录活动
    addCoreEvent({
      type: 'ability_profile_corrected',
      data: {
        correctionsCount: totalCorrections,
        overallFeedback,
        corrections: correctionResults
      }
    })
    
    return {
      success: true,
      message: `已完成 ${totalCorrections} 项能力修正`,
      corrections: correctionResults,
      newOverallScore: currentAssessment.overallScore,
      feedback: overallFeedback,
      recommendation: '感谢您的反馈！这些修正将帮助AI更好地理解您的能力现状。'
    }
  }

  private async enhanceSkillConfidenceTool(params: any): Promise<any> {
    const { targetSkills, additionalInfo, selfRating } = params
    
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        success: false,
        message: '未找到能力评估数据，请先完成能力评估'
      }
    }
    
    const enhancementResults: any[] = []
    
    // 处理每个目标技能
    for (const skillPath of targetSkills) {
      const [dimension, skill] = skillPath.includes('.') ? skillPath.split('.') : [null, skillPath]
      
      // 如果没有指定维度，搜索技能
      let foundDimension = dimension
      if (!foundDimension) {
        for (const dimKey of Object.keys(currentAssessment.dimensions)) {
          if (currentAssessment.dimensions[dimKey].skills[skill]) {
            foundDimension = dimKey
            break
          }
        }
      }
      
      if (!foundDimension || !currentAssessment.dimensions[foundDimension].skills[skill]) {
        enhancementResults.push({
          skill: skillPath,
          status: 'failed',
          message: '技能不存在'
        })
        continue
      }
      
      const currentSkill = currentAssessment.dimensions[foundDimension].skills[skill]
      const currentScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
      const currentConfidence = typeof currentSkill === 'number' ? 0.5 : currentSkill.confidence
      
      // 基于额外信息增强置信度
      const newConfidence = Math.min(1.0, currentConfidence + 0.25)
      
      // 如果有自评，适度调整分数
      let newScore = currentScore
      if (selfRating && selfRating[skill]) {
        const selfScore = selfRating[skill]
        // 取自评和当前评分的加权平均，更偏向于当前评分
        newScore = Math.round(currentScore * 0.7 + selfScore * 0.3)
      }
      
      // 更新技能数据
      currentAssessment.dimensions[foundDimension].skills[skill] = {
        score: newScore,
        confidence: newConfidence,
        isInferred: false,
        lastUpdated: new Date().toISOString(),
        additionalInfo,
        selfRating: selfRating?.[skill]
      }
      
      enhancementResults.push({
        skill: `${foundDimension}.${skill}`,
        status: 'success',
        oldConfidence: currentConfidence,
        newConfidence,
        oldScore: currentScore,
        newScore,
        confidenceImprovement: newConfidence - currentConfidence
      })
    }
    
    // 重新计算分数
    this.recalculateAssessmentScores(currentAssessment)
    
    // 保存数据
    setProfileData('abilityAssessment', currentAssessment)
    
    // 记录活动
    addCoreEvent({
      type: 'skill_confidence_enhanced',
      data: {
        skillsCount: targetSkills.length,
        additionalInfo,
        results: enhancementResults
      }
    })
    
    return {
      success: true,
      message: `已增强 ${enhancementResults.filter(r => r.status === 'success').length} 个技能的置信度`,
      enhancements: enhancementResults,
      overallScore: currentAssessment.overallScore,
      recommendations: [
        '置信度的提升有助于生成更准确的学习路径',
        '继续提供具体的项目经历可以进一步优化评估',
        '建议定期更新技能信息以保持评估准确性'
      ]
    }
  }

  private async reassessAbilityDimensionTool(params: any): Promise<any> {
    const { dimension, newInformation, focusSkills } = params
    
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        success: false,
        message: '未找到能力评估数据，请先完成能力评估'
      }
    }
    
    if (!currentAssessment.dimensions[dimension]) {
      return {
        success: false,
        message: `未找到维度: ${dimension}`
      }
    }
    
    // 获取维度信息
    const dimensionData = currentAssessment.dimensions[dimension]
    const dimensionSkills = Object.keys(dimensionData.skills)
    const targetSkills = focusSkills || dimensionSkills
    
    // 使用AI重新评估维度
    try {
      const prompt = `
基于以下新信息，重新评估用户在 ${dimension} 维度的能力：

新提供的信息：
${newInformation}

当前评估状况：
- 维度总分：${dimensionData.score}分
- 技能详情：${targetSkills.map(skill => {
  const skillData = dimensionData.skills[skill]
  const score = typeof skillData === 'number' ? skillData : skillData.score
  return `${skill}: ${score}分`
}).join(', ')}

请根据新信息重新评估以下技能的分数(0-100)，并说明调整原因：
${targetSkills.map(skill => `- ${skill}`).join('\n')}

请以JSON格式返回：
{
  "reassessment": {
    ${targetSkills.map(skill => `"${skill}": {"score": 分数, "reason": "调整原因", "confidence": 置信度}`).join(',\n    ')}
  },
  "dimensionSummary": "维度整体评价",
  "confidenceLevel": 整体置信度(0-1)
}
`
      
      const aiResponse = await callAI(prompt)
      
      // 解析AI响应
      let reassessmentData
      try {
        // 提取JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          reassessmentData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (e) {
        // 如果解析失败，使用基于关键词的简单提升逻辑
        reassessmentData = this.generateBasicReassessment(dimension, targetSkills, newInformation)
      }
      
      const updates: any[] = []
      
      // 更新技能分数
      if (reassessmentData.reassessment) {
        for (const skill of targetSkills) {
          if (reassessmentData.reassessment[skill]) {
            const currentSkill = dimensionData.skills[skill]
            const oldScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
            const newScore = reassessmentData.reassessment[skill].score
            const reason = reassessmentData.reassessment[skill].reason
            const confidence = reassessmentData.reassessment[skill].confidence || 0.8
            
            dimensionData.skills[skill] = {
              score: newScore,
              confidence,
              isInferred: false,
              lastUpdated: new Date().toISOString(),
              reassessmentReason: reason,
              additionalInfo: newInformation
            }
            
            updates.push({
              skill,
              oldScore,
              newScore,
              change: newScore - oldScore,
              reason
            })
          }
        }
      }
      
      // 重新计算分数
      this.recalculateAssessmentScores(currentAssessment)
      
      // 保存数据
      setProfileData('abilityAssessment', currentAssessment)
      
      // 记录活动
      addCoreEvent({
        type: 'dimension_reassessed',
        data: {
          dimension,
          updatesCount: updates.length,
          newInformation
        }
      })
      
      return {
        success: true,
        message: `已重新评估 ${dimension} 维度的 ${updates.length} 个技能`,
        dimension,
        updates,
        newDimensionScore: dimensionData.score,
        newOverallScore: currentAssessment.overallScore,
        summary: reassessmentData.dimensionSummary || '评估已更新',
        confidence: reassessmentData.confidenceLevel || 0.8
      }
      
    } catch (error) {
      log('[AgentTools] Error in reassessAbilityDimensionTool:', error)
      
      // 回退逻辑：基于关键词进行简单调整
      const updates = this.applyBasicReassessment(dimensionData, targetSkills, newInformation)
      
      this.recalculateAssessmentScores(currentAssessment)
      setProfileData('abilityAssessment', currentAssessment)
      
      return {
        success: true,
        message: `已根据新信息调整 ${dimension} 维度评估（基础模式）`,
        dimension,
        updates,
        newDimensionScore: dimensionData.score,
        newOverallScore: currentAssessment.overallScore,
        note: '由于AI服务暂时不可用，使用了基础调整算法'
      }
    }
  }

  private async getAbilityImprovementSuggestionsTool(params: any): Promise<any> {
    const { targetDimension = 'all', timeFrame = '3_months' } = params
    
    const currentAssessment = getCurrentAssessment()
    if (!currentAssessment) {
      return {
        suggestions: [
          '请先完成能力评估，以获得个性化的提升建议',
          '在能力评估模块中上传简历或完成技能问卷',
          '评估完成后，AI将为您制定专属的能力提升计划'
        ],
        hasAssessment: false
      }
    }
    
    const dimensions = targetDimension === 'all' 
      ? Object.keys(currentAssessment.dimensions)
      : [targetDimension]
    
    const suggestions: string[] = []
    const weakSkills: any[] = []
    const strengthSkills: any[] = []
    
    // 分析各维度的技能
    for (const dim of dimensions) {
      if (!currentAssessment.dimensions[dim]) continue
      
      const dimensionData = currentAssessment.dimensions[dim]
      
      Object.entries(dimensionData.skills).forEach(([skill, skillData]) => {
        const score = typeof skillData === 'number' ? skillData : (skillData as any).score
        const confidence = typeof skillData === 'number' ? 1.0 : (skillData as any).confidence
        
        if (score < 60) {
          weakSkills.push({ dimension: dim, skill, score, confidence })
        } else if (score >= 80) {
          strengthSkills.push({ dimension: dim, skill, score, confidence })
        }
      })
    }
    
    // 生成时间框架特定的建议
    const timeFrameWeeks = {
      '1_month': 4,
      '3_months': 12,
      '6_months': 24,
      '1_year': 52
    }[timeFrame] || 12
    
    // 基于薄弱技能生成建议
    if (weakSkills.length > 0) {
      const prioritySkills = weakSkills
        .sort((a, b) => a.score - b.score)
        .slice(0, Math.min(3, Math.ceil(timeFrameWeeks / 4)))
      
      suggestions.push(`在${timeFrame.replace('_', '')}内，重点提升以下技能：`)
      
      prioritySkills.forEach(({ dimension, skill, score }) => {
        const improvementPlan = this.generateSkillImprovementPlan(dimension, skill, score, timeFrameWeeks)
        suggestions.push(`📈 ${dimension}.${skill} (当前${score}分)`)
        suggestions.push(`   ${improvementPlan}`)
      })
    }
    
    // 基于优势技能生成建议
    if (strengthSkills.length > 0) {
      suggestions.push('利用您的优势技能：')
      strengthSkills.slice(0, 2).forEach(({ dimension, skill, score }) => {
        suggestions.push(`⭐ ${dimension}.${skill} (${score}分) - 可以在项目中发挥主导作用`)
      })
    }
    
    // 生成通用建议
    suggestions.push('通用提升建议：')
    suggestions.push('🎯 制定具体的学习目标和里程碑')
    suggestions.push('📚 结合理论学习和实践项目')
    suggestions.push('🤝 参与开源项目或技术社区')
    suggestions.push('📝 定期记录和分享学习心得')
    
    if (timeFrameWeeks >= 12) {
      suggestions.push('🔄 每月回顾和调整学习计划')
    }
    
    return {
      targetDimension,
      timeFrame,
      currentOverallScore: currentAssessment.overallScore,
      suggestions,
      prioritySkills: weakSkills.slice(0, 3).map(s => `${s.dimension}.${s.skill}`),
      strengthSkills: strengthSkills.slice(0, 2).map(s => `${s.dimension}.${s.skill}`),
      hasAssessment: true,
      nextSteps: [
        '根据建议制定详细的学习计划',
        '设定具体的学习目标',
        '开始第一个实践项目',
        `${timeFrameWeeks >= 8 ? '定期' : '每周'}回顾进度并调整计划`
      ]
    }
  }

  // 辅助方法：重新计算评估分数
  private recalculateAssessmentScores(assessment: any): void {
    // 重新计算维度分数
    Object.values(assessment.dimensions).forEach((dimension: any) => {
      const skills = Object.values(dimension.skills)
      const totalScore = skills.reduce((sum: number, skill: any) => {
        return sum + (typeof skill === 'number' ? skill : skill.score)
      }, 0)
      dimension.score = Math.round(totalScore / skills.length)
    })
    
    // 重新计算总分
    const dimensionScores = Object.values(assessment.dimensions).map((dim: any) => dim.score)
    assessment.overallScore = Math.round(
      dimensionScores.reduce((sum: number, score: number) => sum + score, 0) / dimensionScores.length
    )
  }

  // 辅助方法：生成基础重评估结果
  private generateBasicReassessment(dimension: string, skills: string[], newInfo: string): any {
    const reassessment: any = {}
    
    // 简单的关键词匹配逻辑
    const positiveKeywords = ['优秀', '精通', '熟练', '经验丰富', '专业', '成功', '完成', '实现']
    const improvementKeywords = ['提升', '加强', '学习', '改进', '练习', '增强']
    
    const hasPositive = positiveKeywords.some(keyword => newInfo.includes(keyword))
    const hasImprovement = improvementKeywords.some(keyword => newInfo.includes(keyword))
    
    skills.forEach(skill => {
      let scoreAdjustment = 0
      let reason = '基于新信息调整'
      
      if (hasPositive) {
        scoreAdjustment = 5
        reason = '发现了相关的优秀表现或丰富经验'
      } else if (hasImprovement) {
        scoreAdjustment = 3
        reason = '识别到学习意愿和改进空间'
      }
      
      reassessment[skill] = {
        score: scoreAdjustment,
        reason,
        confidence: 0.6
      }
    })
    
    return { reassessment, confidenceLevel: 0.6 }
  }

  // 辅助方法：应用基础重评估
  private applyBasicReassessment(dimensionData: any, skills: string[], newInfo: string): any[] {
    const updates: any[] = []
    const reassessment = this.generateBasicReassessment('', skills, newInfo)
    
    skills.forEach(skill => {
      const currentSkill = dimensionData.skills[skill]
      const oldScore = typeof currentSkill === 'number' ? currentSkill : currentSkill.score
      const adjustment = reassessment.reassessment[skill]?.score || 0
      const newScore = Math.min(100, Math.max(0, oldScore + adjustment))
      
      if (adjustment !== 0) {
        dimensionData.skills[skill] = {
          score: newScore,
          confidence: 0.6,
          isInferred: false,
          lastUpdated: new Date().toISOString(),
          additionalInfo: newInfo
        }
        
        updates.push({
          skill,
          oldScore,
          newScore,
          change: newScore - oldScore,
          reason: reassessment.reassessment[skill]?.reason || '基于新信息调整'
        })
      }
    })
    
    return updates
  }

  // 辅助方法：生成技能提升计划
  private generateSkillImprovementPlan(dimension: string, skill: string, currentScore: number, weeks: number): string {
    const plans: Record<string, Record<string, string>> = {
      programming: {
        syntax: `每周练习2小时基础语法，完成${Math.ceil(weeks/2)}个小项目`,
        dataStructures: `学习数据结构理论并实现${Math.min(weeks, 8)}种常用数据结构`,
        errorHandling: `学习异常处理最佳实践，重构${Math.ceil(weeks/4)}个现有项目`,
        codeQuality: `学习代码规范，使用静态分析工具，进行${Math.ceil(weeks/2)}次代码审查`,
        tooling: `每周学习一个新工具，建立个人开发环境和工作流`
      },
      algorithm: {
        recursion: `每周解决${Math.ceil(weeks/2)}道递归问题，掌握递归思维模式`,
        dynamicProgramming: `系统学习DP理论，每周练习2-3道DP题目`,
        graph: `学习图论基础，实现常用图算法，解决实际图问题`,
        tree: `掌握二叉树遍历，学习平衡树，练习树形DP`,
        sorting: `实现各种排序算法，分析时间复杂度，优化性能`,
        searching: `掌握二分查找变形，学习高级搜索算法`
      },
      project: {
        planning: `学习项目管理方法论，使用工具规划${Math.ceil(weeks/8)}个项目`,
        architecture: `学习系统设计原则，设计${Math.ceil(weeks/12)}个系统架构`,
        implementation: `提升编程实现能力，完成${Math.ceil(weeks/4)}个实践项目`,
        testing: `学习测试驱动开发，为项目编写完整测试套件`,
        deployment: `学习CI/CD，部署${Math.ceil(weeks/6)}个项目到生产环境`,
        documentation: `提升技术写作能力，为项目编写完整文档`
      }
    }
    
    const defaultPlan = `制定${weeks}周学习计划，结合理论学习和实践项目，定期评估进度`
    
    return plans[dimension]?.[skill] || defaultPlan
  }

  // ========== 新增：目标激活管理工具 ==========

  private async getActivationStatsDetailedTool(params: any): Promise<any> {
    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const stats = goalActivationManager.getActivationStats()
      
      return {
        stats,
        message: `目标激活统计: ${stats.active}/${stats.maxActive} 个目标激活中`,
        utilizationRate: `${Math.round(stats.utilizationRate)}%`,
        completionRate: `${Math.round(stats.completionRate)}%`
      }
    } catch (error) {
      throw new Error(`获取激活统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async activateGoalAdvancedTool(params: any): Promise<any> {
    const { goalId, force = false, priority, reason } = params
    
    if (!goalId) {
      throw new Error('目标ID不能为空')
    }

    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const result = await goalActivationManager.activateGoal(goalId, { force, priority, reason })
      
      return result
    } catch (error) {
      throw new Error(`激活目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async pauseGoalAdvancedTool(params: any): Promise<any> {
    const { goalId, reason } = params
    
    if (!goalId) {
      throw new Error('目标ID不能为空')
    }

    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const result = await goalActivationManager.pauseGoal(goalId, reason)
      
      return result
    } catch (error) {
      throw new Error(`暂停目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async completeGoalAdvancedTool(params: any): Promise<any> {
    const { goalId, achievements = [] } = params
    
    if (!goalId) {
      throw new Error('目标ID不能为空')
    }

    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const result = await goalActivationManager.completeGoal(goalId, achievements)
      
      return result
    } catch (error) {
      throw new Error(`完成目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async batchActivateGoalsTool(params: any): Promise<any> {
    const { goalIds, maxConcurrent, priorityOrder = false } = params
    
    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      throw new Error('目标ID列表不能为空')
    }

    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const result = await goalActivationManager.activateMultipleGoals(goalIds, {
        maxConcurrent,
        priorityOrder
      })
      
      return result
    } catch (error) {
      throw new Error(`批量激活目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async reorderActiveGoalsTool(params: any): Promise<any> {
    const { priorityGoalIds } = params
    
    if (!priorityGoalIds || !Array.isArray(priorityGoalIds)) {
      throw new Error('目标优先级列表不能为空')
    }

    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      const result = await goalActivationManager.reorderActiveGoals(priorityGoalIds)
      
      return result
    } catch (error) {
      throw new Error(`重排目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async configureGoalActivationTool(params: any): Promise<any> {
    const { maxActiveGoals, autoDeactivateCompleted, syncRelatedPaths, allowPriorityOverride, notificationEnabled } = params
    
    try {
      const { goalActivationManager } = await import('./goalActivationManager')
      
      const config: any = {}
      if (maxActiveGoals !== undefined) config.maxActiveGoals = maxActiveGoals
      if (autoDeactivateCompleted !== undefined) config.autoDeactivateCompleted = autoDeactivateCompleted
      if (syncRelatedPaths !== undefined) config.syncRelatedPaths = syncRelatedPaths
      if (allowPriorityOverride !== undefined) config.allowPriorityOverride = allowPriorityOverride
      if (notificationEnabled !== undefined) config.notificationEnabled = notificationEnabled
      
      goalActivationManager.updateConfig(config)
      
      return {
        success: true,
        newConfig: goalActivationManager.getConfig(),
        message: '目标激活配置已更新'
      }
    } catch (error) {
      throw new Error(`配置更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

// 导出单例实例
export const agentToolExecutor = new AgentToolExecutor() 