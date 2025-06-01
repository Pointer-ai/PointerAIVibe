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

import React, { useState } from 'react'
import { Profile } from '../../../types/profile'
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { Alert } from '../../ui/Alert/Alert'

interface ProfileListProps {
  profiles: Profile[]
  currentProfileId: string | null
  onSwitch: (id: string) => void
  onEdit: (profile: Profile) => void
  onDelete: (id: string) => void
  onCreateNew: () => void
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  currentProfileId,
  onSwitch,
  onEdit,
  onDelete,
  onCreateNew
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAvatarInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无Profile</h3>
          <p className="text-gray-600 mb-4">创建您的第一个Profile开始使用系统</p>
          <Button onClick={onCreateNew} variant="primary">
            创建Profile
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Profile管理</h2>
          <p className="text-gray-600">管理您的学习档案和设置</p>
        </div>
        <Button onClick={onCreateNew} variant="primary">
          + 新建Profile
        </Button>
      </div>

      {/* Profile列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => {
          const isActive = profile.id === currentProfileId
          const showDeleteConfirm = deleteConfirm === profile.id
          
          return (
            <Card 
              key={profile.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* 头像 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      isActive ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getAvatarInitials(profile.name)
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-base">{profile.name}</CardTitle>
                      {profile.email && (
                        <p className="text-sm text-gray-500">{profile.email}</p>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <Badge variant="success" size="sm">当前</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Profile信息 */}
                {profile.bio && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{profile.bio}</p>
                )}
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>创建时间</span>
                    <span>{formatDate(profile.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最后更新</span>
                    <span>{formatDate(profile.updatedAt)}</span>
                  </div>
                  {profile.data.settings.apiConfig?.key && (
                    <div className="flex justify-between">
                      <span>AI配置</span>
                      <Badge variant="success" size="sm">已配置</Badge>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex space-x-2">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onSwitch(profile.id)}
                      >
                        切换
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(profile)}
                    >
                      编辑
                    </Button>
                  </div>
                  
                  {profiles.length > 1 && (
                    <Button
                      size="sm"
                      variant={showDeleteConfirm ? "danger" : "secondary"}
                      onClick={() => handleDeleteClick(profile.id)}
                    >
                      {showDeleteConfirm ? '确认删除' : '删除'}
                    </Button>
                  )}
                </div>

                {/* 删除确认提示 */}
                {showDeleteConfirm && (
                  <Alert variant="warning" className="mt-3">
                    <p className="text-sm">删除后将清空所有相关数据，此操作不可撤销</p>
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleDeleteClick(profile.id)}
                      >
                        确认删除
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        取消
                      </Button>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 统计信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>总共 {profiles.length} 个Profile</span>
            <span>当前活跃: {profiles.find(p => p.id === currentProfileId)?.name || '无'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 