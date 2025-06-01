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

// Legacy数据服务 - 处理原有数据格式的兼容性

import { getAPIConfig } from '../../modules/profileSettings/service'
import { getProfileData, setProfileData, getCurrentProfile } from '../../utils/profile'

/**
 * Legacy数据管理服务
 * 提供与原有数据管理功能完全相同的接口
 */
export class LegacyDataService {
  
  /**
   * 获取原系统的API配置（直接调用原有函数）
   */
  getAPIConfig() {
    return getAPIConfig()
  }

  /**
   * 获取Profile数据（直接调用原有函数）
   */
  getProfileData(key: string) {
    return getProfileData(key)
  }

  /**
   * 设置Profile数据（直接调用原有函数）
   */
  setProfileData(key: string, value: any) {
    setProfileData(key, value)
  }

  /**
   * 获取当前Profile（直接调用原有函数）
   */
  getCurrentProfile() {
    return getCurrentProfile()
  }

  /**
   * 检查API配置是否完整
   */
  hasValidAPIConfig(): boolean {
    try {
      const config = this.getAPIConfig()
      return !!(config && config.key && config.key.trim())
    } catch (error) {
      console.error('[LegacyDataService] Failed to check API config:', error)
      return false
    }
  }

  /**
   * 获取API配置状态信息
   */
  getAPIConfigStatus() {
    try {
      const config = this.getAPIConfig()
      const hasConfig = this.hasValidAPIConfig()
      
      return {
        hasConfig,
        model: config?.model || null,
        specificModel: config?.specificModel || null,
        keyLength: config?.key ? config.key.length : 0,
        keyMasked: config?.key ? this.maskAPIKey(config.key) : null
      }
    } catch (error) {
      console.error('[LegacyDataService] Failed to get API config status:', error)
      return {
        hasConfig: false,
        model: null,
        specificModel: null,
        keyLength: 0,
        keyMasked: null
      }
    }
  }

  /**
   * 获取所有可用数据
   */
  getAllProfileData() {
    try {
      const profile = this.getCurrentProfile()
      if (!profile) return null

      return {
        profile,
        data: profile.data || {},
        apiConfig: this.getAPIConfig(),
        hasValidAPI: this.hasValidAPIConfig()
      }
    } catch (error) {
      console.error('[LegacyDataService] Failed to get all profile data:', error)
      return null
    }
  }

  /**
   * 诊断数据状态
   */
  diagnoseDataState() {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      profile: {
        current: null as any,
        hasData: false,
        dataKeys: [] as string[]
      },
      apiConfig: {
        configured: false,
        model: null as string | null,
        hasKey: false,
        keyValid: false
      },
      storage: {
        hasProfileStorage: false,
        hasSettingsData: false,
        storageKeys: [] as string[]
      }
    }

    try {
      // 检查Profile
      const currentProfile = this.getCurrentProfile()
      if (currentProfile) {
        diagnosis.profile.current = {
          id: currentProfile.id,
          name: currentProfile.name,
          avatar: currentProfile.avatar
        }
        diagnosis.profile.hasData = !!currentProfile.data
        diagnosis.profile.dataKeys = Object.keys(currentProfile.data || {})
      }

      // 检查API配置
      const apiConfig = this.getAPIConfig()
      if (apiConfig) {
        diagnosis.apiConfig.configured = true
        diagnosis.apiConfig.model = apiConfig.model
        diagnosis.apiConfig.hasKey = !!(apiConfig.key && apiConfig.key.trim())
        diagnosis.apiConfig.keyValid = this.hasValidAPIConfig()
      }

      // 检查存储
      const profilesData = localStorage.getItem('pointer_ai_profiles')
      diagnosis.storage.hasProfileStorage = !!profilesData

      const settingsData = this.getProfileData('settings')
      diagnosis.storage.hasSettingsData = !!settingsData

      // 列出存储keys
      const storageKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) storageKeys.push(key)
      }
      diagnosis.storage.storageKeys = storageKeys

      return diagnosis
    } catch (error) {
      console.error('[LegacyDataService] Diagnosis failed:', error)
      return diagnosis
    }
  }

  /**
   * 私有方法：遮蔽API密钥
   */
  private maskAPIKey(key: string): string {
    if (!key || key.length < 8) return '*'.repeat(key.length || 0)
    
    const start = key.substring(0, 4)
    const end = key.substring(key.length - 4)
    const middle = '*'.repeat(key.length - 8)
    
    return `${start}${middle}${end}`
  }
}

// 创建单例实例
export const legacyDataService = new LegacyDataService() 