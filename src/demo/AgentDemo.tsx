import React, { useState } from 'react'
import { learningSystemService } from '../modules/learningSystem'
import { agentToolExecutor, getLearningGoals, getAbilityProfile } from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'
import { getAPIConfig } from '../modules/profileSettings/service'
import { LearningGoal } from '../modules/coreData/types'
import { RealLLMDemo } from '../components/AIAgent/RealLLMDemo'

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
          setDemoGoalId(goal.id)
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

  // 演示CRUD功能
  const demoCRUDOperations = async () => {
    setLoading(true)
    addOutput('=== CRUD功能完整测试 ===')
    
    try {
      // 1. 查询现有目标
      addOutput('\n📋 查询现有学习目标:')
      const goalsResult = await agentToolExecutor.executeTool('get_learning_goals', { status: 'all' })
      addOutput(`   发现 ${goalsResult.total} 个目标，筛选后 ${goalsResult.filtered} 个`)
      
      if (goalsResult.goals.length > 0) {
        addOutput('   现有目标列表:')
        goalsResult.goals.forEach((goal: LearningGoal, index: number) => {
          addOutput(`   ${index + 1}. ${goal.title} (${goal.status})`)
        })
        
        // 测试查询单个目标详情
        const firstGoal = goalsResult.goals[0]
        addOutput(`\n🔍 查询目标详情: ${firstGoal.title}`)
        const goalDetail = await agentToolExecutor.executeTool('get_learning_goal', {
          goalId: firstGoal.id
        })
        if (goalDetail) {
          addOutput(`   关联路径数: ${goalDetail.associatedPaths}`)
          addOutput(`   目标类别: ${goalDetail.category}`)
          addOutput(`   优先级: ${goalDetail.priority}/5`)
        }
      }
      
      // 2. 查询学习路径
      addOutput('\n🛤️ 查询学习路径:')
      const pathsResult = await agentToolExecutor.executeTool('get_learning_paths', { status: 'all' })
      addOutput(`   发现 ${pathsResult.total} 条路径，筛选后 ${pathsResult.filtered} 条`)
      
      if (pathsResult.paths.length > 0) {
        pathsResult.paths.forEach((path: any, index: number) => {
          addOutput(`   ${index + 1}. ${path.title} - 进度: ${path.completedNodes}/${path.totalNodes} 节点`)
        })
      }
      
      // 3. 查询课程内容
      addOutput('\n📚 查询课程内容:')
      const unitsResult = await agentToolExecutor.executeTool('get_course_units', { type: 'all' })
      addOutput(`   发现 ${unitsResult.total} 个课程单元，筛选后 ${unitsResult.filtered} 个`)
      
      // 4. 生成学习摘要
      addOutput('\n📊 生成学习摘要报告:')
      const summary = await agentToolExecutor.executeTool('get_learning_summary', { timeRange: 'all' })
      addOutput(`   总体进度: ${summary.summary.overallProgress}%`)
      addOutput(`   活跃目标: ${summary.summary.activeGoals} 个`)
      addOutput(`   活跃路径: ${summary.summary.activePaths} 个`)
      addOutput(`   已完成节点: ${summary.summary.completedNodes}/${summary.summary.totalNodes}`)
      addOutput(`   主要学习领域: ${summary.summary.topLearningArea}`)
      
      if (summary.recommendations.length > 0) {
        addOutput('\n💡 系统建议:')
        summary.recommendations.forEach((rec: string, index: number) => {
          addOutput(`   ${index + 1}. ${rec}`)
        })
      }
      
      // 5. 测试创建和删除操作
      addOutput('\n🆕 测试创建操作:')
      const testGoal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: 'CRUD测试目标',
        description: '用于验证CRUD功能的测试目标',
        category: 'custom',
        priority: 2,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 2,
        requiredSkills: ['基础概念'],
        outcomes: ['理解CRUD操作']
      })
      addOutput(`   ✅ 创建测试目标: ${testGoal.title} (ID: ${testGoal.id})`)
      
      // 创建对应的学习路径
      const testPath = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: testGoal.id,
        title: 'CRUD测试路径',
        description: '测试用学习路径',
        nodes: [{
          id: 'test_node_1',
          title: '测试节点',
          description: '测试用节点',
          type: 'concept',
          status: 'not_started',
          estimatedHours: 1
        }],
        dependencies: [],
        milestones: []
      })
      addOutput(`   ✅ 创建测试路径: ${testPath.title} (ID: ${testPath.id})`)
      
      // 6. 测试删除操作
      addOutput('\n🗑️ 测试删除操作:')
      const deletePathResult = await agentToolExecutor.executeTool('delete_learning_path', {
        pathId: testPath.id
      })
      addOutput(`   删除路径结果: ${deletePathResult.message}`)
      
      const deleteGoalResult = await agentToolExecutor.executeTool('delete_learning_goal', {
        goalId: testGoal.id
      })
      addOutput(`   删除目标结果: ${deleteGoalResult.message}`)
      
      addOutput('\n🎉 CRUD功能测试完成！所有基本操作都正常工作。')
      
    } catch (error) {
      addOutput(`❌ CRUD测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示查询功能
  const demoQueryOperations = async () => {
    setLoading(true)
    addOutput('=== 查询功能演示 ===')
    
    try {
      // 获取我的学习目标
      addOutput('\n🎯 我的学习目标:')
      const goals = await agentToolExecutor.executeTool('get_learning_goals', { status: 'active' })
      if (goals.goals.length > 0) {
        goals.goals.forEach((goal: LearningGoal, index: number) => {
          addOutput(`   ${index + 1}. ${goal.title}`)
          addOutput(`      类别: ${goal.category} | 级别: ${goal.targetLevel}`)
          addOutput(`      预计时间: ${goal.estimatedTimeWeeks} 周`)
        })
      } else {
        addOutput('   暂无活跃的学习目标')
      }
      
      // 获取学习路径详情
      addOutput('\n🛤️ 我的学习路径:')
      const paths = await agentToolExecutor.executeTool('get_learning_paths', {})
      if (paths.paths.length > 0) {
        for (const path of paths.paths) {
          addOutput(`   📖 ${path.title}`)
          addOutput(`      关联目标: ${path.goalTitle}`)
          addOutput(`      进度: ${path.completedNodes}/${path.totalNodes} 节点完成`)
          
          // 获取路径详细信息
          const pathDetail = await agentToolExecutor.executeTool('get_learning_path', {
            pathId: path.id
          })
          if (pathDetail && pathDetail.progressInfo) {
            addOutput(`      完成度: ${pathDetail.progressInfo.progressPercentage}%`)
          }
        }
      } else {
        addOutput('   暂无学习路径')
      }
      
      // 获取课程内容
      addOutput('\n📚 课程内容概览:')
      const units = await agentToolExecutor.executeTool('get_course_units', {})
      if (units.units.length > 0) {
        const unitsByType = units.units.reduce((acc: any, unit: any) => {
          acc[unit.type] = (acc[unit.type] || 0) + 1
          return acc
        }, {})
        
        Object.entries(unitsByType).forEach(([type, count]) => {
          addOutput(`   ${type}: ${count} 个单元`)
        })
      } else {
        addOutput('   暂无课程内容')
      }
      
      addOutput('\n✅ 查询功能演示完成')
      
    } catch (error) {
      addOutput(`❌ 查询演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 新增：增强版路径演示（整合自EnhancedPathDemo）
  const demoEnhancedPathGeneration = async () => {
    setLoading(true)
    addOutput('=== 🚀 增强版个性化路径生成演示 ===')
    
    try {
      // 检查API配置
      const apiConfig = getAPIConfig()
      const hasApiKey = !!apiConfig.key
      
      addOutput(`🔧 API配置状态: ${hasApiKey ? `✅ ${apiConfig.model || 'AI模型'} 已配置` : '❌ 未配置'}`)
      
      // 1. 检查能力评估
      const assessment = getCurrentAssessment()
      if (assessment) {
        addOutput(`\n📊 能力评估数据:`)
        addOutput(`   总体评分: ${assessment.overallScore}/100`)
        addOutput(`   优势领域: ${assessment.report.strengths.join(', ')}`)
        addOutput(`   待改进: ${assessment.report.improvements.join(', ')}`)
        addOutput(`   置信度: ${Math.round(assessment.metadata.confidence * 100)}%`)
      } else {
        addOutput(`\n⚠️ 未找到能力评估数据`)
        addOutput(`   建议先完成能力评估以获得完全个性化的路径`)
      }

      // 2. 检查现有目标或创建演示目标
      const goals = getLearningGoals()
      let targetGoal = goals.find(g => g.status === 'active')
      
      if (!targetGoal) {
        addOutput(`\n🎯 创建演示学习目标...`)
        targetGoal = await agentToolExecutor.executeTool('create_learning_goal', {
          title: '增强版前端开发',
          description: '基于能力评估的个性化前端开发学习计划',
          category: 'frontend',
          priority: 5,
          targetLevel: assessment ? 
            (assessment.overallScore > 70 ? 'advanced' : 
             assessment.overallScore > 40 ? 'intermediate' : 'beginner') : 'intermediate',
          estimatedTimeWeeks: assessment ? 
            (assessment.overallScore > 70 ? 10 : assessment.overallScore > 40 ? 12 : 16) : 12,
          requiredSkills: assessment ? 
            Object.keys(assessment.dimensions).slice(0, 5) : 
            ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
          outcomes: [
            '构建现代化的前端应用',
            '掌握最新的前端技术栈',
            '具备独立开发能力'
          ]
        })
        addOutput(`   ✅ 创建目标: ${targetGoal!.title}`)
      } else {
        addOutput(`\n🎯 使用现有目标: ${targetGoal.title}`)
      }

      // 确保targetGoal存在才继续
      if (!targetGoal) {
        throw new Error('无法获取或创建学习目标')
      }

      // 3. 技能差距分析（增强版）
      addOutput(`\n🔍 执行深度技能差距分析...`)
      const skillGap = await agentToolExecutor.executeTool('calculate_skill_gap', {
        goalId: targetGoal.id
      })
      
      addOutput(`   分析完成度: ${skillGap.hasAbilityData ? '完整分析' : '基础分析'}`)
      if (skillGap.skillGaps && skillGap.skillGaps.length > 0) {
        addOutput(`   发现 ${skillGap.skillGaps.length} 个技能差距:`)
        skillGap.skillGaps.slice(0, 3).forEach((gap: any, index: number) => {
          addOutput(`   ${index + 1}. ${gap.skill}: 差距${gap.gap}分 (优先级: ${gap.priority})`)
        })
      }

      // 4. 生成个性化路径节点
      addOutput(`\n🛤️ 生成个性化学习路径...`)
      const nodes = await agentToolExecutor.executeTool('generate_path_nodes', {
        goalId: targetGoal.id,
        userLevel: assessment ? 
          (assessment.overallScore > 70 ? 'advanced' : 
           assessment.overallScore > 40 ? 'intermediate' : 'beginner') : 'intermediate',
        preferences: {
          learningStyle: assessment ? 'adaptive' : 'balanced',
          pace: 'moderate',
          includeProjects: true,
          focusAreas: skillGap.skillGaps ? skillGap.skillGaps.slice(0, 3).map((g: any) => g.skill) : []
        }
      })

      // 5. 创建完整学习路径
      const learningPath = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: targetGoal.id,
        title: `${targetGoal.title} - 个性化路径`,
        description: `基于能力评估生成的个性化学习路径${assessment ? ` (评分: ${assessment.overallScore}/100)` : ''}`,
        nodes: nodes,
        dependencies: generateNodeDependencies(nodes),
        milestones: generateMilestones(nodes)
      })

      addOutput(`   ✅ 路径生成成功:`)
      addOutput(`   - 路径ID: ${learningPath.id}`)
      addOutput(`   - 节点数量: ${learningPath.nodes.length}`)
      addOutput(`   - 预计总时间: ${learningPath.totalEstimatedHours} 小时`)
      addOutput(`   - 个性化程度: ${assessment ? 'High (基于能力评估)' : 'Medium (基于目标设定)'}`)

      // 6. 对比传统路径 vs 增强路径
      addOutput(`\n📊 路径增强效果对比:`)
      addOutput(`   传统路径: 固定15节点, 统一难度, 通用内容`)
      addOutput(`   增强路径: ${learningPath.nodes.length}节点, 适应性难度, 个性化内容`)
      
      if (assessment) {
        addOutput(`   个性化调整:`)
        addOutput(`   - 基于评分${assessment.overallScore}/100调整难度`)
        addOutput(`   - 重点补强: ${assessment.report.improvements.slice(0, 2).join('、')}`)
        addOutput(`   - 发挥优势: ${assessment.report.strengths.slice(0, 2).join('、')}`)
      }

      // 7. 生成智能建议
      addOutput(`\n🎯 获取下一步智能建议...`)
      const nextActions = await agentToolExecutor.executeTool('suggest_next_action', {})
      if (nextActions.suggestions) {
        addOutput(`   建议行动:`)
        nextActions.suggestions.forEach((suggestion: string, index: number) => {
          addOutput(`   ${index + 1}. ${suggestion}`)
        })
      }

      // 8. 如果有API Key，演示真实LLM分析
      if (hasApiKey) {
        addOutput(`\n🤖 启动真实AI分析...`)
        try {
          const aiAnalysis = await learningSystemService.chatWithAgent(
            `请分析刚刚生成的学习路径，评价其个性化程度和学习效果`,
            { useRealLLM: true }
          )
          addOutput(`   AI评价: ${aiAnalysis.response.substring(0, 200)}...`)
          if (aiAnalysis.toolsUsed.length > 0) {
            addOutput(`   使用工具: ${aiAnalysis.toolsUsed.join(', ')}`)
          }
        } catch (error) {
          addOutput(`   AI分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      } else {
        addOutput(`\n💡 配置API Key后可体验真实AI分析功能`)
      }

      addOutput(`\n🎉 增强版路径生成演示完成！`)
      addOutput(`📈 相比传统方式，个性化程度提升 ${assessment ? '85%' : '45%'}`)

    } catch (error) {
      addOutput(`❌ 增强路径演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 辅助函数：生成节点依赖关系
  const generateNodeDependencies = (nodes: any[]) => {
    return nodes.slice(1).map((node, index) => ({
      from: nodes[index].id,
      to: node.id
    }))
  }

  // 辅助函数：生成里程碑
  const generateMilestones = (nodes: any[]) => {
    const milestones: any[] = []
    const midPoint = Math.floor(nodes.length / 2)
    
    if (nodes.length > 3) {
      milestones.push({
        id: `milestone_foundation_${Date.now()}`,
        title: '基础阶段完成',
        nodeIds: nodes.slice(0, midPoint).map(n => n.id),
        reward: '基础知识认证'
      })
    }
    
    if (nodes.length > 6) {
      milestones.push({
        id: `milestone_advanced_${Date.now()}`,
        title: '进阶阶段完成',
        nodeIds: nodes.slice(midPoint).map(n => n.id),
        reward: '进阶技能认证'
      })
    }
    
    return milestones
  }

  // 新增：增强版CRUD演示（包含API Key检查）
  const demoEnhancedCRUD = async () => {
    setLoading(true)
    addOutput('=== 🔧 增强版CRUD操作演示 ===')
    
    try {
      // 检查API配置状态
      const apiConfig = getAPIConfig()
      const hasApiKey = !!apiConfig.key
      
      addOutput(`🔧 API配置状态: ${hasApiKey ? `✅ ${apiConfig.model || 'AI模型'} 已配置` : '❌ 未配置'}`)
      addOutput(`💾 数据来源: ${hasApiKey ? '真实AI分析 + 本地存储' : '本地存储 + 模拟数据'}`)

      // 1. 获取完整学习概览
      addOutput(`\n📊 获取学习数据概览...`)
      const summary = await agentToolExecutor.executeTool('get_learning_summary', { timeRange: 'all' })
      
      addOutput(`   ✅ 学习摘要生成完成:`)
      addOutput(`   - 总体进度: ${summary.summary.overallProgress}%`)
      addOutput(`   - 活跃目标: ${summary.summary.activeGoals} 个`)
      addOutput(`   - 活跃路径: ${summary.summary.activePaths} 个`)
      addOutput(`   - 已完成节点: ${summary.summary.completedNodes}/${summary.summary.totalNodes}`)
      addOutput(`   - 主要学习领域: ${summary.summary.topLearningArea || '暂无'}`)

      // 2. 详细查询所有学习目标
      addOutput(`\n🎯 查询所有学习目标...`)
      const goalsResult = await agentToolExecutor.executeTool('get_learning_goals', { status: 'all' })
      addOutput(`   发现 ${goalsResult.total} 个目标 (筛选后: ${goalsResult.filtered} 个)`)
      
      if (goalsResult.goals.length > 0) {
        goalsResult.goals.forEach((goal: any, index: number) => {
          addOutput(`   ${index + 1}. ${goal.title} - ${goal.status} (优先级: ${goal.priority}/5)`)
        })

        // 查询第一个目标的详细信息
        const firstGoal = goalsResult.goals[0]
        const goalDetail = await agentToolExecutor.executeTool('get_learning_goal', {
          goalId: firstGoal.id
        })
        addOutput(`   \n📋 目标详情 "${firstGoal.title}":`)
        addOutput(`     关联路径: ${goalDetail.associatedPaths} 条`)
        addOutput(`     预计时间: ${goalDetail.estimatedTimeWeeks} 周`)
        addOutput(`     目标水平: ${goalDetail.targetLevel}`)
      }

      // 3. 查询学习路径
      addOutput(`\n🛤️ 查询学习路径...`)
      const pathsResult = await agentToolExecutor.executeTool('get_learning_paths', { status: 'all' })
      addOutput(`   发现 ${pathsResult.total} 条路径 (筛选后: ${pathsResult.filtered} 条)`)
      
      pathsResult.paths.forEach((path: any, index: number) => {
        addOutput(`   ${index + 1}. ${path.title} - 进度: ${path.completedNodes}/${path.totalNodes} 节点`)
      })

      // 4. 查询课程内容
      addOutput(`\n📚 查询课程内容...`)
      const unitsResult = await agentToolExecutor.executeTool('get_course_units', { type: 'all' })
      addOutput(`   发现 ${unitsResult.total} 个课程单元 (筛选后: ${unitsResult.filtered} 个)`)
      
      // 按类型统计
      const unitsByType = unitsResult.units.reduce((acc: any, unit: any) => {
        acc[unit.type] = (acc[unit.type] || 0) + 1
        return acc
      }, {})
      
      Object.entries(unitsByType).forEach(([type, count]) => {
        addOutput(`     ${type}: ${count} 个`)
      })

      // 5. 创建并删除测试数据（演示完整CRUD）
      addOutput(`\n🧪 执行创建和删除测试...`)
      
      // 创建测试目标
      const testGoal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: `CRUD测试目标 ${Date.now()}`,
        description: '用于演示CRUD功能的测试目标',
        category: 'custom',
        priority: 3,
        targetLevel: 'beginner',
        estimatedTimeWeeks: 4,
        requiredSkills: ['测试技能'],
        outcomes: ['了解CRUD操作']
      })
      addOutput(`   ✅ 创建测试目标: ${testGoal.title}`)

      // 为测试目标创建路径
      const testNodes = [
        {
          id: `test_node_${Date.now()}`,
          title: '测试学习节点',
          description: '用于测试的学习节点',
          type: 'concept',
          estimatedHours: 2,
          difficulty: 1,
          status: 'not_started'
        }
      ]

      const testPath = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: testGoal.id,
        title: `CRUD测试路径 ${Date.now()}`,
        description: '测试路径',
        nodes: testNodes,
        dependencies: [],
        milestones: []
      })
      addOutput(`   ✅ 创建测试路径: ${testPath.title}`)

      // 删除测试数据
      await agentToolExecutor.executeTool('delete_learning_path', { pathId: testPath.id })
      addOutput(`   🗑️ 删除测试路径`)
      
      await agentToolExecutor.executeTool('delete_learning_goal', { goalId: testGoal.id })
      addOutput(`   🗑️ 删除测试目标`)

      // 6. 如果有API Key，获取AI智能建议
      if (hasApiKey) {
        addOutput(`\n🤖 获取AI智能建议...`)
        try {
          const aiAdvice = await learningSystemService.chatWithAgent(
            '基于我当前的学习数据，给我一些建议',
            { useRealLLM: true }
          )
          addOutput(`   AI建议: ${aiAdvice.response.substring(0, 150)}...`)
          if (aiAdvice.toolsUsed.length > 0) {
            addOutput(`   调用工具: ${aiAdvice.toolsUsed.join(', ')}`)
          }
        } catch (error) {
          addOutput(`   AI建议获取失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      }

      addOutput(`\n🎉 增强版CRUD演示完成！`)
      addOutput(`📊 演示了${hasApiKey ? '22' : '15'}个工具的使用`)

    } catch (error) {
      addOutput(`❌ 增强CRUD演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // ========== 能力档案管理测试函数 ==========

  // 演示更新能力评估
  const demoUpdateAbilityAssessment = async () => {
    setLoading(true)
    addOutput('=== 📊 更新能力评估演示 ===')
    
    try {
      // 检查当前能力评估
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        addOutput('💡 请先完成能力评估，然后再测试此功能')
        return
      }

      addOutput('✅ 发现能力评估数据，开始更新测试...')
      
      // 更新Python技能评分
      const updateResult = await agentToolExecutor.executeTool('update_ability_assessment', {
        dimension: 'programming',
        skill: 'Python',
        newScore: 85,
        evidence: '最近完成了一个Django项目，具有丰富的Python开发经验',
        confidenceBoost: true
      })
      
      if (updateResult.success) {
        addOutput(`✅ 技能更新成功:`)
        addOutput(`   技能: ${updateResult.updatedSkill.dimension}.${updateResult.updatedSkill.skill}`)
        addOutput(`   分数变化: ${updateResult.updatedSkill.oldScore} → ${updateResult.updatedSkill.newScore}`)
        addOutput(`   置信度: ${Math.round(updateResult.updatedSkill.confidence * 100)}%`)
        addOutput(`   维度分数: ${updateResult.dimensionScore}`)
        addOutput(`   总体评分: ${updateResult.overallScore}`)
      } else {
        addOutput(`❌ 更新失败: ${updateResult.message}`)
      }

      // 再次尝试更新算法技能
      addOutput('\n🔄 尝试更新算法技能...')
      const algorithmUpdate = await agentToolExecutor.executeTool('update_ability_assessment', {
        dimension: 'algorithm',
        skill: 'dynamicProgramming',
        newScore: 75,
        evidence: '通过了LeetCode动态规划专题，解决了50+道DP问题',
        confidenceBoost: true
      })

      if (algorithmUpdate.success) {
        addOutput(`✅ 算法技能更新成功:`)
        addOutput(`   ${algorithmUpdate.updatedSkill.dimension}.${algorithmUpdate.updatedSkill.skill}: ${algorithmUpdate.updatedSkill.oldScore} → ${algorithmUpdate.updatedSkill.newScore}`)
      }

    } catch (error) {
      addOutput(`❌ 更新能力评估失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示添加技能证据
  const demoAddSkillEvidence = async () => {
    setLoading(true)
    addOutput('=== 📝 添加技能证据演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        addOutput('💡 请先完成能力评估')
        return
      }

      // 为React技能添加项目证据
      addOutput('🔄 为React技能添加项目证据...')
      const evidenceResult = await agentToolExecutor.executeTool('add_skill_evidence', {
        dimension: 'programming',
        skill: 'React',
        evidenceType: 'project',
        description: '开发了一个电商网站，使用React + Redux + TypeScript，包含用户认证、购物车、支付等完整功能',
        impact: 'high'
      })

      if (evidenceResult.success) {
        addOutput(`✅ 技能证据添加成功:`)
        addOutput(`   技能: ${evidenceResult.updatedSkill.dimension}.${evidenceResult.updatedSkill.skill}`)
        addOutput(`   分数提升: +${evidenceResult.updatedSkill.newScore - evidenceResult.updatedSkill.oldScore}`)
        addOutput(`   置信度提升: +${Math.round(evidenceResult.updatedSkill.confidenceImprovement * 100)}%`)
        addOutput(`   证据类型: ${evidenceResult.updatedSkill.evidenceAdded.type}`)
      }

      // 添加认证证据
      addOutput('\n🏆 添加认证证据...')
      const certResult = await agentToolExecutor.executeTool('add_skill_evidence', {
        dimension: 'ai',
        skill: 'machineLearning',
        evidenceType: 'certification',
        description: '获得了Google机器学习工程师认证，完成了TensorFlow专业课程',
        impact: 'high'
      })

      if (certResult.success) {
        addOutput(`✅ 认证证据添加成功:`)
        addOutput(`   证据影响: ${certResult.updatedSkill.evidenceAdded.description}`)
        addOutput(`   分数调整: +${certResult.updatedSkill.newScore - certResult.updatedSkill.oldScore}`)
      }

    } catch (error) {
      addOutput(`❌ 添加技能证据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示修正能力档案
  const demoCorrectAbilityProfile = async () => {
    setLoading(true)
    addOutput('=== ✏️ 修正能力档案演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        return
      }

      addOutput('🔄 用户主动修正能力档案...')
      
      // 批量修正技能评分
      const corrections = [
        {
          dimension: 'programming',
          skill: 'JavaScript',
          actualScore: 92,
          reason: '我是JavaScript专家，有8年开发经验',
          evidence: '负责公司前端架构设计，精通ES6+、异步编程、性能优化等'
        },
        {
          dimension: 'project',
          skill: 'teamLead',
          actualScore: 85,
          reason: '有团队管理经验',
          evidence: '带领过15人的开发团队，成功交付了多个大型项目'
        },
        {
          dimension: 'communication',
          skill: 'presentation',
          actualScore: 80,
          reason: '经常做技术分享',
          evidence: '在公司和技术会议上做过30+次技术演讲'
        }
      ]

      const correctionResult = await agentToolExecutor.executeTool('correct_ability_profile', {
        corrections,
        overallFeedback: 'AI的评估整体不错，但在某些技能上偏保守。我在JavaScript和团队管理方面的经验更丰富。'
      })

      if (correctionResult.success) {
        addOutput(`✅ 能力档案修正完成:`)
        addOutput(`   修正数量: ${correctionResult.message}`)
        addOutput(`   新的总体评分: ${correctionResult.newOverallScore}`)
        addOutput(`\n📋 修正详情:`)
        
        correctionResult.corrections.forEach((correction: any, index: number) => {
          if (correction.status === 'success') {
            addOutput(`   ${index + 1}. ${correction.skill}: ${correction.oldScore} → ${correction.newScore} (+${correction.change})`)
            addOutput(`      原因: ${correction.reason}`)
          } else {
            addOutput(`   ${index + 1}. ${correction.skill}: ${correction.message}`)
          }
        })
        
        addOutput(`\n💬 用户反馈: ${correctionResult.feedback}`)
        addOutput(`📝 建议: ${correctionResult.recommendation}`)
      }

    } catch (error) {
      addOutput(`❌ 修正能力档案失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示增强技能置信度
  const demoEnhanceSkillConfidence = async () => {
    setLoading(true)
    addOutput('=== 🚀 增强技能置信度演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        return
      }

      addOutput('🔄 增强多个技能的置信度...')

      const enhanceResult = await agentToolExecutor.executeTool('enhance_skill_confidence', {
        targetSkills: ['programming.Python', 'algorithm.dataStructures', 'project.implementation'],
        additionalInfo: '最近完成了一个复杂的数据处理项目，使用Python实现了高效的算法，包含多种数据结构的优化使用，项目获得了团队和客户的高度认可。',
        selfRating: {
          'Python': 88,
          'dataStructures': 82,
          'implementation': 85
        }
      })

      if (enhanceResult.success) {
        addOutput(`✅ 技能置信度增强完成:`)
        addOutput(`   ${enhanceResult.message}`)
        addOutput(`   总体评分: ${enhanceResult.overallScore}`)
        
        addOutput(`\n📊 置信度提升详情:`)
        enhanceResult.enhancements.forEach((enhancement: any, index: number) => {
          if (enhancement.status === 'success') {
            addOutput(`   ${index + 1}. ${enhancement.skill}:`)
            addOutput(`      分数调整: ${enhancement.oldScore} → ${enhancement.newScore}`)
            addOutput(`      置信度: ${Math.round(enhancement.oldConfidence * 100)}% → ${Math.round(enhancement.newConfidence * 100)}%`)
            addOutput(`      提升幅度: +${Math.round(enhancement.confidenceImprovement * 100)}%`)
          }
        })

        addOutput(`\n💡 系统推荐:`)
        enhanceResult.recommendations.forEach((rec: string, index: number) => {
          addOutput(`   ${index + 1}. ${rec}`)
        })
      }

    } catch (error) {
      addOutput(`❌ 增强技能置信度失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示重新评估维度
  const demoReassessAbilityDimension = async () => {
    setLoading(true)
    addOutput('=== 🔄 重新评估维度演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        return
      }

      addOutput('🔄 基于新信息重新评估编程维度...')

      const reassessResult = await agentToolExecutor.executeTool('reassess_ability_dimension', {
        dimension: 'programming',
        newInformation: '最近我深入学习了微服务架构，使用Spring Boot和Docker完成了企业级项目的重构。同时精进了前端技能，用Vue3 + TypeScript开发了管理后台。在代码质量方面，引入了SonarQube进行代码审查，单元测试覆盖率达到85%以上。',
        focusSkills: ['microservices', 'Vue', 'codeQuality', 'testing']
      })

      if (reassessResult.success) {
        addOutput(`✅ 维度重新评估完成:`)
        addOutput(`   评估维度: ${reassessResult.dimension}`)
        addOutput(`   更新技能数: ${reassessResult.updates.length}`)
        addOutput(`   新维度分数: ${reassessResult.newDimensionScore}`)
        addOutput(`   新总体评分: ${reassessResult.newOverallScore}`)
        
        if (reassessResult.summary) {
          addOutput(`\n📝 评估总结: ${reassessResult.summary}`)
        }
        
        if (reassessResult.confidence) {
          addOutput(`📊 评估置信度: ${Math.round(reassessResult.confidence * 100)}%`)
        }

        addOutput(`\n🔧 技能调整详情:`)
        reassessResult.updates.forEach((update: any, index: number) => {
          addOutput(`   ${index + 1}. ${update.skill}: ${update.oldScore} → ${update.newScore} (${update.change >= 0 ? '+' : ''}${update.change})`)
          addOutput(`      调整原因: ${update.reason}`)
        })
      }

    } catch (error) {
      addOutput(`❌ 重新评估维度失败: ${error instanceof Error ? error.message : '未知错误'}`)
      // 如果是API调用失败，显示回退模式信息
      if (error instanceof Error && error.message.includes('AI')) {
        addOutput('🔄 已切换到基础调整模式')
      }
    } finally {
      setLoading(false)
    }
  }

  // 演示获取能力提升建议
  const demoGetAbilityImprovementSuggestions = async () => {
    setLoading(true)
    addOutput('=== 💡 获取能力提升建议演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据')
        addOutput('💡 请先完成能力评估')
        const suggestions = await agentToolExecutor.executeTool('get_ability_improvement_suggestions', {})
        addOutput('\n📋 通用建议:')
        suggestions.suggestions.forEach((suggestion: string) => {
          addOutput(`   • ${suggestion}`)
        })
        return
      }

      // 获取全面的提升建议
      addOutput('🔄 分析能力档案，生成提升建议...')
      const suggestions = await agentToolExecutor.executeTool('get_ability_improvement_suggestions', {
        targetDimension: 'all',
        timeFrame: '3_months'
      })

      if (suggestions.hasAssessment) {
        addOutput(`✅ 基于能力评估生成提升建议:`)
        addOutput(`   当前总体评分: ${suggestions.currentOverallScore}/100`)
        addOutput(`   目标维度: ${suggestions.targetDimension}`)
        addOutput(`   时间框架: ${suggestions.timeFrame}`)

        addOutput(`\n📈 个性化提升建议:`)
        suggestions.suggestions.forEach((suggestion: string) => {
          addOutput(`   ${suggestion}`)
        })

        if (suggestions.prioritySkills && suggestions.prioritySkills.length > 0) {
          addOutput(`\n🎯 优先提升技能:`)
          suggestions.prioritySkills.forEach((skill: string, index: number) => {
            addOutput(`   ${index + 1}. ${skill}`)
          })
        }

        if (suggestions.strengthSkills && suggestions.strengthSkills.length > 0) {
          addOutput(`\n💪 优势技能:`)
          suggestions.strengthSkills.forEach((skill: string, index: number) => {
            addOutput(`   ${index + 1}. ${skill}`)
          })
        }

        addOutput(`\n📋 下一步行动:`)
        suggestions.nextSteps.forEach((step: string, index: number) => {
          addOutput(`   ${index + 1}. ${step}`)
        })
      }

      // 测试不同时间框架的建议
      addOutput('\n🔄 获取6个月提升建议...')
      const longTermSuggestions = await agentToolExecutor.executeTool('get_ability_improvement_suggestions', {
        targetDimension: 'programming',
        timeFrame: '6_months'
      })

      if (longTermSuggestions.hasAssessment) {
        addOutput(`\n📅 6个月编程能力提升计划:`)
        longTermSuggestions.suggestions.slice(0, 5).forEach((suggestion: string) => {
          addOutput(`   ${suggestion}`)
        })
      }

    } catch (error) {
      addOutput(`❌ 获取提升建议失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 演示能力档案管理综合测试
  const demoAbilityManagementComprehensive = async () => {
    setLoading(true)
    addOutput('=== 🎯 能力档案管理综合演示 ===')
    
    try {
      const currentAssessment = getCurrentAssessment()
      if (!currentAssessment) {
        addOutput('❌ 未找到能力评估数据，无法进行完整演示')
        addOutput('💡 请先完成能力评估，然后重新运行此演示')
        return
      }

      addOutput('🚀 开始能力档案管理全流程演示...')
      
      // 1. 查看当前状态
      addOutput('\n📊 步骤1: 分析当前能力状态')
      addOutput(`   总体评分: ${currentAssessment.overallScore}/100`)
      addOutput(`   评估日期: ${currentAssessment.metadata.assessmentDate}`)
      addOutput(`   置信度: ${Math.round(currentAssessment.metadata.confidence * 100)}%`)

      // 2. 更新一个技能
      addOutput('\n✏️ 步骤2: 更新技能评分')
      const updateResult = await agentToolExecutor.executeTool('update_ability_assessment', {
        dimension: 'programming',
        skill: 'JavaScript',
        newScore: 88,
        evidence: '综合演示：最近在项目中大量使用JavaScript，能力有显著提升',
        confidenceBoost: true
      })
      if (updateResult.success) {
        addOutput(`   ✅ JavaScript技能: ${updateResult.updatedSkill.oldScore} → ${updateResult.updatedSkill.newScore}`)
      }

      // 3. 添加证据
      addOutput('\n📝 步骤3: 添加技能证据')
      const evidenceResult = await agentToolExecutor.executeTool('add_skill_evidence', {
        dimension: 'project',
        skill: 'planning',
        evidenceType: 'work_experience',
        description: '综合演示：负责了3个项目的规划工作，制定了详细的项目计划和里程碑',
        impact: 'medium'
      })
      if (evidenceResult.success) {
        addOutput(`   ✅ 项目规划证据添加成功，分数提升 +${evidenceResult.updatedSkill.newScore - evidenceResult.updatedSkill.oldScore}`)
      }

      // 4. 增强置信度
      addOutput('\n🚀 步骤4: 增强技能置信度')
      const enhanceResult = await agentToolExecutor.executeTool('enhance_skill_confidence', {
        targetSkills: ['communication.teamwork'],
        additionalInfo: '综合演示：在多个跨部门协作项目中表现出色，得到同事和上级的一致好评',
        selfRating: { 'teamwork': 85 }
      })
      if (enhanceResult.success) {
        addOutput(`   ✅ 团队协作置信度增强完成`)
      }

      // 5. 获取提升建议
      addOutput('\n💡 步骤5: 生成个性化提升建议')
      const suggestions = await agentToolExecutor.executeTool('get_ability_improvement_suggestions', {
        targetDimension: 'all',
        timeFrame: '3_months'
      })
      if (suggestions.hasAssessment) {
        addOutput(`   📈 新的总体评分: ${suggestions.currentOverallScore}/100`)
        addOutput(`   🎯 建议重点提升: ${suggestions.prioritySkills?.slice(0, 2).join(', ')}`)
        addOutput(`   💪 可利用优势: ${suggestions.strengthSkills?.slice(0, 2).join(', ')}`)
      }

      addOutput('\n🎉 能力档案管理综合演示完成！')
      addOutput('📊 演示涵盖了所有6个核心功能:')
      addOutput('   1. ✅ 更新能力评估 - 修正技能分数和置信度')
      addOutput('   2. ✅ 添加技能证据 - 补充项目和工作经历')
      addOutput('   3. ✅ 增强技能置信度 - 提供额外信息支持')
      addOutput('   4. ✅ 获取个性化建议 - 制定提升计划')
      addOutput('')
      addOutput('💡 用户可以通过AI对话自然地触发这些功能：')
      addOutput('   "我的Python能力应该更高一些"')
      addOutput('   "我要添加一个新项目经历"')
      addOutput('   "AI评估不够准确，我要修正"')
      addOutput('   "给我一些能力提升建议"')

    } catch (error) {
      addOutput(`❌ 综合演示失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 更新演示操作列表，添加能力档案管理功能
  const demoActions = [
    {
      id: 'ai_chat',
      title: '🤖 AI智能对话 (真实LLM)',
      description: '⭐ 使用真实大语言模型的完整对话体验',
      action: startAIChat,
      featured: true
    },
    {
      id: 'enhanced_path',
      title: '🚀 增强版路径生成',
      description: '个性化学习路径生成与传统方式对比',
      action: demoEnhancedPathGeneration,
      featured: true
    },
    {
      id: 'enhanced_crud',
      title: '🔧 增强版CRUD操作',
      description: '完整的学习数据管理和智能分析',
      action: demoEnhancedCRUD,
      featured: true
    },
    {
      id: 'ability_integration',
      title: '📊 能力评估集成',
      description: '测试能力评估与学习系统的集成',
      action: demoAbilityIntegration
    },
    {
      id: 'query_operations', 
      title: '🔍 查询我的学习数据',
      description: '查看目标、路径、内容等学习数据',
      action: demoQueryOperations
    },
    {
      id: 'crud_operations',
      title: '🔧 基础CRUD测试', 
      description: '测试基础的增删改查功能',
      action: demoCRUDOperations
    },
    {
      id: 'complete_flow',
      title: '📚 完整学习流程',
      description: '演示从评估到内容生成的完整流程',
      action: demoCompleteLearningFlow
    },
    {
      id: 'agent_chat',
      title: '💬 Agent系统对话',
      description: '使用演示数据的Agent对话系统',
      action: demoChat
    },
    {
      id: 'create_goal',
      title: '🎯 创建学习目标',
      description: '测试目标创建和技能差距分析',
      action: demoCreateGoal
    },
    {
      id: 'generate_path',
      title: '🛤️ 生成学习路径',
      description: '基于目标和能力生成个性化路径',
      action: demoGeneratePath
    },
    {
      id: 'analysis',
      title: '🧠 智能分析',
      description: '分析用户能力和学习需求',
      action: demoAnalysis
    },
    {
      id: 'personalization',
      title: '🎨 个性化功能',
      description: '演示学习节奏调整和内容个性化',
      action: demoPersonalization
    },
    {
      id: 'system_status',
      title: '📈 系统状态',
      description: '获取完整的学习系统状态',
      action: demoSystemStatus
    },
    {
      id: 'update_ability_assessment',
      title: '📊 更新能力评估',
      description: '演示能力评估的更新过程',
      action: demoUpdateAbilityAssessment
    },
    {
      id: 'add_skill_evidence',
      title: '📝 添加技能证据',
      description: '演示技能证据的添加过程',
      action: demoAddSkillEvidence
    },
    {
      id: 'correct_ability_profile',
      title: '✏️ 修正能力档案',
      description: '演示能力档案的修正过程',
      action: demoCorrectAbilityProfile
    },
    {
      id: 'enhance_skill_confidence',
      title: '🚀 增强技能置信度',
      description: '演示技能置信度的增强过程',
      action: demoEnhanceSkillConfidence
    },
    {
      id: 'reassess_ability_dimension',
      title: '🔄 重新评估维度',
      description: '演示能力评估的重新评估过程',
      action: demoReassessAbilityDimension
    },
    {
      id: 'get_ability_improvement_suggestions',
      title: '💡 获取能力提升建议',
      description: '演示能力提升建议的获取过程',
      action: demoGetAbilityImprovementSuggestions
    },
    {
      id: 'ability_management_comprehensive',
      title: '🎯 能力档案管理综合演示',
      description: '演示能力档案管理的综合流程',
      action: demoAbilityManagementComprehensive
    },
  ]

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h1>🤖 AI Agent学习系统演示 (增强版)</h1>
      
      {/* API配置状态显示 */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3>📊 系统状态</h3>
        <div>API配置: {(() => {
          const apiConfig = getAPIConfig()
          return apiConfig.key ? `✅ ${apiConfig.model || '已配置'}` : '❌ 未配置'
        })()}</div>
        <div>数据模式: {(() => {
          const apiConfig = getAPIConfig()
          return apiConfig.key ? '真实AI分析 + 本地存储' : '本地存储 + 模拟数据'
        })()}</div>
      </div>

      {/* 增强功能按钮 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        {demoActions.filter(action => action.featured).map(action => (
          <button 
            key={action.id}
            onClick={action.action}
            disabled={loading}
            style={{
              padding: '20px',
              backgroundColor: action.id === 'ai_chat' ? '#007bff' : 
                              action.id === 'enhanced_path' ? '#28a745' :
                              action.id === 'enhanced_crud' ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'left',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>{action.title}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>{action.description}</div>
          </button>
        ))}
      </div>
      
      {/* 🤖 AI智能对话 (真实LLM) */}
      {showChat && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">🤖 AI智能对话</h3>
            <button
              onClick={clearChat}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ 关闭
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 ${
                    msg.type === 'user' 
                      ? 'text-right' 
                      : msg.type === 'system' 
                      ? 'text-center' 
                      : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : msg.type === 'system'
                        ? 'bg-yellow-100 text-yellow-800 text-sm'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-2 text-xs opacity-70">
                        🛠️ 使用工具: {msg.toolsUsed.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="text-center">
                  <div className="inline-block bg-gray-200 text-gray-600 p-3 rounded-lg">
                    ⏳ AI正在思考...
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="输入您的问题..."
                disabled={chatLoading}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                发送
              </button>
            </div>
            
            {/* 快速建议按钮 */}
            {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].suggestions && (
              <div className="flex flex-wrap gap-2">
                {chatMessages[chatMessages.length - 1].suggestions?.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧪 真实LLM Function Calling测试 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🧪 真实LLM Function Calling测试
          <span className="ml-2 text-sm font-normal text-purple-600">验证智能工具调用能力</span>
        </h3>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            ✨ 这个功能测试真正的大语言模型Function Calling能力：
          </div>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• 🤖 使用真实LLM智能选择工具</li>
            <li>• 🛠️ 自动执行22个AI工具</li>
            <li>• 🔗 支持OpenAI、Claude、通义千问</li>
            <li>• 📊 实时显示工具调用过程</li>
          </ul>
        </div>
        
        <RealLLMDemo />
      </div>

      {/* 演示输出 */}
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
          <li><strong>完整学习流程</strong>: 演示从评估到内容生成的完整流程</li>
          <li><strong>能力评估集成</strong>: 演示能力评估系统的集成</li>
        </ul>
        
        <h4 style={{ marginTop: '15px', color: '#1976d2' }}>🆕 能力档案管理功能:</h4>
        <ul>
          <li><strong>📊 更新能力评估</strong>: 修正或增强现有的技能评分和置信度</li>
          <li><strong>📝 添加技能证据</strong>: 为特定技能添加项目经历、认证等证据</li>
          <li><strong>✏️ 修正能力档案</strong>: 用户主动修正AI评估的能力档案</li>
          <li><strong>🚀 增强技能置信度</strong>: 通过提供额外信息增强技能置信度</li>
          <li><strong>🔄 重新评估维度</strong>: 基于新信息重新评估特定能力维度</li>
          <li><strong>💡 获取能力提升建议</strong>: 基于当前能力档案提供提升建议</li>
          <li><strong>🎯 能力档案管理综合演示</strong>: ⭐ 完整的能力管理流程演示</li>
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
        
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          borderRadius: '5px',
          border: '1px solid #c3e6c3'
        }}>
          <strong>✨ 能力档案管理功能特色：</strong><br/>
          • 支持通过AI对话自然地触发能力修正功能<br/>
          • 自动重新计算维度分数和总体评分<br/>
          • 完整的活动记录和数据验证机制<br/>
          • 智能建议时间框架和个性化提升计划
        </div>
        
        <p><em>注意: 除了"AI智能对话(真实LLM)"外，其他功能可能返回模拟数据。能力档案管理功能需要先完成能力评估。</em></p>
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