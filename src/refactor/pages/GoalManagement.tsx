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
import { Alert } from '../components/ui/Alert/Alert'
import { Loading } from '../components/ui/Loading/Loading'
import { GoalForm } from '../components/features/GoalManagement/GoalForm'
import { GoalList, Goal } from '../components/features/GoalManagement/GoalList'
import { GoalStats } from '../components/features/GoalManagement/GoalStats'
import { GoalStatusManager } from '../components/features/GoalManagement/GoalStatusManager'
import { GoalFormData } from '../types/goal'
import { learningApi, isApiSuccess, handleApiError } from '../../api'

interface GoalManagementPageProps {
  onNavigate?: (view: string) => void
}

export const GoalManagementPage: React.FC<GoalManagementPageProps> = ({ onNavigate }) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'batch'>('list')
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])

  // 初始化加载数据
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    setLoading(true)
    try {
      // 模拟API调用，创建一些示例数据
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'React高级开发技能',
          description: '掌握React的高级特性，包括Hooks、Context、性能优化等',
          category: 'frontend',
          priority: 1,
          status: 'active',
          targetLevel: 'advanced',
          estimatedTimeWeeks: 8,
          requiredSkills: ['JavaScript', 'React', 'TypeScript'],
          outcomes: ['完成3个项目', '掌握性能优化'],
          progress: 65,
          createdAt: '2024-01-15',
          updatedAt: '2024-02-20'
        },
        {
          id: '2',
          title: 'Node.js后端开发',
          description: '学习Node.js和Express框架，构建RESTful API',
          category: 'backend',
          priority: 2,
          status: 'draft',
          targetLevel: 'intermediate',
          estimatedTimeWeeks: 6,
          requiredSkills: ['JavaScript', 'Node.js', 'Express'],
          outcomes: ['构建完整API', '数据库集成'],
          progress: 0,
          createdAt: '2024-02-01',
          updatedAt: '2024-02-01'
        },
        {
          id: '3',
          title: 'Python数据分析',
          description: '学习pandas、numpy等数据分析库',
          category: 'data',
          priority: 3,
          status: 'completed',
          targetLevel: 'intermediate',
          estimatedTimeWeeks: 4,
          requiredSkills: ['Python', 'pandas', 'numpy'],
          outcomes: ['完成数据分析项目'],
          progress: 100,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-30'
        },
        {
          id: '4',
          title: 'Docker容器化部署',
          description: '学习Docker和Kubernetes容器技术',
          category: 'automation',
          priority: 2,
          status: 'paused',
          targetLevel: 'beginner',
          estimatedTimeWeeks: 3,
          requiredSkills: ['Docker', 'Linux'],
          outcomes: ['容器化应用'],
          progress: 30,
          createdAt: '2024-01-20',
          updatedAt: '2024-02-10'
        }
      ]
      setGoals(mockGoals)
    } catch (error) {
      showMessage('error', '加载目标失败')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 处理目标创建/更新
  const handleGoalSubmit = async (formData: GoalFormData) => {
    setActionLoading(true)
    try {
      if (editingGoal) {
        // 更新目标
        setGoals(prev => prev.map(goal => 
          goal.id === editingGoal.id 
            ? { ...goal, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
            : goal
        ))
        showMessage('success', '目标更新成功')
      } else {
        // 创建新目标
        const newGoal: Goal = {
          id: Date.now().toString(),
          ...formData,
          status: 'draft',
          progress: 0,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        }
        setGoals(prev => [newGoal, ...prev])
        showMessage('success', '目标创建成功')
      }
      setShowForm(false)
      setEditingGoal(null)
    } catch (error) {
      showMessage('error', editingGoal ? '目标更新失败' : '目标创建失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 处理目标编辑
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  // 处理目标删除
  const handleDelete = async (goalId: string) => {
    try {
      setGoals(prev => prev.filter(goal => goal.id !== goalId))
      showMessage('success', '目标删除成功')
    } catch (error) {
      showMessage('error', '目标删除失败')
    }
  }

  // 处理状态变更
  const handleStatusChange = async (goalId: string, status: Goal['status']) => {
    try {
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, status, updatedAt: new Date().toISOString().split('T')[0] }
          : goal
      ))
      showMessage('success', '状态更新成功')
    } catch (error) {
      showMessage('error', '状态更新失败')
    }
  }

  // 处理目标激活
  const handleActivate = async (goalId: string) => {
    await handleStatusChange(goalId, 'active')
  }

  // 处理目标暂停
  const handlePause = async (goalId: string) => {
    await handleStatusChange(goalId, 'paused')
  }

  // 处理目标完成
  const handleComplete = async (goalId: string) => {
    await handleStatusChange(goalId, 'completed')
    // 同时更新进度为100%
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, progress: 100 }
        : goal
    ))
  }

  // 处理批量状态变更
  const handleBatchStatusChange = async (goalIds: string[], status: Goal['status']) => {
    try {
      setGoals(prev => prev.map(goal => 
        goalIds.includes(goal.id)
          ? { ...goal, status, updatedAt: new Date().toISOString().split('T')[0] }
          : goal
      ))
      showMessage('success', `批量${status}操作成功`)
    } catch (error) {
      showMessage('error', '批量操作失败')
    }
  }

  // 处理批量删除
  const handleBatchDelete = async (goalIds: string[]) => {
    try {
      setGoals(prev => prev.filter(goal => !goalIds.includes(goal.id)))
      showMessage('success', '批量删除成功')
    } catch (error) {
      showMessage('error', '批量删除失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading variant="spinner" size="lg" center />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 目标管理</h1>
              <p className="text-gray-600 mt-2">
                创建和管理您的学习目标，统计分析进度，批量操作管理
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                新建目标
              </Button>
              {onNavigate && (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('main')}
                >
                  返回主页
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-6">
            {message.text}
          </Alert>
        )}

        {/* 标签页导航 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'list', label: '目标列表', icon: '📝' },
              { key: 'stats', label: '统计分析', icon: '📊' },
              { key: 'batch', label: '批量管理', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === 'list' && (
                  <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                    {goals.length}
                  </span>
                )}
                {tab.key === 'batch' && selectedGoalIds.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 text-xs">
                    {selectedGoalIds.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 标签页内容 */}
        {activeTab === 'list' && (
          <GoalList
            goals={goals}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onPause={handlePause}
            onComplete={handleComplete}
          />
        )}

        {activeTab === 'stats' && (
          <GoalStats goals={goals} />
        )}

        {activeTab === 'batch' && (
          <GoalStatusManager
            goals={goals}
            selectedGoalIds={selectedGoalIds}
            onSelectionChange={setSelectedGoalIds}
            onBatchStatusChange={handleBatchStatusChange}
            onBatchDelete={handleBatchDelete}
          />
        )}

        {/* 目标表单弹窗 */}
        {showForm && (
          <GoalForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingGoal(null)
            }}
            onSubmit={handleGoalSubmit}
            initialData={editingGoal ? {
              title: editingGoal.title,
              description: editingGoal.description,
              category: editingGoal.category,
              priority: editingGoal.priority,
              targetLevel: editingGoal.targetLevel,
              estimatedTimeWeeks: editingGoal.estimatedTimeWeeks,
              requiredSkills: editingGoal.requiredSkills,
              outcomes: editingGoal.outcomes
            } : undefined}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  )
}

export default GoalManagementPage 