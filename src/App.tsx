import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfileManager from './components/ProfileManager'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import { AbilityAssessView } from './modules/abilityAssess'
import { ProfileSettingsView } from './modules/profileSettings'
import { CodeRunnerView } from './modules/codeRunner'
import { PathPlanView } from './modules/pathPlan'
import { CourseContentPage } from './modules/courseContent'
import { GlobalAIAssistant } from './components/AIAssistant'
import AgentDemo from './demo/AgentDemo'
import DataInspector from './components/DataInspector'
import { getCurrentProfileId } from './utils/profile'
import { TestRandomSearch } from './pages/TestRandomSearch'
import { GoalSetting } from './components/GoalSetting'
import { t } from './utils/i18n'

type AppView = 'landing' | 'profile' | 'dashboard' | 'ability-assess' | 'goal-setting' | 'path-plan' | 'course-content' | 'code-runner' | 'profile-settings' | 'test-random-search' | 'agent-demo' | 'data-inspector'

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing')
  const [selectedGoalTitle, setSelectedGoalTitle] = useState<string | null>(null)

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

  const handleNavigateFromAssessment = (view: string, goalTitle?: string) => {
    if (goalTitle) {
      setSelectedGoalTitle(goalTitle)
    }
    setCurrentView(view as AppView)
  }

  const handleNavigate = (view: AppView, goalTitle?: string) => {
    if (goalTitle) {
      setSelectedGoalTitle(goalTitle)
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
                title={t('navigation.abilityAssess')} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AbilityAssessView onNavigate={handleNavigateFromAssessment} />
              </Layout>
            )
          
          case 'profile-settings':
            return (
              <Layout 
                title={t('navigation.profileSettings')} 
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
                title={t('navigation.codeRunner')} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <CodeRunnerView />
              </Layout>
            )
          
          case 'agent-demo':
            return (
              <Layout 
                title={t('navigation.agentDemo')} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AgentDemo />
              </Layout>
            )
          
          case 'data-inspector':
            return (
              <Layout 
                title={t('navigation.dataInspector')} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <DataInspector />
              </Layout>
            )
          
          case 'goal-setting':
            return (
              <Layout 
                title={t('navigation.goalSetting')} 
                onBack={() => {
                  setSelectedGoalTitle(null)
                  handleBackToDashboard()
                }}
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <GoalSetting selectedGoalTitle={selectedGoalTitle} onGoalSelect={setSelectedGoalTitle} />
              </Layout>
            )
          
          case 'path-plan':
            return (
              <Layout 
                title={t('navigation.pathPlan')} 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <PathPlanView />
              </Layout>
            )
          
          case 'course-content':
            return <CourseContentPage onBack={handleBackToDashboard} onHome={handleGoHome} />
          
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