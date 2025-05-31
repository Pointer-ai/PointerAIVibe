import React, { useState, useRef, useEffect } from 'react'
import { learningSystemService, LearningSystemStatus } from '../../modules/learningSystem'
import { log } from '../../utils/logger'
import './AgentChat.css'

interface ChatMessage {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: string
  toolsUsed?: string[]
  suggestions?: string[]
}

export const AgentChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<LearningSystemStatus | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化系统状态
  useEffect(() => {
    const initializeStatus = async () => {
      try {
        const status = await learningSystemService.getSystemStatus()
        setSystemStatus(status)
        
        // 添加欢迎消息
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          type: 'agent',
          content: getWelcomeMessage(status),
          timestamp: new Date().toISOString(),
          suggestions: status.recommendations.slice(0, 3)
        }
        setMessages([welcomeMessage])
      } catch (error) {
        log('[AgentChat] Failed to initialize status:', error)
      }
    }

    initializeStatus()
  }, [])

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // 调用AI Agent - 默认使用真实LLM进行智能工具调度
      const response = await learningSystemService.chatWithAgent(inputValue, {
        useRealLLM: true,  // 启用基于LLM的智能工具调度
        currentSystemStatus: systemStatus,
        chatHistory: messages  // 传递聊天历史以提供上下文
      })

      const agentMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'agent',
        content: response.response,
        timestamp: new Date().toISOString(),
        toolsUsed: response.toolsUsed,
        suggestions: response.suggestions
      }

      setMessages(prev => [...prev, agentMessage])
      setSystemStatus(response.systemStatus)

    } catch (error) {
      log('[AgentChat] Failed to send message:', error)
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'agent',
        content: '抱歉，我现在无法处理您的请求。请稍后再试。',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理Enter键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 快速操作
  const handleQuickAction = async (action: string, params?: any) => {
    setIsLoading(true)
    try {
      const result = await learningSystemService.executeQuickAction(action, params)
      
      const agentMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'agent',
        content: formatQuickActionResult(action, result),
        timestamp: new Date().toISOString(),
        toolsUsed: [action]
      }
      
      setMessages(prev => [...prev, agentMessage])
      
      // 更新系统状态
      const newStatus = await learningSystemService.getSystemStatus()
      setSystemStatus(newStatus)
      
    } catch (error) {
      log('[AgentChat] Quick action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 点击建议
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className="agent-chat">
      {/* 系统状态栏 */}
      {systemStatus && (
        <div className="system-status">
          <div className="status-phase">
            当前阶段: <span className="phase">{getPhaseLabel(systemStatus.currentPhase)}</span>
          </div>
          <div className="status-progress">
            学习进度: <span className="progress">{Math.round(systemStatus.progress.overallProgress)}%</span>
          </div>
          <div className="status-setup">
            设置完成度: <span className={systemStatus.setupComplete ? 'complete' : 'incomplete'}>
              {systemStatus.setupComplete ? '完成' : '进行中'}
            </span>
          </div>
        </div>
      )}

      {/* 快速操作栏 */}
      <div className="quick-actions">
        <button 
          className="quick-action"
          onClick={() => handleQuickAction('analyze_ability')}
          disabled={isLoading}
        >
          🧠 分析能力
        </button>
        <button 
          className="quick-action"
          onClick={() => handleQuickAction('suggest_next')}
          disabled={isLoading}
        >
          🎯 下一步建议
        </button>
        <button 
          className="quick-action"
          onClick={() => handleQuickAction('track_progress')}
          disabled={isLoading}
        >
          📊 学习进度
        </button>
        <button 
          className="quick-action"
          onClick={() => handleQuickAction('recommend_schedule')}
          disabled={isLoading}
        >
          📅 学习计划
        </button>
      </div>

      {/* 消息列表 */}
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            
            {/* 工具使用信息 */}
            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <div className="tools-used">
                🔧 使用了工具: {message.toolsUsed.join(', ')}
              </div>
            )}
            
            {/* 建议按钮 */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="suggestions">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-btn"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message agent loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              正在思考...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的问题或需求..."
          disabled={isLoading}
          className="message-input"
        />
        <button 
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          发送
        </button>
      </div>

      {/* 提示信息 */}
      <div className="chat-hints">
        💡 试试问我: "我想学前端开发"、"我的学习进度如何"、"调整学习节奏"等
      </div>
    </div>
  )
}

// 辅助函数
function getWelcomeMessage(status: LearningSystemStatus): string {
  if (!status.progress.hasAbilityProfile) {
    return '你好！我是你的AI学习助手。我发现你还没有完成能力评估，建议先了解一下你的技能水平，这样我就能为你提供更个性化的学习建议了。'
  }
  
  if (status.progress.activeGoals === 0) {
    return '欢迎回来！你已经完成了能力评估，现在让我们设定一个学习目标吧。告诉我你想学习什么？'
  }
  
  if (status.progress.activePaths === 0) {
    return `很好！你已经设定了 ${status.progress.activeGoals} 个学习目标。现在让我为你生成个性化的学习路径吧。`
  }
  
  return `欢迎回来！你的学习进度是 ${Math.round(status.progress.overallProgress)}%。有什么我可以帮助你的吗？`
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    'assessment': '能力评估',
    'goal_setting': '目标设定',
    'path_planning': '路径规划',
    'learning': '学习中',
    'review': '复习回顾'
  }
  return labels[phase] || phase
}

function formatQuickActionResult(action: string, result: any): string {
  switch (action) {
    case 'analyze_ability':
      if (result.hasAbilityData) {
        return `✅ 能力分析完成！您的总体水平：${result.overallScore}/10\n优势：${result.strengths.join('、')}\n建议提升：${result.weaknesses.join('、')}`
      } else {
        return '❗ 还没有能力评估数据。建议先完成能力测试。'
      }
      
    case 'suggest_next':
      return `🎯 根据您的当前状态，建议：${result.suggestions?.join('，或者') || '继续当前的学习计划'}`
      
    case 'track_progress':
      return `📊 学习进度报告：\n总体进度：${Math.round(result.overallProgress || 0)}%\n活跃路径：${result.activePaths || 0} 个\n${result.insights?.[0] || '继续保持学习！'}`
      
    case 'recommend_schedule':
      return `📅 学习计划建议：\n每周 ${result.weeklyHours || 10} 小时，预计 ${result.estimatedCompletionWeeks || 'N/A'} 周完成\n${result.tips?.[0] || '制定规律的学习时间'}`
      
    default:
      return '✅ 操作完成！'
  }
} 