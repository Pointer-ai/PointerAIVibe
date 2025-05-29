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
              {/* 可点击的 Logo */}
              {onHome ? (
                <button
                  onClick={onHome}
                  className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors mr-4"
                  title="返回首页"
                >
                  Pointer.ai
                </button>
              ) : (
                <h1 className="text-xl font-bold text-gray-900 mr-4">Pointer.ai</h1>
              )}
              
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回控制台
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