/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 目标管理服务 - 通过ProfileService访问数据

import { Goal, GoalFormData } from '../types/goal'
import { refactorProfileService } from './profileService'

// 导入原有的profile工具函数来访问当前Profile的数据
import {
  getCurrentProfile,
  getProfileData,
  setProfileData
} from '../../utils/profile'

// 导入老系统的类型定义，用于数据格式转换
import type { LearningGoal, CoreData } from '../../modules/coreData/types'

/**
 * 重构目标管理服务
 * 通过ProfileService访问数据，确保数据隔离
 */
export class RefactorGoalService {
  
  /**
   * 获取当前Profile的CoreData
   */
  private getCurrentCoreData(): CoreData {
    const coreData = getProfileData('coreData')
    if (!coreData) {
      // 如果没有coreData，创建默认结构
      const defaultCoreData: CoreData = {
        events: [],
        goals: [],
        paths: [],
        courseUnits: [],
        agentActions: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalStudyTime: 0,
          streakDays: 0
        }
      }
      setProfileData('coreData', defaultCoreData)
      return defaultCoreData
    }
    return coreData
  }

  /**
   * 保存CoreData到当前Profile
   */
  private saveCoreData(coreData: CoreData): void {
    coreData.metadata.lastUpdated = new Date().toISOString()
    setProfileData('coreData', coreData)
  }

  /**
   * 获取所有目标（转换为新格式）
   */
  getAllGoals(): Goal[] {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        console.warn('[RefactorGoalService] No active profile')
        return []
      }

      const coreData = this.getCurrentCoreData()
      return coreData.goals.map(oldGoal => this.convertToNewFormat(oldGoal))
    } catch (error) {
      console.error('[RefactorGoalService] Failed to get all goals:', error)
      return []
    }
  }

  /**
   * 根据ID获取目标
   */
  getGoalById(id: string): Goal | null {
    try {
      const allGoals = this.getAllGoals()
      return allGoals.find(goal => goal.id === id) || null
    } catch (error) {
      console.error('[RefactorGoalService] Failed to get goal by id:', error)
      return null
    }
  }

  /**
   * 创建新目标
   */
  async createGoal(formData: GoalFormData): Promise<Goal> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      const coreData = this.getCurrentCoreData()
      
      // 检查激活目标数量限制
      const activeGoals = coreData.goals.filter(g => g.status === 'active')
      if (activeGoals.length >= 3) {
        throw new Error('最多只能同时激活3个学习目标。请先暂停或完成其他目标。')
      }

      // 创建新目标
      const newGoal: LearningGoal = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        category: this.mapCategoryToOldFormat(formData.category),
        priority: formData.priority,
        status: 'active', // 新创建的目标默认激活
        targetLevel: this.mapTargetLevelToOldFormat(formData.targetLevel),
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 添加到coreData
      coreData.goals.push(newGoal)
      
      // 记录事件
      coreData.events.push({
        id: Date.now().toString(),
        type: 'goal_created',
        timestamp: new Date().toISOString(),
        details: { goalId: newGoal.id, title: newGoal.title, category: newGoal.category }
      })

      // 保存数据
      this.saveCoreData(coreData)

      // 转换回新格式返回
      return this.convertToNewFormat(newGoal)
    } catch (error) {
      console.error('[RefactorGoalService] Failed to create goal:', error)
      throw error
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(id: string, formData: Partial<GoalFormData>): Promise<Goal | null> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      const coreData = this.getCurrentCoreData()
      const goalIndex = coreData.goals.findIndex(g => g.id === id)
      
      if (goalIndex === -1) {
        return null
      }

      const currentGoal = coreData.goals[goalIndex]
      
      // 更新目标数据
      const updates: Partial<LearningGoal> = {
        updatedAt: new Date().toISOString()
      }
      
      if (formData.title !== undefined) updates.title = formData.title
      if (formData.description !== undefined) updates.description = formData.description
      if (formData.category !== undefined) updates.category = this.mapCategoryToOldFormat(formData.category)
      if (formData.priority !== undefined) updates.priority = formData.priority
      if (formData.targetLevel !== undefined) updates.targetLevel = this.mapTargetLevelToOldFormat(formData.targetLevel)
      if (formData.estimatedTimeWeeks !== undefined) updates.estimatedTimeWeeks = formData.estimatedTimeWeeks
      if (formData.requiredSkills !== undefined) updates.requiredSkills = formData.requiredSkills
      if (formData.outcomes !== undefined) updates.outcomes = formData.outcomes

      // 应用更新
      coreData.goals[goalIndex] = { ...currentGoal, ...updates }

      // 记录事件
      coreData.events.push({
        id: Date.now().toString(),
        type: 'goal_updated',
        timestamp: new Date().toISOString(),
        details: { goalId: id, title: currentGoal.title, updates: Object.keys(updates) }
      })

      // 保存数据
      this.saveCoreData(coreData)

      return this.convertToNewFormat(coreData.goals[goalIndex])
    } catch (error) {
      console.error('[RefactorGoalService] Failed to update goal:', error)
      throw error
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(id: string): Promise<boolean> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      const coreData = this.getCurrentCoreData()
      const goalIndex = coreData.goals.findIndex(g => g.id === id)
      
      if (goalIndex === -1) {
        return false
      }

      const goal = coreData.goals[goalIndex]
      
      // 删除目标
      coreData.goals.splice(goalIndex, 1)

      // 记录事件
      coreData.events.push({
        id: Date.now().toString(),
        type: 'goal_deleted',
        timestamp: new Date().toISOString(),
        details: { goalId: id, title: goal.title, category: goal.category }
      })

      // 保存数据
      this.saveCoreData(coreData)

      return true
    } catch (error) {
      console.error('[RefactorGoalService] Failed to delete goal:', error)
      throw error
    }
  }

  /**
   * 更改目标状态
   */
  async changeGoalStatus(id: string, status: Goal['status']): Promise<Goal | null> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      const coreData = this.getCurrentCoreData()
      const goalIndex = coreData.goals.findIndex(g => g.id === id)
      
      if (goalIndex === -1) {
        return null
      }

      const currentGoal = coreData.goals[goalIndex]
      
      // 检查激活目标数量限制
      if (status === 'active' && currentGoal.status !== 'active') {
        const activeGoals = coreData.goals.filter(g => g.status === 'active')
        if (activeGoals.length >= 3) {
          throw new Error('最多只能同时激活3个学习目标。请先暂停或完成其他目标。')
        }
      }

      // 映射状态
      const oldStatus = this.mapStatusToOldFormat(status)
      
      // 更新状态
      coreData.goals[goalIndex] = { 
        ...currentGoal, 
        status: oldStatus,
        updatedAt: new Date().toISOString() 
      }

      // 记录事件
      coreData.events.push({
        id: Date.now().toString(),
        type: 'goal_status_changed',
        timestamp: new Date().toISOString(),
        details: { 
          goalId: id, 
          oldStatus: currentGoal.status, 
          newStatus: oldStatus,
          title: currentGoal.title
        }
      })

      // 保存数据
      this.saveCoreData(coreData)

      return this.convertToNewFormat(coreData.goals[goalIndex])
    } catch (error) {
      console.error('[RefactorGoalService] Failed to change goal status:', error)
      throw error
    }
  }

  /**
   * 激活目标
   */
  async activateGoal(id: string): Promise<Goal | null> {
    return this.changeGoalStatus(id, 'active')
  }

  /**
   * 暂停目标
   */
  async pauseGoal(id: string): Promise<Goal | null> {
    return this.changeGoalStatus(id, 'paused')
  }

  /**
   * 完成目标
   */
  async completeGoal(id: string): Promise<Goal | null> {
    return this.changeGoalStatus(id, 'completed')
  }

  /**
   * 取消目标
   */
  async cancelGoal(id: string): Promise<Goal | null> {
    return this.changeGoalStatus(id, 'cancelled')
  }

  /**
   * 获取目标统计
   */
  getGoalStats() {
    try {
      const goals = this.getAllGoals()
      return {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        paused: goals.filter(g => g.status === 'paused').length,
        cancelled: goals.filter(g => g.status === 'cancelled').length,
        canActivateMore: goals.filter(g => g.status === 'active').length < 3
      }
    } catch (error) {
      console.error('[RefactorGoalService] Failed to get goal stats:', error)
      return {
        total: 0,
        active: 0,
        completed: 0,
        paused: 0,
        cancelled: 0,
        canActivateMore: true
      }
    }
  }

  /**
   * 批量操作
   */
  async batchUpdateStatus(goalIds: string[], status: Goal['status']): Promise<Goal[]> {
    const updatedGoals: Goal[] = []
    
    for (const id of goalIds) {
      try {
        const result = await this.changeGoalStatus(id, status)
        if (result) {
          updatedGoals.push(result)
        }
      } catch (error) {
        console.error(`[RefactorGoalService] Failed to update goal ${id}:`, error)
        // 继续处理其他目标，不中断批量操作
      }
    }
    
    return updatedGoals
  }

  /**
   * 批量删除
   */
  async batchDelete(goalIds: string[]): Promise<string[]> {
    const deletedIds: string[] = []
    
    for (const id of goalIds) {
      try {
        const success = await this.deleteGoal(id)
        if (success) {
          deletedIds.push(id)
        }
      } catch (error) {
        console.error(`[RefactorGoalService] Failed to delete goal ${id}:`, error)
        // 继续处理其他目标，不中断批量操作
      }
    }
    
    return deletedIds
  }

  /**
   * 私有方法：将老格式转换为新格式
   */
  private convertToNewFormat(oldGoal: LearningGoal): Goal {
    return {
      id: oldGoal.id,
      title: oldGoal.title,
      description: oldGoal.description,
      category: this.mapCategoryFromOldFormat(oldGoal.category),
      priority: oldGoal.priority,
      status: this.mapStatusFromOldFormat(oldGoal.status),
      targetLevel: this.mapTargetLevelFromOldFormat(oldGoal.targetLevel),
      estimatedTimeWeeks: oldGoal.estimatedTimeWeeks,
      requiredSkills: oldGoal.requiredSkills,
      outcomes: oldGoal.outcomes,
      progress: 0, // 新字段，老系统没有，默认为0
      createdAt: new Date(oldGoal.createdAt),
      updatedAt: new Date(oldGoal.updatedAt)
    }
  }

  /**
   * 类别映射：新格式 -> 老格式
   */
  private mapCategoryToOldFormat(category: string): LearningGoal['category'] {
    const mapping: Record<string, LearningGoal['category']> = {
      'frontend': 'frontend',
      'backend': 'backend',
      'fullstack': 'fullstack',
      'automation': 'automation',
      'ai': 'ai',
      'mobile': 'mobile',
      'game': 'game',
      'data': 'data'
    }
    return mapping[category] || 'custom'
  }

  /**
   * 类别映射：老格式 -> 新格式
   */
  private mapCategoryFromOldFormat(category: LearningGoal['category']): string {
    return category
  }

  /**
   * 目标级别映射：新格式 -> 老格式
   */
  private mapTargetLevelToOldFormat(level: string): LearningGoal['targetLevel'] {
    const mapping: Record<string, LearningGoal['targetLevel']> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced'
    }
    return mapping[level] || 'intermediate'
  }

  /**
   * 目标级别映射：老格式 -> 新格式
   */
  private mapTargetLevelFromOldFormat(level: LearningGoal['targetLevel']): Goal['targetLevel'] {
    // 老系统可能有expert级别，新系统只有三个级别
    if (level === 'expert') return 'advanced'
    return level as Goal['targetLevel']
  }

  /**
   * 状态映射：新格式 -> 老格式
   */
  private mapStatusToOldFormat(status: Goal['status']): LearningGoal['status'] {
    const mapping: Record<Goal['status'], LearningGoal['status']> = {
      'draft': 'paused', // 新系统的draft映射为老系统的paused
      'active': 'active',
      'paused': 'paused',
      'completed': 'completed',
      'cancelled': 'cancelled'
    }
    return mapping[status]
  }

  /**
   * 状态映射：老格式 -> 新格式
   */
  private mapStatusFromOldFormat(status: LearningGoal['status']): Goal['status'] {
    return status
  }
}

// 创建单例实例
export const refactorGoalService = new RefactorGoalService() 