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

import React, { useState } from 'react'
import { RefactorDashboard as RefactorDashboardPage } from '../refactor/pages/Dashboard'
import { GoalManagementPage } from '../refactor/pages/GoalManagement'
import { UIShowcase } from '../refactor/pages/UIShowcase'
import { AssessmentPage } from '../refactor/pages/Assessment'
import { ProfileManagementPage } from '../refactor/pages/ProfileManagement'
import { SystemDiagnosticsPage } from '../refactor/pages/SystemDiagnostics'
import { SyncTestPage } from '../refactor/pages/SyncTestPage'

// 临时占位符页面组件
const PlaceholderPage: React.FC<{ title: string; description: string; onNavigate: (view: string) => void }> = ({ title, description, onNavigate }) => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">{description}</p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回Dashboard
        </button>
      </div>
    </div>
  </div>
)

type ViewType = 'dashboard' | 'goal-management' | 'assessment' | 'ui-showcase' | 'profile-management' | 'system-diagnostics' | 'path-planning' | 'system-integration' | 'api-testing' | 'course-content' | 'sync-test'

/**
 * 重构系统入口组件
 * 提供导航和页面路由功能
 */
export const RefactorDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewType)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RefactorDashboardPage onNavigate={handleNavigate} />
      case 'goal-management':
        return <GoalManagementPage onNavigate={handleNavigate} />
      case 'assessment':
        return <AssessmentPage onNavigate={handleNavigate} />
      case 'ui-showcase':
        return <UIShowcase onNavigate={handleNavigate} />
      case 'profile-management':
        return <ProfileManagementPage onNavigate={handleNavigate} />
      case 'system-diagnostics':
        return <SystemDiagnosticsPage onNavigate={handleNavigate} />
      case 'path-planning':
        return <PlaceholderPage title="路径规划" description="智能化学习路径生成和管理功能正在开发中..." onNavigate={handleNavigate} />
      case 'system-integration':
        return <PlaceholderPage title="系统集成" description="与原系统的深度集成功能正在开发中..." onNavigate={handleNavigate} />
      case 'api-testing':
        return <PlaceholderPage title="API测试" description="API接口测试和调试工具正在开发中..." onNavigate={handleNavigate} />
      case 'course-content':
        return <PlaceholderPage title="课程内容" description="个性化课程内容生成功能正在开发中..." onNavigate={handleNavigate} />
      case 'sync-test':
        return <SyncTestPage onNavigate={handleNavigate} />
      default:
        return <RefactorDashboardPage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  )
}

export default RefactorDashboard 