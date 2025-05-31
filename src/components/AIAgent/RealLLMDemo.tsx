import React, { useState } from 'react'
import { getAIResponseWithTools } from '../AIAssistant/service'
import { AGENT_TOOLS, agentToolExecutor } from '../../modules/coreData'
import { getAPIConfig } from '../../modules/profileSettings/service'
import { log } from '../../utils/logger'

interface TestResult {
  userMessage: string
  aiResponse: string
  toolsUsed: string[]
  timestamp: string
  success: boolean
  error?: string
}

export const RealLLMDemo: React.FC = () => {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [userInput, setUserInput] = useState('')

  const addOutput = (text: string) => {
    setOutput(prev => prev + '\n' + text)
  }

  const clearOutput = () => {
    setOutput('')
    setTestResults([])
  }

  // 测试真实LLM Function Calling
  const testRealLLMFunctionCalling = async () => {
    setLoading(true)
    clearOutput()
    
    const apiConfig = getAPIConfig()
    if (!apiConfig.key) {
      addOutput('❌ 请先在Profile设置中配置API Key！')
      addOutput('支持的模型：OpenAI GPT-4、Claude 3.5、通义千问')
      setLoading(false)
      return
    }

    addOutput(`🤖 开始测试真实LLM Function Calling`)
    addOutput(`📡 使用模型: ${apiConfig.model} (${apiConfig.specificModel})`)
    addOutput(`🛠️ 可用工具: ${AGENT_TOOLS.length}个`)
    addOutput('')

    const testMessages = [
      '我想看看我的学习目标',
      '帮我分析一下我的能力水平',
      '为我创建一个学习JavaScript的目标',
      '我需要一个完整的学习报告',
      '我觉得学习太难了，能帮帮我吗？'
    ]

    const results: TestResult[] = []

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      addOutput(`\n🧪 测试 ${i + 1}/5: ${message}`)
      
      try {
        const startTime = Date.now()
        
        const result = await getAIResponseWithTools(
          message,
          `当前时间: ${new Date().toLocaleString()}`,
          AGENT_TOOLS,
          async (toolName: string, parameters: any) => {
            addOutput(`  🔧 执行工具: ${toolName}`)
            return await agentToolExecutor.executeTool(toolName, parameters)
          }
        )

        const duration = Date.now() - startTime
        
        addOutput(`  ✅ 成功 (${duration}ms)`)
        addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ') || '无'}`)
        addOutput(`  💬 AI回复: ${result.response.substring(0, 150)}...`)

        const testResult: TestResult = {
          userMessage: message,
          aiResponse: result.response,
          toolsUsed: result.toolCalls.map(tc => tc.name),
          timestamp: new Date().toISOString(),
          success: true
        }
        results.push(testResult)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        addOutput(`  ❌ 失败: ${errorMsg}`)
        
        const testResult: TestResult = {
          userMessage: message,
          aiResponse: '',
          toolsUsed: [],
          timestamp: new Date().toISOString(),
          success: false,
          error: errorMsg
        }
        results.push(testResult)
      }
    }

    setTestResults(results)
    
    // 统计测试结果
    const successCount = results.filter(r => r.success).length
    const toolCallsCount = results.reduce((sum, r) => sum + r.toolsUsed.length, 0)
    
    addOutput(`\n📊 测试结果统计:`)
    addOutput(`成功率: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`)
    addOutput(`工具调用次数: ${toolCallsCount}`)
    addOutput(`平均每次调用工具: ${Math.round(toolCallsCount / successCount * 10) / 10}个`)
    
    if (successCount === results.length) {
      addOutput(`\n🎉 恭喜！真实LLM Function Calling功能完全正常！`)
    } else {
      addOutput(`\n⚠️ 部分测试失败，请检查API配置和网络连接`)
    }

    setLoading(false)
  }

  // 自定义测试
  const testCustomMessage = async () => {
    if (!userInput.trim() || loading) return

    setLoading(true)
    addOutput(`\n🧪 自定义测试: ${userInput}`)

    try {
      const result = await getAIResponseWithTools(
        userInput,
        `当前时间: ${new Date().toLocaleString()}`,
        AGENT_TOOLS,
        async (toolName: string, parameters: any) => {
          addOutput(`  🔧 执行工具: ${toolName}`)
          log(`[RealLLMDemo] Tool executed: ${toolName}`, parameters)
          return await agentToolExecutor.executeTool(toolName, parameters)
        }
      )

      addOutput(`  ✅ 成功`)
      addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ') || '无'}`)
      addOutput(`  💬 AI回复: ${result.response}`)

      const testResult: TestResult = {
        userMessage: userInput,
        aiResponse: result.response,
        toolsUsed: result.toolCalls.map(tc => tc.name),
        timestamp: new Date().toISOString(),
        success: true
      }
      setTestResults(prev => [...prev, testResult])

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      addOutput(`  ❌ 失败: ${errorMsg}`)
      
      const testResult: TestResult = {
        userMessage: userInput,
        aiResponse: '',
        toolsUsed: [],
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMsg
      }
      setTestResults(prev => [...prev, testResult])
    } finally {
      setLoading(false)
      setUserInput('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          🤖 真实LLM Function Calling测试
          <span className="ml-2 text-sm font-normal text-gray-500">验证智能工具调用</span>
        </h3>

        <div className="space-y-4">
          {/* 自动测试 */}
          <div className="flex space-x-4">
            <button
              onClick={testRealLLMFunctionCalling}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '测试中...' : '🧪 自动测试 (5个案例)'}
            </button>
            
            <button
              onClick={clearOutput}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ 清空结果
            </button>
          </div>

          {/* 自定义测试 */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testCustomMessage()}
              placeholder="输入自定义测试消息..."
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testCustomMessage}
              disabled={loading || !userInput.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🚀 测试
            </button>
          </div>

          {/* 测试输出 */}
          {output && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
          )}

          {/* 测试结果汇总 */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">📋 测试结果汇总</h4>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {result.success ? '✅' : '❌'} {result.userMessage}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {result.success && (
                      <div className="mt-2 text-sm text-gray-600">
                        <div>🛠️ 工具: {result.toolsUsed.join(', ') || '无'}</div>
                        <div>💬 回复: {result.aiResponse.substring(0, 100)}...</div>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        ❌ 错误: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 