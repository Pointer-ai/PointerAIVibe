import React, { useState } from 'react'
import { goalApi, pathApi, simpleApi, isApiSuccess, handleApiError } from '../api'

/**
 * 快速开始示例组件
 * 
 * 展示如何正确使用新的API层进行常见操作
 */
export const QuickStartExample: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [goals, setGoals] = useState<any[]>([])

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // 示例1: 获取所有目标
  const handleGetGoals = () => {
    setLoading(true)
    try {
      const result = goalApi.getAllGoals()
      if (isApiSuccess(result)) {
        setGoals(result.data)
        showMessage(`✅ 获取到 ${result.data.length} 个目标`)
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 获取目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 示例2: 创建新目标
  const handleCreateGoal = async () => {
    setLoading(true)
    try {
      const result = await goalApi.createGoal({
        title: '学习TypeScript',
        description: '掌握TypeScript的高级特性',
        category: 'frontend',
        priority: 3,
        targetLevel: 'intermediate',
        estimatedTimeWeeks: 8,
        requiredSkills: ['JavaScript', 'ES6+'],
        outcomes: ['掌握TypeScript语法', '能够编写类型安全的代码']
      })
      
      if (isApiSuccess(result)) {
        showMessage(`✅ 目标创建成功: ${result.data.title}`)
        // 刷新目标列表
        handleGetGoals()
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 创建目标失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 示例3: 生成学习路径
  const handleGeneratePath = async () => {
    if (goals.length === 0) {
      showMessage('❌ 请先创建一个目标', true)
      return
    }

    setLoading(true)
    try {
      const firstGoal = goals[0]
      const result = await pathApi.generatePathForGoal(firstGoal.id)
      
      if (isApiSuccess(result)) {
        showMessage(`✅ 为目标"${firstGoal.title}"生成学习路径成功`)
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 生成路径失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 示例4: 获取数据统计
  const handleGetStats = () => {
    setLoading(true)
    try {
      const result = simpleApi.getDataStats()
      if (isApiSuccess(result)) {
        const stats = result.data
        showMessage(`📊 统计: ${stats.totalGoals}个目标, ${stats.totalPaths}个路径`)
      } else {
        showMessage(`❌ ${handleApiError(result)}`, true)
      }
    } catch (error) {
      showMessage('❌ 获取统计失败', true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">🚀 API层快速开始示例</h1>
        <p className="text-blue-600 text-sm">
          展示如何正确使用新的API层进行常见操作
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

      {/* 操作按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleGetGoals}
          disabled={loading}
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '加载中...' : '📋 获取所有目标'}
        </button>

        <button
          onClick={handleCreateGoal}
          disabled={loading}
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '创建中...' : '➕ 创建示例目标'}
        </button>

        <button
          onClick={handleGeneratePath}
          disabled={loading || goals.length === 0}
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '🛤️ 生成学习路径'}
        </button>

        <button
          onClick={handleGetStats}
          disabled={loading}
          className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '加载中...' : '📊 获取数据统计'}
        </button>
      </div>

      {/* 目标列表 */}
      {goals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">当前目标 ({goals.length})</h2>
          <div className="space-y-2">
            {goals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{goal.title}</h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    goal.status === 'active' ? 'bg-green-100 text-green-700' :
                    goal.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 代码示例 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">💻 代码示例</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. 导入API
import { goalApi, pathApi, isApiSuccess, handleApiError } from '../api'

// 2. 获取数据
const result = goalApi.getAllGoals()
if (isApiSuccess(result)) {
  setGoals(result.data)
} else {
  showError(handleApiError(result))
}

// 3. 创建目标
const createResult = await goalApi.createGoal({
  title: '学习React',
  description: '掌握React基础',
  category: 'frontend',
  priority: 3
})

// 4. 生成路径
const pathResult = await pathApi.generatePathForGoal(goalId)`}
        </pre>
      </div>

      {/* 架构说明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-3">🏗️ 新架构优势</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
          <div>
            <h3 className="font-medium mb-2">✅ 解决的问题</h3>
            <ul className="space-y-1">
              <li>• 消除循环依赖</li>
              <li>• 统一错误处理</li>
              <li>• 清晰的职责分离</li>
              <li>• 完整的类型安全</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">🚀 带来的好处</h3>
            <ul className="space-y-1">
              <li>• 更好的代码维护性</li>
              <li>• 一致的API接口</li>
              <li>• 更容易的测试和调试</li>
              <li>• 更好的开发体验</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 