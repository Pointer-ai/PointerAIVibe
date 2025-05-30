// 多Tab聊天界面组件

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { ChatMessage, ChatSession } from './types'
import { getAIResponseStream, createChatSession, saveChatSession, deleteChatSession, getChatSessions, updateSessionTitle } from './service'
import { log, error } from '../../utils/logger'

interface MultiTabChatProps {
  onClose: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  initialPosition?: { x: number; y: number }
  onAssistantToggle?: () => void
  isAssistantActive?: boolean
  hasApiConfig?: boolean
  newQueryRequest?: {
    text: string
    message: string
    id: string
  } | null
  onQueryRequestProcessed?: () => void
}

export const MultiTabChat: React.FC<MultiTabChatProps> = ({ 
  onClose, 
  onPositionChange,
  initialPosition = { x: 100, y: 100 },
  onAssistantToggle,
  isAssistantActive = false,
  hasApiConfig = false,
  newQueryRequest,
  onQueryRequestProcessed
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const [chatSize, setChatSize] = useState({ width: 600, height: 384 }) // 24rem = 384px
  const [isResizing, setIsResizing] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startMouseX: number; startMouseY: number } | null>(null)

  // 处理新的随意搜查询请求 - 简化逻辑，因为组件常驻
  useEffect(() => {
    if (newQueryRequest) {
      log('[MultiTabChat] 处理随意搜查询:', newQueryRequest.text.substring(0, 30))
      
      // 创建新的关键词会话
      const newSession = createChatSession('keyword', newQueryRequest.text)
      
      // 立即添加到会话列表最前面并设置为活跃
      setSessions(prev => {
        const updatedSessions = [newSession, ...prev.slice(0, 9)] // 保持最多10个
        return updatedSessions
      })
      
      setActiveSessionId(newSession.id)
      
      // 立即发送消息到新会话
      const sendMessageToNewSession = async () => {
        try {
          // 创建用户消息
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: newQueryRequest.message.trim(),
            timestamp: new Date(),
            keyword: newSession.keyword
          }
          
          // 更新会话标题和添加用户消息
          const updatedSession = updateSessionTitle(newSession, newQueryRequest.message.trim())
          updatedSession.messages = [userMessage]
          updatedSession.lastActivity = new Date()
          saveChatSession(updatedSession)
          
          // 更新状态
          setSessions(prev => prev.map(session => 
            session.id === newSession.id ? updatedSession : session
          ))
          
          setIsLoading(true)
          
          // 创建流式AI消息
          const assistantMessageId = (Date.now() + 1).toString()
          setStreamingMessageId(assistantMessageId)
          setStreamingContent('')
          
          // 先添加一个空的AI消息占位符
          const placeholderMessage: ChatMessage = {
            id: assistantMessageId,
            type: 'assistant',
            content: '',
            timestamp: new Date()
          }
          
          const sessionWithPlaceholder = {
            ...updatedSession,
            messages: [...updatedSession.messages, placeholderMessage],
            lastActivity: new Date()
          }
          
          setSessions(prev => prev.map(session => 
            session.id === newSession.id ? sessionWithPlaceholder : session
          ))
          
          // 获取流式AI回复
          const response = await getAIResponseStream(
            newQueryRequest.message.trim(),
            undefined,
            (chunk: string) => {
              // 实时更新流式内容
              setStreamingContent(prev => prev + chunk)
            }
          )
          
          // 完成后更新最终消息
          const finalMessage: ChatMessage = {
            id: assistantMessageId,
            type: 'assistant',
            content: response,
            timestamp: new Date()
          }
          
          const finalSession = {
            ...sessionWithPlaceholder,
            messages: [...updatedSession.messages, finalMessage],
            lastActivity: new Date()
          }
          saveChatSession(finalSession)
          
          setSessions(prev => prev.map(session => 
            session.id === newSession.id ? finalSession : session
          ))
          
        } catch (err) {
          error('[MultiTabChat] 随意搜查询失败:', err)
          
          // 添加错误消息
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: '抱歉，我暂时无法回答您的问题。请检查网络连接或稍后重试。',
            timestamp: new Date()
          }
          
          setSessions(prev => prev.map(session => {
            if (session.id === newSession.id) {
              return {
                ...session,
                messages: [...session.messages.filter(m => m.id !== streamingMessageId), errorMessage],
                lastActivity: new Date()
              }
            }
            return session
          }))
        } finally {
          setIsLoading(false)
          setStreamingMessageId(null)
          setStreamingContent('')
          onQueryRequestProcessed?.()
        }
      }
      
      // 延迟执行确保状态更新完成
      setTimeout(sendMessageToNewSession, 50)
    }
  }, [newQueryRequest, onQueryRequestProcessed])

  // 初始化会话列表
  useEffect(() => {
    const existingSessions = getChatSessions()
    if (sessions.length === 0) {
      setSessions(existingSessions.length > 0 ? existingSessions : [createChatSession('manual')])
      if (existingSessions.length > 0) {
        setActiveSessionId(existingSessions[0].id)
      } else {
        const defaultSession = createChatSession('manual')
        setSessions([defaultSession])
        setActiveSessionId(defaultSession.id)
      }
    }
  }, [sessions.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessions, activeSessionId])

  // 流式内容更新时自动滚动到底部
  useEffect(() => {
    if (streamingContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamingContent])

  // 拖拽处理 - 现在整个聊天框都可以拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果点击的是输入框、按钮、消息内容或其他交互元素，不触发拖拽
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'A' ||
      target.tagName === 'CODE' ||
      target.tagName === 'PRE' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.closest('code') ||
      target.closest('pre') ||
      target.closest('.no-drag') ||
      target.closest('.message-content') ||
      target.closest('.markdown-content') ||
      target.classList.contains('cursor-ew-resize') ||
      target.classList.contains('cursor-ns-resize') ||
      target.classList.contains('cursor-nw-resize')
    ) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    
    dragRef.current = {
      startX: position.x,
      startY: position.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY
    }
    
    setIsDragging(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      
      e.preventDefault()
      
      const deltaX = e.clientX - dragRef.current.startMouseX
      const deltaY = e.clientY - dragRef.current.startMouseY
      
      const newX = Math.max(0, Math.min(window.innerWidth - 600, dragRef.current.startX + deltaX))
      const newY = Math.max(0, Math.min(window.innerHeight - 500, dragRef.current.startY + deltaY))
      
      const newPosition = { x: newX, y: newY }
      setPosition(newPosition)
      onPositionChange?.(newPosition)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 处理调整大小的鼠标事件
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = chatSize.width
    const startHeight = chatSize.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      
      let newWidth = startWidth
      let newHeight = startHeight
      
      if (direction.includes('right')) {
        newWidth = Math.max(400, Math.min(1000, startWidth + (e.clientX - startX)))
      }
      if (direction.includes('left')) {
        newWidth = Math.max(400, Math.min(1000, startWidth - (e.clientX - startX)))
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(300, Math.min(800, startHeight + (e.clientY - startY)))
      }
      if (direction.includes('top')) {
        newHeight = Math.max(300, Math.min(800, startHeight - (e.clientY - startY)))
      }
      
      setChatSize({ width: newWidth, height: newHeight })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 创建新会话
  const handleNewChat = () => {
    const newSession = createChatSession('manual')
    setSessions(prev => [newSession, ...prev.slice(0, 9)]) // 保持最多10个
    setActiveSessionId(newSession.id)
    setInputValue('')
    inputRef.current?.focus()
  }

  // 切换会话
  const handleSessionSwitch = (sessionId: string) => {
    setActiveSessionId(sessionId)
    setInputValue('')
    inputRef.current?.focus()
  }

  // 关闭会话
  const handleSessionClose = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (sessions.length <= 1) {
      // 如果只剩一个会话，创建新的空会话
      const newSession = createChatSession('manual')
      setSessions([newSession])
      setActiveSessionId(newSession.id)
    } else {
      const newSessions = sessions.filter(s => s.id !== sessionId)
      setSessions(newSessions)
      
      if (activeSessionId === sessionId) {
        setActiveSessionId(newSessions[0]?.id || null)
      }
      
      // 从存储中删除
      deleteChatSession(sessionId)
    }
  }

  // 发送消息
  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isLoading) {
      return
    }

    const targetSessionId = activeSessionId
    if (!targetSessionId) {
      return
    }

    // 找到目标会话
    const targetSession = sessions.find(s => s.id === targetSessionId)
    if (!targetSession) {
      return
    }

    setInputValue('')
    setIsLoading(true)

    try {
      // 更新会话标题（如果是第一条消息）
      const updatedSession = updateSessionTitle(targetSession, message.trim())
      
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: message.trim(),
        timestamp: new Date(),
        keyword: targetSession.keyword // 如果是关键词会话，添加关键词标记
      }

      // 更新会话状态
      const updatedSessions = sessions.map(session => {
        if (session.id === targetSessionId) {
          const finalSession = {
            ...updatedSession,
            messages: [...session.messages, userMessage],
            lastActivity: new Date()
          }
          saveChatSession(finalSession)
          return finalSession
        }
        return session
      })
      setSessions(updatedSessions)

      // 创建流式AI消息
      const assistantMessageId = (Date.now() + 1).toString()
      setStreamingMessageId(assistantMessageId)
      setStreamingContent('')
      
      // 先添加一个空的AI消息占位符
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      const sessionsWithPlaceholder = updatedSessions.map(session => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            messages: [...session.messages, placeholderMessage],
            lastActivity: new Date()
          }
        }
        return session
      })
      setSessions(sessionsWithPlaceholder)

      // 获取流式AI回复
      const response = await getAIResponseStream(
        message.trim(),
        undefined,
        (chunk: string) => {
          // 实时更新流式内容
          setStreamingContent(prev => prev + chunk)
        }
      )
      
      // 完成后更新最终消息
      const finalMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      // 更新会话
      const finalSessions = sessionsWithPlaceholder.map(session => {
        if (session.id === targetSessionId) {
          const finalSession = {
            ...session,
            messages: [...session.messages.filter(m => m.id !== assistantMessageId), finalMessage],
            lastActivity: new Date()
          }
          saveChatSession(finalSession)
          return finalSession
        }
        return session
      })
      setSessions(finalSessions)

    } catch (err) {
      error('[MultiTabChat] Failed to get AI response:', err)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，我暂时无法回答您的问题。请检查网络连接或稍后重试。',
        timestamp: new Date()
      }

      const errorSessions = sessions.map(session => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            messages: [...session.messages.filter(m => m.id !== streamingMessageId), errorMessage],
            lastActivity: new Date()
          }
        }
        return session
      })
      setSessions(errorSessions)
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
      setStreamingContent('')
    }

    onQueryRequestProcessed?.()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: Date | string | number) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch (error) {
      return new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  return (
    <div 
      className={`flex bg-white rounded-xl shadow-2xl border border-gray-200 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${isResizing ? 'select-none' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: `${chatSize.width}px`,
        height: `${chatSize.height}px`,
        zIndex: 1000,
        userSelect: isDragging || isResizing ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 调整大小的手柄 */}
      {/* 右边缘 */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-300 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
      />
      
      {/* 底边缘 */}
      <div
        className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-blue-300 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
      
      {/* 右下角 */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-nw-resize hover:bg-blue-400 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
      />
      
      {/* 右下角调整大小图标 */}
      <div className="absolute bottom-1 right-1 pointer-events-none">
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 13a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H10v1.5a.5.5 0 0 1-.5.5z"/>
          <path d="M13 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0v-2z"/>
          <path d="M2.5 13a.5.5 0 0 1 0-1h2v-1.5a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5h-2z"/>
          <path d="M2 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H3v1.5a.5.5 0 0 1-1 0v-2z"/>
        </svg>
      </div>

      {/* 左侧对话列表 */}
      <div className="bg-gray-50 border-r border-gray-200 rounded-tl-xl flex flex-col" style={{ width: Math.max(180, Math.min(250, chatSize.width * 0.3)) }}>
        <div className="p-3 border-b border-gray-200 bg-gray-100 rounded-tl-xl">
          <h3 className="font-medium text-gray-700 text-sm">对话列表</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative p-2 mb-2 rounded-lg text-sm cursor-pointer transition-colors ${
                session.id === activeSessionId
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleSessionSwitch(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">
                    {session.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      session.trigger === 'keyword' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {session.trigger === 'keyword' ? '🔍' : '💬'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.messages.length}
                    </span>
                  </div>
                </div>
                
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => handleSessionClose(session.id, e)}
                    className="ml-1 p-1 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-drag"
                    title="删除对话"
                  >
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex flex-col flex-1">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">悟语 AI学习助手</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 助手激活开关 */}
            {hasApiConfig && onAssistantToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAssistantToggle()
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors no-drag ${
                  isAssistantActive ? 'bg-green-400' : 'bg-white/30'
                }`}
                title={isAssistantActive ? '点击暂停悟语' : '点击激活悟语'}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isAssistantActive ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
            
            {/* 新建对话按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNewChat()
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors no-drag"
              title="新建对话"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* 设置按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSettings(!showSettings)
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors no-drag"
              title="设置"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors no-drag"
              title="最小化"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="text-center text-sm text-gray-600">
              <p>✨ 悟语随意搜功能已激活</p>
              <p className="text-xs mt-1">选中页面任意文字即可进行AI查询</p>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-drag">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🧘‍♂️</div>
              <p>你好！我是悟语，你的AI学习伙伴</p>
              <p className="text-sm mt-1">问我任何问题，或选中文字进行随意搜~</p>
              <p className="text-xs text-gray-400 mt-2">
                选中页面文字会显示"随意搜"按钮，点击即可查询
              </p>
            </div>
          ) : (
            activeSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} no-drag`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="message-content break-words select-text">
                    {message.type === 'assistant' ? (
                      <div className="markdown-content">
                        <ReactMarkdown 
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            // 自定义代码块样式
                            code: ({node, inline, className, children, ...props}: any) => {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <pre className="bg-gray-800 text-white p-3 rounded-lg my-2 overflow-x-auto">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            // 自定义段落样式
                            p: ({children}: any) => <p className="mb-2 last:mb-0">{children}</p>,
                            // 自定义列表样式
                            ul: ({children}: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({children}: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            // 自定义标题样式
                            h1: ({children}: any) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({children}: any) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({children}: any) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                            // 自定义强调样式
                            strong: ({children}: any) => <strong className="font-semibold">{children}</strong>,
                            // 自定义链接样式
                            a: ({children, href}: any) => (
                              <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            )
                          }}
                        >
                          {/* 如果是流式消息且正在流式输出，显示实时内容；否则显示完整内容 */}
                          {message.id === streamingMessageId && streamingContent 
                            ? streamingContent 
                            : message.content || ''}
                        </ReactMarkdown>
                        
                        {/* 流式输出时显示光标 */}
                        {message.id === streamingMessageId && (
                          <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-1 rounded-full"></span>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 flex items-center justify-between ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && !streamingMessageId && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">悟语思考中...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="border-t border-gray-200 p-4 no-drag">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题..."
              className="multi-tab-chat-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || !isAssistantActive}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading || !isAssistantActive}
              className="multi-tab-chat-send-button px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>💡 提示：选中页面文字进行随意搜</span>
            <span>· {sessions.length}/10 个对话</span>
          </div>
        </div>
      </div>
    </div>
  )
} 