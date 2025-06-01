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

// 系统相关类型定义

export interface SystemStatus {
  version: string
  currentPhase: string
  setupComplete: boolean
  apiHealth: boolean
  dataIntegrity: boolean
  progress: {
    activeGoals: number
    totalGoals: number
    activePaths: number
    totalPaths: number
    completedUnits: number
    totalUnits: number
  }
  lastUpdated: Date
}

export interface SystemConfig {
  apiEndpoint: string
  maxActiveGoals: number
  autoSaveInterval: number
  enableNotifications: boolean
  debugMode: boolean
}

export interface SystemError {
  id: string
  type: 'api' | 'data' | 'ui' | 'integration'
  message: string
  stack?: string
  timestamp: Date
  resolved: boolean
}

export interface DataStats {
  totalGoals: number
  totalPaths: number
  totalCourseUnits: number
  activeProfiles: number
  systemVersion: string
} 