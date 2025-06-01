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
 * 简化的API层示例
 * 
 * 这个文件演示了如何正确地创建API层来隔离UI组件和业务逻辑
 * 解决当前项目中的循环依赖问题
 * 
 * 使用示例：
 * ```typescript
 * import { simpleApi } from '@/api/simpleApi'
 * 
 * // 在组件中使用
 * const result = await simpleApi.createGoal(formData)
 * if (result.success) {
 *   console.log('Success:', result.data)
 * } else {
 *   console.error('Error:', result.error)
 * }
 * ```
 */

import { learningSystemService } from '../modules/learningSystem'
import { 
  getLearningGoals, 
  createLearningGoal, 
  updateLearningGoal, 
  deleteLearningGoal,
  getLearningPaths,
  createLearningPath,
  updateLearningPath
} from '../modules/coreData'
import { goalActivationManager } from '../modules/coreData/goalActivationManager'

/**
 * 统一的API响应格式
 */
export interface SimpleAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 简化的目标表单数据
 */
export interface SimpleGoalData {
  title: string
  description: string
  category: string
  priority: number
}

/**
 * 简化的API类
 */
export class SimpleAPI {
  private static instance: SimpleAPI

  private constructor() {}

  public static getInstance(): SimpleAPI {
    if (!SimpleAPI.instance) {
      SimpleAPI.instance = new SimpleAPI()
    }
    return SimpleAPI.instance
  }

  // ========== 系统状态 ==========
  
  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SimpleAPIResponse> {
    try {
      const status = await learningSystemService.getSystemStatus()
      return {
        success: true,
        data: status,
        message: '系统状态获取成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取系统状态失败'
      }
    }
  }

  // ========== 目标管理 ==========
  
  /**
   * 获取所有目标
   */
  getAllGoals(): SimpleAPIResponse {
    try {
      const goals = getLearningGoals()
      return {
        success: true,
        data: goals,
        message: `获取到 ${goals.length} 个目标`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标失败'
      }
    }
  }

  /**
   * 创建目标
   */
  async createGoal(goalData: SimpleGoalData): Promise<SimpleAPIResponse> {
    try {
      if (!goalData.title.trim()) {
        return {
          success: false,
          error: '目标标题不能为空'
        }
      }

      const newGoal = createLearningGoal({
        title: goalData.title,
        description: goalData.description,
        category: goalData.category as any,
        priority: goalData.priority,
        targetLevel: 'intermediate' as const,
        estimatedTimeWeeks: 8,
        requiredSkills: [],
        outcomes: [],
        status: 'active' as const
      })

      return {
        success: true,
        data: newGoal,
        message: `✅ 成功创建目标: ${goalData.title}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建目标失败'
      }
    }
  }

  /**
   * 激活目标
   */
  async activateGoal(goalId: string): Promise<SimpleAPIResponse> {
    try {
      const result = await goalActivationManager.activateGoal(goalId, {
        reason: 'api_activation'
      })

      return {
        success: result.success,
        data: result,
        message: result.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '激活目标失败'
      }
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalId: string): Promise<SimpleAPIResponse> {
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

  // ========== 路径管理 ==========
  
  /**
   * 获取所有路径
   */
  getAllPaths(): SimpleAPIResponse {
    try {
      const paths = getLearningPaths()
      return {
        success: true,
        data: paths,
        message: `获取到 ${paths.length} 个路径`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径失败'
      }
    }
  }

  /**
   * 为目标生成路径（简化版）
   */
  async generatePathForGoal(goalId: string): Promise<SimpleAPIResponse> {
    try {
      // 获取目标信息
      const goals = getLearningGoals()
      const goal = goals.find(g => g.id === goalId)
      
      if (!goal) {
        return {
          success: false,
          error: '目标不存在'
        }
      }

      // 创建简单的学习路径
      const newPath = createLearningPath({
        goalId: goalId,
        title: `${goal.title} - 学习路径`,
        description: `为目标"${goal.title}"生成的学习路径`,
        nodes: [
          {
            id: `node-${Date.now()}-1`,
            title: '基础学习',
            description: '掌握基础概念',
            type: 'concept',
            estimatedHours: 14,
            difficulty: 2,
            prerequisites: [],
            skills: [],
            resources: [],
            status: 'not_started',
            progress: 0
          },
          {
            id: `node-${Date.now()}-2`,
            title: '实践练习',
            description: '通过练习巩固知识',
            type: 'practice',
            estimatedHours: 28,
            difficulty: 3,
            prerequisites: [],
            skills: [],
            resources: [],
            status: 'not_started',
            progress: 0
          },
          {
            id: `node-${Date.now()}-3`,
            title: '项目实战',
            description: '完成实际项目',
            type: 'project',
            estimatedHours: 42,
            difficulty: 4,
            prerequisites: [],
            skills: [],
            resources: [],
            status: 'not_started',
            progress: 0
          }
        ],
        dependencies: [],
        milestones: [],
        status: 'active',
        totalEstimatedHours: 84,
        version: '1.0'
      })

      return {
        success: true,
        data: newPath,
        message: `✅ 为目标"${goal.title}"生成学习路径成功`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成学习路径失败'
      }
    }
  }

  // ========== AI对话 ==========
  
  /**
   * 与AI助手对话
   */
  async chatWithAI(message: string): Promise<SimpleAPIResponse> {
    try {
      const result = await learningSystemService.chatWithAgent(message)
      return {
        success: true,
        data: result,
        message: 'AI对话成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI对话失败'
      }
    }
  }

  // ========== 数据统计 ==========
  
  /**
   * 获取学习数据统计
   */
  getDataStats(): SimpleAPIResponse {
    try {
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
      const stats = {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalPaths: paths.length,
        activePaths: paths.filter(p => p.status === 'active').length,
        totalNodes: paths.reduce((sum, path) => sum + path.nodes.length, 0),
        completedNodes: paths.reduce((sum, path) => 
          sum + path.nodes.filter(n => n.status === 'completed').length, 0
        )
      }

      return {
        success: true,
        data: stats,
        message: '数据统计获取成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取数据统计失败'
      }
    }
  }
}

// 导出单例实例
export const simpleApi = SimpleAPI.getInstance()

// 导出类型定义已在文件开头定义，不需要重复导出 