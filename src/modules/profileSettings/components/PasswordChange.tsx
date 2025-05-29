import React, { useState } from 'react'
import { Profile, changePassword } from '../../../utils/profile'
import { addActivityRecord } from '../service'

interface PasswordChangeProps {
  profile: Profile
  onClose: () => void
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({ profile, onClose }) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // 验证新密码
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    if (newPassword && newPassword.length < 6) {
      setError('新密码至少需要 6 个字符')
      return
    }
    
    // 尝试修改密码
    const result = changePassword(profile.id, oldPassword, newPassword)
    
    if (!result) {
      setError('原密码错误')
      return
    }
    
    // 记录活动
    addActivityRecord({
      type: 'profile_update',
      action: newPassword ? '修改密码' : '移除密码保护',
      details: {}
    })
    
    setSuccess(true)
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">修改密码</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 原密码 */}
          {profile.hasPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原密码
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入原密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showOldPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}
          
          {/* 新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新密码
              <span className="text-gray-500 text-xs ml-2">
                （留空则移除密码保护）
              </span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入新密码（至少 6 位）"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          {/* 确认新密码 */}
          {newPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请再次输入新密码"
                required
              />
            </div>
          )}
          
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* 成功提示 */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              密码修改成功！
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={success}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {success ? '修改成功' : '确认修改'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 