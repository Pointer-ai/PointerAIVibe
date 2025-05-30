import React from 'react'
import { CodeExecution } from '../types'

interface OutputPanelProps {
  execution?: CodeExecution
  loading?: boolean
  language?: 'python' | 'cpp' | 'javascript'
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ execution, loading, language }) => {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">
            {language === 'cpp' ? '正在编译代码，请耐心等待...' : '正在运行代码...'}
          </span>
        </div>
        {language === 'cpp' && (
          <div className="mt-3 text-center text-xs text-amber-600">
            C++ 前端编译较慢，预计需要 2-5 秒
          </div>
        )}
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        运行代码后，输出将显示在这里
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 状态和执行时间 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {execution.status === 'success' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-green-700">运行成功</span>
            </>
          )}
          {execution.status === 'error' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-red-700">运行出错</span>
            </>
          )}
          {execution.status === 'running' && (
            <>
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700">运行中</span>
            </>
          )}
        </div>
        
        {execution.executionTime !== undefined && (
          <span className="text-gray-500">
            执行时间: {execution.executionTime}ms
          </span>
        )}
      </div>

      {/* 输出内容 */}
      {execution.status === 'success' && execution.output && (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
          <div className="text-xs text-gray-500 mb-2">输出:</div>
          <pre className="whitespace-pre-wrap">{execution.output}</pre>
        </div>
      )}

      {/* 错误信息 */}
      {execution.status === 'error' && execution.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">错误:</div>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{execution.error}</pre>
        </div>
      )}

      {/* 代码 */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          查看代码
        </summary>
        <div className="mt-2 bg-gray-100 rounded-lg p-3">
          <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
            {execution.code}
          </pre>
        </div>
      </details>
    </div>
  )
} 