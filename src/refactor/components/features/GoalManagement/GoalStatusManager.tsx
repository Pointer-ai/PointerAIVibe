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
import { ConfirmModal } from '../../ui/Modal/Modal'
import { Alert } from '../../ui/Alert/Alert'
import { Goal } from './GoalList'

export interface GoalStatusManagerProps {
  goals: Goal[]
  selectedGoalIds: string[]
  onSelectionChange: (goalIds: string[]) => void
  onBatchStatusChange: (goalIds: string[], status: Goal['status']) => Promise<void>
  onBatchDelete: (goalIds: string[]) => Promise<void>
  loading?: boolean
  className?: string
}

interface StatusAction {
  status: Goal['status']
  label: string
  icon: string
  color: string
  description: string
}

const STATUS_ACTIONS: StatusAction[] = [
  {
    status: 'active',
    label: '激活',
    icon: '🚀',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: '将选中目标设为活跃状态'
  },
  {
    status: 'paused',
    label: '暂停',
    icon: '⏸️',
    color: 'bg-yellow-500 hover:bg-yellow-600',
    description: '暂停选中目标的进行'
  },
  {
    status: 'completed',
    label: '完成',
    icon: '✅',
    color: 'bg-green-500 hover:bg-green-600',
    description: '标记选中目标为已完成'
  },
  {
    status: 'cancelled',
    label: '取消',
    icon: '❌',
    color: 'bg-red-500 hover:bg-red-600',
    description: '取消选中目标'
  }
]

export const GoalStatusManager: React.FC<GoalStatusManagerProps> = ({
  goals,
  selectedGoalIds,
  onSelectionChange,
  onBatchStatusChange,
  onBatchDelete,
  loading = false,
  className = ''
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'status' | 'delete'
    status?: Goal['status']
    label: string
    description: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const selectedGoals = goals.filter(goal => selectedGoalIds.includes(goal.id))
  const hasSelection = selectedGoalIds.length > 0

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedGoalIds.length === goals.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(goals.map(g => g.id))
    }
  }

  // 处理状态变更确认
  const handleStatusChangeConfirm = () => {
    if (!confirmAction || confirmAction.type !== 'status' || !confirmAction.status) return
    
    setActionLoading(true)
    onBatchStatusChange(selectedGoalIds, confirmAction.status)
      .then(() => {
        setConfirmAction(null)
        onSelectionChange([]) // 清空选择
      })
      .catch((error) => {
        console.error('Batch status change failed:', error)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  // 处理批量删除确认
  const handleDeleteConfirm = () => {
    if (!confirmAction || confirmAction.type !== 'delete') return
    
    setActionLoading(true)
    onBatchDelete(selectedGoalIds)
      .then(() => {
        setConfirmAction(null)
        onSelectionChange([]) // 清空选择
      })
      .catch((error) => {
        console.error('Batch delete failed:', error)
      })
      .finally(() => {
        setActionLoading(false)
      })
  }

  // 按状态分组的选中目标
  const selectedGoalsByStatus = selectedGoals.reduce((acc, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1
    return acc
  }, {} as Record<Goal['status'], number>)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 选择状态栏 */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGoalIds.length > 0}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = selectedGoalIds.length > 0 && selectedGoalIds.length < goals.length
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  {selectedGoalIds.length === 0
                    ? '选择目标'
                    : selectedGoalIds.length === goals.length
                    ? '已全选'
                    : `已选择 ${selectedGoalIds.length} 项`
                  }
                </span>
              </label>

              {hasSelection && (
                <div className="flex space-x-2">
                  {Object.entries(selectedGoalsByStatus).map(([status, count]) => (
                    <Badge key={status} variant="secondary" className="text-xs">
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              共 {goals.length} 个目标
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作面板 */}
      {hasSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>批量操作</span>
              <Badge variant="primary">
                {selectedGoalIds.length} 个目标
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 状态变更操作 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">状态变更</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STATUS_ACTIONS.map((action) => (
                    <Button
                      key={action.status}
                      variant="secondary"
                      size="sm"
                      disabled={loading || actionLoading}
                      onClick={() => setConfirmAction({
                        type: 'status',
                        status: action.status,
                        label: action.label,
                        description: action.description
                      })}
                      className={`${action.color} text-white border-0 hover:text-white`}
                    >
                      <span className="mr-1">{action.icon}</span>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 其他操作 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">其他操作</h4>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={loading || actionLoading}
                    onClick={() => setConfirmAction({
                      type: 'delete',
                      label: '删除',
                      description: '此操作无法撤销，确定要删除这些目标吗？'
                    })}
                  >
                    🗑️ 批量删除
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={() => onSelectionChange([])}
                  >
                    取消选择
                  </Button>
                </div>
              </div>

              {/* 选中目标预览 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">选中的目标</h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedGoals.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {goal.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {goal.category} • {goal.status}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectionChange(
                          selectedGoalIds.filter(id => id !== goal.id)
                        )}
                        className="ml-2 px-2 py-1 text-xs"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  {selectedGoals.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      还有 {selectedGoals.length - 5} 个目标...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作建议 */}
      {!hasSelection && (
        <Alert variant="info">
          <div>
            <h4 className="font-medium mb-1">批量管理提示</h4>
            <p className="text-sm">
              勾选目标前的复选框来选择要批量操作的目标。你可以：
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• 批量激活、暂停或完成目标</li>
              <li>• 批量删除不需要的目标</li>
              <li>• 查看选中目标的统计信息</li>
            </ul>
          </div>
        </Alert>
      )}

      {/* 确认对话框 */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.type === 'delete' ? handleDeleteConfirm : handleStatusChangeConfirm}
        title={`确认${confirmAction?.label}`}
        content={`${confirmAction?.description}\n\n将要处理的目标（共 ${selectedGoalIds.length} 个）：\n${selectedGoals.slice(0, 3).map((goal) => `• ${goal.title}`).join('\n')}${selectedGoals.length > 3 ? `\n...还有 ${selectedGoals.length - 3} 个目标` : ''}${confirmAction?.type === 'delete' ? '\n\n注意：删除操作无法撤销，请谨慎操作。' : ''}`}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        confirmText={actionLoading ? '处理中...' : confirmAction?.label}
        cancelText="取消"
      />
    </div>
  )
} 