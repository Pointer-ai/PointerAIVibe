/**
 * PDF 解析工具
 * 使用 pdfjs-dist 库解析 PDF 文件内容
 */

import * as pdfjsLib from 'pdfjs-dist'
import { log, error } from './logger'

// 设置 worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/**
 * 解析 PDF 文件，提取文本内容
 */
export async function parsePDF(file: File): Promise<string> {
  try {
    log('[pdfParser] Starting PDF parsing')
    
    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // 禁用字体解析以提高性能
      disableFontFace: true,
      // 设置渲染超时
      isEvalSupported: false
    })
    
    const pdf = await loadingTask.promise
    log(`[pdfParser] PDF loaded, total pages: ${pdf.numPages}`)
    
    let fullText = ''
    
    // 逐页提取文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // 将文本项组合成完整文本
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
      
      // 清理页面资源
      page.cleanup()
    }
    
    // 清理 PDF 文档资源
    await pdf.cleanup()
    await pdf.destroy()
    
    log('[pdfParser] PDF parsing completed')
    return fullText.trim()
    
  } catch (err) {
    error('[pdfParser] Failed to parse PDF:', err)
    throw new Error('PDF 解析失败，请确保文件未损坏')
  }
}

/**
 * 检查文件是否为 PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
} 