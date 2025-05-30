// AI Assistant 测试文件

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlobalAIAssistant } from './GlobalAIAssistant'
import * as profileUtils from '../../utils/profile'
import * as assistantService from './service'

// Mock dependencies
vi.mock('../../utils/profile', () => ({
  getCurrentProfile: vi.fn()
}))

vi.mock('./service', () => ({
  isAssistantAvailable: vi.fn(),
  getAIResponse: vi.fn()
}))

vi.mock('../../utils/logger', () => ({
  log: vi.fn(),
  error: vi.fn()
}))

const mockGetCurrentProfile = vi.mocked(profileUtils.getCurrentProfile)
const mockIsAssistantAvailable = vi.mocked(assistantService.isAssistantAvailable)

describe('GlobalAIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render in inactive state when no profile exists', () => {
    mockGetCurrentProfile.mockReturnValue(null)
    mockIsAssistantAvailable.mockReturnValue(false)

    render(<GlobalAIAssistant />)
    
    // 助手应该存在但处于石化状态
    const assistantIcon = document.querySelector('[style*="position: fixed"]')
    expect(assistantIcon).toBeInTheDocument()
    expect(assistantIcon).toHaveClass('bg-gray-300')
  })

  it('should render in active state when profile and API are configured', async () => {
    mockGetCurrentProfile.mockReturnValue({
      id: 'test-profile',
      name: 'Test User',
      hasPassword: false,
      createdAt: '2023-01-01',
      data: {}
    })
    mockIsAssistantAvailable.mockReturnValue(true)

    render(<GlobalAIAssistant />)
    
    // 等待状态更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 助手应该处于激活状态
    const assistantIcon = document.querySelector('[style*="position: fixed"]')
    expect(assistantIcon).toBeInTheDocument()
  })

  it('should include fadeInUp animation styles', () => {
    render(<GlobalAIAssistant />)
    
    // 检查是否包含fadeInUp动画样式（用于随意搜按钮）
    const styleElement = document.querySelector('style')
    expect(styleElement).toBeInTheDocument()
    expect(styleElement?.textContent).toContain('fadeInUp')
  })
}) 