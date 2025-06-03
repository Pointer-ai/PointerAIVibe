import { log, error } from '../../utils/logger'
import { PathPlanService } from './service'
import { SkillGapAnalysis } from './types'
import { addCoreEvent } from '../coreData/service'

/**
 * 分析状态枚举
 */
export enum AnalysisStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CACHED = 'cached'
}

/**
 * 分析任务接口
 */
export interface AnalysisTask {
  goalId: string
  status: AnalysisStatus
  result?: SkillGapAnalysis
  error?: string
  startTime?: number
  endTime?: number
  progress?: number // 0-100
}

/**
 * 分析缓存项
 */
export interface AnalysisCacheItem {
  goalId: string
  analysis: SkillGapAnalysis
  timestamp: string
  expirationTime: number // 缓存过期时间戳
  version: string // 分析版本号，用于判断是否需要重新分析
}

/**
 * 分析监听器接口
 */
export interface AnalysisListener {
  onStatusChange?: (goalId: string, status: AnalysisStatus, result?: SkillGapAnalysis, error?: string) => void
  onProgressUpdate?: (goalId: string, progress: number) => void
  onCacheHit?: (goalId: string, analysis: SkillGapAnalysis) => void
}

/**
 * 技能差距分析管理器
 * 提供异步分析、缓存管理、状态追踪等功能
 */
export class SkillGapAnalysisManager {
  private static instance: SkillGapAnalysisManager
  private pathPlanService: PathPlanService
  private cache: Map<string, AnalysisCacheItem> = new Map()
  private activeTasks: Map<string, AnalysisTask> = new Map()
  private listeners: AnalysisListener[] = []
  private cacheExpiryTime = 30 * 60 * 1000 // 30分钟缓存过期
  private maxCacheSize = 50 // 最大缓存数量

  private constructor() {
    this.pathPlanService = new PathPlanService()
    this.loadCacheFromStorage()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SkillGapAnalysisManager {
    if (!SkillGapAnalysisManager.instance) {
      SkillGapAnalysisManager.instance = new SkillGapAnalysisManager()
    }
    return SkillGapAnalysisManager.instance
  }

  /**
   * 添加分析监听器
   */
  public addListener(listener: AnalysisListener): void {
    this.listeners.push(listener)
  }

  /**
   * 移除分析监听器
   */
  public removeListener(listener: AnalysisListener): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 获取目标的分析状态
   */
  public getAnalysisStatus(goalId: string): AnalysisStatus {
    const task = this.activeTasks.get(goalId)
    if (task) {
      return task.status
    }

    const cached = this.getCachedAnalysis(goalId)
    if (cached) {
      return AnalysisStatus.CACHED
    }

    return AnalysisStatus.IDLE
  }

  /**
   * 获取目标的分析结果（立即返回缓存或null）
   */
  public getAnalysisResult(goalId: string): SkillGapAnalysis | null {
    // 先检查活跃任务
    const task = this.activeTasks.get(goalId)
    if (task && task.result) {
      return task.result
    }

    // 再检查缓存
    const cached = this.getCachedAnalysis(goalId)
    if (cached) {
      this.notifyListeners('onCacheHit', goalId, undefined, cached)
      return cached
    }

    return null
  }

  /**
   * 异步开始分析
   */
  public async startAnalysis(goalId: string, forceRefresh: boolean = false): Promise<void> {
    log(`[SkillGapAnalysisManager] Starting analysis for goal: ${goalId}`)

    // 检查是否已有活跃任务
    if (this.activeTasks.has(goalId) && !forceRefresh) {
      log(`[SkillGapAnalysisManager] Analysis already in progress for goal: ${goalId}`)
      return
    }

    // 检查缓存（如果不强制刷新）
    if (!forceRefresh) {
      const cached = this.getCachedAnalysis(goalId)
      if (cached) {
        log(`[SkillGapAnalysisManager] Using cached analysis for goal: ${goalId}`)
        this.notifyListeners('onStatusChange', goalId, AnalysisStatus.CACHED, cached)
        this.notifyListeners('onCacheHit', goalId, undefined, cached)
        return
      }
    }

    // 创建分析任务
    const task: AnalysisTask = {
      goalId,
      status: AnalysisStatus.ANALYZING,
      startTime: Date.now(),
      progress: 0
    }

    this.activeTasks.set(goalId, task)
    this.notifyListeners('onStatusChange', goalId, AnalysisStatus.ANALYZING)

    // 异步执行分析
    this.performAnalysis(goalId, task).catch(err => {
      error(`[SkillGapAnalysisManager] Analysis failed for goal ${goalId}:`, err)
    })
  }

  /**
   * 停止分析
   */
  public stopAnalysis(goalId: string): void {
    const task = this.activeTasks.get(goalId)
    if (task && task.status === AnalysisStatus.ANALYZING) {
      task.status = AnalysisStatus.FAILED
      task.error = '用户取消分析'
      task.endTime = Date.now()
      this.notifyListeners('onStatusChange', goalId, AnalysisStatus.FAILED, undefined, task.error)
      this.activeTasks.delete(goalId)
    }
  }

  /**
   * 清除目标的分析缓存
   */
  public clearAnalysisCache(goalId: string): void {
    this.cache.delete(goalId)
    this.activeTasks.delete(goalId)
    this.saveCacheToStorage()
    log(`[SkillGapAnalysisManager] Cleared cache for goal: ${goalId}`)
  }

  /**
   * 清除所有缓存
   */
  public clearAllCache(): void {
    this.cache.clear()
    this.activeTasks.clear()
    this.saveCacheToStorage()
    log(`[SkillGapAnalysisManager] Cleared all analysis cache`)
  }

  /**
   * 获取所有活跃任务
   */
  public getActiveTasks(): AnalysisTask[] {
    return Array.from(this.activeTasks.values())
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    totalCached: number
    activeAnalyses: number
    cacheHitRate?: number
    oldestCache?: string
    newestCache?: string
  } {
    const cached = Array.from(this.cache.values())
    const oldestCache = cached.length > 0 ? 
      Math.min(...cached.map(c => new Date(c.timestamp).getTime())) : undefined
    const newestCache = cached.length > 0 ? 
      Math.max(...cached.map(c => new Date(c.timestamp).getTime())) : undefined

    return {
      totalCached: this.cache.size,
      activeAnalyses: this.activeTasks.size,
      oldestCache: oldestCache ? new Date(oldestCache).toISOString() : undefined,
      newestCache: newestCache ? new Date(newestCache).toISOString() : undefined
    }
  }

  /**
   * 执行分析的私有方法
   */
  private async performAnalysis(goalId: string, task: AnalysisTask): Promise<void> {
    try {
      // 模拟进度更新
      this.updateProgress(goalId, 10)

      // 实际分析
      const analysis = await this.pathPlanService.analyzeSkillGap(goalId)
      
      this.updateProgress(goalId, 90)

      // 分析完成
      task.status = AnalysisStatus.COMPLETED
      task.result = analysis
      task.endTime = Date.now()
      task.progress = 100

      // 缓存结果
      this.cacheAnalysis(goalId, analysis)

      // 通知监听器
      this.notifyListeners('onStatusChange', goalId, AnalysisStatus.COMPLETED, analysis)
      this.updateProgress(goalId, 100)

      // 记录事件
      addCoreEvent({
        type: 'skill_gap_analysis_completed',
        data: {
          goalId,
          duration: task.endTime - (task.startTime || 0),
          skillGapsCount: analysis.skillGaps?.length || 0,
          confidence: analysis.analysisConfidence || 0,
          cached: false
        }
      })

      log(`[SkillGapAnalysisManager] Analysis completed for goal: ${goalId}`)

    } catch (err) {
      // 分析失败
      task.status = AnalysisStatus.FAILED
      task.error = err instanceof Error ? err.message : '未知错误'
      task.endTime = Date.now()

      this.notifyListeners('onStatusChange', goalId, AnalysisStatus.FAILED, undefined, task.error)

      error(`[SkillGapAnalysisManager] Analysis failed for goal ${goalId}:`, err)
    } finally {
      // 清理任务
      setTimeout(() => {
        this.activeTasks.delete(goalId)
      }, 5000) // 5秒后清理任务记录
    }
  }

  /**
   * 更新分析进度并通知监听器
   */
  private updateProgress(goalId: string, progress: number): void {
    const task = this.activeTasks.get(goalId)
    if (task) {
      task.progress = progress
      // 单独调用进度更新通知
      this.listeners.forEach(listener => {
        try {
          if (listener.onProgressUpdate) {
            listener.onProgressUpdate(goalId, progress)
          }
        } catch (err) {
          error(`[SkillGapAnalysisManager] Progress listener error:`, err)
        }
      })
    }
  }

  /**
   * 缓存分析结果
   */
  private cacheAnalysis(goalId: string, analysis: SkillGapAnalysis): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCache()
    }

    const cacheItem: AnalysisCacheItem = {
      goalId,
      analysis: {
        ...analysis,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      expirationTime: Date.now() + this.cacheExpiryTime,
      version: this.generateAnalysisVersion(analysis)
    }

    this.cache.set(goalId, cacheItem)
    this.saveCacheToStorage()

    log(`[SkillGapAnalysisManager] Cached analysis for goal: ${goalId}`)
  }

  /**
   * 获取缓存的分析结果
   */
  private getCachedAnalysis(goalId: string): SkillGapAnalysis | null {
    const cacheItem = this.cache.get(goalId)
    
    if (!cacheItem) {
      return null
    }

    // 检查是否过期
    if (Date.now() > cacheItem.expirationTime) {
      this.cache.delete(goalId)
      this.saveCacheToStorage()
      return null
    }

    return cacheItem.analysis
  }

  /**
   * 驱逐最旧的缓存项
   */
  private evictOldestCache(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      const time = new Date(item.timestamp).getTime()
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      log(`[SkillGapAnalysisManager] Evicted oldest cache for goal: ${oldestKey}`)
    }
  }

  /**
   * 生成分析版本号
   */
  private generateAnalysisVersion(analysis: SkillGapAnalysis): string {
    // 基于分析内容生成版本号
    const content = JSON.stringify({
      skillGapsCount: analysis.skillGaps?.length || 0,
      confidence: analysis.analysisConfidence || 0,
      hasAbilityData: analysis.hasAbilityData
    })
    
    // 使用简单的hash函数，避免btoa可能的问题
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32bit整数
    }
    
    return Math.abs(hash).toString(16).slice(0, 8)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(
    method: keyof AnalysisListener, 
    goalId: string, 
    status?: AnalysisStatus, 
    result?: SkillGapAnalysis, 
    errorMsg?: string
  ): void {
    this.listeners.forEach(listener => {
      try {
        if (method === 'onStatusChange' && listener.onStatusChange) {
          listener.onStatusChange(goalId, status!, result, errorMsg)
        } else if (method === 'onProgressUpdate' && listener.onProgressUpdate) {
          // 对于进度更新，通过task获取进度
          const task = this.activeTasks.get(goalId)
          if (task && typeof task.progress === 'number') {
            listener.onProgressUpdate(goalId, task.progress)
          }
        } else if (method === 'onCacheHit' && listener.onCacheHit) {
          listener.onCacheHit(goalId, result!)
        }
      } catch (err) {
        error(`[SkillGapAnalysisManager] Listener error:`, err)
      }
    })
  }

  /**
   * 从本地存储加载缓存
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('skillGapAnalysisCache')
      if (stored) {
        const data = JSON.parse(stored)
        data.forEach((item: AnalysisCacheItem) => {
          // 检查是否过期
          if (Date.now() <= item.expirationTime) {
            this.cache.set(item.goalId, item)
          }
        })
        log(`[SkillGapAnalysisManager] Loaded ${this.cache.size} cached analyses from storage`)
      }
    } catch (err) {
      error(`[SkillGapAnalysisManager] Failed to load cache from storage:`, err)
    }
  }

  /**
   * 保存缓存到本地存储
   */
  private saveCacheToStorage(): void {
    try {
      const data = Array.from(this.cache.values())
      localStorage.setItem('skillGapAnalysisCache', JSON.stringify(data))
    } catch (err) {
      error(`[SkillGapAnalysisManager] Failed to save cache to storage:`, err)
    }
  }
}

// 导出单例实例
export const skillGapAnalysisManager = SkillGapAnalysisManager.getInstance() 