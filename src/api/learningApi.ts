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
 * 学习系统统一API层
 * 
 * 这个API层作为UI组件和业务逻辑之间的中间层，提供：
 * - 统一的接口给UI组件使用
 * - 隔离业务逻辑和UI逻辑
 * - 消除循环依赖
 * - 清晰的错误处理和状态管理
 * - 整合目标管理、路径管理、评估管理、课程内容管理
 */

import { learningSystemService, LearningSystemStatus, AgentInteraction } from '../modules/learningSystem'
import { GoalCategory, GoalRecommendation } from '../modules/goalSetting/types'
import { SkillGapAnalysis, PathGenerationConfig } from '../modules/pathPlan/types'
import { ContentGenerationConfig, Exercise, ProjectTemplate } from '../modules/courseContent/types'
import { LearningGoal, LearningPath, CourseUnit } from '../modules/coreData/types'
import { AbilityAssessment, AssessmentInput } from '../modules/abilityAssess/types'

// 导入各个模块的核心功能
import { 
  getLearningGoals, 
  createLearningGoal, 
  updateLearningGoal, 
  deleteLearningGoal,
  getGoalStatusStats,
  cancelGoal as cancelGoalService,
  getLearningPaths, 
  createLearningPath, 
  updateLearningPath, 
  deleteLearningPath
} from '../modules/coreData'

import { 
  goalActivationManager,
  getActivationStats,
  ActivationResult,
  GoalActivationStats
} from '../modules/coreData/goalActivationManager'

import { GoalSettingService } from '../modules/goalSetting/service'
import { PathPlanService } from '../modules/pathPlan/service'

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
 * 学习系统统一API
 */
export class LearningAPI {
  private static instance: LearningAPI
  private goalService: GoalSettingService
  private pathService: PathPlanService
  
  private constructor() {
    this.goalService = new GoalSettingService()
    this.pathService = new PathPlanService()
  }
  
  public static getInstance(): LearningAPI {
    if (!LearningAPI.instance) {
      LearningAPI.instance = new LearningAPI()
    }
    return LearningAPI.instance
  }

  // ========== 系统状态管理 ==========
  
  /**
   * 获取系统完整状态
   */
  async getSystemStatus(): Promise<APIResponse<LearningSystemStatus>> {
    try {
      const status = await learningSystemService.getSystemStatus()
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
      const recommendations = await learningSystemService.getSmartLearningRecommendations()
      return {
        success: true,
        data: recommendations
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取智能建议失败'
      }
    }
  }

  // ========== AI对话功能 ==========
  
  /**
   * 与AI助手对话
   */
  async chatWithAgent(userMessage: string, context?: any): Promise<APIResponse<{
    response: string
    toolsUsed: string[]
    suggestions: string[]
    systemStatus: LearningSystemStatus
  }>> {
    try {
      const result = await learningSystemService.chatWithAgent(userMessage, context)
      return {
        success: true,
        data: result
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
  getInteractionHistory(): APIResponse<AgentInteraction[]> {
    try {
      const history = learningSystemService.getInteractionHistory()
      return {
        success: true,
        data: history
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
      learningSystemService.clearInteractionHistory()
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
      const result = await goalActivationManager.activateGoal(goalId, { reason })
      
      return {
        success: result.success,
        data: result,
        message: result.success ? '✅ 目标激活成功' : undefined,
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
      const result = await goalActivationManager.pauseGoal(goalId, reason)
      
      return {
        success: result.success,
        data: result,
        message: result.success ? '✅ 目标暂停成功' : undefined,
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
        message: result.success ? '🎉 目标完成，恭喜！' : undefined,
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
      const result = await cancelGoalService(goalId)
      
      if (result) {
        return {
          success: true,
          data: {
            success: true,
            goalId,
            oldStatus: 'active',
            newStatus: 'cancelled',
            message: '目标已取消',
            warnings: [],
            affectedPaths: [],
            systemRecommendations: []
          },
          message: '✅ 目标取消成功'
        }
      } else {
        return {
          success: false,
          error: '取消目标失败'
        }
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
  getActiveGoals(): APIResponse<LearningGoal[]> {
    try {
      const goals = getLearningGoals()
      const activeGoals = goals.filter(goal => goal.status === 'active')
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
        error: error instanceof Error ? error.message : '检查激活状态失败'
      }
    }
  }

  /**
   * 获取目标统计信息
   */
  getGoalStats(): APIResponse<any> {
    try {
      const statusStats = getGoalStatusStats()
      const activationStats = getActivationStats()
      
      return {
        success: true,
        data: {
          ...statusStats,
          activation: activationStats
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目标统计失败'
      }
    }
  }

  /**
   * 获取激活统计
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

  // ========== 目标推荐功能 ==========
  
  /**
   * 获取目标类别
   */
  getGoalCategories(): APIResponse<GoalCategory[]> {
    try {
      const categories = learningSystemService.getGoalCategories()
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
  ): Promise<APIResponse<GoalRecommendation[]>> {
    try {
      const recommendations = await learningSystemService.generateGoalRecommendations(
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

  // ========== 路径管理 CRUD 操作 ==========

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
      // 首先冻结同一目标的其他路径
      const path = getLearningPaths().find(p => p.id === pathId)
      if (!path) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      // 冻结同一目标的其他活跃路径
      const samePaths = getLearningPaths().filter(p => 
        p.goalId === path.goalId && 
        p.id !== pathId && 
        p.status === 'active'
      )
      
      for (const samePath of samePaths) {
        await updateLearningPath(samePath.id, { status: 'frozen' })
      }

      // 激活当前路径
      const updatedPath = await updateLearningPath(pathId, { status: 'active' })
      
      if (!updatedPath) {
        return {
          success: false,
          error: '路径激活失败'
        }
      }

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
      const updatedPath = await updateLearningPath(pathId, { status: 'frozen' })
      
      if (!updatedPath) {
        return {
          success: false,
          error: '路径冻结失败'
        }
      }

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
      const currentPath = getLearningPaths().find(p => p.id === pathId)
      if (!currentPath) {
        return {
          success: false,
          error: '路径不存在'
        }
      }

      const updatedPath = await updateLearningPath(pathId, { 
        status: 'archived',
        updatedAt: new Date().toISOString()
      })
      
      if (!updatedPath) {
        return {
          success: false,
          error: '路径归档失败'
        }
      }

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
  getPathProgress(pathId: string): APIResponse<PathProgressStats> {
    try {
      const path = getLearningPaths().find(p => p.id === pathId)
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
      const goal = getLearningGoals().find(g => g.id === path.goalId)

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
  getAllPathsProgress(): APIResponse<PathProgressStats[]> {
    try {
      const paths = getLearningPaths()
      const progressStats: PathProgressStats[] = []

      for (const path of paths) {
        const result = this.getPathProgress(path.id)
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
      const path = getLearningPaths().find(p => p.id === pathId)
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

      const updatedPath = await updateLearningPath(pathId, { 
        nodes: updatedNodes,
        updatedAt: new Date().toISOString()
      })

      if (!updatedPath) {
        return {
          success: false,
          error: '更新节点状态失败'
        }
      }

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
  getActivePaths(): APIResponse<LearningPath[]> {
    try {
      const paths = getLearningPaths()
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
  getPathRecommendations(): APIResponse<{
    needsPath: LearningGoal[]
    hasPath: LearningGoal[]
    suggestions: string[]
  }> {
    try {
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      
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

  // ========== 路径分析功能 ==========
  
  /**
   * 分析技能差距
   */
  async analyzeSkillGap(goalId: string): Promise<APIResponse<SkillGapAnalysis>> {
    try {
      const analysis = await learningSystemService.analyzeSkillGap(goalId)
      return {
        success: true,
        data: analysis
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
  ): Promise<APIResponse<Exercise[]>> {
    try {
      const exercises = await learningSystemService.generateExercises(unitId, count, difficulty)
      return {
        success: true,
        data: exercises
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
  ): Promise<APIResponse<ProjectTemplate>> {
    try {
      const project = await learningSystemService.generateProject(nodeId, requirements)
      return {
        success: true,
        data: project
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
    goalRecommendation: GoalRecommendation,
    pathConfig: PathGenerationConfig,
    contentConfig: ContentGenerationConfig
  ): Promise<APIResponse<{
    goal: LearningGoal
    path: LearningPath
    courseUnits: CourseUnit[]
  }>> {
    try {
      const result = await learningSystemService.createCompleteLearningPath(
        goalRecommendation,
        pathConfig,
        contentConfig
      )
      return {
        success: true,
        data: result,
        message: '完整学习路径创建成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建完整学习路径失败'
      }
    }
  }

  // ========== 能力评估 ==========
  
  /**
   * 执行能力评估
   */
  async executeAbilityAssessment(input: AssessmentInput): Promise<APIResponse<{
    assessment: AbilityAssessment
    systemStatus: LearningSystemStatus
    nextRecommendations: string[]
    message: string
  }>> {
    try {
      const result = await learningSystemService.executeAbilityAssessment(input)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '能力评估执行失败'
      }
    }
  }

  /**
   * 获取能力概要
   */
  getAbilitySummary(): APIResponse<AbilitySummary> {
    try {
      const summary = learningSystemService.getAbilitySummary()
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
   * 更新能力评估
   */
  async updateAbilityAssessment(updates: Partial<AbilityAssessment>): Promise<APIResponse<{
    assessment: AbilityAssessment
    systemStatus: LearningSystemStatus
    message: string
  }>> {
    try {
      const result = await learningSystemService.updateAbilityAssessment(updates)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新能力评估失败'
      }
    }
  }

  /**
   * 生成能力提升计划
   */
  async generateAbilityImprovementPlan(): Promise<APIResponse<string>> {
    try {
      const plan = await learningSystemService.generateAbilityImprovementPlan()
      return {
        success: true,
        data: plan
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成能力提升计划失败'
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
    recommendations: string[]
    autoFixResults?: any[]
  }>> {
    try {
      const result = await learningSystemService.validateDataSync()
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
   * 自动修复数据同步
   */
  async autoFixDataSync(fixOptions?: {
    fixOrphanedData?: boolean
    regenerateMissingPaths?: boolean
    recreateMissingUnits?: boolean
    cleanInvalidRecords?: boolean
  }): Promise<APIResponse<{
    success: boolean
    fixedIssues: string[]
    failedFixes: string[]
    summary: string
  }>> {
    try {
      const result = await learningSystemService.autoFixDataSync(fixOptions)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '自动修复数据同步失败'
      }
    }
  }

  /**
   * 强制同步所有数据
   */
  async forceSyncAllData(): Promise<APIResponse<{
    success: boolean
    syncedItems: string[]
    errors: string[]
  }>> {
    try {
      const result = await learningSystemService.forceSyncAllData()
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

  // ========== 快速操作 ==========
  
  /**
   * 执行快速操作
   */
  async executeQuickAction(action: string, params?: any): Promise<APIResponse<any>> {
    try {
      const result = await learningSystemService.executeQuickAction(action, params)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `快速操作${action}失败`
      }
    }
  }
}

// 导出单例实例
export const learningApi = LearningAPI.getInstance()

// 导出类型定义供组件使用
export type { LearningSystemStatus, AgentInteraction }
export type { GoalCategory, GoalRecommendation }
export type { SkillGapAnalysis, PathGenerationConfig }
export type { ContentGenerationConfig, Exercise, ProjectTemplate }
export type { LearningGoal, LearningPath, CourseUnit }
export type { AbilityAssessment, AssessmentInput }
export type { ActivationResult, GoalActivationStats } 