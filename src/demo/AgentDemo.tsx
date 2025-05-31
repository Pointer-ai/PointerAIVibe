import React, { useState } from 'react'
import { learningSystemService } from '../modules/learningSystem'
import { agentToolExecutor, getLearningGoals, getAbilityProfile } from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'
import { getAPIConfig } from '../modules/profileSettings/service'
import { LearningGoal } from '../modules/coreData/types'

interface ChatMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  toolsUsed?: string[]
  suggestions?: string[]
}

export const AgentDemo: React.FC = () => {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [demoGoalId, setDemoGoalId] = useState<string | null>(null)
  
  // AI Chat 相关状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const addOutput = (text: string) => {
    setOutput(prev => prev + '\n' + text)
  }

  const clearOutput = () => {
    setOutput('')
  }

  // AI聊天功能 - 使用真实的LLM
  const startAIChat = async () => {
    setShowChat(true)
    
    // 检查AI配置
    const apiConfig = getAPIConfig()
    if (!apiConfig.key) {
      const systemMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'system',
        content: '⚠️ 请先在Profile设置中配置AI API Key，然后重新开始对话。支持OpenAI、Claude、通义千问等模型。',
        timestamp: new Date().toISOString()
      }
      setChatMessages([systemMessage])
      return
    }

    // 初始化欢迎消息
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'agent',
      content: await generateWelcomeMessage(),
      timestamp: new Date().toISOString(),
      suggestions: [
        '分析我的能力水平',
        '我想学习前端开发', 
        '为我制定学习计划',
        '我觉得学习太难了',
        '推荐一些学习资源'
      ]
    }
    setChatMessages([welcomeMessage])
  }

  const generateWelcomeMessage = async (): Promise<string> => {
    const assessment = getCurrentAssessment()
    const goals = getLearningGoals()
    const activeGoals = goals.filter(g => g.status === 'active')

    let context = '系统状态：'
    if (assessment) {
      context += `✅ 已完成能力评估 (总分: ${assessment.overallScore}/100)`
    } else {
      context += '❌ 未完成能力评估'
    }
    
    if (activeGoals.length > 0) {
      context += `，有 ${activeGoals.length} 个活跃学习目标`
    } else {
      context += '，还没有设定学习目标'
    }

    return `🤖 你好！我是你的AI学习助手。我已经分析了你的当前状态：

${context}

我可以帮助你：
• 🧠 分析技能水平和能力差距
• 🎯 设定个性化学习目标
• 🛤️ 生成定制学习路径
• 📚 推荐学习内容和资源
• 📊 跟踪学习进度
• 🔧 调整学习节奏和难度

有什么我可以帮助你的吗？`
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      // 使用真实的AI学习系统
      const response = await learningSystemService.chatWithAgent(chatInput, {
        useRealLLM: true, // 强制使用真实LLM
        chatHistory: chatMessages
      })

      const agentMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'agent',
        content: response.response,
        timestamp: new Date().toISOString(),
        toolsUsed: response.toolsUsed,
        suggestions: response.suggestions
      }

      setChatMessages(prev => [...prev, agentMessage])

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'system',
        content: `❌ 对话失败: ${error instanceof Error ? error.message : '未知错误'}\n\n请检查：\n1. API Key是否正确配置\n2. 网络连接是否正常\n3. API额度是否充足`,
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion)
    setTimeout(() => sendChatMessage(), 100)
  }

  const clearChat = () => {
    setChatMessages([])
    setShowChat(false)
  }

  // 演示能力评估系统集成
  const demoAbilityIntegration = async () => {
    setLoading(true)
    addOutput('=== 能力评估系统集成演示 ===')
    
    try {
      // 1. 检查能力评估数据
      const assessment = getCurrentAssessment()
      const abilityProfile = getAbilityProfile()
      
      if (assessment) {
        addOutput(`📊 发现能力评估数据:`)
        addOutput(`   总体评分: ${assessment.overallScore}/100`)
        addOutput(`   评估日期: ${assessment.metadata.assessmentDate}`)
        addOutput(`   评估方式: ${assessment.metadata.assessmentMethod}`)
        addOutput(`   置信度: ${Math.round(assessment.metadata.confidence * 100)}%`)
        
        // 显示各维度评分
        addOutput(`\n📈 各维度评分:`)
        Object.entries(assessment.dimensions).forEach(([key, dimension]) => {
          addOutput(`   ${key}: ${dimension.score}/100 (权重: ${dimension.weight})`)
        })
        
        // 显示优势和待改进项
        addOutput(`\n💪 优势领域: ${assessment.report.strengths.join(', ')}`)
        addOutput(`📈 待改进: ${assessment.report.improvements.join(', ')}`)
        
        // 2. 测试AI工具是否能正确获取能力数据
        const abilityAnalysis = await agentToolExecutor.executeTool('analyze_user_ability', {})
        addOutput(`\n🤖 AI工具分析结果:`)
        addOutput(`   AI检测到能力数据: ${abilityAnalysis.hasAbilityData ? '是' : '否'}`)
        if (abilityAnalysis.hasAbilityData) {
          addOutput(`   AI评估的总分: ${abilityAnalysis.overallScore}/10`)
          addOutput(`   AI识别的优势: ${abilityAnalysis.strengths.join(', ')}`)
          addOutput(`   AI识别的弱点: ${abilityAnalysis.weaknesses.join(', ')}`)
        }
        
      } else {
        addOutput(`❌ 未找到能力评估数据`)
        addOutput(`💡 建议: 请先在能力评估模块完成评估`)
        addOutput(`   - 方式1: 上传PDF简历进行AI分析`)
        addOutput(`   - 方式2: 完成技能问卷`)
      }
      
      // 3. 演示基于能力的学习建议
      if (abilityProfile) {
        addOutput(`\n🎯 基于能力的学习建议:`)
        const smartRecommendations = await learningSystemService.getSmartLearningRecommendations()
        smartRecommendations.recommendations.forEach((rec, index) => {
          addOutput(`   ${index + 1}. ${rec}`)
        })
      }
      
    } catch (error) {
      addOutput(`❌ 能力集成演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示AI Agent对话
  const demoChat = async () => {
    setLoading(true)
    addOutput('=== AI Agent对话演示 ===')
    
    try {
      const response1 = await learningSystemService.chatWithAgent('我想学前端开发')
      addOutput(`用户: 我想学前端开发`)
      addOutput(`AI: ${response1.response}`)
      addOutput(`工具: ${response1.toolsUsed.join(', ')}`)
      
      const response2 = await learningSystemService.chatWithAgent('我的学习进度如何？')
      addOutput(`\n用户: 我的学习进度如何？`)
      addOutput(`AI: ${response2.response}`)
      addOutput(`工具: ${response2.toolsUsed.join(', ')}`)
      
    } catch (error) {
      addOutput(`错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示创建学习目标
  const demoCreateGoal = async () => {
    setLoading(true)
    addOutput('=== 创建学习目标演示 ===')
    
    try {
      const goal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: '前端开发入门',
        description: '从零基础学习前端开发技术',
        category: 'frontend',
        priority: 4,
        targetLevel: 'intermediate',
        estimatedTimeWeeks: 12,
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
        outcomes: ['能够构建响应式网站', '掌握现代前端框架']
      })
      
      addOutput(`✅ 成功创建学习目标:`)
      addOutput(`   ID: ${goal.id}`)
      addOutput(`   标题: ${goal.title}`)
      addOutput(`   类别: ${goal.category}`)
      addOutput(`   目标水平: ${goal.targetLevel}`)
      addOutput(`   预计时间: ${goal.estimatedTimeWeeks} 周`)
      
      // 保存goal ID到组件状态，供其他演示使用
      setDemoGoalId(goal.id)
      
    } catch (error) {
      addOutput(`❌ 创建目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示生成学习路径
  const demoGeneratePath = async () => {
    setLoading(true)
    addOutput('=== 生成学习路径演示 ===')
    
    try {
      // 确保有一个可用的goal
      let goalId = demoGoalId
      if (!goalId) {
        // 尝试获取现有的goal
        const goals = getLearningGoals()
        const activeGoal = goals.find((g: LearningGoal) => g.status === 'active')
        
        if (!activeGoal) {
          addOutput('❌ 请先创建学习目标再生成路径')
          return
        }
        
        goalId = activeGoal.id
        addOutput(`📌 使用现有目标: ${activeGoal.title}`)
      }
      
      // 首先生成路径节点
      const nodes = await agentToolExecutor.executeTool('generate_path_nodes', {
        goalId: goalId,
        userLevel: 'beginner',
        preferences: { 
          learningStyle: 'project-based', 
          pace: 'normal' 
        }
      })
      
      addOutput(`✅ 生成了 ${nodes.length} 个学习节点:`)
      nodes.slice(0, 3).forEach((node: any, index: number) => {
        addOutput(`   ${index + 1}. ${node.title} (${node.estimatedHours}小时, 难度${node.difficulty})`)
      })
      
      // 创建学习路径
      const path = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: goalId,
        title: '前端开发学习路径',
        description: '个性化的前端开发学习计划',
        nodes: nodes,
        dependencies: [],
        milestones: [
          {
            id: 'milestone_1',
            title: '基础完成',
            nodeIds: nodes.slice(0, 2).map((n: any) => n.id)
          }
        ]
      })
      
      addOutput(`\n✅ 创建学习路径成功:`)
      addOutput(`   路径ID: ${path.id}`)
      addOutput(`   总预计时间: ${path.totalEstimatedHours} 小时`)
      addOutput(`   节点数量: ${path.nodes.length}`)
      
    } catch (error) {
      addOutput(`❌ 生成路径失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示智能分析
  const demoAnalysis = async () => {
    setLoading(true)
    addOutput('=== 智能分析演示 ===')
    
    try {
      // 分析用户能力
      const abilityAnalysis = await agentToolExecutor.executeTool('analyze_user_ability', {})
      addOutput(`📊 能力分析结果:`)
      if (abilityAnalysis.hasAbilityData) {
        addOutput(`   总体水平: ${abilityAnalysis.overallScore}/10`)
        addOutput(`   优势: ${abilityAnalysis.strengths.join(', ')}`)
        addOutput(`   待提升: ${abilityAnalysis.weaknesses.join(', ')}`)
      } else {
        addOutput(`   ${abilityAnalysis.recommendation}`)
      }
      
      // 获取下一步建议
      const nextAction = await agentToolExecutor.executeTool('suggest_next_action', {})
      addOutput(`\n🎯 下一步建议:`)
      nextAction.suggestions?.forEach((suggestion: string, index: number) => {
        addOutput(`   ${index + 1}. ${suggestion}`)
      })
      
      // 跟踪学习进度
      const progress = await agentToolExecutor.executeTool('track_learning_progress', {})
      addOutput(`\n📈 学习进度:`)
      addOutput(`   总体进度: ${Math.round(progress.overallProgress || 0)}%`)
      addOutput(`   活跃路径: ${progress.activePaths} 个`)
      addOutput(`   总路径: ${progress.totalPaths} 个`)
      
    } catch (error) {
      addOutput(`❌ 分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示个性化功能
  const demoPersonalization = async () => {
    setLoading(true)
    addOutput('=== 个性化功能演示 ===')
    
    try {
      // 生成个性化内容
      const personalizedContent = await agentToolExecutor.executeTool('generate_personalized_content', {
        nodeId: 'demo_node',
        learningStyle: 'visual',
        difficulty: 3
      })
      
      addOutput(`🎨 个性化内容建议 (视觉学习风格):`)
      personalizedContent.contentSuggestions.recommendations.forEach((rec: string, index: number) => {
        addOutput(`   ${index + 1}. ${rec}`)
      })
      
      // 推荐学习计划
      const goalId = demoGoalId || getLearningGoals().find((g: LearningGoal) => g.status === 'active')?.id
      const schedule = await agentToolExecutor.executeTool('recommend_study_schedule', {
        availableHoursPerWeek: 10,
        preferredStudyTimes: ['evening', 'weekend'],
        goalId: goalId || 'demo_goal'
      })
      
      addOutput(`\n📅 学习计划建议 (每周10小时):`)
      addOutput(`   预计完成时间: ${schedule.estimatedCompletionWeeks} 周`)
      addOutput(`   每日建议: ${schedule.dailyRecommendation} 小时`)
      schedule.schedule.slice(0, 3).forEach((day: any) => {
        addOutput(`   ${day.day}: ${day.duration}小时 - ${day.type}`)
      })
      
      // 处理学习困难
      const difficultyHelp = await agentToolExecutor.executeTool('handle_learning_difficulty', {
        nodeId: 'demo_node',
        difficulty: '不理解JavaScript闭包概念',
        preferredSolution: 'example'
      })
      
      addOutput(`\n🆘 学习困难解决方案:`)
      addOutput(`   问题: 不理解JavaScript闭包概念`)
      addOutput(`   解决方案类型: 示例说明`)
      difficultyHelp.solution.suggestions.forEach((suggestion: string, index: number) => {
        addOutput(`   ${index + 1}. ${suggestion}`)
      })
      
    } catch (error) {
      addOutput(`❌ 个性化功能演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示系统状态
  const demoSystemStatus = async () => {
    setLoading(true)
    addOutput('=== 系统状态演示 ===')
    
    try {
      const status = await learningSystemService.getSystemStatus()
      
      addOutput(`🔍 系统当前状态:`)
      addOutput(`   当前阶段: ${status.currentPhase}`)
      addOutput(`   设置完成: ${status.setupComplete ? '是' : '否'}`)
      addOutput(`   能力档案: ${status.progress.hasAbilityProfile ? '已完成' : '未完成'}`)
      addOutput(`   活跃目标: ${status.progress.activeGoals} 个`)
      addOutput(`   活跃路径: ${status.progress.activePaths} 个`)
      addOutput(`   总体进度: ${Math.round(status.progress.overallProgress)}%`)
      
      addOutput(`\n📋 系统推荐:`)
      status.recommendations.forEach((rec: string, index: number) => {
        addOutput(`   ${index + 1}. ${rec}`)
      })
      
      addOutput(`\n⭐ 下一步行动:`)
      status.nextActions.forEach((action: string, index: number) => {
        addOutput(`   ${index + 1}. ${action}`)
      })
      
    } catch (error) {
      addOutput(`❌ 获取系统状态失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示完整学习流程
  const demoCompleteLearningFlow = async () => {
    setLoading(true)
    addOutput('=== 完整学习流程演示 ===')
    
    try {
      // 1. 检查能力评估
      const assessment = getCurrentAssessment()
      if (assessment) {
        addOutput(`✅ 第1步: 能力评估已完成 (总分: ${assessment.overallScore}/100)`)
      } else {
        addOutput(`⚠️ 第1步: 能力评估缺失`)
        addOutput(`   建议: 前往能力评估模块完成评估`)
      }
      
      // 2. 创建或验证学习目标
      let goalId = demoGoalId
      if (!goalId) {
        const goals = getLearningGoals()
        const activeGoal = goals.find((g: LearningGoal) => g.status === 'active')
        
        if (!activeGoal) {
          addOutput(`\n📝 第2步: 创建学习目标`)
          const goal = await agentToolExecutor.executeTool('create_learning_goal', {
            title: '全栈开发之路',
            description: '基于能力评估的个性化全栈开发学习',
            category: 'fullstack',
            priority: 5,
            targetLevel: 'intermediate',
            estimatedTimeWeeks: 16,
            requiredSkills: assessment ? 
              Object.keys(assessment.dimensions).slice(0, 5) : 
              ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Database'],
            outcomes: ['构建完整的Web应用', '掌握前后端开发']
          })
          goalId = goal.id
          setDemoGoalId(goalId)
          addOutput(`✅ 创建目标成功: ${goal.title}`)
        } else {
          goalId = activeGoal.id
          addOutput(`✅ 第2步: 使用现有目标 "${activeGoal.title}"`)
        }
      } else {
        addOutput(`✅ 第2步: 目标已设定`)
      }
      
      // 3. 生成学习路径
      addOutput(`\n🛤️ 第3步: 生成个性化学习路径`)
      const userLevel = assessment ? 
        (assessment.overallScore >= 70 ? 'intermediate' : 
         assessment.overallScore >= 40 ? 'beginner' : 'novice') : 'beginner'
      
      const nodes = await agentToolExecutor.executeTool('generate_path_nodes', {
        goalId: goalId,
        userLevel: userLevel,
        preferences: { 
          learningStyle: 'project-based', 
          pace: 'normal',
          includeProjects: true
        }
      })
      
      const path = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: goalId,
        title: '个性化学习路径',
        description: `基于${userLevel}水平的定制化学习计划`,
        nodes: nodes,
        dependencies: [],
        milestones: [
          {
            id: 'milestone_foundation',
            title: '基础技能掌握',
            nodeIds: nodes.slice(0, Math.ceil(nodes.length / 3)).map((n: any) => n.id)
          },
          {
            id: 'milestone_advanced', 
            title: '进阶技能掌握',
            nodeIds: nodes.slice(Math.ceil(nodes.length / 3), Math.ceil(nodes.length * 2 / 3)).map((n: any) => n.id)
          }
        ]
      })
      
      addOutput(`✅ 路径生成成功: ${path.nodes.length} 个学习节点`)
      addOutput(`   预计总时间: ${path.totalEstimatedHours} 小时`)
      addOutput(`   用户水平: ${userLevel}`)
      
      // 4. 生成课程内容
      addOutput(`\n📚 第4步: 生成课程内容`)
      const unit = await agentToolExecutor.executeTool('create_course_unit', {
        nodeId: nodes[0].id,
        title: `${nodes[0].title} - 入门指南`,
        description: `${nodes[0].title}的详细学习内容`,
        type: 'theory',
        content: {
          markdown: `# ${nodes[0].title}\n\n这是一个基于您能力评估结果定制的学习内容...\n\n## 学习目标\n- 掌握基础概念\n- 完成实践练习\n\n## 内容大纲\n1. 理论基础\n2. 实例演示\n3. 练习题目`,
          code: {
            language: 'javascript',
            source: `// ${nodes[0].title} 示例代码\nconsole.log('开始学习 ${nodes[0].title}!');`
          }
        },
        metadata: {
          difficulty: nodes[0].difficulty,
          estimatedTime: nodes[0].estimatedHours * 60,
          keywords: ['基础', '入门', nodes[0].title],
          learningObjectives: [`理解${nodes[0].title}概念`, '完成基础练习']
        }
      })
      
      addOutput(`✅ 课程内容生成成功: ${unit.title}`)
      
      // 5. 获取学习建议
      addOutput(`\n🎯 第5步: 获取智能学习建议`)
      const nextAction = await agentToolExecutor.executeTool('suggest_next_action', {})
      addOutput(`📋 学习建议:`)
      nextAction.suggestions?.forEach((suggestion: string, index: number) => {
        addOutput(`   ${index + 1}. ${suggestion}`)
      })
      
      // 6. 显示系统状态
      const status = await learningSystemService.getSystemStatus()
      addOutput(`\n📊 系统状态总结:`)
      addOutput(`   当前阶段: ${status.currentPhase}`)
      addOutput(`   设置完成度: ${status.setupComplete ? '100%' : '进行中'}`)
      addOutput(`   活跃目标: ${status.progress.activeGoals} 个`)
      addOutput(`   活跃路径: ${status.progress.activePaths} 个`)
      addOutput(`   总体进度: ${Math.round(status.progress.overallProgress)}%`)
      
      addOutput(`\n🎉 完整学习流程演示完成！`)
      addOutput(`💡 您现在可以开始使用AI智能对话进行学习了。`)
      
    } catch (error) {
      addOutput(`❌ 完整流程演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h1>🤖 AI Agent学习系统演示</h1>
      
      {/* AI聊天界面 */}
      {showChat && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '800px',
            height: '90%',
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #eee',
              paddingBottom: '10px'
            }}>
              <h2 style={{ margin: 0 }}>🤖 AI智能学习助手</h2>
              <button 
                onClick={clearChat}
                style={{
                  padding: '5px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>
            
            {/* 消息区域 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {chatMessages.map((message) => (
                <div key={message.id} style={{
                  marginBottom: '15px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: message.type === 'user' ? '#007bff' : 
                                  message.type === 'system' ? '#ff9800' : '#e9ecef',
                  color: message.type === 'user' ? 'white' : 'black',
                  maxWidth: '80%',
                  marginLeft: message.type === 'user' ? 'auto' : '0',
                  marginRight: message.type === 'user' ? '0' : 'auto'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                  
                  {message.toolsUsed && message.toolsUsed.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      opacity: 0.7,
                      borderTop: '1px solid rgba(255,255,255,0.2)',
                      paddingTop: '5px'
                    }}>
                      🔧 使用工具: {message.toolsUsed.join(', ')}
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            margin: '2px',
                            padding: '5px 10px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'inherit',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.5,
                    marginTop: '5px'
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '10px',
                  maxWidth: '80%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid #ccc',
                      borderTop: '2px solid #007bff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '10px'
                    }}></div>
                    AI正在思考...
                  </div>
                </div>
              )}
            </div>
            
            {/* 输入区域 */}
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="输入您的问题或需求..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: chatLoading ? 'not-allowed' : 'pointer',
                  opacity: chatLoading ? 0.6 : 1
                }}
              >
                发送
              </button>
            </div>
            
            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              💡 试试问我: "我想学前端开发"、"分析我的能力水平"、"制定学习计划"等
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        marginBottom: '20px' 
      }}>
        <button 
          onClick={startAIChat}
          disabled={loading}
          style={{
            padding: '12px 18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          🤖 AI智能对话 (真实LLM)
        </button>
        
        <button 
          onClick={demoChat}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          💬 AI对话演示
        </button>
        
        <button 
          onClick={demoCreateGoal}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🎯 创建目标
        </button>
        
        <button 
          onClick={demoGeneratePath}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🛤️ 生成路径
        </button>
        
        <button 
          onClick={demoAnalysis}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📊 智能分析
        </button>
        
        <button 
          onClick={demoPersonalization}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🎨 个性化功能
        </button>
        
        <button 
          onClick={demoSystemStatus}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔍 系统状态
        </button>
        
        <button 
          onClick={demoCompleteLearningFlow}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📚 完整学习流程
        </button>
        
        <button 
          onClick={demoAbilityIntegration}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📊 能力评估集成
        </button>
        
        <button 
          onClick={clearOutput}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🗑️ 清空输出
        </button>
      </div>
      
      {loading && (
        <div style={{ 
          padding: '10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          ⏳ 正在执行演示...
        </div>
      )}
      
      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#00ff00',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '400px',
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        {output || '点击上方按钮开始演示...'}
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h3>📘 演示说明:</h3>
        <ul>
          <li><strong>🤖 AI智能对话 (真实LLM)</strong>: ⭐ 使用真实大语言模型的完整对话体验</li>
          <li><strong>AI对话演示</strong>: 展示自然语言交互和意图识别</li>
          <li><strong>创建目标</strong>: 演示学习目标的创建和管理</li>
          <li><strong>生成路径</strong>: 展示智能学习路径生成功能</li>
          <li><strong>智能分析</strong>: 演示能力分析、进度跟踪等功能</li>
          <li><strong>个性化功能</strong>: 展示个性化内容推荐和学习计划</li>
          <li><strong>系统状态</strong>: 查看当前系统状态和推荐</li>
          <li><strong>完整学习流程</strong>: 演示完整的学习流程</li>
          <li><strong>能力评估集成</strong>: 演示能力评估系统的集成</li>
        </ul>
        <div style={{ 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          border: '1px solid #ffeaa7'
        }}>
          <strong>🔥 新功能：AI智能对话 (真实LLM)</strong><br/>
          • 使用你配置的真实AI模型（OpenAI、Claude、通义千问）<br/>
          • 完整的聊天界面，支持上下文对话<br/>
          • 智能建议和快速操作<br/>
          • 需要在Profile设置中配置API Key
        </div>
        <p><em>注意: 除了"AI智能对话(真实LLM)"外，其他功能可能返回模拟数据。</em></p>
      </div>
      
      {/* CSS动画 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default AgentDemo 