/// <reference lib="webworker" />

/**
 * JavaScript Worker
 * 在独立线程中安全运行 JavaScript 代码
 */

let jsRuntimeReady = false;
let consoleOutput: string[] = [];

/**
 * 自定义控制台实现，捕获输出
 */
const createCustomConsole = () => {
  return {
    log: (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      consoleOutput.push(message);
    },
    error: (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      consoleOutput.push(`ERROR: ${message}`);
    },
    warn: (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      consoleOutput.push(`WARN: ${message}`);
    },
    info: (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      consoleOutput.push(`INFO: ${message}`);
    }
  };
};

/**
 * 初始化 JavaScript 运行环境
 */
const initializeJavaScript = async () => {
  console.log('[javascriptWorker] Initializing JavaScript runtime...')
  
  try {
    // JavaScript 运行环境无需特殊初始化
    jsRuntimeReady = true;
    console.log('[javascriptWorker] JavaScript runtime ready')
    self.postMessage({ 
      type: 'ready', 
      language: 'javascript',
      payload: { version: 'ES2022' } 
    })
  } catch (error) {
    console.error('[javascriptWorker] Failed to initialize JavaScript runtime', error)
    self.postMessage({ 
      type: 'error', 
      language: 'javascript',
      error: String(error) 
    })
  }
}

/**
 * 安全执行 JavaScript 代码
 */
const runJavaScriptCode = async (code: string) => {
  if (!jsRuntimeReady) {
    self.postMessage({ 
      type: 'error', 
      language: 'javascript',
      error: 'JavaScript runtime not initialized' 
    })
    return
  }
  
  const startTime = performance.now()
  
  // 清空控制台输出
  consoleOutput = [];
  
  try {
    // 创建安全的执行环境
    const customConsole = createCustomConsole();
    
    // 创建受限的全局环境
    const sandboxGlobals = {
      console: customConsole,
      // 提供一些安全的全局对象
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Promise,
      setTimeout: (fn: Function, delay: number) => {
        // 限制延迟时间，防止长时间运行
        const limitedDelay = Math.min(delay, 5000);
        return setTimeout(fn, limitedDelay);
      },
      setInterval: (fn: Function, delay: number) => {
        // 限制延迟时间
        const limitedDelay = Math.min(delay, 1000);
        return setInterval(fn, limitedDelay);
      },
      clearTimeout,
      clearInterval
    };
    
    // 包装用户代码，注入自定义环境
    const wrappedCode = `
      (function() {
        'use strict';
        ${Object.keys(sandboxGlobals).map(key => 
          `const ${key} = arguments[0].${key};`
        ).join('\n')}
        
        // 用户代码
        ${code}
      })
    `;
    
    // 执行代码
    const userFunction = eval(wrappedCode);
    const result = userFunction(sandboxGlobals);
    
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    // 如果有返回值且不是 undefined，也显示出来
    let output = consoleOutput.join('\n');
    if (result !== undefined) {
      const resultStr = typeof result === 'object' 
        ? JSON.stringify(result, null, 2) 
        : String(result);
      if (output) {
        output += '\n' + resultStr;
      } else {
        output = resultStr;
      }
    }
    
    // 如果没有任何输出，显示一个默认消息
    if (!output.trim()) {
      output = '代码执行完成 (无输出)';
    }
    
    self.postMessage({ 
      type: 'result',
      language: 'javascript',
      payload: {
        result: String(result || ''),
        output: output,
        executionTime
      }
    })
  } catch (error: any) {
    const endTime = performance.now()
    const executionTime = Math.round(endTime - startTime)
    
    // 包含控制台输出和错误信息
    let errorOutput = consoleOutput.join('\n');
    if (errorOutput) {
      errorOutput += '\n';
    }
    errorOutput += `错误: ${error.message}`;
    
    self.postMessage({ 
      type: 'error',
      language: 'javascript',
      error: errorOutput,
      executionTime
    })
  }
}

// 监听主线程消息
self.addEventListener('message', async (event) => {
  const { type, payload, language } = event.data
  
  // 只处理 JavaScript 相关的消息
  if (language && language !== 'javascript') {
    return;
  }
  
  switch (type) {
    case 'init':
      await initializeJavaScript()
      break
    case 'run':
      await runJavaScriptCode(payload.code)
      break
    default:
      console.warn('[javascriptWorker] Unknown message type:', type)
  }
})

// 自动初始化
initializeJavaScript() 