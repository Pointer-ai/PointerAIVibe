// 全局AI助手主组件

import React, { useState, useEffect, useRef } from 'react'
import { getCurrentProfile } from '../../utils/profile'
import { isAssistantAvailable } from './service'
import { MultiTabChat } from './MultiTabChat'
import { TextSelector } from './TextSelector'
import { AIAssistantState } from './types'
import { log } from '../../utils/logger'

export const GlobalAIAssistant: React.FC = () => {
  const [state, setState] = useState<AIAssistantState>({
    isActive: false,
    isOpen: false,
    isAnimating: false,
    hasKeywordsHighlighted: false,
    isUserDisabled: false,
    sessions: []
  })
  
  const [newQueryRequest, setNewQueryRequest] = useState<{
    text: string
    message: string
    id: string
  } | null>(null)
  
  const [showIntroCard, setShowIntroCard] = useState(false)
  const [assistantPosition, setAssistantPosition] = useState({ right: 20, bottom: 20 })
  const [chatPosition, setChatPosition] = useState({ x: 100, y: 100 })
  const [isDraggingAssistant, setIsDraggingAssistant] = useState(false)
  const assistantDragRef = useRef<{ startX: number; startY: number; startMouseX: number; startMouseY: number } | null>(null)
  const introTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 检查是否有当前profile和API配置
  useEffect(() => {
    const checkAvailability = () => {
      const profile = getCurrentProfile()
      const hasApiConfig = !!(profile && isAssistantAvailable())
      
      const wasActive = state.isActive
      // 只有在有API配置且用户没有主动禁用时才激活
      const isNowActive = hasApiConfig && !state.isUserDisabled
      
      // 只在状态变化时记录日志和更新状态
      if (wasActive !== isNowActive) {
        setState(prev => ({
          ...prev,
          isActive: isNowActive
        }))
        
        if (isNowActive) {
          log('[GlobalAIAssistant] 悟语助手已激活')
        }
        
        // 只有在真正没有API配置时才显示介绍（用户主动禁用时不显示）
        if (!hasApiConfig && !state.isUserDisabled) {
          if (wasActive && !isNowActive) {
            startIntroTimer()
          }
        } else {
          // 如果有API配置或用户主动禁用，清除介绍定时器
          clearIntroTimer()
          setShowIntroCard(false)
        }
      }
    }
    
    checkAvailability()
    
    // 监听profile变化 - 减少检查频率
    const interval = setInterval(checkAvailability, 5000)
    return () => clearInterval(interval)
  }, [state.isActive, state.isUserDisabled])

  // 未激活时的介绍定时器
  const startIntroTimer = () => {
    clearIntroTimer()
    introTimeoutRef.current = setTimeout(() => {
      if (!state.isActive && !showIntroCard && !state.isUserDisabled) {
        setShowIntroCard(true)
        
        // 10秒后自动隐藏
        setTimeout(() => {
          setShowIntroCard(false)
          // 30秒后再次显示
          startIntroTimer()
        }, 10000)
      }
    }, 15000) // 15秒后显示介绍
  }

  const clearIntroTimer = () => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current)
      introTimeoutRef.current = null
    }
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    if (!state.isActive && !state.isUserDisabled) {
      startIntroTimer()
    }
    
    return () => {
      clearIntroTimer()
    }
  }, [state.isActive, state.isUserDisabled])

  // 处理文本随意搜
  const handleTextQuery = (text: string) => {
    if (!state.isActive) {
      return
    }
    
    const message = `请帮我解释或分析这段文字："${text}"`
    
    // 强制确保聊天窗口打开
    setState(prev => ({
      ...prev,
      isOpen: true
    }))
    
    // 创建新的查询请求，通过props传递给MultiTabChat
    const queryRequest = {
      text,
      message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    
    setNewQueryRequest(queryRequest)
    
    log(`[GlobalAIAssistant] 随意搜查询: "${text.substring(0, 30)}..."`)
  }

  // 处理聊天窗口最小化/展开
  const handleChatToggle = () => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }))
    
    log(`[GlobalAIAssistant] 悟语聊天窗口${state.isOpen ? '已最小化' : '已展开'}`)
  }

  // 处理助手图标点击
  const handleAssistantClick = () => {
    // 如果正在拖拽，不触发点击
    if (isDraggingAssistant) return
    
    if (!state.isActive) return
    
    handleChatToggle()
  }

  // 处理助手激活/禁用切换
  const handleAssistantToggle = () => {
    const profile = getCurrentProfile()
    const hasApiConfig = profile && isAssistantAvailable()
    
    if (!hasApiConfig) {
      // 如果没有API配置，不允许激活
      return
    }
    
    setState(prev => ({
      ...prev,
      isUserDisabled: !prev.isUserDisabled
    }))
    
    log(`[GlobalAIAssistant] 悟语${state.isUserDisabled ? '已激活' : '已暂停'}`)
  }

  // 处理查询请求完成
  const handleQueryRequestProcessed = () => {
    setNewQueryRequest(null)
  }

  // 助手拖拽相关函数
  const handleAssistantMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    assistantDragRef.current = {
      startX: rect.left,
      startY: rect.top,
      startMouseX: e.clientX,
      startMouseY: e.clientY
    }
    
    setIsDraggingAssistant(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!assistantDragRef.current) return
      
      e.preventDefault()
      
      const deltaX = e.clientX - assistantDragRef.current.startMouseX
      const deltaY = e.clientY - assistantDragRef.current.startMouseY
      
      const newX = Math.max(0, Math.min(window.innerWidth - 60, assistantDragRef.current.startX + deltaX))
      const newY = Math.max(0, Math.min(window.innerHeight - 60, assistantDragRef.current.startY + deltaY))
      
      // 转换为right和bottom值
      const newRight = window.innerWidth - newX - 60
      const newBottom = window.innerHeight - newY - 60
      
      setAssistantPosition({ right: newRight, bottom: newBottom })
    }
    
    const handleMouseUp = () => {
      setIsDraggingAssistant(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 获取助手图标样式
  const getAssistantIconStyle = () => {
    return {
      position: 'fixed' as const,
      right: `${assistantPosition.right}px`,
      bottom: `${assistantPosition.bottom}px`,
      zIndex: 9999,
      cursor: isDraggingAssistant ? 'grabbing' : (state.isActive ? 'grab' : 'default'),
      userSelect: 'none' as const,
      transition: isDraggingAssistant ? 'none' : 'all 0.3s ease'
    }
  }

  // 检查是否应该显示为灰色状态
  const isGrayedOut = () => {
    const profile = getCurrentProfile()
    const hasApiConfig = profile && isAssistantAvailable()
    return !hasApiConfig || state.isUserDisabled
  }

  // 渲染助手图标
  const renderAssistantIcon = () => {
    if (isGrayedOut()) {
      // 石化状态 - 灰色小动物 (没有API配置或用户主动禁用)
      return (
        <div 
          data-assistant-icon
          style={getAssistantIconStyle()}
          className="w-14 h-14 bg-gray-300 rounded-full shadow-lg flex items-center justify-center"
          onMouseDown={handleAssistantMouseDown}
          onClick={state.isUserDisabled ? handleAssistantClick : undefined}
        >
          <span className="text-2xl filter grayscale opacity-50">🧘‍♂️</span>
        </div>
      )
    }

    // 激活状态 - 彩色小动物
    return (
      <div 
        data-assistant-icon
        style={getAssistantIconStyle()}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          state.isOpen 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gradient-to-r from-green-400 to-blue-500'
        }`}
        onClick={handleAssistantClick}
        onMouseDown={handleAssistantMouseDown}
      >
        <span className="text-2xl animate-bounce">🧘‍♂️</span>
        
        {/* 状态指示器 */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
          state.isOpen ? 'bg-purple-400' : 'bg-green-400'
        } animate-pulse`}>
        </div>
      </div>
    )
  }

  // 渲染介绍卡片
  const renderIntroCard = () => {
    // 只在没有API配置且用户没有主动禁用时显示
    if (!showIntroCard || state.isUserDisabled) return null
    
    const profile = getCurrentProfile()
    const hasApiConfig = profile && isAssistantAvailable()
    if (hasApiConfig) return null

    return (
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs"
        style={{ 
          right: `${assistantPosition.right + 80}px`,
          bottom: `${assistantPosition.bottom}px`,
          animation: 'fadeInUp 0.3s ease-out' 
        }}
      >
        <button
          onClick={() => setShowIntroCard(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🧘‍♂️</span>
          <span className="font-medium text-gray-800">悟语学习助手</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          你好！我是悟语，你的专属AI学习伙伴。选中页面任意文字，我可以帮你解释和分析。
        </p>
        
        <div className="text-xs text-gray-500 mb-2">
          <span className="font-medium">如何激活我：</span>
        </div>
        <ol className="text-xs text-gray-500 list-decimal list-inside space-y-1">
          <li>创建或登录Profile</li>
          <li>在设置中配置AI API Key</li>
          <li>我就会变成彩色并为你服务！</li>
        </ol>
      </div>
    )
  }

  return (
    <>
      {/* 随意搜文本选择器 */}
      <TextSelector
        isActive={state.isActive}
        onTextQuery={handleTextQuery}
      />

      {/* 助手图标 */}
      {renderAssistantIcon()}

      {/* 介绍卡片 */}
      {renderIntroCard()}

      {/* 非模态聊天界面 - 常驻组件，通过显示状态控制 */}
      {(state.isActive || state.isUserDisabled) && (
        <div 
          className={`fixed z-40 transition-opacity duration-300 ${
            state.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`
          }}
        >
          <MultiTabChat 
            key="main-chat"
            onClose={handleChatToggle}
            onPositionChange={setChatPosition}
            initialPosition={chatPosition}
            onAssistantToggle={handleAssistantToggle}
            isAssistantActive={!state.isUserDisabled}
            hasApiConfig={!!(getCurrentProfile() && isAssistantAvailable())}
            newQueryRequest={newQueryRequest}
            onQueryRequestProcessed={handleQueryRequestProcessed}
          />
        </div>
      )}

      {/* 全局样式 */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  )
}