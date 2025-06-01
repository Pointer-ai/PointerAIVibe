// 目标激活状态管理器
// 专门处理目标激活状态的设定、限制、同步等功能

import { 
  getLearningGoals, 
  updateLearningGoal, 
  getLearningPaths,
  updateLearningPath,
  addCoreEvent
} from './service'
import { LearningGoal, LearningPath } from './types'
import { log } from '../../utils/logger'

/**
 * 目标激活配置
 */
export interface GoalActivationConfig {
  maxActiveGoals: number // 最大激活目标数
  autoDeactivateCompleted: boolean // 是否自动停用已完成目标
  syncRelatedPaths: boolean // 是否同步相关路径状态
  allowPriorityOverride: boolean // 是否允许优先级覆盖
  notificationEnabled: boolean // 是否启用通知
}

/**
 * 激活状态操作结果
 */
export interface ActivationResult {
  success: boolean
  goalId: string
  oldStatus: string
  newStatus: string
  message: string
  warnings: string[]
  affectedPaths: string[] // 受影响的路径ID列表
  systemRecommendations: string[] // 系统建议
}

/**
 * 批量激活结果
 */
export interface BatchActivationResult {
  successCount: number
  failureCount: number
  results: ActivationResult[]
  summary: string
  overallRecommendations: string[]
}

/**
 * 目标激活统计
 */
export interface GoalActivationStats {
  total: number
  active: number
  paused: number
  completed: number
  cancelled: number
  maxActive: number
  availableSlots: number
  utilizationRate: number // 激活率 (active/maxActive)
  completionRate: number // 完成率 (completed/total)
  recentActivations: Array<{
    goalId: string
    title: string
    activatedAt: string
    daysSinceActivation: number
  }>
}

/**
 * 目标激活状态管理器
 */
export class GoalActivationManager {
  private config: GoalActivationConfig

  constructor(config?: Partial<GoalActivationConfig>) {
    this.config = {
      maxActiveGoals: 3,
      autoDeactivateCompleted: true,
      syncRelatedPaths: true,
      allowPriorityOverride: false,
      notificationEnabled: true,
      ...config
    }
    
    log('[GoalActivationManager] Initialized with config:', this.config)
  }

  /**
   * 激活指定目标
   */
  async activateGoal(goalId: string, options?: {
    force?: boolean // 是否强制激活（忽略限制）
    priority?: number // 指定优先级
    reason?: string // 激活原因
  }): Promise<ActivationResult> {
    try {
      const goal = this.findGoal(goalId)
      if (!goal) {
        return this.createFailureResult(goalId, 'unknown', 'active', '目标不存在')
      }

      const oldStatus = goal.status
      const warnings: string[] = []
      const affectedPaths: string[] = []
      const recommendations: string[] = []

      // 检查是否已经是激活状态
      if (goal.status === 'active') {
        return this.createSuccessResult(goalId, 'active', 'active', '目标已经是激活状态', [], [], ['继续专注于当前目标'])
      }

      // 检查激活限制
      const stats = this.getActivationStats()
      if (stats.availableSlots <= 0 && !options?.force) {
        const suggestion = await this.suggestGoalForDeactivation()
        const message = `激活目标数量已达上限(${this.config.maxActiveGoals})。`
        const recs = suggestion ? [`建议先暂停目标: ${suggestion.goalTitle}`] : ['请先暂停或完成其他目标']
        
        return this.createFailureResult(goalId, oldStatus, 'active', message, [], recs)
      }

      // 执行激活
      const updatedGoal = updateLearningGoal(goalId, { 
        status: 'active',
        updatedAt: new Date().toISOString()
      })

      if (!updatedGoal) {
        return this.createFailureResult(goalId, oldStatus, 'active', '更新目标失败')
      }

      // 同步相关路径
      if (this.config.syncRelatedPaths) {
        const paths = this.getRelatedPaths(goalId)
        for (const path of paths) {
          if (path.status === 'paused' || path.status === 'draft') {
            updateLearningPath(path.id, { status: 'active' })
            affectedPaths.push(path.id)
          }
        }
      }

      // 添加激活建议
      if (goal.status === 'paused') {
        recommendations.push('建议检查学习路径是否需要更新')
      }
      if (stats.active === this.config.maxActiveGoals - 1) {
        recommendations.push('已接近激活上限，建议合理安排学习时间')
      }

      // 记录激活事件
      addCoreEvent({
        type: 'goal_activated',
        details: {
          goalId,
          title: goal.title,
          previousStatus: oldStatus,
          activatedAt: new Date().toISOString(),
          affectedPathsCount: affectedPaths.length,
          reason: options?.reason || 'manual_activation',
          currentActiveCount: stats.active + 1
        }
      })

      log(`[GoalActivationManager] Goal activated: ${goal.title}`)
      
      return this.createSuccessResult(
        goalId, 
        oldStatus, 
        'active', 
        '目标已成功激活', 
        warnings, 
        affectedPaths, 
        recommendations
      )

    } catch (error) {
      log('[GoalActivationManager] Activation failed:', error)
      const message = error instanceof Error ? error.message : '激活失败'
      return this.createFailureResult(goalId, 'unknown', 'active', message)
    }
  }

  /**
   * 暂停指定目标
   */
  async pauseGoal(goalId: string, reason?: string): Promise<ActivationResult> {
    try {
      const goal = this.findGoal(goalId)
      if (!goal) {
        return this.createFailureResult(goalId, 'unknown', 'paused', '目标不存在')
      }

      const oldStatus = goal.status
      const affectedPaths: string[] = []

      // 检查是否已经是暂停状态
      if (goal.status === 'paused') {
        return this.createSuccessResult(goalId, 'paused', 'paused', '目标已经是暂停状态', [], [], [])
      }

      // 执行暂停
      const updatedGoal = updateLearningGoal(goalId, { 
        status: 'paused',
        updatedAt: new Date().toISOString()
      })

      if (!updatedGoal) {
        return this.createFailureResult(goalId, oldStatus, 'paused', '更新目标失败')
      }

      // 同步相关路径
      if (this.config.syncRelatedPaths) {
        const paths = this.getRelatedPaths(goalId)
        for (const path of paths) {
          if (path.status === 'active') {
            updateLearningPath(path.id, { status: 'paused' })
            affectedPaths.push(path.id)
          }
        }
      }

      // 记录暂停事件
      addCoreEvent({
        type: 'goal_paused',
        details: {
          goalId,
          title: goal.title,
          previousStatus: oldStatus,
          pausedAt: new Date().toISOString(),
          affectedPathsCount: affectedPaths.length,
          reason: reason || 'manual_pause'
        }
      })

      const recommendations = ['暂停期间可以专注于其他目标', '准备好时可以重新激活目标']
      
      return this.createSuccessResult(
        goalId, 
        oldStatus, 
        'paused', 
        '目标已暂停', 
        [], 
        affectedPaths, 
        recommendations
      )

    } catch (error) {
      log('[GoalActivationManager] Pause failed:', error)
      const message = error instanceof Error ? error.message : '暂停失败'
      return this.createFailureResult(goalId, 'unknown', 'paused', message)
    }
  }

  /**
   * 完成指定目标
   */
  async completeGoal(goalId: string, achievements?: string[]): Promise<ActivationResult> {
    try {
      const goal = this.findGoal(goalId)
      if (!goal) {
        return this.createFailureResult(goalId, 'unknown', 'completed', '目标不存在')
      }

      const oldStatus = goal.status
      const affectedPaths: string[] = []

      // 检查是否已经完成
      if (goal.status === 'completed') {
        return this.createSuccessResult(goalId, 'completed', 'completed', '目标已经完成', [], [], [])
      }

      // 执行完成
      const updatedGoal = updateLearningGoal(goalId, { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      })

      if (!updatedGoal) {
        return this.createFailureResult(goalId, oldStatus, 'completed', '更新目标失败')
      }

      // 同步相关路径
      if (this.config.syncRelatedPaths) {
        const paths = this.getRelatedPaths(goalId)
        for (const path of paths) {
          if (['active', 'paused'].includes(path.status)) {
            updateLearningPath(path.id, { status: 'completed' })
            affectedPaths.push(path.id)
          }
        }
      }

      // 记录完成事件
      addCoreEvent({
        type: 'goal_completed',
        details: {
          goalId,
          title: goal.title,
          previousStatus: oldStatus,
          completedAt: new Date().toISOString(),
          affectedPathsCount: affectedPaths.length,
          achievements: achievements || [],
          timeToComplete: this.calculateCompletionTime(goal)
        }
      })

      const recommendations = [
        '恭喜完成目标！',
        '可以设定新的学习目标',
        '考虑分享学习成果'
      ]
      
      return this.createSuccessResult(
        goalId, 
        oldStatus, 
        'completed', 
        '🎉 目标已完成！', 
        [], 
        affectedPaths, 
        recommendations
      )

    } catch (error) {
      log('[GoalActivationManager] Completion failed:', error)
      const message = error instanceof Error ? error.message : '完成操作失败'
      return this.createFailureResult(goalId, 'unknown', 'completed', message)
    }
  }

  /**
   * 批量激活目标
   */
  async activateMultipleGoals(goalIds: string[], options?: {
    maxConcurrent?: number
    priorityOrder?: boolean
  }): Promise<BatchActivationResult> {
    const maxConcurrent = options?.maxConcurrent || this.config.maxActiveGoals
    const results: ActivationResult[] = []
    let successCount = 0
    let failureCount = 0

    // 如果启用优先级排序，先按优先级排序
    let sortedGoalIds = goalIds
    if (options?.priorityOrder) {
      const goals = goalIds.map(id => this.findGoal(id)).filter(Boolean) as LearningGoal[]
      goals.sort((a, b) => b.priority - a.priority)
      sortedGoalIds = goals.map(g => g.id)
    }

    // 逐个激活
    for (const goalId of sortedGoalIds) {
      const stats = this.getActivationStats()
      if (stats.active >= maxConcurrent) {
        const result = this.createFailureResult(
          goalId, 
          'unknown', 
          'active', 
          `已达到并发激活限制(${maxConcurrent})`
        )
        results.push(result)
        failureCount++
        continue
      }

      const result = await this.activateGoal(goalId, { reason: 'batch_activation' })
      results.push(result)
      
      if (result.success) {
        successCount++
      } else {
        failureCount++
      }
    }

    const summary = `批量激活完成: ${successCount}成功, ${failureCount}失败`
    const overallRecommendations = this.generateBatchRecommendations(results)

    // 记录批量激活事件
    addCoreEvent({
      type: 'goals_batch_activated',
      details: {
        requestedGoals: goalIds.length,
        successCount,
        failureCount,
        maxConcurrent,
        priorityOrder: options?.priorityOrder || false
      }
    })

    return {
      successCount,
      failureCount,
      results,
      summary,
      overallRecommendations
    }
  }

  /**
   * 获取激活状态统计
   */
  getActivationStats(): GoalActivationStats {
    const goals = getLearningGoals()
    const total = goals.length
    const active = goals.filter(g => g.status === 'active').length
    const paused = goals.filter(g => g.status === 'paused').length
    const completed = goals.filter(g => g.status === 'completed').length
    const cancelled = goals.filter(g => g.status === 'cancelled').length
    
    const maxActive = this.config.maxActiveGoals
    const availableSlots = Math.max(0, maxActive - active)
    const utilizationRate = total > 0 ? (active / maxActive) * 100 : 0
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // 获取最近激活的目标
    const recentActivations = goals
      .filter(g => g.status === 'active')
      .map(g => {
        const activatedAt = g.updatedAt // 简化处理
        const daysSinceActivation = Math.floor(
          (Date.now() - new Date(activatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          goalId: g.id,
          title: g.title,
          activatedAt,
          daysSinceActivation
        }
      })
      .sort((a, b) => b.daysSinceActivation - a.daysSinceActivation)
      .slice(0, 5)

    return {
      total,
      active,
      paused,
      completed,
      cancelled,
      maxActive,
      availableSlots,
      utilizationRate,
      completionRate,
      recentActivations
    }
  }

  /**
   * 智能重排激活目标
   */
  async reorderActiveGoals(priorityGoalIds: string[]): Promise<BatchActivationResult> {
    const stats = this.getActivationStats()
    const currentActiveGoals = getLearningGoals().filter(g => g.status === 'active')
    
    // 先暂停所有当前激活的目标
    const pauseResults: ActivationResult[] = []
    for (const goal of currentActiveGoals) {
      const result = await this.pauseGoal(goal.id, 'reorder_operation')
      pauseResults.push(result)
    }

    // 按新的优先级顺序激活
    const activateResults: ActivationResult[] = []
    const maxToActivate = Math.min(priorityGoalIds.length, this.config.maxActiveGoals)
    
    for (let i = 0; i < maxToActivate; i++) {
      const goalId = priorityGoalIds[i]
      const result = await this.activateGoal(goalId, { reason: 'reorder_operation' })
      activateResults.push(result)
    }

    const allResults = [...pauseResults, ...activateResults]
    const successCount = allResults.filter(r => r.success).length
    const failureCount = allResults.length - successCount

    // 记录重排事件
    addCoreEvent({
      type: 'goals_reordered',
      details: {
        previousActiveCount: currentActiveGoals.length,
        newActiveCount: activateResults.filter(r => r.success).length,
        priorityOrder: priorityGoalIds,
        operationResults: allResults.map(r => ({
          goalId: r.goalId,
          success: r.success,
          operation: r.newStatus
        }))
      }
    })

    return {
      successCount,
      failureCount,
      results: allResults,
      summary: `重排完成: ${successCount}成功, ${failureCount}失败`,
      overallRecommendations: ['检查新的激活目标顺序', '更新学习计划']
    }
  }

  // ========== 私有辅助方法 ==========

  private findGoal(goalId: string): LearningGoal | undefined {
    return getLearningGoals().find(g => g.id === goalId)
  }

  private getRelatedPaths(goalId: string): LearningPath[] {
    return getLearningPaths().filter(p => p.goalId === goalId)
  }

  private createSuccessResult(
    goalId: string,
    oldStatus: string,
    newStatus: string,
    message: string,
    warnings: string[] = [],
    affectedPaths: string[] = [],
    recommendations: string[] = []
  ): ActivationResult {
    return {
      success: true,
      goalId,
      oldStatus,
      newStatus,
      message,
      warnings,
      affectedPaths,
      systemRecommendations: recommendations
    }
  }

  private createFailureResult(
    goalId: string,
    oldStatus: string,
    newStatus: string,
    message: string,
    warnings: string[] = [],
    recommendations: string[] = []
  ): ActivationResult {
    return {
      success: false,
      goalId,
      oldStatus,
      newStatus,
      message,
      warnings,
      affectedPaths: [],
      systemRecommendations: recommendations
    }
  }

  private async suggestGoalForDeactivation(): Promise<{ goalId: string; goalTitle: string } | null> {
    const activeGoals = getLearningGoals().filter(g => g.status === 'active')
    if (activeGoals.length === 0) return null

    // 找到最低优先级的目标
    const lowestPriorityGoal = activeGoals.reduce((min, goal) => 
      goal.priority < min.priority ? goal : min
    )

    return {
      goalId: lowestPriorityGoal.id,
      goalTitle: lowestPriorityGoal.title
    }
  }

  private calculateCompletionTime(goal: LearningGoal): number {
    // 简化计算：从创建到完成的天数
    const createdTime = new Date(goal.createdAt).getTime()
    const completedTime = Date.now()
    return Math.floor((completedTime - createdTime) / (1000 * 60 * 60 * 24))
  }

  private generateBatchRecommendations(results: ActivationResult[]): string[] {
    const recommendations: string[] = []
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    if (successCount > 0) {
      recommendations.push(`成功激活 ${successCount} 个目标`)
    }
    
    if (failureCount > 0) {
      recommendations.push(`${failureCount} 个目标激活失败，请检查原因`)
    }

    if (successCount > 2) {
      recommendations.push('注意合理分配学习时间')
    }

    return recommendations
  }

  /**
   * 更新激活配置
   */
  updateConfig(newConfig: Partial<GoalActivationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    addCoreEvent({
      type: 'goal_activation_config_updated',
      details: {
        updatedFields: Object.keys(newConfig),
        newConfig: this.config
      }
    })
    
    log('[GoalActivationManager] Config updated:', this.config)
  }

  /**
   * 获取当前配置
   */
  getConfig(): GoalActivationConfig {
    return { ...this.config }
  }
}

// 导出单例实例
export const goalActivationManager = new GoalActivationManager()

// 导出便捷函数
export const activateGoal = (goalId: string, options?: Parameters<GoalActivationManager['activateGoal']>[1]) =>
  goalActivationManager.activateGoal(goalId, options)

export const pauseGoal = (goalId: string, reason?: string) =>
  goalActivationManager.pauseGoal(goalId, reason)

export const completeGoal = (goalId: string, achievements?: string[]) =>
  goalActivationManager.completeGoal(goalId, achievements)

export const getActivationStats = () =>
  goalActivationManager.getActivationStats() 