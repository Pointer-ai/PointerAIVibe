import { getProfileData, setProfileData } from '../../utils/profile'
import { log } from '../../utils/logger'
import { APIConfig, ActivityRecord, ProfileSettings } from './types'

/**
 * 获取当前用户的 API 配置
 */
export const getAPIConfig = (): APIConfig => {
  const settings = getProfileData('settings') as ProfileSettings
  return settings?.apiConfig || {
    model: 'openai',
    key: ''
  }
}

/**
 * 保存 API 配置
 */
export const saveAPIConfig = (config: APIConfig): void => {
  log('[profileSettings] Saving API config')
  
  const currentSettings = getProfileData('settings') as ProfileSettings || {
    apiConfig: { model: 'openai', key: '' },
    preferences: {},
    activityHistory: []
  }
  
  const newSettings: ProfileSettings = {
    ...currentSettings,
    apiConfig: config
  }
  
  setProfileData('settings', newSettings)
  
  // 记录配置更新活动
  addActivityRecord({
    type: 'profile_update',
    action: 'API 配置更新',
    details: { model: config.model }
  })
}

/**
 * 获取用户偏好设置
 */
export const getPreferences = () => {
  const settings = getProfileData('settings') as ProfileSettings
  return settings?.preferences || {}
}

/**
 * 保存用户偏好设置
 */
export const savePreferences = (preferences: ProfileSettings['preferences']): void => {
  log('[profileSettings] Saving preferences')
  
  const currentSettings = getProfileData('settings') as ProfileSettings || {
    apiConfig: { model: 'openai', key: '' },
    preferences: {},
    activityHistory: []
  }
  
  const newSettings: ProfileSettings = {
    ...currentSettings,
    preferences
  }
  
  setProfileData('settings', newSettings)
}

/**
 * 添加活动记录
 */
export const addActivityRecord = (record: Omit<ActivityRecord, 'id' | 'timestamp'>): void => {
  const currentSettings = getProfileData('settings') as ProfileSettings || {
    apiConfig: { model: 'openai', key: '' },
    preferences: {},
    activityHistory: []
  }
  
  const newRecord: ActivityRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    ...record
  }
  
  // 保留最近 100 条记录
  const updatedHistory = [newRecord, ...currentSettings.activityHistory].slice(0, 100)
  
  const newSettings: ProfileSettings = {
    ...currentSettings,
    activityHistory: updatedHistory
  }
  
  setProfileData('settings', newSettings)
}

/**
 * 获取活动历史
 */
export const getActivityHistory = (): ActivityRecord[] => {
  const settings = getProfileData('settings') as ProfileSettings
  return settings?.activityHistory || []
}

/**
 * 清除活动历史
 */
export const clearActivityHistory = (): void => {
  log('[profileSettings] Clearing activity history')
  
  const currentSettings = getProfileData('settings') as ProfileSettings || {
    apiConfig: { model: 'openai', key: '' },
    preferences: {},
    activityHistory: []
  }
  
  const newSettings: ProfileSettings = {
    ...currentSettings,
    activityHistory: []
  }
  
  setProfileData('settings', newSettings)
}

/**
 * 验证 API key 格式
 */
export const validateAPIKey = (model: APIConfig['model'], key: string): boolean => {
  if (!key) return false
  
  switch (model) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20
    case 'claude':
      return key.startsWith('sk-ant-') && key.length > 20
    case 'qwen':
      return key.length > 20
    default:
      return false
  }
} 