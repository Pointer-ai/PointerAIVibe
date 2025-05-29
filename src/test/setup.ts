/**
 * Vitest 测试环境配置
 */
import { vi, afterEach } from 'vitest'

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
global.localStorage = localStorageMock as Storage

// 模拟 console
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}

// 清理函数
afterEach(() => {
  vi.clearAllMocks()
}) 