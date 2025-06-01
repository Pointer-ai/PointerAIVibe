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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card/Card'
import { Badge, StatusBadge } from '../components/ui/Badge/Badge'
import { Alert, toast } from '../components/ui/Alert/Alert'
import { ConfirmModal, FormModal, Modal } from '../components/ui/Modal/Modal'
import { Loading } from '../components/ui/Loading/Loading'
import { ProgressBar } from '../components/ui/ProgressBar/ProgressBar'
import { Input, Label, FormField } from '../components/ui/Input/Input'
import { learningApi } from '../../api'
import { LearningPath, LearningGoal } from '../../modules/coreData/types'
import { PathGenerationConfig } from '../../modules/pathPlan/types'
import { LearningAPI } from '../../api/learningApi'
import { PathProgressStats } from '../../api/learningApi'

interface PathPlanningPageProps {
  onNavigate: (view: string) => void
}

type PathFilter = 'all' | 'active' | 'frozen' | 'archived'

interface PathGenerationForm {
  goalId: string
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  timePreference: 'intensive' | 'moderate' | 'relaxed'
  difficultyProgression: 'gradual' | 'moderate' | 'steep'
  includeProjects: boolean
  includeExercises: boolean
}

// Toast function
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Simple console log for now - in a real app this would use a toast library
  console.log(`${type.toUpperCase()}: ${message}`)
}

/**
 * 重构版路径规划管理页面
 * 
 * 功能：
 * - 查看所有学习路径
 * - 为目标生成学习路径
 * - 管理路径状态（激活、冻结、归档）
 * - 查看路径进度和节点详情
 * - 路径配置和优化
 */
export const PathPlanningPage: React.FC<PathPlanningPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [pathProgress, setPathProgress] = useState<PathProgressStats[]>([])
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [showPathDetails, setShowPathDetails] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    action: 'activate' | 'freeze' | 'archive' | 'delete'
    path: LearningPath
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<PathFilter>('all')
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [generationForm, setGenerationForm] = useState<PathGenerationForm>({
    goalId: '',
    learningStyle: 'visual',
    timePreference: 'moderate',
    difficultyProgression: 'gradual',
    includeProjects: true,
    includeExercises: true
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null)

  const api = LearningAPI.getInstance()

  // 刷新数据
  const refreshData = async () => {
    try {
      setRefreshing(true)
      
      // 获取当前Profile
      const profileResponse = learningApi.getCurrentProfile()
      if (!profileResponse.success || !profileResponse.data) {
        toast.error('无法获取当前Profile')
        return
      }
      setCurrentProfile(profileResponse.data)
      
      // 获取所有路径
      const pathsResponse = learningApi.getAllPaths()
      if (pathsResponse.success) {
        setPaths(pathsResponse.data || [])
        
        // 获取每个路径的进度
        const progressData: PathProgressStats[] = []
        for (const path of pathsResponse.data || []) {
          const progressResponse = learningApi.getPathProgress(path.id)
          if (progressResponse.success) {
            progressData.push(progressResponse.data)
          }
        }
        setPathProgress(progressData)
      }
      
      // 获取所有目标（用于生成路径）
      const goalsResponse = learningApi.getAllGoals()
      if (goalsResponse.success) {
        setGoals(goalsResponse.data || [])
      }
      
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

  // 过滤路径
  const filteredPaths = paths.filter(path => {
    if (filter === 'all') return true
    return path.status === filter
  })

  // 获取状态对应的徽章样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <StatusBadge status="active" />
      case 'frozen':
        return <StatusBadge status="pending" />
      case 'archived':
        return <StatusBadge status="completed" />
      case 'draft':
        return <StatusBadge status="inactive" />
      default:
        return <StatusBadge status="inactive" />
    }
  }

  // 获取没有路径的目标
  const goalsWithoutPaths = goals.filter(goal => 
    !paths.some(path => path.goalId === goal.id)
  )

  // 生成路径
  const handleGeneratePath = async () => {
    if (!generationForm.goalId) {
      toast.error('请选择目标')
      return
    }

    setIsProcessing(true)
    try {
      const config = {
        learningStyle: generationForm.learningStyle,
        timePreference: generationForm.timePreference,
        difficultyProgression: generationForm.difficultyProgression,
        includeProjects: generationForm.includeProjects,
        includeExercises: generationForm.includeExercises
      }

      const result = await api.generatePathForGoal(generationForm.goalId, config)
      
      if (result.success && result.data) {
        toast.success('学习路径生成成功')
        setShowGenerateForm(false)
        await refreshData()
        
        // 重置表单
        setGenerationForm({
          goalId: '',
          learningStyle: 'visual',
          timePreference: 'moderate',
          difficultyProgression: 'gradual',
          includeProjects: true,
          includeExercises: true
        })
      } else {
        toast.error(result.error || '生成路径失败')
      }
    } catch (error) {
      toast.error('生成路径失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 激活路径
  const handleActivatePath = async (path: LearningPath) => {
    setLoading(true)
    try {
      const result = await api.activatePath(path.id)
      if (result.success) {
        toast.success('路径已激活')
        await refreshData()
      } else {
        toast.error(result.error || '激活失败')
      }
    } catch (error) {
      toast.error('激活失败')
    } finally {
      setLoading(false)
    }
  }

  // 冻结路径
  const handleFreezePath = async (path: LearningPath) => {
    setLoading(true)
    try {
      const result = await api.freezePath(path.id)
      if (result.success) {
        toast.success('路径已冻结')
        await refreshData()
      } else {
        toast.error(result.error || '冻结失败')
      }
    } catch (error) {
      toast.error('冻结失败')
    } finally {
      setLoading(false)
    }
  }

  // 归档路径
  const handleArchivePath = async (path: LearningPath) => {
    setLoading(true)
    try {
      const result = await api.archivePath(path.id)
      if (result.success) {
        toast.success('路径已归档')
        await refreshData()
      } else {
        toast.error(result.error || '归档失败')
      }
    } catch (error) {
      toast.error('归档失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除路径
  const handleDeletePath = async () => {
    if (!pathToDelete) return

    setLoading(true)
    try {
      const result = await api.deletePath(pathToDelete.id)
      if (result.success) {
        toast.success('路径已删除')
        setShowDeleteConfirm(false)
        setPathToDelete(null)
        await refreshData()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理路径操作
  const handlePathAction = async (action: string, path: LearningPath) => {
    switch (action) {
      case 'activate':
        await handleActivatePath(path)
        break
      case 'freeze':
        await handleFreezePath(path)
        break
      case 'archive':
        await handleArchivePath(path)
        break
      case 'delete':
        setPathToDelete(path)
        setShowDeleteConfirm(true)
        break
      default:
        break
    }
  }

  // 查看路径详情
  const viewPathDetails = (path: LearningPath) => {
    setSelectedPath(path)
    setShowPathDetails(true)
  }

  // 获取路径进度信息
  const getPathProgressInfo = (pathId: string) => {
    return pathProgress.find(p => p.pathId === pathId)
  }

  // 获取目标信息
  const getGoalInfo = (goalId: string) => {
    return goals.find(g => g.id === goalId)
  }

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      active: { text: '活跃', color: 'bg-green-100 text-green-800' },
      frozen: { text: '冻结', color: 'bg-blue-100 text-blue-800' },
      archived: { text: '归档', color: 'bg-gray-100 text-gray-800' },
      completed: { text: '完成', color: 'bg-purple-100 text-purple-800' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const stats = {
    totalPaths: paths.length,
    activePaths: paths.filter(p => p.status === 'active').length,
    frozenPaths: paths.filter(p => p.status === 'frozen').length,
    archivedPaths: paths.filter(p => p.status === 'archived').length,
    averageProgress: paths.length > 0 ? Math.round(pathProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / paths.length) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="加载路径规划..." />
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
                <h1 className="text-2xl font-bold text-gray-900">🛤️ 路径规划管理</h1>
                <p className="text-gray-600">管理您的学习路径，跟踪学习进度</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={() => setShowGenerateForm(true)}
                disabled={goalsWithoutPaths.length === 0}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                生成路径
              </Button>
              <Button
                variant="secondary"
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计和过滤 */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总路径数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPaths}</p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">活跃路径</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.activePaths}
                    </p>
                  </div>
                  <div className="text-green-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">冻结路径</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.frozenPaths}
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">归档路径</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.archivedPaths}
                    </p>
                  </div>
                  <div className="text-gray-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">平均进度</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.averageProgress}%
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 过滤器 */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'active', label: '活跃' },
              { key: 'frozen', label: '冻结' },
              { key: 'archived', label: '归档' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(key as PathFilter)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* 建议生成路径 */}
        {goalsWithoutPaths.length > 0 && (
          <Alert variant="info" className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">发现 {goalsWithoutPaths.length} 个目标还没有学习路径</h4>
                <p className="text-sm mt-1">
                  目标：{goalsWithoutPaths.slice(0, 3).map(g => g.title).join('、')}
                  {goalsWithoutPaths.length > 3 && ` 等${goalsWithoutPaths.length}个`}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowGenerateForm(true)}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                生成路径
              </Button>
            </div>
          </Alert>
        )}

        {/* 路径列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : filteredPaths.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🛤️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无路径</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' ? '还没有创建任何学习路径' : `没有${filter === 'active' ? '活跃' : filter === 'frozen' ? '冻结' : '归档'}的路径`}
              </p>
              <Button onClick={() => setShowGenerateForm(true)}>
                生成第一个路径
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPaths.map((path) => {
              const progressInfo = getPathProgressInfo(path.id)
              const goalInfo = getGoalInfo(path.goalId)
              const statusDisplay = getStatusDisplay(path.status)

              return (
                <Card key={path.id} hover>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{path.title}</CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>目标:</span>
                          <span className="font-medium">{goalInfo?.title || '未知目标'}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{path.description}</p>
                    
                    {/* 进度信息 */}
                    {progressInfo && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>学习进度</span>
                          <span>{progressInfo.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressInfo.progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{progressInfo.completedNodes}/{progressInfo.totalNodes} 节点完成</span>
                          <span>{progressInfo.inProgressNodes} 进行中</span>
                        </div>
                      </div>
                    )}

                    {/* 路径信息 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">节点数量:</span>
                        <span className="ml-2 font-medium">{path.nodes?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">预计时长:</span>
                        <span className="ml-2 font-medium">{path.totalEstimatedHours || 0}小时</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <div className="flex justify-between items-center w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => viewPathDetails(path)}
                      >
                        查看详情
                      </Button>
                      
                      <div className="flex space-x-2">
                        {path.status === 'frozen' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleActivatePath(path)}
                          >
                            激活
                          </Button>
                        )}
                        
                        {path.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleFreezePath(path)}
                          >
                            冻结
                          </Button>
                        )}
                        
                        {path.status !== 'archived' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleArchivePath(path)}
                          >
                            归档
                          </Button>
                        )}
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setPathToDelete(path)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 生成路径表单对话框 */}
      <FormModal
        isOpen={showGenerateForm}
        onClose={() => setShowGenerateForm(false)}
        onSubmit={handleGeneratePath}
        title="生成学习路径"
        loading={isProcessing}
      >
        <div className="space-y-6">
          <FormField label="选择目标" required>
            <select 
              name="goalId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={generationForm.goalId}
              onChange={(e) => setGenerationForm(prev => ({ ...prev, goalId: e.target.value }))}
            >
              <option value="">请选择一个学习目标</option>
              {goalsWithoutPaths.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({goal.category})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="学习风格">
              <select 
                name="learningStyle"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={generationForm.learningStyle}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, learningStyle: e.target.value as any }))}
              >
                <option value="visual">视觉型 - 图表、图像、演示</option>
                <option value="auditory">听觉型 - 讲解、讨论、音频</option>
                <option value="kinesthetic">动手型 - 实践、操作、体验</option>
                <option value="reading">阅读型 - 文档、书籍、文字</option>
              </select>
            </FormField>

            <FormField label="时间偏好">
              <select 
                name="timePreference"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={generationForm.timePreference}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, timePreference: e.target.value as any }))}
              >
                <option value="intensive">密集型 - 快速完成，高强度</option>
                <option value="moderate">适中型 - 平衡进度，稳步推进</option>
                <option value="relaxed">轻松型 - 慢节奏，深度理解</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="难度递进">
              <select 
                name="difficultyProgression"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={generationForm.difficultyProgression}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, difficultyProgression: e.target.value as any }))}
              >
                <option value="gradual">渐进式 - 循序渐进，稳步提升</option>
                <option value="moderate">适中式 - 平衡挑战，适度跳跃</option>
                <option value="steep">陡峭式 - 快速提升，高挑战性</option>
              </select>
            </FormField>

            <div className="space-y-3">
              <Label>内容设置</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="includeProjects"
                    checked={generationForm.includeProjects}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, includeProjects: e.target.checked }))}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm">包含项目实践</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="includeExercises"
                    checked={generationForm.includeExercises}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, includeExercises: e.target.checked }))}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm">包含练习题目</span>
                </label>
              </div>
            </div>
          </div>

          <Alert variant="info">
            <p className="text-sm">
              系统将根据您的能力评估和目标要求，生成个性化的学习路径。
              路径生成后可以进一步调整和优化。
            </p>
          </Alert>
        </div>
      </FormModal>

      {/* 路径详情对话框 */}
      {showPathDetails && selectedPath && (
        <Modal
          isOpen={showPathDetails}
          onClose={() => setShowPathDetails(false)}
          title={selectedPath.title}
          size="xl"
        >
          <PathDetailsContent 
            path={selectedPath} 
            progress={pathProgress.find(p => p.pathId === selectedPath.id)} 
          />
        </Modal>
      )}

      {/* 删除确认对话框 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePath}
        title="确认删除路径"
        content={`确定要删除路径"${pathToDelete?.title}"吗？此操作不可撤销。`}
        variant="danger"
      />
    </div>
  )
}

/**
 * 路径详情内容组件
 */
const PathDetailsContent: React.FC<{ path: LearningPath; progress?: PathProgressStats }> = ({ path, progress }) => {
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">基本信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">路径标题:</span>
            <span className="ml-2 font-medium">{path.title}</span>
          </div>
          <div>
            <span className="text-gray-500">状态:</span>
            <span className="ml-2 font-medium">{path.status}</span>
          </div>
          <div>
            <span className="text-gray-500">节点数量:</span>
            <span className="ml-2 font-medium">{path.nodes.length}</span>
          </div>
          <div>
            <span className="text-gray-500">预计学时:</span>
            <span className="ml-2 font-medium">{path.totalEstimatedHours || 0}小时</span>
          </div>
          <div>
            <span className="text-gray-500">创建时间:</span>
            <span className="ml-2 font-medium">{new Date(path.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="text-gray-500">描述:</span>
          <p className="mt-1 text-gray-700">{path.description}</p>
        </div>
      </div>

      {/* 学习进度 */}
      {progress && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">学习进度</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>总体进度</span>
              <span>{progress.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{progress.completedNodes}</div>
                <div className="text-gray-600">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{progress.inProgressNodes}</div>
                <div className="text-gray-600">进行中</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">{progress.totalNodes - progress.completedNodes - progress.inProgressNodes}</div>
                <div className="text-gray-600">未开始</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学习节点 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">学习节点</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {path.nodes?.map((node, index) => (
            <div key={node.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  node.status === 'completed' ? 'bg-green-100 text-green-800' :
                  node.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{node.title}</div>
                <div className="text-xs text-gray-500 truncate">{node.description}</div>
                {node.skills && node.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {node.skills.slice(0, 3).map((skill, skillIndex) => (
                      <span key={skillIndex} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {skill}
                      </span>
                    ))}
                    {node.skills.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{node.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-gray-500">
                  难度: {node.difficulty || 'N/A'}
                </span>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>暂无学习节点</p>
            </div>
          )}
        </div>
      </div>

      {/* 里程碑 */}
      {path.milestones && path.milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">里程碑</h3>
          <div className="space-y-2">
            {path.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg">
                <div className="text-purple-600">🎯</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{milestone.title}</div>
                  {milestone.reward && (
                    <div className="text-xs text-gray-600">奖励：{milestone.reward}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {milestone.nodeIds.length} 个节点
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 元数据 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">元数据</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">创建时间:</span>
            <span className="ml-2 font-medium">
              {new Date(path.createdAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">更新时间:</span>
            <span className="ml-2 font-medium">
              {new Date(path.updatedAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">路径ID:</span>
            <span className="ml-2 font-mono text-xs">{path.id}</span>
          </div>
          <div>
            <span className="text-gray-500">目标ID:</span>
            <span className="ml-2 font-mono text-xs">{path.goalId}</span>
          </div>
        </div>
      </div>

      <Alert variant="info">
        <div className="space-y-2">
          <p><strong>学习建议</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>建议每天安排 1-2 小时进行学习</li>
            <li>按照节点顺序逐步推进，不要跳跃学习</li>
            <li>每完成一个里程碑后进行阶段性复习</li>
            <li>遇到困难可以调整学习速度，保持学习的连续性</li>
          </ul>
        </div>
      </Alert>
    </div>
  )
}

export default PathPlanningPage 