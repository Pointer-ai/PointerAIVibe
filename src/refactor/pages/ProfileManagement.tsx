/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button/Button'
import { Alert } from '../components/ui/Alert/Alert'
import { ProfileList, ProfileForm, ProfileSettings } from '../components/features/Profile'
import { refactorProfileService } from '../services/profileService'
import { refactorAIService } from '../services/aiService'
import { Profile, CreateProfileInput, UpdateProfileInput, UpdateSettingsInput, APIConfig } from '../types/profile'

interface ProfileManagementPageProps {
  onNavigate?: (view: string) => void
}

type ViewMode = 'list' | 'create' | 'edit' | 'settings'

export const ProfileManagementPage: React.FC<ProfileManagementPageProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化数据
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    try {
      const allProfiles = refactorProfileService.getAllProfiles()
      const current = refactorProfileService.getCurrentProfile()
      
      setProfiles(allProfiles)
      setCurrentProfileId(current?.id || null)
    } catch (error) {
      console.error('Failed to load profiles:', error)
      setError('加载Profile失败')
    }
  }

  const handleCreateProfile = async (input: CreateProfileInput | UpdateProfileInput) => {
    // 确保input包含必需的name字段
    if (!input.name) {
      setError('Profile名称不能为空')
      return
    }

    const createInput: CreateProfileInput = {
      name: input.name,
      email: input.email,
      bio: input.bio,
      avatar: input.avatar
    }

    setLoading(true)
    setError(null)

    try {
      const result = await refactorProfileService.createProfile(createInput)
      if (result.success && result.data) {
        setProfiles(prev => [...prev, result.data!])
        
        // 如果是第一个Profile，自动设为当前Profile
        if (profiles.length === 0) {
          setCurrentProfileId(result.data.id)
        }
        
        setViewMode('list')
      } else {
        setError(result.error || '创建Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建Profile失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (input: CreateProfileInput | UpdateProfileInput) => {
    if (!editingProfile) return

    const updateInput: UpdateProfileInput = {
      name: input.name,
      email: input.email,
      bio: input.bio,
      avatar: input.avatar
    }

    setLoading(true)
    setError(null)

    try {
      const result = await refactorProfileService.updateProfile(editingProfile.id, updateInput)
      if (result.success && result.data) {
        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? result.data! : p))
        setEditingProfile(null)
        setViewMode('list')
      } else {
        setError(result.error || '更新Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新Profile失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSettings = async (settings: UpdateSettingsInput) => {
    if (!editingProfile) return

    setLoading(true)
    setError(null)

    try {
      const result = await refactorProfileService.updateSettings(editingProfile.id, settings)
      if (result.success && result.data) {
        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? result.data! : p))
        setEditingProfile(result.data)
        
        // 如果更新的是当前Profile，重新加载AI服务配置
        if (editingProfile.id === currentProfileId) {
          refactorAIService.reloadConfig()
        }
      } else {
        setError(result.error || '更新设置失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchProfile = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const success = await refactorProfileService.switchProfile(id)
      if (success) {
        setCurrentProfileId(id)
        
        // 刷新Profile列表以确保状态一致
        loadProfiles()
        
        console.log(`[ProfileManagement] Successfully switched to profile: ${id}`)
      } else {
        setError('切换Profile失败 - 请稍后重试')
      }
    } catch (error) {
      console.error('[ProfileManagement] Profile switch failed:', error)
      setError(error instanceof Error ? error.message : '切换Profile失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await refactorProfileService.deleteProfile(id)
      if (result.success) {
        setProfiles(prev => prev.filter(p => p.id !== id))
        
        // 如果删除的是当前Profile，重新加载
        if (id === currentProfileId) {
          loadProfiles()
        }
      } else {
        setError(result.error || '删除Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除Profile失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
    setViewMode('edit')
  }

  const handleEditSettings = (profile: Profile) => {
    setEditingProfile(profile)
    setViewMode('settings')
  }

  const handleTestAPI = async (config: APIConfig): Promise<boolean> => {
    try {
      // 临时设置AI配置进行测试
      const originalConfig = refactorAIService.getConfig()
      refactorAIService.setConfig({
        provider: config.model === 'openai' ? 'openai' : config.model === 'claude' ? 'claude' : 'qwen',
        model: config.specificModel || (config.model === 'openai' ? 'gpt-4' : config.model === 'claude' ? 'claude-3-5-sonnet-20241022' : 'qwen-plus'),
        apiKey: config.key,
        temperature: config.params?.temperature || 0.7,
        maxTokens: config.params?.maxTokens || 2000
      })

      const success = await refactorAIService.checkHealth()
      
      // 恢复原配置
      if (originalConfig) {
        refactorAIService.setConfig(originalConfig)
      }
      
      return success
    } catch (error) {
      console.error('API test failed:', error)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👤 Profile管理</h1>
              <p className="text-gray-600 mt-2">
                管理您的学习档案、设置和AI配置
              </p>
            </div>
            
            {onNavigate && (
              <Button
                variant="secondary"
                onClick={() => onNavigate('main')}
              >
                返回主页
              </Button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* 主要内容区域 */}
        {viewMode === 'list' && (
          <ProfileList
            profiles={profiles}
            currentProfileId={currentProfileId}
            onSwitch={handleSwitchProfile}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
            onCreateNew={() => setViewMode('create')}
          />
        )}

        {viewMode === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setViewMode('list')}
              >
                ← 返回列表
              </Button>
              <h2 className="text-xl font-semibold">创建新Profile</h2>
            </div>
            
            <ProfileForm
              loading={loading}
              onSubmit={handleCreateProfile}
              onCancel={() => setViewMode('list')}
            />
          </div>
        )}

        {viewMode === 'edit' && editingProfile && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => setViewMode('list')}
                >
                  ← 返回列表
                </Button>
                <h2 className="text-xl font-semibold">编辑Profile</h2>
              </div>
              
              <Button
                variant="primary"
                onClick={() => handleEditSettings(editingProfile)}
              >
                高级设置
              </Button>
            </div>
            
            <ProfileForm
              profile={editingProfile}
              loading={loading}
              onSubmit={handleUpdateProfile}
              onCancel={() => setViewMode('list')}
            />
          </div>
        )}

        {viewMode === 'settings' && editingProfile && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setViewMode('list')}
              >
                ← 返回列表
              </Button>
              <h2 className="text-xl font-semibold">Profile设置</h2>
            </div>
            
            <ProfileSettings
              profile={editingProfile}
              loading={loading}
              onSave={handleUpdateSettings}
              onTestAPI={handleTestAPI}
            />
          </div>
        )}

        {/* 系统特性说明 */}
        {viewMode === 'list' && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🆕 新功能</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  多Profile数据隔离
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  独立的AI配置管理
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  个性化学习设置
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Profile数据导入导出
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">💡 使用提示</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p>• 每个Profile有独立的评估记录和学习进度</p>
                <p>• 可以为不同学习目标创建不同Profile</p>
                <p>• AI配置支持OpenAI、Claude、通义千问</p>
                <p>• 切换Profile后AI服务会自动使用新配置</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileManagementPage 