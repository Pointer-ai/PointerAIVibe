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
 */

import { learningSystemService, LearningSystemStatus, AgentInteraction } from '../modules/learningSystem'
import { GoalCategory, GoalRecommendation } from '../modules/goalSetting/types'
import { SkillGapAnalysis, PathGenerationConfig } from '../modules/pathPlan/types'
import { ContentGenerationConfig, Exercise, ProjectTemplate } from '../modules/courseContent/types'
import { LearningGoal, LearningPath, CourseUnit } from '../modules/coreData/types'
import { AbilityAssessment, AssessmentInput } from '../modules/abilityAssess/types'

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
 * 学习系统统一API
 */
export class LearningAPI {
  private static instance: LearningAPI
  
  private constructor() {}
  
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

  // ========== 目标管理 ==========
  
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

  // ========== 路径管理 ==========
  
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
  getAbilitySummary(): APIResponse<{
    hasAssessment: boolean
    overallScore: number
    level: string
    assessmentDate: string | null
    needsAssessment: boolean
    strengths?: string[]
    improvements?: string[]
    confidence?: number
  }> {
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