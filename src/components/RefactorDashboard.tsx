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

import React, { useState, useEffect } from 'react'
import { learningApi, goalApi, pathApi, assessmentApi, simpleApi, isApiSuccess, handleApiError } from '../api'
import { getCurrentProfile } from '../utils/profile'
import { QuickStartExample } from './QuickStartExample'
import { APITestDashboard } from './APITestDashboard'
import RefactorDashboardMain from '../refactor/pages/Dashboard'
import GoalManagement from '../refactor/pages/GoalManagement'

/**
 * 重构系统Dashboard
 * 
 * 使用重构后的API层进行系统功能测试和集成
 * 与原有系统隔离，但共享coreData数据源
 */
export const RefactorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [activeView, setActiveView] = useState<'main' | 'goal-management' | 'path-planning' | 'assessment' | 'system-integration' | 'api-testing' | 'course-content' | 'quick-start' | 'api-test'>('main')
  const [profile] = useState(getCurrentProfile())

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // 获取系统状态
  const loadSystemStatus = async () => {
    setLoading(true)
    try {
      const result = await learningApi.getSystemStatus()
      if (isApiSuccess(result)) {
        setSystemStatus(result.data)
        showMessage('✅ 系统状态加载成功')
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 系统状态加载失败', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSystemStatus()
  }, [])

  // 处理导航
  const handleNavigate = (view: 'goal-management' | 'path-planning' | 'assessment' | 'system-integration' | 'api-testing' | 'course-content') => {
    setActiveView(view)
  }

  // 返回主页面
  const handleBackToMain = () => {
    setActiveView('main')
  }

  const renderContent = () => {
    switch (activeView) {
      case 'main':
        return <RefactorDashboardMain onNavigate={handleNavigate} />

      case 'goal-management':
        return (
          <div className="space-y-6">
            {/* 导航栏 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToMain}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>返回重构Dashboard</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  重构系统 v2.0 | API层架构
                </div>
              </div>
            </div>
            <GoalManagement />
          </div>
        )

      case 'system-integration':
        return (
          <div className="space-y-6">
            {/* 导航栏 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToMain}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>返回重构Dashboard</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  系统集成测试
                </div>
              </div>
            </div>
            
            {/* 集成测试页面内容 */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">🔗 集成测试说明</h2>
                <div className="text-sm text-blue-700 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">验证步骤：</h3>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>在重构系统中创建目标或路径</li>
                      <li>切换到原有系统查看数据同步</li>
                      <li>在原有系统中修改数据</li>
                      <li>返回重构系统验证数据更新</li>
                      <li>在数据检查器中查看底层数据一致性</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* 快速集成测试按钮 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🧪 快速集成测试</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const result = await goalApi.createGoal({
                          title: `集成测试目标 ${new Date().getTime()}`,
                          description: '这是一个用于验证系统集成的测试目标',
                          category: 'frontend',
                          priority: 2,
                          targetLevel: 'beginner',
                          estimatedTimeWeeks: 4,
                          requiredSkills: ['测试', '集成'],
                          outcomes: ['验证数据同步', '确认API正常']
                        })
                        if (isApiSuccess(result)) {
                          showMessage(`✅ 集成测试目标创建成功: ${result.data.title}`)
                        } else {
                          showMessage(`❌ ${handleApiError(result)}`, true)
                        }
                      } catch (error) {
                        showMessage('❌ 创建测试目标失败', true)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? '创建中...' : '🎯 创建集成测试目标'}
                  </button>

                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const statsResult = simpleApi.getDataStats()
                        if (isApiSuccess(statsResult)) {
                          const stats = statsResult.data
                          showMessage(`📊 数据统计: ${stats.totalGoals}目标, ${stats.totalPaths}路径, ${stats.totalCourseUnits}课程`)
                        } else {
                          showMessage(`❌ ${handleApiError(statsResult)}`, true)
                        }
                      } catch (error) {
                        showMessage('❌ 获取数据统计失败', true)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? '获取中...' : '📊 获取数据统计'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'api-testing':
        return (
          <div className="space-y-6">
            {/* 导航栏 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToMain}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>返回重构Dashboard</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  API功能测试
                </div>
              </div>
            </div>
            <APITestDashboard />
          </div>
        )

      // 其他页面暂时显示开发中状态
      default:
        return (
          <div className="space-y-6">
            {/* 导航栏 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToMain}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>返回重构Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {activeView === 'path-planning' && '🛤️ 路径规划'}
                  {activeView === 'assessment' && '📊 能力评估'}
                  {activeView === 'course-content' && '📚 课程内容'}
                </h2>
                <p className="text-gray-600 mb-6">该模块正在重构开发中...</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    🚧 重构版本正在开发中，敬请期待更好的用户体验！
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 消息显示 */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* 内容区域 */}
      {renderContent()}
    </div>
  )
}

export default RefactorDashboard 