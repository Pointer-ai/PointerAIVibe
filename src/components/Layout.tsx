import React from 'react'
import { getCurrentProfile } from '../utils/profile'

interface LayoutProps {
  title?: string
  onBack?: () => void
  onHome?: () => void
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ title, onBack, onHome, children }) => {
  const profile = getCurrentProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回主页
                </button>
              )}
              {title && (
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="text-xl">{profile.avatar}</span>
                  <span>{profile.name}</span>
                </div>
              )}
              
              {/* 导航按钮组 */}
              <div className="flex items-center space-x-2">
                {/* Dashboard 按钮 */}
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="返回控制台"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                
                {/* 首页按钮 */}
                {onHome && (
                  <button
                    onClick={onHome}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="返回首页"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}

export default Layout 