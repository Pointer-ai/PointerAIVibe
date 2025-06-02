/**
 * Learning API 数据管理器统一入口
 * 提供所有数据操作的统一接口
 */

import { log } from '../../utils/logger'
import { coreDataManager, profileStorage } from './storage'
import { goalDataHandler } from './goals'
import type { 
  StorageAdapter, 
  CoreData, 
  LearningGoal, 
  LearningPath, 
  CourseUnit,
  AbilityProfile,
  SystemStatus,
  SyncResult
} from './types'

/**
 * 数据管理器主类
 * 统一管理所有数据操作，提供简洁的API接口
 */
export class DataManager {
  private storage: StorageAdapter
  private coreData: typeof coreDataManager

  // 各种数据处理器
  public goals: typeof goalDataHandler
  // public paths: PathDataHandler (待实现)
  // public content: ContentDataHandler (待实现)
  // public assessment: AssessmentDataHandler (待实现)
  // public profile: ProfileDataHandler (待实现)

  constructor() {
    this.storage = profileStorage
    this.coreData = coreDataManager
    this.goals = goalDataHandler

    log('[DataManager] Initialized with all data handlers')
  }

  // ========== 核心数据操作 ==========

  /**
   * 获取核心数据
   */
  async getCoreData(): Promise<CoreData> {
    return await this.coreData.getCoreData()
  }

  /**
   * 保存核心数据
   */
  async saveCoreData(data: CoreData): Promise<void> {
    await this.coreData.saveCoreData(data)
  }

  /**
   * 更新核心数据
   */
  async updateCoreData(updates: Partial<CoreData>): Promise<CoreData> {
    return await this.coreData.updateCoreData(updates)
  }

  /**
   * 添加事件记录
   */
  async addEvent(type: string, data: any, metadata?: any): Promise<void> {
    await this.coreData.addEvent({
      type,
      timestamp: new Date().toISOString(),
      data,
      metadata
    })
  }

  /**
   * 获取最近事件
   */
  async getRecentEvents(limit = 50): Promise<any[]> {
    return await this.coreData.getRecentEvents(limit)
  }

  // ========== 学习目标快捷操作 ==========

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<LearningGoal[]> {
    return await this.goals.getAll()
  }

  /**
   * 获取激活的目标
   */
  async getActiveGoals(): Promise<LearningGoal[]> {
    return await this.goals.getByStatus('active')
  }

  /**
   * 创建目标
   */
  async createGoal(data: import('./types').CreateGoalData): Promise<LearningGoal> {
    return await this.goals.create(data)
  }

  /**
   * 更新目标
   */
  async updateGoal(id: string, updates: Partial<LearningGoal>): Promise<LearningGoal> {
    return await this.goals.update(id, updates)
  }

  /**
   * 删除目标
   */
  async deleteGoal(id: string): Promise<boolean> {
    return await this.goals.delete(id)
  }

  // ========== 学习路径操作 (临时实现) ==========

  /**
   * 获取所有路径
   */
  async getAllPaths(): Promise<LearningPath[]> {
    try {
      const coreData = await this.getCoreData()
      return coreData.paths
    } catch (error) {
      log('[DataManager] Get all paths failed:', error)
      return []
    }
  }

  /**
   * 根据目标ID获取路径
   */
  async getPathsByGoalId(goalId: string): Promise<LearningPath[]> {
    try {
      const paths = await this.getAllPaths()
      return paths.filter(path => path.goalId === goalId)
    } catch (error) {
      log('[DataManager] Get paths by goal id failed:', error)
      return []
    }
  }

  /**
   * 创建学习路径
   */
  async createPath(data: import('./types').CreatePathData): Promise<LearningPath> {
    try {
      const coreData = await this.getCoreData()
      
      const newPath: LearningPath = {
        id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        goalId: data.goalId,
        title: data.title,
        description: data.description,
        totalEstimatedHours: 0,
        nodes: [],
        dependencies: [],
        milestones: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        status: 'draft'
      }

      coreData.paths.push(newPath)
      await this.saveCoreData(coreData)

      await this.addEvent('path_created', {
        pathId: newPath.id,
        goalId: data.goalId,
        title: data.title
      })

      log(`[DataManager] Path created: ${newPath.title}`)
      return newPath
    } catch (error) {
      log('[DataManager] Create path failed:', error)
      throw error
    }
  }

  /**
   * 更新学习路径
   */
  async updatePath(id: string, updates: Partial<LearningPath>): Promise<LearningPath> {
    try {
      const coreData = await this.getCoreData()
      const pathIndex = coreData.paths.findIndex(p => p.id === id)
      
      if (pathIndex === -1) {
        throw new Error(`路径不存在: ${id}`)
      }

      const updatedPath: LearningPath = {
        ...coreData.paths[pathIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      coreData.paths[pathIndex] = updatedPath
      await this.saveCoreData(coreData)

      await this.addEvent('path_updated', {
        pathId: id,
        title: updatedPath.title,
        updates: Object.keys(updates)
      })

      log(`[DataManager] Path updated: ${updatedPath.title}`)
      return updatedPath
    } catch (error) {
      log('[DataManager] Update path failed:', error)
      throw error
    }
  }

  /**
   * 删除学习路径
   */
  async deletePath(id: string): Promise<boolean> {
    try {
      const coreData = await this.getCoreData()
      const pathIndex = coreData.paths.findIndex(p => p.id === id)
      
      if (pathIndex === -1) {
        return false
      }

      const path = coreData.paths[pathIndex]
      
      // 删除关联的课程单元
      const relatedUnits = coreData.courseUnits.filter(u => 
        path.nodes.some(node => node.id === u.nodeId)
      )
      coreData.courseUnits = coreData.courseUnits.filter(u => 
        !relatedUnits.some(ru => ru.id === u.id)
      )
      
      // 删除路径
      coreData.paths.splice(pathIndex, 1)
      await this.saveCoreData(coreData)

      await this.addEvent('path_deleted', {
        pathId: id,
        title: path.title,
        goalId: path.goalId,
        relatedUnitsDeleted: relatedUnits.length
      })

      log(`[DataManager] Path deleted: ${path.title}`)
      return true
    } catch (error) {
      log('[DataManager] Delete path failed:', error)
      return false
    }
  }

  // ========== 课程内容操作 (临时实现) ==========

  /**
   * 获取所有课程内容
   */
  async getAllCourseUnits(): Promise<CourseUnit[]> {
    try {
      const coreData = await this.getCoreData()
      return coreData.courseUnits
    } catch (error) {
      log('[DataManager] Get all course units failed:', error)
      return []
    }
  }

  /**
   * 根据节点ID获取课程内容
   */
  async getCourseUnitsByNodeId(nodeId: string): Promise<CourseUnit[]> {
    try {
      const units = await this.getAllCourseUnits()
      return units.filter(unit => unit.nodeId === nodeId)
    } catch (error) {
      log('[DataManager] Get course units by node id failed:', error)
      return []
    }
  }

  // ========== 能力评估操作 (临时实现) ==========

  /**
   * 获取能力档案
   */
  async getAbilityProfile(): Promise<AbilityProfile | null> {
    try {
      const coreData = await this.getCoreData()
      return coreData.abilityProfile || null
    } catch (error) {
      log('[DataManager] Get ability profile failed:', error)
      return null
    }
  }

  /**
   * 更新能力档案
   */
  async updateAbilityProfile(profile: AbilityProfile): Promise<void> {
    try {
      await this.updateCoreData({ abilityProfile: profile })
      await this.addEvent('ability_profile_updated', {
        profileId: profile.id,
        overallScore: profile.overallScore,
        confidence: profile.confidence
      })
      log('[DataManager] Ability profile updated')
    } catch (error) {
      log('[DataManager] Update ability profile failed:', error)
      throw error
    }
  }

  // ========== 系统状态和统计 ==========

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const coreData = await this.getCoreData()
      const abilityProfile = coreData.abilityProfile
      
      const activeGoals = coreData.goals.filter(g => g.status === 'active')
      const activePaths = coreData.paths.filter(p => p.status === 'active')
      const allNodes = activePaths.flatMap(p => p.nodes)
      const completedNodes = allNodes.filter(n => n.status === 'completed')

      // 确定当前阶段
      let currentPhase: SystemStatus['currentPhase'] = 'assessment'
      if (abilityProfile && activeGoals.length === 0) {
        currentPhase = 'goal_setting'
      } else if (activeGoals.length > 0 && activePaths.length === 0) {
        currentPhase = 'path_planning'
      } else if (activePaths.length > 0) {
        const hasInProgress = allNodes.some(n => n.status === 'in_progress')
        currentPhase = hasInProgress ? 'learning' : 'review'
      }

      const status: SystemStatus = {
        setupComplete: !!(abilityProfile && activeGoals.length > 0 && activePaths.length > 0),
        currentPhase,
        progress: {
          hasAbilityProfile: !!abilityProfile,
          activeGoals: activeGoals.length,
          activePaths: activePaths.length,
          completedNodes: completedNodes.length,
          totalNodes: allNodes.length,
          overallProgress: allNodes.length > 0 ? (completedNodes.length / allNodes.length) * 100 : 0
        },
        recommendations: this.generateRecommendations(coreData),
        nextActions: this.generateNextActions(coreData),
        systemHealth: {
          dataIntegrity: true, // TODO: 实现数据完整性检查
          lastSyncTime: new Date().toISOString(),
          coreDataSize: coreData.goals.length + coreData.paths.length + coreData.courseUnits.length,
          missingData: this.identifyMissingData(coreData)
        }
      }

      return status
    } catch (error) {
      log('[DataManager] Get system status failed:', error)
      throw error
    }
  }

  /**
   * 生成推荐
   */
  private generateRecommendations(coreData: CoreData): string[] {
    const recommendations: string[] = []
    
    if (!coreData.abilityProfile) {
      recommendations.push('完成能力评估以获得个性化学习建议')
    }
    
    const activeGoals = coreData.goals.filter(g => g.status === 'active')
    if (activeGoals.length === 0) {
      recommendations.push('设定学习目标开始你的学习之旅')
    }
    
    const activePaths = coreData.paths.filter(p => p.status === 'active')
    if (activeGoals.length > 0 && activePaths.length === 0) {
      recommendations.push('为学习目标生成详细的学习路径')
    }
    
    return recommendations.slice(0, 3) // 限制推荐数量
  }

  /**
   * 生成下一步行动
   */
  private generateNextActions(coreData: CoreData): string[] {
    const actions: string[] = []
    
    if (!coreData.abilityProfile) {
      actions.push('进行能力评估')
    } else if (coreData.goals.length === 0) {
      actions.push('创建第一个学习目标')
    } else if (coreData.paths.length === 0) {
      actions.push('生成学习路径')
    } else {
      actions.push('继续学习进度')
    }
    
    return actions
  }

  /**
   * 识别缺失数据
   */
  private identifyMissingData(coreData: CoreData): string[] {
    const missing: string[] = []
    
    if (!coreData.abilityProfile) missing.push('ability_profile')
    if (coreData.goals.length === 0) missing.push('learning_goals')
    if (coreData.paths.length === 0) missing.push('learning_paths')
    if (coreData.courseUnits.length === 0) missing.push('course_units')
    
    return missing
  }

  // ========== 数据同步和验证 ==========

  /**
   * 验证数据完整性
   */
  async validateData(): Promise<{
    isValid: boolean
    issues: string[]
    warnings: string[]
  }> {
    return await this.coreData.validateData()
  }

  /**
   * 获取数据统计
   */
  async getDataStats(): Promise<any> {
    const coreStats = await this.coreData.getStats()
    const goalStats = await this.goals.getStats()
    
    return {
      core: coreStats,
      goals: goalStats,
      // paths: pathStats, (待实现)
      // content: contentStats, (待实现)
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.coreData.clearCache()
    log('[DataManager] Cache cleared')
  }

  /**
   * 强制同步
   */
  async forceSync(): Promise<SyncResult> {
    try {
      const startTime = new Date().toISOString()
      
      // 清除缓存强制重新加载
      this.clearCache()
      
      // 验证数据
      const validation = await this.validateData()
      
      // 重新保存数据确保一致性
      const coreData = await this.getCoreData()
      await this.saveCoreData(coreData)
      
      const result: SyncResult = {
        success: validation.isValid,
        syncedItems: ['coreData', 'goals', 'paths', 'courseUnits'],
        errors: validation.issues,
        timestamp: startTime
      }
      
      await this.addEvent('data_sync_completed', result)
      
      log('[DataManager] Force sync completed:', result)
      return result
    } catch (error) {
      log('[DataManager] Force sync failed:', error)
      return {
        success: false,
        syncedItems: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString()
      }
    }
  }
}

// 导出单例实例
export const dataManager = new DataManager()

// 导出类型和处理器供直接使用
export { goalDataHandler } from './goals'
export { coreDataManager, profileStorage } from './storage'
export * from './types' 