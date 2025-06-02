import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProfileManager from './components/ProfileManager'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import { ProfileSettingsView } from './modules/profileSettings'
import { GlobalAIAssistant } from './components/AIAssistant'
import { getCurrentProfileId } from './utils/profile'

// 重构系统组件导入
import { 
  AssessmentPage,
  GoalManagementPage,
  DataManagementPage
} from './refactor'
import { PathPlanningPage } from './refactor/pages/PathPlanning'
import { CourseContentPage } from './refactor/pages/CourseContent'
import { PathActivationDebugPage } from './refactor/pages/PathActivationDebug'

// CodeRunner重构版本 (使用refactor目录下的)
import { IntegratedCodeRunner } from './refactor/components/features/CodeRunner'

type AppView = 'landing' | 'profile' | 'dashboard' | 'profile-settings' |
  'refactor-assessment' | 'refactor-goal-management' | 'refactor-path-planning' | 
  'refactor-course-content' | 'refactor-code-runner' | 'refactor-data-management' |
  'refactor-path-activation-debug'

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

  // 创建包装的导航函数，用于重构页面
  const handleRefactorNavigate = (view: string) => {
    // 这里可以添加类型检查，暂时忽略，因为重构页面的导航可能不需要路由切换
    console.log('Refactor navigation:', view)
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

          case 'refactor-assessment':
            return (
              <Layout 
                title="🔍 能力评估" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <AssessmentPage />
              </Layout>
            )

          case 'refactor-goal-management':
            return (
              <Layout 
                title="🎯 目标管理" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <GoalManagementPage />
              </Layout>
            )

          case 'refactor-path-planning':
            return (
              <Layout 
                title="🛤️ 路径规划" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <PathPlanningPage onNavigate={handleRefactorNavigate} />
              </Layout>
            )

          case 'refactor-course-content':
            return (
              <Layout 
                title="📚 课程内容" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <CourseContentPage onNavigate={handleRefactorNavigate} />
              </Layout>
            )

          case 'refactor-code-runner':
            return (
              <Layout 
                title="💻 代码运行" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <IntegratedCodeRunner language="python" />
                </div>
              </Layout>
            )

          case 'refactor-data-management':
            return (
              <Layout 
                title="🗂️ 数据管理" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <DataManagementPage onNavigate={handleRefactorNavigate} />
              </Layout>
            )

          case 'refactor-path-activation-debug':
            return (
              <Layout 
                title="🧪 路径激活调试" 
                onBack={handleBackToDashboard} 
                onHome={handleGoHome}
                onLogout={handleLogout}
                onProfileSwitch={handleProfileSwitch}
              >
                <PathActivationDebugPage onNavigate={handleRefactorNavigate} />
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