// 随意搜文本选择组件

import React, { useEffect, useState, useRef } from 'react'
import { log } from '../../utils/logger'

interface TextSelectorProps {
  isActive: boolean
  onTextQuery: (text: string) => void
}

export const TextSelector: React.FC<TextSelectorProps> = ({ isActive, onTextQuery }) => {
  const [selectedText, setSelectedText] = useState('')
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null)
  const [showButton, setShowButton] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) {
      setShowButton(false)
      setSelectedText('')
      setButtonPosition(null)
      return
    }

    const handleTextSelection = () => {
      const selection = window.getSelection()
      let text = ''
      let rect: DOMRect | null = null
      
      // 优先检查Monaco编辑器的选择
      const monacoEditors = document.querySelectorAll('.monaco-editor')
      let isMonacoSelection = false
      
      for (const editor of monacoEditors) {
        try {
          const monacoInstance = (editor as any)._monacoEditor
          if (monacoInstance) {
            const selection = monacoInstance.getSelection()
            if (selection && !selection.isEmpty()) {
              const selectedText = monacoInstance.getModel()?.getValueInRange(selection)
              if (selectedText && selectedText.trim().length >= 2) {
                text = selectedText.trim()
                isMonacoSelection = true
                
                // 获取Monaco编辑器选择的位置
                const editorRect = editor.getBoundingClientRect()
                const lineHeight = monacoInstance.getOption(58) || 20 // 行高
                const startLineNumber = selection.startLineNumber
                const endLineNumber = selection.endLineNumber
                
                // 估算选择区域的位置
                rect = new DOMRect(
                  editorRect.left + 100, // 编辑器左边距估算
                  editorRect.top + (startLineNumber - 1) * lineHeight + 50, // 基于行号估算位置
                  200, // 宽度估算
                  (endLineNumber - startLineNumber + 1) * lineHeight // 高度基于行数
                )
                break
              }
            }
          }
        } catch (e) {
          // Monaco编辑器检测失败，继续使用标准选择
          console.debug('Monaco selection detection failed:', e)
        }
      }
      
      // 如果不是Monaco选择，使用标准文本选择
      if (!isMonacoSelection) {
        if (!selection || selection.isCollapsed) {
          setSelectedText('')
          setButtonPosition(null)
          setShowButton(false)
          return
        }

        text = selection.toString().trim()
        if (text.length < 2) {
          setSelectedText('')
          setButtonPosition(null)
          setShowButton(false)
          return
        }

        // 检查选择是否在需要排除的区域内（但允许Monaco编辑器）
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer.parentElement
        
        // 只排除聊天相关区域，允许Monaco编辑器
        if (container?.closest('.no-select') ||
            container?.closest('.ai-chat-input') ||
            container?.closest('.message-content') ||
            container?.closest('.multi-tab-chat-input') ||
            container?.closest('.markdown-content')) {
          setSelectedText('')
          setButtonPosition(null)
          setShowButton(false)
          return
        }
        
        rect = range.getBoundingClientRect()
      }

      if (!text || !rect) {
        setSelectedText('')
        setButtonPosition(null)
        setShowButton(false)
        return
      }

      setSelectedText(text)

      // 计算按钮位置
      const buttonWidth = 120
      const buttonHeight = 36
      
      // 计算最佳位置（右上角，但要考虑边界）
      let x = rect.right + 10
      let y = rect.top - buttonHeight - 5
      
      // 边界检测
      if (x + buttonWidth > window.innerWidth - 20) {
        x = rect.left - buttonWidth - 10
      }
      if (y < 20) {
        y = rect.bottom + 5
      }
      
      setButtonPosition({ x, y })
      setShowButton(true)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const selection = window.getSelection()
        if (!selection?.toString().trim()) {
          setShowButton(false)
        }
      }
    }

    // 追踪鼠标位置作为后备
    const handleMouseMove = (e: MouseEvent) => {
      ;(window as any).lastMouseX = e.clientX
      ;(window as any).lastMouseY = e.clientY
    }

    // 监听文本选择
    document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('keyup', handleTextSelection)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('mousemove', handleMouseMove)
    
    // 监听选择变化
    document.addEventListener('selectionchange', () => {
      setTimeout(handleTextSelection, 50) // 延迟检查，确保选择已完成
    })

    // 专门为Monaco编辑器添加事件监听
    const setupMonacoListeners = () => {
      const monacoEditors = document.querySelectorAll('.monaco-editor')
      const listeners: (() => void)[] = []
      
      monacoEditors.forEach(editor => {
        try {
          const monacoInstance = (editor as any)._monacoEditor
          if (monacoInstance) {
            // 监听Monaco编辑器的选择变化
            const disposable = monacoInstance.onDidChangeCursorSelection(() => {
              setTimeout(handleTextSelection, 100)
            })
            listeners.push(() => disposable.dispose())
          }
        } catch (e) {
          console.debug('Failed to setup Monaco listeners:', e)
        }
      })
      
      return () => {
        listeners.forEach(cleanup => cleanup())
      }
    }
    
    const cleanupMonaco = setupMonacoListeners()
    
    // 定期重新设置Monaco监听器（防止编辑器动态加载）
    const monacoInterval = setInterval(setupMonacoListeners, 2000)

    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
      document.removeEventListener('keyup', handleTextSelection)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('mousemove', handleMouseMove)
      cleanupMonaco()
      clearInterval(monacoInterval)
    }
  }, [isActive])

  const handleQuery = () => {
    if (selectedText) {
      onTextQuery(selectedText)
      setShowButton(false)
      
      // 清除选择
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleQuery()
  }

  if (!showButton || !buttonPosition) {
    return null
  }

  return (
    <div
      ref={buttonRef}
      className="fixed z-[10000] transform -translate-x-1/2 -translate-y-full"
      style={{
        left: Math.min(Math.max(buttonPosition.x, 80), window.innerWidth - 80),
        top: Math.max(buttonPosition.y, 80),
        pointerEvents: 'auto',
        zIndex: 99999
      }}
    >
      <div 
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105 animate-fadeInUp"
        onClick={handleButtonClick}
        onMouseDown={handleButtonMouseDown}
        style={{ 
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-sm font-medium">随意搜</span>
          <span className="text-sm">🔍</span>
        </div>
      </div>
      
      {/* 小箭头 */}
      <div className="absolute left-1/2 top-full transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-purple-500"></div>
      
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-100%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(-100%) translateY(0);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.3s ease-out;
          }
        `}
      </style>
    </div>
  )
} 