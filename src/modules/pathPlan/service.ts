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
      
      log('[PathPlan] AI-driven skill gap analysis result:', {
        hasAbilityData: result.hasAbilityData,
        skillGapsCount: result.skillGaps?.length || 0,
        analysisConfidence: result.analysisConfidence,
        fallbackUsed: result.fallbackUsed
      })
      
      if (!result.hasAbilityData) {
        throw new Error('需要先完成能力评估')
      }

      // 基于真实能力数据进行更精确的分析
      const enhancedGaps = this.enhanceSkillGapAnalysis(result.skillGaps || [], context)

      const analysis: SkillGapAnalysis = {
        hasAbilityData: context.hasAbilityData,
        currentLevel: this.calculateOverallCurrentLevel(context.abilityProfile),
        targetLevel: this.getTargetLevelFromGoal(context.currentGoal),
        skillGaps: enhancedGaps,
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
          gapCount: analysis.skillGaps?.length || 0,
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

    // 构建更详细的5维度能力分析
    if (ability) {
      const dimensionAnalysis = this.buildDimensionAnalysis(ability)
      const skillGapsByDimension = this.categorizeSkillGapsByDimension(skillGap.skillGaps || skillGap.gaps || [])
      const priorityStrategy = this.generatePriorityStrategy(ability, skillGapsByDimension)

      contextInfo += `

## 🧠 5维能力深度画像
**总体水平**: ${ability.overallScore}分 (${ability.overallLevel})
**评估置信度**: ${(ability.confidence * 100).toFixed(0)}%
**整体优势**: ${ability.strengths.join('、')}
**待改进**: ${ability.weaknesses.join('、')}

### 各维度详细分析:
${dimensionAnalysis}

### 📊 技能差距分布分析:
${skillGapsByDimension}

### 🎯 个性化学习策略:
${priorityStrategy}

## 📈 个性化参数调整
**学习效率预估**: ${this.calculateLearningEfficiency(ability)}
**建议学习强度**: ${this.recommendLearningIntensity(ability, context.learningHistory)}
**最佳学习路径**: ${this.recommendOptimalPath(ability, skillGap)}
**时间分配建议**: ${this.generateTimeAllocation(ability, skillGapsByDimension)}`
    }

    contextInfo += `

## 📚 学习历史与偏好
- 已完成目标：${context.learningHistory.completedGoals}个
- 活跃目标：${context.learningHistory.activeGoals}个
- 偏好类别：${context.learningHistory.preferredCategories.join('、')}
- 平均时间投入：每周${context.learningHistory.averageTimeInvestment}小时

## ⚙️ 学习配置
- 学习风格：${config.learningStyle}
- 时间偏好：${config.timePreference}  
- 难度递进：${config.difficultyProgression}
- 包含项目：${config.includeProjects ? '是' : '否'}
- 包含里程碑：${config.includeMilestones ? '是' : '否'}

## 🔍 技能差距核心分析
- **当前水平**: ${skillGap.currentLevel}/10
- **目标水平**: ${skillGap.targetLevel}/10
- **主要技能差距**: ${(skillGap.skillGaps || skillGap.gaps || []).slice(0, 8).map(g => `${g.skill}(差距:${g.gap},优先级:${g.priority})`).join('、')}
- **分析置信度**: ${((skillGap.confidence || 0.8) * 100).toFixed(0)}%
- **个性化程度**: ${skillGap.personalizationLevel || 'high'}`

    const personalizedRecommendations = ability ? 
      this.generatePersonalizedRecommendations(ability, skillGap, context) :
      skillGap.recommendations || []

    return `🎯 **任务**: 为用户创建高度个性化的学习路径

${contextInfo}

## 💡 个性化建议与策略
${personalizedRecommendations.map(r => `• ${r}`).join('\n')}

---

## 📋 路径生成要求

### 🔥 核心个性化原则
1. **精准匹配用户5维能力水平** - 每个节点都必须考虑用户在相关维度的具体分数
2. **重点补强薄弱维度** - 优先安排提升用户最薄弱能力维度的学习内容
3. **发挥现有优势** - 在用户强项基础上设计更高难度的挑战
4. **循序渐进的难度设计** - 基于用户当前水平设计合理的学习坡度
5. **实战项目导向** - 每个阶段都包含能体现综合能力提升的项目实践

### 📊 基于5维评估的节点设计策略
${ability ? this.generateDimensionBasedStrategy(ability, skillGap) : '基础通用策略：平衡发展各项技能'}

### 🏗️ 路径结构要求
请生成包含以下完整结构的个性化学习路径（JSON格式）：

\`\`\`json
{
  "title": "基于${ability?.overallLevel || '用户'}水平的个性化学习路径",
  "description": "根据用户5维能力评估定制的${goal.title}学习方案",
  "totalEstimatedHours": 基于用户学习效率调整的总时长,
  "personalizedMetadata": {
    "basedon": "5-dimensional ability assessment",
    "userLevel": "${ability?.overallLevel || 'unknown'}",
    "primaryWeakness": "${ability ? this.getPrimaryWeakness(ability) : 'TBD'}",
    "primaryStrength": "${ability ? this.getPrimaryStrength(ability) : 'TBD'}",
    "learningEfficiency": "${this.calculateLearningEfficiency(ability)}",
    "recommendedPace": "${this.recommendLearningIntensity(ability, context.learningHistory)}"
  },
  "nodes": [
    {
      "id": "node_1",
      "title": "具体节点标题",
      "description": "基于用户${ability?.overallLevel || ''}水平定制的学习内容描述",
      "type": "concept|practice|project|assessment|milestone",
      "estimatedHours": 基于用户能力调整的学时,
      "difficulty": 1-5(严格匹配用户水平),
      "prerequisites": ["前置节点ID"],
      "skills": ["目标技能列表"],
      "targetDimensions": ["primary_dimension", "secondary_dimension"],
      "dimensionFocus": {
        "primary": "主要提升的维度及原因",
        "secondary": "次要涉及的维度",
        "weaknessAddress": "如何针对用户薄弱点设计"
      },
      "resources": [
        {
          "type": "article|video|exercise|project|quiz",
          "title": "资源标题",
          "content": "针对用户${ability?.overallLevel || ''}水平的资源描述",
          "difficultyJustification": "为什么这个难度适合用户当前水平"
        }
      ],
      "personalizedHints": [
        "基于用户强项(${ability?.strengths.join(',') || 'TBD'})的学习建议",
        "针对用户薄弱点(${ability?.weaknesses.join(',') || 'TBD'})的特别提醒"
      ],
      "assessmentCriteria": ["可量化的学习成果标准"],
      "adaptiveElements": {
        "ifStruggling": "如果学习困难时的调整建议",
        "ifAdvancing": "如果学习顺利时的进阶内容",
        "personalizedTips": "基于用户5维评估的专属建议"
      }
    }
  ],
  "dependencies": [{"from": "节点ID", "to": "节点ID", "reason": "依赖原因"}],
  "milestones": [
    {
      "id": "milestone_1", 
      "title": "阶段性目标",
      "nodeIds": ["包含的节点ID"],
      "assessmentMethod": "基于用户水平的评估方式",
      "personalizedReward": "个性化激励机制",
      "dimensionGrowthExpected": {
        "programming": "预期提升分数",
        "algorithm": "预期提升分数", 
        "project": "预期提升分数",
        "systemDesign": "预期提升分数",
        "communication": "预期提升分数"
      }
    }
  ],
  "adaptivePath": {
    "baselineCompleteRate": "基于用户历史的预期完成率",
    "difficultyAdjustment": "根据用户能力的难度调整策略",
    "paceRecommendation": "个性化的学习节奏建议",
    "weaknessReinforcement": "薄弱环节的额外强化策略"
  }
}
\`\`\`

### ⚠️ 关键质量要求
1. **每个节点都必须明确说明为什么适合用户当前的5维能力水平**
2. **节点难度必须与用户评估分数严格匹配，不能过难或过简单**
3. **重点补强用户最薄弱的2-3个维度，同时发挥优势维度**
4. **学习时间估算必须考虑用户的学习效率和经验水平**
5. **每个里程碑都要设定明确的5维能力提升预期**

${ability ? `
🎯 **用户专属提醒**: 
- 当前最强: ${this.getPrimaryStrength(ability)}(${this.getStrongestScore(ability)}分)
- 当前最弱: ${this.getPrimaryWeakness(ability)}(${this.getWeakestScore(ability)}分)  
- 能力平衡度: ${this.calculateBalanceLevel(ability)}
- **生成的学习路径必须充分体现对这些个性化数据的深度考虑！**
` : '⚠️ 缺少能力评估数据，请生成通用学习路径'}`
  }

  // 新增辅助方法
  private buildDimensionAnalysis(ability: any): string {
    return ability.dimensions.map((dim: any) => {
      const strengthsInDim = Object.entries(dim.skills)
        .filter(([_, skill]: [string, any]) => skill.score > dim.score + 10)
        .map(([name]) => name).slice(0, 3)
      
      const weaknessesInDim = Object.entries(dim.skills)
        .filter(([_, skill]: [string, any]) => skill.score < dim.score - 10)
        .map(([name]) => name).slice(0, 3)

      return `**${dim.name}** (${dim.score}分):
   • 强项技能: ${strengthsInDim.length > 0 ? strengthsInDim.join(', ') : '整体均衡'}
   • 薄弱技能: ${weaknessesInDim.length > 0 ? weaknessesInDim.join(', ') : '无明显短板'}
   • 权重占比: ${(dim.weight * 100).toFixed(0)}%
   • 提升建议: ${this.getDimensionImprovementAdvice(dim.name, dim.score)}`
    }).join('\n')
  }

  private categorizeSkillGapsByDimension(gaps: any[]): string {
    const dimensionGroups: Record<string, any[]> = {}
    
    gaps.forEach(gap => {
      const dimension = gap.skill.split('.')[0]
      if (!dimensionGroups[dimension]) {
        dimensionGroups[dimension] = []
      }
      dimensionGroups[dimension].push(gap)
    })

    return Object.entries(dimensionGroups)
      .map(([dimension, gapsInDim]) => `**${dimension}维度**: ${gapsInDim.length}个技能缺口，平均差距${Math.round(gapsInDim.reduce((sum, g) => sum + g.gap, 0) / gapsInDim.length)}分`)
      .join('\n')
  }

  private generatePriorityStrategy(ability: any, skillGapsByDimension: string): string {
    const weakestDim = ability.dimensions.reduce((min: any, curr: any) => 
      curr.score < min.score ? curr : min
    )
    const strongestDim = ability.dimensions.reduce((max: any, curr: any) => 
      curr.score > max.score ? curr : max
    )

    return `🔍 **学习优先级策略**:
1. **重点突破**: ${weakestDim.name}(${weakestDim.score}分) - 该维度是当前最大短板，需要重点投入
2. **巩固优势**: ${strongestDim.name}(${strongestDim.score}分) - 基于现有优势进一步深化
3. **平衡发展**: 适度提升其他维度，确保全面发展
4. **实战应用**: 通过项目实践综合运用各维度能力`
  }

  private calculateLearningEfficiency(ability: any): string {
    if (!ability) return '中等'
    
    const avgScore = ability.overallScore
    if (avgScore >= 70) return '高效 - 有丰富基础，学习新知识较快'
    if (avgScore >= 50) return '中等 - 有一定基础，按正常进度学习'
    if (avgScore >= 30) return '需要耐心 - 基础薄弱，需要更多时间理解'
    return '循序渐进 - 建议从基础开始，小步快跑'
  }

  private recommendLearningIntensity(ability: any, learningHistory: any): string {
    const hasExperience = learningHistory.completedGoals > 0
    const avgScore = ability?.overallScore || 50
    
    if (avgScore >= 70 && hasExperience) return '快节奏 - 可以接受较高强度的学习计划'
    if (avgScore >= 50) return '中等节奏 - 稳步推进，适度挑战'
    return '舒缓节奏 - 重点理解和消化，不急于求成'
  }

  private recommendOptimalPath(ability: any, skillGap: any): string {
    if (!ability) return '基础循序渐进路径'
    
    const weakDimensionCount = ability.dimensions.filter((d: any) => d.score < 50).length
    
    if (weakDimensionCount >= 3) return '全面基础强化路径 - 优先补强多个薄弱维度'
    if (weakDimensionCount === 2) return '重点突破路径 - 专注提升关键薄弱维度'
    if (weakDimensionCount === 1) return '优化完善路径 - 消除最后短板并提升整体水平'
    return '高级发展路径 - 在现有基础上追求卓越'
  }

  private generateTimeAllocation(ability: any, skillGapsByDimension: string): string {
    if (!ability) return '平均分配学习时间到各个模块'
    
    const weakest = ability.dimensions.reduce((min: any, curr: any) => 
      curr.score < min.score ? curr : min
    )
    
    return `建议时间分配：
• ${weakest.name}: 40% (重点补强)  
• 项目实践: 30% (综合应用)
• 其他维度: 20% (均衡发展)
• 复习巩固: 10% (知识沉淀)`
  }

  private generatePersonalizedRecommendations(ability: any, skillGap: any, context: any): string[] {
    const recommendations = [...skillGap.recommendations]
    
    if (ability) {
      const weakest = this.getPrimaryWeakness(ability)
      const strongest = this.getPrimaryStrength(ability)
      
      recommendations.push(`🎯 重点补强${weakest}维度，这是当前最大的提升空间`)
      recommendations.push(`💪 发挥${strongest}维度优势，在此基础上设计高难度挑战`)
      recommendations.push(`⚖️ 注意维度平衡，避免过度偏科导致能力发展不均`)
      
      if (context.learningHistory.completedGoals === 0) {
        recommendations.push(`🌱 作为学习新手，建议采用小步快跑策略，多设置成就感节点`)
      }
    }
    
    return recommendations
  }

  private generateDimensionBasedStrategy(ability: any, skillGap: any): string {
    const weakestDims = ability.dimensions
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 2)
      .map((d: any) => d.name)
    
    const strongestDims = ability.dimensions
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 2)
      .map((d: any) => d.name)

    return `**节点设计必须重点考虑**:
1. **优先补强**: ${weakestDims.join('和')} - 每个学习阶段都要包含这些维度的强化内容
2. **巩固优势**: ${strongestDims.join('和')} - 设计更高难度的挑战来进一步提升
3. **综合项目**: 每个里程碑都要包含能同时锻炼多个维度的综合项目
4. **个性化调整**: 根据用户具体的技能薄弱点，调整学习内容的侧重点`
  }

  private getDimensionImprovementAdvice(dimensionName: string, score: number): string {
    const adviceMap: Record<string, Record<string, string>> = {
      programming: {
        low: '重点练习基础语法和数据结构',
        medium: '提升代码质量和开发效率',
        high: '探索高级特性和最佳实践'
      },
      algorithm: {
        low: '从基础算法开始系统学习',
        medium: '加强复杂算法的理解和应用',
        high: '研究算法优化和创新方法'
      },
      project: {
        low: '从小型项目开始积累经验',
        medium: '参与中等复杂度的团队项目',
        high: '承担大型项目的架构和领导工作'
      },
      systemDesign: {
        low: '学习基本的系统架构概念',
        medium: '深入理解分布式系统设计',
        high: '专研高可用和高性能系统架构'
      },
      communication: {
        low: '加强技术写作和表达能力',
        medium: '提升团队协作和Code Review技能',
        high: '发展技术领导力和跨团队沟通能力'
      }
    }
    
    const level = score < 40 ? 'low' : score < 70 ? 'medium' : 'high'
    return adviceMap[dimensionName]?.[level] || '持续学习和实践'
  }

  private getPrimaryWeakness(ability: any): string {
    return ability.dimensions.reduce((min: any, curr: any) => 
      curr.score < min.score ? curr : min
    ).name
  }

  private getPrimaryStrength(ability: any): string {
    return ability.dimensions.reduce((max: any, curr: any) => 
      curr.score > max.score ? curr : max
    ).name
  }

  private getWeakestScore(ability: any): number {
    return Math.min(...ability.dimensions.map((d: any) => d.score))
  }

  private getStrongestScore(ability: any): number {
    return Math.max(...ability.dimensions.map((d: any) => d.score))
  }

  private calculateBalanceLevel(ability: any): string {
    const scores = ability.dimensions.map((d: any) => d.score)
    const gap = Math.max(...scores) - Math.min(...scores)
    
    if (gap < 15) return '很均衡'
    if (gap < 30) return '较均衡'
    if (gap < 45) return '不太均衡'
    return '严重不均衡'
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

    description += `预计${skillGap.estimatedTimeWeeks}周完成，包含${(skillGap.skillGaps || skillGap.gaps || []).length}个关键技能点的针对性训练。`

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
- 主要技能差距：${(skillGap.skillGaps || skillGap.gaps || []).slice(0, 5).map(g => `${g.skill}(差距:${g.gap})`).join('、')}

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