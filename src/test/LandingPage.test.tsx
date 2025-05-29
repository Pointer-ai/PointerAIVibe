import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LandingPage from '../components/LandingPage'
import * as profileUtils from '../utils/profile'

// Mock profile utils
vi.mock('../utils/profile', () => ({
  getCurrentProfile: vi.fn(),
  getProfiles: vi.fn(),
  setCurrentProfile: vi.fn(),
  logout: vi.fn()
}))

const mockProfile = {
  id: 'profile1',
  name: 'Test User',
  avatar: '👤',
  hasPassword: false,
  createdAt: '2024-01-01',
  lastLogin: '2024-01-02',
  data: {}
}

describe('LandingPage', () => {
  const mockProps = {
    onGetStarted: vi.fn(),
    onLogin: vi.fn(),
    onDashboard: vi.fn(),
    onProfileSwitch: vi.fn(),
    onLogout: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // 默认设置
    vi.mocked(profileUtils.getProfiles).mockReturnValue([])
  })

  it('renders login button when no profile', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(null)
    
    render(<LandingPage {...mockProps} />)
    
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('renders profile switcher when logged in', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockProfile])
    
    render(<LandingPage {...mockProps} />)
    
    // 应该显示用户名
    expect(screen.getByText('Test User')).toBeInTheDocument()
    // 应该显示进入控制台按钮
    expect(screen.getByText('进入控制台')).toBeInTheDocument()
  })

  it('calls onLogout when logout is triggered', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockProfile])
    
    render(<LandingPage {...mockProps} />)
    
    // 找到用户按钮并点击
    const userArea = screen.getByText('Test User').closest('button')
    if (userArea) {
      fireEvent.click(userArea)
    }
    
    // 等待下拉菜单出现并点击退出登录
    await waitFor(() => {
      const logoutButton = screen.getByText('退出登录')
      expect(logoutButton).toBeInTheDocument()
      fireEvent.click(logoutButton)
    })
    
    expect(mockProps.onLogout).toHaveBeenCalled()
  })

  it('calls onProfileSwitch when switching profiles', async () => {
    const mockOtherProfile = { ...mockProfile, id: 'profile2', name: 'Other User' }
    
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockProfile, mockOtherProfile])
    
    render(<LandingPage {...mockProps} />)
    
    // 找到用户按钮并点击
    const userArea = screen.getByText('Test User').closest('button')
    if (userArea) {
      fireEvent.click(userArea)
    }
    
    // 等待下拉菜单出现并点击其他 profile
    await waitFor(() => {
      const otherProfileButton = screen.getByText('Other User')
      expect(otherProfileButton).toBeInTheDocument()
      fireEvent.click(otherProfileButton)
    })
    
    expect(mockProps.onProfileSwitch).toHaveBeenCalled()
  })
}) 