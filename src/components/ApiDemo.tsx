import React, { useState, useEffect } from 'react'
import { simpleApi, SimpleGoalData, SimpleAPIResponse } from '../api/simpleApi'

/**
 * API层使用演示组件
 * 
 * 这个组件展示了如何正确使用API层：
 * 1. ✅ 不直接依赖 learningSystemService
 * 2. ✅ 通过API层进行所有数据操作
 * 3. ✅ 统一的错误处理和状态管理
 * 4. ✅ 清晰的职责分离
 */
export const ApiDemo: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [paths, setPaths] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  // 表单状态
  const [goalForm, setGoalForm] = useState<SimpleGoalData>({
    title: '',
    description: '',
    category: 'frontend',
    priority: 3
  })

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true)
    try {
      // 并行获取数据
      const [statusResult, goalsResult, pathsResult, statsResult] = await Promise.all([
        simpleApi.getSystemStatus(),
        Promise.resolve(simpleApi.getAllGoals()),
        Promise.resolve(simpleApi.getAllPaths()),
        Promise.resolve(simpleApi.getDataStats())
      ])

      // 更新状态
      if (statusResult.success) setSystemStatus(statusResult.data)
      if (goalsResult.success) setGoals(goalsResult.data || [])
      if (pathsResult.success) setPaths(pathsResult.data || [])
      if (statsResult.success) setStats(statsResult.data)

    } catch (error) {
      showMessage('❌ 数据刷新失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 显示消息
  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // 处理API结果
  const handleApiResult = (result: SimpleAPIResponse, successMsg?: string) => {
    if (result.success) {
      showMessage(successMsg || result.message || '操作成功')
      return true
    } else {
      showMessage(`❌ ${result.error}`, true)
      return false
    }
  }

  // 创建目标
  const handleCreateGoal = async () => {
    if (!goalForm.title.trim()) {
      showMessage('❌ 请输入目标标题', true)
      return
    }

    setLoading(true)
    try {
      const result = await simpleApi.createGoal(goalForm)
      if (handleApiResult(result)) {
        // 重置表单
        setGoalForm({
          title: '',
          description: '',
          category: 'frontend',
          priority: 3
        })
        // 刷新数据
        await refreshData()
      }
    } catch (error) {
      showMessage('❌ 创建目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 删除目标
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('确定要删除此目标吗？')) return

    setLoading(true)
    try {
      const result = await simpleApi.deleteGoal(goalId)
      if (handleApiResult(result)) {
        await refreshData()
      }
    } catch (error) {
      showMessage('❌ 删除目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 激活目标
  const handleActivateGoal = async (goalId: string) => {
    setLoading(true)
    try {
      const result = await simpleApi.activateGoal(goalId)
      if (handleApiResult(result)) {
        await refreshData()
      }
    } catch (error) {
      showMessage('❌ 激活目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 生成路径
  const handleGeneratePath = async (goalId: string) => {
    setLoading(true)
    try {
      const result = await simpleApi.generatePathForGoal(goalId)
      if (handleApiResult(result)) {
        await refreshData()
      }
    } catch (error) {
      showMessage('❌ 生成路径失败', true)
    } finally {
      setLoading(false)
    }
  }

  // AI对话测试
  const handleAIChat = async () => {
    setLoading(true)
    try {
      const result = await simpleApi.chatWithAI('我想看看我的学习目标')
      handleApiResult(result, 'AI对话测试完成')
    } catch (error) {
      showMessage('❌ AI对话失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载数据
  useEffect(() => {
    refreshData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 标题和说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">🚀 API层使用演示</h1>
        <p className="text-blue-600">
          这个页面展示了如何通过API层正确地管理学习数据，避免直接依赖业务逻辑模块。
        </p>
      </div>

      {/* 消息显示 */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-700">处理中...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：数据展示 */}
        <div className="space-y-4">
          
          {/* 系统状态 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              📊 系统状态
              <button 
                onClick={refreshData}
                className="ml-auto text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                disabled={loading}
              >
                刷新
              </button>
            </h2>
            {systemStatus ? (
              <div className="space-y-2 text-sm">
                <div>当前阶段: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{systemStatus.currentPhase}</span></div>
                <div>设置完成: <span className={systemStatus.setupComplete ? 'text-green-600' : 'text-orange-600'}>
                  {systemStatus.setupComplete ? '✅ 是' : '⏳ 否'}
                </span></div>
                <div>活跃目标: <span className="font-mono">{systemStatus.progress?.activeGoals || 0}</span></div>
                <div>活跃路径: <span className="font-mono">{systemStatus.progress?.activePaths || 0}</span></div>
                <div>整体进度: <span className="font-mono">{Math.round(systemStatus.progress?.overallProgress || 0)}%</span></div>
              </div>
            ) : (
              <div className="text-gray-500">暂无系统状态数据</div>
            )}
          </div>

          {/* 数据统计 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">📈 数据统计</h2>
            {stats ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>总目标: <span className="font-mono text-blue-600">{stats.totalGoals}</span></div>
                <div>活跃目标: <span className="font-mono text-green-600">{stats.activeGoals}</span></div>
                <div>完成目标: <span className="font-mono text-purple-600">{stats.completedGoals}</span></div>
                <div>总路径: <span className="font-mono text-orange-600">{stats.totalPaths}</span></div>
                <div>活跃路径: <span className="font-mono text-green-600">{stats.activePaths}</span></div>
                <div>总节点: <span className="font-mono text-gray-600">{stats.totalNodes}</span></div>
                <div>完成节点: <span className="font-mono text-purple-600">{stats.completedNodes}</span></div>
                <div>完成率: <span className="font-mono text-blue-600">
                  {stats.totalNodes > 0 ? Math.round((stats.completedNodes / stats.totalNodes) * 100) : 0}%
                </span></div>
              </div>
            ) : (
              <div className="text-gray-500">暂无统计数据</div>
            )}
          </div>

          {/* API测试 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">🧪 API测试</h2>
            <div className="space-y-2">
              <button 
                onClick={handleAIChat}
                className="w-full text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded p-2 text-sm"
                disabled={loading}
              >
                🤖 测试AI对话
              </button>
              <button 
                onClick={() => refreshData()}
                className="w-full text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-2 text-sm"
                disabled={loading}
              >
                🔄 刷新所有数据
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：操作面板 */}
        <div className="space-y-4">
          
          {/* 创建目标 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">➕ 创建目标</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="目标标题"
                value={goalForm.title}
                onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <textarea
                placeholder="目标描述"
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 resize-none"
              />
              <select
                value={goalForm.category}
                onChange={(e) => setGoalForm({...goalForm, category: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="frontend">前端开发</option>
                <option value="backend">后端开发</option>
                <option value="fullstack">全栈开发</option>
                <option value="ai">人工智能</option>
              </select>
              <button
                onClick={handleCreateGoal}
                disabled={loading || !goalForm.title.trim()}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                创建目标
              </button>
            </div>
          </div>

          {/* 目标列表 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">🎯 目标列表 ({goals.length})</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {goals.length > 0 ? goals.map((goal) => (
                <div key={goal.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{goal.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      goal.status === 'active' ? 'bg-green-100 text-green-700' :
                      goal.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleActivateGoal(goal.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      激活
                    </button>
                    <button
                      onClick={() => handleGeneratePath(goal.id)}
                      className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                      disabled={loading}
                    >
                      生成路径
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      disabled={loading}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  暂无目标，请创建一个目标开始学习
                </div>
              )}
            </div>
          </div>

          {/* 路径列表 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">🛤️ 路径列表 ({paths.length})</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {paths.length > 0 ? paths.map((path) => (
                <div key={path.id} className="border border-gray-200 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{path.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      path.status === 'active' ? 'bg-green-100 text-green-700' :
                      path.status === 'frozen' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {path.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {path.nodes.length} 个节点 | 预计 {path.totalDuration} 天
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-2 text-sm">
                  暂无路径
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 架构说明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ 架构改进效果</h2>
        <div className="text-green-700 text-sm space-y-1">
          <div>• UI组件通过API层访问数据，不直接依赖业务逻辑模块</div>
          <div>• 统一的错误处理和响应格式</div>
          <div>• 清晰的职责分离：UI层专注展示，API层处理数据交互</div>
          <div>• 消除循环依赖，提高代码可维护性</div>
        </div>
      </div>
    </div>
  )
} 