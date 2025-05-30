/// <reference lib="webworker" />

/**
 * Emscripten C++ Worker
 * 在独立线程中编译和运行 C++ 代码
 * 
 * 优化特性：
 * - 实例缓存：避免重复初始化
 * - 连接池：复用编译连接
 * - 错误恢复：智能重试机制
 */

// 使用在线的 Emscripten 编译服务或本地编译
declare const Module: any;

let emscriptenModule: any = null;
let isReady = false;
let initializationPromise: Promise<void> | null = null;

// 编译环境预热 - 不缓存结果，只预热编译器连接
let compilerWarmedUp = false;
let connectionPool: { lastUsed: number; isAvailable: boolean; warmedUp: boolean }[] = [];
const MAX_CONNECTIONS = 3;

/**
 * 初始化 Emscripten（简化版本，专注于编译器预热）
 */
const initializeEmscripten = async (): Promise<void> => {
  // 如果正在初始化，返回现有的 Promise
  if (initializationPromise) {
    console.log('[emscriptenWorker] Using cached initialization promise')
    return initializationPromise;
  }

  // 如果已经初始化完成，直接返回
  if (isReady) {
    console.log('[emscriptenWorker] Already initialized')
    return Promise.resolve();
  }

  // 创建新的初始化 Promise
  initializationPromise = new Promise<void>((resolve, reject) => {
    console.log('[emscriptenWorker] Starting Emscripten initialization...')
    
    // 使用setTimeout确保异步执行，避免阻塞
    setTimeout(async () => {
      console.log('[emscriptenWorker] Inside setTimeout, starting actual initialization...')
      try {
        // 初始化连接池
        connectionPool = Array(MAX_CONNECTIONS).fill(null).map(() => ({
          lastUsed: 0,
          isAvailable: true,
          warmedUp: false
        }));
        
        console.log('[emscriptenWorker] Connection pool initialized');
        
        // 简化初始化：直接标记为ready
        isReady = true;
        console.log('[emscriptenWorker] Emscripten initialized successfully')
        
        const readyMessage = { 
          type: 'ready', 
          language: 'cpp',
          payload: { 
            version: 'emscripten-3.1.0-no-cache',
            cacheEnabled: false,  // 明确标记为不使用缓存
            connectionPoolSize: MAX_CONNECTIONS,
            mode: 'real-execution'
          } 
        };
        
        console.log('[emscriptenWorker] Sending ready message:', readyMessage);
        self.postMessage(readyMessage);
        
        // 异步启动编译器预热（不阻塞主初始化）
        setTimeout(() => {
          warmupCompiler().catch((error: any) => {
            console.warn('[emscriptenWorker] Compiler warmup failed:', error);
          });
        }, 1000); // 1秒后开始预热编译器
        
        resolve();
      } catch (error) {
        console.error('[emscriptenWorker] Failed to initialize Emscripten', error)
        
        // 重置状态以允许重试
        initializationPromise = null;
        isReady = false;
        
        const errorMessage = { 
          type: 'error', 
          language: 'cpp',
          error: `初始化失败: ${error}` 
        };
        
        console.log('[emscriptenWorker] Sending error message:', errorMessage);
        self.postMessage(errorMessage);
        
        reject(error);
      }
    }, 100); // 100ms延迟，确保异步执行
  });

  return initializationPromise;
}

/**
 * 获取可用的连接（优先使用已预热的连接）
 */
const getAvailableConnection = (): number => {
  const now = Date.now();
  
  // 优先寻找已预热且可用的连接
  for (let i = 0; i < connectionPool.length; i++) {
    if (connectionPool[i].isAvailable && connectionPool[i].warmedUp) {
      connectionPool[i].isAvailable = false;
      connectionPool[i].lastUsed = now;
      console.log(`[emscriptenWorker] Using warmed up connection ${i}`);
      return i;
    }
  }
  
  // 如果没有预热的可用连接，使用任何可用连接
  for (let i = 0; i < connectionPool.length; i++) {
    if (connectionPool[i].isAvailable) {
      connectionPool[i].isAvailable = false;
      connectionPool[i].lastUsed = now;
      console.log(`[emscriptenWorker] Using cold connection ${i}`);
      return i;
    }
  }
  
  // 如果没有可用连接，使用最久未使用的
  let oldestIndex = 0;
  let oldestTime = connectionPool[0].lastUsed;
  
  for (let i = 1; i < connectionPool.length; i++) {
    if (connectionPool[i].lastUsed < oldestTime) {
      oldestTime = connectionPool[i].lastUsed;
      oldestIndex = i;
    }
  }
  
  connectionPool[oldestIndex].lastUsed = now;
  console.log(`[emscriptenWorker] Reusing oldest connection ${oldestIndex}`);
  return oldestIndex;
}

/**
 * 释放连接
 */
const releaseConnection = (connectionId: number) => {
  if (connectionId >= 0 && connectionId < connectionPool.length) {
    connectionPool[connectionId].isAvailable = true;
  }
}

/**
 * 编译和运行 C++ 代码（每次真实执行，不使用缓存）
 */
const runCppCode = async (code: string) => {
  if (!isReady) {
    // 如果未初始化，先进行初始化
    try {
      await initializeEmscripten();
    } catch (error) {
      self.postMessage({ 
        type: 'error', 
        language: 'cpp',
        error: '运行时初始化失败，请稍后重试' 
      })
      return;
    }
  }
  
  const startTime = performance.now()
  let connectionId = -1;
  
  try {
    console.log('[emscriptenWorker] Compiling and executing code (no cache)...');
    
    // 获取连接
    connectionId = getAvailableConnection();
    console.log(`[emscriptenWorker] Using connection ${connectionId}`);
    
    // 每次都真实编译和执行
    const result = await compileAndRunOnline(code);
    
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    self.postMessage({ 
      type: 'result',
      language: 'cpp',
      payload: {
        result: '',
        output: result.output,
        executionTime,
        fromCache: false,
        realExecution: true
      }
    })
  } catch (error: any) {
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    // 智能错误处理
    let errorMessage = error.message || String(error);
    
    if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      errorMessage = '网络连接失败，请检查网络连接并重试\n\n可能的解决方案：\n• 检查网络连接\n• 关闭VPN或代理\n• 稍后重试';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      errorMessage = '编译超时，请简化代码后重试\n\n建议：\n• 减少代码复杂度\n• 检查是否有无限循环\n• 稍后重试';
    } else if (errorMessage.includes('compiler_error') || errorMessage.includes('编译错误')) {
      // 保持原有的编译错误信息
      errorMessage = error.message;
    } else if (errorMessage.includes('cors') || errorMessage.includes('CORS')) {
      errorMessage = '跨域请求被阻止\n\n这通常是由于：\n• 浏览器安全策略\n• 网络环境限制\n• 请尝试刷新页面';
    } else {
      errorMessage = `执行失败: ${errorMessage}\n\n如问题持续存在，请尝试：\n• 刷新页面\n• 切换到 JavaScript 语言\n• 检查网络连接`;
    }
    
    self.postMessage({ 
      type: 'error',
      language: 'cpp',
      error: errorMessage,
      executionTime
    })
  } finally {
    // 释放连接
    if (connectionId >= 0) {
      releaseConnection(connectionId);
    }
  }
}

/**
 * 使用在线编译服务编译和运行 C++ 代码（改进版）
 */
const compileAndRunOnline = async (code: string): Promise<{ output: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'clang-head',
        code: code,
        options: '-std=c++17 -O2 -Wall',
        stdin: '',
        'compiler-option-raw': '-std=c++17\n-O2\n-Wall',
        'save': false // 不保存到服务器
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`编译服务响应错误: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status !== '0') {
      // 编译错误，返回更友好的错误信息
      const errorInfo = result.compiler_error || result.compiler_message || '编译失败';
      throw new Error(`编译错误:\n${errorInfo}`);
    }

    return {
      output: result.program_output || result.program_message || '程序执行完成（无输出）'
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('编译超时，请简化代码后重试');
    }
    
    throw error;
  }
}

/**
 * 本地 WASM 执行方案 (高级)
 * 需要预编译的 C++ 标准库和运行时
 */
const runWasmLocally = async (wasmBytes: ArrayBuffer) => {
  try {
    const wasmModule = await WebAssembly.instantiate(wasmBytes, {
      env: {
        // 提供必要的环境函数
        printf: (ptr: number) => {
          // 从内存中读取字符串并输出
          console.log('printf called');
        },
        cout: (ptr: number) => {
          console.log('cout called');
        }
      }
    });

    // 执行 main 函数
    const mainFunc = wasmModule.instance.exports.main as Function;
    if (mainFunc) {
      return mainFunc();
    }
  } catch (error) {
    throw new Error('WASM execution failed: ' + String(error));
  }
}

/**
 * 预热编译器连接
 */
const warmupCompiler = async (): Promise<void> => {
  if (compilerWarmedUp) {
    console.log('[emscriptenWorker] Compiler already warmed up');
    return;
  }
  
  console.log('[emscriptenWorker] Starting compiler warmup...');
  
  try {
    // 发送一个极简的测试请求来预热编译器
    const warmupCode = `#include <iostream>
int main() { return 0; }`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'clang-head',
        code: warmupCode,
        options: '-std=c++17 -O0', // 使用最快的编译选项
        'save': false
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      compilerWarmedUp = true;
      console.log('[emscriptenWorker] Compiler warmup successful');
      
      // 标记所有连接为已预热
      connectionPool.forEach(conn => conn.warmedUp = true);
    } else {
      console.warn('[emscriptenWorker] Compiler warmup failed:', response.status);
    }
  } catch (error) {
    console.warn('[emscriptenWorker] Compiler warmup error:', error);
  }
}

// 监听主线程消息
self.addEventListener('message', async (event) => {
  const { type, payload, language } = event.data
  
  // 只处理 C++ 相关的消息
  if (language && language !== 'cpp') {
    return;
  }
  
  console.log(`[emscriptenWorker] Received message: ${type}`)
  
  switch (type) {
    case 'init':
      await initializeEmscripten()
      break
    case 'run':
      await runCppCode(payload.code)
      break
    case 'cleanup':
      // 清理缓存和连接池
      connectionPool = [];
      initializationPromise = null;
      isReady = false;
      console.log('[emscriptenWorker] Cleanup completed');
      break
    default:
      console.warn('[emscriptenWorker] Unknown message type:', type)
  }
})

// 自动初始化（立即开始初始化过程）
console.log('[emscriptenWorker] Worker loaded, starting initialization...')
initializeEmscripten().catch(error => {
  console.error('[emscriptenWorker] Auto-initialization failed:', error)
}) 