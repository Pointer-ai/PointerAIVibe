/**
 * CodeRunner 功能模块 - 统一导出
 * 重构版本的代码运行环境
 */

// 核心组件导出
export { CodeEditor } from './components/CodeEditor'
export { OutputPanel, ExecutionOutputPanel } from './components/OutputPanel'
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
  getExecutionHistory,
  clearExecutionHistory,
  cleanup,
  preloadRuntime,
  preloadAllRuntimes
} from './service'

// 类型导出
export type {
  CodeExecution,
  RuntimeStatus,
  SupportedLanguage,
  CodeEditorProps,
  OutputPanelProps,
  IntegratedCodeRunnerProps,
  CodeExample,
  RuntimeContextValue
} from './types'

// 常量导出
export { CODE_EXAMPLES } from './types'

// 默认导出集成组件
export { IntegratedCodeRunner as default } from './components/IntegratedCodeRunner' 