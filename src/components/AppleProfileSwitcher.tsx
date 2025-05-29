import React, { useState, useRef, useEffect } from 'react'
import { getCurrentProfile, getProfiles, setCurrentProfile, logout, type Profile } from '../utils/profile'

interface AppleProfileSwitcherProps {
  onProfileSwitch?: () => void
  onLogout?: () => void
  className?: string
}

const AppleProfileSwitcher: React.FC<AppleProfileSwitcherProps> = ({
  onProfileSwitch,
  onLogout,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const currentProfile = getCurrentProfile()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAllProfiles(getProfiles())
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileSwitch = (profileId: string) => {
    setCurrentProfile(profileId)
    setIsOpen(false)
    onProfileSwitch?.()
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    onLogout?.()
  }

  if (!currentProfile) return null

  const otherProfiles = allProfiles.filter(p => p.id !== currentProfile.id)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center space-x-3 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 ease-out"
      >
        {/* 头像 */}
        <div className="relative">
          <div className="w-8 h-8 flex items-center justify-center text-lg bg-gradient-to-br from-white/20 to-white/10 rounded-full border border-white/30 transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-lg group-hover:border-white/50">
            {currentProfile.avatar || '👤'}
          </div>
          {/* 在线状态指示器 */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>
        
        {/* 用户名 */}
        <span className="text-sm font-medium text-white max-w-24 truncate">
          {currentProfile.name}
        </span>
        
        {/* 下拉箭头 */}
        <svg 
          className={`w-4 h-4 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden z-50">
          {/* 当前用户信息 */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border border-gray-200">
                {currentProfile.avatar || '👤'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentProfile.name}</h3>
                <p className="text-sm text-gray-500">
                  {currentProfile.lastLogin 
                    ? `上次登录 ${new Date(currentProfile.lastLogin).toLocaleDateString('zh-CN')}`
                    : '首次登录'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 其他 Profiles */}
          {otherProfiles.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                切换 Profile
              </div>
              {otherProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSwitch(profile.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-8 h-8 flex items-center justify-center text-lg bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border border-gray-200 transition-transform group-hover:scale-105">
                    {profile.avatar || '👤'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                    <div className="text-xs text-gray-500">
                      {profile.hasPassword && (
                        <span className="inline-flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          受密码保护
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* 分割线 */}
          <div className="border-t border-gray-200/50 my-1"></div>

          {/* 操作按钮 */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppleProfileSwitcher 