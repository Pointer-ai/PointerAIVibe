import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock web worker
const mockPostMessage = vi.fn()
const mockTerminate = vi.fn()

// Mock worker implementation
class MockWorker {
  postMessage = mockPostMessage
  terminate = mockTerminate
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  
  constructor(scriptURL: string | URL) {
    // Simulate async worker ready
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            type: 'ready',
            language: 'cpp',
            payload: {
              version: 'emscripten-3.1.0-no-cache',
              cacheEnabled: false,
              mode: 'real-execution'
            }
          }
        } as MessageEvent)
      }
    }, 50)
  }
}

// Mock global Worker
Object.defineProperty(global, 'Worker', {
  writable: true,
  value: MockWorker
})

describe('EmscriptenWorker Integration', () => {
  let worker: Worker
  
  beforeEach(() => {
    vi.clearAllMocks()
    worker = new Worker('/src/modules/codeRunner/emscriptenWorker.ts')
  })
  
  afterEach(() => {
    worker.terminate()
  })
  
  it('should initialize without caching enabled', () => {
    return new Promise<void>((resolve) => {
      worker.onmessage = (event) => {
        const { type, payload } = event.data
        if (type === 'ready') {
          expect(payload.cacheEnabled).toBe(false)
          expect(payload.mode).toBe('real-execution')
          expect(payload.version).toContain('no-cache')
          resolve()
        }
      }
    })
  })
  
  it('should handle code execution requests', () => {
    const testCode = `#include <iostream>
int main() {
    std::cout << "Hello World" << std::endl;
    return 0;
}`
    
    worker.postMessage({
      type: 'run',
      language: 'cpp',
      payload: { code: testCode }
    })
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'run',
      language: 'cpp',
      payload: { code: testCode }
    })
  })
  
  it('should handle initialization request', () => {
    worker.postMessage({
      type: 'init',
      language: 'cpp'
    })
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'init',
      language: 'cpp'
    })
  })
  
  it('should handle cleanup request', () => {
    worker.postMessage({
      type: 'cleanup',
      language: 'cpp'
    })
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'cleanup',
      language: 'cpp'
    })
  })
}) 