import { 
  getLearningGoals,
  getAbilityProfile,
  createLearningPath,
  addCoreEvent,
  agentToolExecutor
} from '../coreData'
import { getCurrentAssessment } from '../abilityAssess/service'
import { getAIResponse } from '../../components/AIAssistant/service'
import { log } from '../../utils/logger'
import { 
  SkillGapAnalysis, 
  SkillGap, 
  PathGenerationConfig, 
  NodeTemplate,
  LearningContext 
} from './types'

export class PathPlanService {

  /**
   * 获取用户完整学习上下文
   */
  private getLearningContext(goalId?: string): LearningContext {
    const ability = getAbilityProfile()
    const assessment = getCurrentAssessment()
    const goals = getLearningGoals()
    const currentGoal = goalId ? goals.find(g => g.id === goalId) : null

    // 构建能力画像
    const abilityProfile = assessment ? {
      overallScore: assessment.overallScore,
      overallLevel: this.getScoreLevel(assessment.overallScore),
      strengths: assessment.report.strengths,
      weaknesses: assessment.report.improvements,
      dimensions: Object.entries(assessment.dimensions).map(([name, dim]) => ({
        name,
        score: dim.score,
        weight: dim.weight,
        skills: Object.entries(dim.skills).map(([skillName, skillData]) => ({
          name: skillName,
          score: typeof skillData === 'number' ? skillData : skillData.score,
          confidence: typeof skillData === 'object' ? skillData.confidence : 1.0,
          isInferred: typeof skillData === 'object' ? skillData.isInferred : false
        }))
      })),
      assessmentDate: assessment.metadata.assessmentDate,
      confidence: assessment.metadata.confidence
    } : null

    // 获取学习历史和偏好
    const learningHistory = {
      activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      preferredCategories: this.getPreferredCategories(goals),
      averageTimeInvestment: this.calculateAverageTimeInvestment(goals)
    }

    return {
      abilityProfile,
      currentGoal: goalId ? goals.find(g => g.id === goalId) || null : null,
      learningHistory,
      hasAbilityData: !!(ability || assessment),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 分析技能差距（增强版）
   */
  async analyzeSkillGap(goalId: string): Promise<SkillGapAnalysis> {
    try {
      const context = this.getLearningContext(goalId)
      
      if (!context.hasAbilityData) {
        throw new Error('需要先完成能力评估以获得个性化的技能差距分析')
      }

      // 使用Agent工具执行技能差距分析
      const result = await agentToolExecutor.executeTool('calculate_skill_gap', { 
        goalId,
        context // 传递完整上下文
      })
      
      if (!result.hasAbilityData) {
        throw new Error('需要先完成能力评估')
      }

      // 基于真实能力数据进行更精确的分析
      const enhancedGaps = this.enhanceSkillGapAnalysis(result.skillGaps, context)

      const analysis: SkillGapAnalysis = {
        currentLevel: this.calculateOverallCurrentLevel(context.abilityProfile),
        targetLevel: this.getTargetLevelFromGoal(context.currentGoal),
        gaps: enhancedGaps,
        recommendations: this.generateContextualRecommendations(enhancedGaps, context),
        estimatedTimeWeeks: this.calculateEnhancedEstimatedTime(enhancedGaps, context),
        confidence: context.abilityProfile?.confidence || 0.8,
        personalizationLevel: 'high' // 标记为高度个性化
      }

      // 记录增强的分析事件
      addCoreEvent({
        type: 'enhanced_skill_gap_analyzed',
        details: {
          goalId,
          gapCount: analysis.gaps.length,
          confidence: analysis.confidence,
          personalizationLevel: analysis.personalizationLevel,
          abilityDataAvailable: context.hasAbilityData,
          estimatedWeeks: analysis.estimatedTimeWeeks
        }
      })

      log('[PathPlan] Enhanced skill gap analysis completed for goal:', goalId)
      return analysis

    } catch (error) {
      log('[PathPlan] Failed to analyze skill gap:', error)
      throw error
    }
  }

  /**
   * 生成学习路径（增强版）
   */
  async generateLearningPath(
    goalId: string, 
    config: PathGenerationConfig
  ): Promise<any> {
    try {
      const context = this.getLearningContext(goalId)
      
      if (!context.currentGoal) {
        throw new Error('Goal not found')
      }

      // 执行增强的技能差距分析
      const skillGapAnalysis = await this.analyzeSkillGap(goalId)

      // 构建增强的路径生成提示词
      const prompt = this.buildEnhancedPathGenerationPrompt(
        context, 
        skillGapAnalysis, 
        config
      )
      
      // 调用AI生成路径结构
      const aiResponse = await getAIResponse(prompt)
      const pathStructure = this.parsePathStructure(aiResponse)

      // 应用个性化调整
      const personalizedStructure = this.applyPersonalizationToPath(
        pathStructure, 
        context, 
        skillGapAnalysis
      )

      // 使用Agent工具创建路径
      const path = await agentToolExecutor.executeTool('create_learning_path', {
        goalId,
        title: personalizedStructure.title || `${context.currentGoal.title} - 个性化学习路径`,
        description: personalizedStructure.description || this.generatePersonalizedDescription(context, skillGapAnalysis),
        nodes: personalizedStructure.nodes || [],
        dependencies: personalizedStructure.dependencies || [],
        milestones: personalizedStructure.milestones || [],
        metadata: {
          generatedWithContext: true,
          abilityScore: context.abilityProfile?.overallScore,
          confidence: skillGapAnalysis.confidence,
          personalizationLevel: skillGapAnalysis.personalizationLevel
        }
      })

      // 记录增强的路径生成事件
      addCoreEvent({
        type: 'enhanced_learning_path_generated',
        details: {
          goalId,
          pathId: path.id,
          nodeCount: path.nodes.length,
          estimatedHours: path.totalEstimatedHours,
          config,
          abilityScore: context.abilityProfile?.overallScore,
          personalizationLevel: skillGapAnalysis.personalizationLevel,
          contextUsed: {
            hasAbilityData: context.hasAbilityData,
            hasLearningHistory: context.learningHistory.activeGoals > 0
          }
        }
      })

      log('[PathPlan] Enhanced learning path generated:', path.title)
      return path

    } catch (error) {
      log('[PathPlan] Failed to generate enhanced learning path:', error)
      throw error
    }
  }

  /**
   * 优化现有路径
   */
  async optimizePath(pathId: string, feedback: string): Promise<any> {
    try {
      const prompt = `根据用户反馈优化学习路径：

用户反馈：${feedback}

请提供优化建议，包括：
1. 节点调整建议
2. 难度调整建议  
3. 时间安排优化
4. 内容补充建议

以JSON格式返回优化方案。`

      const response = await getAIResponse(prompt)
      const optimizations = this.parseOptimizations(response)

      // 记录优化事件
      addCoreEvent({
        type: 'path_optimization_requested',
        details: {
          pathId,
          feedback,
          optimizations
        }
      })

      return optimizations

    } catch (error) {
      log('[PathPlan] Failed to optimize path:', error)
      throw error
    }
  }

  /**
   * 获取路径进度统计
   */
  getPathProgress(pathId: string): any {
    // 这里应该从coreData获取路径进度
    // 简化实现，返回模拟数据
    return {
      totalNodes: 10,
      completedNodes: 3,
      currentNode: 4,
      progressPercentage: 30,
      estimatedTimeRemaining: 15, // 小时
      recentActivity: new Date()
    }
  }

  // ========== 私有方法 ==========

  /**
   * 获取分数对应的等级
   */
  private getScoreLevel(score: number): string {
    if (score >= 90) return '专家'
    if (score >= 75) return '高级'
    if (score >= 60) return '中级'
    if (score >= 40) return '初级'
    return '新手'
  }

  /**
   * 获取用户偏好的学习类别
   */
  private getPreferredCategories(goals: any[]): string[] {
    const categoryCount: Record<string, number> = {}
    goals.forEach(goal => {
      categoryCount[goal.category] = (categoryCount[goal.category] || 0) + 1
    })
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)
  }

  /**
   * 计算平均时间投入
   */
  private calculateAverageTimeInvestment(goals: any[]): number {
    if (goals.length === 0) return 10 // 默认每周10小时
    const totalWeeks = goals.reduce((sum, goal) => sum + (goal.estimatedTimeWeeks || 0), 0)
    return Math.round(totalWeeks / goals.length)
  }

  /**
   * 增强技能差距分析
   */
  private enhanceSkillGapAnalysis(rawGaps: any[], context: LearningContext): SkillGap[] {
    return rawGaps.map((gap, index) => ({
      skill: gap.skill,
      currentLevel: gap.currentLevel,
      targetLevel: gap.targetLevel,
      gap: gap.gap,
      priority: this.calculateEnhancedPriority(gap, context),
      learningOrder: this.calculateOptimalLearningOrder(gap, context, index)
    }))
  }

  /**
   * 计算用户当前整体水平
   */
  private calculateOverallCurrentLevel(abilityProfile: any): number {
    if (!abilityProfile) return 3 // 默认中等水平
    return Math.round(abilityProfile.overallScore / 10) // 转换为1-10级别
  }

  /**
   * 从目标获取目标水平
   */
  private getTargetLevelFromGoal(goal: any): number {
    if (!goal) return 7 // 默认目标水平
    const levelMap = {
      'beginner': 5,
      'intermediate': 7,
      'advanced': 8,
      'expert': 10
    }
    return levelMap[goal.targetLevel as keyof typeof levelMap] || 7
  }

  /**
   * 生成基于上下文的建议
   */
  private generateContextualRecommendations(gaps: SkillGap[], context: LearningContext): string[] {
    const recommendations: string[] = []
    
    // 基于能力评估的建议
    if (context.abilityProfile) {
      if (context.abilityProfile.overallScore < 40) {
        recommendations.push('建议从基础概念开始，确保扎实的知识基础')
      } else if (context.abilityProfile.overallScore >= 75) {
        recommendations.push('可以跳过基础内容，重点关注高级技能和实践项目')
      }
      
      // 基于薄弱点的建议
      context.abilityProfile.weaknesses.forEach(weakness => {
        recommendations.push(`重点关注${weakness}，这是您当前的薄弱环节`)
      })
    }
    
    // 基于学习历史的建议
    if (context.learningHistory.completedGoals > 0) {
      recommendations.push('基于您之前的学习经验，建议采用项目驱动的学习方式')
    } else {
      recommendations.push('建议循序渐进，先掌握理论基础再进行实践')
    }
    
    // 基于技能差距的建议
    const highPriorityGaps = gaps.filter(gap => gap.priority === 'high')
    if (highPriorityGaps.length > 0) {
      recommendations.push(`优先补强${highPriorityGaps[0].skill}等核心技能`)
    }
    
    return recommendations
  }

  /**
   * 计算增强的预估时间
   */
  private calculateEnhancedEstimatedTime(gaps: SkillGap[], context: LearningContext): number {
    let baseTime = gaps.reduce((sum, gap) => sum + gap.gap * 1.5, 0) // 基础时间计算
    
    // 根据用户能力调整
    if (context.abilityProfile) {
      const multiplier = context.abilityProfile.overallScore >= 70 ? 0.8 : 
                       context.abilityProfile.overallScore >= 40 ? 1.0 : 1.3
      baseTime *= multiplier
    }
    
    // 根据学习历史调整
    if (context.learningHistory.completedGoals > 0) {
      baseTime *= 0.9 // 有经验的学习者学得更快
    }
    
    return Math.ceil(baseTime)
  }

  /**
   * 计算增强的优先级
   */
  private calculateEnhancedPriority(gap: any, context: LearningContext): 'low' | 'medium' | 'high' {
    let score = gap.gap // 基础得分

    // 如果是薄弱技能，提高优先级
    if (context.abilityProfile?.weaknesses.some(w => w.includes(gap.skill))) {
      score += 2
    }

    // 如果与目标相关性高，提高优先级
    if (context.currentGoal?.requiredSkills.includes(gap.skill)) {
      score += 1
    }

    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }

  /**
   * 计算最优学习顺序
   */
  private calculateOptimalLearningOrder(gap: any, context: LearningContext, defaultOrder: number): number {
    let order = defaultOrder

    // 基础技能优先
    if (gap.skill.includes('基础') || gap.skill.includes('语法')) {
      order -= 10
    }

    // 薄弱技能稍微提前
    if (context.abilityProfile?.weaknesses.some(w => w.includes(gap.skill))) {
      order -= 2
    }

    return Math.max(0, order)
  }

  /**
   * 构建增强的路径生成提示词
   */
  private buildEnhancedPathGenerationPrompt(
    context: LearningContext,
    skillGap: SkillGapAnalysis,
    config: PathGenerationConfig
  ): string {
    const goal = context.currentGoal!
    const ability = context.abilityProfile

    let contextInfo = `学习目标：${goal.title}
目标描述：${goal.description}
目标类别：${goal.category}
目标级别：${goal.targetLevel}`

    if (ability) {
      contextInfo += `

能力画像：
- 总体水平：${ability.overallScore}分 (${ability.overallLevel})
- 评估置信度：${(ability.confidence * 100).toFixed(0)}%
- 优势领域：${ability.strengths.join('、')}
- 待改进：${ability.weaknesses.join('、')}
- 各维度评分：${ability.dimensions.map(d => `${d.name}(${d.score}分)`).join('、')}`
    }

    contextInfo += `

技能差距分析：
- 当前水平：${skillGap.currentLevel}/10
- 目标水平：${skillGap.targetLevel}/10
- 主要技能差距：${skillGap.gaps.slice(0, 5).map(g => `${g.skill}(差距:${g.gap},优先级:${g.priority})`).join('、')}
- 分析置信度：${((skillGap.confidence || 0.8) * 100).toFixed(0)}%

学习历史：
- 已完成目标：${context.learningHistory.completedGoals}个
- 活跃目标：${context.learningHistory.activeGoals}个
- 偏好类别：${context.learningHistory.preferredCategories.join('、')}
- 平均时间投入：每周${context.learningHistory.averageTimeInvestment}小时

学习配置：
- 学习风格：${config.learningStyle}
- 时间偏好：${config.timePreference}  
- 难度递进：${config.difficultyProgression}
- 包含项目：${config.includeProjects ? '是' : '否'}
- 包含里程碑：${config.includeMilestones ? '是' : '否'}`

    return `作为AI学习路径规划师，请基于以下用户画像生成高度个性化的学习路径：

${contextInfo}

个性化建议：
${skillGap.recommendations.map(r => `- ${r}`).join('\n')}

请生成包含以下内容的个性化学习路径（JSON格式）：
{
  "title": "基于能力评估的个性化路径标题",
  "description": "考虑用户当前水平和薄弱点的路径描述",
  "nodes": [
    {
      "id": "节点ID",
      "title": "节点标题",
      "description": "基于用户水平调整的节点描述",
      "type": "concept|practice|project|assessment|milestone",
      "estimatedHours": 基于用户能力调整的学时,
      "difficulty": 1-5(考虑用户当前水平),
      "prerequisites": ["前置节点ID"],
      "skills": ["目标技能"],
      "resources": [
        {
          "type": "article|video|exercise|project|quiz",
          "title": "资源标题",
          "content": "针对用户薄弱点的资源描述"
        }
      ],
      "status": "not_started",
      "progress": 0,
      "personalizedHints": ["基于用户能力的学习提示"]
    }
  ],
  "dependencies": [{"from": "节点ID", "to": "节点ID"}],
  "milestones": [
    {
      "id": "里程碑ID", 
      "title": "里程碑标题",
      "nodeIds": ["包含的节点ID"],
      "reward": "个性化奖励描述"
    }
  ]
}

生成要求：
1. 路径必须完全基于用户的实际能力水平设计
2. 优先补强用户的薄弱技能（${ability?.weaknesses.join('、') || '待确定'}）
3. 发挥用户的优势技能（${ability?.strengths.join('、') || '待确定'}）
4. 节点难度要与用户当前水平${ability?.overallLevel || '中等'}匹配
5. 估算时间要考虑用户的学习经验
6. 包含个性化的学习提示和建议
7. 设置符合用户节奏的检查点`
  }

  /**
   * 为路径应用个性化调整
   */
  private applyPersonalizationToPath(
    pathStructure: any,
    context: LearningContext,
    skillGap: SkillGapAnalysis
  ): any {
    if (!pathStructure.nodes) return pathStructure

    // 调整节点顺序，优先处理薄弱技能
    const adjustedNodes = pathStructure.nodes.map((node: any) => {
      // 基于用户能力调整难度
      if (context.abilityProfile) {
        if (context.abilityProfile.overallScore < 40) {
          node.difficulty = Math.max(1, node.difficulty - 1) // 降低难度
          node.estimatedHours = Math.ceil(node.estimatedHours * 1.2) // 增加时间
        } else if (context.abilityProfile.overallScore >= 75) {
          node.difficulty = Math.min(5, node.difficulty + 1) // 提高难度
          node.estimatedHours = Math.ceil(node.estimatedHours * 0.8) // 减少时间
        }
      }

      // 添加个性化提示
      if (!node.personalizedHints) {
        node.personalizedHints = this.generatePersonalizedHints(node, context)
      }

      return node
    })

    return {
      ...pathStructure,
      nodes: adjustedNodes,
      description: this.generatePersonalizedDescription(context, skillGap)
    }
  }

  /**
   * 生成个性化描述
   */
  private generatePersonalizedDescription(context: LearningContext, skillGap: SkillGapAnalysis): string {
    const goal = context.currentGoal!
    const ability = context.abilityProfile

    let description = `为您量身定制的${goal.title}学习路径。`

    if (ability) {
      description += `根据您的能力评估（${ability.overallScore}分），我们设计了适合${ability.overallLevel}水平的学习计划。`
      
      if (ability.strengths.length > 0) {
        description += `充分发挥您在${ability.strengths[0]}等方面的优势，`
      }
      
      if (ability.weaknesses.length > 0) {
        description += `重点补强${ability.weaknesses[0]}等薄弱环节。`
      }
    }

    description += `预计${skillGap.estimatedTimeWeeks}周完成，包含${skillGap.gaps.length}个关键技能点的针对性训练。`

    return description
  }

  /**
   * 生成个性化学习提示
   */
  private generatePersonalizedHints(node: any, context: LearningContext): string[] {
    const hints: string[] = []
    const ability = context.abilityProfile

    if (ability) {
      // 基于用户水平的提示
      if (ability.overallScore < 40) {
        hints.push('建议多做练习，不要急于求成')
        hints.push('如遇困难可回顾前面的基础内容')
      } else if (ability.overallScore >= 75) {
        hints.push('可以尝试更有挑战性的扩展练习')
        hints.push('思考如何将这个概念应用到实际项目中')
      }

      // 基于薄弱点的提示
      ability.weaknesses.forEach(weakness => {
        if (node.skills && node.skills.some((skill: string) => skill.includes(weakness))) {
          hints.push(`这是您的薄弱环节(${weakness})，建议多花时间理解`)
        }
      })
    }

    // 基于学习历史的提示
    if (context.learningHistory.completedGoals > 0) {
      hints.push('基于您的学习经验，建议结合实际项目练习')
    }

    return hints.slice(0, 3) // 最多3个提示
  }

  private parsePathStructure(response: string): any {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 如果无法解析，返回基础结构
      return {
        title: '基础学习路径',
        description: '根据AI生成的个性化学习路径',
        nodes: [],
        dependencies: [],
        milestones: []
      }
    } catch (error) {
      log('[PathPlan] Failed to parse path structure:', error)
      return {
        title: '基础学习路径',
        description: '根据AI生成的个性化学习路径',
        nodes: [],
        dependencies: [],
        milestones: []
      }
    }
  }

  private parseOptimizations(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { suggestions: [] }
    } catch (error) {
      log('[PathPlan] Failed to parse optimizations:', error)
      return { suggestions: [] }
    }
  }

  // ========== 保持向后兼容的原有方法 ==========

  /**
   * 传统方式生成建议（保持向后兼容）
   */
  private generateRecommendations(skillGaps: any[]): string[] {
    const recommendations: string[] = []
    
    const highPriorityGaps = skillGaps.filter(gap => gap.priority === 'high')
    if (highPriorityGaps.length > 0) {
      recommendations.push('优先学习基础技能，建立扎实的知识基础')
    }

    const practicalSkills = skillGaps.filter(gap => 
      gap.skill.includes('实践') || gap.skill.includes('项目')
    )
    if (practicalSkills.length > 0) {
      recommendations.push('结合实际项目练习，提高动手能力')
    }

    recommendations.push('建议循序渐进，避免跳跃式学习')
    
    return recommendations
  }

  /**
   * 传统方式计算预估时间（保持向后兼容）
   */
  private calculateEstimatedTime(skillGaps: any[]): number {
    // 根据技能差距计算预估学习时间
    const totalGap = skillGaps.reduce((sum, gap) => sum + gap.gap, 0)
    const averageGap = totalGap / skillGaps.length
    
    // 基础时间计算：每个技能点差距需要1.5周
    return Math.ceil(averageGap * skillGaps.length * 1.5)
  }

  /**
   * 传统方式构建提示词（保持向后兼容）
   */
  private buildPathGenerationPrompt(
    goal: any, 
    skillGap: SkillGapAnalysis, 
    config: PathGenerationConfig,
    ability: any
  ): string {
    return `作为学习路径规划专家，请为用户生成个性化学习路径：

学习目标：${goal.title}
目标描述：${goal.description}
目标类别：${goal.category}
目标级别：${goal.targetLevel}

技能差距分析：
- 当前水平：${skillGap.currentLevel}/10
- 目标水平：${skillGap.targetLevel}/10
- 主要技能差距：${skillGap.gaps.slice(0, 5).map(g => `${g.skill}(差距:${g.gap})`).join('、')}

学习配置：
- 学习风格：${config.learningStyle}
- 时间偏好：${config.timePreference}  
- 难度递进：${config.difficultyProgression}
- 包含项目：${config.includeProjects ? '是' : '否'}
- 包含里程碑：${config.includeMilestones ? '是' : '否'}

请生成包含以下内容的学习路径（JSON格式）：
{
  "title": "路径标题",
  "description": "路径描述",
  "nodes": [
    {
      "id": "节点ID",
      "title": "节点标题",
      "description": "节点描述",
      "type": "concept|practice|project|assessment|milestone",
      "estimatedHours": 估计学时,
      "difficulty": 1-5,
      "prerequisites": ["前置节点ID"],
      "skills": ["涉及技能"],
      "resources": [
        {
          "type": "article|video|exercise|project|quiz",
          "title": "资源标题",
          "content": "资源描述"
        }
      ],
      "status": "not_started",
      "progress": 0
    }
  ],
  "dependencies": [{"from": "节点ID", "to": "节点ID"}],
  "milestones": [
    {
      "id": "里程碑ID", 
      "title": "里程碑标题",
      "nodeIds": ["包含的节点ID"],
      "reward": "奖励描述"
    }
  ]
}

要求：
1. 节点数量控制在8-15个
2. 难度递进合理
3. 理论与实践结合
4. 包含阶段性项目
5. 设置合适的里程碑`
  }
} 