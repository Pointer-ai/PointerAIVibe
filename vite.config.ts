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
    },
    // 配置代理来处理 PDF.js worker
    proxy: {
      '/pdf.worker.min.js': {
        target: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js',
        changeOrigin: true,
        rewrite: () => ''
      }
    }
  }
}) 