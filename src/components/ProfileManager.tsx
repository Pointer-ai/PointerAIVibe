import React, { useState, useEffect } from 'react'
import { getProfiles, createProfile, verifyPassword, setCurrentProfile, deleteProfile, type Profile } from '../utils/profile'

interface ProfileManagerProps {
  onLogin: () => void
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onLogin }) => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [password, setPassword] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfilePassword, setNewProfilePassword] = useState('')
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤')
  const [error, setError] = useState('')

  // 可选的头像
  const avatarOptions = ['👤', '🧑‍💻', '👩‍💻', '🤖', '🎯', '🚀', '⭐', '🔥', '💎', '🌟', '🎨', '📚']

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    setProfiles(getProfiles())
  }

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      setError('请输入 Profile 名称')
      return
    }

    if (profiles.some(p => p.name === newProfileName.trim())) {
      setError('Profile 名称已存在')
      return
    }

    createProfile(
      newProfileName.trim(),
      newProfilePassword || undefined,
      newProfileAvatar
    )

    loadProfiles()
    setShowCreateForm(false)
    setNewProfileName('')
    setNewProfilePassword('')
    setNewProfileAvatar('👤')
    setError('')
  }

  const handleLogin = () => {
    if (!selectedProfile) {
      setError('请选择一个 Profile')
      return
    }

    if (selectedProfile.hasPassword) {
      if (!password) {
        setError('请输入密码')
        return
      }

      if (!verifyPassword(selectedProfile.id, password)) {
        setError('密码错误')
        return
      }
    }

    setCurrentProfile(selectedProfile.id)
    onLogin()
  }

  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个 Profile 吗？所有数据将被清除。')) {
      deleteProfile(profileId)
      loadProfiles()
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center px-6 py-12">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Pointer.ai</h1>
          <p className="text-gray-600">选择或创建你的学习档案</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8">
          {/* Profile List */}
          {!showCreateForm && (
            <div className="space-y-6">
              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">还没有任何 Profile</p>
                  <p className="text-sm text-gray-400">创建你的第一个学习档案开始使用</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfile(profile)
                        setPassword('')
                        setError('')
                      }}
                      className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedProfile?.id === profile.id
                          ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-[1.02]'
                          : 'border-gray-200/50 hover:border-gray-300/50 hover:bg-white/50 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl border border-gray-200 group-hover:scale-105 transition-transform">
                          {profile.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                          <p className="text-xs text-gray-500">
                            创建于 {formatDate(profile.createdAt)}
                            {profile.lastLogin && ` · 上次登录 ${formatDate(profile.lastLogin)}`}
                          </p>
                        </div>
                        {profile.hasPassword && (
                          <div className="p-2 bg-gray-100/50 rounded-full">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteProfile(profile.id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Password Input */}
              {selectedProfile?.hasPassword && (
                <div className="mt-6">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="请输入密码"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-red-50/80 border border-red-200/50 rounded-full">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm font-semibold text-gray-700 hover:bg-white/70 hover:border-gray-300/50 hover:scale-105 transition-all duration-300"
                >
                  创建新 Profile
                </button>
                {selectedProfile && (
                  <button
                    onClick={handleLogin}
                    className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-200/25"
                  >
                    进入
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setError('')
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-gray-900">创建新 Profile</h2>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">选择头像</label>
                <div className="grid grid-cols-6 gap-3">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setNewProfileAvatar(avatar)}
                      className={`w-12 h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-xl ${
                        newProfileAvatar === avatar
                          ? 'border-blue-400 bg-blue-50 scale-110 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-105 hover:shadow-md'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile 名称</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="输入你的名称"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">密码 (可选)</label>
                <input
                  type="password"
                  value={newProfilePassword}
                  onChange={(e) => setNewProfilePassword(e.target.value)}
                  placeholder="留空表示无密码保护"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-red-50/80 border border-red-200/50 rounded-full">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim()}
                className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-200/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                创建 Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileManager 