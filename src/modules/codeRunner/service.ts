import { log, error } from '../../utils/logger'
import { addActivityRecord } from '../profileSettings/service'
import { PyodideStatus, CodeExecution, WorkerMessage } from './types'

let pyodideWorker: Worker | null = null
let pyodideStatus: PyodideStatus = {
  isLoading: false,
  isReady: false
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

/**
 * 初始化 Pyodide Worker
 */
export const initPyodide = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (pyodideStatus.isReady) {
      resolve()
      return
    }

    if (pyodideStatus.isLoading) {
      // 等待加载完成
      const checkInterval = setInterval(() => {
        if (pyodideStatus.isReady) {
          clearInterval(checkInterval)
          resolve()
        } else if (pyodideStatus.error) {
          clearInterval(checkInterval)
          reject(new Error(pyodideStatus.error))
        }
      }, 100)
      return
    }

    pyodideStatus.isLoading = true
    log('[codeRunner] Initializing Pyodide')
    
    try {
      pyodideWorker = new Worker(
        new URL('./pyodideWorker.ts', import.meta.url)
      )
      
      // 设置消息处理器
      pyodideWorker.onmessage = handleWorkerMessage
      pyodideWorker.onerror = (err) => {
        error('[codeRunner] Worker error:', err)
        pyodideStatus.error = 'Worker initialization failed'
        reject(err)
      }
      
      // 等待 ready 消息
      workerResolvers['init'] = { resolve, reject }
      
      log('[codeRunner] Pyodide worker created')
    } catch (err) {
      error('[codeRunner] Failed to create Pyodide worker', err)
      pyodideStatus.error = 'Failed to create worker'
      pyodideStatus.isLoading = false
      reject(err)
    }
  })
}

/**
 * 处理 Worker 消息
 */
const handleWorkerMessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, error: errorMsg } = event.data
  
  switch (type) {
    case 'ready':
      log('[codeRunner] Pyodide ready', payload)
      pyodideStatus.isLoading = false
      pyodideStatus.isReady = true
      pyodideStatus.version = payload?.version
      
      if (workerResolvers['init']) {
        workerResolvers['init'].resolve(undefined)
        delete workerResolvers['init']
      }
      break
      
    case 'result':
      log('[codeRunner] Execution result', payload)
      if (workerResolvers['run']) {
        workerResolvers['run'].resolve(payload)
        delete workerResolvers['run']
      }
      break
      
    case 'error':
      error('[codeRunner] Execution error', errorMsg)
      if (type === 'error' && workerResolvers['init']) {
        pyodideStatus.error = errorMsg
        pyodideStatus.isLoading = false
        workerResolvers['init'].reject(new Error(errorMsg))
        delete workerResolvers['init']
      } else if (workerResolvers['run']) {
        workerResolvers['run'].reject(new Error(errorMsg))
        delete workerResolvers['run']
      }
      break
      
    case 'output':
      // 实时输出，可以通过回调处理
      log('[codeRunner] Output:', payload)
      break
  }
}

/**
 * 运行 Python 代码
 */
export const runPython = async (code: string): Promise<CodeExecution> => {
  if (!pyodideWorker || !pyodideStatus.isReady) {
    throw new Error('Pyodide not initialized')
  }
  
  const execution: CodeExecution = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    code,
    language: 'python',
    timestamp: new Date().toISOString(),
    status: 'running'
  }
  
  executionHistory.unshift(execution)
  
  return new Promise((resolve, reject) => {
    workerResolvers['run'] = { 
      resolve: (result) => {
        execution.status = 'success'
        execution.output = result.output || result.result || ''
        execution.executionTime = result.executionTime
        
        // 记录活动
        addActivityRecord({
          type: 'code_run',
          action: '运行 Python 代码',
          details: {
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
    
    pyodideWorker!.postMessage({ type: 'run', payload: { code } })
  })
}

/**
 * 安装 Python 包
 */
export const installPackage = async (packageName: string): Promise<void> => {
  if (!pyodideWorker || !pyodideStatus.isReady) {
    throw new Error('Pyodide not initialized')
  }
  
  return new Promise((resolve, reject) => {
    workerResolvers['install'] = { resolve, reject }
    pyodideWorker!.postMessage({ type: 'install', payload: { package: packageName } })
  })
}

/**
 * 获取 Pyodide 状态
 */
export const getPyodideStatus = (): PyodideStatus => {
  return { ...pyodideStatus }
}

/**
 * 获取执行历史
 */
export const getExecutionHistory = (): CodeExecution[] => {
  return [...executionHistory]
}

/**
 * 清空执行历史
 */
export const clearExecutionHistory = (): void => {
  executionHistory.length = 0
}

/**
 * 清理资源
 */
export const cleanup = (): void => {
  if (pyodideWorker) {
    pyodideWorker.terminate()
    pyodideWorker = null
    pyodideStatus = {
      isLoading: false,
      isReady: false
    }
    workerResolvers = {}
    executionHistory.length = 0
    log('[codeRunner] Pyodide worker terminated')
  }
} 