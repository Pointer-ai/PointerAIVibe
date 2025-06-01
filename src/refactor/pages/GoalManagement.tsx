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
import { GoalFormData } from '../types/goal'
import { learningApi } from '../../api'
import { GoalForm } from '../components/features/GoalManagement/GoalForm'

// 导入重构系统的UI组件
import { Button } from '../components/ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card/Card'
import { Badge, StatusBadge } from '../components/ui/Badge/Badge'
import { Alert } from '../components/ui/Alert/Alert'
import { Loading } from '../components/ui/Loading/Loading'

interface GoalManagementPageProps {
  onNavigate?: (view: string) => void
}

interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  targetLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  progress: number
  createdAt: Date
  updatedAt: Date
}

export const GoalManagementPage: React.FC<GoalManagementPageProps> = ({ onNavigate }) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 初始化加载数据
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    setLoading(true)
    try {
      // 通过 learningApi 获取目标列表
      const response = await learningApi.getAllGoals()
      if (response.success && response.data) {
        // 转换原系统的目标格式为重构系统格式
        const convertedGoals = response.data.map(goal => convertLearningGoalToGoal(goal))
        setGoals(convertedGoals)
      } else {
        throw new Error(response.error || '获取目标列表失败')
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
      showMessage('error', '加载目标失败')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 获取目标统计
  const getGoalStats = () => {
    const response = learningApi.getGoalStats()
    if (response.success && response.data) {
      return {
        active: response.data.active || 0,
        completed: response.data.completed || 0,
        paused: response.data.paused || 0,
        cancelled: response.data.cancelled || 0,
        total: response.data.total || 0,
        canActivateMore: response.data.activation?.active < response.data.activation?.maxActive
      }
    }
    return {
      active: 0,
      completed: 0,
      paused: 0,
      cancelled: 0,
      total: 0,
      canActivateMore: true
    }
  }

  // 处理目标创建/更新
  const handleGoalSubmit = async (formData: GoalFormData) => {
    setActionLoading(true)
    try {
      // 转换 GoalFormData 为 learningApi 期望的格式
      const apiFormData = {
        title: formData.title,
        description: formData.description,
        category: mapCategoryToApiFormat(formData.category),
        priority: formData.priority,
        targetLevel: mapTargetLevelToApiFormat(formData.targetLevel),
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes
      }

      if (editingGoal) {
        // 更新目标
        const response = await learningApi.updateGoal(editingGoal.id, apiFormData)
        if (response.success) {
          await loadGoals()
          showMessage('success', '目标更新成功')
        } else {
          throw new Error(response.error || '更新目标失败')
        }
      } else {
        // 创建新目标
        const response = await learningApi.createGoal(apiFormData)
        if (response.success) {
          await loadGoals()
          showMessage('success', `成功创建目标: ${formData.title}`)
        } else {
          throw new Error(response.error || '创建目标失败')
        }
      }
      setShowForm(false)
      setEditingGoal(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      showMessage('error', errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // 删除目标
  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (!confirm(`确定要删除目标"${goalTitle}"吗？相关的学习路径也会被删除。`)) {
      return
    }

    setActionLoading(true)
    try {
      const response = await learningApi.deleteGoal(goalId)
      if (response.success) {
        showMessage('success', '目标删除成功')
        await loadGoals()
      } else {
        throw new Error(response.error || '删除目标失败')
      }
    } catch (error) {
      showMessage('error', `删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setActionLoading(false)
    }
  }

  // 激活目标
  const handleActivateGoal = async (goalId: string) => {
    setActionLoading(true)
    try {
      const response = await learningApi.activateGoal(goalId)
      if (response.success) {
        showMessage('success', '目标激活成功')
        await loadGoals()
      } else {
        throw new Error(response.error || '激活目标失败')
      }
    } catch (error) {
      showMessage('error', `激活失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setActionLoading(false)
    }
  }

  // 暂停目标
  const handlePauseGoal = async (goalId: string) => {
    setActionLoading(true)
    try {
      const response = await learningApi.pauseGoal(goalId)
      if (response.success) {
        showMessage('success', '目标暂停成功')
        await loadGoals()
      } else {
        throw new Error(response.error || '暂停目标失败')
      }
    } catch (error) {
      showMessage('error', `暂停失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setActionLoading(false)
    }
  }

  // 完成目标
  const handleCompleteGoal = async (goalId: string) => {
    const achievements = prompt('请输入完成成果（可选，用逗号分隔）:')
    
    setActionLoading(true)
    try {
      const response = await learningApi.completeGoal(goalId, achievements ? achievements.split(',').map(s => s.trim()) : undefined)
      if (response.success) {
        showMessage('success', '目标完成成功')
        await loadGoals()
      } else {
        throw new Error(response.error || '完成目标失败')
      }
    } catch (error) {
      showMessage('error', `完成操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setActionLoading(false)
    }
  }

  // 取消目标
  const handleCancelGoal = async (goalId: string) => {
    setActionLoading(true)
    try {
      const response = await learningApi.cancelGoal(goalId)
      if (response.success) {
        showMessage('success', '目标取消成功')
        await loadGoals()
      } else {
        throw new Error(response.error || '取消目标失败')
      }
    } catch (error) {
      showMessage('error', `取消失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setActionLoading(false)
    }
  }

  // 编辑目标
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  // 获取类别文本
  const getCategoryText = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'frontend': '前端开发',
      'backend': '后端开发',
      'fullstack': '全栈开发',
      'mobile': '移动开发',
      'data': '数据科学',
      'ai': '人工智能',
      'devops': '运维开发',
      'design': '设计',
      'other': '其他'
    }
    return categoryMap[category] || category
  }

  // 获取级别文本
  const getLevelText = (level: string): string => {
    const levelMap: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级'
    }
    return levelMap[level] || level
  }

  // 获取状态变体
  const getStatusVariant = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'active': return 'success'
      case 'completed': return 'primary'
      case 'paused': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  // 获取状态Badge状态
  const getStatusBadgeStatus = (status: string): 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'error' => {
    switch (status) {
      case 'active': return 'active'
      case 'completed': return 'completed'
      case 'paused': return 'pending'
      case 'cancelled': return 'cancelled'
      default: return 'inactive'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'paused': return '已暂停'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const goalStats = getGoalStats()

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
              <h1 className="text-3xl font-bold text-gray-900">🎯 目标设定</h1>
              <p className="text-gray-600 mt-2">设定和管理你的学习目标，分析与当前能力的差距</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                ➕ 新建目标
              </Button>
              <Button
                variant="secondary"
                onClick={loadGoals}
              >
                🔄 刷新
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
          <Alert variant={message.type} className="mb-6">
            {message.text}
          </Alert>
        )}

        {/* 加载提示 */}
        {actionLoading && (
          <Alert variant="info" className="mb-6">
            <div className="flex items-center gap-2">
              <Loading variant="spinner" size="sm" />
              处理中...
            </div>
          </Alert>
        )}

        {/* 目标统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="default" className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">进行中</p>
                  <p className="text-3xl font-bold text-green-700">{goalStats.active}</p>
                </div>
                <div className="text-green-400 text-2xl">🎯</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">已完成</p>
                  <p className="text-3xl font-bold text-blue-700">{goalStats.completed}</p>
                </div>
                <div className="text-blue-400 text-2xl">✅</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">已暂停</p>
                  <p className="text-3xl font-bold text-orange-700">{goalStats.paused}</p>
                </div>
                <div className="text-orange-400 text-2xl">⏸️</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default" className="bg-gray-50 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">已取消</p>
                  <p className="text-3xl font-bold text-gray-700">{goalStats.cancelled}</p>
                </div>
                <div className="text-gray-400 text-2xl">❌</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 目标激活管理卡片 */}
        <Card variant="default" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-purple-500 text-2xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">目标激活管理</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card variant="bordered" className="bg-white">
                    <CardContent className="p-3">
                      <div className="text-sm text-purple-600 font-medium">激活中</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {goalStats.active}/3
                      </div>
                      <div className="text-xs text-purple-500">
                        利用率 {Math.round((goalStats.active / 3) * 100)}%
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card variant="bordered" className="bg-white">
                    <CardContent className="p-3">
                      <div className="text-sm text-blue-600 font-medium">可用槽位</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {3 - goalStats.active}
                      </div>
                      <div className="text-xs text-blue-500">剩余空间</div>
                    </CardContent>
                  </Card>
                  
                  <Card variant="bordered" className="bg-white">
                    <CardContent className="p-3">
                      <div className="text-sm text-green-600 font-medium">完成率</div>
                      <div className="text-2xl font-bold text-green-900">
                        {goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0}%
                      </div>
                      <div className="text-xs text-green-500">
                        {goalStats.completed}/{goalStats.total}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💡 智能管理:</span>
                    <span>
                      {goalStats.active < 2 
                        ? '可以激活更多目标开始学习' 
                        : goalStats.active === 3 
                        ? '目标激活率已满，注意合理分配时间'
                        : '目标激活数量适中'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 目标列表 */}
        <Card variant="shadow">
          <CardHeader>
            <CardTitle>学习目标列表</CardTitle>
            <p className="text-sm text-gray-600 mt-1">管理您的所有学习目标</p>
          </CardHeader>
          
          <CardContent className="p-0">
            {goals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h4 className="text-xl font-medium text-gray-900 mb-2">还没有学习目标</h4>
                <p className="text-gray-600 mb-6">创建您的第一个学习目标，开始您的学习之旅</p>
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                >
                  ➕ 创建目标
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                          <StatusBadge status={getStatusBadgeStatus(goal.status)} />
                          <Badge variant="primary">
                            {getCategoryText(goal.category)}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{goal.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <span>📈</span>
                            {getLevelText(goal.targetLevel)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⭐</span>
                            优先级 {goal.priority}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⏱️</span>
                            {goal.estimatedTimeWeeks} 周
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🛠️</span>
                            {goal.requiredSkills.length} 项技能
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🎯</span>
                            {goal.outcomes.length} 个目标
                          </span>
                        </div>

                        {/* 技能标签 */}
                        {goal.requiredSkills.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">所需技能:</div>
                            <div className="flex flex-wrap gap-2">
                              {goal.requiredSkills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                              {goal.requiredSkills.length > 5 && (
                                <Badge variant="secondary">
                                  +{goal.requiredSkills.length - 5} 更多
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 预期成果 */}
                        {goal.outcomes.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-600 mb-2">预期成果:</div>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                              {goal.outcomes.slice(0, 3).map((outcome, index) => (
                                <li key={index}>{outcome}</li>
                              ))}
                              {goal.outcomes.length > 3 && (
                                <li className="text-gray-500">+{goal.outcomes.length - 3} 更多成果</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                        >
                          📝 编辑
                        </Button>
                        
                        {goal.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePauseGoal(goal.id)}
                          >
                            ⏸️ 暂停
                          </Button>
                        )}
                        
                        {goal.status === 'paused' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleActivateGoal(goal.id)}
                            disabled={!goalStats.canActivateMore}
                          >
                            ▶️ 激活
                          </Button>
                        )}
                        
                        {['active', 'paused'].includes(goal.status) && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleCompleteGoal(goal.id)}
                            >
                              ✅ 完成
                            </Button>
                            
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelGoal(goal.id)}
                            >
                              ❌ 取消
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        >
                          🗑️ 删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 使用说明卡片 */}
        <Card variant="default" className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 使用说明</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div><strong>目标状态管理：</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>进行中：</strong> 当前正在学习的目标（最多3个）</li>
                <li><strong>已暂停：</strong> 暂时停止学习，可重新激活</li>
                <li><strong>已完成：</strong> 学习目标已达成</li>
                <li><strong>已取消：</strong> 不再继续此目标</li>
              </ul>
              <div className="mt-3">
                <strong>限制规则：</strong> 为保持专注，最多同时激活3个目标。超出限制时请先暂停或完成现有目标。
              </div>
            </div>
          </CardContent>
        </Card>

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

/**
 * 将原系统的 LearningGoal 转换为重构系统的 Goal
 */
const convertLearningGoalToGoal = (learningGoal: any): Goal => {
  return {
    id: learningGoal.id,
    title: learningGoal.title,
    description: learningGoal.description,
    category: mapCategoryFromOldFormat(learningGoal.category),
    priority: learningGoal.priority || 1,
    status: mapStatusFromOldFormat(learningGoal.status),
    targetLevel: mapTargetLevelFromOldFormat(learningGoal.targetLevel),
    estimatedTimeWeeks: learningGoal.estimatedTimeWeeks || 1,
    requiredSkills: learningGoal.requiredSkills || [],
    outcomes: learningGoal.outcomes || [],
    progress: learningGoal.progress || 0,
    createdAt: new Date(learningGoal.createdAt),
    updatedAt: new Date(learningGoal.updatedAt)
  }
}

/**
 * 映射类别从原格式
 */
const mapCategoryFromOldFormat = (category: any): string => {
  const categoryMap: Record<string, string> = {
    'frontend': 'frontend',
    'backend': 'backend',
    'fullstack': 'fullstack',
    'mobile': 'mobile',
    'data': 'data',
    'ai': 'ai',
    'devops': 'devops',
    'design': 'design',
    'other': 'other'
  }
  return categoryMap[category] || 'other'
}

/**
 * 映射类别到API格式
 */
const mapCategoryToApiFormat = (category: string): 'frontend' | 'backend' | 'fullstack' | 'automation' | 'ai' | 'mobile' | 'game' | 'data' | 'custom' => {
  const categoryMap: Record<string, 'frontend' | 'backend' | 'fullstack' | 'automation' | 'ai' | 'mobile' | 'game' | 'data' | 'custom'> = {
    'frontend': 'frontend',
    'backend': 'backend',
    'fullstack': 'fullstack',
    'mobile': 'mobile',
    'data': 'data',
    'ai': 'ai',
    'devops': 'automation',
    'design': 'custom',
    'other': 'custom'
  }
  return categoryMap[category] || 'custom'
}

/**
 * 映射状态从原格式
 */
const mapStatusFromOldFormat = (status: any): Goal['status'] => {
  const statusMap: Record<string, Goal['status']> = {
    'draft': 'draft',
    'active': 'active',
    'paused': 'paused',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || 'draft'
}

/**
 * 映射目标级别从原格式
 */
const mapTargetLevelFromOldFormat = (level: any): Goal['targetLevel'] => {
  const levelMap: Record<string, Goal['targetLevel']> = {
    'beginner': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced'
  }
  return levelMap[level] || 'beginner'
}

/**
 * 映射目标级别到API格式
 */
const mapTargetLevelToApiFormat = (level: string): 'beginner' | 'intermediate' | 'advanced' => {
  const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
    'beginner': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced'
  }
  return levelMap[level] || 'beginner'
} 