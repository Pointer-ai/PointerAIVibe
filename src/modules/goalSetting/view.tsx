import React, { useState } from 'react'
import { log } from '../../utils/logger'
import { GoalSettingService } from './service'
import { 
  GoalCreationMode, 
  NaturalLanguageInput, 
  ParsedGoalData, 
  AIGoalParseResult 
} from './types'

const goalService = new GoalSettingService()

export const GoalSettingView = () => {
  const [mode, setMode] = useState<GoalCreationMode>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [parseResult, setParseResult] = useState<AIGoalParseResult | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set())

  log('[goalSetting] View loaded')

  // 处理自然语言解析
  const handleNaturalLanguageParse = async () => {
    if (!naturalLanguageInput.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const input: NaturalLanguageInput = {
        description: naturalLanguageInput.trim()
      }
      
      const result = await goalService.parseNaturalLanguageGoal(input)
      setParseResult(result)
      
      if (result.success && result.goals.length > 0) {
        // 默认选中所有解析出的目标
        setSelectedGoals(new Set(result.goals.map((_, index) => index)))
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
    } finally {
      setIsLoading(false)
    }
  }

  // 创建选中的目标
  const handleCreateSelectedGoals = async () => {
    if (!parseResult || !parseResult.success) return

    setIsLoading(true)
    try {
      const selectedGoalsList = Array.from(selectedGoals).map(index => parseResult.goals[index])
      
      for (const goal of selectedGoalsList) {
        await goalService.createGoalFromParsedData(goal)
      }
      
      // 重置状态
      setParseResult(null)
      setNaturalLanguageInput('')
      setSelectedGoals(new Set())
      
      alert('目标创建成功！')
    } catch (error) {
      console.error('Goal creation failed:', error)
      alert('目标创建失败，请稍后重试')
    } finally {
      setIsLoading(false)
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">设定学习目标</h2>
        <p className="text-gray-600">选择你喜欢的方式来创建学习目标</p>
      </div>

      {/* 模式切换 */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setMode('natural_language')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'natural_language'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🤖 智能自然语言模式
          </button>
          <button
            onClick={() => setMode('form')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'form'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 传统表单模式
          </button>
        </div>
      </div>

      {/* 自然语言模式 */}
      {mode === 'natural_language' && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              描述你想要达成的目标
            </h3>
            <p className="text-gray-600 text-sm">
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
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleNaturalLanguageParse}
                disabled={isLoading || !naturalLanguageInput.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '正在解析...' : '🧠 AI 解析目标'}
              </button>
            </div>
          </div>

          {/* 解析结果 */}
          {parseResult && (
            <div className="border-t pt-6">
              {parseResult.success ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      🎯 AI 为你生成了以下学习目标
                    </h4>
                    <p className="text-gray-600 text-sm">
                      请选择你想要创建的目标
                    </p>
                  </div>

                  <div className="space-y-4">
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
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
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
                              <div className="mt-3">
                                <span className="text-xs font-medium text-gray-500">需要技能: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {goal.requiredSkills.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {goal.learningPath.length > 0 && (
                              <div className="mt-3">
                                <span className="text-xs font-medium text-gray-500">
                                  学习路径 ({goal.learningPath.length} 个节点):
                                </span>
                                <div className="mt-1 text-xs text-gray-600">
                                  {goal.learningPath.slice(0, 3).map((node, nodeIndex) => (
                                    <span key={nodeIndex}>
                                      {nodeIndex > 0 && ' → '}
                                      {node.title}
                                    </span>
                                  ))}
                                  {goal.learningPath.length > 3 && ' ...'}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
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
                      disabled={selectedGoals.size === 0 || isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? '创建中...' : `创建选中的目标 (${selectedGoals.size})`}
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
      {mode === 'form' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              传统表单模式
            </h3>
            <p className="text-gray-600">该模块正在开发中...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalSettingView 