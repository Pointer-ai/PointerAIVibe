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
import { Alert, toast } from '../components/ui/Alert/Alert'
import { ConfirmModal } from '../components/ui/Modal/Modal'
import { Loading } from '../components/ui/Loading/Loading'
import { refactorProfileService } from '../services/profileService'

interface DataManagementPageProps {
  onNavigate: (view: string) => void
}

interface DeleteConfirmData {
  type: 'goal' | 'path' | 'unit'
  id: string
  title: string
}

/**
 * 重构版数据管理页面
 * 
 * 功能：
 * - 查看学习数据统计
 * - 管理学习目标、路径、课程单元
 * - 删除数据（支持级联删除）
 * - 导出数据
 * - 活动记录
 */
export const DataManagementPage: React.FC<DataManagementPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [learningData, setLearningData] = useState<any>(null)
  const [dataStats, setDataStats] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  // 刷新数据
  const refreshData = async () => {
    try {
      setRefreshing(true)
      
      // 获取当前Profile
      const profile = refactorProfileService.getCurrentProfile()
      setCurrentProfile(profile)
      
      // 获取学习数据
      const data = refactorProfileService.getProfileLearningData()
      setLearningData(data)
      
      // 获取数据统计
      const stats = refactorProfileService.getProfileDataStats()
      setDataStats(stats)
      
    } catch (error) {
      console.error('Failed to refresh data:', error)
      toast.error('数据刷新失败')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    refreshData()
  }, [])

  // 复制数据到剪贴板
  const copyToClipboard = (data: any) => {
    const text = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      toast.success('数据已复制到剪贴板')
    }).catch(() => {
      toast.error('复制失败')
    })
  }

  // 导出所有数据
  const exportAllData = () => {
    const exportData = refactorProfileService.exportLearningData()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-data-${currentProfile?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('数据导出成功')
  }

  // 处理删除操作
  const handleDelete = (type: 'goal' | 'path' | 'unit', id: string, title: string) => {
    setDeleteConfirm({ type, id, title })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      let result

      switch (deleteConfirm.type) {
        case 'goal':
          result = await refactorProfileService.deleteLearningGoal(deleteConfirm.id, deleteConfirm.title)
          break
        case 'path':
          result = await refactorProfileService.deleteLearningPath(deleteConfirm.id, deleteConfirm.title)
          break
        case 'unit':
          result = await refactorProfileService.deleteCourseUnit(deleteConfirm.id, deleteConfirm.title)
          break
      }

      if (result.success) {
        toast.success('删除成功')
        setDeleteConfirm(null)
        await refreshData()
      } else {
        toast.error(result.error || '删除失败')
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('删除操作失败')
      setDeleteConfirm(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="加载数据管理..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="secondary" 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🗂️ 数据管理</h1>
                <p className="text-gray-600">管理和查看学习数据，支持删除和导出功能</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={exportAllData}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出数据
              </Button>
              <Button
                variant="primary"
                onClick={refreshData}
                loading={refreshing}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新数据
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 数据统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 实时数据统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 实时数据统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataStats && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">学习目标</span>
                    <Badge variant="primary">{dataStats.goals} 个</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">学习路径</span>
                    <Badge variant="secondary">{dataStats.paths} 个</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">课程单元</span>
                    <Badge variant="info">{dataStats.courseUnits} 个</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">AI动作记录</span>
                    <Badge variant="warning">{dataStats.agentActions} 个</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">能力评估</span>
                    <Badge variant={dataStats.hasAssessment ? "success" : "danger"}>
                      {dataStats.hasAssessment ? "已完成" : "未完成"}
                    </Badge>
                  </div>
                  
                  {/* 目标状态分布 */}
                  {dataStats.goals > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">目标状态分布</h4>
                      <div className="space-y-1">
                        {Object.entries(dataStats.goalsByStatus as Record<string, number>).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{status}</span>
                            <span className="text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 路径状态分布 */}
                  {dataStats.paths > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">路径状态分布</h4>
                      <div className="space-y-1">
                        {Object.entries(dataStats.pathsByStatus as Record<string, number>).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{status}</span>
                            <span className="text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Profile信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentProfile && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">用户名</span>
                    <span className="font-medium">{currentProfile.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">创建时间</span>
                    <span className="text-sm text-gray-500">
                      {new Date(currentProfile.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">邮箱</span>
                    <span className="text-sm text-gray-500">
                      {currentProfile.email || '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">状态</span>
                    <Badge variant={currentProfile.isActive ? "success" : "secondary"}>
                      {currentProfile.isActive ? "活跃" : "非活跃"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 数据管理区域 */}
        <div className="space-y-6">
          {/* 学习目标管理 */}
          {learningData?.goals?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    🎯 学习目标管理
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(learningData.goals)}
                    className="flex items-center gap-2"
                  >
                    📋 复制数据
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningData.goals.map((goal: any) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary">{goal.category}</Badge>
                          <Badge variant={
                            goal.status === 'active' ? 'success' :
                            goal.status === 'completed' ? 'primary' :
                            goal.status === 'paused' ? 'warning' : 'danger'
                          }>
                            {goal.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            优先级: {goal.priority}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete('goal', goal.id, goal.title)}
                        className="flex items-center gap-2"
                      >
                        🗑️ 删除
                      </Button>
                    </div>
                  ))}
                </div>

                {/* 展开查看完整数据 */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看完整数据 ({learningData.goals.length} 个目标)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(learningData.goals, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* 学习路径管理 */}
          {learningData?.paths?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    🛤️ 学习路径管理
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(learningData.paths)}
                    className="flex items-center gap-2"
                  >
                    📋 复制数据
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningData.paths.map((path: any) => (
                    <div
                      key={path.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{path.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="info">{path.nodes.length} 节点</Badge>
                          <Badge variant={
                            path.status === 'active' ? 'success' :
                            path.status === 'completed' ? 'primary' :
                            path.status === 'frozen' ? 'warning' : 'secondary'
                          }>
                            {path.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {path.totalEstimatedHours}h
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete('path', path.id, path.title)}
                        className="flex items-center gap-2"
                      >
                        🗑️ 删除
                      </Button>
                    </div>
                  ))}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看完整数据 ({learningData.paths.length} 条路径)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(learningData.paths, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* 课程单元管理 */}
          {learningData?.courseUnits?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    📚 课程单元管理
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(learningData.courseUnits)}
                    className="flex items-center gap-2"
                  >
                    📋 复制数据
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningData.courseUnits.map((unit: any) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{unit.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="warning">{unit.type}</Badge>
                          <span className="text-sm text-gray-500">
                            难度: {unit.metadata?.difficulty || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete('unit', unit.id, unit.title)}
                        className="flex items-center gap-2"
                      >
                        🗑️ 删除
                      </Button>
                    </div>
                  ))}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看完整数据 ({learningData.courseUnits.length} 个单元)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(learningData.courseUnits, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* AI动作记录 */}
          {learningData?.agentActions?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    🤖 AI动作记录
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(learningData.agentActions)}
                    className="flex items-center gap-2"
                  >
                    📋 复制
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看 ({learningData.agentActions.length} 个动作记录)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(learningData.agentActions, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* 能力评估数据 */}
          {learningData?.currentAssessment && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    📊 能力评估数据
                  </CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(learningData.currentAssessment)}
                    className="flex items-center gap-2"
                  >
                    📋 复制
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">总体评分</span>
                    <Badge variant="primary" size="lg">
                      {learningData.currentAssessment.overallScore}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">评估日期</span>
                    <span className="text-sm text-gray-500">
                      {learningData.currentAssessment.metadata.assessmentDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">置信度</span>
                    <Badge variant="success">
                      {Math.round(learningData.currentAssessment.metadata.confidence * 100)}%
                    </Badge>
                  </div>
                </div>

                <details>
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看完整评估数据
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(learningData.currentAssessment, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 使用说明 */}
        <Alert variant="warning" className="mt-8">
          <div>
            <h4 className="font-medium mb-2">💡 使用说明</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>数据管理：</strong> 可以查看和删除学习目标、路径、课程单元</li>
              <li><strong>级联删除：</strong> 删除学习目标会自动删除相关的路径和内容</li>
              <li><strong>活动记录：</strong> 所有删除操作都会记录到活动历史中</li>
              <li><strong>数据导出：</strong> 点击"复制数据"按钮可以导出JSON格式的数据</li>
              <li><strong>实时更新：</strong> 点击"刷新数据"按钮可以获取最新的数据状态</li>
            </ul>
          </div>
        </Alert>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="⚠️ 确认删除"
          content={`您确定要删除 "${deleteConfirm.title}" 吗？此操作不可撤销。删除学习目标会同时删除相关的学习路径和课程内容。`}
          confirmText="确认删除"
          cancelText="取消"
          variant="danger"
        />
      )}
    </div>
  )
} 