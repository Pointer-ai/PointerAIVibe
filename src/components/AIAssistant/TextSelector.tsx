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

    const handleSelection = () => {
      // 获取当前选择的文本
      const selection = window.getSelection()
      let text = selection?.toString().trim() || ''
      let rect: DOMRect | null = null

      // 如果标准选择没有文本，检查是否在Monaco Editor等特殊编辑器中
      if (!text) {
        // 检查Monaco Editor
        const monacoElements = document.querySelectorAll('.monaco-editor')
        monacoElements.forEach(monacoEl => {
          if (monacoEl.contains(document.activeElement)) {
            // 尝试从Monaco Editor获取选中文本
            try {
              const monacoInstance = (monacoEl as any).__monaco_editor_instance
              if (monacoInstance) {
                const selectedText = monacoInstance.getModel()?.getValueInRange(monacoInstance.getSelection())
                if (selectedText && selectedText.trim()) {
                  text = selectedText.trim()
                  // 使用Monaco Editor的选择位置
                  const domNode = monacoInstance.getDomNode()
                  if (domNode) {
                    rect = domNode.getBoundingClientRect()
                  }
                }
              }
            } catch (e) {
              // Monaco实例获取失败，继续使用标准方法
            }
          }
        })

        // 检查其他可能的代码编辑器
        const codeElements = document.querySelectorAll('textarea, .CodeMirror, .ace_editor, [contenteditable="true"]')
        codeElements.forEach(el => {
          if (el.contains(document.activeElement) || el === document.activeElement) {
            if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
              const start = el.selectionStart || 0
              const end = el.selectionEnd || 0
              if (start !== end) {
                text = el.value.substring(start, end).trim()
                rect = el.getBoundingClientRect()
              }
            }
          }
        })
      } else {
        // 标准选择，获取选择范围的位置
        const range = selection?.getRangeAt(0)
        if (range) {
          rect = range.getBoundingClientRect()
        }
      }

      // 检查文本长度和有效性
      if (text && text.length > 2 && text.length < 500) {
        setSelectedText(text)
        
        if (rect && rect.width > 0 && rect.height > 0) {
          const x = rect.left + rect.width / 2
          const y = rect.top - 10
          
          setButtonPosition({ x, y })
          setShowButton(true)
        } else {
          // 如果无法获取位置，使用鼠标位置作为后备
          const mouseX = (window as any).lastMouseX || window.innerWidth / 2
          const mouseY = (window as any).lastMouseY || 100
          setButtonPosition({ x: mouseX, y: mouseY - 40 })
          setShowButton(true)
        }
      } else {
        setShowButton(false)
      }
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
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('mousemove', handleMouseMove)
    
    // 监听选择变化
    document.addEventListener('selectionchange', () => {
      setTimeout(handleSelection, 50) // 延迟检查，确保选择已完成
    })

    // 特殊处理：监听Monaco Editor的选择变化
    const handleMonacoSelection = () => {
      setTimeout(handleSelection, 100)
    }
    document.addEventListener('monacoSelectionChange', handleMonacoSelection)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('keyup', handleSelection)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('monacoSelectionChange', handleMonacoSelection)
    }
  }, [isActive])

  const handleQuery = () => {
    if (selectedText) {
      log('[TextSelector] Query triggered for:', selectedText.substring(0, 50))
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