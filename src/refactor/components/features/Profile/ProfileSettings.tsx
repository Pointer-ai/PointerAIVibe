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
import { Profile, UpdateSettingsInput, APIConfig } from '../../../types/profile'
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Input, FormField } from '../../ui/Input/Input'
import { Alert } from '../../ui/Alert/Alert'
import { Badge } from '../../ui/Badge/Badge'

interface ProfileSettingsProps {
  profile: Profile
  loading?: boolean
  onSave: (settings: UpdateSettingsInput) => Promise<void>
  onTestAPI?: (config: APIConfig) => Promise<boolean>
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  loading = false,
  onSave,
  onTestAPI
}) => {
  const [settings, setSettings] = useState(profile.data.settings)
  const [activeTab, setActiveTab] = useState<'api' | 'notifications' | 'privacy' | 'learning'>('api')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [testingAPI, setTestingAPI] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSettings(profile.data.settings)
    setHasChanges(false)
  }, [profile])

  const handleSettingChange = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.')
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
    setHasChanges(true)
  }

  const handleSubmit = async () => {
    try {
      setSubmitError(null)
      await onSave(settings)
      setHasChanges(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '保存失败，请重试')
    }
  }

  const handleTestAPI = async () => {
    if (!settings.apiConfig?.key) {
      setApiTestResult({ success: false, message: '请先配置API密钥' })
      return
    }

    setTestingAPI(true)
    setApiTestResult(null)

    try {
      const success = await onTestAPI?.(settings.apiConfig) ?? false
      setApiTestResult({
        success,
        message: success ? 'API连接测试成功！' : 'API连接测试失败，请检查配置'
      })
    } catch (error) {
      setApiTestResult({
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    } finally {
      setTestingAPI(false)
    }
  }

  const tabs = [
    { id: 'api' as const, label: 'AI配置', icon: '🤖' },
    { id: 'notifications' as const, label: '通知设置', icon: '🔔' },
    { id: 'privacy' as const, label: '隐私设置', icon: '🔒' },
    { id: 'learning' as const, label: '学习设置', icon: '📚' }
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Profile设置</h2>
          <p className="text-gray-600">配置 {profile.name} 的个性化设置</p>
        </div>
        
        {hasChanges && (
          <Button
            onClick={handleSubmit}
            variant="primary"
            loading={loading}
          >
            保存更改
          </Button>
        )}
      </div>

      {/* 错误提示 */}
      {submitError && (
        <Alert variant="error">
          {submitError}
        </Alert>
      )}

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* AI配置 */}
      {activeTab === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle>AI服务配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI服务商选择 */}
            <FormField label="AI服务商" helpText="选择您要使用的AI服务提供商">
              <select
                value={settings.apiConfig?.model || 'openai'}
                onChange={(e) => handleSettingChange('apiConfig.model', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="openai">OpenAI (GPT)</option>
                <option value="claude">Anthropic (Claude)</option>
                <option value="qwen">阿里云 (通义千问)</option>
              </select>
            </FormField>

            {/* API密钥 */}
            <FormField 
              label="API密钥" 
              required
              helpText="从相应服务商获取的API密钥"
            >
              <Input
                type="password"
                value={settings.apiConfig?.key || ''}
                onChange={(e) => handleSettingChange('apiConfig.key', e.target.value)}
                placeholder="请输入API密钥"
              />
            </FormField>

            {/* 具体模型 */}
            <FormField 
              label="模型版本" 
              helpText="留空使用默认版本"
            >
              <Input
                value={settings.apiConfig?.specificModel || ''}
                onChange={(e) => handleSettingChange('apiConfig.specificModel', e.target.value)}
                placeholder={
                  settings.apiConfig?.model === 'openai' ? '如：gpt-4, gpt-3.5-turbo' :
                  settings.apiConfig?.model === 'claude' ? '如：claude-3-5-sonnet-20241022' :
                  '如：qwen-plus'
                }
              />
            </FormField>

            {/* 高级参数 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Temperature" helpText="控制输出的随机性 (0-1)">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={String(settings.apiConfig?.params?.temperature ?? 0.7)}
                  onChange={(e) => handleSettingChange('apiConfig.params.temperature', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>

              <FormField label="Max Tokens" helpText="最大生成token数">
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={String(settings.apiConfig?.params?.maxTokens ?? 2000)}
                  onChange={(e) => handleSettingChange('apiConfig.params.maxTokens', parseInt(e.target.value))}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>

            {/* API测试 */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleTestAPI}
                variant="secondary"
                loading={testingAPI}
                disabled={!settings.apiConfig?.key}
              >
                测试连接
              </Button>
              
              {apiTestResult && (
                <Badge variant={apiTestResult.success ? 'success' : 'danger'}>
                  {apiTestResult.message}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知设置 */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications.email', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">邮件通知</div>
                  <div className="text-sm text-gray-500">接收学习进度和评估报告</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications.push', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">推送通知</div>
                  <div className="text-sm text-gray-500">学习提醒和目标达成通知</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.notifications.desktop}
                  onChange={(e) => handleSettingChange('notifications.desktop', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">桌面通知</div>
                  <div className="text-sm text-gray-500">浏览器桌面通知提醒</div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 隐私设置 */}
      {activeTab === 'privacy' && (
        <Card>
          <CardHeader>
            <CardTitle>隐私设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.privacy.analytics}
                  onChange={(e) => handleSettingChange('privacy.analytics', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">使用分析</div>
                  <div className="text-sm text-gray-500">帮助改进产品体验</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.privacy.dataCollection}
                  onChange={(e) => handleSettingChange('privacy.dataCollection', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">数据收集</div>
                  <div className="text-sm text-gray-500">收集匿名使用数据用于产品改进</div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 学习设置 */}
      {activeTab === 'learning' && (
        <Card>
          <CardHeader>
            <CardTitle>学习设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="每日学习目标" helpText="设置每日学习时间目标（分钟）">
              <input
                type="number"
                min="15"
                max="480"
                value={String(settings.learning.dailyGoal)}
                onChange={(e) => handleSettingChange('learning.dailyGoal', parseInt(e.target.value))}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="学习难度" helpText="选择适合您当前水平的难度">
              <select
                value={settings.learning.difficulty}
                onChange={(e) => handleSettingChange('learning.difficulty', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">入门级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </FormField>

            <FormField label="关注领域" helpText="选择您感兴趣的技术领域">
              <div className="grid grid-cols-2 gap-2">
                {['前端开发', '后端开发', '移动开发', '数据科学', '机器学习', '云计算', '区块链', '游戏开发'].map(area => (
                  <label key={area} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.learning.focusAreas.includes(area)}
                      onChange={(e) => {
                        const current = settings.learning.focusAreas
                        const updated = e.target.checked
                          ? [...current, area]
                          : current.filter(a => a !== area)
                        handleSettingChange('learning.focusAreas', updated)
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </CardContent>
        </Card>
      )}

      {/* 保存提示 */}
      {hasChanges && (
        <Alert variant="warning">
          <p>您有未保存的更改，请点击右上角的"保存更改"按钮。</p>
        </Alert>
      )}
    </div>
  )
} 