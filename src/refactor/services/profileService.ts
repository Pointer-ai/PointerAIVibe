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

// Profile管理服务

import {
  Profile,
  ProfileStore,
  CreateProfileInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  ProfileStats,
  ProfileOperationResult,
  ProfileValidationError,
  ProfileSettings,
  APIConfig
} from '../types/profile'

/**
 * Profile管理服务类
 * 提供完整的Profile管理功能，兼容原系统数据格式
 */
export class RefactorProfileService {
  private readonly STORAGE_KEY = 'profiles'
  private readonly ORIGINAL_STORAGE_KEY = 'pointer_ai_profiles'
  private readonly OLD_PROFILE_KEY = 'currentProfile'

  /**
   * 获取所有Profile
   */
  getAllProfiles(): Profile[] {
    try {
      const store = this.getProfileStore()
      return store.profiles
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get all profiles:', error)
      return []
    }
  }

  /**
   * 获取当前活跃Profile
   */
  getCurrentProfile(): Profile | null {
    try {
      const store = this.getProfileStore()
      if (!store.currentProfileId) {
        return null
      }

      const profile = store.profiles.find(p => p.id === store.currentProfileId)
      return profile || null
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get current profile:', error)
      return null
    }
  }

  /**
   * 根据ID获取Profile
   */
  getProfileById(id: string): Profile | null {
    try {
      const store = this.getProfileStore()
      return store.profiles.find(p => p.id === id) || null
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get profile by id:', error)
      return null
    }
  }

  /**
   * 创建新Profile
   */
  async createProfile(input: CreateProfileInput): Promise<ProfileOperationResult> {
    try {
      // 验证输入
      const validation = this.validateProfileInput(input)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        }
      }

      // 检查名称是否重复
      const existing = this.getAllProfiles().find(p => p.name === input.name)
      if (existing) {
        return {
          success: false,
          error: 'Profile名称已存在'
        }
      }

      // 创建新Profile
      const newProfile: Profile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        email: input.email,
        bio: input.bio,
        avatar: input.avatar,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        data: {
          settings: this.getDefaultSettings()
        }
      }

      // 保存到存储
      const store = this.getProfileStore()
      store.profiles.push(newProfile)
      this.saveProfileStore(store)

      // 如果是第一个Profile，设为当前Profile
      if (store.profiles.length === 1) {
        this.switchProfile(newProfile.id)
      }

      return {
        success: true,
        data: newProfile
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to create profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建Profile失败'
      }
    }
  }

  /**
   * 更新Profile信息
   */
  async updateProfile(id: string, input: UpdateProfileInput): Promise<ProfileOperationResult> {
    try {
      const store = this.getProfileStore()
      const profileIndex = store.profiles.findIndex(p => p.id === id)
      
      if (profileIndex === -1) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 检查名称重复（排除自己）
      if (input.name) {
        const existing = store.profiles.find(p => p.name === input.name && p.id !== id)
        if (existing) {
          return {
            success: false,
            error: 'Profile名称已存在'
          }
        }
      }

      // 更新Profile
      const currentProfile = store.profiles[profileIndex]
      const updatedProfile: Profile = {
        ...currentProfile,
        ...input,
        updatedAt: new Date()
      }

      store.profiles[profileIndex] = updatedProfile
      this.saveProfileStore(store)

      return {
        success: true,
        data: updatedProfile
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to update profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新Profile失败'
      }
    }
  }

  /**
   * 更新Profile设置
   */
  async updateSettings(id: string, input: UpdateSettingsInput): Promise<ProfileOperationResult> {
    try {
      const store = this.getProfileStore()
      const profileIndex = store.profiles.findIndex(p => p.id === id)
      
      if (profileIndex === -1) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 更新设置
      const currentProfile = store.profiles[profileIndex]
      const updatedSettings: ProfileSettings = {
        ...currentProfile.data.settings,
        ...input,
        // 确保必需字段的类型安全
        notifications: {
          ...currentProfile.data.settings.notifications,
          ...input.notifications
        },
        privacy: {
          ...currentProfile.data.settings.privacy,
          ...input.privacy
        },
        learning: {
          ...currentProfile.data.settings.learning,
          ...input.learning
        }
      }

      const updatedProfile: Profile = {
        ...currentProfile,
        data: {
          ...currentProfile.data,
          settings: updatedSettings
        },
        updatedAt: new Date()
      }

      store.profiles[profileIndex] = updatedProfile
      this.saveProfileStore(store)

      // 如果更新了API配置，重新加载AI服务配置
      if (input.apiConfig) {
        // 通知AI服务重新加载配置
        if (typeof window !== 'undefined' && (window as any).refactorAIService) {
          (window as any).refactorAIService.reloadConfig()
        }
      }

      return {
        success: true,
        data: updatedProfile
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to update settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新设置失败'
      }
    }
  }

  /**
   * 删除Profile
   */
  async deleteProfile(id: string): Promise<ProfileOperationResult> {
    try {
      const store = this.getProfileStore()
      const profileIndex = store.profiles.findIndex(p => p.id === id)
      
      if (profileIndex === -1) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 不能删除最后一个Profile
      if (store.profiles.length === 1) {
        return {
          success: false,
          error: '不能删除最后一个Profile'
        }
      }

      // 删除Profile
      const deletedProfile = store.profiles[profileIndex]
      store.profiles.splice(profileIndex, 1)

      // 如果删除的是当前Profile，切换到第一个可用Profile
      if (store.currentProfileId === id) {
        store.currentProfileId = store.profiles[0]?.id || null
      }

      this.saveProfileStore(store)

      // 清理相关数据
      this.cleanupProfileData(id)

      return {
        success: true,
        data: deletedProfile
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to delete profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除Profile失败'
      }
    }
  }

  /**
   * 切换当前Profile
   */
  switchProfile(id: string): boolean {
    try {
      const store = this.getProfileStore()
      const profile = store.profiles.find(p => p.id === id)
      
      if (!profile) {
        console.error('[RefactorProfileService] Profile not found:', id)
        return false
      }

      store.currentProfileId = id
      this.saveProfileStore(store)

      // 同步到旧系统（兼容性）
      localStorage.setItem(this.OLD_PROFILE_KEY, id)

      return true
    } catch (error) {
      console.error('[RefactorProfileService] Failed to switch profile:', error)
      return false
    }
  }

  /**
   * 获取Profile统计信息
   */
  getProfileStats(): ProfileStats {
    try {
      const store = this.getProfileStore()
      const current = this.getCurrentProfile()
      
      // 计算存储使用情况
      const storageUsed = this.calculateStorageUsage()
      
      // 获取评估和目标数量
      const assessmentCount = this.getAssessmentCount(store.currentProfileId)
      const goalCount = this.getGoalCount(store.currentProfileId)

      return {
        totalProfiles: store.profiles.length,
        activeProfile: store.currentProfileId,
        lastActive: current?.updatedAt || null,
        storageUsed,
        assessmentCount,
        goalCount
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get profile stats:', error)
      return {
        totalProfiles: 0,
        activeProfile: null,
        lastActive: null,
        storageUsed: 0,
        assessmentCount: 0,
        goalCount: 0
      }
    }
  }

  /**
   * 导出Profile数据
   */
  exportProfile(id: string): string | null {
    try {
      const profile = this.getProfileById(id)
      if (!profile) {
        return null
      }

      // 包含相关数据
      const exportData = {
        profile,
        assessments: this.getProfileAssessments(id),
        goals: this.getProfileGoals(id),
        exportDate: new Date().toISOString()
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('[RefactorProfileService] Failed to export profile:', error)
      return null
    }
  }

  /**
   * 导入Profile数据
   */
  async importProfile(data: string): Promise<ProfileOperationResult> {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.profile) {
        return {
          success: false,
          error: '无效的Profile数据'
        }
      }

      // 生成新ID避免冲突
      const newProfile: Profile = {
        ...importData.profile,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 检查名称冲突
      const existing = this.getAllProfiles().find(p => p.name === newProfile.name)
      if (existing) {
        newProfile.name = `${newProfile.name} (导入)`
      }

      // 创建Profile
      const store = this.getProfileStore()
      store.profiles.push(newProfile)
      this.saveProfileStore(store)

      return {
        success: true,
        data: newProfile
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to import profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '导入Profile失败'
      }
    }
  }

  /**
   * 私有方法：获取Profile存储
   * 优先读取原系统数据，如果不存在则读取新系统数据
   */
  private getProfileStore(): ProfileStore {
    try {
      // 首先尝试读取原系统数据
      const originalData = localStorage.getItem(this.ORIGINAL_STORAGE_KEY)
      if (originalData) {
        const originalStore = JSON.parse(originalData)
        return this.convertOriginalToNewFormat(originalStore)
      }

      // 如果没有原系统数据，读取新系统数据
      const newData = localStorage.getItem(this.STORAGE_KEY)
      if (newData) {
        const parsed = JSON.parse(newData)
        // 确保profiles是数组
        if (parsed.profiles && Array.isArray(parsed.profiles)) {
          return parsed
        }
      }
    } catch (error) {
      console.warn('[RefactorProfileService] Failed to parse profile store:', error)
    }

    // 返回默认存储结构
    return {
      currentProfileId: null,
      profiles: []
    }
  }

  /**
   * 私有方法：将原系统格式转换为新系统格式
   */
  private convertOriginalToNewFormat(originalStore: any): ProfileStore {
    try {
      const originalProfiles = originalStore.profiles || []
      const convertedProfiles: Profile[] = originalProfiles.map((original: any) => {
        // 转换为新格式
        const converted: Profile = {
          id: original.id,
          name: original.name,
          avatar: original.avatar,
          email: undefined, // 原系统没有email字段
          bio: undefined, // 原系统没有bio字段
          createdAt: new Date(original.createdAt),
          updatedAt: new Date(original.lastLogin || original.createdAt),
          isActive: true,
          data: {
            settings: this.convertOriginalSettings(original.data),
            progress: original.data,
            achievements: []
          }
        }
        return converted
      })

      return {
        currentProfileId: originalStore.currentProfileId,
        profiles: convertedProfiles
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to convert original format:', error)
      return {
        currentProfileId: null,
        profiles: []
      }
    }
  }

  /**
   * 私有方法：转换原系统设置为新格式
   */
  private convertOriginalSettings(originalData: any): ProfileSettings {
    const defaultSettings = this.getDefaultSettings()
    
    // 如果原系统有settings，尝试转换
    if (originalData && originalData.settings) {
      return {
        ...defaultSettings,
        // 从原系统设置中提取可用字段
        theme: originalData.settings.theme || defaultSettings.theme,
        language: originalData.settings.language || defaultSettings.language,
        apiConfig: originalData.settings.apiConfig || defaultSettings.apiConfig,
        notifications: {
          ...defaultSettings.notifications,
          ...originalData.settings.notifications
        },
        privacy: {
          ...defaultSettings.privacy,
          ...originalData.settings.privacy
        },
        learning: {
          ...defaultSettings.learning,
          ...originalData.settings.learning
        }
      }
    }

    return defaultSettings
  }

  /**
   * 私有方法：保存Profile存储
   * 同时保存到原系统和新系统格式
   */
  private saveProfileStore(store: ProfileStore): void {
    try {
      // 保存到新系统格式
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store))
      
      // 同时保存到原系统格式以保持兼容性
      const originalFormat = this.convertNewToOriginalFormat(store)
      localStorage.setItem(this.ORIGINAL_STORAGE_KEY, JSON.stringify(originalFormat))
      
      // 兼容旧的currentProfile key
      localStorage.setItem(this.OLD_PROFILE_KEY, store.currentProfileId || '')
    } catch (error) {
      console.error('[RefactorProfileService] Failed to save profile store:', error)
      throw error
    }
  }

  /**
   * 私有方法：将新系统格式转换为原系统格式
   */
  private convertNewToOriginalFormat(newStore: ProfileStore): any {
    try {
      const originalProfiles = newStore.profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        hasPassword: false, // 新系统暂不支持密码
        createdAt: profile.createdAt.toISOString(),
        lastLogin: profile.updatedAt.toISOString(),
        avatar: profile.avatar || '👤',
        data: {
          ...profile.data.progress,
          settings: profile.data.settings
        }
      }))

      return {
        profiles: originalProfiles,
        currentProfileId: newStore.currentProfileId
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to convert to original format:', error)
      return {
        profiles: [],
        currentProfileId: null
      }
    }
  }

  /**
   * 私有方法：获取默认设置
   */
  private getDefaultSettings(): ProfileSettings {
    return {
      theme: 'system',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        desktop: false
      },
      privacy: {
        analytics: true,
        dataCollection: true
      },
      learning: {
        dailyGoal: 60, // 60分钟
        difficulty: 'intermediate',
        focusAreas: []
      }
    }
  }

  /**
   * 私有方法：验证Profile输入
   */
  private validateProfileInput(input: CreateProfileInput): { isValid: boolean; errors: ProfileValidationError[] } {
    const errors: ProfileValidationError[] = []

    // 验证名称
    if (!input.name || input.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Profile名称不能为空' })
    } else if (input.name.length > 50) {
      errors.push({ field: 'name', message: 'Profile名称不能超过50个字符' })
    }

    // 验证邮箱
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' })
    }

    // 验证简介
    if (input.bio && input.bio.length > 200) {
      errors.push({ field: 'bio', message: '简介不能超过200个字符' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 私有方法：清理Profile数据
   */
  private cleanupProfileData(profileId: string): void {
    try {
      // 清理评估数据
      localStorage.removeItem(`refactor_assessments_${profileId}`)
      localStorage.removeItem(`refactor_current_assessment_${profileId}`)
      
      // 清理目标数据（如果有）
      localStorage.removeItem(`goals_${profileId}`)
      
      // 清理其他相关数据
      // TODO: 根据实际需要添加更多清理逻辑
    } catch (error) {
      console.warn('[RefactorProfileService] Failed to cleanup profile data:', error)
    }
  }

  /**
   * 私有方法：计算存储使用情况
   */
  private calculateStorageUsage(): number {
    try {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length
        }
      }
      return Math.round(totalSize / 1024 / 1024 * 100) / 100 // MB
    } catch (error) {
      return 0
    }
  }

  /**
   * 私有方法：获取评估数量
   */
  private getAssessmentCount(profileId: string | null): number {
    if (!profileId) return 0
    try {
      const data = localStorage.getItem(`refactor_assessments_${profileId}`)
      return data ? JSON.parse(data).length : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * 私有方法：获取目标数量
   */
  private getGoalCount(profileId: string | null): number {
    if (!profileId) return 0
    try {
      const data = localStorage.getItem(`goals_${profileId}`)
      return data ? JSON.parse(data).length : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * 私有方法：获取Profile评估数据
   */
  private getProfileAssessments(profileId: string): any[] {
    try {
      const data = localStorage.getItem(`refactor_assessments_${profileId}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }

  /**
   * 私有方法：获取Profile目标数据
   */
  private getProfileGoals(profileId: string): any[] {
    try {
      const data = localStorage.getItem(`goals_${profileId}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }
}

/**
 * 默认Profile服务实例
 */
export const refactorProfileService = new RefactorProfileService() 