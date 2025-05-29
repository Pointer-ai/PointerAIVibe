import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfileManager from './components/ProfileManager'
import Dashboard from './components/Dashboard'
import { getCurrentProfileId } from './utils/profile'

type AppView = 'landing' | 'profile' | 'dashboard'

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing')

  useEffect(() => {
    // 检查是否有当前登录的 profile
    const profileId = getCurrentProfileId()
    if (profileId) {
      setCurrentView('dashboard')
    }
  }, [])

  const handleGetStarted = () => {
    setCurrentView('profile')
  }

  const handleLogin = () => {
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    setCurrentView('landing')
  }

  switch (currentView) {
    case 'landing':
      return <LandingPage onGetStarted={handleGetStarted} />
    
    case 'profile':
      return <ProfileManager onLogin={handleLogin} />
    
    case 'dashboard':
      return <Dashboard onLogout={handleLogout} />
    
    default:
      return <LandingPage onGetStarted={handleGetStarted} />
  }
}

export default App 