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
  addCoreEvent,
  // 新增关联管理导入
  createLearningPathWithGoalLink,
  createCourseUnitWithNodeLink,
  validateDataRelationships,
  getRelationshipSuggestions,
  batchCreatePathsForGoal,
  batchCreateUnitsForNode
} from './service'
import { LearningGoal, LearningPath, PathNode, CourseUnit, AgentTool } from './types'
import { log, error } from '../../utils/logger'
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

  // ========== 数据关联关系管理 ==========
  {
    name: 'link_path_to_goal',
    description: '将学习路径关联到目标，建立Goal->Path的依赖关系',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      pathId: { type: 'string', description: '路径ID' }
    }
  },
  {
    name: 'link_courseunit_to_node',
    description: '将课程内容关联到路径节点，建立Node->CourseUnit的依赖关系',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      nodeId: { type: 'string', description: '节点ID' },
      courseUnitId: { type: 'string', description: '课程内容ID' }
    }
  },
  {
    name: 'unlink_path_from_goal',
    description: '移除路径与目标的关联关系',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      pathId: { type: 'string', description: '路径ID' }
    }
  },
  {
    name: 'unlink_courseunit_from_node',
    description: '移除课程内容与节点的关联关系',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      nodeId: { type: 'string', description: '节点ID' },
      courseUnitId: { type: 'string', description: '课程内容ID' }
    }
  },
  {
    name: 'get_paths_by_goal',
    description: '获取目标关联的所有学习路径',
    parameters: {
      goalId: { type: 'string', description: '目标ID' }
    }
  },
  {
    name: 'get_goal_by_path',
    description: '获取学习路径的来源目标',
    parameters: {
      pathId: { type: 'string', description: '路径ID' }
    }
  },
  {
    name: 'get_courseunits_by_node',
    description: '获取节点关联的所有课程内容',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      nodeId: { type: 'string', description: '节点ID' }
    }
  },
  {
    name: 'get_source_by_courseunit',
    description: '获取课程内容的来源路径和节点',
    parameters: {
      courseUnitId: { type: 'string', description: '课程内容ID' }
    }
  },
  {
    name: 'sync_data_relationships',
    description: '同步和清理数据关联关系，移除无效的关联',
    parameters: {}
  },
  {
    name: 'get_learning_hierarchy',
    description: '获取完整的学习层次结构(Goal->Path->Node->CourseUnit)',
    parameters: {}
  },
  {
    name: 'get_relationship_stats',
    description: '获取数据关联关系的统计信息，包括孤立数据统计',
    parameters: {}
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
  },
  // ========== 新增：数据关联管理工具 ==========
  {
    name: 'validate_data_relationships',
    description: '验证数据关联关系的完整性，检查孤立数据和无效关联',
    parameters: {}
  },
  {
    name: 'get_relationship_suggestions',
    description: '获取智能关联建议，为目标推荐路径，为节点推荐课程内容',
    parameters: {}
  },
  {
    name: 'create_path_with_goal_link',
    description: '创建学习路径并自动关联到指定目标',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      title: { type: 'string', description: '路径标题' },
      description: { type: 'string', description: '路径描述' },
      nodes: { 
        type: 'array', 
        items: { type: 'object' },
        description: '学习节点列表' 
      }
    }
  },
  {
    name: 'create_course_unit_with_node_link',
    description: '创建课程内容并自动关联到指定节点',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      nodeId: { type: 'string', description: '节点ID' },
      title: { type: 'string', description: '课程单元标题' },
      description: { type: 'string', description: '课程描述' },
      type: { 
        type: 'string', 
        enum: ['theory', 'example', 'exercise', 'project', 'quiz'],
        description: '课程类型' 
      },
      content: { type: 'object', description: '课程内容对象' }
    }
  },
  {
    name: 'batch_create_paths_for_goal',
    description: '为指定目标批量创建多个学习路径',
    parameters: {
      goalId: { type: 'string', description: '目标ID' },
      pathConfigs: { 
        type: 'array', 
        items: { type: 'object' },
        description: '路径配置列表，包含标题、描述和节点' 
      }
    }
  },
  {
    name: 'batch_create_units_for_node',
    description: '为指定节点批量创建多个课程内容',
    parameters: {
      pathId: { type: 'string', description: '路径ID' },
      nodeId: { type: 'string', description: '节点ID' },
      unitConfigs: { 
        type: 'array', 
        items: { type: 'object' },
        description: '课程单元配置列表' 
      }
    }
  },

  // ========== 智能分析工具 ==========
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

        // ========== 数据关联关系管理 ==========
        case 'link_path_to_goal':
          result = await this.linkPathToGoalTool(parameters)
          break
        case 'link_courseunit_to_node':
          result = await this.linkCourseUnitToNodeTool(parameters)
          break
        case 'unlink_path_from_goal':
          result = await this.unlinkPathFromGoalTool(parameters)
          break
        case 'unlink_courseunit_from_node':
          result = await this.unlinkCourseUnitFromNodeTool(parameters)
          break
        case 'get_paths_by_goal':
          result = await this.getPathsByGoalTool(parameters)
          break
        case 'get_goal_by_path':
          result = await this.getGoalByPathTool(parameters)
          break
        case 'get_courseunits_by_node':
          result = await this.getCourseUnitsByNodeTool(parameters)
          break
        case 'get_source_by_courseunit':
          result = await this.getSourceByCourseUnitTool(parameters)
          break
        case 'sync_data_relationships':
          result = await this.syncDataRelationshipsTool(parameters)
          break
        case 'get_learning_hierarchy':
          result = await this.getLearningHierarchyTool(parameters)
          break
        case 'get_relationship_stats':
          result = await this.getRelationshipStatsTool(parameters)
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
        case 'validate_data_relationships':
          result = await this.validateDataRelationshipsTool(parameters)
          break
        case 'get_relationship_suggestions':
          result = await this.getRelationshipSuggestionsTool(parameters)
          break
        case 'create_path_with_goal_link':
          result = await this.createPathWithGoalLinkTool(parameters)
          break
        case 'create_course_unit_with_node_link':
          result = await this.createCourseUnitWithNodeLinkTool(parameters)
          break
        case 'batch_create_paths_for_goal':
          result = await this.batchCreatePathsForGoalTool(parameters)
          break
        case 'batch_create_units_for_node':
          result = await this.batchCreateUnitsForNodeTool(parameters)
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
      status: 'draft' as const
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

  private identifyStrengths(ability: any): string[] {
    const strengths: string[] = []
    if (ability.dimensions) {
      Object.entries(ability.dimensions).forEach(([name, dim]: [string, any]) => {
        if (dim.score >= 7) {
          strengths.push(`${name}: ${dim.score}分`)
        }
      })
    }
    return strengths.length > 0 ? strengths : ['需要更多评估数据']
  }

  private identifyWeaknesses(ability: any): string[] {
    const weaknesses: string[] = []
    if (ability.dimensions) {
      Object.entries(ability.dimensions).forEach(([name, dim]: [string, any]) => {
        if (dim.score < 5) {
          weaknesses.push(`${name}: ${dim.score}分`)
        }
      })
    }
    return weaknesses.length > 0 ? weaknesses : ['暂无明显薄弱环节']
  }

  private generateAbilityRecommendation(ability: any): string {
    const overallScore = ability.overallScore || 0
    if (overallScore >= 8) {
      return '您的能力水平很高，建议挑战更高难度的学习目标'
    } else if (overallScore >= 6) {
      return '您有良好的基础，建议选择中等难度的学习目标'
    } else if (overallScore >= 4) {
      return '建议从基础开始，循序渐进地提升技能'
    } else {
      return '建议先完成基础技能训练，建立扎实的基础'
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

  private getContextBasedRecommendation(activeGoals: any[], activePaths: any[], units: any[]): string {
    if (activeGoals.length === 0) {
      return '建议设定第一个学习目标'
    }
    if (activePaths.length === 0) {
      return '建议为当前目标创建学习路径'
    }
    if (units.length === 0) {
      return '建议添加学习内容'
    }
    return '继续当前的学习计划'
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
    
    // 使用AI进行智能技能差距分析
    return await this.performAISkillGapAnalysis(goal, abilityData, context)
  }

  /**
   * 使用AI进行智能技能差距分析
   */
  private async performAISkillGapAnalysis(goal: any, abilityData: any, context: any): Promise<any> {
    try {
      // 构建用于AI分析的详细提示词
      const analysisPrompt = this.buildSkillGapAnalysisPrompt(goal, abilityData, context)
      
      // 调用AI进行分析
      const { callAI } = await import('../../utils/ai')
      const aiResponse = await callAI(analysisPrompt)
      
      // 解析AI响应
      const analysis = this.parseAISkillGapResponse(aiResponse)
      
      // 验证和增强分析结果
      const enhancedAnalysis = this.enhanceAIAnalysis(analysis, goal, abilityData, context)
      
      log('[AgentTools] AI skill gap analysis completed successfully')
      return enhancedAnalysis
      
    } catch (error) {
      log('[AgentTools] AI skill gap analysis failed, falling back to rule-based analysis:', error)
      
      // 如果AI分析失败，回退到基于规则的分析
      return this.fallbackRuleBasedAnalysis(goal, abilityData)
    }
  }

  /**
   * 构建技能差距分析的AI提示词
   */
  private buildSkillGapAnalysisPrompt(goal: any, abilityData: any, context: any): string {
    const userProfile = this.buildUserProfileSection(abilityData)
    const goalAnalysis = this.buildGoalAnalysisSection(goal)
    const contextInfo = this.buildContextSection(context)
    
    return `作为专业的学习路径规划专家，请基于用户的能力档案和学习目标，进行深度的技能差距分析。

## 📊 用户能力档案
${userProfile}

## 🎯 学习目标分析
${goalAnalysis}

## 📚 学习上下文
${contextInfo}

## 分析要求
请根据以上信息，进行深度的个性化技能差距分析，并按以下JSON格式返回结果：

\`\`\`json
{
  "hasAbilityData": true,
  "analysisConfidence": 0.85,
  "overallAssessment": {
    "currentLevel": 6.5,
    "targetLevel": 8.5,
    "gapSeverity": "medium",
    "readinessScore": 75,
    "learningStyle": "实践型",
    "personalizedInsights": [
      "基于您的强项分析的个性化洞察",
      "基于您的薄弱环节的建议"
    ]
  },
  "skillGaps": [
    {
      "skill": "具体技能名称",
      "category": "技术技能/软技能/领域知识",
      "currentLevel": 6,
      "targetLevel": 8,
      "gap": 2,
      "priority": "high|medium|low",
      "difficulty": "easy|medium|hard",
      "learningOrder": 1,
      "prerequisiteSkills": ["前置技能"],
      "relatedStrengths": ["可以利用的现有优势"],
      "estimatedHours": 40,
      "learningStrategy": "针对该技能的具体学习策略",
      "assessmentCriteria": "如何判断掌握程度",
      "practicalApplication": "实际应用场景"
    }
  ],
  "learningPath": {
    "phaseStructure": [
      {
        "phase": "基础巩固",
        "duration": "2-3周",
        "focus": "重点内容",
        "skills": ["相关技能"],
        "rationale": "为什么这样安排"
      }
    ],
    "criticalMilestones": [
      {
        "milestone": "里程碑名称",
        "timeframe": "时间框架",
        "deliverable": "交付物",
        "successCriteria": "成功标准"
      }
    ]
  },
  "personalizedRecommendations": {
    "leverageStrengths": [
      "如何利用用户现有优势加速学习"
    ],
    "addressWeaknesses": [
      "如何针对性地改善薄弱环节"
    ],
    "learningStyle": [
      "基于用户特点的学习方式建议"
    ],
    "timeManagement": [
      "基于用户情况的时间安排建议"
    ],
    "motivationTips": [
      "保持学习动力的个性化建议"
    ]
  },
  "riskAssessment": {
    "challengingAreas": [
      {
        "area": "可能遇到困难的领域",
        "reason": "困难原因分析",
        "mitigation": "应对策略"
      }
    ],
    "successFactors": [
      "成功的关键因素"
    ],
    "fallbackPlan": "备用方案"
  },
  "estimatedTimeWeeks": 12,
  "confidenceLevel": 0.88,
  "nextSteps": [
    "立即可以开始的具体行动"
  ]
}
\`\`\`

## 分析重点
1. **深度个性化**: 充分考虑用户的能力特点、学习历史和偏好
2. **实用性导向**: 提供可操作的具体建议，而非泛泛而谈
3. **动态适应**: 考虑用户的成长潜力和学习能力
4. **风险意识**: 识别可能的学习障碍并提供应对方案
5. **动机维护**: 考虑如何保持用户的学习积极性

请确保分析结果既有深度又有实用性，能够真正指导用户的学习规划。`
  }

  /**
   * 构建用户档案部分
   */
  private buildUserProfileSection(abilityData: any): string {
    if (!abilityData) return '暂无详细能力档案数据'
    
    const overallInfo = `
**综合能力水平**: ${abilityData.overallScore || 0}分 (${this.getScoreLevel(abilityData.overallScore || 0)})
**评估时间**: ${abilityData.lastAssessed || abilityData.assessmentDate || '未知'}
**评估置信度**: ${((abilityData.confidence || 0.8) * 100).toFixed(0)}%`

    let dimensionDetails = ''
    if (abilityData.dimensions) {
      dimensionDetails = Object.entries(abilityData.dimensions).map(([name, dim]: [string, any]) => {
        const skillDetails = dim.skills ? Object.entries(dim.skills).map(([skill, score]: [string, any]) => {
          const actualScore = typeof score === 'number' ? score : score.score || 0
          const confidence = typeof score === 'object' ? score.confidence || 1.0 : 1.0
          const isInferred = typeof score === 'object' ? score.isInferred || false : false
          return `  - ${skill}: ${actualScore}分 (置信度: ${(confidence * 100).toFixed(0)}%) ${isInferred ? '[推断]' : '[评估]'}`
        }).join('\n') : ''
        
        return `**${name}维度** (权重: ${((dim.weight || 0.2) * 100).toFixed(0)}%, 得分: ${dim.score || 0}分):
${skillDetails}`
      }).join('\n\n')
    }

    let strengthsWeaknesses = ''
    if (abilityData.strengths || abilityData.weaknesses) {
      const strengths = abilityData.strengths || []
      const weaknesses = abilityData.weaknesses || []
      strengthsWeaknesses = `
**核心优势**: ${strengths.length > 0 ? strengths.join('、') : '待分析'}
**改进方向**: ${weaknesses.length > 0 ? weaknesses.join('、') : '待分析'}`
    }

    return `${overallInfo}

${dimensionDetails}
${strengthsWeaknesses}`
  }

  /**
   * 构建目标分析部分
   */
  private buildGoalAnalysisSection(goal: any): string {
    return `**目标标题**: ${goal.title}
**目标描述**: ${goal.description || '无详细描述'}
**目标分类**: ${goal.category || '通用'}
**目标级别**: ${goal.targetLevel || '中级'}
**当前状态**: ${goal.status || 'active'}
**创建时间**: ${goal.createdAt || '未知'}
**预期完成时间**: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '未设定'}
**所需技能**: ${goal.requiredSkills ? goal.requiredSkills.join('、') : '由AI分析推断'}
**成功标准**: ${goal.successCriteria || '达到目标级别要求'}`
  }

  /**
   * 构建上下文部分
   */
  private buildContextSection(context: any): string {
    if (!context) return '无额外上下文信息'
    
    const learningHistory = context.learningHistory ? `
**学习历史**:
- 活跃目标: ${context.learningHistory.activeGoals || 0}个
- 已完成目标: ${context.learningHistory.completedGoals || 0}个
- 偏好类别: ${context.learningHistory.preferredCategories?.join('、') || '无特定偏好'}
- 平均时间投入: 每周${context.learningHistory.averageTimeInvestment || 0}小时` : ''

    const hasAbilityData = context.hasAbilityData ? '✅ 有完整能力评估数据' : '⚠️ 缺少能力评估数据'
    
    return `**数据完整性**: ${hasAbilityData}
${learningHistory}`
  }

  /**
   * 解析AI技能差距分析响应（增强版 - 强健JSON解析）
   */
  private parseAISkillGapResponse(response: string): any {
    log('[AgentTools] Starting AI skill gap response parsing')
    
    try {
      // 使用与目标设定和能力评估相同的强健解析逻辑
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
      let rawJson = ''
      
      if (!jsonMatch) {
        log('[AgentTools] Standard JSON format not found, trying alternative formats')
        
        // 尝试其他格式的 JSON 提取
        const altJsonMatch = response.match(/```json([\s\S]*?)```/) || 
                            response.match(/```\s*\{[\s\S]*?\}\s*```/) ||
                            response.match(/\{[\s\S]*\}/)
        
        if (altJsonMatch) {
          log('[AgentTools] Found JSON in alternative format')
          rawJson = altJsonMatch[1] || altJsonMatch[0]
        } else {
          error('[AgentTools] No valid JSON format found in AI skill gap response')
          throw new Error('AI响应格式错误 - 未找到有效的JSON格式')
        }
      } else {
        log('[AgentTools] Using standard JSON format')
        rawJson = jsonMatch[1]
      }
      
      // 清理和修复JSON格式
      const cleanJson = this.cleanupSkillGapJSONString(rawJson.trim())
      
      // 解析JSON
      const parsed = JSON.parse(cleanJson)
      log('[AgentTools] JSON parsing successful')
      
      // 验证和修复数据结构
      const validated = this.validateAndFixSkillGapResult(parsed)
      
      log('[AgentTools] Skill gap response validation successful')
      return validated
      
    } catch (err) {
      error('[AgentTools] Failed to parse AI skill gap response:', err)
      
      // 提供更详细的错误信息和兜底策略
      if (err instanceof SyntaxError) {
        log('[AgentTools] JSON syntax error. Providing fallback structure...')
        
        // 提供一个最小的可用结构
        return this.getFallbackSkillGapStructure()
      }
      
      throw new Error('AI响应格式无效，无法解析分析结果: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  /**
   * 清理并修复技能差距分析的JSON格式错误
   */
  private cleanupSkillGapJSONString(jsonStr: string): string {
    let cleaned = jsonStr.trim()
    
    // 移除可能的 markdown 代码块标记
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    
    // 修复常见的不完整布尔值
    cleaned = cleaned.replace(/"hasAbilityData":\s*tru$/g, '"hasAbilityData": true')
    cleaned = cleaned.replace(/"hasAbilityData":\s*fals$/g, '"hasAbilityData": false')
    cleaned = cleaned.replace(/"contextUsed":\s*tru$/g, '"contextUsed": true')
    cleaned = cleaned.replace(/"contextUsed":\s*fals$/g, '"contextUsed": false')
    
    // 修复其他常见的不完整值
    cleaned = cleaned.replace(/:\s*fals$/g, ': false')
    cleaned = cleaned.replace(/:\s*tru$/g, ': true')
    cleaned = cleaned.replace(/:\s*nul$/g, ': null')
    
    // 确保字符串末尾有正确的闭合括号
    const openBraces = (cleaned.match(/\{/g) || []).length
    const closeBraces = (cleaned.match(/\}/g) || []).length
    const openBrackets = (cleaned.match(/\[/g) || []).length
    const closeBrackets = (cleaned.match(/\]/g) || []).length
    
    if (openBraces > closeBraces) {
      // 检查是否是在skillGaps数组中断
      if (cleaned.includes('"skillGaps"') && !cleaned.includes(']')) {
        const skillGapsMatch = cleaned.match(/"skillGaps":\s*\[[^\]]*$/)
        if (skillGapsMatch) {
          log('[AgentTools] Detected incomplete skillGaps array, attempting to close')
          cleaned = cleaned.replace(/,?\s*$/, ']')
        }
      }
      
      // 添加缺少的闭合括号
      cleaned += '}'.repeat(openBraces - closeBraces)
    }
    
    if (openBrackets > closeBrackets) {
      cleaned += ']'.repeat(openBrackets - closeBrackets)
    }
    
    // 尝试修复缺少的逗号（更保守的方法）
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"')
    cleaned = cleaned.replace(/\}\s*\n\s*"/g, '},\n"')
    cleaned = cleaned.replace(/\]\s*\n\s*"/g, '],\n"')
    
    // 修复技能差距数组中的常见格式问题
    cleaned = cleaned.replace(/\}\s*{/g, '}, {')
    
    return cleaned
  }

  /**
   * 验证和修复技能差距分析结果
   */
  private validateAndFixSkillGapResult(parsed: any): any {
    const validated = {
      hasAbilityData: true,
      contextUsed: true,
      timestamp: new Date().toISOString(),
      analysisConfidence: 0.85,
      ...parsed
    }
    
    // 确保skillGaps字段存在且为数组
    if (!validated.skillGaps || !Array.isArray(validated.skillGaps)) {
      log('[AgentTools] Invalid or missing skillGaps, providing default structure')
      validated.skillGaps = []
    }
    
    // 验证和修正每个技能差距条目
    validated.skillGaps = validated.skillGaps.map((gap: any, index: number) => ({
      skill: gap.skill || `技能${index + 1}`,
      category: gap.category || '技术技能',
      currentLevel: Math.max(0, Math.min(10, gap.currentLevel || 0)),
      targetLevel: Math.max(0, Math.min(10, gap.targetLevel || 8)),
      gap: Math.max(0, (gap.targetLevel || 8) - (gap.currentLevel || 0)),
      priority: ['low', 'medium', 'high'].includes(gap.priority) ? gap.priority : 'medium',
      difficulty: ['easy', 'medium', 'hard'].includes(gap.difficulty) ? gap.difficulty : 'medium',
      learningOrder: gap.learningOrder || index + 1,
      prerequisiteSkills: Array.isArray(gap.prerequisiteSkills) ? gap.prerequisiteSkills : [],
      relatedStrengths: Array.isArray(gap.relatedStrengths) ? gap.relatedStrengths : [],
      estimatedHours: Math.max(1, gap.estimatedHours || 10),
      learningStrategy: gap.learningStrategy || '系统性学习，理论与实践结合',
      assessmentCriteria: gap.assessmentCriteria || '通过实际项目验证掌握程度',
      practicalApplication: gap.practicalApplication || '应用于实际工作场景'
    }))
    
    // 确保overallAssessment字段存在
    if (!validated.overallAssessment) {
      const avgCurrentLevel = validated.skillGaps.reduce((sum: number, gap: any) => sum + gap.currentLevel, 0) / Math.max(1, validated.skillGaps.length)
      const avgTargetLevel = validated.skillGaps.reduce((sum: number, gap: any) => sum + gap.targetLevel, 0) / Math.max(1, validated.skillGaps.length)
      const avgGap = avgTargetLevel - avgCurrentLevel
      
      validated.overallAssessment = {
        currentLevel: avgCurrentLevel,
        targetLevel: avgTargetLevel,
        gapSeverity: avgGap > 3 ? 'high' : avgGap > 1 ? 'medium' : 'low',
        readinessScore: Math.max(20, Math.min(100, (avgCurrentLevel / avgTargetLevel) * 100)),
        learningStyle: '实践型',
        personalizedInsights: [
          '基于您的能力档案分析，制定了个性化学习路径',
          '建议循序渐进，重点关注优先级高的技能'
        ]
      }
    }
    
    // 确保personalizedRecommendations字段存在
    if (!validated.personalizedRecommendations) {
      validated.personalizedRecommendations = {
        leverageStrengths: ['利用现有技能优势，加速新技能学习'],
        addressWeaknesses: ['针对薄弱环节制定专项提升计划'],
        learningStyle: ['建议采用项目驱动的学习方式'],
        timeManagement: ['合理分配学习时间，保持持续性'],
        motivationTips: ['设置阶段性目标，及时奖励进步']
      }
    }
    
    // 添加汇总统计
    if (!validated.summary) {
      const averageGap = validated.skillGaps.reduce((sum: number, gap: any) => sum + gap.gap, 0) / Math.max(1, validated.skillGaps.length)
      validated.summary = {
        averageGap,
        highPriorityCount: validated.skillGaps.filter((g: any) => g.priority === 'high').length,
        estimatedWeeks: Math.ceil(averageGap * 2),
        totalEstimatedHours: validated.skillGaps.reduce((sum: number, gap: any) => sum + gap.estimatedHours, 0),
        averageConfidence: validated.analysisConfidence || 0.85
      }
    }
    
    return validated
  }

  /**
   * 获取技能差距分析的兜底结构
   */
  private getFallbackSkillGapStructure(): any {
    return {
      hasAbilityData: false,
      contextUsed: false,
      timestamp: new Date().toISOString(),
      analysisConfidence: 0.5,
      fallbackUsed: true,
      skillGaps: [],
      overallAssessment: {
        currentLevel: 5,
        targetLevel: 7,
        gapSeverity: 'medium',
        readinessScore: 60,
        learningStyle: '实践型',
        personalizedInsights: [
          '由于解析失败，使用了基础分析结构',
          '建议重新尝试分析或完善能力评估数据'
        ]
      },
      personalizedRecommendations: {
        leverageStrengths: ['基于现有能力制定学习计划'],
        addressWeaknesses: ['识别并改善技能薄弱环节'],
        learningStyle: ['建议循序渐进的学习方式'],
        timeManagement: ['制定合理的时间安排'],
        motivationTips: ['保持学习热情和持续性']
      },
      summary: {
        averageGap: 2,
        highPriorityCount: 0,
        estimatedWeeks: 4,
        totalEstimatedHours: 40,
        averageConfidence: 0.5
      },
      message: '解析失败，已提供基础分析结构。建议重新尝试或检查AI响应格式。'
    }
  }

  /**
   * 增强AI分析结果
   */
  private enhanceAIAnalysis(analysis: any, goal: any, abilityData: any, context: any): any {
    // 确保基本字段存在
    const enhanced = {
      hasAbilityData: true,
      contextUsed: !!context,
      timestamp: new Date().toISOString(),
      ...analysis
    }
    
    // 验证和修正技能差距数据
    if (enhanced.skillGaps) {
      enhanced.skillGaps = enhanced.skillGaps.map((gap: any, index: number) => ({
        learningOrder: index + 1,
        ...gap,
        // 确保数值字段的合理性
        currentLevel: Math.max(0, Math.min(10, gap.currentLevel || 0)),
        targetLevel: Math.max(0, Math.min(10, gap.targetLevel || 8)),
        gap: Math.max(0, (gap.targetLevel || 8) - (gap.currentLevel || 0)),
        estimatedHours: Math.max(1, gap.estimatedHours || 10)
      }))
    }
    
    // 添加汇总统计
    enhanced.summary = {
      averageGap: enhanced.skillGaps?.reduce((sum: number, gap: any) => sum + gap.gap, 0) / (enhanced.skillGaps?.length || 1),
      highPriorityCount: enhanced.skillGaps?.filter((g: any) => g.priority === 'high').length || 0,
      totalEstimatedHours: enhanced.skillGaps?.reduce((sum: number, gap: any) => sum + (gap.estimatedHours || 0), 0) || 0,
      averageConfidence: enhanced.analysisConfidence || 0.8
    }
    
    return enhanced
  }

  /**
   * 回退到基于规则的分析（当AI分析失败时）
   */
  private fallbackRuleBasedAnalysis(goal: any, abilityData: any): any {
    log('[AgentTools] Using fallback rule-based analysis')
    
    // 基于目标类别和用户能力计算技能差距（原有逻辑的简化版）
    const requiredSkills = this.getRequiredSkillsForGoal(goal)
    
    const skillGaps = requiredSkills.map((skill, index) => {
      const currentLevel = this.getSkillLevel(abilityData, skill)
      const targetLevel = this.getTargetLevelScore(goal.targetLevel)
      const gap = Math.max(0, targetLevel - currentLevel)
      
      return {
        skill,
        currentLevel,
        targetLevel,
        gap,
        priority: gap > 3 ? 'high' : gap > 1 ? 'medium' : 'low',
        learningOrder: index + 1,
        estimatedHours: gap * 5, // 简单估算
        category: '技术技能',
        difficulty: gap > 3 ? 'hard' : gap > 1 ? 'medium' : 'easy'
      }
    })
    
    const averageGap = skillGaps.reduce((sum, gap) => sum + gap.gap, 0) / skillGaps.length
    
    return {
      hasAbilityData: true,
      skillGaps,
      analysisConfidence: 0.6, // 规则分析置信度较低
      overallAssessment: {
        currentLevel: abilityData.overallScore / 10,
        targetLevel: this.getTargetLevelScore(goal.targetLevel) / 10,
        gapSeverity: averageGap > 3 ? 'high' : averageGap > 1 ? 'medium' : 'low'
      },
      summary: {
        averageGap,
        highPriorityCount: skillGaps.filter(g => g.priority === 'high').length,
        estimatedWeeks: Math.ceil(averageGap * 2),
        totalEstimatedHours: skillGaps.reduce((sum, gap) => sum + gap.estimatedHours, 0)
      },
      personalizedRecommendations: {
        leverageStrengths: ['基于现有技能优势制定学习计划'],
        addressWeaknesses: ['重点关注薄弱技能的提升'],
        learningStyle: ['建议循序渐进的学习方式']
      },
      contextUsed: false,
      timestamp: new Date().toISOString(),
      fallbackUsed: true
    }
  }

  /**
   * 获取分数对应的等级描述
   */
  private getScoreLevel(score: number): string {
    if (score >= 90) return '专家级'
    if (score >= 75) return '高级'
    if (score >= 60) return '中级'
    if (score >= 40) return '初级'
    return '入门级'
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

  /**
   * 获取技能水平
   */
  private getSkillLevel(ability: any, skill: string): number {
    if (!ability || !ability.dimensions) return 0
    
    // 在所有维度中查找技能
    for (const dimension of Object.values(ability.dimensions) as any[]) {
      if (dimension.skills && dimension.skills[skill]) {
        const skillData = dimension.skills[skill]
        return typeof skillData === 'number' ? skillData : skillData.score || 0
      }
    }
    return 0 // 未找到技能，返回0
  }

  /**
   * 获取目标级别对应的分数
   */
  private getTargetLevelScore(level: string): number {
    const levelMap = {
      'beginner': 4,
      'intermediate': 6,
      'advanced': 8,
      'expert': 10
    }
    return levelMap[level as keyof typeof levelMap] || 6
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

  // ========== 数据关联关系管理工具实现 ==========

  private async linkPathToGoalTool(params: any): Promise<any> {
    const { goalId, pathId } = params
    
    if (!goalId || !pathId) {
      throw new Error('目标ID和路径ID不能为空')
    }

    try {
      const { linkPathToGoal } = await import('./service')
      const result = linkPathToGoal(goalId, pathId)
      
      return {
        success: result,
        message: result ? '成功关联路径到目标' : '关联失败',
        goalId,
        pathId
      }
    } catch (error) {
      throw new Error(`关联路径失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async linkCourseUnitToNodeTool(params: any): Promise<any> {
    const { pathId, nodeId, courseUnitId } = params
    
    if (!pathId || !nodeId || !courseUnitId) {
      throw new Error('路径ID、节点ID和课程内容ID不能为空')
    }

    try {
      const { linkCourseUnitToNode } = await import('./service')
      const result = linkCourseUnitToNode(pathId, nodeId, courseUnitId)
      
      return {
        success: result,
        message: result ? '成功关联课程内容到节点' : '关联失败',
        pathId,
        nodeId,
        courseUnitId
      }
    } catch (error) {
      throw new Error(`关联课程内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async unlinkPathFromGoalTool(params: any): Promise<any> {
    const { goalId, pathId } = params
    
    if (!goalId || !pathId) {
      throw new Error('目标ID和路径ID不能为空')
    }

    try {
      const { unlinkPathFromGoal } = await import('./service')
      const result = unlinkPathFromGoal(goalId, pathId)
      
      return {
        success: result,
        message: result ? '成功移除路径与目标的关联' : '移除失败',
        goalId,
        pathId
      }
    } catch (error) {
      throw new Error(`移除路径与目标的关联关系失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async unlinkCourseUnitFromNodeTool(params: any): Promise<any> {
    const { pathId, nodeId, courseUnitId } = params
    
    if (!pathId || !nodeId || !courseUnitId) {
      throw new Error('路径ID、节点ID和课程内容ID不能为空')
    }

    try {
      const { unlinkCourseUnitFromNode } = await import('./service')
      const result = unlinkCourseUnitFromNode(pathId, nodeId, courseUnitId)
      
      return {
        success: result,
        message: result ? '成功移除课程内容与节点的关联' : '移除失败',
        pathId,
        nodeId,
        courseUnitId
      }
    } catch (error) {
      throw new Error(`移除课程内容与节点的关联关系失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getPathsByGoalTool(params: any): Promise<any> {
    const { goalId } = params
    
    if (!goalId) {
      throw new Error('目标ID不能为空')
    }

    try {
      const { getPathsByGoal } = await import('./service')
      const paths = getPathsByGoal(goalId)
      
      return {
        goalId,
        paths,
        count: paths.length
      }
    } catch (error) {
      throw new Error(`获取目标关联的所有学习路径失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getGoalByPathTool(params: any): Promise<any> {
    const { pathId } = params
    
    if (!pathId) {
      throw new Error('路径ID不能为空')
    }

    try {
      const { getGoalByPath } = await import('./service')
      const goal = getGoalByPath(pathId)
      
      return {
        pathId,
        goal,
        hasGoal: !!goal
      }
    } catch (error) {
      throw new Error(`获取学习路径的来源目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getCourseUnitsByNodeTool(params: any): Promise<any> {
    const { pathId, nodeId } = params
    
    if (!pathId || !nodeId) {
      throw new Error('路径ID和节点ID不能为空')
    }

    try {
      const { getCourseUnitsByNodeId } = await import('./service')
      const courseUnits = getCourseUnitsByNodeId(pathId, nodeId)
      
      return {
        pathId,
        nodeId,
        courseUnits,
        count: courseUnits.length
      }
    } catch (error) {
      throw new Error(`获取节点关联的所有课程内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getSourceByCourseUnitTool(params: any): Promise<any> {
    const { courseUnitId } = params
    
    if (!courseUnitId) {
      throw new Error('课程内容ID不能为空')
    }

    try {
      const { getSourceByUri } = await import('./service')
      const result = getSourceByUri(courseUnitId)
      
      return {
        courseUnitId,
        path: result.path,
        node: result.node,
        hasSource: !!(result.path && result.node)
      }
    } catch (error) {
      throw new Error(`获取课程内容的来源路径和节点失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async syncDataRelationshipsTool(params: any): Promise<any> {
    try {
      const { syncDataRelationships } = await import('./service')
      const result = syncDataRelationships()
      
      return {
        ...result,
        message: result.removedLinks.length > 0 ? 
          `清理了 ${result.removedLinks.length} 个无效关联` : 
          '数据关联关系正常，无需清理'
      }
    } catch (error) {
      throw new Error(`同步和清理数据关联关系失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getLearningHierarchyTool(params: any): Promise<any> {
    try {
      const { getLearningHierarchy } = await import('./service')
      const hierarchy = getLearningHierarchy()
      
      return {
        ...hierarchy,
        summary: {
          totalGoals: hierarchy.goals.length,
          totalPaths: hierarchy.goals.reduce((sum, g) => sum + g.paths.length, 0),
          totalNodes: hierarchy.goals.reduce((sum, g) => 
            sum + g.paths.reduce((pathSum, p) => pathSum + p.nodes.length, 0), 0),
          totalCourseUnits: hierarchy.goals.reduce((sum, g) => 
            sum + g.paths.reduce((pathSum, p) => 
              pathSum + p.nodes.reduce((nodeSum, n) => nodeSum + n.courseUnits.length, 0), 0), 0)
        }
      }
    } catch (error) {
      throw new Error(`获取完整的学习层次结构失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getRelationshipStatsTool(params: any): Promise<any> {
    try {
      const { getRelationshipStats } = await import('./service')
      const stats = getRelationshipStats()
      
      return {
        ...stats,
        healthScore: Math.round(
          ((stats.goalsWithPaths / Math.max(1, stats.totalGoals)) * 0.3 +
           (stats.pathsWithGoals / Math.max(1, stats.totalPaths)) * 0.3 +
           (stats.nodesWithCourseUnits / Math.max(1, stats.totalNodes)) * 0.2 +
           (stats.courseUnitsWithSources / Math.max(1, stats.totalCourseUnits)) * 0.2) * 100
        ),
        recommendations: [
          ...(stats.orphanedPaths > 0 ? [`发现 ${stats.orphanedPaths} 个孤立路径，建议关联到目标`] : []),
          ...(stats.orphanedCourseUnits > 0 ? [`发现 ${stats.orphanedCourseUnits} 个孤立课程内容，建议关联到节点`] : []),
          ...(stats.totalNodes - stats.nodesWithCourseUnits > 0 ? 
            [`发现 ${stats.totalNodes - stats.nodesWithCourseUnits} 个空节点，建议添加课程内容`] : [])
        ]
      }
    } catch (error) {
      throw new Error(`获取数据关联关系的统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async validateDataRelationshipsTool(params: any): Promise<any> {
    try {
      const result = validateDataRelationships()
      
      return {
        ...result,
        message: result.isValid ? '数据关联关系完整' : '存在无效关联'
      }
    } catch (error) {
      throw new Error(`验证数据关联关系失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async getRelationshipSuggestionsTool(params: any): Promise<any> {
    try {
      const suggestions = getRelationshipSuggestions()
      
      return {
        suggestions,
        message: '智能关联建议已生成'
      }
    } catch (error) {
      throw new Error(`获取智能关联建议失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async createPathWithGoalLinkTool(params: any): Promise<any> {
    const { goalId, title, description, nodes } = params
    
    if (!goalId || !title || !nodes || !Array.isArray(nodes)) {
      throw new Error('目标ID、标题和节点列表不能为空')
    }

    try {
      const nodesWithIds = nodes.map(node => ({
        ...node,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'not_started' as const,
        progress: 0,
        courseUnitIds: []
      }))
      
      const pathData = {
        goalId,
        title,
        description: description || '',
        totalEstimatedHours: nodesWithIds.reduce((sum, node) => sum + (node.estimatedHours || 0), 0),
        nodes: nodesWithIds,
        dependencies: [],
        milestones: [],
        version: '1.0.0',
        status: 'draft' as const
      }
      
      const result = createLearningPathWithGoalLink(pathData, goalId)
      
      return {
        success: true,
        path: result,
        message: '成功创建学习路径并关联到目标',
        goalId,
        title,
        description
      }
    } catch (error) {
      throw new Error(`创建学习路径并关联到目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async createCourseUnitWithNodeLinkTool(params: any): Promise<any> {
    const { pathId, nodeId, title, description, type, content } = params
    
    if (!pathId || !nodeId || !title || !type) {
      throw new Error('路径ID、节点ID、标题和类型不能为空')
    }

    try {
      const unitData = {
        nodeId,
        title,
        description: description || '',
        type,
        content: content || {},
        metadata: {
          difficulty: 3,
          estimatedTime: 60,
          keywords: [],
          learningObjectives: [],
          prerequisites: [],
          order: 0
        },
        sourcePathId: pathId,
        sourceNodeId: nodeId
      }
      
      const result = createCourseUnitWithNodeLink(unitData, pathId, nodeId)
      
      return {
        success: true,
        unit: result,
        message: '成功创建课程内容并关联到节点',
        pathId,
        nodeId,
        title
      }
    } catch (error) {
      throw new Error(`创建课程内容并关联到节点失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async batchCreatePathsForGoalTool(params: any): Promise<any> {
    const { goalId, pathConfigs } = params
    
    if (!goalId || !pathConfigs || !Array.isArray(pathConfigs)) {
      throw new Error('目标ID和路径配置列表不能为空')
    }

    try {
      const results = await batchCreatePathsForGoal(goalId, pathConfigs)
      
      return {
        success: true,
        paths: results,
        count: results.length,
        message: `成功为目标批量创建了 ${results.length} 个学习路径`,
        goalId
      }
    } catch (error) {
      throw new Error(`为指定目标批量创建多个学习路径失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async batchCreateUnitsForNodeTool(params: any): Promise<any> {
    const { nodeId, units } = params
    const results: Array<{ success: boolean; unit?: any; error?: string; unitData?: any }> = []
    
    for (const unitData of units) {
      try {
        const unit = await this.createCourseUnitTool(unitData)
        await this.linkCourseUnitToNodeTool({ courseUnitId: unit.id, nodeId })
        results.push({ success: true, unit })
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error), 
          unitData 
        })
      }
    }
    
    return {
      totalUnits: units.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    }
  }

  // ========== Missing CRUD Methods ==========
  
  private async getLearningGoalsTool(params: any): Promise<any> {
    const { filters, limit, offset } = params || {}
    const goals = getLearningGoals()
    
    let filteredGoals = goals
    if (filters) {
      if (filters.category) {
        filteredGoals = filteredGoals.filter(g => g.category === filters.category)
      }
      if (filters.status) {
        filteredGoals = filteredGoals.filter(g => g.status === filters.status)
      }
      if (filters.priority) {
        filteredGoals = filteredGoals.filter(g => g.priority === filters.priority)
      }
    }
    
    const start = offset || 0
    const end = limit ? start + limit : filteredGoals.length
    
    return {
      goals: filteredGoals.slice(start, end),
      total: filteredGoals.length,
      hasMore: end < filteredGoals.length
    }
  }

  private async getLearningGoalTool(params: any): Promise<any> {
    const { goalId } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Learning goal with id ${goalId} not found`)
    }
    
    return goal
  }

  private async deleteLearningGoalTool(params: any): Promise<any> {
    const { goalId } = params
    const goals = getLearningGoals()
    const goalIndex = goals.findIndex(g => g.id === goalId)
    
    if (goalIndex === -1) {
      throw new Error(`Learning goal with id ${goalId} not found`)
    }
    
    const deletedGoal = goals[goalIndex]
    goals.splice(goalIndex, 1)
    
    // Save updated goals - using the core data function directly
    // Note: We'll need to implement a proper save function or use existing storage
    try {
      // For now, we'll just log the deletion since we don't have a direct save function
      log(`[AgentTools] Goal deleted: ${deletedGoal.title}`)
      // TODO: Implement proper goal deletion in core data
    } catch (error) {
      log(`[AgentTools] Warning: Could not persist goal deletion: ${error}`)
    }
    
    return { success: true, deletedGoal }
  }

  private async getLearningPathsTool(params: any): Promise<any> {
    const { filters, limit, offset } = params || {}
    const paths = getLearningPaths()
    
    let filteredPaths = paths
    if (filters) {
      if (filters.goalId) {
        filteredPaths = filteredPaths.filter(p => p.goalId === filters.goalId)
      }
      if (filters.status) {
        filteredPaths = filteredPaths.filter(p => p.status === filters.status)
      }
    }
    
    const start = offset || 0
    const end = limit ? start + limit : filteredPaths.length
    
    return {
      paths: filteredPaths.slice(start, end),
      total: filteredPaths.length,
      hasMore: end < filteredPaths.length
    }
  }

  private async getLearningPathTool(params: any): Promise<any> {
    const { pathId } = params
    const path = getLearningPaths().find(p => p.id === pathId)
    
    if (!path) {
      throw new Error(`Learning path with id ${pathId} not found`)
    }
    
    return path
  }

  private async deleteLearningPathTool(params: any): Promise<any> {
    const { pathId } = params
    const paths = getLearningPaths()
    const pathIndex = paths.findIndex(p => p.id === pathId)
    
    if (pathIndex === -1) {
      throw new Error(`Learning path with id ${pathId} not found`)
    }
    
    const deletedPath = paths[pathIndex]
    paths.splice(pathIndex, 1)
    
    // Save updated paths
    try {
      log(`[AgentTools] Path deleted: ${deletedPath.title}`)
      // TODO: Implement proper path deletion in core data
    } catch (error) {
      log(`[AgentTools] Warning: Could not persist path deletion: ${error}`)
    }
    
    return { success: true, deletedPath }
  }

  private async getCourseUnitsTool(params: any): Promise<any> {
    const { filters, limit, offset } = params || {}
    const units = getCourseUnits()
    
    let filteredUnits = units
    if (filters) {
      if (filters.nodeId) {
        filteredUnits = filteredUnits.filter(u => u.nodeId === filters.nodeId)
      }
      if (filters.type) {
        filteredUnits = filteredUnits.filter(u => u.type === filters.type)
      }
    }
    
    const start = offset || 0
    const end = limit ? start + limit : filteredUnits.length
    
    return {
      units: filteredUnits.slice(start, end),
      total: filteredUnits.length,
      hasMore: end < filteredUnits.length
    }
  }

  private async getCourseUnitTool(params: any): Promise<any> {
    const { unitId } = params
    const unit = getCourseUnits().find(u => u.id === unitId)
    
    if (!unit) {
      throw new Error(`Course unit with id ${unitId} not found`)
    }
    
    return unit
  }

  private async deleteCourseUnitTool(params: any): Promise<any> {
    const { unitId } = params
    const units = getCourseUnits()
    const unitIndex = units.findIndex(u => u.id === unitId)
    
    if (unitIndex === -1) {
      throw new Error(`Course unit with id ${unitId} not found`)
    }
    
    const deletedUnit = units[unitIndex]
    units.splice(unitIndex, 1)
    
    // Save updated units
    try {
      log(`[AgentTools] Unit deleted: ${deletedUnit.title}`)
      // TODO: Implement proper unit deletion in core data
    } catch (error) {
      log(`[AgentTools] Warning: Could not persist unit deletion: ${error}`)
    }
    
    return { success: true, deletedUnit }
  }

  // ========== Path Generation Method ==========
  
  private async generatePathNodesTool(params: any): Promise<any> {
    const { goalId, pathId, preferences } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    try {
      // Use AI to generate path nodes based on goal and user preferences
      const { callAI } = await import('../../utils/ai')
      
      const prompt = `作为学习路径规划专家，请为以下学习目标生成详细的学习路径节点：

**学习目标**: ${goal.title}
**目标描述**: ${goal.description}
**目标类别**: ${goal.category}
**目标级别**: ${goal.targetLevel}

**用户偏好**: ${JSON.stringify(preferences || {}, null, 2)}

请生成一个包含5-8个学习节点的结构化学习路径，每个节点应该包含：
- 节点标题和描述
- 预估学习时间
- 前置条件
- 学习资源建议
- 实践项目建议

请以JSON格式返回：
\`\`\`json
{
  "nodes": [
    {
      "id": "node_1",
      "title": "节点标题",
      "description": "详细描述",
      "order": 1,
      "estimatedHours": 20,
      "prerequisites": ["前置技能"],
      "learningObjectives": ["学习目标1", "学习目标2"],
      "resources": [
        {
          "type": "video|article|book|course",
          "title": "资源标题",
          "url": "资源链接（如有）",
          "description": "资源描述"
        }
      ],
      "practiceProjects": [
        {
          "title": "实践项目标题",
          "description": "项目描述",
          "difficulty": "beginner|intermediate|advanced"
        }
      ],
      "assessmentCriteria": ["评估标准1", "评估标准2"]
    }
  ],
  "totalEstimatedHours": 120,
  "difficulty": "beginner|intermediate|advanced",
  "prerequisites": ["整体前置条件"],
  "learningStyle": "理论型|实践型|混合型"
}
\`\`\``

      const aiResponse = await callAI(prompt)
      const pathData = this.parseAIPathResponse(aiResponse)
      
      return {
        success: true,
        pathId,
        goalId,
        ...pathData
      }
      
    } catch (error) {
      log('[AgentTools] AI path generation failed, using fallback:', error)
      
      // Fallback to basic path generation
      return this.generateBasicPathNodes(goal, preferences)
    }
  }

  private parseAIPathResponse(response: string): any {
    try {
      // Clean up the response to extract JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response
      
      return JSON.parse(jsonStr)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to parse AI path response: ${errorMessage}`)
    }
  }

  private generateBasicPathNodes(goal: any, preferences: any): any {
    const basicNodes = [
      {
        id: `node_${Date.now()}_1`,
        title: `${goal.title} - 基础准备`,
        description: '学习基础概念和准备工作',
        order: 1,
        estimatedHours: 15,
        prerequisites: [],
        learningObjectives: ['理解基本概念', '准备学习环境'],
        resources: [],
        practiceProjects: [],
        assessmentCriteria: ['概念理解测试']
      },
      {
        id: `node_${Date.now()}_2`,
        title: `${goal.title} - 核心学习`,
        description: '深入学习核心知识和技能',
        order: 2,
        estimatedHours: 40,
        prerequisites: ['基础准备'],
        learningObjectives: ['掌握核心技能', '理解关键概念'],
        resources: [],
        practiceProjects: [],
        assessmentCriteria: ['技能实践测试']
      },
      {
        id: `node_${Date.now()}_3`,
        title: `${goal.title} - 实践应用`,
        description: '通过实际项目应用所学知识',
        order: 3,
        estimatedHours: 30,
        prerequisites: ['核心学习'],
        learningObjectives: ['实际应用技能', '完成项目'],
        resources: [],
        practiceProjects: [],
        assessmentCriteria: ['项目完成度评估']
      }
    ]
    
    return {
      nodes: basicNodes,
      totalEstimatedHours: 85,
      difficulty: goal.targetLevel || 'intermediate',
      prerequisites: [],
      learningStyle: '混合型'
    }
  }

  // ========== Learning Management Methods ==========
  
  private async adjustLearningPaceTool(params: any): Promise<any> {
    const { goalId, adjustment, reason } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    // Adjust the learning pace based on the adjustment factor
    const currentPace = goal.estimatedTimeWeeks || 12
    const newPace = Math.max(1, Math.round(currentPace * (adjustment || 1)))
    
    const updatedGoal = {
      ...goal,
      estimatedTimeWeeks: newPace,
      updatedAt: new Date().toISOString()
    }
    
    // Save updated goal
    const goals = getLearningGoals()
    const goalIndex = goals.findIndex(g => g.id === goalId)
    if (goalIndex !== -1) {
      goals[goalIndex] = updatedGoal
      // TODO: Implement proper goal saving
      log(`[AgentTools] Goal pace adjusted: ${goalId}`)
    }
    
    return {
      success: true,
      goalId,
      oldPace: currentPace,
      newPace,
      adjustment,
      reason
    }
  }

  private async suggestNextActionTool(params: any): Promise<any> {
    // 添加调试日志以跟踪参数
    log('[AgentTools] suggestNextActionTool called with params:', params)
    
    const { goalId, context } = params
    
    // 如果没有提供goalId，提供通用建议
    if (!goalId) {
      log('[AgentTools] No goalId provided, generating general suggestions')
      const goals = getLearningGoals()
      const activeGoals = goals.filter(g => g.status === 'active')
      const ability = getAbilityProfile()
      
      const suggestions: Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        estimatedTime: string;
      }> = []
      
      if (!ability) {
        suggestions.push({
          type: 'ability_assessment',
          priority: 'high',
          title: '完成能力评估',
          description: '进行能力评估以获得个性化建议',
          estimatedTime: '15分钟'
        })
      }
      
      if (goals.length === 0) {
        suggestions.push({
          type: 'create_goal',
          priority: 'high',
          title: '创建学习目标',
          description: '设定明确的学习目标来开始学习之旅',
          estimatedTime: '10分钟'
        })
      } else if (activeGoals.length === 0) {
        suggestions.push({
          type: 'activate_goal',
          priority: 'medium',
          title: '激活学习目标',
          description: '选择一个目标并开始执行',
          estimatedTime: '5分钟'
        })
      } else {
        // 有活跃目标时，建议基于第一个活跃目标
        const firstActiveGoal = activeGoals[0]
        const paths = getLearningPaths().filter(p => p.goalId === firstActiveGoal.id)
        
        if (paths.length === 0) {
          suggestions.push({
            type: 'create_path',
            priority: 'high',
            title: '创建学习路径',
            description: `为目标"${firstActiveGoal.title}"创建详细的学习路径`,
            estimatedTime: '30分钟'
          })
        } else {
          suggestions.push({
            type: 'continue_learning',
            priority: 'medium',
            title: '继续学习',
            description: `继续执行目标"${firstActiveGoal.title}"的学习路径`,
            estimatedTime: '1小时'
          })
        }
      }
      
      log('[AgentTools] Generated general suggestions:', suggestions.length)
      return {
        goalId: null,
        suggestions,
        context: context || {},
        timestamp: new Date().toISOString()
      }
    }
    
    // 验证goalId是否有效
    log('[AgentTools] Looking for goal with ID:', goalId)
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      log('[AgentTools] Goal not found with ID:', goalId)
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    log('[AgentTools] Found goal:', goal.title)
    const ability = getAbilityProfile()
    const paths = getLearningPaths().filter(p => p.goalId === goalId)
    
    // Generate suggestions based on current progress and context
    const suggestions: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      estimatedTime: string;
    }> = []
    
    if (paths.length === 0) {
      suggestions.push({
        type: 'create_path',
        priority: 'high',
        title: '创建学习路径',
        description: '为这个目标创建详细的学习路径',
        estimatedTime: '30分钟'
      })
    }
    
    if (goal.status === 'paused' || goal.status === 'cancelled') {
      suggestions.push({
        type: 'activate_goal',
        priority: 'medium',
        title: '激活学习目标',
        description: '开始执行这个学习目标',
        estimatedTime: '5分钟'
      })
    }
    
    if (!ability) {
      suggestions.push({
        type: 'ability_assessment',
        priority: 'high',
        title: '完成能力评估',
        description: '进行能力评估以获得个性化建议',
        estimatedTime: '15分钟'
      })
    }
    
    log('[AgentTools] Generated goal-specific suggestions:', suggestions.length)
    return {
      goalId,
      suggestions,
      context: context || {},
      timestamp: new Date().toISOString()
    }
  }

  private async handleLearningDifficultyTool(params: any): Promise<any> {
    const { goalId, difficulty, description } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    const recommendations: string[] = []
    
    switch (difficulty) {
      case 'too_fast':
        recommendations.push('减慢学习节奏，增加复习时间')
        recommendations.push('将大的学习块分解为更小的部分')
        break
      case 'too_slow':
        recommendations.push('增加学习时间投入')
        recommendations.push('寻找更高效的学习方法')
        break
      case 'too_hard':
        recommendations.push('回顾前置知识，确保基础扎实')
        recommendations.push('寻找更简单的入门资源')
        break
      case 'too_easy':
        recommendations.push('跳过基础部分，直接学习高级内容')
        recommendations.push('增加实践项目的复杂度')
        break
      default:
        recommendations.push('继续当前的学习方式')
    }
    
    return {
      goalId,
      difficulty,
      description,
      recommendations,
      timestamp: new Date().toISOString()
    }
  }

  private async generatePersonalizedContentTool(params: any): Promise<any> {
    const { goalId, contentType, preferences } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    const ability = getAbilityProfile()
    
    try {
      const { callAI } = await import('../../utils/ai')
      
      const prompt = `作为个性化学习内容生成专家，请为以下学习目标生成${contentType}类型的个性化内容：

**学习目标**: ${goal.title}
**目标描述**: ${goal.description}
**用户能力水平**: ${ability ? JSON.stringify(ability, null, 2) : '未知'}
**内容类型**: ${contentType}
**用户偏好**: ${JSON.stringify(preferences || {}, null, 2)}

请生成适合用户当前水平和偏好的学习内容。`

      const aiResponse = await callAI(prompt)
      
      return {
        goalId,
        contentType,
        content: aiResponse,
        personalized: true,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        goalId,
        contentType,
        content: `为目标"${goal.title}"生成的基础${contentType}内容`,
        personalized: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async trackLearningProgressTool(params: any): Promise<any> {
    const { goalId, progress, metrics } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    // Update goal progress - note: progress is not a direct property of LearningGoal
    // We'll store it in a custom way or extend the goal object
    const updatedGoal = { 
      ...goal, 
      updatedAt: new Date().toISOString(),
      // Store progress in a custom property since it's not in the type
      customProgress: progress,
      customMetrics: metrics
    }
    
    // Save updated goal
    const goals = getLearningGoals()
    const goalIndex = goals.findIndex(g => g.id === goalId)
    if (goalIndex !== -1) {
      goals[goalIndex] = updatedGoal as any
      // TODO: Implement proper goal saving
      log(`[AgentTools] Goal progress updated: ${goalId}`)
    }
    
    return {
      goalId,
      progress,
      metrics,
      timestamp: new Date().toISOString()
    }
  }

  private async recommendStudyScheduleTool(params: any): Promise<any> {
    const { goalId, availableHours, preferences } = params
    const goal = getLearningGoals().find(g => g.id === goalId)
    
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`)
    }
    
    // Use estimatedTimeWeeks instead of estimatedHours and estimatedWeeks
    const totalHours = goal.estimatedTimeWeeks * 10 || 100 // Rough estimate: 10 hours per week
    const weeks = goal.estimatedTimeWeeks || 12
    const hoursPerWeek = Math.ceil(totalHours / weeks)
    const userHours = availableHours || hoursPerWeek
    
    const schedule = {
      goalId,
      totalHours,
      estimatedWeeks: Math.ceil(totalHours / userHours),
      hoursPerWeek: userHours,
      dailySchedule: this.generateDailySchedule(userHours, preferences),
      milestones: this.generateMilestones(goal, Math.ceil(totalHours / userHours)),
      recommendations: [
        '保持规律的学习时间',
        '设置学习提醒',
        '定期回顾进度'
      ]
    }
    
    return schedule
  }

  private generateDailySchedule(hoursPerWeek: number, preferences: any): any[] {
    const daysPerWeek = preferences?.studyDays || 5
    const hoursPerDay = Math.ceil(hoursPerWeek / daysPerWeek)
    
    const schedule: any[] = []
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for (let i = 0; i < daysPerWeek; i++) {
      schedule.push({
        day: days[i],
        hours: hoursPerDay,
        timeSlot: preferences?.preferredTime || 'evening',
        activities: ['学习新内容', '复习练习', '项目实践']
      })
    }
    
    return schedule
  }

  private generateMilestones(goal: any, weeks: number): any[] {
    const milestones: any[] = []
    const milestoneCount = Math.min(4, Math.max(2, Math.floor(weeks / 3)))
    
    for (let i = 1; i <= milestoneCount; i++) {
      milestones.push({
        week: Math.floor((weeks / milestoneCount) * i),
        title: `${goal.title} - 里程碑 ${i}`,
        description: `完成第${i}阶段的学习目标`,
        progress: Math.floor((100 / milestoneCount) * i)
      })
    }
    
    return milestones
  }
}

// 导出单例实例
export const agentToolExecutor = new AgentToolExecutor() 