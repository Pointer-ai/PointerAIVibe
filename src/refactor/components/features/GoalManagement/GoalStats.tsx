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

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'
import { Goal } from './GoalList'

export interface GoalStatsProps {
  goals: Goal[]
  className?: string
}

interface StatsData {
  total: number
  byStatus: Record<Goal['status'], number>
  byCategory: Record<string, number>
  byLevel: Record<Goal['targetLevel'], number>
  averageProgress: number
  completionRate: number
  activeGoals: number
  upcomingDeadlines: Goal[]
}

export const GoalStats: React.FC<GoalStatsProps> = ({
  goals,
  className = ''
}) => {
  // 计算统计数据
  const stats: StatsData = React.useMemo(() => {
    const total = goals.length
    
    const byStatus = goals.reduce((acc, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1
      return acc
    }, {} as Record<Goal['status'], number>)
    
    const byCategory = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byLevel = goals.reduce((acc, goal) => {
      acc[goal.targetLevel] = (acc[goal.targetLevel] || 0) + 1
      return acc
    }, {} as Record<Goal['targetLevel'], number>)
    
    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = byStatus.completed || 0
    const completionRate = total > 0 ? (completedGoals / total) * 100 : 0
    
    const averageProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length
      : 0
    
    // 即将到期的目标（这里简化处理，基于创建时间）
    const upcomingDeadlines = activeGoals
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 3)
    
    return {
      total,
      byStatus,
      byCategory,
      byLevel,
      averageProgress,
      completionRate,
      activeGoals: activeGoals.length,
      upcomingDeadlines
    }
  }, [goals])

  const STATUS_CONFIG = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600', icon: '📝' },
    active: { label: '进行中', color: 'bg-blue-100 text-blue-600', icon: '🚀' },
    paused: { label: '暂停', color: 'bg-yellow-100 text-yellow-600', icon: '⏸️' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600', icon: '✅' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-600', icon: '❌' }
  }

  const LEVEL_CONFIG = {
    beginner: { label: '初级', color: 'success' },
    intermediate: { label: '中级', color: 'primary' },
    advanced: { label: '高级', color: 'warning' },
    expert: { label: '专家', color: 'danger' }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">总目标数</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.activeGoals}
              </div>
              <div className="text-sm text-gray-600">活跃目标</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(stats.averageProgress)}%
              </div>
              <div className="text-sm text-gray-600">平均进度</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {Math.round(stats.completionRate)}%
              </div>
              <div className="text-sm text-gray-600">完成率</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle>状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = stats.byStatus[status as Goal['status']] || 0
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{config.icon}</span>
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20">
                        <ProgressBar value={percentage} size="sm" showLabel={false} />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 难度级别分布 */}
        <Card>
          <CardHeader>
            <CardTitle>难度级别分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                const count = stats.byLevel[level as Goal['targetLevel']] || 0
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={config.color as any} className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20">
                        <ProgressBar value={percentage} size="sm" showLabel={false} />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计 */}
      {Object.keys(stats.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>类别分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                const categoryIcons: Record<string, string> = {
                  frontend: '🎨',
                  backend: '⚙️',
                  fullstack: '🚀',
                  automation: '🤖',
                  ai: '🧠',
                  mobile: '📱',
                  game: '🎮',
                  data: '📊'
                }
                
                return (
                  <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl mb-1">
                      {categoryIcons[category] || '📝'}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {category}
                    </div>
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 即将到期的目标 */}
      {stats.upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>活跃目标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {goal.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      预计 {goal.estimatedTimeWeeks} 周 • {goal.targetLevel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600 mb-1">
                      {Math.round(goal.progress || 0)}%
                    </div>
                    <div className="w-16">
                      <ProgressBar 
                        value={goal.progress || 0} 
                        size="sm" 
                        showLabel={false}
                        variant="info"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 