import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // 为 pdfjs-dist 提供全局变量
    global: 'globalThis'
  },
  optimizeDeps: {
    // 排除 pdfjs-dist 的依赖优化，避免worker路径问题
    exclude: ['pdfjs-dist', 'pyodide'],
    // 包含 Monaco Editor 相关依赖进行优化
    include: ['monaco-editor/esm/vs/language/json/json.worker', 
              'monaco-editor/esm/vs/language/css/css.worker',
              'monaco-editor/esm/vs/language/html/html.worker',
              'monaco-editor/esm/vs/language/typescript/ts.worker',
              'monaco-editor/esm/vs/editor/editor.worker']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  worker: {
    format: 'es'
  }
}) 