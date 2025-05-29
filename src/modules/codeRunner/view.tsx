import React, { useState, useEffect } from 'react'
import { CodeEditor } from './components/CodeEditor'
import { OutputPanel } from './components/OutputPanel'
import { 
  initPyodide, 
  runPython, 
  getPyodideStatus,
  getExecutionHistory,
  cleanup 
} from './service'
import { CODE_EXAMPLES, CodeExecution } from './types'
import { log, error } from '../../utils/logger'

export const CodeRunnerView: React.FC = () => {
  const [code, setCode] = useState(CODE_EXAMPLES[0].code)
  const [selectedExample, setSelectedExample] = useState(CODE_EXAMPLES[0].id)
  const [pyodideStatus, setPyodideStatus] = useState(getPyodideStatus())
  const [isRunning, setIsRunning] = useState(false)
  const [currentExecution, setCurrentExecution] = useState<CodeExecution | undefined>()
  const [executionHistory, setExecutionHistory] = useState<CodeExecution[]>([])

  // 初始化 Pyodide
  useEffect(() => {
    const init = async () => {
      try {
        log('[CodeRunnerView] Initializing Pyodide')
        await initPyodide()
        setPyodideStatus(getPyodideStatus())
        log('[CodeRunnerView] Pyodide initialized')
      } catch (err) {
        error('[CodeRunnerView] Failed to initialize Pyodide', err)
        setPyodideStatus(getPyodideStatus())
      }
    }

    init()

    // 清理
    return () => {
      cleanup()
    }
  }, [])

  // 运行代码
  const handleRun = async () => {
    if (!pyodideStatus.isReady || isRunning) return

    setIsRunning(true)
    try {
      const execution = await runPython(code)
      setCurrentExecution(execution)
      setExecutionHistory(getExecutionHistory())
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">代码运行器</h1>
          <p className="mt-2 text-gray-600">
            在浏览器中运行 Python 代码，无需安装任何环境
          </p>
        </div>

        {/* Pyodide 状态 */}
        {pyodideStatus.isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-blue-700">正在加载 Python 运行环境...</span>
            </div>
          </div>
        )}

        {pyodideStatus.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-700">加载失败: {pyodideStatus.error}</span>
          </div>
        )}

        {pyodideStatus.isReady && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-700">
              Python 环境已就绪 {pyodideStatus.version && `(Pyodide ${pyodideStatus.version})`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：代码示例 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">代码示例</h2>
              <div className="space-y-2">
                {CODE_EXAMPLES.map((example) => (
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
                        <span className={`text-xs ${
                          exec.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {exec.status === 'success' ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(exec.timestamp).toLocaleTimeString('zh-CN')}
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
                <h2 className="text-lg font-semibold">代码编辑器</h2>
                <button
                  onClick={handleRun}
                  disabled={!pyodideStatus.isReady || isRunning}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !pyodideStatus.isReady || isRunning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isRunning ? '运行中...' : '运行代码'}
                </button>
              </div>
              
              <CodeEditor
                value={code}
                onChange={setCode}
                onRun={handleRun}
                language="python"
                readOnly={!pyodideStatus.isReady}
              />
            </div>

            {/* 输出面板 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">运行结果</h2>
              <OutputPanel 
                execution={currentExecution} 
                loading={isRunning}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 