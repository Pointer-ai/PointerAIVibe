import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppleProfileSwitcher from '../components/AppleProfileSwitcher'
import * as profileUtils from '../utils/profile'

// Mock profile utils
vi.mock('../utils/profile', () => ({
  getCurrentProfile: vi.fn(),
  getProfiles: vi.fn(),
  setCurrentProfile: vi.fn(),
  logout: vi.fn()
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

  it('switches profile when other profile is clicked', async () => {
    const onProfileSwitch = vi.fn()
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockCurrentProfile)
    vi.mocked(profileUtils.getProfiles).mockReturnValue([mockCurrentProfile, mockOtherProfile])
    
    render(<AppleProfileSwitcher onProfileSwitch={onProfileSwitch} />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    
    // Click other profile
    fireEvent.click(screen.getByText('Other User'))
    
    expect(profileUtils.setCurrentProfile).toHaveBeenCalledWith('profile2')
    expect(onProfileSwitch).toHaveBeenCalled()
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