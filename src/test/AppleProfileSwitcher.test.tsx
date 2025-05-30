import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppleProfileSwitcher from '../components/AppleProfileSwitcher'
import * as profileUtils from '../utils/profile'

// Mock profile utils
vi.mock('../utils/profile', () => ({
  getCurrentProfile: vi.fn(),
  getProfiles: vi.fn(),
  setCurrentProfile: vi.fn(),
  logout: vi.fn(),
  verifyPassword: vi.fn()
}))

const mockCurrentProfile = {
  id: 'profile1',
  name: 'Test User',
  avatar: '👤',
  hasPassword: false,
  createdAt: '2024-01-01',
  lastLogin: '2024-01-02',
  data: {}
}

const mockOtherProfile = {
  id: 'profile2',
  name: 'Other User',
  avatar: '🦊',
  hasPassword: true,
  createdAt: '2024-01-01',
  data: {}
}

const mockNonPasswordProfile = {
  id: 'profile3',
  name: 'Free User',
  avatar: '🐱',
  hasPassword: false,
  createdAt: '2024-01-01',
  data: {}
}

describe('AppleProfileSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no current profile', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(null)
    
    const { container } = render(<AppleProfileSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('renders current profile correctly', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    render(<AppleProfileSwitcher />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('shows dropdown when clicked', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('切换 Profile')).toBeInTheDocument()
      expect(screen.getByText('Other User')).toBeInTheDocument()
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })
  })

  it('directly switches to non-password profile when clicked', async () => {
    const onProfileSwitch = vi.fn()
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockNonPasswordProfile])
    
    render(<AppleProfileSwitcher onProfileSwitch={onProfileSwitch} />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Free User')).toBeInTheDocument()
    })
    
    // Click non-password profile
    fireEvent.click(screen.getByText('Free User'))
    
    expect(profileUtils.setCurrentProfile).toHaveBeenCalledWith('profile3')
    expect(onProfileSwitch).toHaveBeenCalled()
  })

  it('shows password modal when password-protected profile is clicked', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    // Click password-protected profile
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByText('欢迎回来')).toBeInTheDocument()
      expect(screen.getByText('Other User')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    })
  })

  it('switches profile when correct password is entered', async () => {
    const onProfileSwitch = vi.fn()
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    vi.mocked(profileUtils.verifyPassword).mockReturnValue(true)
    
    render(<AppleProfileSwitcher onProfileSwitch={onProfileSwitch} />)
    
    // Open dropdown and click password-protected profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    })
    
    // Enter password and submit
    const passwordInput = screen.getByPlaceholderText('输入密码')
    fireEvent.change(passwordInput, { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByText('确认解锁'))
    
    expect(profileUtils.verifyPassword).toHaveBeenCalledWith('profile2', 'correct-password')
    expect(profileUtils.setCurrentProfile).toHaveBeenCalledWith('profile2')
    expect(onProfileSwitch).toHaveBeenCalled()
  })

  it('shows error when incorrect password is entered', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    vi.mocked(profileUtils.verifyPassword).mockReturnValue(false)
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown and click password-protected profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    })
    
    // Enter wrong password and submit
    const passwordInput = screen.getByPlaceholderText('输入密码')
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByText('确认解锁'))
    
    await waitFor(() => {
      expect(screen.getByText('密码错误')).toBeInTheDocument()
    })
    
    expect(profileUtils.verifyPassword).toHaveBeenCalledWith('profile2', 'wrong-password')
    expect(profileUtils.setCurrentProfile).not.toHaveBeenCalled()
  })

  it('disables submit button when password is empty or whitespace', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown and click password-protected profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByText('确认解锁')
    const passwordInput = screen.getByPlaceholderText('输入密码')
    
    // Initially button should be disabled when empty
    expect(submitButton).toBeDisabled()
    
    // Enter valid text - button should be enabled
    fireEvent.change(passwordInput, { target: { value: 'validpassword' } })
    expect(submitButton).not.toBeDisabled()
    
    // Clear input - button should be disabled
    fireEvent.change(passwordInput, { target: { value: '' } })
    expect(submitButton).toBeDisabled()
    
    // Enter only whitespace - button should still be disabled
    fireEvent.change(passwordInput, { target: { value: '   ' } })
    expect(submitButton).toBeDisabled()
    
    // Enter mixed content with trim - button should be enabled
    fireEvent.change(passwordInput, { target: { value: '  test  ' } })
    expect(submitButton).not.toBeDisabled()
    
    expect(profileUtils.setCurrentProfile).not.toHaveBeenCalled()
  })

  it('closes password modal when cancel is clicked', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown and click password-protected profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    })
    
    // Click cancel
    fireEvent.click(screen.getByText('取消'))
    
    await waitFor(() => {
      expect(screen.queryByText('欢迎回来')).not.toBeInTheDocument()
    })
  })

  it('toggles password visibility in modal', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown and click password-protected profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Other User'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    })
    
    const passwordInput = screen.getByPlaceholderText('输入密码') as HTMLInputElement
    const toggleButton = screen.getByText('👁️')
    
    // Initially password type
    expect(passwordInput.type).toBe('password')
    
    // Click toggle button
    fireEvent.click(toggleButton)
    
    // Should be text type now
    expect(passwordInput.type).toBe('text')
    expect(screen.getByText('🙈')).toBeInTheDocument()
  })

  it('logs out when logout button is clicked', async () => {
    const onLogout = vi.fn()
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    render(<AppleProfileSwitcher onLogout={onLogout} />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })
    
    // Click logout
    fireEvent.click(screen.getByText('退出登录'))
    
    expect(profileUtils.logout).toHaveBeenCalled()
    expect(onLogout).toHaveBeenCalled()
  })

  it('shows password protection indicator for protected profiles', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('受密码保护')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    const { container } = render(<AppleProfileSwitcher className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('closes dropdown when clicking outside', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <AppleProfileSwitcher />
      </div>
    )
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('退出登录')).toBeInTheDocument()
    })
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'))
    
    await waitFor(() => {
      expect(screen.queryByText('退出登录')).not.toBeInTheDocument()
    })
  })

  it('shows online status indicator', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    const { container } = render(<AppleProfileSwitcher />)
    
    // Look for the green dot (online indicator)
    const onlineIndicator = container.querySelector('.bg-green-400')
    expect(onlineIndicator).toBeInTheDocument()
  })
}) 