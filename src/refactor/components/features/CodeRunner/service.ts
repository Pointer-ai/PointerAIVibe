/**
 * CodeRunner 服务层
 * 统一的代码运行环境管理
 */

import type { RuntimeStatus, CodeExecution, WorkerMessage, SupportedLanguage } from './types'

// 多语言 Worker 管理 - 使用 lazy loading
const workers: {
  python?: Worker
  cpp?: Worker
  javascript?: Worker
} = {}

// 多语言运行时状态
let runtimeStatus: RuntimeStatus = {
  python: {
    isLoading: false,
    isReady: false
  },
  cpp: {
    isLoading: false,
    isReady: false
  },
  javascript: {
    isLoading: false,
    isReady: false
  }
}

// 存储执行历史
const executionHistory: CodeExecution[] = []

// Promise 解析器，用于处理异步操作
let workerResolvers: {
  [key: string]: {
    resolve: (value: any) => void
    reject: (reason: any) => void
  }
} = {}

// 缓存初始化状态，避免重复初始化
const initializationCache: {
  [key: string]: Promise<void>
} = {}

// 日志工具函数
const log = (message: string, ...args: any[]) => {
  console.log(`[CodeRunner] ${message}`, ...args)
}

const error = (message: string, ...args: any[]) => {
  console.error(`[CodeRunner] ${message}`, ...args)
}

/**
 * 获取或创建 Worker 的 URL
 */
const getWorkerUrl = (language: SupportedLanguage): URL => {
  switch (language) {
    case 'python':
      return new URL('./pyodideWorker.ts', import.meta.url)
    case 'cpp':
      return new URL('./emscriptenWorker.ts', import.meta.url)
    case 'javascript':
      return new URL('./javascriptWorker.ts', import.meta.url)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

/**
 * Lazy 初始化指定语言的运行环境
 * 实现缓存机制，避免重复初始化
 */
export const initRuntime = (language: SupportedLanguage): Promise<void> => {
  // 如果已经在初始化中，返回缓存的 Promise
  const cacheKey = `init-${language}`
  const cachedPromise = initializationCache[cacheKey]
  if (cachedPromise) {
    log(`${language} runtime initialization already in progress, using cached promise`)
    return cachedPromise
  }

  // 如果已经初始化完成，直接返回
  const status = runtimeStatus[language]
  if (status?.isReady) {
    log(`${language} runtime already ready`)
    return Promise.resolve()
  }

  // 创建新的初始化 Promise 并缓存
  const initPromise = new Promise<void>((resolve, reject) => {
    const currentStatus = runtimeStatus[language]
    
    if (currentStatus?.isLoading) {
      // 等待加载完成
      const checkInterval = setInterval(() => {
        const latestStatus = runtimeStatus[language]
        if (latestStatus?.isReady) {
          clearInterval(checkInterval)
          resolve()
        } else if (latestStatus?.error) {
          clearInterval(checkInterval)
          reject(new Error(latestStatus.error))
        }
      }, 100)
      return
    }

    if (currentStatus) {
      currentStatus.isLoading = true
      currentStatus.error = undefined // 清除之前的错误
    }
    
    log(`Lazy initializing ${language} runtime`)
    
    try {
      const workerUrl = getWorkerUrl(language)
      
      // 如果 Worker 已存在，先清理
      if (workers[language]) {
        workers[language]!.terminate()
        delete workers[language]
      }
      
      workers[language] = new Worker(workerUrl)
      
      // 设置消息处理器
      workers[language]!.onmessage = (event) => handleWorkerMessage(event, language)
      workers[language]!.onerror = (err) => {
        error(`${language} worker error:`, err)
        if (runtimeStatus[language]) {
          runtimeStatus[language]!.error = 'Worker initialization failed'
          runtimeStatus[language]!.isLoading = false
        }
        // 清除缓存，允许重试
        delete initializationCache[cacheKey]
        reject(err)
      }
      
      // 等待 ready 消息
      workerResolvers[`init-${language}`] = { 
        resolve: () => {
          // 初始化成功，保持缓存
          resolve()
        }, 
        reject: (err) => {
          // 初始化失败，清除缓存
          delete initializationCache[cacheKey]
          reject(err)
        }
      }
      
      log(`${language} worker created`)
    } catch (err) {
      error(`Failed to create ${language} worker`, err)
      if (runtimeStatus[language]) {
        runtimeStatus[language]!.error = 'Failed to create worker'
        runtimeStatus[language]!.isLoading = false
      }
      // 清除缓存，允许重试
      delete initializationCache[cacheKey]
      reject(err)
    }
  })

  // 缓存 Promise
  initializationCache[cacheKey] = initPromise
  
  return initPromise
}

/**
 * 处理 Worker 消息
 */
const handleWorkerMessage = (event: MessageEvent<WorkerMessage>, language: SupportedLanguage) => {
  const { type, payload, error: errorMsg } = event.data
  
  switch (type) {
    case 'ready':
      log(`${language} ready`, payload)
      if (runtimeStatus[language]) {
        runtimeStatus[language]!.isLoading = false
        runtimeStatus[language]!.isReady = true
        runtimeStatus[language]!.version = payload?.version
      }
      
      const initKey = `init-${language}`
      if (workerResolvers[initKey]) {
        workerResolvers[initKey].resolve(undefined)
        delete workerResolvers[initKey]
      }
      break
      
    case 'result':
      log(`${language} execution result`, payload)
      const runKey = `run-${language}`
      if (workerResolvers[runKey]) {
        workerResolvers[runKey].resolve(payload)
        delete workerResolvers[runKey]
      }
      break
      
    case 'error':
      error(`${language} execution error`, errorMsg)
      const errorInitKey = `init-${language}`
      const errorRunKey = `run-${language}`
      
      if (workerResolvers[errorInitKey]) {
        if (runtimeStatus[language]) {
          runtimeStatus[language]!.error = errorMsg
          runtimeStatus[language]!.isLoading = false
        }
        workerResolvers[errorInitKey].reject(new Error(errorMsg))
        delete workerResolvers[errorInitKey]
      }
      
      if (workerResolvers[errorRunKey]) {
        workerResolvers[errorRunKey].reject(new Error(errorMsg))
        delete workerResolvers[errorRunKey]
      }
      break
  }
}

/**
 * 运行代码
 */
export const runCode = async (code: string, language: SupportedLanguage): Promise<CodeExecution> => {
  const startTime = Date.now()
  const execution: CodeExecution = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    code,
    language,
    timestamp: new Date().toISOString(),
    status: 'pending'
  }

  try {
    // 确保运行时已初始化
    await initRuntime(language)
    
    execution.status = 'running'
    
    const worker = workers[language]
    if (!worker) {
      throw new Error(`${language} worker not available`)
    }

    // 执行代码
    const result = await new Promise<string>((resolve, reject) => {
      const runKey = `run-${language}`
      workerResolvers[runKey] = { resolve, reject }
      
      worker.postMessage({
        type: 'run',
        language,
        payload: { code }
      })
      
      // 设置超时
      setTimeout(() => {
        if (workerResolvers[runKey]) {
          delete workerResolvers[runKey]
          reject(new Error('Code execution timeout'))
        }
      }, 30000) // 30秒超时
    })

    execution.status = 'success'
    execution.output = result
    execution.executionTime = Date.now() - startTime

    log(`Code executed successfully in ${execution.executionTime}ms`)
  } catch (err) {
    execution.status = 'error'
    execution.error = err instanceof Error ? err.message : String(err)
    execution.executionTime = Date.now() - startTime
    
    error(`Code execution failed:`, err)
  }

  // 保存到历史记录
  executionHistory.push(execution)
  
  // 限制历史记录数量
  if (executionHistory.length > 100) {
    executionHistory.shift()
  }

  return execution
}

/**
 * 快捷方法：运行 Python 代码
 */
export const runPython = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'python')
}

/**
 * 快捷方法：运行 C++ 代码
 */
export const runCpp = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'cpp')
}

/**
 * 快捷方法：运行 JavaScript 代码
 */
export const runJavaScript = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'javascript')
}

/**
 * 预加载运行时环境
 */
export const preloadRuntime = async (language: SupportedLanguage): Promise<void> => {
  try {
    log(`Preloading ${language} runtime`)
    await initRuntime(language)
    log(`${language} runtime preloaded successfully`)
  } catch (err) {
    error(`Failed to preload ${language} runtime:`, err)
    throw err
  }
}

/**
 * 预加载所有运行时环境
 */
export const preloadAllRuntimes = async (): Promise<void> => {
  const languages: SupportedLanguage[] = ['python', 'cpp', 'javascript']
  
  try {
    log('Preloading all runtimes')
    await Promise.all(languages.map(lang => preloadRuntime(lang)))
    log('All runtimes preloaded successfully')
  } catch (err) {
    error('Failed to preload some runtimes:', err)
    // 不抛出错误，允许部分成功
  }
}

/**
 * 获取运行时状态
 */
export const getRuntimeStatus = (): RuntimeStatus => {
  return { ...runtimeStatus }
}

/**
 * 获取执行历史
 */
export const getExecutionHistory = (): CodeExecution[] => {
  return [...executionHistory]
}

/**
 * 获取指定语言的执行历史
 */
export const getLanguageExecutionHistory = (language: SupportedLanguage): CodeExecution[] => {
  return executionHistory.filter(exec => exec.language === language)
}

/**
 * 清除执行历史
 */
export const clearExecutionHistory = (language?: SupportedLanguage): void => {
  if (language) {
    // 只清除指定语言的历史
    for (let i = executionHistory.length - 1; i >= 0; i--) {
      if (executionHistory[i].language === language) {
        executionHistory.splice(i, 1)
      }
    }
  } else {
    // 清除所有历史
    executionHistory.length = 0
  }
  log(`Execution history cleared${language ? ` for ${language}` : ''}`)
}

/**
 * 清理指定语言的资源
 */
export const cleanupLanguage = (language: SupportedLanguage): void => {
  if (workers[language]) {
    workers[language]!.terminate()
    delete workers[language]
  }
  
  if (runtimeStatus[language]) {
    runtimeStatus[language] = {
      isLoading: false,
      isReady: false
    }
  }
  
  // 清理相关的缓存和解析器
  const initKey = `init-${language}`
  const runKey = `run-${language}`
  
  delete initializationCache[initKey]
  delete workerResolvers[initKey]
  delete workerResolvers[runKey]
  
  log(`${language} runtime cleaned up`)
}

/**
 * 清理所有资源
 */
export const cleanup = (): void => {
  Object.keys(workers).forEach(language => {
    cleanupLanguage(language as SupportedLanguage)
  })
  
  clearExecutionHistory()
  
  log('All CodeRunner resources cleaned up')
} 