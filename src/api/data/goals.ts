/**
 * Learning API 目标数据处理器
 * 提取并整合原有的目标相关数据处理函数
 */

import { log } from '../../utils/logger'
import { coreDataManager } from './storage'
import type { 
  LearningGoal, 
  CreateGoalData, 
  GoalStats, 
  ValidationResult,
  DataHandler 
} from './types'

/**
 * 目标数据处理器
 * 整合原有 modules/coreData/service.ts 中的目标相关函数
 */
export class GoalDataHandler implements DataHandler<LearningGoal, CreateGoalData, Partial<LearningGoal>> {
  
  /**
   * 获取所有学习目标
   */
  async getAll(): Promise<LearningGoal[]> {
    try {
      const coreData = await coreDataManager.getCoreData()
      return coreData.goals
    } catch (error) {
      log('[GoalDataHandler] Get all goals failed:', error)
      return []
    }
  }

  /**
   * 根据ID获取单个目标
   */
  async getById(id: string): Promise<LearningGoal | null> {
    try {
      const goals = await this.getAll()
      return goals.find(goal => goal.id === id) || null
    } catch (error) {
      log('[GoalDataHandler] Get goal by id failed:', error)
      return null
    }
  }

  /**
   * 创建新的学习目标
   */
  async create(data: CreateGoalData): Promise<LearningGoal> {
    try {
      // 验证数据
      const validation = this.validate(data)
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const coreData = await coreDataManager.getCoreData()
      
      const newGoal: LearningGoal = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      }

      coreData.goals.push(newGoal)
      await coreDataManager.saveCoreData(coreData)

      // 记录事件
      await coreDataManager.addEvent({
        type: 'goal_created',
        timestamp: new Date().toISOString(),
        data: {
          goalId: newGoal.id,
          title: newGoal.title,
          category: newGoal.category
        }
      })

      log(`[GoalDataHandler] Goal created: ${newGoal.title}`)
      return newGoal
    } catch (error) {
      log('[GoalDataHandler] Create goal failed:', error)
      throw error
    }
  }

  /**
   * 更新目标信息
   */
  async update(id: string, updates: Partial<LearningGoal>): Promise<LearningGoal> {
    try {
      const coreData = await coreDataManager.getCoreData()
      const goalIndex = coreData.goals.findIndex(g => g.id === id)
      
      if (goalIndex === -1) {
        throw new Error(`目标不存在: ${id}`)
      }

      const currentGoal = coreData.goals[goalIndex]
      const updatedGoal: LearningGoal = {
        ...currentGoal,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // 验证更新后的数据
      const validation = this.validate(updatedGoal)
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      coreData.goals[goalIndex] = updatedGoal
      await coreDataManager.saveCoreData(coreData)

      // 记录事件
      await coreDataManager.addEvent({
        type: 'goal_updated',
        timestamp: new Date().toISOString(),
        data: {
          goalId: id,
          title: updatedGoal.title,
          updates: Object.keys(updates)
        }
      })

      log(`[GoalDataHandler] Goal updated: ${updatedGoal.title}`)
      return updatedGoal
    } catch (error) {
      log('[GoalDataHandler] Update goal failed:', error)
      throw error
    }
  }

  /**
   * 删除目标
   */
  async delete(id: string): Promise<boolean> {
    try {
      const coreData = await coreDataManager.getCoreData()
      const goalIndex = coreData.goals.findIndex(g => g.id === id)
      
      if (goalIndex === -1) {
        return false
      }

      const goal = coreData.goals[goalIndex]
      
      // 删除关联的学习路径
      const relatedPaths = coreData.paths.filter(p => p.goalId === id)
      for (const path of relatedPaths) {
        // 删除路径关联的课程单元
        const relatedUnits = coreData.courseUnits.filter(u => 
          path.nodes.some(node => node.id === u.nodeId)
        )
        coreData.courseUnits = coreData.courseUnits.filter(u => 
          !relatedUnits.some(ru => ru.id === u.id)
        )
      }
      
      // 删除关联路径
      coreData.paths = coreData.paths.filter(p => p.goalId !== id)
      
      // 删除目标
      coreData.goals.splice(goalIndex, 1)
      
      await coreDataManager.saveCoreData(coreData)

      // 记录事件
      await coreDataManager.addEvent({
        type: 'goal_deleted',
        timestamp: new Date().toISOString(),
        data: {
          goalId: id,
          title: goal.title,
          category: goal.category,
          relatedPathsDeleted: relatedPaths.length
        }
      })

      log(`[GoalDataHandler] Goal deleted: ${goal.title}`)
      return true
    } catch (error) {
      log('[GoalDataHandler] Delete goal failed:', error)
      return false
    }
  }

  /**
   * 验证目标数据
   */
  validate(data: any): ValidationResult {
    const errors: any[] = []
    const warnings: any[] = []

    // 必填字段验证
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: '标题不能为空',
        code: 'REQUIRED'
      })
    } else if (data.title.length > 100) {
      errors.push({
        field: 'title',
        message: '标题长度不能超过100个字符',
        code: 'MAX_LENGTH'
      })
    }

    if (!data.description || typeof data.description !== 'string') {
      warnings.push({
        field: 'description',
        message: '建议添加详细描述',
        suggestion: '描述有助于更好地理解学习目标'
      })
    } else if (data.description.length > 1000) {
      errors.push({
        field: 'description',
        message: '描述长度不能超过1000个字符',
        code: 'MAX_LENGTH'
      })
    }

    // 类别验证
    const validCategories = ['frontend', 'backend', 'fullstack', 'automation', 'ai', 'mobile', 'game', 'data', 'custom']
    if (!data.category || !validCategories.includes(data.category)) {
      errors.push({
        field: 'category',
        message: `类别必须是以下之一: ${validCategories.join(', ')}`,
        code: 'INVALID_VALUE'
      })
    }

    // 优先级验证
    if (typeof data.priority !== 'number' || data.priority < 1 || data.priority > 5) {
      errors.push({
        field: 'priority',
        message: '优先级必须是1-5之间的数字',
        code: 'INVALID_RANGE'
      })
    }

    // 目标水平验证
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert']
    if (!data.targetLevel || !validLevels.includes(data.targetLevel)) {
      errors.push({
        field: 'targetLevel',
        message: `目标水平必须是以下之一: ${validLevels.join(', ')}`,
        code: 'INVALID_VALUE'
      })
    }

    // 预估时间验证
    if (typeof data.estimatedTimeWeeks !== 'number' || data.estimatedTimeWeeks <= 0) {
      errors.push({
        field: 'estimatedTimeWeeks',
        message: '预估时间必须是大于0的数字',
        code: 'INVALID_VALUE'
      })
    } else if (data.estimatedTimeWeeks > 104) { // 2年
      warnings.push({
        field: 'estimatedTimeWeeks',
        message: '学习周期超过2年，建议拆分成多个子目标',
        suggestion: '长期目标可以分解为多个短期目标'
      })
    }

    // 技能和结果验证
    if (!Array.isArray(data.requiredSkills)) {
      warnings.push({
        field: 'requiredSkills',
        message: '建议列出需要的前置技能',
        suggestion: '有助于评估学习难度和准备工作'
      })
    }

    if (!Array.isArray(data.outcomes)) {
      warnings.push({
        field: 'outcomes',
        message: '建议明确学习成果',
        suggestion: '明确的成果有助于衡量学习效果'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取目标统计信息
   */
  async getStats(): Promise<GoalStats> {
    try {
      const goals = await this.getAll()
      
      const stats: GoalStats = {
        total: goals.length,
        byStatus: {},
        byCategory: {},
        averageCompletionWeeks: 0
      }

      // 统计状态分布
      for (const goal of goals) {
        stats.byStatus[goal.status] = (stats.byStatus[goal.status] || 0) + 1
        stats.byCategory[goal.category] = (stats.byCategory[goal.category] || 0) + 1
      }

      // 计算平均完成时间
      const completedGoals = goals.filter(g => g.status === 'completed')
      if (completedGoals.length > 0) {
        const totalWeeks = completedGoals.reduce((sum, goal) => {
          const startDate = new Date(goal.createdAt)
          const endDate = new Date(goal.updatedAt)
          const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
          return sum + weeks
        }, 0)
        stats.averageCompletionWeeks = Math.round(totalWeeks / completedGoals.length)
      }

      return stats
    } catch (error) {
      log('[GoalDataHandler] Get stats failed:', error)
      return {
        total: 0,
        byStatus: {},
        byCategory: {},
        averageCompletionWeeks: 0
      }
    }
  }

  /**
   * 根据状态获取目标
   */
  async getByStatus(status: LearningGoal['status']): Promise<LearningGoal[]> {
    try {
      const goals = await this.getAll()
      return goals.filter(goal => goal.status === status)
    } catch (error) {
      log('[GoalDataHandler] Get goals by status failed:', error)
      return []
    }
  }

  /**
   * 根据类别获取目标
   */
  async getByCategory(category: LearningGoal['category']): Promise<LearningGoal[]> {
    try {
      const goals = await this.getAll()
      return goals.filter(goal => goal.category === category)
    } catch (error) {
      log('[GoalDataHandler] Get goals by category failed:', error)
      return []
    }
  }

  /**
   * 激活目标
   */
  async activate(id: string): Promise<LearningGoal> {
    try {
      // 检查激活限制 (最多3个活跃目标)
      const activeGoals = await this.getByStatus('active')
      if (activeGoals.length >= 3) {
        throw new Error('最多只能有3个活跃目标，请先暂停其他目标')
      }

      return await this.update(id, { status: 'active' })
    } catch (error) {
      log('[GoalDataHandler] Activate goal failed:', error)
      throw error
    }
  }

  /**
   * 暂停目标
   */
  async pause(id: string): Promise<LearningGoal> {
    return await this.update(id, { status: 'paused' })
  }

  /**
   * 完成目标
   */
  async complete(id: string): Promise<LearningGoal> {
    return await this.update(id, { status: 'completed' })
  }

  /**
   * 取消目标
   */
  async cancel(id: string): Promise<LearningGoal> {
    return await this.update(id, { status: 'cancelled' })
  }

  /**
   * 搜索目标
   */
  async search(query: string): Promise<LearningGoal[]> {
    try {
      const goals = await this.getAll()
      const lowerQuery = query.toLowerCase()
      
      return goals.filter(goal => 
        goal.title.toLowerCase().includes(lowerQuery) ||
        goal.description.toLowerCase().includes(lowerQuery) ||
        goal.category.toLowerCase().includes(lowerQuery) ||
        goal.requiredSkills.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
        goal.outcomes.some(outcome => outcome.toLowerCase().includes(lowerQuery))
      )
    } catch (error) {
      log('[GoalDataHandler] Search goals failed:', error)
      return []
    }
  }
}

// 导出单例实例
export const goalDataHandler = new GoalDataHandler() 