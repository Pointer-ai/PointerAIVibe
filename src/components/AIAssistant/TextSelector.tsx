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
          // 尝试从多个位置获取Monaco实例
          let monacoInstance = (editor as any)._monacoEditor
          if (!monacoInstance) {
            // 尝试从编辑器的直接子元素获取
            const editorChildren = editor.children
            for (let i = 0; i < editorChildren.length; i++) {
              const child = editorChildren[i] as any
              if (child._monacoEditor) {
                monacoInstance = child._monacoEditor
                break
              }
            }
          }
          
          if (monacoInstance) {
            const monacoSelection = monacoInstance.getSelection()
            if (monacoSelection && !monacoSelection.isEmpty()) {
              const selectedText = monacoInstance.getModel()?.getValueInRange(monacoSelection)
              if (selectedText && selectedText.trim().length >= 2) {
                text = selectedText.trim()
                isMonacoSelection = true
                
                // 获取Monaco编辑器选择的更精确位置
                const editorRect = editor.getBoundingClientRect()
                
                try {
                  // 尝试获取更精确的选择位置
                  const layoutInfo = monacoInstance.getLayoutInfo()
                  // 修复：正确获取行高，使用数字类型
                  const lineHeight = monacoInstance.getOption(/* LineHeight */ 58) || 20
                  const actualLineHeight = typeof lineHeight === 'number' ? lineHeight : 20
                  
                  const startLineNumber = monacoSelection.startLineNumber
                  const startColumn = monacoSelection.startColumn
                  const endLineNumber = monacoSelection.endLineNumber
                  
                  // 计算选择区域的相对位置
                  const scrollTop = monacoInstance.getScrollTop() || 0
                  const scrollLeft = monacoInstance.getScrollLeft() || 0
                  
                  // 安全的位置计算，确保所有值都是有效数字
                  const contentLeft = layoutInfo?.contentLeft || 0
                  const contentTop = layoutInfo?.contentTop || 0
                  
                  // 基于行号和列号估算位置
                  const estimatedX = editorRect.left + contentLeft + (startColumn - 1) * 8 - scrollLeft
                  const estimatedY = editorRect.top + contentTop + (startLineNumber - 1) * actualLineHeight - scrollTop
                  
                  // 确保所有计算出的值都是有效数字
                  if (isNaN(estimatedX) || isNaN(estimatedY)) {
                    throw new Error('Invalid position calculation')
                  }
                  
                  rect = new DOMRect(
                    Math.max(editorRect.left, estimatedX),
                    Math.max(editorRect.top, estimatedY),
                    Math.min(200, selectedText.length * 8), // 基于文本长度估算宽度
                    (endLineNumber - startLineNumber + 1) * actualLineHeight
                  )
                } catch (layoutError) {
                  // 使用简单的位置估算作为后备
                  const lineHeight = 20
                  const startLineNumber = monacoSelection.startLineNumber || 1
                  const endLineNumber = monacoSelection.endLineNumber || 1
                  
                  // 使用编辑器容器的简单位置计算
                  rect = new DOMRect(
                    editorRect.left + 100,
                    editorRect.top + Math.max(0, (startLineNumber - 1) * lineHeight) + 50,
                    200,
                    Math.max(lineHeight, (endLineNumber - startLineNumber + 1) * lineHeight)
                  )
                }
                break
              }
            }
          }
        } catch (e) {
          // 静默处理错误，继续检查下一个编辑器
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

      // 验证rect的有效性
      if (isNaN(rect.x) || isNaN(rect.y) || isNaN(rect.width) || isNaN(rect.height)) {
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

    // 监听Monaco编辑器的自定义选择变化事件
    const handleMonacoSelectionChange = (event: CustomEvent) => {
      setTimeout(handleTextSelection, 100) // 延迟检查Monaco选择
    }
    
    document.addEventListener('monaco-selection-change', handleMonacoSelectionChange as EventListener)

    // 专门为Monaco编辑器添加事件监听
    const setupMonacoListeners = () => {
      const monacoEditors = document.querySelectorAll('.monaco-editor')
      const listeners: (() => void)[] = []
      
      monacoEditors.forEach((editor, index) => {
        try {
          // 尝试从多个位置获取Monaco实例
          let monacoInstance = (editor as any)._monacoEditor
          if (!monacoInstance) {
            // 尝试从编辑器的直接子元素获取
            const editorChildren = editor.children
            for (let i = 0; i < editorChildren.length; i++) {
              const child = editorChildren[i] as any
              if (child._monacoEditor) {
                monacoInstance = child._monacoEditor
                break
              }
            }
          }
          
          if (monacoInstance) {
            // 监听Monaco编辑器的选择变化
            const disposable = monacoInstance.onDidChangeCursorSelection(() => {
              setTimeout(handleTextSelection, 100)
            })
            listeners.push(() => disposable.dispose())
          }
        } catch (e) {
          // 静默处理错误
        }
      })
      
      return () => {
        listeners.forEach(cleanup => cleanup())
      }
    }
    
    const cleanupMonaco = setupMonacoListeners()
    
    // 定期重新设置Monaco监听器（防止编辑器动态加载）
    const monacoInterval = setInterval(() => {
      setupMonacoListeners()
    }, 2000)

    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
      document.removeEventListener('keyup', handleTextSelection)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('monaco-selection-change', handleMonacoSelectionChange as EventListener)
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