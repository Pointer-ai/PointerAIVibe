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
import { LearningAPI } from '../../api/learningApi'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  Alert,
  ProgressBar
} from '../components/ui'
import { getCurrentProfile } from '../../utils/profile'
// 使用any类型暂时解决类型问题
type LearningPath = any
import { StatusBadge } from '../components/ui/Badge/Badge'
import { ConfirmModal, Modal } from '../components/ui/Modal/Modal'
import { Loading } from '../components/ui/Loading/Loading'
import { toast } from '../components/ui/Alert/Alert'

interface DataManagementPageProps {
  onNavigate: (view: string) => void
}

interface DeleteConfirmData {
  type: 'goal' | 'path' | 'unit' | 'content'
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
 * - 增强的路径数据管理 ⭐新增
 */
export const DataManagementPage: React.FC<DataManagementPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [learningData, setLearningData] = useState<any>(null)
  const [dataStats, setDataStats] = useState<any>(null)
  const [pathProgress, setPathProgress] = useState<Record<string, any>>({}) // ⭐新增
  const [courseContentStats, setCourseContentStats] = useState<any>(null) // ⭐新增课程内容统计
  const [selectedPath, setSelectedPath] = useState<any>(null) // ⭐新增
  const [showPathDetails, setShowPathDetails] = useState(false) // ⭐新增
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [exportData, setExportData] = useState<string | null>(null)

  // 刷新数据
  const refreshData = async () => {
    setLoading(true)
    try {
      const api = LearningAPI.getInstance()
      
      // 获取当前Profile
      const profileResponse = api.getCurrentProfile()
      if (!profileResponse.success || !profileResponse.data) {
        toast.error('无法获取当前Profile')
        return
      }
      
      const profile = profileResponse.data
      setCurrentProfile(profile)
      
      // 获取学习数据
      const dataResponse = api.getProfileLearningData()
      if (dataResponse.success) {
        setLearningData(dataResponse.data)
        
        // 获取路径进度信息
        if (dataResponse.data.paths) {
          const progressData: Record<string, any> = {}
          for (const path of dataResponse.data.paths) {
            const progressResponse = api.getPathProgress(path.id)
            if (progressResponse.success) {
              progressData[path.id] = progressResponse.data
            }
          }
          setPathProgress(progressData)
        }
      }
      
      // 获取数据统计
      const statsResponse = api.getProfileDataStats()
      if (statsResponse.success) {
        setDataStats(statsResponse.data)
      }
      
      // ⭐新增：获取课程内容统计
      const courseStatsResponse = api.getCourseContentStats()
      if (courseStatsResponse.success) {
        setCourseContentStats(courseStatsResponse.data)
      }
      
    } catch (error) {
      console.error('刷新数据失败:', error)
      toast.error('刷新数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    refreshData()
  }, [])

  // 复制数据到剪贴板
  const copyToClipboard = (data: any) => {
    const dataStr = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(dataStr)
    toast.success('数据已复制到剪贴板')
  }

  // 导出所有数据
  const handleExport = async () => {
    try {
      const api = LearningAPI.getInstance()
      const exportResponse = api.exportLearningData()
      if (exportResponse.success) {
        setExportData(exportResponse.data || null)
        toast.success('数据导出成功')
      } else {
        toast.error(exportResponse.error || '导出失败')
      }
    } catch (error) {
      toast.error('导出操作失败')
    }
  }

  // 处理删除操作
  const handleDelete = (type: 'goal' | 'path' | 'unit' | 'content', id: string, title: string) => {
    setDeleteConfirm({ type, id, title })
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      let result

      switch (deleteConfirm.type) {
        case 'goal':
          result = await LearningAPI.getInstance().deleteLearningGoal(deleteConfirm.id, deleteConfirm.title)
          break
        case 'path':
          result = await LearningAPI.getInstance().deleteLearningPath(deleteConfirm.id, deleteConfirm.title)
          break
        case 'unit':
          result = await LearningAPI.getInstance().deleteCourseUnit(deleteConfirm.id, deleteConfirm.title)
          break
        case 'content':
          result = await LearningAPI.getInstance().deleteCourseContent(deleteConfirm.id)
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

  const handleDownload = () => {
    if (!exportData) return
    
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning_data_${currentProfile?.name || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportData(null)
  }

  // ⭐新增：查看路径详情
  const viewPathDetails = (path: any) => {
    setSelectedPath(path)
    setShowPathDetails(true)
  }

  // ⭐新增：批量删除路径
  const handleBatchDeletePaths = async () => {
    if (!learningData?.paths?.length) return
    
    const confirmed = window.confirm(`确定要删除所有 ${learningData.paths.length} 条学习路径吗？此操作不可撤销！`)
    if (!confirmed) return

    try {
      setIsDeleting(true)
      let successCount = 0
      let failCount = 0

      for (const path of learningData.paths) {
        try {
          const result = await LearningAPI.getInstance().deleteLearningPath(path.id, path.title)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`成功删除 ${successCount} 条路径${failCount > 0 ? `，${failCount} 条失败` : ''}`)
        await refreshData()
      } else {
        toast.error('所有路径删除失败')
      }
    } catch (error) {
      toast.error('批量删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  // ⭐新增：路径激活功能
  const handleActivatePath = async (path: LearningPath) => {
    console.log('🔥 [DataManagement] 激活路径操作开始:', path.id, path.title, path.status)
    try {
      const api = LearningAPI.getInstance()
      console.log('🔥 [DataManagement] API实例获取成功，调用activatePath')
      const result = await api.activatePath(path.id)
      console.log('🔥 [DataManagement] 激活路径API结果:', result)
      
      if (result.success) {
        toast.success(`✅ 路径"${path.title}"已激活`)
        console.log('🔥 [DataManagement] 激活成功，开始刷新数据')
        await refreshData() // 刷新数据
      } else {
        console.error('❌ [DataManagement] 激活路径失败:', result.error)
        toast.error(result.error || '激活路径失败')
      }
    } catch (error) {
      console.error('❌ [DataManagement] 激活路径异常:', error)
      toast.error('激活路径失败')
    }
  }

  // ⭐新增：路径冻结功能  
  const handleFreezePath = async (path: LearningPath) => {
    console.log('❄️ [DataManagement] 冻结路径操作开始:', path.id, path.title, path.status)
    try {
      const api = LearningAPI.getInstance()
      console.log('❄️ [DataManagement] API实例获取成功，调用freezePath')
      const result = await api.freezePath(path.id)
      console.log('❄️ [DataManagement] 冻结路径API结果:', result)
      
      if (result.success) {
        toast.success(`✅ 路径"${path.title}"已冻结`)
        console.log('❄️ [DataManagement] 冻结成功，开始刷新数据')
        await refreshData() // 刷新数据
      } else {
        console.error('❌ [DataManagement] 冻结路径失败:', result.error)
        toast.error(result.error || '冻结路径失败')
      }
    } catch (error) {
      console.error('❌ [DataManagement] 冻结路径异常:', error)
      toast.error('冻结路径失败')
    }
  }

  // ⭐新增：路径归档功能
  const handleArchivePath = async (path: LearningPath) => {
    console.log('📦 [DataManagement] 归档路径操作开始:', path.id, path.title, path.status)
    try {
      const api = LearningAPI.getInstance()
      console.log('📦 [DataManagement] API实例获取成功，调用archivePath')
      const result = await api.archivePath(path.id)
      console.log('📦 [DataManagement] 归档路径API结果:', result)
      
      if (result.success) {
        toast.success(`✅ 路径"${path.title}"已归档`)
        console.log('📦 [DataManagement] 归档成功，开始刷新数据')
        await refreshData() // 刷新数据
      } else {
        console.error('❌ [DataManagement] 归档路径失败:', result.error)
        toast.error(result.error || '归档路径失败')
      }
    } catch (error) {
      console.error('❌ [DataManagement] 归档路径异常:', error)
      toast.error('归档路径失败')
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🗂️ 数据管理</h1>
              <p className="text-gray-600">管理和查看学习数据，支持删除和导出功能</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleExport}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* ⭐新增：课程内容统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 课程内容统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courseContentStats ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">总课程数</span>
                    <Badge variant="primary">{courseContentStats.total} 个</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">总学时</span>
                    <Badge variant="info">{courseContentStats.totalEstimatedTime} 分钟</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">平均进度</span>
                    <Badge variant="success">{Math.round(courseContentStats.averageProgress)}%</Badge>
                  </div>
                  
                  {/* 课程状态分布 */}
                  {courseContentStats.total > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">课程状态分布</h4>
                      <div className="space-y-1">
                        {Object.entries(courseContentStats.byStatus as Record<string, number>).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {status === 'not_started' ? '未开始' : 
                               status === 'in_progress' ? '进行中' : 
                               status === 'completed' ? '已完成' : status}
                            </span>
                            <span className="text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 难度分布 */}
                  {courseContentStats.total > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">难度分布</h4>
                      <div className="space-y-1">
                        {Object.entries(courseContentStats.byDifficulty as Record<string, number>).map(([difficulty, count]) => (
                          <div key={difficulty} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              难度 {difficulty} 级
                            </span>
                            <span className="text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">📚</div>
                  <p>暂无课程内容数据</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => onNavigate('course-content')}
                  >
                    查看课程内容
                  </Button>
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

          {/* 学习路径管理 - ⭐增强版 */}
          {learningData?.paths?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    🛤️ 学习路径管理
                    <Badge variant="info">{learningData.paths.length} 条路径</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('path-planning')}
                      className="flex items-center gap-2"
                    >
                      🛠️ 路径管理
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(learningData.paths)}
                      className="flex items-center gap-2"
                    >
                      📋 复制数据
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleBatchDeletePaths}
                      disabled={isDeleting}
                      className="flex items-center gap-2"
                    >
                      🗑️ 批量删除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* ⭐新增：路径统计概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {learningData.paths.filter((p: any) => p.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">活跃路径</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.values(pathProgress).reduce((sum: number, p: any) => sum + (p?.completedNodes || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">已完成节点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {learningData.paths.reduce((sum: number, p: any) => sum + (p.nodes?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">总节点数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {learningData.paths.reduce((sum: number, p: any) => sum + (p.totalEstimatedHours || 0), 0)}h
                    </div>
                    <div className="text-sm text-gray-600">总学时</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {learningData.paths.map((path: any) => {
                    const progress = pathProgress[path.id]
                    const goal = learningData.goals?.find((g: any) => g.id === path.goalId)
                    
                    return (
                      <div
                        key={path.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{path.title}</h4>
                              <StatusBadge status={
                                path.status === 'active' ? 'active' :
                                path.status === 'completed' ? 'completed' :
                                path.status === 'frozen' ? 'pending' : 'inactive'
                              } />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span>🎯 目标：{goal?.title || '未知目标'}</span>
                              <span>📊 节点：{path.nodes?.length || 0}个</span>
                              <span>⏱️ 预计：{path.totalEstimatedHours || 0}小时</span>
                              <span>📅 创建：{new Date(path.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            {/* ⭐新增：进度展示 */}
                            {progress && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                  <span>学习进度</span>
                                  <span>{progress.completedNodes}/{progress.totalNodes} 节点完成</span>
                                </div>
                                <ProgressBar 
                                  value={progress.progressPercentage} 
                                  max={100}
                                  className="mb-4"
                                />
                              </div>
                            )}

                            {/* ⭐新增：里程碑展示 */}
                            {path.milestones && path.milestones.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-sm text-gray-600">里程碑：</span>
                                {path.milestones.slice(0, 3).map((milestone: any, index: number) => (
                                  <Badge key={index} variant="info" className="text-xs">
                                    {milestone.title}
                                  </Badge>
                                ))}
                                {path.milestones.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{path.milestones.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* ⭐新增：路径状态管理按钮 */}
                            {path.status === 'frozen' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleActivatePath(path)}
                                className="flex items-center gap-1"
                              >
                                ▶️ 激活
                              </Button>
                            )}
                            {path.status === 'active' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleFreezePath(path)}
                                className="flex items-center gap-1"
                              >
                                ❄️ 冻结
                              </Button>
                            )}
                            {(path.status === 'active' || path.status === 'frozen') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleArchivePath(path)}
                                className="flex items-center gap-1"
                              >
                                📦 归档
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => viewPathDetails(path)}
                              className="flex items-center gap-1"
                            >
                              👁️ 详情
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete('path', path.id, path.title)}
                              className="flex items-center gap-1"
                            >
                              🗑️ 删除
                            </Button>
                          </div>
                        </div>

                        {/* ⭐新增：节点快速预览 */}
                        {path.nodes && path.nodes.length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                              查看节点详情 ({path.nodes.length} 个节点)
                            </summary>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {path.nodes.slice(0, 6).map((node: any, index: number) => (
                                <div key={node.id} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-500">#{index + 1}</span>
                                    <Badge variant={
                                      node.type === 'concept' ? 'info' :
                                      node.type === 'practice' ? 'warning' :
                                      node.type === 'project' ? 'success' :
                                      node.type === 'assessment' ? 'danger' : 'secondary'
                                    } className="text-xs">
                                      {node.type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 mb-1">
                                    {node.title}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {node.estimatedHours}h • 难度{node.difficulty}/5
                                  </div>
                                  {node.skills && node.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {node.skills.slice(0, 2).map((skill: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {node.skills.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{node.skills.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {path.nodes.length > 6 && (
                                <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <span className="text-sm text-gray-500">
                                    还有 {path.nodes.length - 6} 个节点...
                                  </span>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    )
                  })}
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

          {/* ⭐新增：课程内容管理 */}
          {courseContentStats && courseContentStats.total > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    📖 课程内容管理
                    <Badge variant="info">{courseContentStats.total} 个内容</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('course-content')}
                      className="flex items-center gap-2"
                    >
                      🛠️ 内容管理
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const allContent = LearningAPI.getInstance().getAllCourseContent()
                        if (allContent.success) {
                          copyToClipboard(allContent.data)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      📋 复制数据
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 课程内容统计概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {courseContentStats.byStatus?.not_started || 0}
                    </div>
                    <div className="text-sm text-gray-600">未开始</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {courseContentStats.byStatus?.in_progress || 0}
                    </div>
                    <div className="text-sm text-gray-600">进行中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {courseContentStats.byStatus?.completed || 0}
                    </div>
                    <div className="text-sm text-gray-600">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(courseContentStats.averageProgress)}%
                    </div>
                    <div className="text-sm text-gray-600">平均进度</div>
                  </div>
                </div>

                {/* 课程内容列表 */}
                <div className="space-y-3">
                  {(() => {
                    const allContent = LearningAPI.getInstance().getAllCourseContent()
                    if (!allContent.success || !allContent.data) return null
                    
                    return allContent.data.slice(0, 5).map((content: any) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{content.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary">{content.type}</Badge>
                            <Badge variant={
                              content.difficulty <= 2 ? 'success' :
                              content.difficulty <= 4 ? 'warning' : 'danger'
                            }>
                              难度 {content.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {content.estimatedTimeMinutes} 分钟
                            </span>
                            {content.progress && (
                              <Badge variant={
                                content.progress.status === 'completed' ? 'success' :
                                content.progress.status === 'in_progress' ? 'warning' : 'secondary'
                              }>
                                {content.progress.status === 'completed' ? '已完成' :
                                 content.progress.status === 'in_progress' ? '进行中' : '未开始'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            const confirmed = window.confirm(`确定要删除课程内容 "${content.title}" 吗？`)
                            if (confirmed) {
                              const result = await LearningAPI.getInstance().deleteCourseContent(content.id)
                              if (result.success) {
                                toast.success('课程内容已删除')
                                await refreshData()
                              } else {
                                toast.error(result.error || '删除失败')
                              }
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          🗑️ 删除
                        </Button>
                      </div>
                    ))
                  })()}
                </div>

                {/* 显示更多内容 */}
                {(() => {
                  const allContent = LearningAPI.getInstance().getAllCourseContent()
                  if (!allContent.success || !allContent.data || allContent.data.length <= 5) return null
                  
                  return (
                    <div className="mt-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigate('course-content')}
                      >
                        查看全部 {allContent.data.length} 个课程内容
                      </Button>
                    </div>
                  )
                })()}

                {/* 展开查看完整数据 */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    展开查看完整课程内容数据
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {(() => {
                      const allContent = LearningAPI.getInstance().getAllCourseContent()
                      return JSON.stringify(allContent.success ? allContent.data : [], null, 2)
                    })()}
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
          confirmText={isDeleting ? '删除中...' : '确认删除'}
          cancelText="取消"
          variant="danger"
        />
      )}

      {/* 导出数据模态框 */}
      {exportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">导出成功</h3>
            <p className="text-gray-600 mb-4">
              学习数据已导出为JSON格式，点击下载按钮保存到本地。
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setExportData(null)}>
                取消
              </Button>
              <Button onClick={handleDownload}>
                下载文件
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐新增：路径详情对话框 */}
      {showPathDetails && selectedPath && (
        <Modal
          title={`路径详情 - ${selectedPath.title}`}
          isOpen={showPathDetails}
          onClose={() => setShowPathDetails(false)}
          size="xl"
        >
          <PathDetailsContent 
            path={selectedPath} 
            progress={pathProgress[selectedPath.id]}
            goal={learningData.goals?.find((g: any) => g.id === selectedPath.goalId)}
          />
        </Modal>
      )}
    </div>
  )
}

/**
 * ⭐新增：路径详情内容组件
 */
const PathDetailsContent: React.FC<{ 
  path: any
  progress: any
  goal: any
}> = ({ path, progress, goal }) => {
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">基本信息</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-medium">状态：</span>{path.status}</div>
            <div><span className="font-medium">节点数量：</span>{path.nodes?.length || 0}</div>
            <div><span className="font-medium">预计学时：</span>{path.totalEstimatedHours || 0} 小时</div>
            <div><span className="font-medium">创建时间：</span>{new Date(path.createdAt).toLocaleString()}</div>
          </div>
          {goal && (
            <div className="pt-3 border-t border-gray-200">
              <span className="font-medium">关联目标：</span>
              <div className="mt-2 p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{goal.title}</span>
                  <Badge variant="secondary">{goal.category}</Badge>
                  <Badge variant={
                    goal.status === 'active' ? 'success' :
                    goal.status === 'completed' ? 'primary' : 'warning'
                  }>
                    {goal.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 学习进度 */}
      {progress && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">学习进度</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span>整体进度</span>
              <span className="font-medium">{progress.progressPercentage}%</span>
            </div>
            <ProgressBar value={progress.progressPercentage} max={100} className="mb-4" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-green-600">{progress.completedNodes}</div>
                <div className="text-gray-600">已完成</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-blue-600">{progress.inProgressNodes || 0}</div>
                <div className="text-gray-600">进行中</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-gray-400">
                  {progress.totalNodes - progress.completedNodes - (progress.inProgressNodes || 0)}
                </div>
                <div className="text-gray-600">未开始</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学习节点详情 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">学习节点详情</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {path.nodes?.map((node: any, index: number) => (
            <div key={node.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 font-medium">#{index + 1}</div>
                  <h4 className="font-medium">{node.title}</h4>
                  <Badge variant={
                    node.type === 'concept' ? 'info' :
                    node.type === 'practice' ? 'warning' :
                    node.type === 'project' ? 'success' :
                    node.type === 'assessment' ? 'danger' : 'secondary'
                  }>
                    {node.type}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {node.estimatedHours}h • 难度 {node.difficulty}/5
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{node.description}</p>
              
              {node.skills && node.skills.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">技能要求：</span>
                  <div className="flex flex-wrap gap-1">
                    {node.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {node.prerequisites && node.prerequisites.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">前置要求：</span>
                  {node.prerequisites.join(', ')}
                </div>
              )}
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <p>该路径还没有学习节点</p>
            </div>
          )}
        </div>
      </div>

      {/* 里程碑详情 */}
      {path.milestones && path.milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">学习里程碑</h3>
          <div className="space-y-3">
            {path.milestones.map((milestone: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">{milestone.title}</div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  )}
                  {milestone.nodeIds && milestone.nodeIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">包含节点：</span>
                      {milestone.nodeIds.length} 个
                    </div>
                  )}
                  {milestone.reward && (
                    <div className="text-sm text-green-600 mt-1">
                      <span className="font-medium">奖励：</span>{milestone.reward}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 路径元数据 */}
      {path.metadata && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">技术信息</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-700 overflow-auto max-h-32">
              {JSON.stringify(path.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataManagementPage 