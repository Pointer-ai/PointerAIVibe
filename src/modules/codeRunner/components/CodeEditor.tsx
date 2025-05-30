import React, { useRef, useEffect } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  language?: 'python' | 'cpp' | 'javascript'
  theme?: 'light' | 'dark'
  readOnly?: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onRun,
  language = 'python',
  readOnly = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 处理 Tab 键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = value.substring(0, start) + '    ' + value.substring(end)
        onChange(newValue)
        
        // 恢复光标位置
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4
        }, 0)
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onRun?.()
    }
  }

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [value])

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 text-xs text-gray-500">
        {language.toUpperCase()}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder="在此输入代码..."
        className={`
          w-full p-4 pr-16
          font-mono text-sm leading-relaxed
          bg-gray-900 text-gray-100
          border border-gray-700 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          resize-none overflow-hidden
          ${readOnly ? 'cursor-not-allowed opacity-75' : ''}
        `}
        style={{
          minHeight: '200px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace'
        }}
      />
      
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500">
          提示：按 Tab 键缩进，按 Ctrl/Cmd + Enter 运行代码
        </div>
      )}
    </div>
  )
} 