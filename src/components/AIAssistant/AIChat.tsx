// AI 对话组件 - 专门用于简历分析等简单对话场景

import React, { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './types'
import { AIChatService } from './service'
import { log } from '../../utils/logger'

interface AIChatProps {
  onClose: () => void
  initialMessage?: string
  hasApiConfig?: boolean
  className?: string
}

export const AIChat: React.FC<AIChatProps> = ({ 
  onClose, 
  initialMessage, 
  hasApiConfig = false,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingInfo, setStreamingInfo] = useState<{ messageId: string | null; content: string }>({ 
    messageId: null, 
    content: '' 
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatServiceRef = useRef<AIChatService | null>(null)

  // 初始化聊天服务
  useEffect(() => {
    chatServiceRef.current = new AIChatService({
      onMessagesUpdate: (newMessages) => {
        setMessages(newMessages)
      },
      onLoadingStateChange: (loading) => {
        setIsLoading(loading)
      },
      onStreamingUpdate: (messageId, content) => {
        setStreamingInfo({ messageId, content })
      },
      onStreamingComplete: () => {
        setStreamingInfo({ messageId: null, content: '' })
      }
    })

    // 如果有初始消息，自动发送
    if (initialMessage) {
      setTimeout(() => {
        chatServiceRef.current?.sendMessage(initialMessage)
      }, 300)
    }

    // 聚焦输入框
    setTimeout(() => inputRef.current?.focus(), 300)

    // 清理函数
    return () => {
      chatServiceRef.current?.destroy()
    }
  }, [initialMessage])

  useEffect(() => {
    // 滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingInfo.content])

  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isLoading || !chatServiceRef.current) return

    setInputValue('')
    await chatServiceRef.current.sendMessage(message.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    chatServiceRef.current?.clearMessages()
    setInputValue('')
    inputRef.current?.focus()
    log('[AIChat] New chat started')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!hasApiConfig) {
    return (
      <div className={`flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 w-96 h-96 ${className}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
          <span className="font-medium">AI 助手</span>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-600 mb-2">⚠️ 需要配置 API Key</p>
            <p className="text-sm text-gray-500">
              请在设置中配置 AI API Key 后使用助手功能
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 w-96 h-96 ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-medium">AI 助手</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="新开对话"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p>你好！我是你的AI助手</p>
            <p className="text-sm mt-1">问我任何问题吧~</p>
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
                {/* 如果是流式消息且正在流式输出，显示实时内容；否则显示完整内容 */}
                {message.type === 'assistant' && message.id === streamingInfo.messageId && streamingInfo.content 
                  ? streamingInfo.content 
                  : message.content}
                
                {/* 流式输出时显示光标 */}
                {message.type === 'assistant' && message.id === streamingInfo.messageId && (
                  <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-1 rounded-full"></span>
                )}
              </div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && !streamingInfo.messageId && (
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
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 