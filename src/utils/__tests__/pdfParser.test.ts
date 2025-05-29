/**
 * PDF 解析工具测试
 */

import { describe, it, expect, vi } from 'vitest'
import { isPDF, validatePDFFile } from '../pdfParser'

// Mock the logger
vi.mock('../logger', () => ({
  log: vi.fn(),
  error: vi.fn()
}))

describe('PDF Parser', () => {
  describe('isPDF', () => {
    it('should identify PDF files by MIME type', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      expect(isPDF(pdfFile)).toBe(true)
    })

    it('should identify PDF files by extension', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'text/plain' })
      expect(isPDF(pdfFile)).toBe(true)
    })

    it('should reject non-PDF files', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      expect(isPDF(textFile)).toBe(false)
    })
  })

  describe('validatePDFFile', () => {
    it('should validate correct PDF file', () => {
      const pdfFile = new File(['x'.repeat(1000)], 'test.pdf', { type: 'application/pdf' })
      const result = validatePDFFile(pdfFile)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject non-PDF files', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = validatePDFFile(textFile)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('请选择 PDF 格式的文件')
    })

    it('should reject oversized files', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      const result = validatePDFFile(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('PDF 文件过大，请选择小于 10MB 的文件')
    })

    it('should reject empty files', () => {
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' })
      const result = validatePDFFile(emptyFile)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('PDF 文件为空')
    })
  })
}) 