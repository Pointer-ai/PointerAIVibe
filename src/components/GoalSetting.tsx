import React, { useState, useEffect } from 'react'
import { 
  learningSystemService,
  LearningSystemStatus
} from '../modules/learningSystem'
import { 
  getLearningGoals, 
  createLearningGoal, 
  updateLearningGoal, 
  deleteLearningGoal,
  getGoalStatusStats 
} from '../modules/coreData'
import { 
  goalActivationManager,
  getActivationStats,
  ActivationResult,
  GoalActivationStats
} from '../modules/coreData/goalActivationManager'
import { LearningGoal } from '../modules/coreData/types'
import { log } from '../utils/logger'
import { DeleteConfirmDialog, useToast } from './common'
import { 
  GoalSettingService 
} from '../modules/goalSetting/service'
import { 
  NaturalLanguageInput, 
  ParsedGoalData, 
  AIGoalParseResult,
  GoalCreationMode 
} from '../modules/goalSetting/types'

// 实例化目标设定服务
const goalSettingService = new GoalSettingService()

interface GoalFormData {
  title: string
  description: string
  category: LearningGoal['category']
  priority: number
  targetLevel: LearningGoal['targetLevel']
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
}

interface GoalSettingProps {
  selectedGoalTitle?: string | null
  onGoalSelect?: (goalTitle: string | null) => void
}

export const GoalSetting: React.FC<GoalSettingProps> = ({ selectedGoalTitle, onGoalSelect }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [goalStats, setGoalStats] = useState<any>(null)
  const [activationStats, setActivationStats] = useState<GoalActivationStats | null>(null)
  const [systemStatus, setSystemStatus] = useState<LearningSystemStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'frontend',
    priority: 3,
    targetLevel: 'intermediate',
    estimatedTimeWeeks: 8,
    requiredSkills: [],
    outcomes: []
  })
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  // 添加自然语言模式相关状态
  const [creationMode, setCreationMode] = useState<GoalCreationMode>('form')
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [parseResult, setParseResult] = useState<AIGoalParseResult | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set())
  const [isParsingNL, setIsParsingNL] = useState(false)
  
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    goalId: string
    goalTitle: string
  } | null>(null)
  
  // Toast组件
  const { showSuccess, showError, ToastContainer } = useToast()

  // 刷新数据
  const refreshData = async () => {
    setGoals(getLearningGoals())
    setGoalStats(getGoalStatusStats())
    setActivationStats(getActivationStats())
    // 获取系统状态
    try {
      const status = await learningSystemService.getSystemStatus()
      setSystemStatus(status)
    } catch (error) {
      log('Failed to get system status:', error)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // 处理外部传入的目标选择
  useEffect(() => {
    if (selectedGoalTitle && goals.length > 0) {
      const targetGoal = goals.find(goal => goal.title === selectedGoalTitle)
      if (targetGoal) {
        setSelectedGoal(targetGoal.id)
        // 清除外部选择状态
        onGoalSelect?.(null)
      }
    }
  }, [selectedGoalTitle, goals, onGoalSelect])

  // 显示消息
  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      showError(msg)
    } else {
      showSuccess(msg, '操作成功')
    }
    setMessage(msg)
    setMessageType(isError ? 'error' : 'success')
  }

  // 显示激活结果
  const showActivationResult = (result: ActivationResult) => {
    if (result.success) {
      showSuccess(result.message, '操作成功')
    } else {
      showError(result.message, '操作失败')
    }
    setMessage(result.message)
    setMessageType(result.success ? 'success' : 'error')
  }

  // 创建新目标 - 使用Learning System服务
  const handleCreateGoal = async () => {
    if (!formData.title.trim()) {
      showError('请填写目标标题')
      return
    }

    setLoading(true)
    try {
      const newGoal = createLearningGoal({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetLevel: formData.targetLevel,
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes,
        status: 'paused' // 默认为暂停状态，让用户选择激活
      })
      
      showSuccess(`目标创建成功: ${newGoal.title}，已设为暂停状态，可在下方列表中激活`, '创建成功')
      setShowForm(false)
      resetForm()
      await refreshData()
    } catch (error) {
      showError(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 处理自然语言解析
  const handleNaturalLanguageParse = async () => {
    if (!naturalLanguageInput.trim()) {
      showError('请输入目标描述')
      return
    }

    setIsParsingNL(true)
    try {
      const input: NaturalLanguageInput = {
        description: naturalLanguageInput.trim()
      }
      
      const result = await goalSettingService.parseNaturalLanguageGoal(input)
      setParseResult(result)
      
      if (result.success && result.goals.length > 0) {
        // 默认选中所有解析出的目标
        setSelectedGoals(new Set(result.goals.map((_, index) => index)))
        showSuccess(`AI 成功解析出 ${result.goals.length} 个学习目标`, 'AI 解析成功')
      } else {
        showError('AI 解析失败，请尝试更具体地描述你的目标', 'AI 解析失败')
      }
    } catch (error) {
      console.error('Natural language parsing failed:', error)
      setParseResult({
        success: false,
        goals: [],
        originalInput: naturalLanguageInput,
        parseErrors: ['解析失败，请稍后重试'],
        suggestions: ['请尝试更具体地描述你的学习目标']
      })
      showError('AI 解析失败，请稍后重试', 'AI 解析失败')
    } finally {
      setIsParsingNL(false)
    }
  }

  // 创建选中的AI生成目标
  const handleCreateSelectedGoals = async () => {
    if (!parseResult || !parseResult.success) return

    setLoading(true)
    try {
      const selectedGoalsList = Array.from(selectedGoals).map(index => parseResult.goals[index])
      let successCount = 0
      
      for (const goal of selectedGoalsList) {
        try {
          await goalSettingService.createGoalFromParsedData(goal)
          successCount++
        } catch (error) {
          console.error('Failed to create goal:', goal.title, error)
        }
      }
      
      if (successCount > 0) {
        showSuccess(`成功创建 ${successCount} 个目标，目标已设为暂停状态，可在下方列表中激活`, '创建成功')
        // 重置状态
        setParseResult(null)
        setNaturalLanguageInput('')
        setSelectedGoals(new Set())
        setCreationMode('form')
        setShowForm(false)
        await refreshData()
      } else {
        showError('没有目标创建成功', '创建失败')
      }
    } catch (error) {
      console.error('Goal creation failed:', error)
      showError('目标创建失败，请稍后重试', '创建失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换目标选择状态
  const toggleGoalSelection = (index: number) => {
    const newSelected = new Set(selectedGoals)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGoals(newSelected)
  }

  // 重置自然语言状态
  const resetNaturalLanguageState = () => {
    setNaturalLanguageInput('')
    setParseResult(null)
    setSelectedGoals(new Set())
    setIsParsingNL(false)
  }

  // 更新目标
  const handleUpdateGoal = async (goalId: string, updates: Partial<LearningGoal>) => {
    setLoading(true)
    try {
      const updated = await updateLearningGoal(goalId, updates)
      if (updated) {
        showSuccess('目标状态更新成功')
        await refreshData()
      }
    } catch (error) {
      showError(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 删除目标 - 显示确认对话框
  const handleDeleteGoal = (goalId: string, goalTitle: string) => {
    setDeleteConfirm({ goalId, goalTitle })
  }

  // 确认删除目标
  const confirmDeleteGoal = async () => {
    if (!deleteConfirm) return

    setLoading(true)
    try {
      const deleted = await deleteLearningGoal(deleteConfirm.goalId)
      if (deleted) {
        showSuccess('目标删除成功', '删除成功')
        setSelectedGoal(null)
        await refreshData()
      }
    } catch (error) {
      showError(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
      setDeleteConfirm(null)
    }
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  // 高级激活目标
  const handleActivateGoal = async (goalId: string) => {
    const result = await goalActivationManager.activateGoal(goalId)
    showActivationResult(result)
    if (result.success) {
      await refreshData()
    }
  }

  const handlePauseGoal = async (goalId: string) => {
    setLoading(true)
    try {
      const result = await goalActivationManager.pauseGoal(goalId)
      showActivationResult(result)
      if (result.success) {
        await refreshData()
      }
    } catch (error) {
      showError(`暂停失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteGoal = async (goalId: string) => {
    setLoading(true)
    try {
      const updated = await updateLearningGoal(goalId, { 
        status: 'completed' 
      })
      if (updated) {
        showSuccess('目标标记为已完成')
        await refreshData()
      }
    } catch (error) {
      showError(`完成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelGoal = (goalId: string) => {
    handleDeleteGoal(goalId, '目标')
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'frontend',
      priority: 3,
      targetLevel: 'intermediate',
      estimatedTimeWeeks: 8,
      requiredSkills: [],
      outcomes: []
    })
    setIsEditing(false)
    setSelectedGoal(null)
    // 重置自然语言相关状态
    resetNaturalLanguageState()
    setCreationMode('form')
  }

  // 编辑目标
  const handleEditGoal = (goal: LearningGoal) => {
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      targetLevel: goal.targetLevel,
      estimatedTimeWeeks: goal.estimatedTimeWeeks,
      requiredSkills: goal.requiredSkills,
      outcomes: goal.outcomes
    })
    setSelectedGoal(goal.id)
    setIsEditing(true)
    setShowForm(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedGoal) return
    
    setLoading(true)
    try {
      const updated = await updateLearningGoal(selectedGoal, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetLevel: formData.targetLevel,
        estimatedTimeWeeks: formData.estimatedTimeWeeks,
        requiredSkills: formData.requiredSkills,
        outcomes: formData.outcomes
      })
      
      if (updated) {
        showSuccess('目标更新成功')
        setShowForm(false)
        resetForm()
        await refreshData()
      }
    } catch (error) {
      showError(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 添加技能
  const addSkill = () => {
    const skill = prompt('输入技能名称:')
    if (skill && !formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }))
    }
  }

  // 移除技能
  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }))
  }

  // 添加结果
  const addOutcome = () => {
    const outcome = prompt('输入预期结果:')
    if (outcome && !formData.outcomes.includes(outcome)) {
      setFormData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, outcome]
      }))
    }
  }

  // 移除结果
  const removeOutcome = (outcome: string) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(o => o !== outcome)
    }))
  }

  // 获取状态颜色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'completed': return '#2196F3'
      case 'paused': return '#FF9800'
      case 'cancelled': return '#f44336'
      default: return '#9E9E9E'
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

  // 获取类别文本
  const getCategoryText = (category: string): string => {
    const categoryMap: Record<string, string> = {
      frontend: '前端开发',
      backend: '后端开发',
      fullstack: '全栈开发',
      automation: '自动化测试',
      ai: '人工智能',
      mobile: '移动开发',
      game: '游戏开发',
      data: '数据科学',
      custom: '自定义'
    }
    return categoryMap[category] || category
  }

  // 获取级别文本
  const getLevelText = (level: string): string => {
    const levelMap: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      expert: '专家'
    }
    return levelMap[level] || level
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 目标设定</h1>
          <p className="text-gray-600 mt-2">设定和管理你的学习目标，分析与当前能力的差距</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>➕</span>
            新建目标
          </button>
          <button
            onClick={refreshData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            刷新
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-400 text-green-700' 
            : 'bg-red-50 border-red-400 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* 加载提示 */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            处理中...
          </div>
        </div>
      )}

      {/* 目标统计卡片 */}
      {goalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">进行中</p>
                <p className="text-3xl font-bold text-green-700">{goalStats.active}</p>
              </div>
              <div className="text-green-400 text-2xl">🎯</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">已完成</p>
                <p className="text-3xl font-bold text-blue-700">{goalStats.completed}</p>
              </div>
              <div className="text-blue-400 text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">已暂停</p>
                <p className="text-3xl font-bold text-orange-700">{goalStats.paused}</p>
              </div>
              <div className="text-orange-400 text-2xl">⏸️</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">已取消</p>
                <p className="text-3xl font-bold text-gray-700">{goalStats.cancelled}</p>
              </div>
              <div className="text-gray-400 text-2xl">❌</div>
            </div>
          </div>
        </div>
      )}

      {/* 学习系统统一管理提示 */}
      {systemStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-blue-500 text-2xl flex-shrink-0">🏗️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">学习系统统一管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 mb-1">
                    📊 <strong>当前阶段</strong>: {
                      systemStatus.currentPhase === 'assessment' ? '能力评估' :
                      systemStatus.currentPhase === 'goal_setting' ? '目标设定' :
                      systemStatus.currentPhase === 'path_planning' ? '路径规划' :
                      systemStatus.currentPhase === 'learning' ? '学习进行中' : '学习回顾'
                    }
                  </p>
                  <p className="text-blue-700 mb-1">
                    🎯 <strong>设置完成度</strong>: {systemStatus.setupComplete ? '✅ 已完成' : '🔄 进行中'}
                  </p>
                  <p className="text-blue-700">
                    📈 <strong>整体进度</strong>: {Math.round(systemStatus.progress.overallProgress)}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 mb-1">
                    📚 <strong>能力档案</strong>: {systemStatus.progress.hasAbilityProfile ? '✅ 已建立' : '❌ 待完成'}
                  </p>
                  <p className="text-blue-700 mb-1">
                    🛤️ <strong>活跃路径</strong>: {systemStatus.progress.activePaths} 条
                  </p>
                  <p className="text-blue-700">
                    📝 <strong>已完成节点</strong>: {systemStatus.progress.completedNodes}/{systemStatus.progress.totalNodes}
                  </p>
                </div>
              </div>
              {systemStatus.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-800 font-medium mb-2">💡 系统建议:</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 目标激活管理统计 */}
      {activationStats && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-purple-500 text-2xl flex-shrink-0">🎯</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">目标激活管理</h3>
              
              {/* 激活统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-sm text-purple-600 font-medium">激活中</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {activationStats.active}/{activationStats.maxActive}
                  </div>
                  <div className="text-xs text-purple-500">
                    利用率 {Math.round(activationStats.utilizationRate)}%
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium">可用槽位</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {activationStats.availableSlots}
                  </div>
                  <div className="text-xs text-blue-500">剩余空间</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-sm text-green-600 font-medium">完成率</div>
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(activationStats.completionRate)}%
                  </div>
                  <div className="text-xs text-green-500">
                    {activationStats.completed}/{activationStats.total}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <div className="text-sm text-orange-600 font-medium">暂停中</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {activationStats.paused}
                  </div>
                  <div className="text-xs text-orange-500">待激活</div>
                </div>
              </div>

              {/* 激活限制提示 */}
              {activationStats.availableSlots === 0 && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <span className="text-amber-500">⚠️</span>
                    <span className="font-medium">激活槽位已满</span>
                  </div>
                  <p className="text-amber-700 text-sm mt-1">
                    为保持学习专注，最多同时激活 {activationStats.maxActive} 个目标。
                    请先暂停或完成现有目标。
                  </p>
                </div>
              )}

              {/* 智能建议 */}
              <div className="text-sm text-purple-700">
                <div className="mb-2">
                  <span className="font-medium">💡 智能管理:</span>
                  <span className="ml-2">
                    {activationStats.utilizationRate < 50 
                      ? '可以激活更多目标开始学习' 
                      : activationStats.utilizationRate > 90 
                      ? '目标激活率很高，注意合理分配时间'
                      : '目标激活数量适中'}
                  </span>
                </div>
                
                {activationStats.recentActivations.length > 0 && (
                  <div>
                    <span className="font-medium">📅 最近激活:</span>
                    <span className="ml-2">
                      {activationStats.recentActivations[0].title}
                      {activationStats.recentActivations[0].daysSinceActivation > 0 && 
                        ` (${activationStats.recentActivations[0].daysSinceActivation}天前)`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 目标表单 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? '📝 编辑目标' : '➕ 新建目标'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 模式切换 - 仅在新建目标时显示 */}
          {!isEditing && (
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <button
                    onClick={() => {
                      setCreationMode('natural_language')
                      resetNaturalLanguageState()
                    }}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      creationMode === 'natural_language'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🤖 智能自然语言模式
                  </button>
                  <button
                    onClick={() => {
                      setCreationMode('form')
                      resetNaturalLanguageState()
                    }}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      creationMode === 'form'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📋 传统表单模式
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 自然语言模式 */}
          {!isEditing && creationMode === 'natural_language' && (
            <div className="space-y-6">
              <div className="text-center bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  🎯 描述你想要达成的目标
                </h4>
                <p className="text-blue-700 text-sm">
                  用自然语言描述你的工作需求或想要学习的技能，AI 会帮你生成具体的学习计划
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述你的目标或需求
                  </label>
                  <textarea
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="例如：我想学会用Python自动化处理工作表格，每周需要整理大量的销售数据..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isParsingNL || loading}
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleNaturalLanguageParse}
                    disabled={isParsingNL || loading || !naturalLanguageInput.trim()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isParsingNL ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        正在解析...
                      </>
                    ) : (
                      <>🧠 AI 解析目标</>
                    )}
                  </button>
                </div>
              </div>

              {/* AI 解析结果 */}
              {parseResult && (
                <div className="border-t pt-6">
                  {parseResult.success && parseResult.goals.length > 0 ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          🎯 AI 为你生成了以下学习目标
                        </h4>
                        <p className="text-gray-600 text-sm">
                          请选择你想要创建的目标
                        </p>
                      </div>

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {parseResult.goals.map((goal, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedGoals.has(index)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleGoalSelection(index)}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedGoals.has(index)}
                                onChange={() => toggleGoalSelection(index)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {goal.title}
                                </h5>
                                <p className="text-gray-600 text-sm mb-3">
                                  {goal.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center">
                                    📊 难度: {goal.difficulty}
                                  </span>
                                  <span className="flex items-center">
                                    ⏱️ 预计: {goal.estimatedTimeWeeks} 周
                                  </span>
                                  <span className="flex items-center">
                                    🏷️ 分类: {goal.category}
                                  </span>
                                  <span className="flex items-center">
                                    🎯 置信度: {Math.round(goal.confidence * 100)}%
                                  </span>
                                </div>

                                {goal.requiredSkills.length > 0 && (
                                  <div className="mb-3">
                                    <span className="text-xs font-medium text-gray-500">需要技能: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {goal.requiredSkills.slice(0, 5).map((skill, skillIndex) => (
                                        <span
                                          key={skillIndex}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {goal.requiredSkills.length > 5 && (
                                        <span className="text-xs text-gray-500">+{goal.requiredSkills.length - 5}...</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                                  <strong>AI 推荐理由:</strong> {goal.reasoning}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {parseResult.suggestions && parseResult.suggestions.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">💡 额外建议</h5>
                          <ul className="space-y-1 text-sm text-blue-800">
                            {parseResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setParseResult(null)
                            setSelectedGoals(new Set())
                          }}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          重新解析
                        </button>
                        <button
                          onClick={handleCreateSelectedGoals}
                          disabled={selectedGoals.size === 0 || loading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? '创建中...' : `创建选中的目标 (${selectedGoals.size})`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="text-red-600">
                        <h4 className="font-medium mb-2">❌ 解析失败</h4>
                        {parseResult.parseErrors && parseResult.parseErrors.length > 0 && (
                          <div className="text-sm space-y-1">
                            {parseResult.parseErrors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {parseResult.suggestions && parseResult.suggestions.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-900 mb-2">💡 建议</h5>
                          <ul className="space-y-1 text-sm text-yellow-800 text-left">
                            {parseResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => setParseResult(null)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        重新尝试
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 传统表单模式 */}
          {(isEditing || creationMode === 'form') && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目标标题 *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入学习目标标题"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目标描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="详细描述这个学习目标"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as LearningGoal['category'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="frontend">前端开发</option>
                        <option value="backend">后端开发</option>
                        <option value="fullstack">全栈开发</option>
                        <option value="automation">自动化测试</option>
                        <option value="ai">人工智能</option>
                        <option value="mobile">移动开发</option>
                        <option value="game">游戏开发</option>
                        <option value="data">数据科学</option>
                        <option value="custom">自定义</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">目标级别</label>
                      <select
                        value={formData.targetLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetLevel: e.target.value as LearningGoal['targetLevel'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">初级</option>
                        <option value="intermediate">中级</option>
                        <option value="advanced">高级</option>
                        <option value="expert">专家</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 - 最低</option>
                        <option value={2}>2 - 较低</option>
                        <option value={3}>3 - 普通</option>
                        <option value={4}>4 - 较高</option>
                        <option value={5}>5 - 最高</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">预计时间（周）</label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={formData.estimatedTimeWeeks}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedTimeWeeks: parseInt(e.target.value) || 8 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 技能和结果 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      需要的技能
                      <button
                        type="button"
                        onClick={addSkill}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + 添加
                      </button>
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.requiredSkills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {formData.requiredSkills.length === 0 && (
                        <div className="text-gray-500 text-sm italic p-2">暂无技能要求</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      预期学习成果
                      <button
                        type="button"
                        onClick={addOutcome}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + 添加
                      </button>
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.outcomes.map((outcome, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{outcome}</span>
                          <button
                            type="button"
                            onClick={() => removeOutcome(outcome)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {formData.outcomes.length === 0 && (
                        <div className="text-gray-500 text-sm italic p-2">暂无预期成果</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 表单按钮 */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={isEditing ? handleSaveEdit : handleCreateGoal}
                  disabled={loading || !formData.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? '保存修改' : '创建目标'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 目标列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 学习目标列表 ({goals.length})</h3>
        </div>

        {goals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">还没有学习目标</h4>
            <p className="text-gray-600 mb-6">设定你的第一个学习目标，开始个性化学习之旅</p>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              创建第一个目标
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {goals.map((goal) => (
              <div key={goal.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getStatusColor(goal.status) }}
                      >
                        {getStatusText(goal.status)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {getCategoryText(goal.category)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{goal.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span>📈 {getLevelText(goal.targetLevel)}</span>
                      <span>⭐ 优先级 {goal.priority}</span>
                      <span>⏱️ {goal.estimatedTimeWeeks} 周</span>
                      <span>🛠️ {goal.requiredSkills.length} 项技能</span>
                      <span>🎯 {goal.outcomes.length} 个目标</span>
                    </div>

                    {/* 技能标签 */}
                    {goal.requiredSkills.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-700 mb-1">需要技能:</div>
                        <div className="flex flex-wrap gap-1">
                          {goal.requiredSkills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 预期成果 */}
                    {goal.outcomes.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-700 mb-1">预期成果:</div>
                        <div className="flex flex-wrap gap-1">
                          {goal.outcomes.map((outcome, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {outcome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      📝 编辑
                    </button>
                    
                    {goal.status === 'active' && (
                      <button
                        onClick={() => handlePauseGoal(goal.id)}
                        className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                      >
                        ⏸️ 暂停
                      </button>
                    )}
                    
                    {goal.status === 'paused' && (
                      <button
                        onClick={() => handleActivateGoal(goal.id)}
                        disabled={activationStats?.availableSlots === 0}
                        className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ▶️ 激活
                      </button>
                    )}
                    
                    {['active', 'paused'].includes(goal.status) && (
                      <button
                        onClick={() => handleCompleteGoal(goal.id)}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        ✅ 完成
                      </button>
                    )}
                    
                    {['active', 'paused'].includes(goal.status) && (
                      <button
                        onClick={() => handleCancelGoal(goal.id)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                      >
                        ❌ 取消
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                  <span>创建于: {new Date(goal.createdAt).toLocaleDateString()}</span>
                  <span>更新于: {new Date(goal.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          isOpen={!!deleteConfirm}
          onConfirm={confirmDeleteGoal}
          onCancel={cancelDelete}
          title="确认删除目标"
          message={`你确定要删除目标 "${deleteConfirm.goalTitle}"? 相关的学习路径也会被删除。`}
        />
      )}

      {/* Toast容器 */}
      <div className="fixed bottom-0 right-0 p-4">
        <ToastContainer />
      </div>
    </div>
  )
} 