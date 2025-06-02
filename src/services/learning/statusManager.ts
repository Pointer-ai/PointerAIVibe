import { 
  LearningSystemStatus, 
  SmartRecommendations 
} from './types'
import { 
  getLearningGoals,
  getLearningPaths,
  getCourseUnits,
  agentToolExecutor
} from '../../modules/coreData'
import { getCurrentAssessment } from '../../modules/abilityAssess/service'
import { AbilityAssessmentService } from '../../modules/abilityAssess/service'

/**
 * 学习系统状态管理器
 */
export class LearningStatusManager {
  private abilityService: AbilityAssessmentService

  constructor() {
    this.abilityService = new AbilityAssessmentService()
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
    
    let nextActionResult: any = { suggestions: [] }
    try {
      nextActionResult = await agentToolExecutor.executeTool('suggest_next_action', {})
    } catch (error) {
      // 如果工具调用失败，提供默认建议
      nextActionResult.suggestions = this.getDefaultNextActions(currentPhase, abilitySummary.hasAssessment, activeGoals.length, activePaths.length)
    }

    // 执行数据完整性检查
    const dataIntegrityIssues = this.checkDataIntegrity()
    const isDataIntegrityOK = dataIntegrityIssues.length === 0

    // 计算Core Data大小
    const coreDataSize = goals.length + paths.length + units.length

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

    return systemStatus
  }

  /**
   * 智能学习建议
   */
  async getSmartLearningRecommendations(): Promise<SmartRecommendations> {
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
   * 获取默认的下一步行动建议
   */
  private getDefaultNextActions(
    currentPhase: string, 
    hasAssessment: boolean, 
    goalCount: number, 
    pathCount: number
  ): string[] {
    const actions: string[] = []
    
    switch (currentPhase) {
      case 'assessment':
        actions.push('完成能力评估')
        break
      case 'goal_setting':
        actions.push('设定学习目标')
        break
      case 'path_planning':
        actions.push('生成学习路径')
        break
      case 'learning':
        actions.push('继续学习当前课程')
        break
      case 'review':
        actions.push('复习已完成的内容')
        break
    }
    
    if (!hasAssessment) {
      actions.unshift('进行能力评估')
    }
    
    if (goalCount === 0) {
      actions.push('创建第一个学习目标')
    }
    
    if (pathCount === 0 && goalCount > 0) {
      actions.push('为目标制定学习计划')
    }
    
    return actions.slice(0, 3) // 限制为3个建议
  }
}

export const learningStatusManager = new LearningStatusManager() 