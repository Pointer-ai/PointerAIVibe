import React, { useState, useEffect } from 'react'
import { 
  simpleApi, 
  isApiSuccess, 
  handleApiError, 
  type LearningGoal,
  type LearningPath 
} from '../api'
import { learningApiV2 } from '../api/learningApi_v2'

/**
 * API层功能测试仪表板 (v2)
 * 
 * 展示所有重构后的API v2功能，验证新架构成果
 */
export const APITestDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Record<string, any>>({})

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // 系统状态测试
  const testSystemStatus = async () => {
    setLoading(true)
    try {
      const result = await learningApiV2.getSystemStatus()
      if (result.success) {
        setResults(prev => ({ ...prev, systemStatus: result.data }))
        showMessage('✅ 系统状态获取成功 (v2)')
      } else {
        showMessage(`❌ ${result.error}`, true)
      }
    } catch (error) {
      showMessage('❌ 系统状态测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 目标API测试
  const testGoalAPI = async () => {
    setLoading(true)
    try {
      // 测试获取所有目标
      const goalsResult = await learningApiV2.getAllGoals()
      
      // 测试激活状态检查
      const canActivateResult = await learningApiV2.canActivateMoreGoals()
      
      // 测试目标统计
      const statsResult = await learningApiV2.getGoalStats()

      if (goalsResult.success && canActivateResult.success && statsResult.success) {
        setResults(prev => ({
          ...prev,
          goals: goalsResult.data,
          canActivateGoals: canActivateResult.data,
          goalStats: statsResult.data
        }))
        showMessage(`✅ 目标API v2测试完成 - ${goalsResult.data?.length || 0}个目标`)
      } else {
        showMessage('❌ 目标API v2测试失败', true)
      }
    } catch (error) {
      showMessage('❌ 目标API v2测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 路径API测试
  const testPathAPI = async () => {
    setLoading(true)
    try {
      // 测试获取所有路径
      const pathsResult = await learningApiV2.getAllPaths()

      if (pathsResult.success) {
        setResults(prev => ({
          ...prev,
          paths: pathsResult.data
        }))
        showMessage(`✅ 路径API v2测试完成 - ${pathsResult.data?.length || 0}个路径`)
      } else {
        showMessage('❌ 路径API v2测试失败', true)
      }
    } catch (error) {
      showMessage('❌ 路径API v2测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 评估API测试
  const testAssessmentAPI = async () => {
    setLoading(true)
    try {
      // 测试能力概要
      const summaryResult = await learningApiV2.getAbilitySummary()
      
      // 测试智能推荐
      const recommendationsResult = await learningApiV2.getSmartRecommendations()

      if (summaryResult.success && recommendationsResult.success) {
        setResults(prev => ({
          ...prev,
          abilitySummary: summaryResult.data,
          smartRecommendations: recommendationsResult.data
        }))
        showMessage('✅ 评估API v2测试完成')
      } else {
        showMessage('❌ 评估API v2测试失败', true)
      }
    } catch (error) {
      showMessage('❌ 评估API v2测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  // 简单API测试
  const testSimpleAPI = async () => {
    setLoading(true)
    try {
      // 测试数据统计
      const statsResult = simpleApi.getDataStats()
      
      // 测试系统状态
      const statusResult = await simpleApi.getSystemStatus()

      if (isApiSuccess(statsResult) && isApiSuccess(statusResult)) {
        setResults(prev => ({
          ...prev,
          simpleStats: statsResult.data,
          simpleStatus: statusResult.data
        }))
        showMessage('✅ 简单API测试完成')
      } else {
        showMessage('❌ 简单API测试失败', true)
      }
    } catch (error) {
      showMessage('❌ 简单API测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  // AI对话测试
  const testAIChat = async () => {
    setLoading(true)
    try {
      const result = await learningApiV2.chatWithAgent('请显示我的学习进度概览')
      if (result.success) {
        setResults(prev => ({ ...prev, aiChat: result.data }))
        showMessage('✅ AI对话v2测试成功')
      } else {
        showMessage(`❌ ${result.error}`, true)
      }
    } catch (error) {
      showMessage('❌ AI对话v2测试失败', true)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'system', name: '系统状态', action: testSystemStatus },
    { id: 'goals', name: '目标管理', action: testGoalAPI },
    { id: 'paths', name: '路径管理', action: testPathAPI },
    { id: 'assessment', name: '能力评估', action: testAssessmentAPI },
    { id: 'simple', name: '简单API', action: testSimpleAPI },
    { id: 'ai', name: 'AI对话', action: testAIChat }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 标题和说明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-green-800 mb-2">🧪 API层功能测试仪表板</h1>
        <p className="text-green-600 text-sm">
          所有TypeScript错误已修复！现在可以完整测试API层的所有功能。
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

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 测试按钮和加载状态 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const currentTab = tabs.find(tab => tab.id === activeTab)
            if (currentTab) currentTab.action()
          }}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          测试 {tabs.find(tab => tab.id === activeTab)?.name}
        </button>
        
        <div className="text-sm text-gray-500">
          已完成修复: learningApiV2, simpleApi
        </div>
      </div>

      {/* 结果展示区域 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">测试结果</h2>
        
        {activeTab === 'system' && results.systemStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">当前阶段</div>
                <div className="font-semibold">{results.systemStatus.currentPhase}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600">设置完成</div>
                <div className="font-semibold">{results.systemStatus.setupComplete ? '是' : '否'}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-purple-600">活跃目标</div>
                <div className="font-semibold">{results.systemStatus.progress?.activeGoals || 0}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-sm text-orange-600">整体进度</div>
                <div className="font-semibold">{Math.round(results.systemStatus.progress?.overallProgress || 0)}%</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (results.goals || results.goalStats) && (
          <div className="space-y-4">
            {results.goalStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">总目标</div>
                  <div className="font-semibold">{results.goalStats.total}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">活跃</div>
                  <div className="font-semibold">{results.goalStats.active}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-yellow-600">暂停</div>
                  <div className="font-semibold">{results.goalStats.paused}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">完成</div>
                  <div className="font-semibold">{results.goalStats.completed}</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">取消</div>
                  <div className="font-semibold">{results.goalStats.cancelled}</div>
                </div>
              </div>
            )}
            
            {results.goals && (
              <div>
                <h3 className="font-medium mb-2">目标列表 ({results.goals.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.goals.map((goal: any) => (
                    <div key={goal.id} className="border border-gray-200 rounded p-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{goal.title}</span>
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
          </div>
        )}

        {activeTab === 'paths' && (results.paths || results.pathProgress) && (
          <div className="space-y-4">
            {results.pathProgress && (
              <div>
                <h3 className="font-medium mb-2">路径进度概览</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.pathProgress.map((progress: any) => (
                    <div key={progress.pathId} className="border border-gray-200 rounded p-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{progress.title}</span>
                        <span className="text-blue-600 font-medium">{progress.progressPercentage}%</span>
                      </div>
                      <div className="text-gray-600 text-xs">
                        {progress.completedNodes}/{progress.totalNodes} 节点完成
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${progress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.pathRecommendations && (
              <div>
                <h3 className="font-medium mb-2">路径建议</h3>
                <div className="space-y-1">
                  {results.pathRecommendations.suggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                      💡 {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessment' && (results.abilitySummary || results.smartRecommendations) && (
          <div className="space-y-4">
            {results.abilitySummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-blue-600">总体评分</div>
                  <div className="text-2xl font-bold">{results.abilitySummary.overallScore}</div>
                  <div className="text-sm text-blue-600">{results.abilitySummary.level}</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-green-600">评估状态</div>
                  <div className="font-semibold">
                    {results.abilitySummary.hasAssessment ? '已完成' : '未完成'}
                  </div>
                  <div className="text-xs text-green-600">
                    {results.abilitySummary.assessmentDate || '暂无评估'}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-purple-600">需要重评</div>
                  <div className="font-semibold">
                    {results.abilitySummary.needsAssessment ? '是' : '否'}
                  </div>
                </div>
              </div>
            )}
            
            {results.smartRecommendations && (
              <div>
                <h3 className="font-medium mb-2">智能推荐</h3>
                <div className="space-y-1">
                  {results.smartRecommendations.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      💡 {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'simple' && (results.simpleStats || results.simpleStatus) && (
          <div className="space-y-4">
            {results.simpleStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">总目标</div>
                  <div className="font-semibold">{results.simpleStats.totalGoals}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">活跃目标</div>
                  <div className="font-semibold">{results.simpleStats.activeGoals}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">总路径</div>
                  <div className="font-semibold">{results.simpleStats.totalPaths}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-sm text-orange-600">完成率</div>
                  <div className="font-semibold">
                    {results.simpleStats.totalNodes > 0 
                      ? Math.round((results.simpleStats.completedNodes / results.simpleStats.totalNodes) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && results.aiChat && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <h3 className="font-medium text-purple-800 mb-2">AI 响应</h3>
              <div className="text-sm text-purple-700">{results.aiChat.response}</div>
            </div>
            {results.aiChat.toolsUsed?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">使用的工具</h4>
                <div className="flex flex-wrap gap-1">
                  {results.aiChat.toolsUsed.map((tool: string, index: number) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!Object.keys(results).length && (
          <div className="text-center text-gray-500 py-8">
            点击测试按钮开始验证API功能
          </div>
        )}
      </div>

      {/* 重构成果总结 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-2">🎉 重构成果</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
          <div>
            <h3 className="font-medium mb-1">✅ 修复完成</h3>
            <ul className="space-y-1 text-xs">
              <li>• 所有API文件TypeScript错误修复</li>
              <li>• 统一的错误处理和响应格式</li>
              <li>• 正确的类型定义和接口匹配</li>
              <li>• 消除循环依赖问题</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-1">🚀 架构改进</h3>
            <ul className="space-y-1 text-xs">
              <li>• UI组件 → API层 → 业务服务 → 核心数据</li>
              <li>• 清晰的职责分离</li>
              <li>• 可维护的代码结构</li>
              <li>• 完整的功能示例</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 