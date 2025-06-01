// CodeRunner 模块主要导出 - 重定向到 refactor 系统

// 从 refactor 系统导入所有组件和功能
export {
  // 核心组件
  CodeEditor,
  OutputPanel,
  ExecutionOutputPanel,
  IntegratedCodeRunner,
  PythonRunner,
  JavaScriptRunner,
  CppRunner,
  CompactCodeRunner,
  CodeDisplay,
  
  // Runtime Context
  RuntimeProvider,
  useRuntime,
  useRuntimeStatus,
  useCodeExecution,
  useLanguageRuntime,
  
  // 服务层
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
  preloadAllRuntimes,
  
  // 类型
  type CodeExecution,
  type RuntimeStatus,
  type SupportedLanguage,
  type CodeEditorProps,
  type OutputPanelProps,
  type IntegratedCodeRunnerProps,
  type CodeExample,
  type RuntimeContextValue,
  
  // 常量
  CODE_EXAMPLES
} from '../../refactor/components/features/CodeRunner'

// 保持向后兼容的原有导出
export { CodeRunnerView } from './view'

// 默认导出
export { default } from '../../refactor/components/features/CodeRunner' 