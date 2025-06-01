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
import { goalApi, isApiSuccess, handleApiError } from '../../api'

/**
 * 重构系统 - 目标管理页面
 * 
 * 使用新的架构模式：
 * - 组件化设计
 * - API层集成  
 * - 统一错误处理
 * - 类型安全
 */
export const GoalManagement: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // 加载目标列表
  const loadGoals = async () => {
    setLoading(true)
    try {
      const result = goalApi.getAllGoals()
      if (isApiSuccess(result)) {
        setGoals(result.data)
        showMessage(`✅ 加载了 ${result.data.length} 个目标`)
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 加载目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 目标管理 (重构版)
        </h1>
        <p className="text-gray-600 text-lg">
          使用重构后的API层和组件架构，提供更好的用户体验
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">API层集成</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">类型安全</span>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">组件化设计</span>
        </div>
      </div>

      {/* 消息显示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* 操作区域 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">目标列表</h2>
          <div className="flex space-x-3">
            <button
              onClick={loadGoals}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '加载中...' : '🔄 刷新'}
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              ➕ 新建目标
            </button>
          </div>
        </div>

        {/* 目标列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    goal.status === 'active' ? 'bg-green-100 text-green-700' :
                    goal.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                    goal.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>优先级: {goal.priority}</span>
                  <span>{goal.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="mt-2">暂无目标，点击"新建目标"开始</p>
          </div>
        )}
      </div>

      {/* 功能对比 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-3">🆚 重构优势对比</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-red-700 mb-2">❌ 原架构问题</h4>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• 组件直接依赖业务服务</li>
              <li>• 错误处理不统一</li>
              <li>• 循环依赖问题</li>
              <li>• 类型定义分散</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-700 mb-2">✅ 重构架构优势</h4>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• 通过API层统一访问</li>
              <li>• 统一的错误处理机制</li>
              <li>• 清晰的依赖关系</li>
              <li>• 完整的TypeScript支持</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 开发状态 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">🔄 开发状态</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            基础架构搭建 - 已完成
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            API层集成 - 已完成
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
            组件功能完善 - 进行中
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-400 rounded-full mr-3"></span>
            表单组件集成 - 待开发
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-400 rounded-full mr-3"></span>
            批量操作功能 - 待开发
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalManagement 