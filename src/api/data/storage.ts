/**
 * Learning API 存储抽象层
 * 提供统一的数据存储接口，隐藏具体的存储实现细节
 */

import { getCurrentProfile, getProfileData, setProfileData } from '../../utils/profile'
import { log } from '../../utils/logger'
import type { StorageAdapter, CoreData } from './types'

/**
 * Profile级别的存储适配器
 * 基于现有的profile系统实现数据隔离
 */
export class ProfileStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        log('[ProfileStorage] No active profile')
        return null
      }

      const data = getProfileData(key)
      return data || null
    } catch (error) {
      log('[ProfileStorage] Get failed:', error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('No active profile')
      }

      setProfileData(key, value)
      log(`[ProfileStorage] Set key: ${key}`)
    } catch (error) {
      log('[ProfileStorage] Set failed:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('No active profile')
      }

      setProfileData(key, null)
      log(`[ProfileStorage] Deleted key: ${key}`)
    } catch (error) {
      log('[ProfileStorage] Delete failed:', error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const data = await this.get(key)
      return data !== null
    } catch (error) {
      log('[ProfileStorage] Exists check failed:', error)
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('No active profile')
      }

      // 清除当前profile的所有数据
      const keys = ['coreData', 'settings', 'cache']
      for (const key of keys) {
        await this.delete(key)
      }
      
      log('[ProfileStorage] Cleared all data')
    } catch (error) {
      log('[ProfileStorage] Clear failed:', error)
      throw error
    }
  }
}

/**
 * 核心数据管理器
 * 专门处理CoreData的读写和缓存
 */
export class CoreDataManager {
  private storage: StorageAdapter
  private cache: CoreData | null = null
  private readonly CORE_DATA_KEY = 'coreData'

  constructor(storage: StorageAdapter) {
    this.storage = storage
  }

  /**
   * 获取用户的核心数据
   */
  async getCoreData(): Promise<CoreData> {
    try {
      // 优先使用缓存
      if (this.cache) {
        return this.cache
      }

      // 从存储获取
      const stored = await this.storage.get<CoreData>(this.CORE_DATA_KEY)
      
      if (stored) {
        this.cache = stored
        return stored
      }

      // 创建默认数据
      const defaultData: CoreData = {
        events: [],
        goals: [],
        paths: [],
        courseUnits: [],
        agentActions: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalStudyTime: 0,
          streakDays: 0
        }
      }

      this.cache = defaultData
      await this.saveCoreData(defaultData)
      
      return defaultData
    } catch (error) {
      log('[CoreDataManager] Get CoreData failed:', error)
      throw error
    }
  }

  /**
   * 保存核心数据
   */
  async saveCoreData(data: CoreData): Promise<void> {
    try {
      // 更新时间戳
      data.metadata.lastUpdated = new Date().toISOString()
      
      // 保存到存储
      await this.storage.set(this.CORE_DATA_KEY, data)
      
      // 更新缓存
      this.cache = data
      
      log('[CoreDataManager] CoreData saved successfully')
    } catch (error) {
      log('[CoreDataManager] Save CoreData failed:', error)
      throw error
    }
  }

  /**
   * 更新核心数据的某个字段
   */
  async updateCoreData(updates: Partial<CoreData>): Promise<CoreData> {
    try {
      const currentData = await this.getCoreData()
      const updatedData = { ...currentData, ...updates }
      
      await this.saveCoreData(updatedData)
      return updatedData
    } catch (error) {
      log('[CoreDataManager] Update CoreData failed:', error)
      throw error
    }
  }

  /**
   * 添加事件记录
   */
  async addEvent(event: Omit<import('./types').CoreDataEvent, 'id'>): Promise<void> {
    try {
      const coreData = await this.getCoreData()
      
      const newEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event
      }
      
      coreData.events.push(newEvent)
      
      // 限制事件数量，保留最近的1000条
      if (coreData.events.length > 1000) {
        coreData.events = coreData.events.slice(-1000)
      }
      
      await this.saveCoreData(coreData)
      log(`[CoreDataManager] Event added: ${event.type}`)
    } catch (error) {
      log('[CoreDataManager] Add event failed:', error)
      throw error
    }
  }

  /**
   * 获取最近的事件
   */
  async getRecentEvents(limit = 50): Promise<import('./types').CoreDataEvent[]> {
    try {
      const coreData = await this.getCoreData()
      return coreData.events.slice(-limit).reverse()
    } catch (error) {
      log('[CoreDataManager] Get recent events failed:', error)
      return []
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null
  }

  /**
   * 获取数据统计
   */
  async getStats(): Promise<{
    totalEvents: number
    totalGoals: number
    totalPaths: number
    totalCourseUnits: number
    totalAgentActions: number
    dataSize: number
    lastUpdated: string
  }> {
    try {
      const coreData = await this.getCoreData()
      
      // 计算数据大小 (粗略估算)
      const dataSize = JSON.stringify(coreData).length
      
      return {
        totalEvents: coreData.events.length,
        totalGoals: coreData.goals.length,
        totalPaths: coreData.paths.length,
        totalCourseUnits: coreData.courseUnits.length,
        totalAgentActions: coreData.agentActions.length,
        dataSize,
        lastUpdated: coreData.metadata.lastUpdated
      }
    } catch (error) {
      log('[CoreDataManager] Get stats failed:', error)
      return {
        totalEvents: 0,
        totalGoals: 0,
        totalPaths: 0,
        totalCourseUnits: 0,
        totalAgentActions: 0,
        dataSize: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * 验证数据完整性
   */
  async validateData(): Promise<{
    isValid: boolean
    issues: string[]
    warnings: string[]
  }> {
    try {
      const coreData = await this.getCoreData()
      const issues: string[] = []
      const warnings: string[] = []

      // 检查必要字段
      if (!coreData.metadata.version) {
        issues.push('缺少版本信息')
      }

      // 检查数据关联性
      for (const path of coreData.paths) {
        const relatedGoal = coreData.goals.find(g => g.id === path.goalId)
        if (!relatedGoal) {
          issues.push(`路径 "${path.title}" 引用的目标不存在`)
        }
      }

      for (const unit of coreData.courseUnits) {
        const hasRelatedNode = coreData.paths.some(path => 
          path.nodes.some(node => node.id === unit.nodeId)
        )
        if (!hasRelatedNode) {
          warnings.push(`课程单元 "${unit.title}" 没有关联的路径节点`)
        }
      }

      // 检查时间戳
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      if (new Date(coreData.metadata.lastUpdated) < oneYearAgo) {
        warnings.push('数据超过一年未更新')
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      }
    } catch (error) {
      log('[CoreDataManager] Validate data failed:', error)
      return {
        isValid: false,
        issues: ['数据验证失败'],
        warnings: []
      }
    }
  }
}

// 导出单例实例
export const profileStorage = new ProfileStorageAdapter()
export const coreDataManager = new CoreDataManager(profileStorage) 