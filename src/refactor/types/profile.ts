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

// Profile管理相关类型定义

/**
 * Profile基础信息
 */
export interface ProfileData {
  id: string
  name: string
  avatar?: string
  email?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * API配置
 */
export interface APIConfig {
  model: 'openai' | 'claude' | 'qwen'
  key: string
  specificModel?: string
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
}

/**
 * Profile设置
 */
export interface ProfileSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  apiConfig?: APIConfig
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  privacy: {
    analytics: boolean
    dataCollection: boolean
  }
  learning: {
    dailyGoal: number // 分钟
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    focusAreas: string[]
  }
}

/**
 * 完整Profile对象
 */
export interface Profile {
  id: string
  name: string
  avatar?: string
  email?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  data: {
    settings: ProfileSettings
    progress?: any
    achievements?: any[]
  }
}

/**
 * Profile存储格式（兼容原系统）
 */
export interface ProfileStore {
  currentProfileId: string | null
  profiles: Profile[]
}

/**
 * Profile创建输入
 */
export interface CreateProfileInput {
  name: string
  email?: string
  bio?: string
  avatar?: string
}

/**
 * Profile更新输入
 */
export interface UpdateProfileInput {
  name?: string
  email?: string
  bio?: string
  avatar?: string
}

/**
 * 设置更新输入
 */
export interface UpdateSettingsInput {
  theme?: ProfileSettings['theme']
  language?: ProfileSettings['language']
  apiConfig?: APIConfig
  notifications?: Partial<ProfileSettings['notifications']>
  privacy?: Partial<ProfileSettings['privacy']>
  learning?: Partial<ProfileSettings['learning']>
}

/**
 * Profile统计信息
 */
export interface ProfileStats {
  totalProfiles: number
  activeProfile: string | null
  lastActive: Date | null
  storageUsed: number // MB
  assessmentCount: number
  goalCount: number
}

/**
 * Profile操作结果
 */
export interface ProfileOperationResult {
  success: boolean
  data?: Profile
  error?: string
}

/**
 * Profile验证错误
 */
export interface ProfileValidationError {
  field: string
  message: string
} 