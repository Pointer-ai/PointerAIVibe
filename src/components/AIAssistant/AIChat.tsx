// AI 对话界面组件

import React, { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './types'
import { getAIResponse } from './service'
import { log, error } from '../../utils/logger'

interface AIChatProps {
  onClose: () => void
  initialMessage?: string
  onSkillToggle?: () => void
  isSkillActive?: boolean
  onPositionChange?: (position: { x: number; y: number }) => void
  initialPosition?: { x: number; y: number }
  onAssistantToggle?: () => void
  isAssistantActive?: boolean
  hasApiConfig?: boolean
}

export const AIChat: React.FC<AIChatProps> = ({ 
  onClose, 
  initialMessage, 
  onSkillToggle, 
  isSkillActive = false,
  onPositionChange,
  initialPosition = { x: 100, y: 100 },
  onAssistantToggle,
  isAssistantActive = false,
  hasApiConfig = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startMouseX: number; startMouseY: number } | null>(null)

  useEffect(() => {
    // 如果有初始消息，自动发送
    if (initialMessage) {
      handleSendMessage(initialMessage)
    }
    
    // 聚焦输入框（延迟一下，避免干扰用户操作）
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [initialMessage])

  useEffect(() => {
    // 滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 新开对话
  const handleNewChat = () => {
    setMessages([])
    setInputValue('')
    inputRef.current?.focus()
    log('[AIChat] New chat started')
  }

  // 拖拽相关函数
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
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
      
      const newX = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.startX + deltaX))
      const newY = Math.max(0, Math.min(window.innerHeight - 400, dragRef.current.startY + deltaY))
      
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

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await getAIResponse(message.trim())
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      log('[AIChat] Message sent and response received')
    } catch (err) {
      error('[AIChat] Failed to get AI response:', err)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，我暂时无法回答您的问题。请检查网络连接或稍后重试。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="flex flex-col h-96 w-96 bg-white rounded-xl shadow-2xl border border-gray-200">
      {/* 标题栏 - 可拖拽 */}
      <div 
        className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-medium">AI 学习助手</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 助手激活开关 */}
          {hasApiConfig && onAssistantToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAssistantToggle()
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isAssistantActive ? 'bg-green-400' : 'bg-white/30'
              }`}
              title={isAssistantActive ? '点击暂停助手' : '点击激活助手'}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isAssistantActive ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          )}
          
          {/* 新开对话按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNewChat()
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="新开对话"
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
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
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
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          {/* 关键词识别开关 */}
          {isAssistantActive && onSkillToggle && (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">关键词识别</span>
                <button
                  onClick={() => {
                    onSkillToggle()
                    setShowSettings(false)
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSkillActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSkillActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                开启后会自动识别页面中的计算机专业术语
              </p>
            </div>
          )}
          
          {/* 没有API配置的提示 */}
          {!hasApiConfig && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-2">⚠️ 需要配置API Key</p>
              <p className="text-xs text-gray-500">
                请在Profile设置中配置AI API Key后使用助手功能
              </p>
            </div>
          )}
          
          {/* 助手被禁用的提示 */}
          {hasApiConfig && !isAssistantActive && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-2">🛑 助手已暂停</p>
              <p className="text-xs text-gray-500">
                点击标题栏的开关重新激活助手
              </p>
            </div>
          )}
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p>你好！我是你的AI学习助手</p>
            <p className="text-sm mt-1">问我任何计算机专业相关的问题吧~</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">思考中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || !isAssistantActive}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading || !isAssistantActive}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>💡 提示：点击页面中高亮的关键词可以快速询问</span>
          <span>· 拖拽标题栏移动窗口</span>
        </div>
      </div>
    </div>
  )
} 