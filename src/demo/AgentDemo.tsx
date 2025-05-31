import React, { useState } from 'react'
import { learningSystemService } from '../modules/learningSystem'
import { agentToolExecutor } from '../modules/coreData'

export const AgentDemo: React.FC = () => {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const addOutput = (text: string) => {
    setOutput(prev => prev + '\n' + text)
  }

  const clearOutput = () => {
    setOutput('')
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
      // 首先生成路径节点
      const nodes = await agentToolExecutor.executeTool('generate_path_nodes', {
        goalId: 'demo_goal',
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
        goalId: 'demo_goal',
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
      const schedule = await agentToolExecutor.executeTool('recommend_study_schedule', {
        availableHoursPerWeek: 10,
        preferredStudyTimes: ['evening', 'weekend'],
        goalId: 'demo_goal'
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

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h1>🤖 AI Agent学习系统演示</h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        marginBottom: '20px' 
      }}>
        <button 
          onClick={demoChat}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
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
          <li><strong>AI对话演示</strong>: 展示自然语言交互和意图识别</li>
          <li><strong>创建目标</strong>: 演示学习目标的创建和管理</li>
          <li><strong>生成路径</strong>: 展示智能学习路径生成功能</li>
          <li><strong>智能分析</strong>: 演示能力分析、进度跟踪等功能</li>
          <li><strong>个性化功能</strong>: 展示个性化内容推荐和学习计划</li>
          <li><strong>系统状态</strong>: 查看当前系统状态和推荐</li>
        </ul>
        <p><em>注意: 这是演示模式，部分功能可能返回模拟数据。</em></p>
      </div>
    </div>
  )
}

export default AgentDemo 