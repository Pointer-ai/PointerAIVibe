import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/PointerAIVibe/',
  define: {
    // 为 pdfjs-dist 提供全局变量
    global: 'globalThis'
  },
  optimizeDeps: {
    // 排除 pdfjs-dist 的依赖优化，避免worker路径问题
    exclude: ['pdfjs-dist', 'pyodide']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
}) 