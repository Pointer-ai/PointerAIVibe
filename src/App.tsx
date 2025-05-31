import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfileManager from './components/ProfileManager'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import { AbilityAssessView } from './modules/abilityAssess'
import { ProfileSettingsView } from './modules/profileSettings'
import { CodeRunnerView } from './modules/codeRunner'
import { GlobalAIAssistant } from './components/AIAssistant'
import { AgentChat } from './components/AIAgent/AgentChat'
import AgentDemo from './demo/AgentDemo'
import LearningPathView from './components/LearningPathView'
import DataInspector from './components/DataInspector'
import { getCurrentProfileId } from './utils/profile'
import { TestRandomSearch } from './pages/TestRandomSearch'

type AppView = 'landing' | 'profile' | 'dashboard' | 'ability-assess' | 'goal-setting' | 'path-plan' | 'course-content' | 'code-runner' | 'profile-settings' | 'test-random-search' | 'agent-demo' | 'agent-chat' | 'learning-path-view' | 'data-inspector'

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

  const handleProfileLogin = () => {
    setCurrentView('profile')
  }

  const handleLogout = () => {
    // 强制跳转到首页
    setCurrentView('landing')
  }

  const handleProfileSwitch = () => {
    // 刷新当前视图以反映 profile 切换
    // 如果在首页，保持在首页但会重新渲染以显示新的 profile 信息
    // 如果在其他页面，返回到 dashboard
    const profileId = getCurrentProfileId()
    if (profileId) {
      if (currentView === 'landing') {
        // 触发重新渲染 - 这里可以用强制更新的方式
        setCurrentView('landing')
      } else {
        setCurrentView('dashboard')
      }
    } else {
      // 如果没有 profile，跳转到首页
      setCurrentView('landing')
    }
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

  // 创建返回首页的函数
  const handleGoHome = () => {
    setCurrentView('landing')
  }

  return (
    <>
      {/* 主界面内容 */}
      {(() => {
        switch (currentView) {
          case 'landing':
            return <LandingPage 
              onGetStarted={handleGetStarted} 
              onLogin={handleProfileLogin} 
              onDashboard={handleBackToDashboard}
              onProfileSwitch={handleProfileSwitch}
              onLogout={handleLogout}
            />
          
          case 'profile':
            return <ProfileManager onLogin={handleLogin} />
          
          case 'dashboard':
            return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} onHome={handleGoHome} />
          
          case 'ability-assess':
            return (
              <Layout 
                title="能力评估" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AbilityAssessView />
              </Layout>
            )
          
          case 'profile-settings':
            return (
              <Layout 
                title="Profile 设置" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <ProfileSettingsView />
              </Layout>
            )
          
          case 'code-runner':
            return (
              <Layout 
                title="代码运行器" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <CodeRunnerView />
              </Layout>
            )
          
          case 'test-random-search':
            return (
              <Layout 
                title="随机搜索测试" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <TestRandomSearch />
              </Layout>
            )
          
          case 'agent-demo':
            return (
              <Layout 
                title="Agent Demo" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AgentDemo />
              </Layout>
            )
          
          case 'agent-chat':
            return (
              <Layout 
                title="Agent Chat" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AgentChat />
              </Layout>
            )
          
          case 'learning-path-view':
            return (
              <Layout 
                title="学习路径管理" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <LearningPathView />
              </Layout>
            )
          
          case 'data-inspector':
            return (
              <Layout 
                title="数据检查器" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <DataInspector />
              </Layout>
            )
          
          // 其他模块的占位符
          case 'goal-setting':
          case 'path-plan':
          case 'course-content':
            const titles = {
              'goal-setting': '目标设定',
              'path-plan': '路径规划',
              'course-content': '课程内容'
            }
            
            return (
              <Layout 
                title={titles[currentView]} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
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
            return <LandingPage 
              onGetStarted={handleGetStarted} 
              onLogin={handleProfileLogin}
              onDashboard={handleBackToDashboard}
              onProfileSwitch={handleProfileSwitch}
              onLogout={handleLogout}
            />
        }
      })()}

      {/* 全局AI助手 */}
      <GlobalAIAssistant />
    </>
  )
}

export default App 