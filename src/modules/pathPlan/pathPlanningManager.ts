import { log, error } from '../../utils/logger'
import { PathPlanService } from './service'
import { PathGenerationConfig } from './types'
import { LearningPath } from '../coreData/types'
import { addCoreEvent } from '../coreData/service'

/**
 * 路径生成状态枚举
 */
export enum PathGenerationStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  COMPLETED = 'completed', 
  FAILED = 'failed',
  CACHED = 'cached'
}

/**
 * 路径生成任务接口
 */
export interface PathGenerationTask {
  goalId: string
  config: PathGenerationConfig
  status: PathGenerationStatus
  result?: LearningPath
  error?: string
  startTime?: number
  endTime?: number
  progress?: number // 0-100
  configHash?: string // 配置哈希，用于判断配置是否变化
}

/**
 * 路径缓存项
 */
export interface PathCacheItem {
  goalId: string
  config: PathGenerationConfig
  configHash: string
  path: LearningPath
  timestamp: string
  expirationTime: number // 缓存过期时间戳
  version: string // 路径版本号
  generationMetadata: {
    nodeCount: number
    totalHours: number
    difficulty: number
    hasPersonalization: boolean
  }
}

/**
 * 路径生成监听器接口
 */
export interface PathGenerationListener {
  onStatusChange?: (goalId: string, status: PathGenerationStatus, result?: LearningPath, error?: string) => void
  onProgressUpdate?: (goalId: string, progress: number, stage?: string) => void
  onCacheHit?: (goalId: string, path: LearningPath, metadata?: any) => void
  onGenerationStart?: (goalId: string, config: PathGenerationConfig) => void
  onGenerationComplete?: (goalId: string, path: LearningPath, timeTaken: number) => void
}

/**
 * 路径规划管理器
 * 提供异步路径生成、缓存管理、状态追踪等功能
 */
export class PathPlanningManager {
  private static instance: PathPlanningManager
  private pathPlanService: PathPlanService
  private cache: Map<string, PathCacheItem> = new Map()
  private activeTasks: Map<string, PathGenerationTask> = new Map()
  private listeners: PathGenerationListener[] = []
  private cacheExpiryTime = 60 * 60 * 1000 // 1小时缓存过期（路径生成比分析更耗时，缓存时间更长）
  private maxCacheSize = 30 // 最大缓存数量（路径体积更大，缓存数量相对较少）

  private constructor() {
    this.pathPlanService = new PathPlanService()
    this.loadCacheFromStorage()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): PathPlanningManager {
    if (!PathPlanningManager.instance) {
      PathPlanningManager.instance = new PathPlanningManager()
    }
    return PathPlanningManager.instance
  }

  /**
   * 添加路径生成监听器
   */
  public addListener(listener: PathGenerationListener): void {
    this.listeners.push(listener)
  }

  /**
   * 移除路径生成监听器
   */
  public removeListener(listener: PathGenerationListener): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 获取目标的路径生成状态
   */
  public getGenerationStatus(goalId: string, config?: PathGenerationConfig): PathGenerationStatus {
    const task = this.activeTasks.get(goalId)
    if (task) {
      // 如果配置发生变化，当前任务就不再有效
      if (config && this.generateConfigHash(config) !== task.configHash) {
        return PathGenerationStatus.IDLE
      }
      return task.status
    }

    if (config) {
      const cached = this.getCachedPath(goalId, config)
      if (cached) {
        return PathGenerationStatus.CACHED
      }
    }

    return PathGenerationStatus.IDLE
  }

  /**
   * 获取目标的路径生成结果（立即返回缓存或null）
   */
  public getGenerationResult(goalId: string, config?: PathGenerationConfig): LearningPath | null {
    // 先检查活跃任务
    const task = this.activeTasks.get(goalId)
    if (task && task.result && (!config || this.generateConfigHash(config) === task.configHash)) {
      return task.result
    }

    // 再检查缓存
    if (config) {
      const cached = this.getCachedPath(goalId, config)
      if (cached) {
        const cacheItem = this.findCacheItem(goalId, config)
        this.notifyListeners('onCacheHit', goalId, undefined, cached, undefined, cacheItem?.generationMetadata)
        return cached
      }
    }

    return null
  }

  /**
   * 异步开始路径生成
   */
  public async startGeneration(
    goalId: string, 
    config: PathGenerationConfig, 
    forceRefresh: boolean = false
  ): Promise<void> {
    log(`[PathPlanningManager] Starting path generation for goal: ${goalId}`)

    const configHash = this.generateConfigHash(config)

    // 检查是否已有相同配置的活跃任务
    const existingTask = this.activeTasks.get(goalId)
    if (existingTask && existingTask.configHash === configHash && !forceRefresh) {
      log(`[PathPlanningManager] Path generation already in progress for goal: ${goalId}`)
      return
    }

    // 检查缓存（如果不强制刷新）
    if (!forceRefresh) {
      const cached = this.getCachedPath(goalId, config)
      if (cached) {
        log(`[PathPlanningManager] Using cached path for goal: ${goalId}`)
        const cacheItem = this.findCacheItem(goalId, config)
        this.notifyListeners('onStatusChange', goalId, PathGenerationStatus.CACHED, cached)
        this.notifyListeners('onCacheHit', goalId, undefined, cached, undefined, cacheItem?.generationMetadata)
        return
      }
    }

    // 创建路径生成任务
    const task: PathGenerationTask = {
      goalId,
      config,
      configHash,
      status: PathGenerationStatus.GENERATING,
      startTime: Date.now(),
      progress: 0
    }

    this.activeTasks.set(goalId, task)
    this.notifyListeners('onStatusChange', goalId, PathGenerationStatus.GENERATING)
    this.notifyListeners('onGenerationStart', goalId, undefined, undefined, undefined, config)

    // 异步执行路径生成
    this.performGeneration(goalId, task).catch(err => {
      error(`[PathPlanningManager] Path generation failed for goal ${goalId}:`, err)
    })
  }

  /**
   * 停止路径生成
   */
  public stopGeneration(goalId: string): void {
    const task = this.activeTasks.get(goalId)
    if (task && task.status === PathGenerationStatus.GENERATING) {
      task.status = PathGenerationStatus.FAILED
      task.error = '用户取消生成'
      task.endTime = Date.now()
      this.notifyListeners('onStatusChange', goalId, PathGenerationStatus.FAILED, undefined, task.error)
      this.activeTasks.delete(goalId)
      
      // 记录事件
      addCoreEvent({
        type: 'path_generation_cancelled',
        details: {
          goalId,
          reason: 'user_cancelled',
          duration: task.endTime - (task.startTime || 0)
        }
      })
    }
  }

  /**
   * 清除目标的路径缓存
   */
  public clearPathCache(goalId: string, config?: PathGenerationConfig): void {
    if (config) {
      // 清除特定配置的缓存
      const configHash = this.generateConfigHash(config)
      for (const [key, item] of this.cache.entries()) {
        if (item.goalId === goalId && item.configHash === configHash) {
          this.cache.delete(key)
          break
        }
      }
    } else {
      // 清除该目标的所有缓存
      for (const [key, item] of this.cache.entries()) {
        if (item.goalId === goalId) {
          this.cache.delete(key)
        }
      }
    }
    
    this.activeTasks.delete(goalId)
    this.saveCacheToStorage()
    log(`[PathPlanningManager] Cleared cache for goal: ${goalId}`)
  }

  /**
   * 清除所有缓存
   */
  public clearAllCache(): void {
    this.cache.clear()
    this.activeTasks.clear()
    this.saveCacheToStorage()
    log(`[PathPlanningManager] Cleared all path generation cache`)
  }

  /**
   * 获取活跃的生成任务
   */
  public getActiveTasks(): PathGenerationTask[] {
    return Array.from(this.activeTasks.values())
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    totalCached: number
    activeGenerations: number
    cacheHitRate?: number
    oldestCache?: string
    newestCache?: string
    averageGenerationTime?: number
    totalCachedSize?: number
  } {
    const cached = Array.from(this.cache.values())
    
    return {
      totalCached: cached.length,
      activeGenerations: this.activeTasks.size,
      oldestCache: cached.length > 0 ? 
        cached.reduce((oldest, item) => 
          item.timestamp < oldest.timestamp ? item : oldest
        ).timestamp : undefined,
      newestCache: cached.length > 0 ? 
        cached.reduce((newest, item) => 
          item.timestamp > newest.timestamp ? item : newest
        ).timestamp : undefined,
      totalCachedSize: cached.reduce((total, item) => 
        total + JSON.stringify(item.path).length, 0
      )
    }
  }

  /**
   * 获取目标的所有缓存路径
   */
  public getCachedPathsForGoal(goalId: string): PathCacheItem[] {
    return Array.from(this.cache.values()).filter(item => item.goalId === goalId)
  }

  // ========== 私有方法 ==========

  /**
   * 执行路径生成
   */
  private async performGeneration(goalId: string, task: PathGenerationTask): Promise<void> {
    try {
      this.updateProgress(goalId, 10, '正在分析技能差距...')
      
      // 第一步：技能差距分析（如果需要）
      await new Promise(resolve => setTimeout(resolve, 500)) // 模拟分析时间
      this.updateProgress(goalId, 30, '正在生成节点结构...')
      
      // 第二步：生成学习路径
      const path = await this.pathPlanService.generateLearningPath(goalId, task.config)
      
      this.updateProgress(goalId, 80, '正在优化路径结构...')
      await new Promise(resolve => setTimeout(resolve, 300)) // 模拟优化时间
      
      this.updateProgress(goalId, 100, '路径生成完成')
      
      // 生成成功
      task.status = PathGenerationStatus.COMPLETED
      task.result = path
      task.endTime = Date.now()
      
      // 缓存结果
      this.cachePath(goalId, task.config, path)
      
      // 通知监听器
      this.notifyListeners('onStatusChange', goalId, PathGenerationStatus.COMPLETED, path)
      this.notifyListeners('onGenerationComplete', goalId, undefined, path, undefined, task.endTime - (task.startTime || 0))
      
      // 记录成功事件
      addCoreEvent({
        type: 'path_generation_completed',
        details: {
          goalId,
          pathId: path.id,
          nodeCount: path.nodes.length,
          totalHours: path.totalEstimatedHours,
          generationTime: task.endTime - (task.startTime || 0),
          configUsed: task.config
        }
      })
      
      log(`[PathPlanningManager] Path generation completed for goal: ${goalId}`)
      
    } catch (err) {
      // 生成失败
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      task.status = PathGenerationStatus.FAILED
      task.error = errorMessage
      task.endTime = Date.now()
      
      this.notifyListeners('onStatusChange', goalId, PathGenerationStatus.FAILED, undefined, errorMessage)
      
      // 记录失败事件
      addCoreEvent({
        type: 'path_generation_failed',
        details: {
          goalId,
          error: errorMessage,
          generationTime: task.endTime - (task.startTime || 0),
          configUsed: task.config
        }
      })
      
      error(`[PathPlanningManager] Path generation failed for goal ${goalId}:`, err)
    } finally {
      // 清理任务
      this.activeTasks.delete(goalId)
    }
  }

  /**
   * 更新生成进度
   */
  private updateProgress(goalId: string, progress: number, stage?: string): void {
    const task = this.activeTasks.get(goalId)
    if (task && task.status === PathGenerationStatus.GENERATING) {
      task.progress = Math.max(0, Math.min(100, progress))
      this.notifyListeners('onProgressUpdate', goalId, undefined, undefined, undefined, { progress: task.progress, stage })
    }
  }

  /**
   * 缓存路径
   */
  private cachePath(goalId: string, config: PathGenerationConfig, path: LearningPath): void {
    // 检查缓存大小，必要时清理
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCache()
    }

    const configHash = this.generateConfigHash(config)
    const cacheKey = `${goalId}_${configHash}`
    
    const cacheItem: PathCacheItem = {
      goalId,
      config,
      configHash,
      path,
      timestamp: new Date().toISOString(),
      expirationTime: Date.now() + this.cacheExpiryTime,
      version: this.generatePathVersion(path),
      generationMetadata: {
        nodeCount: path.nodes.length,
        totalHours: path.totalEstimatedHours,
        difficulty: path.nodes.length > 0 ? 
          Math.round(path.nodes.reduce((sum, node) => sum + node.difficulty, 0) / path.nodes.length) : 0,
        hasPersonalization: !!(path as any).metadata?.personalizationLevel
      }
    }

    this.cache.set(cacheKey, cacheItem)
    this.saveCacheToStorage()
    
    log(`[PathPlanningManager] Cached path for goal: ${goalId}, config hash: ${configHash}`)
  }

  /**
   * 获取缓存的路径
   */
  private getCachedPath(goalId: string, config: PathGenerationConfig): LearningPath | null {
    const configHash = this.generateConfigHash(config)
    const cacheKey = `${goalId}_${configHash}`
    const cached = this.cache.get(cacheKey)

    if (cached) {
      // 检查是否过期
      if (Date.now() > cached.expirationTime) {
        this.cache.delete(cacheKey)
        this.saveCacheToStorage()
        return null
      }

      log(`[PathPlanningManager] Cache hit for goal: ${goalId}, config hash: ${configHash}`)
      return cached.path
    }

    return null
  }

  /**
   * 查找缓存项
   */
  private findCacheItem(goalId: string, config: PathGenerationConfig): PathCacheItem | null {
    const configHash = this.generateConfigHash(config)
    const cacheKey = `${goalId}_${configHash}`
    return this.cache.get(cacheKey) || null
  }

  /**
   * 清理最旧的缓存
   */
  private evictOldestCache(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      const itemTime = new Date(item.timestamp).getTime()
      if (itemTime < oldestTime) {
        oldestTime = itemTime
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      log(`[PathPlanningManager] Evicted oldest cache: ${oldestKey}`)
    }
  }

  /**
   * 生成配置哈希
   */
  private generateConfigHash(config: PathGenerationConfig): string {
    const configStr = JSON.stringify({
      learningStyle: config.learningStyle,
      timePreference: config.timePreference,
      difficultyProgression: config.difficultyProgression,
      includeProjects: config.includeProjects,
      includeMilestones: config.includeMilestones
    })
    
    // 简单哈希算法
    let hash = 0
    for (let i = 0; i < configStr.length; i++) {
      const char = configStr.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36)
  }

  /**
   * 生成路径版本号
   */
  private generatePathVersion(path: LearningPath): string {
    const versionData = {
      nodeCount: path.nodes.length,
      totalHours: path.totalEstimatedHours,
      hasMetadata: !!(path as any).metadata,
      timestamp: Date.now()
    }
    
    // 使用浏览器兼容的方式生成base64，而不是Node.js的Buffer
    try {
      return btoa(JSON.stringify(versionData)).slice(0, 8)
    } catch (error) {
      // 如果btoa失败，使用简单的哈希算法作为后备
      const versionStr = JSON.stringify(versionData)
      let hash = 0
      for (let i = 0; i < versionStr.length; i++) {
        const char = versionStr.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return Math.abs(hash).toString(36).slice(0, 8)
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(
    method: keyof PathGenerationListener,
    goalId: string,
    status?: PathGenerationStatus,
    result?: LearningPath,
    errorMsg?: string,
    extra?: any
  ): void {
    this.listeners.forEach(listener => {
      try {
        if (listener[method]) {
          switch (method) {
            case 'onStatusChange':
              listener.onStatusChange?.(goalId, status!, result, errorMsg)
              break
            case 'onProgressUpdate':
              if (extra && typeof extra === 'object') {
                listener.onProgressUpdate?.(goalId, extra.progress || 0, extra.stage)
              } else {
                listener.onProgressUpdate?.(goalId, extra || 0, errorMsg)
              }
              break
            case 'onCacheHit':
              listener.onCacheHit?.(goalId, result!, extra) // extra = metadata
              break
            case 'onGenerationStart':
              listener.onGenerationStart?.(goalId, extra) // extra = config
              break
            case 'onGenerationComplete':
              listener.onGenerationComplete?.(goalId, result!, extra) // extra = timeTaken
              break
          }
        }
      } catch (err) {
        error(`[PathPlanningManager] Error in listener ${method}:`, err)
      }
    })
  }

  /**
   * 从本地存储加载缓存
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('pathPlanningCache')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          parsed.forEach((item: PathCacheItem) => {
            // 检查是否过期
            if (Date.now() <= item.expirationTime) {
              const configHash = this.generateConfigHash(item.config)
              const cacheKey = `${item.goalId}_${configHash}`
              this.cache.set(cacheKey, item)
            }
          })
          log(`[PathPlanningManager] Loaded ${this.cache.size} cached paths from storage`)
        }
      }
    } catch (err) {
      error('[PathPlanningManager] Failed to load cache from storage:', err)
    }
  }

  /**
   * 保存缓存到本地存储
   */
  private saveCacheToStorage(): void {
    try {
      const cacheArray = Array.from(this.cache.values())
      localStorage.setItem('pathPlanningCache', JSON.stringify(cacheArray))
    } catch (err) {
      error('[PathPlanningManager] Failed to save cache to storage:', err)
    }
  }
}

// 导出单例实例
export const pathPlanningManager = PathPlanningManager.getInstance() 