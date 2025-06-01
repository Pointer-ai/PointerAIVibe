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
import { learningApi, simpleApi, isApiSuccess, handleApiError } from '../api'
import { RefactorDashboard as Dashboard } from '../refactor/pages/Dashboard'
import { GoalManagementPage } from '../refactor/pages/GoalManagement'
import { UIShowcase } from '../refactor/pages/UIShowcase'
import { AssessmentPage } from '../refactor/pages/Assessment'
import { ProfileManagementPage } from '../refactor/pages/ProfileManagement'

// 临时占位符页面组件
const PlaceholderPage: React.FC<{ title: string; description: string; onNavigate: (view: string) => void }> = ({ title, description, onNavigate }) => (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-8">{description}</p>
        <button
          onClick={() => onNavigate('main')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回主页
        </button>
      </div>
    </div>
  </div>
)

/**
 * 重构系统入口Dashboard
 * 
 * 作为重构系统的主要入口，提供：
 * - 重构后页面的导航
 * - 与原系统的API对比
 * - 开发进度展示
 */
export const RefactorDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('main')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'main':
        return <Dashboard onNavigate={setCurrentView} />
      case 'goal-management':
        return <GoalManagementPage onNavigate={setCurrentView} />
      case 'ui-showcase':
        return <UIShowcase onNavigate={setCurrentView} />
      case 'assessment':
        return <AssessmentPage onNavigate={setCurrentView} />
      case 'profile-management':
        return <ProfileManagementPage onNavigate={setCurrentView} />
      case 'path-planning':
        return <PlaceholderPage title="路径规划" description="智能化学习路径生成和管理功能正在开发中..." onNavigate={setCurrentView} />
      case 'system-integration':
        return <PlaceholderPage title="系统集成" description="重构系统与原系统的数据同步和集成测试功能..." onNavigate={setCurrentView} />
      case 'api-testing':
        return <PlaceholderPage title="API测试" description="完整的API功能测试套件和性能监控..." onNavigate={setCurrentView} />
      case 'course-content':
        return <PlaceholderPage title="课程内容" description="AI生成的交互式编程课程和学习材料..." onNavigate={setCurrentView} />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  )
}

export default RefactorDashboard 