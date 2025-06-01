/// <reference lib="webworker" />

/**
 * Pyodide Web Worker
 * 在独立线程中运行 Python 代码
 */

declare const loadPyodide: any;

// Import Pyodide
importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');

let pyodide: any = null;

/**
 * 初始化 Pyodide
 */
const initializePyodide = async () => {
  console.log('[pyodideWorker] Loading Pyodide...')
  
  try {
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
    
    // 重定向 Python 输出到我们的处理函数
    pyodide.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.output = []
    
    def write(self, text):
        self.output.append(text)
    
    def flush(self):
        pass
    
    def getvalue(self):
        return ''.join(self.output)

sys.stdout = OutputCapture()
sys.stderr = OutputCapture()
    `);
    
    console.log('[pyodideWorker] Pyodide loaded successfully')
    self.postMessage({ type: 'ready', payload: { version: pyodide.version } })
  } catch (error) {
    console.error('[pyodideWorker] Failed to load Pyodide', error)
    self.postMessage({ type: 'error', error: String(error) })
  }
}

/**
 * 执行 Python 代码
 */
const runCode = async (code: string) => {
  if (!pyodide) {
    self.postMessage({ type: 'error', error: 'Pyodide not initialized' })
    return
  }
  
  const startTime = performance.now()
  
  try {
    // 清空之前的输出
    pyodide.runPython(`
sys.stdout.output = []
sys.stderr.output = []
    `);
    
    // 执行用户代码
    const result = await pyodide.runPythonAsync(code);
    
    // 获取输出
    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    const stderr = pyodide.runPython('sys.stderr.getvalue()');
    
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    self.postMessage({ 
      type: 'result', 
      payload: {
        result: result !== undefined ? String(result) : '',
        output: stdout || stderr,
        executionTime
      }
    })
  } catch (error: any) {
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    self.postMessage({ 
      type: 'error', 
      error: error.message || String(error),
      executionTime
    })
  }
}

/**
 * 安装 Python 包
 */
const installPackage = async (packageName: string) => {
  if (!pyodide) {
    self.postMessage({ type: 'error', error: 'Pyodide not initialized' })
    return
  }
  
  try {
    await pyodide.loadPackage(packageName)
    self.postMessage({ 
      type: 'result', 
      payload: { message: `Package ${packageName} installed successfully` }
    })
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: `Failed to install package ${packageName}: ${String(error)}`
    })
  }
}

// 监听主线程消息
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'init':
      await initializePyodide()
      break
    case 'run':
      await runCode(payload.code)
      break
    case 'install':
      await installPackage(payload.package)
      break
    default:
      console.warn('[pyodideWorker] Unknown message type:', type)
  }
})

// 自动初始化
initializePyodide() 