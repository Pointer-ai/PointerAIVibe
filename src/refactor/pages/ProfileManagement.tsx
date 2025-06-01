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

// Profile管理页面 - 完整的Profile CRUD操作

import React, { useState, useEffect } from 'react'
import { learningApi } from '../../api'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card/Card'
import { Button } from '../components/ui/Button/Button'
import { Input, FormField } from '../components/ui/Input/Input'
import { Badge, StatusBadge } from '../components/ui/Badge/Badge'
import { Alert } from '../components/ui/Alert/Alert'
import { Modal, ConfirmModal, FormModal } from '../components/ui/Modal/Modal'
import { Loading } from '../components/ui/Loading/Loading'
import { 
  Profile, 
  CreateProfileInput, 
  UpdateProfileInput,
  UpdateSettingsInput,
  ProfileSettings,
  APIConfig
} from '../types/profile'

export default function ProfileManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const allProfilesResponse = learningApi.getAllProfiles()
      const currentResponse = learningApi.getCurrentProfile()
      
      if (allProfilesResponse.success) {
        setProfiles(allProfilesResponse.data || [])
      } else {
        setError(allProfilesResponse.error || 'Failed to load profiles')
      }
      
      if (currentResponse.success) {
        setCurrentProfile(currentResponse.data || null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // 创建Profile
  const handleCreateProfile = async (data: CreateProfileInput) => {
    try {
      const result = await learningApi.createProfile(data)
      if (result.success) {
        loadData()
        setShowCreateModal(false)
        setError(null)
      } else {
        setError(result.error || '创建Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建Profile失败')
    }
  }

  // 更新Profile
  const handleUpdateProfile = async (data: UpdateProfileInput) => {
    if (!editingProfile) return
    
    try {
      const result = await learningApi.updateProfile(editingProfile.id, data)
      if (result.success) {
        loadData()
        setEditingProfile(null)
        setError(null)
      } else {
        setError(result.error || '更新Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新Profile失败')
    }
  }

  // 更新设置
  const handleUpdateSettings = async (settings: UpdateSettingsInput) => {
    if (!editingProfile) return
    
    try {
      const result = await learningApi.updateProfileSettings(editingProfile.id, settings)
      if (result.success) {
        loadData()
        setShowSettingsModal(false)
        setEditingProfile(null)
        setError(null)
      } else {
        setError(result.error || '更新设置失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新设置失败')
    }
  }

  // 切换Profile
  const handleSwitchProfile = async (id: string) => {
    if (isSwitching) return
    
    setIsSwitching(true)
    setError(null)
    
    try {
      const success = await learningApi.switchProfile(id)
      if (success.success) {
        loadData()
      } else {
        setError(success.error || 'Profile切换失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Profile切换失败')
    } finally {
      setIsSwitching(false)
    }
  }

  // 删除Profile
  const handleDeleteProfile = async () => {
    if (!deleteConfirm) return
    
    try {
      const result = await learningApi.deleteProfile(deleteConfirm.id)
      if (result.success) {
        loadData()
        setDeleteConfirm(null)
        setError(null)
      } else {
        setError(result.error || '删除Profile失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除Profile失败')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" text="加载Profile数据..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile管理</h1>
            <p className="text-gray-600 mt-2">管理所有Profile，切换当前活跃Profile</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            ➕ 创建Profile
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert 
            variant="error" 
            closable 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* 当前Profile信息 */}
        {currentProfile && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">{currentProfile.avatar || '👤'}</span>
                当前活跃Profile: {currentProfile.name}
                <StatusBadge status="active" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">邮箱</p>
                  <p className="font-medium">{currentProfile.email || '未设置'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">创建时间</p>
                  <p className="font-medium">{currentProfile.createdAt.toLocaleDateString()}</p>
                </div>
                {currentProfile.bio && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">简介</p>
                    <p className="font-medium">{currentProfile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary"
                onClick={() => {
                  setEditingProfile(currentProfile)
                  setShowSettingsModal(true)
                }}
              >
                ⚙️ 管理设置
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Profile列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <Card 
              key={profile.id} 
              variant={profile.isActive ? "shadow" : "bordered"}
              className={profile.isActive ? "ring-2 ring-blue-500" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{profile.avatar || '👤'}</span>
                    <span className="truncate">{profile.name}</span>
                  </div>
                  {profile.isActive && <Badge variant="primary">当前</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">邮箱: </span>
                    <span>{profile.email || '未设置'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">创建时间: </span>
                    <span>{profile.createdAt.toLocaleDateString()}</span>
                  </div>
                  {profile.bio && (
                    <div>
                      <span className="text-gray-600">简介: </span>
                      <span className="truncate">{profile.bio}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  {!profile.isActive && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleSwitchProfile(profile.id)}
                      disabled={isSwitching}
                      className="flex-1"
                    >
                      {isSwitching ? '切换中...' : '切换'}
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setEditingProfile(profile)}
                    className="flex-1"
                  >
                    编辑
                  </Button>
                  {!profile.isActive && (
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => setDeleteConfirm({ id: profile.id, name: profile.name })}
                    >
                      删除
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 创建Profile模态框 */}
        <SimpleCreateModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProfile}
        />

        {/* 编辑Profile模态框 */}
        {editingProfile && (
          <SimpleEditModal 
            isOpen={!!editingProfile && !showSettingsModal}
            profile={editingProfile}
            onClose={() => setEditingProfile(null)}
            onSubmit={handleUpdateProfile}
          />
        )}

        {/* 设置管理模态框 */}
        {editingProfile && (
          <SimpleSettingsModal 
            isOpen={showSettingsModal}
            profile={editingProfile}
            onClose={() => {
              setShowSettingsModal(false)
              setEditingProfile(null)
            }}
            onSubmit={handleUpdateSettings}
          />
        )}

        {/* 删除确认模态框 */}
        <ConfirmModal 
          isOpen={!!deleteConfirm}
          title="确认删除Profile"
          content={`确定要删除Profile "${deleteConfirm?.name}" 吗？此操作不可撤销。`}
          onConfirm={handleDeleteProfile}
          onClose={() => setDeleteConfirm(null)}
          confirmText="删除"
          variant="danger"
        />
      </div>
    </div>
  )
}

// 简单的创建Profile模态框
const SimpleCreateModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProfileInput) => Promise<void>
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateProfileInput>({
    name: '',
    email: '',
    bio: '',
    avatar: '👤'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    
    setLoading(true)
    try {
      await onSubmit(formData)
      setFormData({ name: '', email: '', bio: '', avatar: '👤' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="创建新Profile"
      loading={loading}
      submitDisabled={!formData.name.trim()}
    >
      <div className="space-y-4">
        <FormField label="Profile名称" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入Profile名称"
          />
        </FormField>
        
        <FormField label="邮箱">
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="请输入邮箱地址"
          />
        </FormField>
        
        <FormField label="简介">
          <Input
            value={formData.bio || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="请输入简介"
          />
        </FormField>
        
        <FormField label="头像">
          <Input
            value={formData.avatar || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="请输入头像emoji"
          />
        </FormField>
      </div>
    </FormModal>
  )
}

// 简单的编辑Profile模态框
const SimpleEditModal: React.FC<{
  isOpen: boolean
  profile: Profile
  onClose: () => void
  onSubmit: (data: UpdateProfileInput) => Promise<void>
}> = ({ isOpen, profile, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: profile.name,
    email: profile.email,
    bio: profile.bio,
    avatar: profile.avatar
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return
    
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="编辑Profile"
      loading={loading}
      submitDisabled={!formData.name?.trim()}
    >
      <div className="space-y-4">
        <FormField label="Profile名称" required>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入Profile名称"
          />
        </FormField>
        
        <FormField label="邮箱">
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="请输入邮箱地址"
          />
        </FormField>
        
        <FormField label="简介">
          <Input
            value={formData.bio || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="请输入简介"
          />
        </FormField>
        
        <FormField label="头像">
          <Input
            value={formData.avatar || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="请输入头像emoji"
          />
        </FormField>
      </div>
    </FormModal>
  )
}

// 简单的设置管理模态框
const SimpleSettingsModal: React.FC<{
  isOpen: boolean
  profile: Profile
  onClose: () => void
  onSubmit: (data: UpdateSettingsInput) => Promise<void>
}> = ({ isOpen, profile, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // 这里可以添加设置更新逻辑
      await onSubmit({})
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Profile设置"
      loading={loading}
    >
      <div className="space-y-4">
        <div className="text-gray-600">
          Profile设置功能正在开发中...
        </div>
        <div className="space-y-2">
          <p><strong>Profile ID:</strong> {profile.id}</p>
          <p><strong>创建时间:</strong> {profile.createdAt.toLocaleString()}</p>
          <p><strong>更新时间:</strong> {profile.updatedAt.toLocaleString()}</p>
        </div>
      </div>
    </FormModal>
  )
}

// 命名导出，用于其他组件导入
export const ProfileManagementPage = ProfileManagement 