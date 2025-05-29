/**
 * Vitest 测试环境配置
 */
import { vi, afterEach } from 'vitest'

// 创建一个具有实际存储功能的 localStorage mock
class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  get length(): number {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

global.localStorage = new LocalStorageMock() as Storage

// 保存原始的 console 方法
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
}

// 模拟 console
global.console = {
  ...console,
  log: vi.fn((...args) => originalConsole.log(...args)),
  error: vi.fn((...args) => originalConsole.error(...args)),
  warn: vi.fn((...args) => originalConsole.warn(...args))
}

// 清理函数
afterEach(() => {
  vi.clearAllMocks()
  // 清理 localStorage
  global.localStorage.clear()
}) 