import { 
  getLearningGoals,
  getAbilityProfile,
  createLearningPath,
  addCoreEvent,
  agentToolExecutor
} from '../coreData'
import { getAIResponse } from '../../components/AIAssistant/service'
import { log } from '../../utils/logger'
import { 
  SkillGapAnalysis, 
  SkillGap, 
  PathGenerationConfig, 
  NodeTemplate 
} from './types'

export class PathPlanService {

  /**
   * 分析技能差距
   */
  async analyzeSkillGap(goalId: string): Promise<SkillGapAnalysis> {
    try {
      // 使用Agent工具执行技能差距分析
      const result = await agentToolExecutor.executeTool('calculate_skill_gap', { goalId })
      
      if (!result.hasAbilityData) {
        throw new Error('需要先完成能力评估')
      }

      const analysis: SkillGapAnalysis = {
        currentLevel: result.summary.averageGap > 0 ? 
          result.skillGaps[0]?.currentLevel || 0 : 5,
        targetLevel: result.skillGaps[0]?.targetLevel || 7,
        gaps: result.skillGaps.map((gap: any, index: number) => ({
          skill: gap.skill,
          currentLevel: gap.currentLevel,
          targetLevel: gap.targetLevel,
          gap: gap.gap,
          priority: gap.priority,
          learningOrder: index + 1
        })),
        recommendations: this.generateRecommendations(result.skillGaps),
        estimatedTimeWeeks: this.calculateEstimatedTime(result.skillGaps)
      }

      // 记录分析事件
      addCoreEvent({
        type: 'skill_gap_analyzed',
        details: {
          goalId,
          gapCount: analysis.gaps.length,
          averageGap: result.summary.averageGap,
          estimatedWeeks: analysis.estimatedTimeWeeks
        }
      })

      log('[PathPlan] Skill gap analysis completed for goal:', goalId)
      return analysis

    } catch (error) {
      log('[PathPlan] Failed to analyze skill gap:', error)
      throw error
    }
  }

  /**
   * 生成学习路径
   */
  async generateLearningPath(
    goalId: string, 
    config: PathGenerationConfig
  ): Promise<any> {
    try {
      const goal = getLearningGoals().find(g => g.id === goalId)
      if (!goal) {
        throw new Error('Goal not found')
      }

      const skillGapAnalysis = await this.analyzeSkillGap(goalId)
      const ability = getAbilityProfile()

      // 构建路径生成提示词
      const prompt = this.buildPathGenerationPrompt(goal, skillGapAnalysis, config, ability)
      
      // 调用AI生成路径结构
      const aiResponse = await getAIResponse(prompt)
      const pathStructure = this.parsePathStructure(aiResponse)

      // 使用Agent工具创建路径
      const path = await agentToolExecutor.executeTool('create_learning_path', {
        goalId,
        title: pathStructure.title || `${goal.title} - 学习路径`,
        description: pathStructure.description || `为${goal.title}定制的个性化学习路径`,
        nodes: pathStructure.nodes || [],
        dependencies: pathStructure.dependencies || [],
        milestones: pathStructure.milestones || []
      })

      // 记录路径生成事件
      addCoreEvent({
        type: 'learning_path_generated',
        details: {
          goalId,
          pathId: path.id,
          nodeCount: path.nodes.length,
          estimatedHours: path.totalEstimatedHours,
          config
        }
      })

      log('[PathPlan] Learning path generated:', path.title)
      return path

    } catch (error) {
      log('[PathPlan] Failed to generate learning path:', error)
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

  private calculateEstimatedTime(skillGaps: any[]): number {
    // 根据技能差距计算预估学习时间
    const totalGap = skillGaps.reduce((sum, gap) => sum + gap.gap, 0)
    const averageGap = totalGap / skillGaps.length
    
    // 基础时间计算：每个技能点差距需要1.5周
    return Math.ceil(averageGap * skillGaps.length * 1.5)
  }

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
} 