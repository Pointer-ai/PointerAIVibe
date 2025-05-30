// CodeRunner 模块主要导出

// 原有组件导出
export { CodeRunnerView } from './view'
export { CodeEditor } from './components/CodeEditor'
export { OutputPanel } from './components/OutputPanel'

// 新增集成组件导出
export { 
  IntegratedCodeRunner,
  PythonRunner,
  JavaScriptRunner, 
  CppRunner,
  CompactCodeRunner,
  CodeDisplay
} from './components/IntegratedCodeRunner'

// Runtime Context 导出
export {
  RuntimeProvider,
  useRuntime,
  useRuntimeStatus,
  useCodeExecution,
  useLanguageRuntime
} from './context/RuntimeContext'

// 服务层导出
export {
  initRuntime,
  runCode,
  runPython,
  runCpp,
  runJavaScript,
  getRuntimeStatus,
  getLanguageExecutionHistory,
  cleanup,
  preloadRuntime,
  preloadAllRuntimes
} from './service'

// 类型导出
export type {
  CodeExecution,
  RuntimeStatus
} from './types'

export type { IntegratedCodeRunnerProps } from './components/IntegratedCodeRunner'

// 定义支持的语言类型
export type SupportedLanguage = 'python' | 'cpp' | 'javascript' 