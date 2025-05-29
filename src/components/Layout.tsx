import React from 'react'
import { getCurrentProfile } from '../utils/profile'

interface LayoutProps {
  title?: string
  onBack?: () => void
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ title, onBack, children }) => {
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
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
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
            
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="text-xl">{profile.avatar}</span>
                <span>{profile.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}

export default Layout 