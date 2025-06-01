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

// 重构系统统一入口文件

// 导出页面组件
export { default as RefactorDashboard } from './pages/Dashboard'
export { default as GoalManagementPage } from './pages/GoalManagement'
export { default as UIShowcasePage } from './pages/UIShowcase'
export { default as AssessmentPage } from './pages/Assessment'
export { default as ProfileManagementPage } from './pages/ProfileManagement'
export { default as SystemDiagnosticsPage } from './pages/SystemDiagnostics'
export { DataManagementPage } from './pages/DataManagement'

// 导出UI组件
export * from './components/ui'

// 导出服务
export { refactorAIService } from './services/aiService'
export { legacyDataService } from './services/legacyDataService'
export { syncManager } from './services/syncManager'

// 导出类型
export * from './types'

// 导出hooks
export { useProfileSync } from './hooks/useProfileSync'

// 版本信息
export const REFACTOR_VERSION = '2.0.0'
export const REFACTOR_BUILD = new Date().toISOString() 