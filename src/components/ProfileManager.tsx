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
  const avatarOptions = ['👤', '🦊', '🐱', '🐶', '🦁', '🐸', '🐙', '🦄', '🐲', '🎯', '💡', '⚡', '🌟', '🔥', '💎', '🎨']

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
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Pointer.ai</h1>
          <p className="mt-2 text-sm text-gray-600">选择或创建你的学习档案</p>
        </div>

        {/* Profile List */}
        {!showCreateForm && (
          <div className="space-y-4">
            {profiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">还没有任何 Profile</p>
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
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedProfile?.id === profile.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{profile.avatar}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                        <p className="text-xs text-gray-500">
                          创建于 {formatDate(profile.createdAt)}
                          {profile.lastLogin && ` · 上次登录 ${formatDate(profile.lastLogin)}`}
                        </p>
                      </div>
                      {profile.hasPassword && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <button
                        onClick={(e) => handleDeleteProfile(profile.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="mt-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                创建新 Profile
              </button>
              {selectedProfile && (
                <button
                  onClick={handleLogin}
                  className="flex-1 px-4 py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                >
                  进入
                </button>
              )}
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">创建新 Profile</h2>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择头像</label>
              <div className="grid grid-cols-8 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setNewProfileAvatar(avatar)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                      newProfileAvatar === avatar
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile 名称</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="例如：Python 学习"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码（可选）
              </label>
              <input
                type="password"
                value={newProfilePassword}
                onChange={(e) => setNewProfilePassword(e.target.value)}
                placeholder="留空表示不设密码"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                设置密码可以保护你的学习数据
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewProfileName('')
                  setNewProfilePassword('')
                  setNewProfileAvatar('👤')
                  setError('')
                }}
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProfile}
                className="flex-1 px-4 py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileManager 