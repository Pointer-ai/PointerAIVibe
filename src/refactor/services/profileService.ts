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

// Profile管理服务 - 完全兼容原系统

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

// 导入原有的profile工具函数
import {
  getProfiles as getOriginalProfiles,
  getCurrentProfile as getOriginalCurrentProfile,
  getCurrentProfileId as getOriginalCurrentProfileId,
  createProfile as createOriginalProfile,
  setCurrentProfile as setOriginalCurrentProfile,
  updateProfile as updateOriginalProfile,
  deleteProfile as deleteOriginalProfile,
  getProfileData,
  setProfileData,
  Profile as OriginalProfile
} from '../../utils/profile'

// 导入同步管理器
import { syncManager } from './syncManager'

// 导入CoreData相关功能
import {
  getLearningGoals,
  getLearningPaths,
  getCourseUnits,
  getAgentActions,
  deleteLearningGoal,
  deleteLearningPath,
  deleteCourseUnit
} from '../../modules/coreData'
import { getCurrentAssessment } from '../../modules/abilityAssess/service'
import { addActivityRecord } from '../../modules/profileSettings/service'

/**
 * 增强的Profile管理服务类
 * 完全兼容原系统数据格式，同时提供现代化的接口
 */
export class RefactorProfileService {
  private readonly REFACTOR_STORAGE_KEY = 'refactor_profiles_metadata'
  private switchLock = false
  private eventListeners: Array<() => void> = []

  /**
   * 添加Profile切换事件监听器
   */
  addProfileSwitchListener(listener: () => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * 移除Profile切换事件监听器
   */
  removeProfileSwitchListener(listener: () => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  /**
   * 触发Profile切换事件
   */
  private notifyProfileSwitch(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('[RefactorProfileService] Event listener error:', error)
      }
    })
  }

  /**
   * 获取所有Profile（转换为新格式）
   */
  getAllProfiles(): Profile[] {
    try {
      const originalProfiles = getOriginalProfiles()
      return originalProfiles.map(original => this.convertToNewFormat(original))
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
      const originalProfile = getOriginalCurrentProfile()
      if (!originalProfile) return null
      return this.convertToNewFormat(originalProfile)
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
      const allProfiles = this.getAllProfiles()
      return allProfiles.find(p => p.id === id) || null
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

      // 使用原系统创建Profile
      const originalProfile = createOriginalProfile(
        input.name,
        undefined, // 暂不支持密码
        input.avatar
      )

      // 设置额外的metadata
      this.setProfileMetadata(originalProfile.id, {
        email: input.email,
        bio: input.bio,
        settings: this.getDefaultSettings()
      })

      // 转换为新格式返回
      const newProfile = this.convertToNewFormat(originalProfile)

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
      const originalProfiles = getOriginalProfiles()
      const originalProfile = originalProfiles.find(p => p.id === id)
      
      if (!originalProfile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 检查名称重复（排除自己）
      if (input.name) {
        const existing = originalProfiles.find(p => p.name === input.name && p.id !== id)
        if (existing) {
          return {
            success: false,
            error: 'Profile名称已存在'
          }
        }
      }

      // 更新原系统的Profile
      const updates: Partial<OriginalProfile> = {}
      if (input.name) updates.name = input.name
      if (input.avatar) updates.avatar = input.avatar

      updateOriginalProfile(id, updates)

      // 更新metadata
      const currentMetadata = this.getProfileMetadata(id)
      this.setProfileMetadata(id, {
        ...currentMetadata,
        email: input.email !== undefined ? input.email : currentMetadata.email,
        bio: input.bio !== undefined ? input.bio : currentMetadata.bio
      })

      // 获取更新后的Profile
      const updatedOriginal = getOriginalProfiles().find(p => p.id === id)
      if (!updatedOriginal) {
        return {
          success: false,
          error: '更新失败'
        }
      }

      const updatedProfile = this.convertToNewFormat(updatedOriginal)

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
      const originalProfile = getOriginalProfiles().find(p => p.id === id)
      
      if (!originalProfile) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 获取当前设置
      const currentSettings = this.getProfileSettings(id)
      
      // 构建新的设置
      const updatedSettings: ProfileSettings = {
        ...currentSettings,
        ...input,
        notifications: {
          ...currentSettings.notifications,
          ...input.notifications
        },
        privacy: {
          ...currentSettings.privacy,
          ...input.privacy
        },
        learning: {
          ...currentSettings.learning,
          ...input.learning
        }
      }

      // 如果更新了API配置，需要特殊处理以兼容原系统格式
      if (input.apiConfig) {
        const apiConfigData = this.convertAPIConfigToOriginalFormat(input.apiConfig)
        
        // 设置原系统的settings格式
        setProfileData('settings', {
          ...getProfileData('settings'),
          ...apiConfigData
        })
      }

      // 保存到metadata
      const currentMetadata = this.getProfileMetadata(id)
      this.setProfileMetadata(id, {
        ...currentMetadata,
        settings: updatedSettings
      })

      // 获取更新后的Profile
      const updatedProfile = this.convertToNewFormat(originalProfile)

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
      const originalProfiles = getOriginalProfiles()
      const profileToDelete = originalProfiles.find(p => p.id === id)
      
      if (!profileToDelete) {
        return {
          success: false,
          error: 'Profile不存在'
        }
      }

      // 不能删除最后一个Profile
      if (originalProfiles.length === 1) {
        return {
          success: false,
          error: '不能删除最后一个Profile'
        }
      }

      // 删除原系统的Profile
      deleteOriginalProfile(id)

      // 删除metadata
      this.deleteProfileMetadata(id)

      const deletedProfile = this.convertToNewFormat(profileToDelete)

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
  async switchProfile(id: string): Promise<boolean> {
    // 防止并发切换
    if (this.switchLock || syncManager.isSyncing()) {
      console.warn('[RefactorProfileService] Profile switch in progress, ignoring request')
      return false
    }

    this.switchLock = true

    try {
      const allProfiles = getOriginalProfiles()
      const profile = allProfiles.find(p => p.id === id)
      
      if (!profile) {
        console.error('[RefactorProfileService] Profile not found:', id)
        return false
      }

      // 原子性切换
      setOriginalCurrentProfile(id)
      
      console.log(`[RefactorProfileService] Successfully switched to profile: ${profile.name} (${id})`)
      
      // 使用同步管理器执行相关同步操作
      await syncManager.executeSync()
      
      // 触发事件通知
      this.notifyProfileSwitch()
      
      return true
    } catch (error) {
      console.error('[RefactorProfileService] Failed to switch profile:', error)
      return false
    } finally {
      // 延迟释放锁，确保相关服务有时间响应切换事件
      setTimeout(() => {
        this.switchLock = false
      }, 100)
    }
  }

  /**
   * 获取Profile统计信息
   */
  getProfileStats(): ProfileStats {
    try {
      const profiles = this.getAllProfiles()
      const currentProfile = this.getCurrentProfile()
      
      return {
        totalProfiles: profiles.length,
        activeProfile: currentProfile?.name || null,
        lastActive: currentProfile?.updatedAt || null,
        storageUsed: this.calculateStorageUsage(),
        assessmentCount: this.getAssessmentCount(currentProfile?.id),
        goalCount: this.getGoalCount(currentProfile?.id)
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get stats:', error)
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

      // 获取原系统数据
      const originalProfile = getOriginalProfiles().find(p => p.id === id)
      if (!originalProfile) {
        return null
      }

      const exportData = {
        profile,
        originalData: originalProfile.data,
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

      // 创建新Profile
      const result = await this.createProfile({
        name: `${importData.profile.name} (导入)`,
        email: importData.profile.email,
        bio: importData.profile.bio,
        avatar: importData.profile.avatar
      })

      if (result.success && result.data) {
        // 导入原始数据
        if (importData.originalData) {
          const originalProfiles = getOriginalProfiles()
          const profileIndex = originalProfiles.findIndex(p => p.id === result.data!.id)
          if (profileIndex !== -1) {
            originalProfiles[profileIndex].data = importData.originalData
            // 更新localStorage
            localStorage.setItem('pointer_ai_profiles', JSON.stringify({
              profiles: originalProfiles,
              currentProfileId: getOriginalCurrentProfileId()
            }))
          }
        }
      }

      return result
    } catch (error) {
      console.error('[RefactorProfileService] Failed to import profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '导入Profile失败'
      }
    }
  }

  /**
   * 私有方法：将原格式转换为新格式
   */
  private convertToNewFormat(original: OriginalProfile): Profile {
    const metadata = this.getProfileMetadata(original.id)
    const settings = this.getProfileSettings(original.id)

    return {
      id: original.id,
      name: original.name,
      avatar: original.avatar,
      email: metadata.email,
      bio: metadata.bio,
      createdAt: new Date(original.createdAt),
      updatedAt: new Date(original.lastLogin || original.createdAt),
      isActive: true,
      data: {
        settings: settings,
        progress: original.data,
        achievements: []
      }
    }
  }

  /**
   * 私有方法：获取Profile设置（兼容原系统格式）
   */
  private getProfileSettings(profileId: string): ProfileSettings {
    try {
      // 先从当前Profile切换到指定Profile来获取设置
      const originalCurrentId = getOriginalCurrentProfileId()
      const needSwitch = originalCurrentId !== profileId
      
      if (needSwitch) {
        setOriginalCurrentProfile(profileId)
      }

      // 从原系统获取settings
      const originalSettings = getProfileData('settings')
      
      // 恢复原来的Profile
      if (needSwitch && originalCurrentId) {
        setOriginalCurrentProfile(originalCurrentId)
      }

      // 从metadata获取新格式设置
      const metadata = this.getProfileMetadata(profileId)
      const defaultSettings = this.getDefaultSettings()

      // 合并设置，优先使用原系统的API配置
      let apiConfig = defaultSettings.apiConfig
      
      if (originalSettings?.apiConfig) {
        // 转换原系统的API配置格式
        apiConfig = this.convertOriginalAPIConfig(originalSettings.apiConfig)
      }

      return {
        ...defaultSettings,
        ...metadata.settings,
        apiConfig: apiConfig
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get profile settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * 私有方法：转换原系统API配置为新格式
   */
  private convertOriginalAPIConfig(originalConfig: any): APIConfig {
    const defaultConfig = this.getDefaultSettings().apiConfig!
    
    if (!originalConfig) return defaultConfig

    // 如果是新格式，直接返回
    if (originalConfig.model && originalConfig.key) {
      return originalConfig
    }

    // 转换旧格式
    const currentService = originalConfig.currentService
    if (currentService && originalConfig[currentService]) {
      const serviceConfig = originalConfig[currentService]
      return {
        model: this.mapOldServiceToNewModel(currentService),
        key: serviceConfig.apiKey || '',
        specificModel: serviceConfig.model || this.getDefaultModelForService(currentService),
        params: {
          temperature: 0.7,
          maxTokens: 2000,
          ...serviceConfig.params
        }
      }
    }

    return defaultConfig
  }

  /**
   * 私有方法：将新格式API配置转换为原系统格式
   */
  private convertAPIConfigToOriginalFormat(config: APIConfig): any {
    return {
      apiConfig: {
        currentService: this.mapNewModelToOldService(config.model),
        [this.mapNewModelToOldService(config.model)]: {
          apiKey: config.key,
          model: config.specificModel,
          params: config.params
        }
      }
    }
  }

  /**
   * 私有方法：映射服务名称
   */
  private mapOldServiceToNewModel(oldService: string): 'openai' | 'claude' | 'qwen' {
    switch (oldService) {
      case 'openai': return 'openai'
      case 'claude': return 'claude'
      case 'qwen': return 'qwen'
      default: return 'openai'
    }
  }

  private mapNewModelToOldService(newModel: string): string {
    switch (newModel) {
      case 'openai': return 'openai'
      case 'claude': return 'claude'
      case 'qwen': return 'qwen'
      default: return 'openai'
    }
  }

  private getDefaultModelForService(service: string): string {
    switch (service) {
      case 'openai': return 'gpt-4'
      case 'claude': return 'claude-3-5-sonnet-20241022'
      case 'qwen': return 'qwen-plus'
      default: return 'gpt-4'
    }
  }

  /**
   * 私有方法：获取Profile的metadata
   */
  private getProfileMetadata(profileId: string): any {
    try {
      const metadata = localStorage.getItem(`${this.REFACTOR_STORAGE_KEY}_${profileId}`)
      return metadata ? JSON.parse(metadata) : {}
    } catch (error) {
      return {}
    }
  }

  /**
   * 私有方法：设置Profile的metadata
   */
  private setProfileMetadata(profileId: string, data: any): void {
    try {
      localStorage.setItem(`${this.REFACTOR_STORAGE_KEY}_${profileId}`, JSON.stringify(data))
    } catch (error) {
      console.error('[RefactorProfileService] Failed to set metadata:', error)
    }
  }

  /**
   * 私有方法：删除Profile的metadata
   */
  private deleteProfileMetadata(profileId: string): void {
    try {
      localStorage.removeItem(`${this.REFACTOR_STORAGE_KEY}_${profileId}`)
    } catch (error) {
      console.error('[RefactorProfileService] Failed to delete metadata:', error)
    }
  }

  /**
   * 私有方法：获取默认设置
   */
  private getDefaultSettings(): ProfileSettings {
    return {
      theme: 'system',
      language: 'zh-CN',
      apiConfig: {
        model: 'openai',
        key: '',
        specificModel: 'gpt-4',
        params: {
          temperature: 0.7,
          maxTokens: 2000
        }
      },
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
        dailyGoal: 30,
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

    if (!input.name || input.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Profile名称不能为空' })
    }

    if (input.name && input.name.length > 50) {
      errors.push({ field: 'name', message: 'Profile名称不能超过50个字符' })
    }

    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 私有方法：计算存储使用量
   */
  private calculateStorageUsage(): number {
    try {
      let total = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            total += new Blob([value]).size
          }
        }
      }
      return Math.round(total / 1024 / 1024 * 100) / 100 // MB
    } catch (error) {
      return 0
    }
  }

  /**
   * 私有方法：获取评估数量
   */
  private getAssessmentCount(profileId?: string): number {
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
  private getGoalCount(profileId?: string): number {
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

  /**
   * 获取Profile的学习数据统计
   */
  getProfileDataStats(profileId?: string): {
    goals: number
    paths: number
    courseUnits: number
    agentActions: number
    hasAssessment: boolean
    goalsByStatus: Record<string, number>
    pathsByStatus: Record<string, number>
  } {
    try {
      // 如果指定了profileId，先切换到该profile（仅用于数据读取）
      const currentProfileId = getOriginalCurrentProfileId()
      
      const goals = getLearningGoals()
      const paths = getLearningPaths()
      const courseUnits = getCourseUnits()
      const agentActions = getAgentActions()
      const currentAssessment = getCurrentAssessment()

      // 统计目标状态分布
      const goalsByStatus = goals.reduce((acc, goal) => {
        acc[goal.status] = (acc[goal.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // 统计路径状态分布
      const pathsByStatus = paths.reduce((acc, path) => {
        acc[path.status] = (acc[path.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        goals: goals.length,
        paths: paths.length,
        courseUnits: courseUnits.length,
        agentActions: agentActions.length,
        hasAssessment: !!currentAssessment,
        goalsByStatus,
        pathsByStatus
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get data stats:', error)
      return {
        goals: 0,
        paths: 0,
        courseUnits: 0,
        agentActions: 0,
        hasAssessment: false,
        goalsByStatus: {},
        pathsByStatus: {}
      }
    }
  }

  /**
   * 获取Profile的完整学习数据
   */
  getProfileLearningData() {
    try {
      return {
        goals: getLearningGoals(),
        paths: getLearningPaths(),
        courseUnits: getCourseUnits(),
        agentActions: getAgentActions(),
        currentAssessment: getCurrentAssessment()
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to get learning data:', error)
      return {
        goals: [],
        paths: [],
        courseUnits: [],
        agentActions: [],
        currentAssessment: null
      }
    }
  }

  /**
   * 删除学习目标（级联删除相关路径和课程）
   */
  async deleteLearningGoal(goalId: string, title: string): Promise<ProfileOperationResult> {
    try {
      const success = deleteLearningGoal(goalId)
      
      if (success) {
        // 记录删除操作到活动历史
        addActivityRecord({
          type: 'data_operation',
          action: '删除学习目标',
          details: {
            itemType: 'goal',
            itemId: goalId,
            itemTitle: title,
            success: true
          }
        })

        return {
          success: true
        }
      } else {
        return {
          success: false,
          error: '学习目标删除失败'
        }
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to delete goal:', error)
      
      // 记录失败的删除操作
      addActivityRecord({
        type: 'data_operation',
        action: '删除学习目标失败',
        details: {
          itemType: 'goal',
          itemId: goalId,
          itemTitle: title,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : '删除学习目标失败'
      }
    }
  }

  /**
   * 删除学习路径（级联删除相关课程）
   */
  async deleteLearningPath(pathId: string, title: string): Promise<ProfileOperationResult> {
    try {
      const success = deleteLearningPath(pathId)
      
      if (success) {
        // 记录删除操作到活动历史
        addActivityRecord({
          type: 'data_operation',
          action: '删除学习路径',
          details: {
            itemType: 'path',
            itemId: pathId,
            itemTitle: title,
            success: true
          }
        })

        return {
          success: true
        }
      } else {
        return {
          success: false,
          error: '学习路径删除失败'
        }
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to delete path:', error)
      
      // 记录失败的删除操作
      addActivityRecord({
        type: 'data_operation',
        action: '删除学习路径失败',
        details: {
          itemType: 'path',
          itemId: pathId,
          itemTitle: title,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : '删除学习路径失败'
      }
    }
  }

  /**
   * 删除课程单元
   */
  async deleteCourseUnit(unitId: string, title: string): Promise<ProfileOperationResult> {
    try {
      const success = deleteCourseUnit(unitId)
      
      if (success) {
        // 记录删除操作到活动历史
        addActivityRecord({
          type: 'data_operation',
          action: '删除课程单元',
          details: {
            itemType: 'unit',
            itemId: unitId,
            itemTitle: title,
            success: true
          }
        })

        return {
          success: true
        }
      } else {
        return {
          success: false,
          error: '课程单元删除失败'
        }
      }
    } catch (error) {
      console.error('[RefactorProfileService] Failed to delete unit:', error)
      
      // 记录失败的删除操作
      addActivityRecord({
        type: 'data_operation',
        action: '删除课程单元失败',
        details: {
          itemType: 'unit',
          itemId: unitId,
          itemTitle: title,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : '删除课程单元失败'
      }
    }
  }

  /**
   * 导出学习数据为JSON
   */
  exportLearningData(): string {
    try {
      const data = this.getProfileLearningData()
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('[RefactorProfileService] Failed to export learning data:', error)
      return '{}'
    }
  }
}

// 创建单例实例
export const refactorProfileService = new RefactorProfileService() 