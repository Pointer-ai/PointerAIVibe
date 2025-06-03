import React from 'react'
import { getCurrentProfile } from '../utils/profile'
import { t } from '../utils/i18n'
import AppleProfileSwitcher from './AppleProfileSwitcher'
import LanguageSwitcher from './common/LanguageSwitcher'

interface LayoutProps {
  title?: string
  onBack?: () => void
  onHome?: () => void
  onLogout?: () => void
  onProfileSwitch?: () => void
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ 
  title, 
  onBack, 
  onHome, 
  onLogout,
  onProfileSwitch,
  children 
}) => {
  const profile = getCurrentProfile()

  const handleProfileSwitch = () => {
    onProfileSwitch?.()
  }

  const handleLogout = () => {
    onLogout?.()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              {/* 可点击的 Logo */}
              {onHome ? (
                <button
                  onClick={onHome}
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300 mr-6"
                  title={t('navigation.returnHome')}
                >
                  Pointer.ai
                </button>
              ) : (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mr-6">Pointer.ai</h1>
              )}
              
              {onBack && (
                <button
                  onClick={onBack}
                  className="group flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:border-gray-300/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/25 hover:scale-105 mr-6"
                >
                  <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">{t('navigation.backToConsole')}</span>
                </button>
              )}
              
              {title && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 语言切换器 */}
              <LanguageSwitcher compact />
              
              {profile && (
                <AppleProfileSwitcher
                  onProfileSwitch={handleProfileSwitch}
                  onLogout={handleLogout}
                  className=""
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">{children}</main>
    </div>
  )
}

export default Layout 