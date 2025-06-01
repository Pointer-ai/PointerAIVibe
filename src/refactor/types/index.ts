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

// 重构系统类型定义统一导出

// 基础系统类型
export * from './system'

// 学习目标相关类型
export * from './goal'

// 学习路径相关类型  
export * from './path'

// 能力评估相关类型
export * from './assessment'

// AI服务相关类型
export * from './ai'

// Profile相关类型
export * from './profile'

// 基础类型
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: any
}

// 导航类型
export type RefactorViewType = 
  | 'main' 
  | 'goal-management' 
  | 'path-planning' 
  | 'assessment' 
  | 'system-integration' 
  | 'api-testing' 
  | 'course-content' 