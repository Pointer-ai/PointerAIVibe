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
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'
import { ConfirmModal } from '../../ui/Modal/Modal'
import { GoalFormData } from '../../../types/goal'

export interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  progress?: number
  createdAt: string
  updatedAt: string
}

export interface GoalListProps {
  goals: Goal[]
  loading?: boolean
  onEdit?: (goal: Goal) => void
  onDelete?: (goalId: string) => void
  onStatusChange?: (goalId: string, status: Goal['status']) => void
  onActivate?: (goalId: string) => void
  onPause?: (goalId: string) => void
  onComplete?: (goalId: string) => void
  className?: string
}

const STATUS_LABELS = {
  draft: { text: '草稿', color: 'secondary' },
  active: { text: '进行中', color: 'primary' },
  paused: { text: '暂停', color: 'warning' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'error' }
} as const

const CATEGORY_ICONS = {
  frontend: '🎨',
  backend: '⚙️',
  fullstack: '🚀',
  automation: '🤖',
  ai: '🧠',
  mobile: '📱',
  game: '🎮',
  data: '📊',
  custom: '✨'
} as const

const LEVEL_COLORS = {
  beginner: 'success',
  intermediate: 'primary',
  advanced: 'warning',
  expert: 'danger'
} as const

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onActivate,
  onPause,
  onComplete,
  className = ''
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (deleteConfirmId && onDelete) {
      setActionLoading(deleteConfirmId)
      try {
        await onDelete(deleteConfirmId)
        setDeleteConfirmId(null)
      } catch (error) {
        console.error('Delete failed:', error)
      } finally {
        setActionLoading(null)
      }
    }
  }

  // 处理状态变更
  const handleStatusAction = async (goalId: string, action: 'activate' | 'pause' | 'complete') => {
    setActionLoading(goalId)
    try {
      switch (action) {
        case 'activate':
          if (onActivate) await onActivate(goalId)
          break
        case 'pause':
          if (onPause) await onPause(goalId)
          break
        case 'complete':
          if (onComplete) await onComplete(goalId)
          break
      }
    } catch (error) {
      console.error(`${action} failed:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  // 渲染目标卡片
  const renderGoalCard = (goal: Goal) => {
    const statusConfig = STATUS_LABELS[goal.status]
    const categoryIcon = CATEGORY_ICONS[goal.category as keyof typeof CATEGORY_ICONS] || '📝'
    const isLoading = actionLoading === goal.id

    return (
      <Card key={goal.id} hover className="transition-all">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 标题和状态 */}
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">{categoryIcon}</span>
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {goal.title}
                </h3>
                <Badge 
                  variant={statusConfig.color as any}
                  className="shrink-0"
                >
                  {statusConfig.text}
                </Badge>
              </div>

              {/* 描述 */}
              <p className="text-gray-600 mb-3 line-clamp-2">
                {goal.description}
              </p>

              {/* 进度条 */}
              {goal.status === 'active' && typeof goal.progress === 'number' && (
                <div className="mb-3">
                  <ProgressBar 
                    value={goal.progress} 
                    className="h-2"
                    showLabel
                  />
                </div>
              )}

              {/* 技能标签 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {goal.requiredSkills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {goal.requiredSkills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{goal.requiredSkills.length - 3}
                  </Badge>
                )}
              </div>

              {/* 元信息 */}
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>优先级: {goal.priority}</span>
                <Badge variant={LEVEL_COLORS[goal.targetLevel]} className="text-xs">
                  {goal.targetLevel}
                </Badge>
                <span>{goal.estimatedTimeWeeks} 周</span>
                <span>{new Date(goal.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="ml-4 flex flex-col space-y-2">
              {/* 状态操作按钮 */}
              <div className="flex space-x-1">
                {goal.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStatusAction(goal.id, 'activate')}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    激活
                  </Button>
                )}
                
                {goal.status === 'active' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusAction(goal.id, 'pause')}
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      暂停
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusAction(goal.id, 'complete')}
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      完成
                    </Button>
                  </>
                )}
                
                {goal.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStatusAction(goal.id, 'activate')}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    继续
                  </Button>
                )}
              </div>

              {/* 编辑和删除按钮 */}
              <div className="flex space-x-1">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(goal)}
                    disabled={isLoading}
                  >
                    编辑
                  </Button>
                )}
                
                {onDelete && goal.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteConfirmId(goal.id)}
                    disabled={isLoading}
                  >
                    删除
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有学习目标</h3>
          <p className="text-gray-600">创建您的第一个学习目标，开始个性化学习之旅</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {goals.map(renderGoalCard)}
      
      {/* 删除确认对话框 */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="确认删除目标"
        content="删除后无法恢复，确定要删除这个学习目标吗？"
      />
    </div>
  )
} 