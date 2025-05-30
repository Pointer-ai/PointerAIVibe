import React, { useState, useEffect } from 'react'
import { CodeEditor } from './components/CodeEditor'
import { OutputPanel } from './components/OutputPanel'
import { 
  initRuntime,
  runCode,
  getRuntimeStatus,
  getLanguageExecutionHistory,
  cleanup,
  preloadRuntime
} from './service'
import { CODE_EXAMPLES, CodeExecution } from './types'
import { log, error } from '../../utils/logger'

type SupportedLanguage = 'python' | 'cpp' | 'javascript'

export const CodeRunnerView: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript') // 默认JavaScript最快
  const [code, setCode] = useState('')
  const [selectedExample, setSelectedExample] = useState('')
  const [runtimeStatus, setRuntimeStatus] = useState(getRuntimeStatus())
  const [isRunning, setIsRunning] = useState(false)
  const [currentExecution, setCurrentExecution] = useState<CodeExecution | undefined>()
  const [executionHistory, setExecutionHistory] = useState<CodeExecution[]>([])

  // 获取当前语言的示例
  const currentLanguageExamples = CODE_EXAMPLES.filter(example => example.language === selectedLanguage)

  // 初始化时设置第一个示例
  useEffect(() => {
    const firstExample = currentLanguageExamples[0]
    if (firstExample && !selectedExample) {
      setSelectedExample(firstExample.id)
      setCode(firstExample.code)
    }
  }, [currentLanguageExamples, selectedExample])

  // 预热运行时环境（可选的性能优化）
  useEffect(() => {
    // 预热 JavaScript 运行时（最快）
    preloadRuntime('javascript').catch(err => {
      error('[CodeRunnerView] Failed to preload JavaScript runtime', err)
    })
  }, [])

  // 语言切换时更新代码示例和运行时
  useEffect(() => {
    const firstExample = currentLanguageExamples[0]
    if (firstExample) {
      setSelectedExample(firstExample.id)
      setCode(firstExample.code)
    }
    
    // 清空当前执行结果
    setCurrentExecution(undefined)
    
    // 更新执行历史
    setExecutionHistory(getLanguageExecutionHistory(selectedLanguage))
    
    // 更新运行时状态
    setRuntimeStatus(getRuntimeStatus())
    
    // Lazy loading：只在切换到某语言时才初始化（如果需要）
    const currentStatus = getRuntimeStatus()[selectedLanguage]
    if (!currentStatus?.isReady && !currentStatus?.isLoading) {
      log(`[CodeRunnerView] Preloading ${selectedLanguage} runtime`)
      preloadRuntime(selectedLanguage).catch(err => {
        error(`[CodeRunnerView] Failed to preload ${selectedLanguage} runtime`, err)
      })
    }
  }, [selectedLanguage])

  // 监听运行时状态变化
  useEffect(() => {
    const interval = setInterval(() => {
      setRuntimeStatus(getRuntimeStatus())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // 清理资源
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // 运行代码
  const handleRun = async () => {
    if (isRunning) return

    setIsRunning(true)
    try {
      const execution = await runCode(code, selectedLanguage)
      setCurrentExecution(execution)
      setExecutionHistory(getLanguageExecutionHistory(selectedLanguage))
      setRuntimeStatus(getRuntimeStatus()) // 更新状态
    } catch (err) {
      error('[CodeRunnerView] Failed to run code', err)
    } finally {
      setIsRunning(false)
    }
  }

  // 选择示例
  const handleSelectExample = (exampleId: string) => {
    const example = CODE_EXAMPLES.find(e => e.id === exampleId)
    if (example) {
      setSelectedExample(exampleId)
      setCode(example.code)
    }
  }

  // 切换语言
  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language)
  }

  // 获取语言显示信息
  const getLanguageInfo = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'javascript':
        return { icon: '🚀', name: 'JavaScript', description: '最快启动' }
      case 'python':
        return { icon: '🐍', name: 'Python', description: '丰富库支持' }
      case 'cpp':
        return { icon: '⚡', name: 'C++', description: '教学演示（较慢）' }
    }
  }

  const currentStatus = runtimeStatus[selectedLanguage]
  const currentLangInfo = getLanguageInfo(selectedLanguage)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">多语言代码运行器</h1>
          <p className="mt-2 text-gray-600">
            在浏览器中运行多种编程语言，支持 Lazy Loading 和实例缓存优化
          </p>
        </div>

        {/* 语言选择器 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">选择编程语言</h2>
          <div className="flex gap-3">
            {(['javascript', 'python', 'cpp'] as SupportedLanguage[]).map(lang => {
              const langInfo = getLanguageInfo(lang)
              const status = runtimeStatus[lang]
              
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`relative px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{langInfo.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{langInfo.name}</div>
                      <div className="text-xs opacity-75">{langInfo.description}</div>
                    </div>
                  </div>
                  
                  {/* 状态指示器 */}
                  {status?.isLoading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                  {status?.isReady && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
                  )}
                  {status?.error && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* C++性能说明 */}
          {selectedLanguage === 'cpp' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <div>
                  <h3 className="font-medium text-amber-800 mb-2">C++ 前端编译说明</h3>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>• 前端编译情况相对复杂，编译和运行速度较慢</p>
                    <p>• 主要用于教学演示，占用浏览器编译资源</p>
                    <p>• 性能表现一般，请理解并耐心等待</p>
                    <p>• 如需快速体验，建议选择 JavaScript 或 Python</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 运行时状态 */}
        {currentStatus?.isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-blue-700">
                  正在加载 {currentLangInfo.name} 运行环境...
                </span>
              </div>
              
              {/* 如果是C++且加载时间超过10秒，显示提示 */}
              {selectedLanguage === 'cpp' && (
                <div className="text-xs text-blue-600">
                  首次加载可能需要几秒钟...
                </div>
              )}
            </div>
            
            {/* 进度提示 */}
            {selectedLanguage === 'cpp' && (
              <div className="mt-2 text-xs text-blue-600">
                正在连接在线编译服务，首次编译需要较长时间...
              </div>
            )}
          </div>
        )}

        {currentStatus?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-red-700">加载失败: {currentStatus.error}</span>
                
                {/* 针对C++的特殊说明 */}
                {selectedLanguage === 'cpp' && (
                  <div className="mt-2 text-sm text-red-600">
                    <div>可能的原因：</div>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>网络连接问题</li>
                      <li>在线编译服务不可用</li>
                      <li>防火墙或代理设置阻止连接</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => preloadRuntime(selectedLanguage)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                >
                  重试
                </button>
                
                {/* 针对C++提供切换到JavaScript的建议 */}
                {selectedLanguage === 'cpp' && (
                  <button
                    onClick={() => handleLanguageChange('javascript')}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    切换到 JavaScript
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStatus?.isReady && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">
              {currentLangInfo.name} 环境已就绪 
              {currentStatus.version && ` (${currentStatus.version})`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：代码示例 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                代码示例 ({currentLangInfo.name})
              </h2>
              <div className="space-y-2">
                {currentLanguageExamples.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => handleSelectExample(example.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedExample === example.id
                        ? 'bg-blue-50 border border-blue-300'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{example.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{example.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        example.difficulty === 'beginner' 
                          ? 'bg-green-100 text-green-700'
                          : example.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {example.difficulty === 'beginner' && '初级'}
                        {example.difficulty === 'intermediate' && '中级'}
                        {example.difficulty === 'advanced' && '高级'}
                      </span>
                      <span className="text-xs text-gray-500">{example.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 执行历史 */}
            {executionHistory.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">运行历史</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {executionHistory.slice(0, 10).map((exec) => (
                    <button
                      key={exec.id}
                      onClick={() => setCurrentExecution(exec)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono truncate">
                          {exec.code.split('\n')[0].substring(0, 30)}...
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {exec.language.toUpperCase()}
                          </span>
                          <span className={`text-xs ${
                            exec.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {exec.status === 'success' ? '成功' : '失败'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(exec.timestamp).toLocaleTimeString('zh-CN')}
                        {exec.executionTime && ` (${exec.executionTime}ms)`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：编辑器和输出 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 代码编辑器 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  代码编辑器 ({currentLangInfo.name})
                </h2>
                <div className="flex items-center gap-3">
                  {/* C++运行提示 */}
                  {selectedLanguage === 'cpp' && currentStatus?.isReady && (
                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      编译较慢，请耐心等待
                    </div>
                  )}
                  <button
                    onClick={handleRun}
                    disabled={!currentStatus?.isReady || isRunning}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !currentStatus?.isReady || isRunning
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isRunning ? '运行中...' : `运行 ${currentLangInfo.name}`}
                  </button>
                </div>
              </div>
              
              <CodeEditor
                value={code}
                onChange={setCode}
                onRun={handleRun}
                language={selectedLanguage}
                readOnly={!currentStatus?.isReady}
              />
            </div>

            {/* 输出面板 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">运行结果</h2>
              <OutputPanel 
                execution={currentExecution} 
                loading={isRunning}
                language={selectedLanguage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 