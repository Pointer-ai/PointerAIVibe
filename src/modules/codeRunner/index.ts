import { log } from '../../utils/logger'

let pyodideWorker: Worker | null = null

/**
 * 初始化 Pyodide Worker
 */
export const initPyodide = async (): Promise<void> => {
  log('[codeRunner] Initializing Pyodide')
  
  try {
    pyodideWorker = new Worker(
      new URL('./pyodideWorker.ts', import.meta.url),
      { type: 'module' }
    )
    
    log('[codeRunner] Pyodide worker created')
  } catch (error) {
    log('[codeRunner] Failed to create Pyodide worker', error)
    throw error
  }
}

/**
 * 运行 Python 代码
 */
export const runPython = async (code: string): Promise<string> => {
  log('[codeRunner] Running Python code')
  
  if (!pyodideWorker) {
    throw new Error('Pyodide not initialized')
  }
  
  // TODO: 实现与 Worker 的通信
  return 'Python 执行结果占位'
}

/**
 * 清理资源
 */
export const cleanup = (): void => {
  if (pyodideWorker) {
    pyodideWorker.terminate()
    pyodideWorker = null
    log('[codeRunner] Pyodide worker terminated')
  }
} 