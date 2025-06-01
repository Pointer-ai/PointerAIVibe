import React from 'react'
import type { OutputPanelProps, CodeExecution, SupportedLanguage } from '../types'

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  output,
  isLoading,
  hasError,
  onClear,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            正在运行代码...
          </span>
        </div>
      </div>
    )
  }

  if (!output) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        运行代码后，输出将显示在这里
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 输出头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasError ? (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-red-700 dark:text-red-400 text-sm font-medium">执行错误</span>
            </>
          ) : (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-green-700 dark:text-green-400 text-sm font-medium">执行成功</span>
            </>
          )}
        </div>
        
        {onClear && (
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {/* 输出内容 */}
      <div className={`rounded-lg p-4 font-mono text-sm ${
        hasError 
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          : 'bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-200'
      }`}>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {hasError ? '错误信息:' : '输出:'}
        </div>
        <pre className="whitespace-pre-wrap overflow-x-auto">{output}</pre>
      </div>
    </div>
  )
}

// 扩展组件：带执行信息的输出面板
interface ExecutionOutputPanelProps {
  execution?: CodeExecution
  loading?: boolean
  language?: SupportedLanguage
  onClear?: () => void
  className?: string
}

export const ExecutionOutputPanel: React.FC<ExecutionOutputPanelProps> = ({ 
  execution, 
  loading,
  language,
  onClear,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            {language === 'cpp' ? '正在编译代码，请耐心等待...' : '正在运行代码...'}
          </span>
        </div>
        {language === 'cpp' && (
          <div className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
            C++ 前端编译较慢，预计需要 2-5 秒
          </div>
        )}
      </div>
    )
  }

  if (!execution) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        运行代码后，输出将显示在这里
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 状态和执行时间 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {execution.status === 'success' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-green-700 dark:text-green-400">运行成功</span>
            </>
          )}
          {execution.status === 'error' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-red-700 dark:text-red-400">运行出错</span>
            </>
          )}
          {execution.status === 'running' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 dark:text-blue-400">运行中</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {execution.executionTime !== undefined && (
            <span className="text-gray-500 dark:text-gray-400">
              执行时间: {execution.executionTime}ms
            </span>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 输出内容 */}
      {execution.status === 'success' && execution.output && (
        <div className="bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-200 rounded-lg p-4 font-mono text-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">输出:</div>
          <pre className="whitespace-pre-wrap overflow-x-auto">{execution.output}</pre>
        </div>
      )}

      {/* 错误信息 */}
      {execution.status === 'error' && execution.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">错误:</div>
          <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap overflow-x-auto">{execution.error}</pre>
        </div>
      )}

      {/* 代码 */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          查看代码
        </summary>
        <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
            {execution.code}
          </pre>
        </div>
      </details>
    </div>
  )
} 