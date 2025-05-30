import React, { useState, useEffect } from 'react'
import { CodeEditor } from './CodeEditor'
import { OutputPanel } from './OutputPanel'
import { useLanguageRuntime } from '../context/RuntimeContext'
import { CodeExecution } from '../types'

type SupportedLanguage = 'python' | 'cpp' | 'javascript'

export interface IntegratedCodeRunnerProps {
  /**
   * 编程语言
   */
  language: SupportedLanguage
  
  /**
   * 初始代码
   */
  initialCode?: string
  
  /**
   * 编辑器主题
   */
  theme?: 'light' | 'dark'
  
  /**
   * 编辑器高度
   */
  height?: string
  
  /**
   * 是否只读模式
   */
  readOnly?: boolean
  
  /**
   * 是否显示语言标签
   */
  showLanguageLabel?: boolean
  
  /**
   * 是否显示运行按钮
   */
  showRunButton?: boolean
  
  /**
   * 是否显示输出面板
   */
  showOutput?: boolean
  
  /**
   * 是否自动初始化运行时
   */
  autoInitialize?: boolean
  
  /**
   * 自定义运行按钮文本
   */
  runButtonText?: string
  
  /**
   * 代码变更回调
   */
  onCodeChange?: (code: string) => void
  
  /**
   * 运行前回调
   */
  onBeforeRun?: (code: string) => boolean | Promise<boolean>
  
  /**
   * 运行完成回调
   */
  onRunComplete?: (execution: CodeExecution) => void
  
  /**
   * 错误回调
   */
  onError?: (error: Error) => void
  
  /**
   * 自定义样式类名
   */
  className?: string
  
  /**
   * 禁用运行功能
   */
  disabled?: boolean
}

export const IntegratedCodeRunner: React.FC<IntegratedCodeRunnerProps> = ({
  language,
  initialCode = '',
  theme = 'dark',
  height = '300px',
  readOnly = false,
  showLanguageLabel = true,
  showRunButton = true,
  showOutput = true,
  autoInitialize = true,
  runButtonText,
  onCodeChange,
  onBeforeRun,
  onRunComplete,
  onError,
  className = '',
  disabled = false
}) => {
  const [code, setCode] = useState(initialCode)
  const [currentExecution, setCurrentExecution] = useState<CodeExecution | undefined>()
  const [isExecuting, setIsExecuting] = useState(false)
  
  const {
    status,
    initialize,
    execute
  } = useLanguageRuntime(language)

  // 更新代码
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    onCodeChange?.(newCode)
  }

  // 自动初始化运行时
  useEffect(() => {
    if (autoInitialize && !status?.isReady && !status?.isLoading) {
      initialize().catch(err => {
        console.error(`Failed to initialize ${language} runtime:`, err)
        onError?.(err)
      })
    }
  }, [autoInitialize, language, status?.isReady, status?.isLoading])

  // 运行代码
  const handleRun = async () => {
    if (isExecuting || disabled || !code.trim()) return

    try {
      // 运行前回调
      if (onBeforeRun) {
        const shouldContinue = await onBeforeRun(code)
        if (!shouldContinue) return
      }

      setIsExecuting(true)
      const execution = await execute(code)
      setCurrentExecution(execution)
      onRunComplete?.(execution)
    } catch (error) {
      console.error('Failed to execute code:', error)
      onError?.(error as Error)
    } finally {
      setIsExecuting(false)
    }
  }

  // 获取语言显示信息
  const getLanguageInfo = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'javascript':
        return { icon: '🚀', name: 'JavaScript', color: 'bg-yellow-500' }
      case 'python':
        return { icon: '🐍', name: 'Python', color: 'bg-blue-500' }
      case 'cpp':
        return { icon: '⚡', name: 'C++', color: 'bg-green-500' }
    }
  }

  const languageInfo = getLanguageInfo(language)
  const isReady = status?.isReady
  const isLoading = status?.isLoading
  const hasError = !!status?.error

  // 获取运行按钮状态
  const getRunButtonStatus = () => {
    if (disabled) return { text: '已禁用', disabled: true, className: 'bg-gray-400' }
    if (isExecuting) return { text: '运行中...', disabled: true, className: 'bg-blue-400' }
    if (isLoading) return { text: '初始化中...', disabled: true, className: 'bg-yellow-400' }
    if (hasError) return { text: '运行时错误', disabled: true, className: 'bg-red-400' }
    if (!isReady) return { text: '未就绪', disabled: true, className: 'bg-gray-400' }
    if (!code.trim()) return { text: '请输入代码', disabled: true, className: 'bg-gray-400' }
    
    return { 
      text: runButtonText || `运行 ${languageInfo.name}`, 
      disabled: false, 
      className: 'bg-blue-500 hover:bg-blue-600' 
    }
  }

  const runButtonStatus = getRunButtonStatus()

  return (
    <div className={`integrated-code-runner ${className}`}>
      {/* 头部：语言标签和运行按钮 */}
      {(showLanguageLabel || showRunButton) && (
        <div className="flex items-center justify-between mb-3">
          {showLanguageLabel && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{languageInfo.icon}</span>
              <span className="font-medium text-gray-700">{languageInfo.name}</span>
              {status?.version && (
                <span className="text-xs text-gray-500">({status.version})</span>
              )}
              
              {/* 状态指示器 */}
              <div className="flex items-center gap-1">
                {isLoading && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
                {isReady && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
                {hasError && (
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                )}
              </div>
            </div>
          )}
          
          {showRunButton && (
            <button
              onClick={handleRun}
              disabled={runButtonStatus.disabled}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${runButtonStatus.className}`}
            >
              {runButtonStatus.text}
            </button>
          )}
        </div>
      )}

      {/* 运行时状态提示 */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-700 text-sm">
              正在初始化 {languageInfo.name} 运行环境...
            </span>
          </div>
          {language === 'cpp' && (
            <div className="mt-1 text-xs text-blue-600">
              C++ 环境加载较慢，请耐心等待
            </div>
          )}
        </div>
      )}

      {hasError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            <strong>运行时错误：</strong>{status?.error}
          </div>
          <button
            onClick={() => initialize()}
            className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
          >
            重试初始化
          </button>
        </div>
      )}

      {/* 代码编辑器 */}
      <div className="mb-4">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          onRun={showRunButton ? handleRun : undefined}
          language={language}
          theme={theme}
          readOnly={readOnly}
        />
      </div>

      {/* 输出面板 */}
      {showOutput && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-medium text-gray-700">输出结果</h3>
          </div>
          <div className="p-4">
            <OutputPanel 
              execution={currentExecution} 
              loading={isExecuting}
              language={language}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 预设配置的便捷组件
export const PythonRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner language="python" {...props} />
)

export const JavaScriptRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner language="javascript" {...props} />
)

export const CppRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner language="cpp" {...props} />
)

// 轻量级版本（仅编辑器和运行按钮）
export const CompactCodeRunner: React.FC<IntegratedCodeRunnerProps> = (props) => (
  <IntegratedCodeRunner 
    {...props} 
    showLanguageLabel={false}
    showOutput={false}
    height="200px"
  />
)

// 只读展示版本
export const CodeDisplay: React.FC<IntegratedCodeRunnerProps> = (props) => (
  <IntegratedCodeRunner 
    {...props} 
    readOnly={true}
    showRunButton={false}
    showOutput={false}
  />
) 