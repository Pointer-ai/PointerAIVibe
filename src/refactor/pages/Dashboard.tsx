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
import { Button } from '../components/ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card'
import { Badge } from '../components/ui/Badge/Badge'
import { ProgressBar } from '../components/ui/ProgressBar/ProgressBar'
import { getCurrentProfile } from '../../utils/profile'
import { getCurrentAssessment } from '../../modules/abilityAssess'
import { ProfileManagementPage } from './ProfileManagement'
import { SystemDiagnosticsPage } from './SystemDiagnostics'

interface RefactorDashboardProps {
  onNavigate: (view: 'goal-management' | 'path-planning' | 'assessment' | 'system-integration' | 'api-testing' | 'course-content' | 'ui-showcase' | 'profile-management' | 'system-diagnostics' | 'data-management') => void
}

/**
 * 重构系统主Dashboard
 * 
 * 保持与原系统Dashboard相同的UI结构和风格
 * 使用重构后的组件和服务层
 */
export const RefactorDashboard: React.FC<RefactorDashboardProps> = ({ onNavigate }) => {
  const [profile] = useState(getCurrentProfile())
  const currentAssessment = getCurrentAssessment()

  if (!profile) {
    return null
  }

  const modules = [
    {
      id: 'profile-management',
      view: 'profile-management' as const,
      title: '👤 Profile管理',
      description: '管理您的学习档案、设置和AI配置，支持多Profile切换',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'data-management',
      view: 'data-management' as const,
      title: '🗂️ 数据管理',
      description: '重构版数据管理系统，查看和管理学习数据，支持删除和导出功能',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'goal-management',
      view: 'goal-management' as const,
      title: '🎯 目标管理',
      description: '重构版目标管理系统，包含完整的CRUD操作、统计分析和批量管理功能',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'ui-showcase',
      view: 'ui-showcase' as const,
      title: '🎨 UI组件库',
      description: '重构后的UI组件系统展示，包含所有基础组件的使用方法',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'path-planning',
      view: 'path-planning' as const,
      title: '🛤️ 路径规划',
      description: '重构版学习路径管理系统，支持AI生成、进度跟踪和状态管理',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-green-500 to-teal-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'assessment',
      view: 'assessment' as const,
      title: '📊 能力评估',
      description: '重构版能力评估系统，增强的分析和反馈机制',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'system-integration',
      view: 'system-integration' as const,
      title: '🔗 系统集成',
      description: '重构系统与原系统的数据同步和集成测试',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      status: '🔄 开发中',
      available: true
    },
    {
      id: 'api-testing',
      view: 'api-testing' as const,
      title: '🧪 API测试',
      description: '完整的API功能测试套件和性能监控',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-500',
      status: '✅ 可用',
      available: true
    },
    {
      id: 'course-content',
      view: 'course-content' as const,
      title: '📚 课程内容',
      description: 'AI生成的交互式编程课程和学习材料',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      status: '📋 规划中',
      available: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Pointer.ai v2.0</h1>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">重构版</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">架构版本</div>
                <div className="text-lg font-bold text-blue-600">API层重构</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            欢迎使用重构系统，{profile.name}！
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            体验全新的API层架构和优化的用户界面
          </p>
          {currentAssessment && (
            <div className="mt-4 inline-flex items-center text-sm text-gray-600">
              <span className="mr-2">当前能力评分：</span>
              <span className="font-bold text-lg text-blue-600">{currentAssessment.overallScore}</span>
              <span className="ml-1">/ 100</span>
              <span className="ml-4 text-green-600">✅ 数据已同步</span>
            </div>
          )}
        </div>

        {/* Architecture Highlights */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🚀 重构架构亮点</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🔄</div>
              <div className="text-sm font-medium text-blue-700">消除循环依赖</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-sm font-medium text-green-700">明确职责分离</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-sm font-medium text-purple-700">统一错误处理</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-medium text-orange-700">完整类型安全</div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`relative group ${module.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => module.available && onNavigate(module.view)}
            >
              <div className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 ${
                module.available ? 'hover:shadow-lg' : 'opacity-60'
              } transition-all duration-200`}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    module.status === '✅ 可用' 
                      ? 'bg-green-100 text-green-800'
                      : module.status === '🔄 开发中'
                      ? 'bg-blue-100 text-blue-800'
                      : module.status === '📋 规划中' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {module.status}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${module.color} text-white mb-4`}>
                  {module.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>

                {/* Hover Effect */}
                {module.available && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-black ring-opacity-0 group-hover:ring-opacity-10 transition-all duration-200"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 管理功能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('profile-management')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">👤</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile管理</h3>
                  <p className="text-sm text-gray-600">管理用户Profile和设置</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('ui-showcase')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎨</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">UI组件库</h3>
                  <p className="text-sm text-gray-600">查看所有可用UI组件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('system-diagnostics')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🔧</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">系统诊断</h3>
                  <p className="text-sm text-gray-600">检查系统状态和数据兼容性</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('data-management')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🗂️</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">数据管理</h3>
                  <p className="text-sm text-gray-600">管理学习数据和功能</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section - 与原系统相同的结构 */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            重构系统进度
          </h3>
          <div className="space-y-4">
            {currentAssessment ? (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">能力评估数据（共享）</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">总体评分</span>
                    <span className="font-bold">{currentAssessment.overallScore}/100</span>
                  </div>
                </div>
                
                {/* 各维度进度 */}
                <div className="space-y-3">
                  {Object.entries(currentAssessment.dimensions).map(([key, dimension]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {key === 'programming' && '编程基本功'}
                          {key === 'algorithm' && '算法能力'}
                          {key === 'project' && '项目能力'}
                          {key === 'systemDesign' && '系统设计'}
                          {key === 'communication' && '沟通协作'}
                        </span>
                        <span className="font-medium">{dimension.score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            dimension.score >= 80 ? 'bg-green-500' :
                            dimension.score >= 60 ? 'bg-blue-500' :
                            dimension.score >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${dimension.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">数据与原系统同步，请先完成能力评估</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default RefactorDashboard 