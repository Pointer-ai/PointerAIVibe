import { log, error } from '../../utils/logger'
import { addActivityRecord } from '../profileSettings/service'
import { RuntimeStatus, CodeExecution, WorkerMessage } from './types'

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

/**
 * 获取或创建 Worker 的 URL
 */
const getWorkerUrl = (language: 'python' | 'cpp' | 'javascript'): URL => {
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
export const initRuntime = (language: 'python' | 'cpp' | 'javascript'): Promise<void> => {
  // 如果已经在初始化中，返回缓存的 Promise
  const cacheKey = `init-${language}`
  const cachedPromise = initializationCache[cacheKey]
  if (cachedPromise) {
    log(`[codeRunner] ${language} runtime initialization already in progress, using cached promise`)
    return cachedPromise
  }

  // 如果已经初始化完成，直接返回
  const status = runtimeStatus[language]
  if (status?.isReady) {
    log(`[codeRunner] ${language} runtime already ready`)
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
    
    log(`[codeRunner] Lazy initializing ${language} runtime`)
    
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
        error(`[codeRunner] ${language} worker error:`, err)
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
      
      log(`[codeRunner] ${language} worker created`)
    } catch (err) {
      error(`[codeRunner] Failed to create ${language} worker`, err)
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
const handleWorkerMessage = (event: MessageEvent<WorkerMessage>, language: 'python' | 'cpp' | 'javascript') => {
  const { type, payload, error: errorMsg } = event.data
  
  switch (type) {
    case 'ready':
      log(`[codeRunner] ${language} ready`, payload)
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
      log(`[codeRunner] ${language} execution result`, payload)
      const runKey = `run-${language}`
      if (workerResolvers[runKey]) {
        workerResolvers[runKey].resolve(payload)
        delete workerResolvers[runKey]
      }
      break
      
    case 'error':
      error(`[codeRunner] ${language} execution error`, errorMsg)
      const errorInitKey = `init-${language}`
      const errorRunKey = `run-${language}`
      
      if (workerResolvers[errorInitKey]) {
        if (runtimeStatus[language]) {
          runtimeStatus[language]!.error = errorMsg
          runtimeStatus[language]!.isLoading = false
        }
        workerResolvers[errorInitKey].reject(new Error(errorMsg))
        delete workerResolvers[errorInitKey]
      } else if (workerResolvers[errorRunKey]) {
        workerResolvers[errorRunKey].reject(new Error(errorMsg))
        delete workerResolvers[errorRunKey]
      }
      break
      
    case 'output':
      // 实时输出，可以通过回调处理
      log(`[codeRunner] ${language} output:`, payload)
      break
  }
}

/**
 * 运行代码 - 统一接口，支持 lazy loading
 */
export const runCode = async (code: string, language: 'python' | 'cpp' | 'javascript'): Promise<CodeExecution> => {
  // Lazy loading: 如果运行时未初始化，先初始化
  if (!runtimeStatus[language]?.isReady) {
    log(`[codeRunner] ${language} runtime not ready, initializing...`)
    await initRuntime(language)
  }

  const worker = workers[language]
  const status = runtimeStatus[language]
  
  if (!worker || !status?.isReady) {
    throw new Error(`${language} runtime not initialized`)
  }
  
  const execution: CodeExecution = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    code,
    language,
    timestamp: new Date().toISOString(),
    status: 'running'
  }
  
  executionHistory.unshift(execution)
  
  return new Promise((resolve, _reject) => {
    const runKey = `run-${language}`
    workerResolvers[runKey] = { 
      resolve: (result) => {
        execution.status = 'success'
        execution.output = result.output || result.result || ''
        execution.executionTime = result.executionTime
        
        // 记录活动
        addActivityRecord({
          type: 'code_run',
          action: `运行 ${language.toUpperCase()} 代码`,
          details: {
            language,
            codeLength: code.length,
            executionTime: result.executionTime
          }
        })
        
        resolve(execution)
      },
      reject: (err) => {
        execution.status = 'error'
        execution.error = err.message
        execution.executionTime = err.executionTime
        resolve(execution)
      }
    }
    
    worker.postMessage({ 
      type: 'run', 
      language,
      payload: { code } 
    })
  })
}

/**
 * 运行 Python 代码 (向后兼容)
 */
export const runPython = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'python')
}

/**
 * 运行 C++ 代码
 */
export const runCpp = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'cpp')
}

/**
 * 运行 JavaScript 代码
 */
export const runJavaScript = async (code: string): Promise<CodeExecution> => {
  return runCode(code, 'javascript')
}

/**
 * 初始化 Pyodide (向后兼容)
 */
export const initPyodide = (): Promise<void> => {
  return initRuntime('python')
}

/**
 * 初始化 C++ 运行环境
 */
export const initCpp = (): Promise<void> => {
  return initRuntime('cpp')
}

/**
 * 初始化 JavaScript 运行环境
 */
export const initJavaScript = (): Promise<void> => {
  return initRuntime('javascript')
}

/**
 * 预热指定语言的运行时（可选的性能优化）
 */
export const preloadRuntime = async (language: 'python' | 'cpp' | 'javascript'): Promise<void> => {
  try {
    log(`[codeRunner] Preloading ${language} runtime`)
    await initRuntime(language)
    log(`[codeRunner] ${language} runtime preloaded successfully`)
  } catch (err) {
    error(`[codeRunner] Failed to preload ${language} runtime`, err)
  }
}

/**
 * 批量预热多个运行时
 */
export const preloadAllRuntimes = async (): Promise<void> => {
  const languages: ('python' | 'cpp' | 'javascript')[] = ['javascript', 'python', 'cpp']
  
  // 并行预热，JavaScript 最快所以优先
  const preloadPromises = languages.map(lang => preloadRuntime(lang))
  
  try {
    await Promise.allSettled(preloadPromises)
    log('[codeRunner] All runtimes preload completed')
  } catch (err) {
    error('[codeRunner] Some runtimes failed to preload', err)
  }
}

/**
 * 安装 Python 包
 */
export const installPackage = async (packageName: string): Promise<void> => {
  // 确保 Python 运行时已初始化
  await initRuntime('python')
  
  const worker = workers.python
  const status = runtimeStatus.python
  
  if (!worker || !status?.isReady) {
    throw new Error('Pyodide not initialized')
  }
  
  return new Promise((resolve, reject) => {
    workerResolvers['install-python'] = { resolve, reject }
    worker.postMessage({ 
      type: 'install', 
      language: 'python',
      payload: { package: packageName } 
    })
  })
}

/**
 * 获取运行时状态
 */
export const getRuntimeStatus = (): RuntimeStatus => {
  return JSON.parse(JSON.stringify(runtimeStatus))
}

/**
 * 获取 Pyodide 状态 (向后兼容)
 */
export const getPyodideStatus = () => {
  return runtimeStatus.python || { isLoading: false, isReady: false }
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
export const getLanguageExecutionHistory = (language: 'python' | 'cpp' | 'javascript'): CodeExecution[] => {
  return executionHistory.filter(execution => execution.language === language)
}

/**
 * 清空执行历史
 */
export const clearExecutionHistory = (): void => {
  executionHistory.length = 0
}

/**
 * 清理指定语言的资源
 */
export const cleanupLanguage = (language: 'python' | 'cpp' | 'javascript'): void => {
  const worker = workers[language]
  if (worker) {
    worker.terminate()
    delete workers[language]
    
    // 清除初始化缓存
    delete initializationCache[`init-${language}`]
    
    if (runtimeStatus[language]) {
      runtimeStatus[language] = {
        isLoading: false,
        isReady: false
      }
    }
    
    // 清理相关的 resolvers
    Object.keys(workerResolvers).forEach(key => {
      if (key.includes(language)) {
        delete workerResolvers[key]
      }
    })
    
    log(`[codeRunner] ${language} worker terminated and cache cleared`)
  }
}

/**
 * 清理所有资源
 */
export const cleanup = (): void => {
  Object.keys(workers).forEach(language => {
    cleanupLanguage(language as 'python' | 'cpp' | 'javascript')
  })
  
  // 清除所有缓存
  Object.keys(initializationCache).forEach(key => {
    delete initializationCache[key]
  })
  
  executionHistory.length = 0
  workerResolvers = {}
  log('[codeRunner] All workers terminated and caches cleared')
} 