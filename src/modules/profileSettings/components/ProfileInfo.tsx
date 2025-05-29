import React, { useState } from 'react'
import { Profile, updateProfile } from '../../../utils/profile'
import { addActivityRecord } from '../service'

interface ProfileInfoProps {
  profile: Profile
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar || '👤')

  const avatarOptions = ['👤', '👨‍💻', '👩‍💻', '🦸', '🦹', '🧑‍🎓', '🧑‍💼', '🤖', '🦊', '🐱']

  const handleSave = () => {
    updateProfile(profile.id, { name, avatar })
    addActivityRecord({
      type: 'profile_update',
      action: '更新个人信息',
      details: { name, avatar }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(profile.name)
    setAvatar(profile.avatar || '👤')
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">个人信息</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            编辑
          </button>
        )}
      </div>

      {/* 个人信息表单 */}
      <div className="space-y-4">
        {/* 头像选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            头像
          </label>
          {isEditing ? (
            <div className="flex gap-2 flex-wrap">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                    avatar === emoji
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-4xl">{avatar}</div>
          )}
        </div>

        {/* 用户名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户名
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入用户名"
            />
          ) : (
            <div className="text-lg font-medium">{name}</div>
          )}
        </div>

        {/* 其他信息 */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Profile ID</span>
            <span className="font-mono text-gray-800">{profile.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">创建时间</span>
            <span className="text-gray-800">
              {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          {profile.lastLogin && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">最后登录</span>
              <span className="text-gray-800">
                {new Date(profile.lastLogin).toLocaleString('zh-CN')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">密码保护</span>
            <span className="text-gray-800">
              {profile.hasPassword ? '已启用' : '未启用'}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 