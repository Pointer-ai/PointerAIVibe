import React, { useState, useEffect } from 'react'

interface MarkdownRendererProps {
  content: string
  onHighlight?: (text: string, position: number) => void
  highlights?: Array<{ text: string; position: number }>
  readingProgress?: number
  onProgressUpdate?: (progress: number) => void
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onHighlight,
  highlights = [],
  readingProgress = 0,
  onProgressUpdate
}) => {
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightTooltip, setShowHighlightTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)
      
      // 获取选择区域的位置
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowHighlightTooltip(true)
    } else {
      setShowHighlightTooltip(false)
    }
  }

  // 添加高亮
  const addHighlight = () => {
    if (selectedText && onHighlight) {
      onHighlight(selectedText, 0) // position可以根据需要计算
      setShowHighlightTooltip(false)
      window.getSelection()?.removeAllRanges()
    }
  }

  // 增强的Markdown渲染
  const renderMarkdown = (markdown: string) => {
    let htmlContent = markdown
      // 标题
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-4 text-gray-800 mt-8">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-3 text-gray-700 mt-6">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-medium mb-2 text-gray-600 mt-4">$1</h4>')
      
      // 文本样式
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-700">$1</em>')
      .replace(/~~(.*?)~~/gim, '<del class="line-through text-gray-500">$1</del>')
      
      // 代码块
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
        const language = lang || 'text'
        return `
          <div class="my-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center justify-between">
              <span class="font-medium">${language.toUpperCase()}</span>
              <button onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)" class="text-blue-600 hover:text-blue-800 text-xs">
                复制代码
              </button>
            </div>
            <pre class="p-4 overflow-x-auto"><code class="language-${language} text-sm leading-relaxed">${code}</code></pre>
          </div>
        `
      })
      
      // 行内代码
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // 列表
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 relative"><span class="absolute -left-4 text-blue-600">•</span>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
      
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // 引用
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">$1</blockquote>')
      
      // 水平线
      .replace(/^---$/gim, '<hr class="my-8 border-t-2 border-gray-200">')
      
      // 段落
      .replace(/\n\n/gim, '</p><p class="mb-4 leading-relaxed text-gray-700">')
      
    // 包装在段落中
    htmlContent = `<p class="mb-4 leading-relaxed text-gray-700">${htmlContent}</p>`
    
    return { __html: htmlContent }
  }

  // 阅读进度计算
  useEffect(() => {
    const handleScroll = () => {
      if (onProgressUpdate) {
        const element = document.getElementById('markdown-content')
        if (element) {
          const scrollTop = window.pageYOffset
          const elementTop = element.offsetTop
          const elementHeight = element.offsetHeight
          const windowHeight = window.innerHeight
          
          const progress = Math.min(
            Math.max((scrollTop - elementTop + windowHeight) / elementHeight, 0),
            1
          )
          
          onProgressUpdate(Math.round(progress * 100))
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onProgressUpdate])

  return (
    <div className="relative">
      {/* 阅读进度条 */}
      {onProgressUpdate && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* 主要内容 */}
      <div
        id="markdown-content"
        className="prose prose-lg max-w-none"
        onMouseUp={handleTextSelection}
        dangerouslySetInnerHTML={renderMarkdown(content)}
      />

      {/* 高亮工具提示 */}
      {showHighlightTooltip && (
        <div
          className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm shadow-lg transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <button
            onClick={addHighlight}
            className="flex items-center space-x-1 hover:text-yellow-300"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>添加高亮</span>
          </button>
        </div>
      )}

      {/* 高亮显示 */}
      {highlights.length > 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">我的高亮</h4>
          <ul className="space-y-2">
            {highlights.map((highlight, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start">
                <span className="text-yellow-600 mr-2">★</span>
                {highlight.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 学习助手功能 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📝 笔记工具</h4>
          <p className="text-sm text-blue-700">选中文本可以添加高亮和笔记</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">⏱️ 学习统计</h4>
          <p className="text-sm text-green-700">自动追踪阅读进度和学习时间</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">🎯 重点标记</h4>
          <p className="text-sm text-purple-700">标记重要内容，便于后续复习</p>
        </div>
      </div>
    </div>
  )
} 