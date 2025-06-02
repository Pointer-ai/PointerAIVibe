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
    addOutput(`🔥 测试模式: 强制工具调用，包含完整用户上下文`)
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
          `🎯 测试模式：强制工具调用验证\n当前时间: ${new Date().toLocaleString()}\n\n🚨 重要提醒：您必须使用相应的工具来获取数据，不能直接回答。这是Function Calling功能测试，请严格遵循工具使用要求。`,
          AGENT_TOOLS,
          async (toolName: string, parameters: any) => {
            addOutput(`  🔧 执行工具: ${toolName}`)
            return await agentToolExecutor.executeTool(toolName, parameters)
          }
        )

        const duration = Date.now() - startTime
        
        addOutput(`  ✅ 成功 (${duration}ms)`)
        addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ') || '无'}`)
        
        // 🆕 增强的工具调用验证
        if (result.toolCalls.length === 0) {
          addOutput(`  ⚠️ 警告: 未调用任何工具，这可能表示Function Calling配置有问题`)
        } else {
          addOutput(`  ✨ 工具调用成功: ${result.toolCalls.length}个工具`)
        }
        
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
    
    // 🆕 增强的测试结果统计
    const successCount = results.filter(r => r.success).length
    const toolCallsCount = results.reduce((sum, r) => sum + r.toolsUsed.length, 0)
    const noToolCallCount = results.filter(r => r.success && r.toolsUsed.length === 0).length
    
    addOutput(`\n📊 测试结果统计:`)
    addOutput(`成功率: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`)
    addOutput(`工具调用次数: ${toolCallsCount}`)
    addOutput(`平均每次调用工具: ${Math.round(toolCallsCount / successCount * 10) / 10}个`)
    addOutput(`未调用工具的测试: ${noToolCallCount}个`)
    
    // 🆕 工具调用质量评估
    if (noToolCallCount > 0) {
      addOutput(`\n⚠️ 工具调用问题分析:`)
      addOutput(`- ${noToolCallCount}个测试未成功调用工具`)
      addOutput(`- 这可能是由于以下原因：`)
      addOutput(`  1. AI模型设置问题（tool_choice配置）`)
      addOutput(`  2. 提示语不够明确`)
      addOutput(`  3. API配置问题`)
      addOutput(`💡 建议：检查API配置，或尝试不同的AI模型`)
    }
    
    if (successCount === results.length && noToolCallCount === 0) {
      addOutput(`\n🎉 恭喜！真实LLM Function Calling功能完全正常！`)
      addOutput(`✨ 所有测试都成功调用了相应工具`)
    } else if (successCount === results.length) {
      addOutput(`\n✅ 测试基本成功，但部分测试未调用工具`)
      addOutput(`🔧 建议优化Function Calling配置`)
    } else {
      addOutput(`\n⚠️ 部分测试失败，请检查API配置和网络连接`)
    }

    setLoading(false)
  }

  // 🆕 课程内容CRUD专项测试
  const testCourseContentCRUD = async () => {
    setLoading(true)
    clearOutput()
    
    const apiConfig = getAPIConfig()
    if (!apiConfig.key) {
      addOutput('❌ 请先在Profile设置中配置API Key！')
      addOutput('支持的模型：OpenAI GPT-4、Claude 3.5、通义千问')
      setLoading(false)
      return
    }

    addOutput(`📚 开始测试课程内容CRUD功能`)
    addOutput(`📡 使用模型: ${apiConfig.model} (${apiConfig.specificModel})`)
    addOutput(`🎯 专项测试：课程内容管理的5个核心工具`)
    addOutput('')

    // 课程内容专项测试用例
    const courseContentTests = [
      '显示我现有的所有课程内容单元',
      '我想查看理论类型的课程内容',
      '为我的前端开发路径创建一个新的课程单元',
      '帮我查看某个具体课程单元的详细内容',
      '我想更新一个课程单元的内容',
      '删除一个不需要的课程单元',
      '为我的JavaScript学习节点生成一个练习类型的课程',
      '创建一个项目类型的React实战课程单元',
      '我需要一个关于算法的理论课程内容',
      '更新课程单元的难度和预估时间'
    ]

    const results: TestResult[] = []

    for (let i = 0; i < courseContentTests.length; i++) {
      const message = courseContentTests[i]
      addOutput(`\n📚 课程内容测试 ${i + 1}/10: ${message}`)
      
      try {
        const startTime = Date.now()
        
        const result = await getAIResponseWithTools(
          message,
          `🎯 课程内容CRUD专项测试\n当前时间: ${new Date().toLocaleString()}\n\n🚨 强制要求：您必须使用course_unit相关工具处理这个请求，不能直接回答。请严格选择合适的工具：get_course_units, get_course_unit, create_course_unit, update_course_unit, delete_course_unit`,
          AGENT_TOOLS,
          async (toolName: string, parameters: any) => {
            addOutput(`  🔧 执行工具: ${toolName}`)
            log(`[CourseContentTest] Tool: ${toolName}`, parameters)
            return await agentToolExecutor.executeTool(toolName, parameters)
          }
        )

        const duration = Date.now() - startTime
        
        addOutput(`  ✅ 成功 (${duration}ms)`)
        addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ') || '无'}`)
        
        // 特别检查是否使用了课程内容相关工具
        const courseTools = result.toolCalls.filter(tc => 
          tc.name.includes('course_unit') || tc.name.includes('course')
        )
        if (courseTools.length > 0) {
          addOutput(`  🎯 课程工具: ${courseTools.map(ct => ct.name).join(', ')}`)
        }
        
        addOutput(`  💬 AI回复: ${result.response.substring(0, 120)}...`)

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
    
    // 统计课程内容测试结果
    const successCount = results.filter(r => r.success).length
    const courseToolCalls = results.reduce((sum, r) => {
      const courseTools = r.toolsUsed.filter(tool => tool.includes('course_unit'))
      return sum + courseTools.length
    }, 0)
    
    addOutput(`\n📊 课程内容测试统计:`)
    addOutput(`成功率: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`)
    addOutput(`课程工具调用: ${courseToolCalls}次`)
    addOutput(`平均每次课程工具调用: ${Math.round(courseToolCalls / successCount * 10) / 10}个`)
    
    // 统计使用的课程工具类型
    const allCourseTools = results.flatMap(r => 
      r.toolsUsed.filter(tool => tool.includes('course_unit'))
    )
    const toolFrequency = allCourseTools.reduce((acc, tool) => {
      acc[tool] = (acc[tool] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    if (Object.keys(toolFrequency).length > 0) {
      addOutput(`\n🔧 工具使用频率:`)
      Object.entries(toolFrequency).forEach(([tool, count]) => {
        addOutput(`  ${tool}: ${count}次`)
      })
    }
    
    if (successCount === results.length) {
      addOutput(`\n🎉 恭喜！课程内容CRUD功能完全正常！`)
    } else {
      addOutput(`\n⚠️ 部分测试失败，请检查API配置和网络连接`)
    }

    setLoading(false)
  }

  // 🆕 综合功能测试
  const testComprehensiveFunctionCalling = async () => {
    setLoading(true)
    clearOutput()
    
    const apiConfig = getAPIConfig()
    if (!apiConfig.key) {
      addOutput('❌ 请先在Profile设置中配置API Key！')
      addOutput('支持的模型：OpenAI GPT-4、Claude 3.5、通义千问')
      setLoading(false)
      return
    }

    addOutput(`🎯 开始综合功能测试`)
    addOutput(`📡 使用模型: ${apiConfig.model} (${apiConfig.specificModel})`)
    addOutput(`🔧 测试范围：学习目标、路径、课程内容的完整workflow`)
    addOutput('')

    // 综合测试场景 - 模拟完整学习流程
    const comprehensiveTests = [
      '我想开始学习Python数据分析，请帮我制定完整的学习计划',
      '为我刚创建的Python数据分析目标生成详细的学习路径',
      '为学习路径的第一个节点创建具体的课程内容',
      '我想看看我的整体学习进度如何',
      '我在学习pandas时遇到困难，请帮我处理',
      '推荐适合我的学习计划安排',
      '我想调整学习节奏，感觉有点太快了',
      '给我生成一些Python练习题',
      '我想查看我的能力水平和学习建议'
    ]

    const results: TestResult[] = []

    for (let i = 0; i < comprehensiveTests.length; i++) {
      const message = comprehensiveTests[i]
      addOutput(`\n🎯 综合测试 ${i + 1}/9: ${message}`)
      
      try {
        const startTime = Date.now()
        
        const result = await getAIResponseWithTools(
          message,
          `🎯 综合学习管理测试\n当前时间: ${new Date().toLocaleString()}\n\n🚨 强制要求：您必须使用学习管理工具处理这个请求，不能直接回答。根据用户需求智能选择目标、路径、课程、分析等相关工具，可以组合使用多个工具。`,
          AGENT_TOOLS,
          async (toolName: string, parameters: any) => {
            addOutput(`  🔧 执行工具: ${toolName}`)
            return await agentToolExecutor.executeTool(toolName, parameters)
          }
        )

        const duration = Date.now() - startTime
        
        addOutput(`  ✅ 成功 (${duration}ms)`)
        addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ') || '无'}`)
        addOutput(`  📊 工具数量: ${result.toolCalls.length}个`)
        addOutput(`  💬 AI回复: ${result.response.substring(0, 100)}...`)

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
    
    // 综合测试统计
    const successCount = results.filter(r => r.success).length
    const totalToolCalls = results.reduce((sum, r) => sum + r.toolsUsed.length, 0)
    
    // 按工具类型分类统计
    const allTools = results.flatMap(r => r.toolsUsed)
    const goalTools = allTools.filter(tool => tool.includes('goal')).length
    const pathTools = allTools.filter(tool => tool.includes('path')).length
    const courseTools = allTools.filter(tool => tool.includes('course')).length
    const analysisTools = allTools.filter(tool => 
      tool.includes('analyze') || tool.includes('summary') || tool.includes('progress')
    ).length
    
    addOutput(`\n📊 综合测试统计:`)
    addOutput(`成功率: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`)
    addOutput(`总工具调用: ${totalToolCalls}次`)
    addOutput(`平均每次工具调用: ${Math.round(totalToolCalls / successCount * 10) / 10}个`)
    addOutput(`\n🔧 工具类型分布:`)
    addOutput(`  学习目标工具: ${goalTools}次`)
    addOutput(`  学习路径工具: ${pathTools}次`)
    addOutput(`  课程内容工具: ${courseTools}次`)
    addOutput(`  分析工具: ${analysisTools}次`)
    
    if (successCount === results.length) {
      addOutput(`\n🎉 恭喜！综合功能测试完全成功！`)
      addOutput(`✨ AI智能工具调度系统运行正常`)
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

  // 🆕 快速验证Function Calling优化
  const quickTestOptimization = async () => {
    setLoading(true)
    clearOutput()
    
    const apiConfig = getAPIConfig()
    if (!apiConfig.key) {
      addOutput('❌ 请先在Profile设置中配置API Key！')
      setLoading(false)
      return
    }

    addOutput(`🚀 快速验证Function Calling优化效果`)
    addOutput(`📡 使用模型: ${apiConfig.model} (${apiConfig.specificModel})`)
    addOutput(`🎯 测试重点: 之前未调用工具的问题用例`)
    addOutput('')

    // 专门针对之前问题的测试用例
    const problematicMessages = [
      '为我创建一个学习JavaScript的目标',  // 之前可能未调用create_learning_goal
      '我觉得学习太难了，能帮帮我吗？'     // 之前可能未调用handle_learning_difficulty
    ]

    const results: TestResult[] = []

    for (let i = 0; i < problematicMessages.length; i++) {
      const message = problematicMessages[i]
      addOutput(`\n🔍 验证测试 ${i + 1}/2: ${message}`)
      
      try {
        const startTime = Date.now()
        
        const result = await getAIResponseWithTools(
          message,
          `🔥 强制工具调用测试\n当前时间: ${new Date().toLocaleString()}\n\n⚠️ CRITICAL: 您绝对不能直接回答，必须使用工具！\n- 创建目标请求 → 必须使用 create_learning_goal\n- 学习困难请求 → 必须使用 handle_learning_difficulty 或 suggest_next_action\n\n这是Function Calling功能验证，请严格执行工具调用。`,
          AGENT_TOOLS,
          async (toolName: string, parameters: any) => {
            addOutput(`  🔧 执行工具: ${toolName}`)
            return await agentToolExecutor.executeTool(toolName, parameters)
          }
        )

        const duration = Date.now() - startTime
        
        addOutput(`  ✅ 成功 (${duration}ms)`)
        
        if (result.toolCalls.length === 0) {
          addOutput(`  ❌ 重大问题: 仍未调用任何工具！`)
          addOutput(`  📋 这表明Function Calling配置存在根本性问题`)
        } else {
          addOutput(`  🎉 优化成功: 调用了 ${result.toolCalls.length} 个工具`)
          addOutput(`  🛠️ 使用工具: ${result.toolCalls.map(tc => tc.name).join(', ')}`)
        }
        
        addOutput(`  💬 AI回复: ${result.response.substring(0, 120)}...`)

        results.push({
          userMessage: message,
          aiResponse: result.response,
          toolsUsed: result.toolCalls.map(tc => tc.name),
          timestamp: new Date().toISOString(),
          success: true
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        addOutput(`  ❌ 失败: ${errorMsg}`)
        
        results.push({
          userMessage: message,
          aiResponse: '',
          toolsUsed: [],
          timestamp: new Date().toISOString(),
          success: false,
          error: errorMsg
        })
      }
    }
    
    // 优化效果评估
    const toolCallsCount = results.reduce((sum, r) => sum + r.toolsUsed.length, 0)
    const successfulToolCalls = results.filter(r => r.success && r.toolsUsed.length > 0).length
    
    addOutput(`\n📊 优化效果评估:`)
    addOutput(`成功工具调用: ${successfulToolCalls}/${results.length}`)
    addOutput(`总工具调用数: ${toolCallsCount}`)
    
    if (successfulToolCalls === results.length) {
      addOutput(`\n🎉 优化完全成功！`)
      addOutput(`✨ 所有问题用例现在都能正确调用工具`)
      addOutput(`🔧 Function Calling系统运行正常`)
    } else {
      addOutput(`\n⚠️ 仍有问题需要解决`)
      addOutput(`💡 建议检查：`)
      addOutput(`   1. API模型是否支持Function Calling`)
      addOutput(`   2. tool_choice配置是否正确`)
      addOutput(`   3. 工具定义是否符合API要求`)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          🤖 真实LLM Function Calling测试
          <span className="ml-2 text-sm font-normal text-gray-500">验证智能工具调用</span>
        </h3>

        <div className="space-y-4">
          {/* 测试按钮组 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={testRealLLMFunctionCalling}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {loading ? '测试中...' : '🧪 基础测试 (5个)'}
            </button>
            
            <button
              onClick={testCourseContentCRUD}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {loading ? '测试中...' : '📚 课程内容 (10个)'}
            </button>
            
            <button
              onClick={testComprehensiveFunctionCalling}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {loading ? '测试中...' : '🎯 综合测试 (9个)'}
            </button>
            
            <button
              onClick={quickTestOptimization}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {loading ? '验证中...' : '🚀 快速验证优化'}
            </button>
            
            <button
              onClick={clearOutput}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              🗑️ 清空结果
            </button>
          </div>

          {/* 测试说明 */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 测试说明</h4>
            <div className="space-y-1 text-blue-800">
              <div><strong>基础测试:</strong> 验证核心LLM Function Calling功能</div>
              <div><strong>课程内容测试:</strong> 专项测试5个课程内容CRUD工具</div>
              <div><strong>综合测试:</strong> 模拟完整学习流程的工具组合调用</div>
              <div><strong>🆕 快速验证优化:</strong> 专门测试之前未调用工具的问题用例</div>
              <div><strong>自定义测试:</strong> 测试任意自定义消息的工具调用</div>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
              <div className="font-semibold text-yellow-800 mb-1">🔥 优化亮点:</div>
              <div className="text-yellow-700 text-xs space-y-1">
                <div>• 强制工具调用: 设置tool_choice='required'避免直接回答</div>
                <div>• 完整用户上下文: 包含档案、目标、路径、课程等完整信息</div>
                <div>• 明确提示语: 严格要求AI使用工具而非凭借已有知识回答</div>
                <div>• 质量评估: 统计未调用工具的测试并提供问题分析</div>
              </div>
            </div>
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