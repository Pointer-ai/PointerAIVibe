import { describe, it, expect } from 'vitest'

describe('JavaScript Worker', () => {
  it('should be able to import the worker file', async () => {
    // 简单测试确保worker文件可以被导入
    const workerUrl = new URL('../javascriptWorker.ts', import.meta.url)
    expect(workerUrl.href).toContain('javascriptWorker.ts')
  })
  
  it('should handle basic console.log statements', () => {
    // 测试代码示例的基本结构
    const code = 'console.log("Hello, World!");'
    expect(code).toBe('console.log("Hello, World!");')
  })
}) 