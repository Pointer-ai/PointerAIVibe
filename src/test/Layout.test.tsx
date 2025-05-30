import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Layout from '../components/Layout'
import * as profileUtils from '../utils/profile'

// Mock profile utilities
vi.mock('../utils/profile')

// Mock AppleProfileSwitcher component
vi.mock('../components/AppleProfileSwitcher', () => ({
  default: ({ onProfileSwitch, onLogout }: { onProfileSwitch?: () => void, onLogout?: () => void }) => (
    <div data-testid="apple-profile-switcher">
      <button onClick={onProfileSwitch} data-testid="profile-switch-btn">Switch Profile</button>
      <button onClick={onLogout} data-testid="logout-btn">Logout</button>
    </div>
  )
}))

describe('Layout', () => {
  const mockProfile = {
    id: '1',
    name: 'Test User',
    hasPassword: false,
    createdAt: '2024-01-01',
    avatar: '👤',
    data: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders basic layout structure', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)

    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByText('Pointer.ai')).toBeInTheDocument()
    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('shows AppleProfileSwitcher when profile exists', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)

    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByTestId('apple-profile-switcher')).toBeInTheDocument()
  })

  it('does not show AppleProfileSwitcher when no profile', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(null)

    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.queryByTestId('apple-profile-switcher')).not.toBeInTheDocument()
  })

  it('calls onHome when logo is clicked', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    const onHome = vi.fn()

    render(
      <Layout title="Test Page" onHome={onHome}>
        <div>Test Content</div>
      </Layout>
    )

    fireEvent.click(screen.getByText('Pointer.ai'))
    expect(onHome).toHaveBeenCalledOnce()
  })

  it('calls onBack when back button is clicked', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    const onBack = vi.fn()

    render(
      <Layout title="Test Page" onBack={onBack}>
        <div>Test Content</div>
      </Layout>
    )

    fireEvent.click(screen.getByText('返回控制台'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onProfileSwitch when profile switch is triggered', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    const onProfileSwitch = vi.fn()

    render(
      <Layout title="Test Page" onProfileSwitch={onProfileSwitch}>
        <div>Test Content</div>
      </Layout>
    )

    fireEvent.click(screen.getByTestId('profile-switch-btn'))
    expect(onProfileSwitch).toHaveBeenCalledOnce()
  })

  it('calls onLogout when logout is triggered', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)
    const onLogout = vi.fn()

    render(
      <Layout title="Test Page" onLogout={onLogout}>
        <div>Test Content</div>
      </Layout>
    )

    fireEvent.click(screen.getByTestId('logout-btn'))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('renders without title when title is not provided', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByText('Pointer.ai')).toBeInTheDocument()
    expect(screen.queryByText('Test Page')).not.toBeInTheDocument()
  })

  it('renders non-clickable logo when onHome is not provided', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)

    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    )

    const logo = screen.getByText('Pointer.ai')
    expect(logo.tagName).toBe('H1')
  })

  it('does not show back button when onBack is not provided', () => {
    vi.mocked(profileUtils.getCurrentProfile).mockReturnValue(mockProfile)

    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.queryByText('返回控制台')).not.toBeInTheDocument()
  })
}) 