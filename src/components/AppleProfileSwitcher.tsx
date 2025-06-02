import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getCurrentProfile, getProfiles, setCurrentProfile, logout, verifyPassword, createProfile, deleteProfile, type Profile } from '../utils/profile'

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProfileForSwitch, setSelectedProfileForSwitch] = useState<Profile | null>(null)
  const [selectedProfileForDelete, setSelectedProfileForDelete] = useState<Profile | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // 创建Profile状态
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfilePassword, setNewProfilePassword] = useState('')
  const [newProfileConfirmPassword, setNewProfileConfirmPassword] = useState('')
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤')
  const [createError, setCreateError] = useState('')
  
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

  const refreshProfiles = () => {
    setAllProfiles(getProfiles())
  }

  const handleProfileClick = (profile: Profile) => {
    if (profile.hasPassword) {
      setSelectedProfileForSwitch(profile)
      setShowPasswordModal(true)
      setIsOpen(false)
      setPassword('')
      setPasswordError('')
      setShowPassword(false)
    } else {
      handleProfileSwitch(profile.id)
    }
  }

  const handleProfileSwitch = (profileId: string) => {
    setCurrentProfile(profileId)
    setIsOpen(false)
    refreshProfiles()
    onProfileSwitch?.()
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProfileForSwitch) return
    
    if (!password.trim()) {
      setPasswordError('请输入密码')
      return
    }
    
    if (verifyPassword(selectedProfileForSwitch.id, password)) {
      handleProfileSwitch(selectedProfileForSwitch.id)
      setShowPasswordModal(false)
      setSelectedProfileForSwitch(null)
      setPassword('')
      setPasswordError('')
    } else {
      setPasswordError('密码错误')
    }
  }

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false)
    setSelectedProfileForSwitch(null)
    setPassword('')
    setPasswordError('')
    setShowPassword(false)
  }

  const handleCreateProfile = () => {
    setShowCreateModal(true)
    setIsOpen(false)
    resetCreateForm()
  }

  const resetCreateForm = () => {
    setNewProfileName('')
    setNewProfilePassword('')
    setNewProfileConfirmPassword('')
    setNewProfileAvatar('👤')
    setCreateError('')
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProfileName.trim()) {
      setCreateError('请输入用户名')
      return
    }

    if (newProfileName.trim().length < 2) {
      setCreateError('用户名至少需要2个字符')
      return
    }

    if (allProfiles.some(p => p.name === newProfileName.trim())) {
      setCreateError('用户名已存在')
      return
    }

    if (newProfilePassword && newProfilePassword !== newProfileConfirmPassword) {
      setCreateError('两次输入的密码不一致')
      return
    }

    if (newProfilePassword && newProfilePassword.length < 4) {
      setCreateError('密码至少需要4个字符')
      return
    }

    try {
      const newProfile = createProfile(
        newProfileName.trim(),
        newProfilePassword || undefined,
        newProfileAvatar
      )
      
      // 自动切换到新创建的profile
      handleProfileSwitch(newProfile.id)
      setShowCreateModal(false)
      resetCreateForm()
    } catch (error) {
      setCreateError('创建失败，请重试')
    }
  }

  const handleDeleteProfile = (profile: Profile) => {
    setSelectedProfileForDelete(profile)
    setShowDeleteModal(true)
    setIsOpen(false)
    setPassword('')
    setPasswordError('')
    setShowPassword(false)
  }

  const handleDeleteConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProfileForDelete) return

    // 如果有密码保护，验证密码
    if (selectedProfileForDelete.hasPassword) {
      if (!password.trim()) {
        setPasswordError('请输入密码')
        return
      }
      
      if (!verifyPassword(selectedProfileForDelete.id, password)) {
        setPasswordError('密码错误')
        return
      }
    }

    // 执行删除
    deleteProfile(selectedProfileForDelete.id)
    refreshProfiles()
    setShowDeleteModal(false)
    setSelectedProfileForDelete(null)
    setPassword('')
    setPasswordError('')
    
    // 如果删除的是当前profile，触发logout
    if (selectedProfileForDelete.id === currentProfile?.id) {
      onLogout?.()
    }
  }

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false)
    setSelectedProfileForDelete(null)
    setPassword('')
    setPasswordError('')
    setShowPassword(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    onLogout?.()
  }

  const avatarOptions = ['👤', '🧑‍💻', '👩‍💻', '🤖', '🎯', '🚀', '⭐', '🔥', '💎', '🌟', '🎨', '📚']

  if (!currentProfile) return null

  const otherProfiles = allProfiles.filter(p => p.id !== currentProfile.id)

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* 头像按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center space-x-3 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 ease-out"
        >
          <div className="relative">
            <div className="w-8 h-8 flex items-center justify-center text-lg bg-gradient-to-br from-white/20 to-white/10 rounded-full border border-white/30 transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-lg group-hover:border-white/50">
              {currentProfile.avatar || '👤'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          
          <span className="text-sm font-medium text-white max-w-24 truncate">
            {currentProfile.name}
          </span>
          
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
          <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden z-50">
            {/* 当前用户信息 */}
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border border-gray-200">
                  {currentProfile.avatar || '👤'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{currentProfile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {currentProfile.lastLogin 
                      ? `上次登录 ${new Date(currentProfile.lastLogin).toLocaleDateString('zh-CN')}`
                      : '首次登录'
                    }
                  </p>
                </div>
                {/* 删除当前profile按钮 */}
                <button
                  onClick={() => handleDeleteProfile(currentProfile)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除此Profile"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 其他 Profiles */}
            {otherProfiles.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  切换 Profile
                </div>
                {otherProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center group">
                    <button
                      onClick={() => handleProfileClick(profile)}
                      className="flex-1 flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDeleteProfile(profile)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="删除此Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 分割线 */}
            <div className="border-t border-gray-200/50 my-1"></div>

            {/* 操作按钮 */}
            <div className="p-2 space-y-1">
              {/* 添加Profile */}
              <button
                onClick={handleCreateProfile}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium">创建新 Profile</span>
              </button>
              
              {/* 退出登录 */}
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

      {/* 密码输入模态框 */}
      {showPasswordModal && selectedProfileForSwitch && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fade-in" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 flex items-center justify-center min-h-screen p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 animate-zoom-in-95 mx-auto my-auto relative">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border-2 border-blue-100/50 shadow-lg">
                  {selectedProfileForSwitch.avatar || '👤'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">欢迎回来</h3>
                <p className="text-sm text-gray-600">
                  切换到 <span className="font-medium text-gray-900">{selectedProfileForSwitch.name}</span>
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      className={`w-full px-4 py-4 pr-12 bg-gray-50/50 border-2 rounded-2xl text-center text-lg font-medium transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:shadow-lg focus:shadow-blue-100/50 placeholder:text-gray-400 ${
                        passwordError 
                          ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:shadow-red-100/50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="输入密码"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                      <span className="text-lg">
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    </button>
                  </div>
                  {passwordError && (
                    <div className="mt-3 flex items-center justify-center">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-full animate-slide-in-from-top-2">
                        <span className="text-red-500 text-sm">⚠️</span>
                        <p className="text-sm text-red-600 font-medium">{passwordError}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePasswordModalClose}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 hover:scale-[0.98]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!password.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 active:scale-[0.95] transition-all duration-150 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  >
                    确认解锁
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  为了保护您的隐私和数据安全
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 创建Profile模态框 */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fade-in" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 flex items-center justify-center min-h-screen p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 animate-zoom-in-95 mx-auto my-auto relative">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl bg-gradient-to-br from-green-50 to-emerald-50 rounded-full border-2 border-green-100/50 shadow-lg">
                  {newProfileAvatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">创建新 Profile</h3>
                <p className="text-sm text-gray-600">设置您的个人档案信息</p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                {/* 头像选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">选择头像</label>
                  <div className="grid grid-cols-6 gap-2">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setNewProfileAvatar(avatar)}
                        className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg border-2 transition-all ${
                          newProfileAvatar === avatar
                            ? 'border-blue-500 bg-blue-50 scale-110'
                            : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 用户名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => {
                      setNewProfileName(e.target.value)
                      if (createError) setCreateError('')
                    }}
                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-400 focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                    placeholder="输入用户名"
                    maxLength={20}
                  />
                </div>

                {/* 密码（可选） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码（可选）</label>
                  <input
                    type="password"
                    value={newProfilePassword}
                    onChange={(e) => {
                      setNewProfilePassword(e.target.value)
                      if (createError) setCreateError('')
                    }}
                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-400 focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                    placeholder="留空表示无密码保护"
                  />
                </div>

                {/* 确认密码 */}
                {newProfilePassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                    <input
                      type="password"
                      value={newProfileConfirmPassword}
                      onChange={(e) => {
                        setNewProfileConfirmPassword(e.target.value)
                        if (createError) setCreateError('')
                      }}
                      className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-400 focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                      placeholder="再次输入密码"
                    />
                  </div>
                )}

                {createError && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-full animate-slide-in-from-top-2">
                      <span className="text-red-500 text-sm">⚠️</span>
                      <p className="text-sm text-red-600 font-medium">{createError}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 hover:scale-[0.98]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!newProfileName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-medium hover:from-green-600 hover:to-green-700 active:scale-[0.95] transition-all duration-150 shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  >
                    创建Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 删除Profile确认模态框 */}
      {showDeleteModal && selectedProfileForDelete && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fade-in" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 flex items-center justify-center min-h-screen p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20 animate-zoom-in-95 mx-auto my-auto relative">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl bg-gradient-to-br from-red-50 to-orange-50 rounded-full border-2 border-red-100/50 shadow-lg">
                  {selectedProfileForDelete.avatar || '👤'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">删除确认</h3>
                <p className="text-sm text-gray-600">
                  确定要删除 <span className="font-medium text-gray-900">{selectedProfileForDelete.name}</span> 吗？
                </p>
                <p className="text-xs text-red-600 mt-2">此操作无法撤销，所有数据将永久丢失</p>
              </div>

              <form onSubmit={handleDeleteConfirm} className="space-y-6">
                {/* 如果有密码保护，需要输入密码 */}
                {selectedProfileForDelete.hasPassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">输入密码确认删除</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (passwordError) setPasswordError('')
                        }}
                        className={`w-full px-4 py-4 pr-12 bg-gray-50/50 border-2 rounded-2xl text-lg font-medium transition-all duration-200 focus:outline-none focus:bg-white focus:border-red-400 focus:shadow-lg focus:shadow-red-100/50 placeholder:text-gray-400 ${
                          passwordError 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:shadow-red-100/50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="输入密码"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                      >
                        <span className="text-lg">
                          {showPassword ? '🙈' : '👁️'}
                        </span>
                      </button>
                    </div>
                    {passwordError && (
                      <div className="mt-3 flex items-center justify-center">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-full animate-slide-in-from-top-2">
                          <span className="text-red-500 text-sm">⚠️</span>
                          <p className="text-sm text-red-600 font-medium">{passwordError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 无密码保护的二次确认 */}
                {!selectedProfileForDelete.hasPassword && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-red-500 text-xl">⚠️</span>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">危险操作</h4>
                        <p className="text-sm text-red-700 mt-1">
                          删除后无法恢复，请确认您真的要执行此操作。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteModalClose}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 hover:scale-[0.98]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={selectedProfileForDelete.hasPassword && !password.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-medium hover:from-red-600 hover:to-red-700 active:scale-[0.95] transition-all duration-150 shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                  >
                    确认删除
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  删除操作无法撤销，请谨慎操作
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default AppleProfileSwitcher 