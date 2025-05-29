import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfileManager from './components/ProfileManager'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import { AbilityAssessView } from './modules/abilityAssess'
import { ProfileSettingsView } from './modules/profileSettings'
import { getCurrentProfileId } from './utils/profile'

type AppView = 'landing' | 'profile' | 'dashboard' | 'ability-assess' | 'goal-setting' | 'path-plan' | 'course-content' | 'code-runner' | 'profile-settings'

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

  const handleNavigate = (view: AppView) => {
    // 确保用户已登录才能访问其他模块
    const profileId = getCurrentProfileId()
    if (!profileId && view !== 'landing' && view !== 'profile') {
      setCurrentView('profile')
      return
    }
    setCurrentView(view)
  }

  // 创建返回 Dashboard 的函数
  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  switch (currentView) {
    case 'landing':
      return <LandingPage onGetStarted={handleGetStarted} />
    
    case 'profile':
      return <ProfileManager onLogin={handleLogin} />
    
    case 'dashboard':
      return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} />
    
    case 'ability-assess':
      return (
        <Layout title="能力评估" onBack={handleBackToDashboard}>
          <AbilityAssessView />
        </Layout>
      )
    
    case 'profile-settings':
      return (
        <Layout title="Profile 设置" onBack={handleBackToDashboard}>
          <ProfileSettingsView />
        </Layout>
      )
    
    // 其他模块的占位符
    case 'goal-setting':
    case 'path-plan':
    case 'course-content':
    case 'code-runner':
      const titles = {
        'goal-setting': '目标设定',
        'path-plan': '路径规划',
        'course-content': '课程内容',
        'code-runner': '代码运行'
      }
      
      return (
        <Layout title={titles[currentView]} onBack={handleBackToDashboard}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {titles[currentView]}
              </h2>
              <p className="text-gray-600">该模块正在开发中...</p>
            </div>
          </div>
        </Layout>
      )
    
    default:
      return <LandingPage onGetStarted={handleGetStarted} />
  }
}

export default App 