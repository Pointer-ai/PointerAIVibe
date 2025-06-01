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
 * API层统一入口
 * 
 * 这里导出所有API实例和类型定义，供UI组件使用
 * 
 * 使用方式：
 * ```typescript
 * import { learningApi, simpleApi, isApiSuccess, handleApiError } from '@/api'
 * 
 * // 获取系统状态
 * const statusResult = await learningApi.getSystemStatus()
 * 
 * // 创建目标
 * const goalResult = await learningApi.createGoal(formData)
 * 
 * // 生成路径
 * const pathResult = await learningApi.generatePathForGoal(goalId)
 * 
 * // 执行评估
 * const assessmentResult = await learningApi.executeAbilityAssessment(input)
 * ```
 */

// 导出API实例
export { learningApi } from './learningApi'
export { simpleApi } from './simpleApi'

// 导出核心类型
export type { APIResponse } from './learningApi'
export type { 
  LearningSystemStatus, 
  AgentInteraction,
  GoalCategory, 
  GoalRecommendation,
  SkillGapAnalysis, 
  PathGenerationConfig,
  ContentGenerationConfig, 
  Exercise, 
  ProjectTemplate,
  LearningGoal, 
  LearningPath, 
  CourseUnit,
  AbilityAssessment, 
  AssessmentInput,
  GoalFormData,
  PathProgressStats,
  AbilitySummary,
  ActivationResult,
  GoalActivationStats
} from './learningApi'

/**
 * API使用工具函数
 */

/**
 * 统一的错误处理函数
 */
export function handleApiError(result: { success: boolean; error?: string }, defaultMessage = '操作失败') {
  if (!result.success) {
    console.error('API Error:', result.error || defaultMessage)
    return result.error || defaultMessage
  }
  return null
}

/**
 * 统一的成功消息处理函数
 */
export function handleApiSuccess(result: { success: boolean; message?: string }, defaultMessage = '操作成功') {
  if (result.success) {
    return result.message || defaultMessage
  }
  return null
}

/**
 * 检查API响应是否成功
 */
export function isApiSuccess<T>(result: { success: boolean; data?: T }): result is { success: true; data: T } {
  return result.success && result.data !== undefined
}

/**
 * 获取API响应数据，失败时返回默认值
 */
export function getApiData<T>(result: { success: boolean; data?: T }, defaultValue: T): T {
  return result.success && result.data !== undefined ? result.data : defaultValue
}

/**
 * API状态常量
 */
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
} as const

/**
 * 常用的错误消息
 */
export const API_ERRORS = {
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  UNAUTHORIZED: '未授权，请重新登录',
  FORBIDDEN: '权限不足，无法执行此操作',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  VALIDATION_ERROR: '输入数据验证失败',
  TIMEOUT: '请求超时，请重试'
} as const

/**
 * API配置
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30秒超时
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1秒重试间隔
} as const 