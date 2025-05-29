/**
 * PDF 解析工具
 * 使用 pdfjs-dist 库解析 PDF 文件内容
 */

import * as pdfjsLib from 'pdfjs-dist'
import { log, error } from './logger'

let workerInitialized = false

/**
 * 初始化 PDF.js worker（使用可靠的CDN）
 */
function initializeWorker(): void {
  if (workerInitialized) return
  
  try {
    // 使用正确的 .mjs 扩展名（新版本pdfjs-dist使用.mjs而不是.min.js）
    const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
    log(`[pdfParser] Worker initialized with: ${workerUrl}`)
    workerInitialized = true
  } catch (err) {
    error('[pdfParser] Failed to initialize worker:', err)
    throw new Error('PDF 解析器初始化失败')
  }
}

/**
 * 解析 PDF 文件，提取文本内容
 */
export async function parsePDF(file: File): Promise<string> {
  try {
    log('[pdfParser] Starting PDF parsing')
    
    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('PDF 文件过大，请选择小于 10MB 的文件')
    }
    
    // 初始化 worker
    initializeWorker()
    
    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    log(`[pdfParser] File converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`)
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // 禁用字体解析以提高性能
      disableFontFace: true,
      // 设置渲染超时
      isEvalSupported: false,
      // 添加更多配置
      verbosity: 0, // 减少控制台输出
      // 使用本地字体映射
      useSystemFonts: false,
      // 标准字体路径
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    })
    
    const pdf = await loadingTask.promise
    log(`[pdfParser] PDF loaded successfully, total pages: ${pdf.numPages}`)
    
    let fullText = ''
    let processedPages = 0
    
    // 逐页提取文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // 将文本项组合成完整文本，保持空格和换行
        const pageText = textContent.items
          .map((item: any) => {
            // 检查item是否有str属性
            if (item && typeof item.str === 'string') {
              return item.str
            }
            return ''
          })
          .filter(text => text.trim().length > 0)
          .join(' ')
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n'
          processedPages++
        }
        
        // 清理页面资源
        page.cleanup()
        
        log(`[pdfParser] Processed page ${pageNum}/${pdf.numPages}`)
        
      } catch (pageError) {
        error(`[pdfParser] Failed to process page ${pageNum}:`, pageError)
        // 继续处理其他页面
      }
    }
    
    // 清理 PDF 文档资源
    await pdf.cleanup()
    await pdf.destroy()
    
    log(`[pdfParser] PDF parsing completed, processed ${processedPages}/${pdf.numPages} pages`)
    
    if (!fullText.trim()) {
      throw new Error('PDF 中未找到可提取的文本内容，可能是扫描版PDF')
    }
    
    return fullText.trim()
    
  } catch (err) {
    error('[pdfParser] Failed to parse PDF:', err)
    
    // 根据错误类型提供更具体的错误信息
    if (err instanceof Error) {
      if (err.message.includes('worker') || err.message.includes('CDN') || err.message.includes('fetch')) {
        throw new Error('PDF 解析器初始化失败，请检查网络连接后重试')
      } else if (err.message.includes('password')) {
        throw new Error('PDF 文件受密码保护，请提供解密后的文件')
      } else if (err.message.includes('corrupted') || err.message.includes('Invalid')) {
        throw new Error('PDF 文件损坏或格式不正确')
      } else if (err.message.includes('扫描版')) {
        throw new Error('PDF 中未找到可提取的文本内容，可能是扫描版PDF')
      } else if (err.message.includes('过大')) {
        throw new Error('PDF 文件过大，请选择小于 10MB 的文件')
      } else {
        throw new Error(`PDF 解析失败: ${err.message}`)
      }
    }
    
    throw new Error('PDF 解析失败，请确保文件未损坏')
  }
}

/**
 * 检查文件是否为 PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * 验证 PDF 文件是否可以处理
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  if (!isPDF(file)) {
    return { valid: false, error: '请选择 PDF 格式的文件' }
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'PDF 文件过大，请选择小于 10MB 的文件' }
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'PDF 文件为空' }
  }
  
  return { valid: true }
}

/**
 * 重置 worker 初始化状态（用于测试）
 */
export function resetWorker(): void {
  workerInitialized = false
} 