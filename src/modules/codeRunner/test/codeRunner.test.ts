import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  initPyodide, 
  runPython, 
  getPyodideStatus,
  getExecutionHistory,
  clearExecutionHistory,
  cleanup 
} from '../service'

// Mock Worker
class MockWorker {
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  
  constructor(url: string) {
    this.url = url
    
    // 自动发送 ready 消息
    setTimeout(() => {
      this.onmessage?.({
        data: {
          type: 'ready',
          payload: { version: '0.24.1' }
        }
      } as MessageEvent)
    }, 0)
  }
  
  postMessage(message: any) {
    // 模拟异步响应
    setTimeout(() => {
      if (message.type === 'run') {
        const { code } = message.payload
        
        // 模拟执行结果
        if (code.includes('error')) {
          this.onmessage?.({
            data: {
              type: 'error',
              error: 'Simulated error',
              executionTime: 10
            }
          } as MessageEvent)
        } else {
          this.onmessage?.({
            data: {
              type: 'result',
              payload: {
                output: `Output: ${code}`,
                executionTime: 5
              }
            }
          } as MessageEvent)
        }
      }
    }, 0)
  }
  
  terminate() {
    // Worker terminated
  }
}

// Mock URL constructor  
global.URL = class URL {
  href: string
  constructor(url: string, base?: string) {
    this.href = base ? `${base}/${url}` : url
  }
} as any

describe('codeRunner', () => {
  beforeEach(() => {
    // Mock Worker
    global.Worker = MockWorker as any
    
    // 清理之前的状态
    cleanup()
  })
  
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })
  
  describe('initPyodide', () => {
    it('应该初始化 Pyodide worker', async () => {
      const initPromise = initPyodide()
      
      // 等待初始化完成
      await vi.waitFor(async () => {
        const status = getPyodideStatus()
        expect(status.isReady).toBe(true)
      })
      
      await initPromise
      
      const status = getPyodideStatus()
      expect(status.isReady).toBe(true)
      expect(status.version).toBe('0.24.1')
    })
    
    it('应该处理多次初始化调用', async () => {
      // 第一次初始化
      await initPyodide()
      
      // 第二次初始化应该立即返回
      const init2 = initPyodide()
      await expect(init2).resolves.toBeUndefined()
    })
  })
  
  describe('runPython', () => {
    beforeEach(async () => {
      // 先初始化 Pyodide
      await initPyodide()
    })
    
    it('应该执行 Python 代码并返回结果', async () => {
      const code = 'print("Hello, World!")'
      const result = await runPython(code)
      
      expect(result.code).toBe(code)
      expect(result.status).toBe('success')
      expect(result.output).toBe(`Output: ${code}`)
      expect(result.executionTime).toBe(5)
    })
    
    it('应该处理执行错误', async () => {
      const code = 'raise error'
      const result = await runPython(code)
      
      expect(result.code).toBe(code)
      expect(result.status).toBe('error')
      expect(result.error).toBe('Simulated error')
    })
    
    it('应该在 Pyodide 未初始化时自动初始化并执行', async () => {
      cleanup()
      
      // 验证未初始化状态
      expect(getPyodideStatus().isReady).toBe(false)
      
      // 调用runPython应该自动初始化并成功执行
      const result = await runPython('print("test")')
      
      expect(result.code).toBe('print("test")')
      expect(result.status).toBe('success')
      expect(result.output).toBe('Output: print("test")')
      
      // 验证已经自动初始化
      expect(getPyodideStatus().isReady).toBe(true)
    })
  })
  
  describe('getExecutionHistory', () => {
    beforeEach(async () => {
      // 初始化 Pyodide
      await initPyodide()
      // 清空之前的执行历史
      clearExecutionHistory()
    })
    
    it('应该记录执行历史', async () => {
      // 执行一些代码
      const code1 = 'print("First")'
      const code2 = 'print("Second")'
      
      await runPython(code1)
      await runPython(code2)
      
      const history = getExecutionHistory()
      
      expect(history).toHaveLength(2)
      expect(history[0].code).toBe(code2) // 最新的在前
      expect(history[1].code).toBe(code1)
    })
  })
  
  describe('cleanup', () => {
    it('应该清理资源并重置状态', async () => {
      // 初始化
      await initPyodide()
      
      // 验证已初始化
      expect(getPyodideStatus().isReady).toBe(true)
      
      // 清理
      cleanup()
      
      // 验证已清理
      expect(getPyodideStatus().isReady).toBe(false)
    })
  })
}) 