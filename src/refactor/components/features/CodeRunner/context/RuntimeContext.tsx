import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { 
  getRuntimeStatus, 
  initRuntime, 
  runCode, 
  cleanup, 
  preloadRuntime,
  getLanguageExecutionHistory 
} from '../service'
import type { RuntimeStatus, CodeExecution, SupportedLanguage } from '../types'

interface RuntimeContextState {
  runtimeStatus: RuntimeStatus
  isRunning: boolean
  executionHistory: Record<SupportedLanguage, CodeExecution[]>
  lastExecution?: CodeExecution
}

interface RuntimeContextActions {
  initializeRuntime: (language: SupportedLanguage) => Promise<void>
  executeCode: (code: string, language: SupportedLanguage) => Promise<CodeExecution>
  preloadLanguage: (language: SupportedLanguage) => Promise<void>
  refreshStatus: () => void
  clearHistory: (language?: SupportedLanguage) => void
}

type RuntimeAction = 
  | { type: 'SET_RUNTIME_STATUS'; payload: RuntimeStatus }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_EXECUTION_HISTORY'; payload: { language: SupportedLanguage; history: CodeExecution[] } }
  | { type: 'SET_LAST_EXECUTION'; payload: CodeExecution }
  | { type: 'CLEAR_HISTORY'; payload?: SupportedLanguage }

const runtimeReducer = (state: RuntimeContextState, action: RuntimeAction): RuntimeContextState => {
  switch (action.type) {
    case 'SET_RUNTIME_STATUS':
      return { ...state, runtimeStatus: action.payload }
    
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload }
    
    case 'SET_EXECUTION_HISTORY':
      return {
        ...state,
        executionHistory: {
          ...state.executionHistory,
          [action.payload.language]: action.payload.history
        }
      }
    
    case 'SET_LAST_EXECUTION':
      return { ...state, lastExecution: action.payload }
    
    case 'CLEAR_HISTORY':
      if (action.payload) {
        return {
          ...state,
          executionHistory: {
            ...state.executionHistory,
            [action.payload]: []
          }
        }
      } else {
        return {
          ...state,
          executionHistory: {
            python: [],
            cpp: [],
            javascript: []
          }
        }
      }
    
    default:
      return state
  }
}

const initialState: RuntimeContextState = {
  runtimeStatus: {
    python: { isLoading: false, isReady: false },
    cpp: { isLoading: false, isReady: false },
    javascript: { isLoading: false, isReady: false }
  },
  isRunning: false,
  executionHistory: {
    python: [],
    cpp: [],
    javascript: []
  }
}

const RuntimeContext = createContext<{
  state: RuntimeContextState
  actions: RuntimeContextActions
} | null>(null)

interface RuntimeProviderProps {
  children: ReactNode
  /**
   * 初始化配置
   */
  config?: {
    // 预加载哪些语言
    preloadLanguages?: SupportedLanguage[]
    // 是否自动清理不活跃的运行时
    autoCleanup?: boolean
    // 状态更新间隔（毫秒）
    statusUpdateInterval?: number
  }
}

export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const {
    preloadLanguages = [],
    autoCleanup = true,
    statusUpdateInterval = 1000
  } = config

  const [state, dispatch] = useReducer(runtimeReducer, initialState)

  // 刷新运行时状态
  const refreshStatus = () => {
    const status = getRuntimeStatus()
    dispatch({ type: 'SET_RUNTIME_STATUS', payload: status })
  }

  // 初始化指定语言的运行时
  const initializeRuntime = async (language: SupportedLanguage): Promise<void> => {
    try {
      await initRuntime(language)
      refreshStatus()
      
      // 更新执行历史
      const history = getLanguageExecutionHistory(language)
      dispatch({ 
        type: 'SET_EXECUTION_HISTORY', 
        payload: { language, history } 
      })
    } catch (error) {
      console.error(`Failed to initialize ${language} runtime:`, error)
      refreshStatus()
      throw error
    }
  }

  // 预加载语言运行时
  const preloadLanguage = async (language: SupportedLanguage): Promise<void> => {
    try {
      await preloadRuntime(language)
      refreshStatus()
    } catch (error) {
      console.error(`Failed to preload ${language} runtime:`, error)
      throw error
    }
  }

  // 执行代码
  const executeCode = async (code: string, language: SupportedLanguage): Promise<CodeExecution> => {
    if (state.isRunning) {
      throw new Error('Another execution is in progress')
    }

    dispatch({ type: 'SET_RUNNING', payload: true })
    
    try {
      const execution = await runCode(code, language)
      
      // 更新最后执行结果
      dispatch({ type: 'SET_LAST_EXECUTION', payload: execution })
      
      // 更新执行历史
      const history = getLanguageExecutionHistory(language)
      dispatch({ 
        type: 'SET_EXECUTION_HISTORY', 
        payload: { language, history } 
      })
      
      refreshStatus()
      return execution
    } catch (error) {
      console.error(`Failed to execute ${language} code:`, error)
      throw error
    } finally {
      dispatch({ type: 'SET_RUNNING', payload: false })
    }
  }

  // 清空执行历史
  const clearHistory = (language?: SupportedLanguage) => {
    dispatch({ type: 'CLEAR_HISTORY', payload: language })
  }

  // 定期更新运行时状态
  useEffect(() => {
    refreshStatus()
    
    const interval = setInterval(refreshStatus, statusUpdateInterval)
    return () => clearInterval(interval)
  }, [statusUpdateInterval])

  // 预加载配置的语言
  useEffect(() => {
    if (preloadLanguages.length > 0) {
      Promise.allSettled(
        preloadLanguages.map(lang => preloadLanguage(lang))
      ).then(() => {
        console.log('[RuntimeProvider] Preload completed for languages:', preloadLanguages)
      })
    }
  }, []) // 只在组件挂载时执行一次

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (autoCleanup) {
        cleanup()
      }
    }
  }, [autoCleanup])

  const actions: RuntimeContextActions = {
    initializeRuntime,
    executeCode,
    preloadLanguage,
    refreshStatus,
    clearHistory
  }

  return (
    <RuntimeContext.Provider value={{ state, actions }}>
      {children}
    </RuntimeContext.Provider>
  )
}

export const useRuntime = () => {
  const context = useContext(RuntimeContext)
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider')
  }
  return context
}

// 便捷的 hooks
export const useRuntimeStatus = () => {
  const { state } = useRuntime()
  return state.runtimeStatus
}

export const useCodeExecution = () => {
  const { state, actions } = useRuntime()
  return {
    isRunning: state.isRunning,
    lastExecution: state.lastExecution,
    executionHistory: state.executionHistory,
    executeCode: actions.executeCode
  }
}

export const useLanguageRuntime = (language: SupportedLanguage) => {
  const { state, actions } = useRuntime()
  
  return {
    status: state.runtimeStatus[language],
    history: state.executionHistory[language] || [],
    initialize: () => actions.initializeRuntime(language),
    preload: () => actions.preloadLanguage(language),
    execute: (code: string) => actions.executeCode(code, language)
  }
} 