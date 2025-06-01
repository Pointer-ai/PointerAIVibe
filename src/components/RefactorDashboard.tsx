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