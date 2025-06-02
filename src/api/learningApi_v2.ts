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
 * Learning API v2.0 - 重构后的统一API层
 * 
 * 新架构特点：
 * - 移除 learningSystem 中间层
 * - 直接使用 dataManager 进行数据操作
 * - 集成 AI 交互功能
 * - 简化的错误处理和状态管理
 * - 统一的接口设计
 */

import { log } from '../utils/logger'
import { dataManager } from './data'
import type { 
  LearningGoal, 
  LearningPath, 
  CourseUnit,
  CreateGoalData,
  CreatePathData,
  SystemStatus,
  AbilityProfile,
  SyncResult
} from './data/types'

// 导入AI相关功能 (待实现)
// import { aiManager } from './ai'
// import type { ChatContext, ChatResponse } from './ai/types'

// 导入Profile相关功能
import {
  getProfiles as getOriginalProfiles,
  getCurrentProfile as getOriginalCurrentProfile,
  getCurrentProfileId as getOriginalCurrentProfileId,
  createProfile as createOriginalProfile,
  setCurrentProfile as setOriginalCurrentProfile,
  updateProfile as updateOriginalProfile,
  deleteProfile as deleteOriginalProfile,
  getProfileData,
  setProfileData,
  Profile as OriginalProfile
} from '../utils/profile'

import {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  ProfileStats,
  ProfileSettings,
} from '../refactor/types/profile'

/**
 * API响应统一格式
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

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
 * 能力概要接口
 */
export interface AbilitySummary {
  hasAssessment: boolean
  overallScore: number
  level: string
  assessmentDate: string | null
  needsAssessment: boolean
  strengths?: string[]
  improvements?: string[]
  confidence?: number
}

/**
 * Learning API v2.0 主类
 * 重构后的统一API，提供所有学习相关功能的访问入口
 */
export class LearningAPIv2 {
  private static instance: LearningAPIv2
  private dataManager: typeof dataManager
  // private aiManager: typeof aiManager (待实现)
  private profileSwitchListeners: (() => void)[] = []
  
  private constructor() {
    this.dataManager = dataManager
    log('[LearningAPIv2] Initialized with new architecture')
  }
  
  public static getInstance(): LearningAPIv2 {
    if (!LearningAPIv2.instance) {
      LearningAPIv2.instance = new LearningAPIv2()
    }
    return LearningAPIv2.instance
  }

  // ========== 系统状态管理 ==========
  
  /**
   * 获取系统完整状态
   */
  async getSystemStatus(): Promise<APIResponse<SystemStatus>> {
    try {
      const status = await this.dataManager.getSystemStatus()
      return {
        success: true,
        data: status
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取系统状态失败'
      }
    }
  }

  /**
   * 获取智能学习建议
   */
  async getSmartRecommendations(): Promise<APIResponse<{
    needsAbilityAssessment: boolean
    needsGoalSetting: boolean
    needsPathGeneration: boolean
    recommendations: string[]
  }>> {
    try {
      const status = await this.dataManager.getSystemStatus()
      
      const needsAbilityAssessment = !status.progress.hasAbilityProfile
      const needsGoalSetting = status.progress.activeGoals === 0
      const needsPathGeneration = status.progress.activeGoals > 0 && status.progress.activePaths === 0
      
      return {
        success: true,
        data: {
          needsAbilityAssessment,
          needsGoalSetting,
          needsPathGeneration,
          recommendations: status.recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取智能建议失败'
      }
    }
  }

  // ========== AI对话功能 (待实现) ==========
  
  /**
   * 与AI助手对话
   */
  async chatWithAgent(userMessage: string, context?: any): Promise<APIResponse<any>> {
    try {
      // TODO: 实现AI对话功能
      // const result = await this.aiManager.processMessage(userMessage, context)
      
      // 临时返回模拟响应
      return {
        success: true,
        data: {
          response: `我理解您说的"${userMessage}"。AI对话功能正在重构中，敬请期待！`,
          toolsUsed: [],
          suggestions: ['查看系统状态', '管理学习目标', '生成学习路径'],
          systemStatus: await this.getSystemStatus()
        },
        message: 'AI对话功能开发中'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI对话失败'
      }
    }
  }

  /**
   * 获取对话历史
   */
  getInteractionHistory(): APIResponse<any[]> {
    try {
      // TODO: 实现对话历史功能
      return {
        success: true,
        data: [],
        message: '对话历史功能开发中'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取对话历史失败'
      }
    }
  }

  /**
   * 清空对话历史
   */
  clearInteractionHistory(): APIResponse<boolean> {
    try {
      // TODO: 实现清空对话历史功能
      return {
        success: true,
        data: true,
        message: '对话历史已清空'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '清空对话历史失败'
      }
    }
  }

  // ========== 目标管理 CRUD 操作 ==========
  
  /**
   * 获取所有学习目标
   */
  async getAllGoals(): Promise<APIResponse<LearningGoal[]>> {
    try {
      const goals = await this.dataManager.getAllGoals()
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
  async getGoalById(goalId: string): Promise<APIResponse<LearningGoal | null>> {
    try {
      const goal = await this.dataManager.goals.getById(goalId)
      return {
        success: true,
        data: goal
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

      const goalData: CreateGoalData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetLevel: formData.targetLevel,
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes
      }

      const newGoal = await this.dataManager.createGoal(goalData)

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
      const updatedGoal = await this.dataManager.updateGoal(goalId, updates)
      
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
      const deleted = await this.dataManager.deleteGoal(goalId)
      
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
  async activateGoal(goalId: string, reason?: string): Promise<APIResponse<LearningGoal>> {
    try {
      const goal = await this.dataManager.goals.activate(goalId)
      
      return {
        success: true,
        data: goal,
        message: '✅ 目标激活成功'
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
  async pauseGoal(goalId: string, reason?: string): Promise<APIResponse<LearningGoal>> {
    try {
      const goal = await this.dataManager.goals.pause(goalId)
      
      return {
        success: true,
        data: goal,
        message: '✅ 目标暂停成功'
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
  async completeGoal(goalId: string, achievements?: string[]): Promise<APIResponse<LearningGoal>> {
    try {
      const goal = await this.dataManager.goals.complete(goalId)
      
      return {
        success: true,
        data: goal,
        message: '🎉 目标完成，恭喜！'
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
  async cancelGoal(goalId: string, reason?: string): Promise<APIResponse<LearningGoal>> {
    try {
      const goal = await this.dataManager.goals.cancel(goalId)
      
      return {
        success: true,
        data: goal,
        message: '✅ 目标取消成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消目标失败'
      }
    }
  }

  /**
   * 获取激活的目标
   */
  async getActiveGoals(): Promise<APIResponse<LearningGoal[]>> {
    try {
      const activeGoals = await this.dataManager.getActiveGoals()
      return {
        success: true,
        data: activeGoals
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取激活目标失败'
      }
    }
  }

  /**
   * 检查是否可以激活更多目标
   */
  async canActivateMoreGoals(): Promise<APIResponse<{
    canActivate: boolean
    activeCount: number
    maxAllowed: number
    remaining: number
  }>> {
    try {
      const activeGoals = await this.dataManager.getActiveGoals()
      const maxAllowed = 3 // 最多3个活跃目标
      const activeCount = activeGoals.length
      const canActivate = activeCount < maxAllowed
      
      return {
        success: true,
        data: {
          canActivate,
          activeCount,
          maxAllowed,
          remaining: maxAllowed - activeCount
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查激活状态失败'
      }
    }
  }

  /**
   * 获取目标统计信息
   */
  async getGoalStats(): Promise<APIResponse<any>> {
    try {
      const stats = await this.dataManager.goals.getStats()
      
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

  // ========== 路径管理 CRUD 操作 ==========

  /**
   * 获取所有学习路径
   */
  async getAllPaths(): Promise<APIResponse<LearningPath[]>> {
    try {
      const paths = await this.dataManager.getAllPaths()
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
  async getPathById(pathId: string): Promise<APIResponse<LearningPath | null>> {
    try {
      const path = await this.dataManager.getAllPaths().then(paths => paths.find(p => p.id === pathId))
      if (!path) {
        return {
          success: false,
          error: '路径不存在'
        }
      }
      return {
        success: true,
        data: path
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
  async getPathsByGoalId(goalId: string): Promise<APIResponse<LearningPath[]>> {
    try {
      const paths = await this.dataManager.getPathsByGoalId(goalId)
      return {
        success: true,
        data: paths
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
      // TODO: 实现路径生成服务
      // const path = await this.pathGenerationService.generate(goalId, config)
      
      // 临时创建基本路径
      const goal = await this.dataManager.goals.getById(goalId)
      if (!goal) {
        throw new Error('目标不存在')
      }

      const pathData: CreatePathData = {
        goalId,
        title: `${goal.title} - 学习路径`,
        description: `为目标"${goal.title}"自动生成的学习路径`,
        config
      }

      const path = await this.dataManager.createPath(pathData)

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
      const updatedPath = await this.dataManager.updatePath(pathId, updates)
      
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
      const deleted = await this.dataManager.deletePath(pathId)
      
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
      // 首先冻结同一目标的其他路径
      const path = await this.dataManager.getAllPaths().then(paths => paths.find(p => p.id === pathId))
      if (!path) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      // 冻结同一目标的其他活跃路径
      const samePaths = await this.dataManager.getPathsByGoalId(path.goalId)
      for (const samePath of samePaths) {
        if (samePath.id !== pathId && samePath.status === 'active') {
          await this.dataManager.updatePath(samePath.id, { status: 'frozen' })
        }
      }

      // 激活当前路径
      const updatedPath = await this.dataManager.updatePath(pathId, { status: 'active' })
      
      return {
        success: true,
        data: updatedPath,
        message: '✅ 路径激活成功'
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
      const updatedPath = await this.dataManager.updatePath(pathId, { status: 'frozen' })
      
      return {
        success: true,
        data: updatedPath,
        message: '❄️ 路径已冻结'
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
      const updatedPath = await this.dataManager.updatePath(pathId, { 
        status: 'archived',
        updatedAt: new Date().toISOString()
      })
      
      return {
        success: true,
        data: updatedPath,
        message: '📦 路径已归档'
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
   * 获取路径进度
   */
  async getPathProgress(pathId: string): Promise<APIResponse<PathProgressStats>> {
    try {
      const path = await this.dataManager.getAllPaths().then(paths => paths.find(p => p.id === pathId))
      if (!path) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const totalNodes = path.nodes.length
      const completedNodes = path.nodes.filter(node => node.status === 'completed').length
      const inProgressNodes = path.nodes.filter(node => node.status === 'in_progress').length
      const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0

      // 获取关联目标信息
      const goal = await this.dataManager.goals.getById(path.goalId)

      const stats: PathProgressStats = {
        pathId,
        title: path.title,
        totalNodes,
        completedNodes,
        inProgressNodes,
        progressPercentage,
        status: path.status,
        goalTitle: goal?.title
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径进度失败'
      }
    }
  }

  /**
   * 获取所有路径进度
   */
  async getAllPathsProgress(): Promise<APIResponse<PathProgressStats[]>> {
    try {
      const paths = await this.dataManager.getAllPaths()
      const progressStats: PathProgressStats[] = []

      for (const path of paths) {
        const result = await this.getPathProgress(path.id)
        if (result.success && result.data) {
          progressStats.push(result.data)
        }
      }

      return {
        success: true,
        data: progressStats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取路径进度统计失败'
      }
    }
  }

  /**
   * 更新节点状态
   */
  async updateNodeStatus(
    pathId: string, 
    nodeId: string, 
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<APIResponse<LearningPath>> {
    try {
      const path = await this.dataManager.getAllPaths().then(paths => paths.find(p => p.id === pathId))
      if (!path) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const nodeIndex = path.nodes.findIndex(node => node.id === nodeId)
      if (nodeIndex === -1) {
        return {
          success: false,
          error: '节点不存在'
        }
      }

      // 更新节点状态
      const updatedNodes = [...path.nodes]
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        status
      }

      // 如果标记为完成，添加完成时间
      if (status === 'completed') {
        updatedNodes[nodeIndex].completedAt = new Date().toISOString()
      }

      const updatedPath = await this.dataManager.updatePath(pathId, { 
        nodes: updatedNodes,
        updatedAt: new Date().toISOString()
      })

      return {
        success: true,
        data: updatedPath,
        message: `✅ 节点状态已更新为: ${status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : status === 'skipped' ? '已跳过' : '未开始'}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新节点状态失败'
      }
    }
  }

  /**
   * 获取激活的路径
   */
  async getActivePaths(): Promise<APIResponse<LearningPath[]>> {
    try {
      const paths = await this.dataManager.getAllPaths()
      const activePaths = paths.filter(path => path.status === 'active')
      return {
        success: true,
        data: activePaths
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取激活路径失败'
      }
    }
  }

  /**
   * 获取路径推荐
   */
  async getPathRecommendations(): Promise<APIResponse<{
    needsPath: LearningGoal[]
    hasPath: LearningGoal[]
    suggestions: string[]
  }>> {
    try {
      const goals = await this.dataManager.getAllGoals()
      const paths = await this.dataManager.getAllPaths()
      
      const needsPath = goals.filter(goal => 
        goal.status === 'active' && 
        !paths.some(path => path.goalId === goal.id && path.status !== 'archived')
      )
      
      const hasPath = goals.filter(goal =>
        paths.some(path => path.goalId === goal.id && path.status !== 'archived')
      )

      const suggestions = [
        ...(needsPath.length > 0 ? [`为 ${needsPath.length} 个目标生成学习路径`] : []),
        ...(hasPath.length > 0 ? [`继续学习现有的 ${hasPath.length} 个路径`] : []),
        '检查路径进度并更新节点状态',
        '考虑调整学习路径的难度和节奏'
      ]

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
        error: error instanceof Error ? error.message : '获取路径推荐失败'
      }
    }
  }

  // ========== 能力评估 ==========
  
  /**
   * 获取能力概要
   */
  async getAbilitySummary(): Promise<APIResponse<AbilitySummary>> {
    try {
      const abilityProfile = await this.dataManager.getAbilityProfile()
      
      if (!abilityProfile) {
        return {
          success: true,
          data: {
            hasAssessment: false,
            overallScore: 0,
            level: 'unknown',
            assessmentDate: null,
            needsAssessment: true
          }
        }
      }

      const summary: AbilitySummary = {
        hasAssessment: true,
        overallScore: abilityProfile.overallScore,
        level: this.getScoreLevel(abilityProfile.overallScore),
        assessmentDate: abilityProfile.lastUpdated,
        needsAssessment: false,
        strengths: abilityProfile.strengths,
        improvements: abilityProfile.improvements,
        confidence: abilityProfile.confidence
      }

      return {
        success: true,
        data: summary
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取能力概要失败'
      }
    }
  }

  /**
   * 执行能力评估
   */
  async executeAbilityAssessment(input: any): Promise<APIResponse<any>> {
    try {
      // TODO: 实现能力评估引擎
      // const result = await this.assessmentEngine.execute(input)
      
      // 临时返回模拟结果
      const mockProfile: AbilityProfile = {
        id: `assessment_${Date.now()}`,
        overallScore: Math.floor(Math.random() * 40) + 30, // 30-70分
        dimensions: {
          programming: { score: 60, weight: 0.4, details: {} },
          algorithms: { score: 45, weight: 0.3, details: {} },
          systemDesign: { score: 50, weight: 0.3, details: {} }
        },
        strengths: ['编程基础', '逻辑思维'],
        improvements: ['算法优化', '系统设计'],
        recommendations: ['加强算法练习', '学习设计模式'],
        lastUpdated: new Date().toISOString(),
        confidence: 0.8
      }

      await this.dataManager.updateAbilityProfile(mockProfile)
      
      return {
        success: true,
        data: {
          assessment: mockProfile,
          systemStatus: await this.getSystemStatus(),
          nextRecommendations: mockProfile.recommendations,
          message: '能力评估完成！系统已为您分析当前技能水平，可以开始设定学习目标。'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '能力评估执行失败'
      }
    }
  }

  /**
   * 更新能力评估
   */
  async updateAbilityAssessment(updates: Partial<AbilityProfile>): Promise<APIResponse<any>> {
    try {
      const currentProfile = await this.dataManager.getAbilityProfile()
      if (!currentProfile) {
        throw new Error('尚未完成能力评估')
      }

      const updatedProfile = { ...currentProfile, ...updates }
      await this.dataManager.updateAbilityProfile(updatedProfile)
      
      return {
        success: true,
        data: {
          assessment: updatedProfile,
          systemStatus: await this.getSystemStatus(),
          message: '能力评估已更新，建议重新检查学习目标匹配度。'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新能力评估失败'
      }
    }
  }

  // ========== 数据同步和验证 ==========
  
  /**
   * 验证数据同步
   */
  async validateDataSync(): Promise<APIResponse<{
    isValid: boolean
    issues: string[]
    warnings: string[]
  }>> {
    try {
      const result = await this.dataManager.validateData()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '数据同步验证失败'
      }
    }
  }

  /**
   * 强制同步所有数据
   */
  async forceSyncAllData(): Promise<APIResponse<SyncResult>> {
    try {
      const result = await this.dataManager.forceSync()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '强制同步数据失败'
      }
    }
  }

  // ========== Profile 管理功能 (保持兼容) ==========

  /**
   * 获取所有Profile
   */
  getAllProfiles(): APIResponse<Profile[]> {
    try {
      const originalProfiles = getOriginalProfiles()
      const profiles = originalProfiles.map(original => this.convertProfileToNewFormat(original))
      return {
        success: true,
        data: profiles
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取Profile列表失败'
      }
    }
  }

  /**
   * 获取当前活跃Profile
   */
  getCurrentProfile(): APIResponse<Profile | null> {
    try {
      const originalProfile = getOriginalCurrentProfile()
      if (!originalProfile) {
        return {
          success: true,
          data: null
        }
      }
      const profile = this.convertProfileToNewFormat(originalProfile)
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取当前Profile失败'
      }
    }
  }

  /**
   * 切换活跃Profile
   */
  async switchProfile(id: string): Promise<APIResponse<boolean>> {
    try {
      const profiles = this.getAllProfiles()
      if (!profiles.success || !profiles.data) {
        return {
          success: false,
          error: 'Profile列表获取失败'
        }
      }

      const profile = profiles.data.find(p => p.id === id)
      if (!profile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 使用原系统切换Profile
      setOriginalCurrentProfile(id)

      // 清除缓存以确保数据同步
      this.dataManager.clearCache()

      // 通知监听器
      this.notifyProfileSwitchListeners()

      return {
        success: true,
        data: true,
        message: `已切换到Profile: ${profile.name}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile切换失败'
      }
    }
  }

  // ========== 目标推荐功能 ==========
  
  /**
   * 获取目标类别
   */
  async getGoalCategories(): Promise<APIResponse<any[]>> {
    try {
      // TODO: 实现目标类别服务
      // const categories = await this.goalCategoryService.getCategories()
      
      // 临时返回静态类别
      const categories = [
        { id: 'frontend', name: '前端开发', description: '用户界面和用户体验开发' },
        { id: 'backend', name: '后端开发', description: '服务器端和数据库开发' },
        { id: 'fullstack', name: '全栈开发', description: '前后端完整开发技能' },
        { id: 'mobile', name: '移动开发', description: 'iOS和Android应用开发' },
        { id: 'devops', name: 'DevOps', description: '开发运维和系统管理' },
        { id: 'data', name: '数据科学', description: '数据分析和机器学习' },
        { id: 'algorithms', name: '算法竞赛', description: '算法和数据结构' }
      ]
      
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
   * 生成目标推荐
   */
  async generateGoalRecommendations(
    selectedCategories: string[],
    questionnaireAnswers: Record<string, any>
  ): Promise<APIResponse<any[]>> {
    try {
      // TODO: 实现目标推荐引擎
      // const recommendations = await this.goalRecommendationEngine.generate(selectedCategories, questionnaireAnswers)
      
      // 临时返回模拟推荐
      const mockRecommendations = selectedCategories.map((category, index) => ({
        category,
        title: `${category}高级开发者`,
        description: `成为优秀的${category}开发者，掌握核心技术栈`,
        priority: index + 1,
        reasoning: `基于您的兴趣和当前技能水平推荐`,
        estimatedTimeWeeks: 12 + Math.floor(Math.random() * 12),
        requiredSkills: [`${category}基础`, '编程思维', '问题解决'],
        outcomes: [`掌握${category}核心技能`, '能够独立开发项目', '具备团队协作能力']
      }))

      return {
        success: true,
        data: mockRecommendations
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成目标推荐失败'
      }
    }
  }

  // ========== 路径分析功能 ==========
  
  /**
   * 分析技能差距
   */
  async analyzeSkillGap(goalId: string): Promise<APIResponse<any>> {
    try {
      const goals = await this.dataManager.getAllGoals()
      const goal = goals.find(g => g.id === goalId)
      if (!goal) {
        return {
          success: false,
          error: '目标不存在'
        }
      }

      const abilityProfile = await this.dataManager.getAbilityProfile()
      
      // TODO: 实现技能差距分析引擎
      // const analysis = await this.skillGapAnalysisEngine.analyze(goal, abilityProfile)
      
      // 临时返回模拟分析
      const mockAnalysis = {
        goalId,
        currentLevel: abilityProfile ? this.getScoreLevel(abilityProfile.overallScore) : 'beginner',
        targetLevel: goal.targetLevel,
        skillGaps: [
          {
            skill: '编程基础',
            currentScore: 60,
            targetScore: 80,
            gap: 20,
            priority: 'high'
          },
          {
            skill: '算法思维',
            currentScore: 40,
            targetScore: 70,
            gap: 30,
            priority: 'medium'
          }
        ],
        recommendations: [
          '加强基础编程练习',
          '学习常用算法和数据结构',
          '参与实际项目开发'
        ],
        estimatedTime: goal.estimatedTimeWeeks,
        confidence: 0.8
      }

      return {
        success: true,
        data: mockAnalysis
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '技能差距分析失败'
      }
    }
  }

  // ========== 内容生成 ==========
  
  /**
   * 生成练习题
   */
  async generateExercises(
    unitId: string,
    count?: number,
    difficulty?: number
  ): Promise<APIResponse<any[]>> {
    try {
      // TODO: 实现练习题生成引擎
      // const exercises = await this.exerciseGenerationEngine.generate(unitId, count, difficulty)
      
      // 临时返回模拟练习题
      const mockExercises = Array.from({ length: count || 3 }, (_, index) => ({
        id: `exercise_${Date.now()}_${index}`,
        unitId,
        title: `练习题 ${index + 1}`,
        description: '这是一道编程练习题',
        type: 'coding',
        difficulty: difficulty || 1,
        content: {
          question: '请实现一个函数来解决这个问题',
          examples: ['输入: [1,2,3]\n输出: 6'],
          constraints: ['数组长度不超过1000'],
          hints: ['可以使用循环', '注意边界情况']
        },
        solution: {
          code: 'function solve(arr) { return arr.reduce((sum, num) => sum + num, 0); }',
          explanation: '使用reduce方法计算数组元素总和'
        },
        testCases: [
          { input: '[1,2,3]', expected: '6' },
          { input: '[]', expected: '0' }
        ]
      }))

      return {
        success: true,
        data: mockExercises
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成练习题失败'
      }
    }
  }

  /**
   * 生成项目模板
   */
  async generateProject(
    nodeId: string,
    requirements: string[]
  ): Promise<APIResponse<any>> {
    try {
      // TODO: 实现项目模板生成引擎
      // const project = await this.projectGenerationEngine.generate(nodeId, requirements)
      
      // 临时返回模拟项目模板
      const mockProject = {
        id: `project_${Date.now()}`,
        nodeId,
        title: '实战项目',
        description: '基于学习内容的实践项目',
        requirements,
        structure: {
          directories: ['src', 'docs', 'tests'],
          files: [
            { path: 'src/index.js', content: '// 项目入口文件' },
            { path: 'README.md', content: '# 项目说明\n\n这是一个学习项目。' }
          ]
        },
        milestones: [
          { name: '环境搭建', description: '配置开发环境', estimatedHours: 2 },
          { name: '核心功能', description: '实现主要功能', estimatedHours: 8 },
          { name: '测试优化', description: '测试和优化代码', estimatedHours: 4 }
        ],
        technologies: ['JavaScript', 'Node.js'],
        difficulty: 2,
        estimatedHours: 14
      }

      return {
        success: true,
        data: mockProject
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成项目模板失败'
      }
    }
  }

  // ========== 完整学习流程 ==========
  
  /**
   * 创建完整学习路径
   */
  async createCompleteLearningPath(
    goalRecommendation: any,
    pathConfig: any,
    contentConfig: any
  ): Promise<APIResponse<{
    goal: LearningGoal
    path: LearningPath
    courseUnits: any[]
  }>> {
    try {
      // TODO: 实现完整学习流程创建引擎
      // const result = await this.learningFlowEngine.createComplete(goalRecommendation, pathConfig, contentConfig)
      
      // 先创建目标
      const goalData: CreateGoalData = {
        title: goalRecommendation.title,
        description: goalRecommendation.description,
        category: goalRecommendation.category,
        priority: goalRecommendation.priority,
        targetLevel: goalRecommendation.targetLevel || 'intermediate',
        estimatedTimeWeeks: goalRecommendation.estimatedTimeWeeks,
        requiredSkills: goalRecommendation.requiredSkills || [],
        outcomes: goalRecommendation.outcomes || []
      }
      
      const goal = await this.dataManager.createGoal(goalData)
      
      // 然后创建路径
      const pathData: CreatePathData = {
        goalId: goal.id,
        title: `${goal.title} - 学习路径`,
        description: `为目标"${goal.title}"创建的完整学习路径`,
        config: pathConfig
      }
      
      const path = await this.dataManager.createPath(pathData)
      
      // 创建课程单元（临时模拟）
      const courseUnits: any[] = []
      
      return {
        success: true,
        data: {
          goal,
          path,
          courseUnits
        },
        message: '完整学习路径创建成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建完整学习路径失败'
      }
    }
  }

  // ========== 快速操作 ==========
  
  /**
   * 执行快速操作
   */
  async executeQuickAction(action: string, params?: any): Promise<APIResponse<any>> {
    try {
      // TODO: 实现快速操作引擎
      // const result = await this.quickActionEngine.execute(action, params)
      
      let result: any
      
      switch (action) {
        case 'generate_assessment':
          result = await this.executeAbilityAssessment(params)
          break
        case 'activate_goal':
          result = await this.activateGoal(params.goalId, params.reason)
          break
        case 'generate_path':
          result = await this.generatePathForGoal(params.goalId, params.config)
          break
        case 'update_progress':
          result = await this.updateNodeStatus(params.pathId, params.nodeId, params.status)
          break
        default:
          throw new Error(`未知的快速操作: ${action}`)
      }
      
      return {
        success: true,
        data: result,
        message: `快速操作 ${action} 执行成功`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `快速操作${action}失败`
      }
    }
  }

  // ========== 课程内容管理 ==========

  /**
   * 获取所有课程内容
   */
  async getAllCourseContent(): Promise<APIResponse<any[]>> {
    try {
      // TODO: 实现课程内容服务
      // const contents = await this.courseContentService.getAll()
      
      // 临时返回模拟数据
      const sampleContents = [
        {
          id: 'content_1',
          nodeId: 'node_1',
          title: '编程基础入门',
          description: '学习编程的基本概念和语法',
          order: 1,
          explanation: {
            id: 'explanation_1',
            title: '编程基础 - 讲解',
            content: {
              markdown: '# 编程基础\n\n编程是创造软件的艺术...'
            },
            learningObjectives: ['理解编程概念', '掌握基本语法'],
            prerequisites: [],
            keyConcepts: ['变量', '函数', '循环']
          },
          practice: {
            id: 'practice_1',
            title: '编程基础 - 练习',
            exercises: [],
            assessment: {
              passingScore: 70,
              attempts: 3
            }
          },
          metadata: {
            estimatedReadingTime: 30,
            difficulty: 1,
            language: 'javascript',
            skills: ['基础编程'],
            concepts: ['变量', '函数'],
            keywords: ['编程', '语法'],
            learningOutcomes: ['能编写简单程序'],
            learningStyles: ['visual', 'reading'],
            version: '1.0.0'
          },
          status: 'not_started',
          progress: {
            explanationCompleted: false,
            practiceCompleted: false,
            timeSpent: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      return {
        success: true,
        data: sampleContents,
        message: '成功获取课程内容列表'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取课程内容失败'
      }
    }
  }

  /**
   * 根据ID获取课程内容
   */
  async getCourseContentById(contentId: string): Promise<APIResponse<any | null>> {
    try {
      // TODO: 实现课程内容查询服务
      // const content = await this.courseContentService.getById(contentId)
      
      const allContents = await this.getAllCourseContent()
      const content = allContents.data?.find(c => c.id === contentId) || null
      
      if (!content) {
        return {
          success: false,
          error: '未找到指定的课程内容'
        }
      }

      return {
        success: true,
        data: content,
        message: '成功获取课程内容详情'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取课程内容详情失败'
      }
    }
  }

  /**
   * 根据节点ID获取课程内容
   */
  async getCourseContentsByNodeId(nodeId: string): Promise<APIResponse<any[]>> {
    try {
      const allContents = await this.getAllCourseContent()
      const contents = allContents.data?.filter(c => c.nodeId === nodeId) || []
      
      return {
        success: true,
        data: contents,
        message: `成功获取节点 ${nodeId} 的课程内容`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取节点课程内容失败'
      }
    }
  }

  /**
   * 创建新的课程内容
   */
  async createCourseContent(request: any): Promise<APIResponse<any>> {
    try {
      if (!request.title?.trim()) {
        return {
          success: false,
          error: '课程内容标题不能为空'
        }
      }

      if (!request.nodeId) {
        return {
          success: false,
          error: '必须指定节点ID'
        }
      }

      // TODO: 实现课程内容创建服务
      // const newContent = await this.courseContentService.create(request)
      
      const newContent = {
        id: `content_${Date.now()}`,
        nodeId: request.nodeId,
        title: request.title,
        description: request.description,
        order: request.order || 1,
        explanation: {
          id: `explanation_${Date.now()}`,
          title: `${request.title} - 讲解`,
          content: {
            markdown: '# 课程内容\n\n这是通过API创建的课程内容。'
          },
          learningObjectives: ['掌握基础概念'],
          prerequisites: [],
          keyConcepts: []
        },
        practice: {
          id: `practice_${Date.now()}`,
          title: `${request.title} - 练习`,
          exercises: [],
          assessment: {
            passingScore: 70,
            attempts: 3
          }
        },
        metadata: {
          estimatedReadingTime: 15,
          difficulty: request.generationConfig?.difficulty || 1,
          language: request.generationConfig?.language || 'javascript',
          skills: request.generationConfig?.focusAreas || [],
          concepts: [],
          keywords: [],
          learningOutcomes: [],
          learningStyles: ['visual', 'reading'],
          version: '1.0.0'
        },
        status: 'not_started',
        progress: {
          explanationCompleted: false,
          practiceCompleted: false,
          timeSpent: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return {
        success: true,
        data: newContent,
        message: `✅ 成功创建课程内容: ${request.title}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建课程内容失败'
      }
    }
  }

  /**
   * 更新课程内容
   */
  async updateCourseContent(contentId: string, updates: any): Promise<APIResponse<any>> {
    try {
      const contentResult = await this.getCourseContentById(contentId)
      if (!contentResult.success || !contentResult.data) {
        return {
          success: false,
          error: '未找到要更新的课程内容'
        }
      }

      // TODO: 实现课程内容更新服务
      // const updatedContent = await this.courseContentService.update(contentId, updates)
      
      const updatedContent = {
        ...contentResult.data,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      return {
        success: true,
        data: updatedContent,
        message: '✅ 课程内容更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新课程内容失败'
      }
    }
  }

  /**
   * 删除课程内容
   */
  async deleteCourseContent(contentId: string): Promise<APIResponse<boolean>> {
    try {
      const contentResult = await this.getCourseContentById(contentId)
      if (!contentResult.success || !contentResult.data) {
        return {
          success: false,
          error: '未找到要删除的课程内容'
        }
      }

      // TODO: 实现课程内容删除服务
      // await this.courseContentService.delete(contentId)
      
      return {
        success: true,
        data: true,
        message: '✅ 课程内容删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除课程内容失败'
      }
    }
  }

  /**
   * 更新课程内容进度
   */
  async updateCourseContentProgress(contentId: string, progress: any): Promise<APIResponse<any>> {
    try {
      const contentResult = await this.getCourseContentById(contentId)
      if (!contentResult.success || !contentResult.data) {
        return {
          success: false,
          error: '未找到指定的课程内容'
        }
      }

      // TODO: 实现进度更新服务
      // const updatedProgress = await this.progressService.update(contentId, progress)
      
      const updatedProgress = {
        contentId,
        nodeId: contentResult.data.nodeId,
        explanationProgress: {
          sectionsViewed: [],
          timeSpent: 0,
          completed: false,
          ...progress.explanationProgress
        },
        practiceProgress: {
          exercisesAttempted: [],
          overallScore: 0,
          passed: false,
          ...progress.practiceProgress
        },
        totalTimeSpent: progress.totalTimeSpent || 0,
        lastAccessAt: new Date().toISOString(),
        startedAt: progress.startedAt || new Date().toISOString()
      }

      return {
        success: true,
        data: updatedProgress,
        message: '✅ 学习进度更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新学习进度失败'
      }
    }
  }

  /**
   * 提交练习答案
   */
  async submitExercise(submission: any): Promise<APIResponse<any>> {
    try {
      const contentResult = await this.getCourseContentById(submission.contentId)
      if (!contentResult.success || !contentResult.data) {
        return {
          success: false,
          error: '未找到指定的课程内容'
        }
      }

      // TODO: 实现练习评估服务
      // const evaluation = await this.exerciseEvaluationService.evaluate(submission)
      
      const evaluation = {
        exerciseId: submission.exerciseId,
        submissionId: `submission_${Date.now()}`,
        score: Math.floor(Math.random() * 100),
        maxScore: 100,
        passed: Math.random() > 0.3,
        feedback: {
          overall: '练习完成得不错！',
          detailed: [
            {
              section: '解题思路',
              message: '思路清晰，逻辑正确',
              type: 'success'
            }
          ]
        },
        recommendations: ['继续练习类似题目', '关注代码优化'],
        nextSteps: ['进入下一个练习', '查看解题技巧'],
        timestamp: new Date().toISOString()
      }

      return {
        success: true,
        data: evaluation,
        message: '✅ 练习提交成功，已完成评估'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交练习失败'
      }
    }
  }

  /**
   * 获取课程内容统计
   */
  async getCourseContentStats(): Promise<APIResponse<{
    total: number
    byStatus: Record<string, number>
    byDifficulty: Record<string, number>
    totalEstimatedTime: number
    averageProgress: number
  }>> {
    try {
      const allContentResult = await this.getAllCourseContent()
      if (!allContentResult.success || !allContentResult.data) {
        return {
          success: false,
          error: '获取课程内容统计失败'
        }
      }

      const contents = allContentResult.data
      const stats = {
        total: contents.length,
        byStatus: {
          'not_started': contents.filter(c => c.status === 'not_started').length,
          'in_progress': contents.filter(c => c.status === 'in_progress').length,
          'completed': contents.filter(c => c.status === 'completed').length
        },
        byDifficulty: {
          '1': contents.filter(c => c.metadata.difficulty === 1).length,
          '2': contents.filter(c => c.metadata.difficulty === 2).length,
          '3': contents.filter(c => c.metadata.difficulty === 3).length,
          '4': contents.filter(c => c.metadata.difficulty === 4).length,
          '5': contents.filter(c => c.metadata.difficulty === 5).length
        },
        totalEstimatedTime: contents.reduce((sum, c) => sum + c.metadata.estimatedReadingTime, 0),
        averageProgress: contents.length > 0 
          ? contents.reduce((sum, c) => {
              const progress = (c.progress.explanationCompleted ? 50 : 0) + (c.progress.practiceCompleted ? 50 : 0)
              return sum + progress
            }, 0) / contents.length
          : 0
      }

      return {
        success: true,
        data: stats,
        message: '成功获取课程内容统计信息'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取课程内容统计失败'
      }
    }
  }

  // ========== 完整Profile管理功能 (补充原版缺失的方法) ==========

  /**
   * 创建新Profile
   */
  async createProfile(input: CreateProfileInput): Promise<APIResponse<Profile>> {
    try {
      // 验证输入
      const validation = this.validateProfileInput(input)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        }
      }

      // 检查名称是否重复
      const allProfiles = this.getAllProfiles()
      if (allProfiles.success && allProfiles.data) {
        const existing = allProfiles.data.find(p => p.name === input.name)
        if (existing) {
          return {
            success: false,
            error: 'Profile名称已存在'
          }
        }
      }

      // 使用原系统创建Profile
      const originalProfile = createOriginalProfile(
        input.name,
        undefined, // 暂不支持密码
        input.avatar
      )

      // 设置额外的metadata
      this.setProfileMetadata(originalProfile.id, {
        email: input.email,
        bio: input.bio,
        settings: this.getDefaultProfileSettings()
      })

      // 转换为新格式返回
      const newProfile = this.convertProfileToNewFormat(originalProfile)

      return {
        success: true,
        data: newProfile,
        message: `✅ 成功创建Profile: ${input.name}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建Profile失败'
      }
    }
  }

  /**
   * 更新Profile信息
   */
  async updateProfile(id: string, input: UpdateProfileInput): Promise<APIResponse<Profile>> {
    try {
      const profileResponse = this.getAllProfiles()
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: '获取Profile列表失败'
        }
      }

      const profile = profileResponse.data.find(p => p.id === id)
      if (!profile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 检查名称重复（如果要修改名称）
      if (input.name && input.name !== profile.name) {
        const existing = profileResponse.data.find(p => p.name === input.name && p.id !== id)
        if (existing) {
          return {
            success: false,
            error: 'Profile名称已存在'
          }
        }
      }

      // 更新原系统Profile
      const originalUpdates: any = {}
      if (input.name !== undefined) originalUpdates.name = input.name
      if (input.avatar !== undefined) originalUpdates.avatar = input.avatar

      if (Object.keys(originalUpdates).length > 0) {
        updateOriginalProfile(id, originalUpdates)
      }

      // 更新metadata
      const currentMetadata = this.getProfileMetadata(id) || {}
      const newMetadata = {
        ...currentMetadata,
        email: input.email !== undefined ? input.email : currentMetadata.email,
        bio: input.bio !== undefined ? input.bio : currentMetadata.bio
      }
      this.setProfileMetadata(id, newMetadata)

      // 返回更新后的Profile
      const updatedProfile = this.getAllProfiles().data?.find(p => p.id === id)
      if (!updatedProfile) {
        return {
          success: false,
          error: '更新后无法获取Profile'
        }
      }

      return {
        success: true,
        data: updatedProfile,
        message: '✅ Profile更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新Profile失败'
      }
    }
  }

  /**
   * 更新Profile设置
   */
  async updateProfileSettings(id: string, input: UpdateSettingsInput): Promise<APIResponse<Profile>> {
    try {
      const profileResponse = this.getAllProfiles()
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: '获取Profile列表失败'
        }
      }

      const profile = profileResponse.data.find(p => p.id === id)
      if (!profile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 获取当前metadata
      const currentMetadata = this.getProfileMetadata(id) || {}
      const currentSettings = currentMetadata.settings || this.getDefaultProfileSettings()

      // 合并设置
      const newSettings: ProfileSettings = {
        ...currentSettings,
        ...(input.theme && { theme: input.theme }),
        ...(input.language && { language: input.language }),
        ...(input.notifications && {
          notifications: { ...currentSettings.notifications, ...input.notifications }
        }),
        ...(input.privacy && {
          privacy: { ...currentSettings.privacy, ...input.privacy }
        }),
        ...(input.learning && {
          learning: { ...currentSettings.learning, ...input.learning }
        })
      }

      // 更新metadata
      this.setProfileMetadata(id, {
        ...currentMetadata,
        settings: newSettings
      })

      // 返回更新后的Profile
      const updatedProfile = this.getAllProfiles().data?.find(p => p.id === id)
      if (!updatedProfile) {
        return {
          success: false,
          error: '更新后无法获取Profile'
        }
      }

      return {
        success: true,
        data: updatedProfile,
        message: '✅ Profile设置更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新Profile设置失败'
      }
    }
  }

  /**
   * 删除Profile
   */
  async deleteProfile(id: string): Promise<APIResponse<boolean>> {
    try {
      const profileResponse = this.getAllProfiles()
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: '获取Profile列表失败'
        }
      }

      const profile = profileResponse.data.find(p => p.id === id)
      if (!profile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 检查是否是当前活跃Profile
      const currentProfile = this.getCurrentProfile()
      if (currentProfile.success && currentProfile.data?.id === id) {
        return {
          success: false,
          error: '不能删除当前活跃的Profile'
        }
      }

      // 删除Profile metadata
      this.deleteProfileMetadata(id)

      // 删除原系统Profile
      deleteOriginalProfile(id)

      return {
        success: true,
        data: true,
        message: '✅ Profile删除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除Profile失败'
      }
    }
  }

  /**
   * 获取Profile统计信息
   */
  async getProfileStats(): Promise<APIResponse<ProfileStats>> {
    try {
      const allProfiles = this.getAllProfiles()
      const currentProfile = this.getCurrentProfile()
      
      const stats: ProfileStats = {
        totalProfiles: allProfiles.data?.length || 0,
        activeProfile: currentProfile.data?.name || null,
        lastActive: currentProfile.data?.updatedAt || null,
        storageUsed: this.calculateStorageUsage(),
        assessmentCount: await this.getAssessmentCount(),
        goalCount: await this.getGoalCount()
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取Profile统计失败'
      }
    }
  }

  // ========== 私有方法 ==========

  /**
   * 转换Profile格式
   */
  private convertProfileToNewFormat(original: OriginalProfile): Profile {
    const metadata = this.getProfileMetadata(original.id)
    
    return {
      id: original.id,
      name: original.name,
      avatar: original.avatar,
      email: metadata?.email,
      bio: metadata?.bio,
      createdAt: new Date(original.createdAt || Date.now()),
      updatedAt: new Date(original.lastLogin || original.createdAt || Date.now()),
      isActive: original.id === getOriginalCurrentProfileId(),
      data: {
        settings: metadata?.settings || this.getDefaultProfileSettings(),
        progress: original.data,
        achievements: []
      }
    }
  }

  /**
   * 获取Profile metadata
   */
  private getProfileMetadata(profileId: string): any {
    try {
      const stored = localStorage.getItem('refactor_profiles_metadata')
      if (!stored) return null
      
      const metadata = JSON.parse(stored)
      return metadata[profileId] || null
    } catch (error) {
      console.error('Failed to get profile metadata:', error)
      return null
    }
  }

  /**
   * 获取默认Profile设置
   */
  private getDefaultProfileSettings(): ProfileSettings {
    return {
      theme: 'system',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        desktop: true
      },
      privacy: {
        analytics: true,
        dataCollection: true
      },
      learning: {
        dailyGoal: 60,
        difficulty: 'intermediate',
        focusAreas: []
      }
    }
  }

  /**
   * 根据分数获取水平
   */
  private getScoreLevel(score: number): string {
    if (score >= 80) return 'expert'
    if (score >= 60) return 'advanced'
    if (score >= 40) return 'intermediate'
    return 'beginner'
  }

  /**
   * 添加Profile切换监听器
   */
  addProfileSwitchListener(listener: () => void): void {
    this.profileSwitchListeners.push(listener)
  }

  /**
   * 触发Profile切换事件
   */
  private notifyProfileSwitchListeners(): void {
    this.profileSwitchListeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('[LearningAPIv2] Profile switch listener error:', error)
      }
    })
  }

  /**
   * 设置Profile metadata
   */
  private setProfileMetadata(profileId: string, data: any): void {
    try {
      const stored = localStorage.getItem('refactor_profiles_metadata') || '{}'
      const metadata = JSON.parse(stored)
      metadata[profileId] = data
      localStorage.setItem('refactor_profiles_metadata', JSON.stringify(metadata))
    } catch (error) {
      console.error('Failed to set profile metadata:', error)
    }
  }

  /**
   * 删除Profile metadata
   */
  private deleteProfileMetadata(profileId: string): void {
    try {
      const stored = localStorage.getItem('refactor_profiles_metadata')
      if (!stored) return
      
      const metadata = JSON.parse(stored)
      delete metadata[profileId]
      localStorage.setItem('refactor_profiles_metadata', JSON.stringify(metadata))
    } catch (error) {
      console.error('Failed to delete profile metadata:', error)
    }
  }

  /**
   * 验证Profile输入
   */
  private validateProfileInput(input: CreateProfileInput): { 
    isValid: boolean
    errors: Array<{ field: string; message: string }>
  } {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.name || input.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Profile名称不能为空' })
    } else if (input.name.length > 50) {
      errors.push({ field: 'name', message: 'Profile名称不能超过50个字符' })
    }

    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 计算存储使用量
   */
  private calculateStorageUsage(): number {
    try {
      let totalSize = 0
      
      // 计算localStorage大小
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length
        }
      }
      
      // 转换为MB
      return Math.round(totalSize / 1024 / 1024 * 100) / 100
    } catch (error) {
      return 0
    }
  }

  /**
   * 获取评估数量
   */
  private async getAssessmentCount(): Promise<number> {
    try {
      const abilityProfile = await this.dataManager.getAbilityProfile()
      return abilityProfile ? 1 : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * 获取目标数量
   */
  private async getGoalCount(): Promise<number> {
    try {
      const goals = await this.dataManager.getAllGoals()
      return goals.length
    } catch (error) {
      return 0
    }
  }
}

// 导出单例实例
export const learningApiV2 = LearningAPIv2.getInstance()

// 导出类型定义供组件使用
export type { 
  SystemStatus, 
  LearningGoal, 
  LearningPath, 
  CourseUnit, 
  AbilityProfile,
  CreateGoalData,
  CreatePathData,
  SyncResult
}

// 导出Profile相关类型
export type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  ProfileStats,
  ProfileSettings
}
