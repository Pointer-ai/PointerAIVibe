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
 * 路径管理API
 * 
 * 提供学习路径相关的所有操作接口：
 * - 路径CRUD操作
 * - 路径状态管理（激活、冻结、归档）
 * - 路径进度跟踪
 * - 节点管理
 */

import { 
  getLearningPaths, 
  createLearningPath, 
  updateLearningPath, 
  deleteLearningPath,
  getLearningGoals
} from '../modules/coreData'
import { LearningPath, LearningGoal } from '../modules/coreData/types'
import { PathPlanService } from '../modules/pathPlan/service'
import { APIResponse } from './learningApi'

/**
 * 路径进度统计接口
 */
export interface PathProgressStats {
  pathId: string
  title: string
  totalNodes: number
  completedNodes: number
  inProgressNodes: number
  progressPercentage: number
  status: string
  goalTitle?: string
}

/**
 * 路径管理API类
 */
export class PathAPI {
  private static instance: PathAPI
  private pathService: PathPlanService

  private constructor() {
    this.pathService = new PathPlanService()
  }

  public static getInstance(): PathAPI {
    if (!PathAPI.instance) {
      PathAPI.instance = new PathAPI()
    }
    return PathAPI.instance
  }

  // ========== 路径CRUD操作 ==========

  /**
   * 获取所有学习路径
   */
  getAllPaths(): APIResponse<LearningPath[]> {
    try {
      const paths = getLearningPaths()
      return {
        success: true,
        data: paths
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径列表失败'
      }
    }
  }

  /**
   * 根据ID获取单个路径
   */
  getPathById(pathId: string): APIResponse<LearningPath | null> {
    try {
      const paths = getLearningPaths()
      const path = paths.find(p => p.id === pathId)
      return {
        success: true,
        data: path || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径详情失败'
      }
    }
  }

  /**
   * 根据目标ID获取相关路径
   */
  getPathsByGoalId(goalId: string): APIResponse<LearningPath[]> {
    try {
      const paths = getLearningPaths()
      const goalPaths = paths.filter(p => p.goalId === goalId)
      return {
        success: true,
        data: goalPaths
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标相关路径失败'
      }
    }
  }

  /**
   * 为目标生成学习路径
   */
  async generatePathForGoal(goalId: string, config?: any): Promise<APIResponse<LearningPath>> {
    try {
      const path = await this.pathService.generateLearningPath(goalId, config || {
        learningStyle: 'balanced',
        timePreference: 'moderate',
        difficultyProgression: 'linear',
        includeProjects: true,
        includeMilestones: true
      })

      return {
        success: true,
        data: path,
        message: '✅ 学习路径生成成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成学习路径失败'
      }
    }
  }

  /**
   * 更新路径信息
   */
  async updatePath(pathId: string, updates: Partial<LearningPath>): Promise<APIResponse<LearningPath>> {
    try {
      const updatedPath = await updateLearningPath(pathId, updates)
      
      if (!updatedPath) {
        return {
          success: false,
          error: '路径更新失败'
        }
      }

      return {
        success: true,
        data: updatedPath,
        message: '✅ 路径更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新路径失败'
      }
    }
  }

  /**
   * 删除路径
   */
  async deletePath(pathId: string): Promise<APIResponse<boolean>> {
    try {
      const deleted = await deleteLearningPath(pathId)
      
      if (!deleted) {
        return {
          success: false,
          error: '路径删除失败'
        }
      }

      return {
        success: true,
        data: true,
        message: '✅ 路径删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除路径失败'
      }
    }
  }

  // ========== 路径状态管理 ==========

  /**
   * 激活路径
   */
  async activatePath(pathId: string): Promise<APIResponse<LearningPath>> {
    try {
      // 首先将相同目标的其他路径设为冻结状态
      const path = this.getPathById(pathId)
      if (!path.success || !path.data) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const relatedPaths = this.getPathsByGoalId(path.data.goalId)
      if (relatedPaths.success && relatedPaths.data) {
        for (const relatedPath of relatedPaths.data) {
          if (relatedPath.id !== pathId && relatedPath.status === 'active') {
            await this.updatePath(relatedPath.id, { status: 'frozen' })
          }
        }
      }

      // 激活当前路径
      const updatedPath = await this.updatePath(pathId, { 
        status: 'active',
        updatedAt: new Date().toISOString()
      })

      return {
        success: updatedPath.success,
        data: updatedPath.data,
        message: updatedPath.success ? '✅ 路径激活成功' : updatedPath.error,
        error: updatedPath.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '激活路径失败'
      }
    }
  }

  /**
   * 冻结路径
   */
  async freezePath(pathId: string): Promise<APIResponse<LearningPath>> {
    try {
      const updatedPath = await this.updatePath(pathId, { 
        status: 'frozen',
        updatedAt: new Date().toISOString()
      })

      return {
        success: updatedPath.success,
        data: updatedPath.data,
        message: updatedPath.success ? '✅ 路径冻结成功' : updatedPath.error,
        error: updatedPath.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '冻结路径失败'
      }
    }
  }

  /**
   * 归档路径
   */
  async archivePath(pathId: string): Promise<APIResponse<LearningPath>> {
    try {
      const updatedPath = await this.updatePath(pathId, { 
        status: 'archived',
        updatedAt: new Date().toISOString()
      })

      return {
        success: updatedPath.success,
        data: updatedPath.data,
        message: updatedPath.success ? '✅ 路径归档成功' : updatedPath.error,
        error: updatedPath.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '归档路径失败'
      }
    }
  }

  // ========== 路径进度管理 ==========

  /**
   * 获取路径进度统计
   */
  getPathProgress(pathId: string): APIResponse<PathProgressStats> {
    try {
      const path = this.getPathById(pathId)
      if (!path.success || !path.data) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const pathData = path.data
      const totalNodes = pathData.nodes.length
      const completedNodes = pathData.nodes.filter(n => n.status === 'completed').length
      const inProgressNodes = pathData.nodes.filter(n => n.status === 'in_progress').length
      const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0

      // 获取关联目标信息
      const goals = getLearningGoals()
      const relatedGoal = goals.find(g => g.id === pathData.goalId)

      const progressStats: PathProgressStats = {
        pathId: pathData.id,
        title: pathData.title,
        totalNodes,
        completedNodes,
        inProgressNodes,
        progressPercentage,
        status: pathData.status,
        goalTitle: relatedGoal?.title
      }

      return {
        success: true,
        data: progressStats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径进度失败'
      }
    }
  }

  /**
   * 获取所有路径的进度统计
   */
  getAllPathsProgress(): APIResponse<PathProgressStats[]> {
    try {
      const paths = getLearningPaths()
      const progressStats: PathProgressStats[] = []

      for (const path of paths) {
        const progress = this.getPathProgress(path.id)
        if (progress.success && progress.data) {
          progressStats.push(progress.data)
        }
      }

      return {
        success: true,
        data: progressStats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取所有路径进度失败'
      }
    }
  }

  /**
   * 更新节点状态
   */
  async updateNodeStatus(pathId: string, nodeId: string, status: 'not_started' | 'in_progress' | 'completed' | 'skipped'): Promise<APIResponse<LearningPath>> {
    try {
      const path = this.getPathById(pathId)
      if (!path.success || !path.data) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const pathData = path.data
      const nodeIndex = pathData.nodes.findIndex(n => n.id === nodeId)
      
      if (nodeIndex === -1) {
        return {
          success: false,
          error: '节点不存在'
        }
      }

      // 更新节点状态
      const updatedNodes = [...pathData.nodes]
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        status
      }

      // 如果节点完成，更新完成时间
      if (status === 'completed') {
        updatedNodes[nodeIndex].completedAt = new Date().toISOString()
      }

      // 更新路径
      const updatedPath = await this.updatePath(pathId, { 
        nodes: updatedNodes,
        updatedAt: new Date().toISOString()
      })

      return {
        success: updatedPath.success,
        data: updatedPath.data,
        message: updatedPath.success ? '✅ 节点状态更新成功' : updatedPath.error,
        error: updatedPath.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新节点状态失败'
      }
    }
  }

  /**
   * 获取活跃路径列表
   */
  getActivePaths(): APIResponse<LearningPath[]> {
    try {
      const paths = getLearningPaths()
      const activePaths = paths.filter(p => p.status === 'active')
      return {
        success: true,
        data: activePaths
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取活跃路径失败'
      }
    }
  }

  /**
   * 获取路径建议（哪些目标需要生成路径）
   */
  getPathRecommendations(): APIResponse<{
    needsPath: LearningGoal[]
    hasPath: LearningGoal[]
    suggestions: string[]
  }> {
    try {
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
      const activeGoals = goals.filter(g => g.status === 'active')
      const needsPath: LearningGoal[] = []
      const hasPath: LearningGoal[] = []
      const suggestions: string[] = []

      for (const goal of activeGoals) {
        const goalPaths = paths.filter(p => p.goalId === goal.id && p.status !== 'archived')
        
        if (goalPaths.length === 0) {
          needsPath.push(goal)
          suggestions.push(`为目标"${goal.title}"生成学习路径`)
        } else {
          hasPath.push(goal)
          const activePath = goalPaths.find(p => p.status === 'active')
          if (!activePath) {
            suggestions.push(`激活目标"${goal.title}"的学习路径`)
          }
        }
      }

      return {
        success: true,
        data: {
          needsPath,
          hasPath,
          suggestions
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径建议失败'
      }
    }
  }
}

// 导出单例实例
export const pathApi = PathAPI.getInstance()

// 导出类型定义已在文件开头定义，不需要重复导出 