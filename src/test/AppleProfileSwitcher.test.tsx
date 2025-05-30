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
  verifyPassword: vi.fn(),
  createProfile: vi.fn(),
  deleteProfile: vi.fn()
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

  // 新增功能测试
  it('shows create profile modal when create button is clicked', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('创建新 Profile')).toBeInTheDocument()
    })
    
    // Click create profile
    fireEvent.click(screen.getByText('创建新 Profile'))
    
    await waitFor(() => {
      expect(screen.getByText('创建新 Profile')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
      expect(screen.getByText('选择头像')).toBeInTheDocument()
    })
  })

  it('creates new profile with valid data', async () => {
    const onProfileSwitch = vi.fn()
    const newProfile = {
      id: 'new-profile',
      name: 'New User',
      avatar: '🚀',
      hasPassword: false,
      createdAt: '2024-01-03',
      data: {}
    }
    
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    vi.mocked(profileUtils.createProfile).mockReturnValue(newProfile)
    
    render(<AppleProfileSwitcher onProfileSwitch={onProfileSwitch} />)
    
    // Open dropdown and click create
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('创建新 Profile'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
    })
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'New User' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('创建Profile'))
    
    expect(profileUtils.createProfile).toHaveBeenCalledWith('New User', undefined, '👤')
    expect(profileUtils.setCurrentProfile).toHaveBeenCalledWith('new-profile')
    expect(onProfileSwitch).toHaveBeenCalled()
  })

  it('shows validation errors in create form', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open create modal
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('创建新 Profile'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
    })
    
    // Try to submit empty form by finding the form element
    const form = document.querySelector('form')
    expect(form).toBeTruthy()
    
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument()
    })
    
    // Clear error by entering text, then enter short name
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'Valid Name' }
    })
    
    // Wait for error to clear, then test short name
    await waitFor(() => {
      expect(screen.queryByText('请输入用户名')).not.toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'A' }
    })
    
    // Submit with short name
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByText('用户名至少需要2个字符')).toBeInTheDocument()
    })

    // Clear error and test existing username
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'Valid Name' }
    })

    await waitFor(() => {
      expect(screen.queryByText('用户名至少需要2个字符')).not.toBeInTheDocument()
    })

    // Now test existing username (same as mockCurrentProfile.name)
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'Test User' }
    })
    
    // Submit with existing name
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('用户名已存在')).toBeInTheDocument()
    })
  })

  it('validates password confirmation in create form', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open create modal
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('创建新 Profile'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
    })
    
    // Fill form with mismatched passwords (use unique username)
    fireEvent.change(screen.getByPlaceholderText('输入用户名'), {
      target: { value: 'Unique User' }
    })
    fireEvent.change(screen.getByPlaceholderText('留空表示无密码保护'), {
      target: { value: 'password123' }
    })
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('再次输入密码')).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByPlaceholderText('再次输入密码'), {
      target: { value: 'different123' }
    })
    fireEvent.click(screen.getByText('创建Profile'))
    
    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
    })
  })

  it('shows delete confirmation modal when delete button is clicked', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    // Wait for dropdown and hover over a profile to show delete button
    await waitFor(() => {
      const profileRow = screen.getByText('Other User').closest('.group')
      expect(profileRow).toBeInTheDocument()
      
      // Simulate hover to show delete button
      if (profileRow) {
        fireEvent.mouseEnter(profileRow)
      }
    })
    
    // Find delete button (it might be visible now)
    const deleteButtons = screen.getAllByTitle('删除此Profile')
    expect(deleteButtons.length).toBeGreaterThan(0)
    
    // Click first delete button
    fireEvent.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('删除确认')).toBeInTheDocument()
      expect(screen.getByText('此操作无法撤销，所有数据将永久丢失')).toBeInTheDocument()
    })
  })

  it('deletes profile after password confirmation', async () => {
    const onLogout = vi.fn()
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockOtherProfile) // Current user is password-protected
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockOtherProfile])
    vi.mocked(profileUtils.verifyPassword).mockReturnValue(true)
    
    render(<AppleProfileSwitcher onLogout={onLogout} />)
    
    // Open dropdown and click delete current profile
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      const deleteButton = screen.getByTitle('删除此Profile')
      fireEvent.click(deleteButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('输入密码确认删除')).toBeInTheDocument()
    })
    
    // Enter password and confirm delete
    fireEvent.change(screen.getByPlaceholderText('输入密码'), {
      target: { value: 'correct-password' }
    })
    fireEvent.click(screen.getByText('确认删除'))
    
    expect(profileUtils.verifyPassword).toHaveBeenCalledWith('profile2', 'correct-password')
    expect(profileUtils.deleteProfile).toHaveBeenCalledWith('profile2')
    expect(onLogout).toHaveBeenCalled()
  })

  it('shows warning for non-password profile deletion', async () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockNonPasswordProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockNonPasswordProfile])
    
    render(<AppleProfileSwitcher />)
    
    // Open dropdown and click delete
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      const deleteButton = screen.getByTitle('删除此Profile')
      fireEvent.click(deleteButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('危险操作')).toBeInTheDocument()
      expect(screen.getByText('删除后无法恢复，请确认您真的要执行此操作。')).toBeInTheDocument()
    })
    
    // Can confirm delete directly (no password needed)
    fireEvent.click(screen.getByText('确认删除'))
    
    expect(profileUtils.deleteProfile).toHaveBeenCalledWith('profile3')
  })
}) 