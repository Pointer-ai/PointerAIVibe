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
import { Button } from '../refactor/components/ui/Button/Button'
import DashboardPage from '../refactor/pages/Dashboard'
import { GoalManagementPage } from '../refactor/pages/GoalManagement'
import { AssessmentPage } from '../refactor/pages/Assessment'
import UIShowcase from '../refactor/pages/UIShowcase'
import { ProfileManagementPage } from '../refactor/pages/ProfileManagement'
import { SystemDiagnosticsPage } from '../refactor/pages/SystemDiagnostics'
import { DataManagementPage } from '../refactor/pages/DataManagement'
import { ToastContainer } from '../refactor/components/ui/Alert/Alert'

type ViewType = 'dashboard' | 'goal-management' | 'path-planning' | 'assessment' | 'system-integration' | 'api-testing' | 'course-content' | 'ui-showcase' | 'profile-management' | 'system-diagnostics' | 'data-management'

interface RefactorDashboardProps {
  onBack?: () => void
}

/**
 * 重构系统入口组件
 * 负责管理重构系统内的页面导航
 */
export const RefactorDashboard: React.FC<RefactorDashboardProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view)
  }

  const handleBack = () => {
    if (currentView === 'dashboard') {
      onBack?.()
    } else {
      setCurrentView('dashboard')
    }
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'goal-management':
        return <GoalManagementPage onNavigate={(view: string) => handleNavigate(view as ViewType)} />
      case 'assessment':
        return <AssessmentPage onNavigate={(view: string) => handleNavigate(view as ViewType)} />
      case 'ui-showcase':
        return <UIShowcase onNavigate={(view: string) => handleNavigate(view as ViewType)} />
      case 'profile-management':
        return <ProfileManagementPage />
      case 'system-diagnostics':
        return <SystemDiagnosticsPage />
      case 'data-management':
        return <DataManagementPage onNavigate={(view: string) => handleNavigate(view as ViewType)} />
      case 'path-planning':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">🛤️ 路径规划</h1>
            <p className="text-gray-600 mb-4">该功能正在开发中...</p>
            <Button onClick={() => setCurrentView('dashboard')}>
              返回Dashboard
            </Button>
          </div>
        )
      case 'system-integration':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">🔗 系统集成</h1>
            <p className="text-gray-600 mb-4">该功能正在开发中...</p>
            <Button onClick={() => setCurrentView('dashboard')}>
              返回Dashboard
            </Button>
          </div>
        )
      case 'api-testing':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">🧪 API测试</h1>
            <p className="text-gray-600 mb-4">该功能正在开发中...</p>
            <Button onClick={() => setCurrentView('dashboard')}>
              返回Dashboard
            </Button>
          </div>
        )
      case 'course-content':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">📚 课程内容</h1>
            <p className="text-gray-600 mb-4">该功能正在开发中...</p>
            <Button onClick={() => setCurrentView('dashboard')}>
              返回Dashboard
            </Button>
          </div>
        )
      default:
        return <DashboardPage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="h-full">
      {renderView()}
      <ToastContainer />
    </div>
  )
}

export default RefactorDashboard 