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

/**
 * 目标管理API
 * 
 * 提供目标相关的所有操作接口：
 * - 目标CRUD操作
 * - 目标状态管理（激活、暂停、完成）
 * - 目标统计和分析
 */

import { 
  getLearningGoals, 
  createLearningGoal, 
  updateLearningGoal, 
  deleteLearningGoal,
  getGoalStatusStats,
  cancelGoal as cancelGoalService
} from '../modules/coreData'
import { 
  goalActivationManager,
  getActivationStats,
  ActivationResult,
  GoalActivationStats
} from '../modules/coreData/goalActivationManager'
import { LearningGoal } from '../modules/coreData/types'
import { GoalSettingService } from '../modules/goalSetting/service'
import { APIResponse } from './learningApi'

/**
 * 目标表单数据接口
 */
export interface GoalFormData {
  title: string
  description: string
  category: LearningGoal['category']
  priority: number
  targetLevel: LearningGoal['targetLevel']
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
}

/**
 * 目标管理API类
 */
export class GoalAPI {
  private static instance: GoalAPI
  private goalService: GoalSettingService

  private constructor() {
    this.goalService = new GoalSettingService()
  }

  public static getInstance(): GoalAPI {
    if (!GoalAPI.instance) {
      GoalAPI.instance = new GoalAPI()
    }
    return GoalAPI.instance
  }

  // ========== 目标CRUD操作 ==========

  /**
   * 获取所有学习目标
   */
  getAllGoals(): APIResponse<LearningGoal[]> {
    try {
      const goals = getLearningGoals()
      return {
        success: true,
        data: goals
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标列表失败'
      }
    }
  }

  /**
   * 根据ID获取单个目标
   */
  getGoalById(goalId: string): APIResponse<LearningGoal | null> {
    try {
      const goals = getLearningGoals()
      const goal = goals.find(g => g.id === goalId)
      return {
        success: true,
        data: goal || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标详情失败'
      }
    }
  }

  /**
   * 创建新的学习目标
   */
  async createGoal(formData: GoalFormData): Promise<APIResponse<LearningGoal>> {
    try {
      if (!formData.title.trim()) {
        return {
          success: false,
          error: '目标标题不能为空'
        }
      }

      // 构建目标推荐格式
      const goalRecommendation = {
        category: formData.category,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        reasoning: '用户手动创建的学习目标',
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes
      }

      // 通过GoalSetting服务创建目标
      await this.goalService.createGoal(goalRecommendation)

      // 获取刚创建的目标
      const goals = getLearningGoals()
      const newGoal = goals.find(g => g.title === formData.title)

      if (!newGoal) {
        throw new Error('目标创建后未找到')
      }

      return {
        success: true,
        data: newGoal,
        message: `✅ 成功创建目标: ${formData.title}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建目标失败'
      }
    }
  }

  /**
   * 更新目标信息
   */
  async updateGoal(goalId: string, updates: Partial<LearningGoal>): Promise<APIResponse<LearningGoal>> {
    try {
      const updatedGoal = await updateLearningGoal(goalId, updates)
      
      if (!updatedGoal) {
        return {
          success: false,
          error: '目标更新失败'
        }
      }

      return {
        success: true,
        data: updatedGoal,
        message: '✅ 目标更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新目标失败'
      }
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalId: string): Promise<APIResponse<boolean>> {
    try {
      const deleted = await deleteLearningGoal(goalId)
      
      if (!deleted) {
        return {
          success: false,
          error: '目标删除失败'
        }
      }

      return {
        success: true,
        data: true,
        message: '✅ 目标删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除目标失败'
      }
    }
  }

  // ========== 目标状态管理 ==========

  /**
   * 激活目标
   */
  async activateGoal(goalId: string, reason?: string): Promise<APIResponse<ActivationResult>> {
    try {
      const result = await goalActivationManager.activateGoal(goalId, {
        reason: reason || 'user_manual_activation'
      })

      return {
        success: result.success,
        data: result,
        message: result.message,
        error: result.success ? undefined : result.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '激活目标失败'
      }
    }
  }

  /**
   * 暂停目标
   */
  async pauseGoal(goalId: string, reason?: string): Promise<APIResponse<ActivationResult>> {
    try {
      const result = await goalActivationManager.pauseGoal(goalId, reason || 'user_manual_pause')

      return {
        success: result.success,
        data: result,
        message: result.message,
        error: result.success ? undefined : result.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '暂停目标失败'
      }
    }
  }

  /**
   * 完成目标
   */
  async completeGoal(goalId: string, achievements?: string[]): Promise<APIResponse<ActivationResult>> {
    try {
      const result = await goalActivationManager.completeGoal(goalId, achievements)

      return {
        success: result.success,
        data: result,
        message: result.message,
        error: result.success ? undefined : result.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '完成目标失败'
      }
    }
  }

  /**
   * 取消目标
   */
  async cancelGoal(goalId: string, reason?: string): Promise<APIResponse<ActivationResult>> {
    try {
      const result = cancelGoalService(goalId)
      
      if (!result) {
        return {
          success: false,
          error: '取消目标失败'
        }
      }

      // 构造符合ActivationResult格式的响应
      const activationResult: ActivationResult = {
        success: true,
        goalId: goalId,
        oldStatus: 'active', // 假设之前是active状态
        newStatus: 'cancelled',
        message: `目标"${result.title}"已取消`,
        warnings: [],
        affectedPaths: [],
        systemRecommendations: reason ? [`取消原因: ${reason}`] : []
      }

      return {
        success: true,
        data: activationResult,
        message: activationResult.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消目标失败'
      }
    }
  }

  // ========== 目标统计和分析 ==========

  /**
   * 获取目标状态统计
   */
  getGoalStats(): APIResponse<any> {
    try {
      const stats = getGoalStatusStats()
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标统计失败'
      }
    }
  }

  /**
   * 获取激活状态统计
   */
  getActivationStats(): APIResponse<GoalActivationStats> {
    try {
      const stats = getActivationStats()
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取激活统计失败'
      }
    }
  }

  /**
   * 获取目标类别列表
   */
  getGoalCategories(): APIResponse<any[]> {
    try {
      const categories = this.goalService.getCategories()
      return {
        success: true,
        data: categories
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标类别失败'
      }
    }
  }

  /**
   * 获取问卷题目
   */
  getQuestionnaire(): APIResponse<any[]> {
    try {
      const questionnaire = this.goalService.getQuestionnaire()
      return {
        success: true,
        data: questionnaire
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷失败'
      }
    }
  }

  /**
   * 生成目标推荐
   */
  async generateGoalRecommendations(
    selectedCategories: string[],
    questionnaireAnswers: Record<string, any>
  ): Promise<APIResponse<any[]>> {
    try {
      const recommendations = await this.goalService.generateGoalRecommendations(
        selectedCategories,
        questionnaireAnswers
      )
      return {
        success: true,
        data: recommendations
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成目标推荐失败'
      }
    }
  }

  /**
   * 获取活跃目标列表
   */
  getActiveGoals(): APIResponse<LearningGoal[]> {
    try {
      const goals = getLearningGoals()
      const activeGoals = goals.filter(g => g.status === 'active')
      return {
        success: true,
        data: activeGoals
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取活跃目标失败'
      }
    }
  }

  /**
   * 检查是否可以激活更多目标
   */
  canActivateMoreGoals(): APIResponse<{
    canActivate: boolean
    activeCount: number
    maxAllowed: number
    remaining: number
  }> {
    try {
      const stats = getActivationStats()
      const canActivate = stats.active < stats.maxActive
      
      return {
        success: true,
        data: {
          canActivate,
          activeCount: stats.active,
          maxAllowed: stats.maxActive,
          remaining: stats.maxActive - stats.active
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查激活限制失败'
      }
    }
  }
}

// 导出单例实例
export const goalApi = GoalAPI.getInstance()

// 导出类型定义（移除重复导出）
export type { ActivationResult, GoalActivationStats } 