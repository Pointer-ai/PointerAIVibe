import React, { useState, useEffect } from 'react'
import { CodeEditor } from './CodeEditor'
import { ExecutionOutputPanel } from './OutputPanel'
import { useLanguageRuntime } from '../context/RuntimeContext'
import type { IntegratedCodeRunnerProps, CodeExecution, SupportedLanguage, CODE_EXAMPLES } from '../types'

export const IntegratedCodeRunner: React.FC<IntegratedCodeRunnerProps> = ({
  language,
  initialCode = '',
  theme = 'dark',
  height = '400px',
  readOnly = false,
  showExamples = true,
  onCodeChange,
  onExecutionResult,
  className = ''
}) => {
  const [code, setCode] = useState(initialCode)
  const [currentExecution, setCurrentExecution] = useState<CodeExecution | undefined>()
  const [isExecuting, setIsExecuting] = useState(false)
  const [showExampleList, setShowExampleList] = useState(false)
  
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

  // 同步外部传入的 initialCode
  useEffect(() => {
    if (initialCode && initialCode !== code) {
      setCode(initialCode)
    }
  }, [initialCode])

  // 自动初始化运行时
  useEffect(() => {
    if (!status?.isReady && !status?.isLoading) {
      initialize().catch(err => {
        console.error(`Failed to initialize ${language} runtime:`, err)
      })
    }
  }, [language, status?.isReady, status?.isLoading])

  // 运行代码
  const handleRun = async () => {
    if (isExecuting || !code.trim()) return

    try {
      setIsExecuting(true)
      const execution = await execute(code)
      setCurrentExecution(execution)
      onExecutionResult?.(execution)
    } catch (error) {
      console.error('Failed to execute code:', error)
      const errorExecution: CodeExecution = {
        id: Date.now().toString(),
        code,
        language,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }
      setCurrentExecution(errorExecution)
      onExecutionResult?.(errorExecution)
    } finally {
      setIsExecuting(false)
    }
  }

  // 获取语言示例
  const getLanguageExamples = () => {
    // 这里需要从 types 中导入 CODE_EXAMPLES
    // 暂时使用本地示例
    const examples = [
      {
        id: `${language}-hello`,
        title: `${language} Hello World`,
        code: language === 'python' ? 'print("Hello, World!")' : 
              language === 'javascript' ? 'console.log("Hello, World!");' :
              '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
      },
      // 可以添加更多示例
    ]
    return examples
  }

  // 加载示例代码
  const loadExample = (exampleCode: string) => {
    setCode(exampleCode)
    setShowExampleList(false)
    onCodeChange?.(exampleCode)
  }

  // 清除输出
  const handleClearOutput = () => {
    setCurrentExecution(undefined)
  }

  // 获取语言显示信息
  const getLanguageInfo = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'javascript':
        return { icon: '🟨', name: 'JavaScript', color: 'text-yellow-600' }
      case 'python':
        return { icon: '🐍', name: 'Python', color: 'text-blue-600' }
      case 'cpp':
        return { icon: '⚡', name: 'C++', color: 'text-green-600' }
    }
  }

  const languageInfo = getLanguageInfo(language)
  const isReady = status?.isReady
  const isLoading = status?.isLoading

  // 获取运行按钮状态
  const getRunButtonStatus = () => {
    if (isExecuting) return { text: '运行中...', disabled: true, className: 'bg-blue-500' }
    if (isLoading) return { text: '初始化中...', disabled: true, className: 'bg-yellow-500' }
    if (!isReady) return { text: '准备中...', disabled: true, className: 'bg-gray-500' }
    if (!code.trim()) return { text: '请输入代码', disabled: true, className: 'bg-gray-500' }
    
    return { 
      text: `运行 ${languageInfo.name}`, 
      disabled: false, 
      className: 'bg-green-600 hover:bg-green-700' 
    }
  }

  const runButtonStatus = getRunButtonStatus()

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* 头部控制栏 */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${languageInfo.color}`}>
              {languageInfo.icon} {languageInfo.name}
            </span>
            {status?.version && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                v{status.version}
              </span>
            )}
            {status?.error && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                运行时错误
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showExamples && (
              <div className="relative">
                <button
                  onClick={() => setShowExampleList(!showExampleList)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  示例
                </button>
                {showExampleList && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                    {getLanguageExamples().map((example) => (
                      <button
                        key={example.id}
                        onClick={() => loadExample(example.code)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {example.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {!readOnly && (
              <button
                onClick={handleRun}
                disabled={runButtonStatus.disabled}
                className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${runButtonStatus.className} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {runButtonStatus.text}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 代码编辑器 */}
      <div className="relative">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          onRun={!readOnly ? handleRun : undefined}
          language={language}
          theme={theme}
          readOnly={readOnly}
          height={height}
          className="border-0 rounded-none"
        />
      </div>

      {/* 输出面板 */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <ExecutionOutputPanel
          execution={currentExecution}
          loading={isExecuting}
          language={language}
          onClear={handleClearOutput}
          className="p-4"
        />
      </div>
    </div>
  )
}

// 预配置的语言特定组件
export const PythonRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner {...props} language="python" />
)

export const JavaScriptRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner {...props} language="javascript" />
)

export const CppRunner: React.FC<Omit<IntegratedCodeRunnerProps, 'language'>> = (props) => (
  <IntegratedCodeRunner {...props} language="cpp" />
)

// 紧凑版代码运行器
export const CompactCodeRunner: React.FC<IntegratedCodeRunnerProps> = (props) => (
  <IntegratedCodeRunner 
    {...props} 
    height="200px"
    showExamples={false}
    className="shadow-sm"
  />
)

// 只读代码展示器
export const CodeDisplay: React.FC<IntegratedCodeRunnerProps> = (props) => (
  <IntegratedCodeRunner 
    {...props} 
    readOnly={true}
    showExamples={false}
    className="shadow-sm"
  />
) 