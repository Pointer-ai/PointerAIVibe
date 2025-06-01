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
import { Input, FormField, Label } from '../components/ui/Input/Input'
import { Badge } from '../components/ui/Badge/Badge'
import { ProgressBar } from '../components/ui/ProgressBar/ProgressBar'
import { Alert } from '../components/ui/Alert/Alert'
import { Modal, ConfirmModal } from '../components/ui/Modal/Modal'
import { Loading } from '../components/ui/Loading/Loading'
import { learningApi, isApiSuccess, handleApiError } from '../../api'
import type { LearningGoal, GoalFormData, ActivationResult } from '../../api'

interface GoalManagementPageProps {
  onNavigate?: (view: string) => void
}

export const GoalManagementPage: React.FC<GoalManagementPageProps> = ({ onNavigate }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [stats, setStats] = useState<any>(null)

  // 表单状态
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'frontend',
    priority: 1,
    targetLevel: 'intermediate',
    estimatedTimeWeeks: 4,
    requiredSkills: [],
    outcomes: []
  })

  // 初始化加载数据
  useEffect(() => {
    loadGoals()
    loadStats()
  }, [])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const result = await learningApi.getAllGoals()
      if (isApiSuccess(result)) {
        setGoals(result.data)
      } else {
        showMessage('error', handleApiError(result) || '加载目标失败')
      }
    } catch (error) {
      showMessage('error', '加载目标失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await learningApi.getGoalStats()
      if (isApiSuccess(result)) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'frontend',
      priority: 1,
      targetLevel: 'intermediate',
      estimatedTimeWeeks: 4,
      requiredSkills: [],
      outcomes: []
    })
    setShowForm(false)
    setEditingGoal(null)
  }

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(editingGoal ? 'update' : 'create')

    try {
      if (editingGoal) {
        // 更新目标
        const result = await learningApi.updateGoal(editingGoal.id, formData)
        if (isApiSuccess(result)) {
          showMessage('success', '目标更新成功')
          await loadGoals()
          await loadStats()
          resetForm()
        } else {
          showMessage('error', handleApiError(result) || '目标更新失败')
        }
      } else {
        // 创建新目标
        const result = await learningApi.createGoal(formData)
        if (isApiSuccess(result)) {
          showMessage('success', '目标创建成功')
          await loadGoals()
          await loadStats()
          resetForm()
        } else {
          showMessage('error', handleApiError(result) || '目标创建失败')
        }
      }
    } catch (error) {
      showMessage('error', editingGoal ? '目标更新失败' : '目标创建失败')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 目标管理</h1>
              <p className="text-gray-600 mt-2">
                创建和管理您的学习目标，制定个性化的学习计划
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

        {/* 目标列表 */}
        {loading ? (
          <Loading variant="spinner" size="lg" center />
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有学习目标</h3>
              <p className="text-gray-600 mb-6">创建您的第一个学习目标，开始个性化学习之旅</p>
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                创建第一个目标
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id} hover>
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                        <Badge variant="success">{goal.status}</Badge>
                        <Badge variant="secondary">{goal.category}</Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{goal.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-6">
                        <span>优先级: {goal.priority}</span>
                        <span>预计周期: {goal.estimatedTimeWeeks} 周</span>
                        <span>创建时间: {new Date(goal.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 目标创建/编辑表单 */}
        <Modal
          isOpen={showForm}
          onClose={resetForm}
          title={editingGoal ? '编辑目标' : '新建目标'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="目标标题" required>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入目标标题"
                  required
                />
              </FormField>

              <FormField label="目标类别">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="frontend">前端开发</option>
                  <option value="backend">后端开发</option>
                  <option value="fullstack">全栈开发</option>
                  <option value="automation">自动化</option>
                  <option value="ai">AI/机器学习</option>
                  <option value="mobile">移动开发</option>
                  <option value="game">游戏开发</option>
                  <option value="data">数据科学</option>
                  <option value="custom">自定义</option>
                </select>
              </FormField>
            </div>

            <FormField label="目标描述" required>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="详细描述这个学习目标"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </FormField>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={resetForm}>
                取消
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={actionLoading === 'create' || actionLoading === 'update'}
              >
                {editingGoal ? '更新目标' : '创建目标'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}

export default GoalManagementPage 