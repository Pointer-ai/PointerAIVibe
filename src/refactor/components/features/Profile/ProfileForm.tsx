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
import { Profile, CreateProfileInput, UpdateProfileInput } from '../../../types/profile'
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../ui/Card/Card'
import { Input, FormField } from '../../ui/Input/Input'
import { Alert } from '../../ui/Alert/Alert'

interface ProfileFormProps {
  profile?: Profile | null
  loading?: boolean
  onSubmit: (data: CreateProfileInput | UpdateProfileInput) => Promise<void>
  onCancel: () => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  loading = false,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEditing = !!profile

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email || '',
        bio: profile.bio || '',
        avatar: profile.avatar || ''
      })
    }
  }, [profile])

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // 验证名称
    if (!formData.name.trim()) {
      newErrors.name = 'Profile名称不能为空'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Profile名称不能超过50个字符'
    }

    // 验证邮箱
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    // 验证简介
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = '简介不能超过200个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSubmitError(null)
      
      // 准备提交数据，过滤空字符串
      const submitData: CreateProfileInput | UpdateProfileInput = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        avatar: formData.avatar.trim() || undefined
      }

      await onSubmit(submitData)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '操作失败，请重试')
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? '编辑Profile' : '创建新Profile'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* 错误提示 */}
          {submitError && (
            <Alert variant="error">
              {submitError}
            </Alert>
          )}

          {/* 基础信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基础信息</h3>
            
            {/* 名称 */}
            <FormField
              label="Profile名称"
              required
              error={errors.name}
              helpText="用于标识不同的学习档案"
            >
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入Profile名称"
                error={!!errors.name}
                disabled={loading}
              />
            </FormField>

            {/* 邮箱 */}
            <FormField
              label="邮箱地址"
              error={errors.email}
              helpText="用于接收学习通知和报告"
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="请输入邮箱地址"
                error={!!errors.email}
                disabled={loading}
              />
            </FormField>

            {/* 简介 */}
            <FormField
              label="个人简介"
              error={errors.bio}
              helpText={`描述您的学习目标和背景 (${formData.bio.length}/200)`}
            >
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="请输入个人简介"
                className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={4}
                maxLength={200}
                disabled={loading}
              />
            </FormField>

            {/* 头像URL */}
            <FormField
              label="头像链接"
              error={errors.avatar}
              helpText="可选，留空将显示名称首字母"
            >
              <Input
                type="url"
                value={formData.avatar}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                error={!!errors.avatar}
                disabled={loading}
              />
            </FormField>
          </div>

          {/* 头像预览 */}
          {(formData.avatar || formData.name) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">头像预览</h4>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium overflow-hidden">
                  {formData.avatar ? (
                    <img 
                      src={formData.avatar} 
                      alt="头像预览" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.parentElement?.querySelector('span') as HTMLElement
                        if (fallback) {
                          fallback.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <span style={{ display: formData.avatar ? 'none' : 'flex' }}>
                    {formData.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {formData.avatar ? '自定义头像' : '名称首字母'}
                </span>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <Alert variant="info">
            <div className="space-y-1">
              <p className="font-medium">💡 提示</p>
              <ul className="text-sm space-y-1">
                <li>• Profile用于隔离不同的学习档案和设置</li>
                <li>• 每个Profile有独立的API配置和评估记录</li>
                <li>• 可以随时在不同Profile间切换</li>
              </ul>
            </div>
          </Alert>
        </CardContent>

        <CardFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !formData.name.trim()}
          >
            {isEditing ? '保存更改' : '创建Profile'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 