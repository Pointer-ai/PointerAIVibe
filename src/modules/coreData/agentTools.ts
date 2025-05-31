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
    description: '创建新的学习目标，用于定义用户的学习方向和期望成果',
    parameters: {
      title: { type: 'string', description: '目标标题' },
      description: { type: 'string', description: '目标详细描述' },
      category: { 
        type: 'string', 
        enum: ['frontend', 'backend', 'fullstack', 'automation', 'ai', 'mobile', 'game', 'data', 'custom'],
        description: '目标类别' 
      },
      priority: { type: 'number', min: 1, max: 5, description: '优先级(1-5)' },
      targetLevel: { 
        type: 'string', 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        description: '目标级别' 
      },
      estimatedTimeWeeks: { type: 'number', description: '预计完成时间（周）' },
      requiredSkills: { type: 'array', items: { type: 'string' }, description: '需要的技能列表' },
      outcomes: { type: 'array', items: { type: 'string' }, description: '预期学习成果' }
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
    const goal = createLearningGoal({
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority || 3,
      targetLevel: params.targetLevel,
      estimatedTimeWeeks: params.estimatedTimeWeeks,
      requiredSkills: params.requiredSkills || [],
      outcomes: params.outcomes || [],
      status: 'active'
    })
    return goal
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
    const units = getCourseUnits()
    const unit = units.find(u => u.id === params.unitId)
    
    if (!unit) {
      return null
    }
    
    // 获取关联信息
    const paths = getLearningPaths()
    const relatedPath = paths.find(p => 
      p.nodes.some(node => node.id === unit.nodeId)
    )
    
    let nodeInfo = null
    if (relatedPath) {
      const node = relatedPath.nodes.find(n => n.id === unit.nodeId)
      nodeInfo = node ? {
        title: node.title,
        status: node.status,
        estimatedHours: node.estimatedHours
      } : null
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
}

// 导出单例实例
export const agentToolExecutor = new AgentToolExecutor() 