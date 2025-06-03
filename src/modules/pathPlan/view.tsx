import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { log } from '../../utils/logger'
import { PathPlanService } from './service'
import { PathPlanState, SkillGapAnalysis, PathGenerationConfig } from './types'
import { getLearningGoals, getLearningPaths, updateLearningGoal, getPathsByGoal, agentToolExecutor } from '../coreData'
import { getCurrentAssessment } from '../abilityAssess/service'
import { LearningGoal, LearningPath } from '../coreData/types'
import { 
  skillGapAnalysisManager, 
  AnalysisStatus, 
  AnalysisListener 
} from './skillGapAnalysisManager'
import {
  pathPlanningManager,
  PathGenerationStatus,
  PathGenerationListener,
  PathGenerationTask,
  PathCacheItem
} from './pathPlanningManager'

const pathPlanService = new PathPlanService()

// 分析状态显示文本映射
const analysisStatusText = {
  [AnalysisStatus.IDLE]: '待分析',
  [AnalysisStatus.ANALYZING]: '分析中...',
  [AnalysisStatus.COMPLETED]: '分析完成',
  [AnalysisStatus.FAILED]: '分析失败',
  [AnalysisStatus.CACHED]: '已缓存'
}

// 分析状态颜色映射
const analysisStatusColor = {
  [AnalysisStatus.IDLE]: '#6b7280',
  [AnalysisStatus.ANALYZING]: '#3b82f6',
  [AnalysisStatus.COMPLETED]: '#10b981',
  [AnalysisStatus.FAILED]: '#dc2626',
  [AnalysisStatus.CACHED]: '#8b5cf6'
}

// 路径生成状态显示文本映射
const generationStatusText = {
  [PathGenerationStatus.IDLE]: '待生成',
  [PathGenerationStatus.GENERATING]: '生成中...',
  [PathGenerationStatus.COMPLETED]: '生成完成',
  [PathGenerationStatus.FAILED]: '生成失败',
  [PathGenerationStatus.CACHED]: '已缓存'
}

// 路径生成状态颜色映射
const generationStatusColor = {
  [PathGenerationStatus.IDLE]: '#6b7280',
  [PathGenerationStatus.GENERATING]: '#3b82f6',
  [PathGenerationStatus.COMPLETED]: '#10b981',
  [PathGenerationStatus.FAILED]: '#dc2626',
  [PathGenerationStatus.CACHED]: '#8b5cf6'
}

export const PathPlanView = () => {
  log('[pathPlan] View loaded')
  
  const [state, setState] = useState<PathPlanState>({
    currentStep: 'analysis',
    selectedGoalId: null,
    skillGapAnalysis: null,
    generatedPath: null,
    isProcessing: false
  })
  
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [selectedGoalPaths, setSelectedGoalPaths] = useState<LearningPath[]>([])
  const [config, setConfig] = useState<PathGenerationConfig>({
    learningStyle: 'balanced',
    timePreference: 'moderate',
    difficultyProgression: 'linear',
    includeProjects: true,
    includeMilestones: true
  })
  const [message, setMessage] = useState<string>('')
  
  // 新增：分析状态管理
  const [analysisStates, setAnalysisStates] = useState<Map<string, {
    status: AnalysisStatus
    progress?: number
    error?: string
    result?: SkillGapAnalysis
  }>>(new Map())

  // 新增：路径生成状态管理
  const [generationStates, setGenerationStates] = useState<Map<string, {
    status: PathGenerationStatus
    progress?: number
    stage?: string
    error?: string
    result?: LearningPath
    configHash?: string
  }>>(new Map())

  // 更新所有目标的分析状态
  const updateAllAnalysisStates = useCallback((goalList: LearningGoal[]) => {
    const newStates = new Map()
    
    goalList.forEach(goal => {
      const status = skillGapAnalysisManager.getAnalysisStatus(goal.id)
      const result = skillGapAnalysisManager.getAnalysisResult(goal.id)
      
      newStates.set(goal.id, {
        status,
        result,
        progress: status === AnalysisStatus.ANALYZING ? 0 : undefined
      })
    })
    
    setAnalysisStates(newStates)
  }, [])

  // 更新所有目标的生成状态
  const updateAllGenerationStates = useCallback((goalList: LearningGoal[]) => {
    const newStates = new Map()
    
    goalList.forEach(goal => {
      const status = pathPlanningManager.getGenerationStatus(goal.id, config)
      const result = pathPlanningManager.getGenerationResult(goal.id, config)
      
      newStates.set(goal.id, {
        status,
        result,
        progress: status === PathGenerationStatus.GENERATING ? 0 : undefined
      })
    })
    
    setGenerationStates(newStates)
  }, [config]) // 只依赖config，避免频繁重创建

  // 刷新数据
  const refreshData = useCallback(() => {
    const allGoals = getLearningGoals()
    const allPaths = getLearningPaths()
    setGoals(allGoals)
    setPaths(allPaths)
    
    // 更新选中目标的关联路径
    setState(prev => {
      if (prev.selectedGoalId) {
        const goalPaths = getPathsByGoal(prev.selectedGoalId)
        setSelectedGoalPaths(goalPaths)
      }
      return prev
    })
    
    // 更新所有目标的分析状态
    updateAllAnalysisStates(allGoals)
    // 更新所有目标的生成状态
    updateAllGenerationStates(allGoals)
  }, [updateAllAnalysisStates, updateAllGenerationStates])

  // 分析监听器
  const analysisListener = useMemo<AnalysisListener>(() => ({
    onStatusChange: (goalId: string, status: AnalysisStatus, result?: SkillGapAnalysis, error?: string) => {
      log(`[PathPlan] Analysis status changed for ${goalId}: ${status}`)
      
      setAnalysisStates(prev => {
        const newStates = new Map(prev)
        newStates.set(goalId, {
          ...newStates.get(goalId),
          status,
          result,
          error
        })
        return newStates
      })
      
      // 如果是当前选中的目标，更新主状态
      setState(prev => {
        if (goalId !== prev.selectedGoalId) return prev
        
        if (status === AnalysisStatus.COMPLETED && result) {
          setMessage('✅ 技能差距分析完成！')
          return {
            ...prev,
            skillGapAnalysis: result,
            currentStep: 'generation',
            isProcessing: false
          }
        } else if (status === AnalysisStatus.FAILED) {
          setMessage(`❌ 分析失败: ${error || '未知错误'}`)
          return { ...prev, isProcessing: false }
        } else if (status === AnalysisStatus.CACHED && result) {
          setMessage('✅ 使用缓存的分析结果！')
          return {
            ...prev,
            skillGapAnalysis: result,
            currentStep: 'generation',
            isProcessing: false
          }
        }
        return prev
      })
    },
    
    onProgressUpdate: (goalId: string, progress: number) => {
      setAnalysisStates(prev => {
        const newStates = new Map(prev)
        const current = newStates.get(goalId)
        if (current) {
          newStates.set(goalId, { ...current, progress })
        }
        return newStates
      })
    },
    
    onCacheHit: (goalId: string, analysis: SkillGapAnalysis) => {
      log(`[PathPlan] Cache hit for goal: ${goalId}`)
      // 使用函数形式避免闭包问题
      setGoals(currentGoals => {
        const goal = currentGoals.find(g => g.id === goalId)
        setMessage(`💾 使用了目标"${goal?.title}"的缓存分析结果`)
        return currentGoals
      })
    }
  }), []) // 空依赖数组，避免频繁重创建

  // 路径生成监听器
  const pathGenerationListener = useMemo<PathGenerationListener>(() => ({
    onStatusChange: (goalId: string, status: PathGenerationStatus, result?: LearningPath, error?: string) => {
      log(`[PathPlan] Path generation status changed for ${goalId}: ${status}`)
      
      setGenerationStates(prev => {
        const newStates = new Map(prev)
        newStates.set(goalId, {
          ...newStates.get(goalId),
          status,
          result,
          error
        })
        return newStates
      })
      
      // 如果是当前选中的目标，更新主状态
      setState(prev => {
        if (goalId !== prev.selectedGoalId) return prev
        
        if (status === PathGenerationStatus.COMPLETED && result) {
          setMessage('✅ 学习路径生成完成！')
          refreshData() // 刷新数据显示新路径
          return {
            ...prev,
            generatedPath: result,
            currentStep: 'review',
            isProcessing: false
          }
        } else if (status === PathGenerationStatus.FAILED) {
          setMessage(`❌ 生成失败: ${error || '未知错误'}`)
          return { ...prev, isProcessing: false }
        } else if (status === PathGenerationStatus.CACHED && result) {
          setMessage('✅ 使用缓存的路径结果！')
          refreshData()
          return {
            ...prev,
            generatedPath: result,
            currentStep: 'review',
            isProcessing: false
          }
        } else if (status === PathGenerationStatus.GENERATING) {
          return { ...prev, isProcessing: true }
        }
        return prev
      })
    },
    
    onProgressUpdate: (goalId: string, progress: number, stage?: string) => {
      setGenerationStates(prev => {
        const newStates = new Map(prev)
        const current = newStates.get(goalId)
        if (current) {
          newStates.set(goalId, { ...current, progress, stage })
        }
        return newStates
      })
      
      // 如果是当前选中的目标，更新消息
      setState(prev => {
        if (goalId === prev.selectedGoalId && stage) {
          setMessage(`🛤️ ${stage} (${progress}%)`)
        }
        return prev
      })
    },
    
    onCacheHit: (goalId: string, path: LearningPath, metadata?: any) => {
      log(`[PathPlan] Path cache hit for goal: ${goalId}`)
      setGoals(currentGoals => {
        const goal = currentGoals.find(g => g.id === goalId)
        setMessage(`💾 使用了目标"${goal?.title}"的缓存路径${metadata ? ` (${metadata.nodeCount}个节点, ${metadata.totalHours}小时)` : ''}`)
        return currentGoals
      })
    },

    onGenerationStart: (goalId: string, config: PathGenerationConfig) => {
      setState(prev => {
        if (goalId === prev.selectedGoalId) {
          setMessage('🛤️ 开始生成学习路径...')
        }
        return prev
      })
    },

    onGenerationComplete: (goalId: string, path: LearningPath, timeTaken: number) => {
      setState(prev => {
        if (goalId === prev.selectedGoalId) {
          setMessage(`✅ 路径生成完成！(用时 ${Math.round(timeTaken / 1000)}秒, ${path.nodes.length}个节点)`)
        }
        return prev
      })
    }
  }), [refreshData]) // 只依赖refreshData

  useEffect(() => {
    log('[pathPlan] View loaded')
    refreshData()
    
    // 注册分析监听器
    skillGapAnalysisManager.addListener(analysisListener)
    // 注册路径生成监听器
    pathPlanningManager.addListener(pathGenerationListener)
    
    return () => {
      // 清理监听器
      skillGapAnalysisManager.removeListener(analysisListener)
      pathPlanningManager.removeListener(pathGenerationListener)
    }
  }, []) // 空依赖数组，只在组件挂载时运行一次

  // 当配置变化时，更新生成状态
  useEffect(() => {
    updateAllGenerationStates(goals)
  }, [config, goals, updateAllGenerationStates])

  // 选择目标
  const selectGoal = (goalId: string) => {
    // 获取选中目标的分析状态
    const analysisStatus = skillGapAnalysisManager.getAnalysisStatus(goalId)
    const cachedAnalysis = skillGapAnalysisManager.getAnalysisResult(goalId)
    
    // 根据分析状态设置UI状态
    const isCurrentlyAnalyzing = analysisStatus === AnalysisStatus.ANALYZING
    
    setState(prev => ({
      ...prev,
      selectedGoalId: goalId,
      currentStep: cachedAnalysis ? 'generation' : 'analysis',
      skillGapAnalysis: cachedAnalysis,
      generatedPath: null,
      isProcessing: isCurrentlyAnalyzing // 同步分析状态
    }))
    
    // 获取该目标的关联路径
    const goalPaths = getPathsByGoal(goalId)
    setSelectedGoalPaths(goalPaths)
    
    // 根据状态设置消息
    if (cachedAnalysis) {
      setMessage('💾 加载了缓存的分析结果')
    } else if (isCurrentlyAnalyzing) {
      setMessage('🔍 正在分析技能差距...')
    } else {
      setMessage('')
    }
  }

  // 路径状态管理函数
  const updatePathStatus = async (pathId: string, status: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status }
      })
      setMessage(`✅ 路径状态已更新为: ${status}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 激活路径
  const activatePath = (pathId: string) => updatePathStatus(pathId, 'active')
  
  // 暂停路径
  const pausePath = (pathId: string) => updatePathStatus(pathId, 'paused')
  
  // 完成路径
  const completePath = (pathId: string) => updatePathStatus(pathId, 'completed')
  
  // 归档路径
  const archivePath = (pathId: string) => updatePathStatus(pathId, 'archived')

  // 执行技能差距分析（异步）
  const handleAnalyzeSkillGap = useCallback(async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🔍 正在分析技能差距...')

    try {
      // 使用异步分析管理器
      await skillGapAnalysisManager.startAnalysis(state.selectedGoalId, false)
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 启动分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [state.selectedGoalId])

  // 重新分析（强制刷新）
  const handleForceAnalyzeSkillGap = useCallback(async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🔍 正在重新分析技能差距...')

    try {
      // 使用异步分析管理器，强制刷新
      await skillGapAnalysisManager.startAnalysis(state.selectedGoalId, true)
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 启动分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [state.selectedGoalId])

  // 停止分析
  const stopAnalysis = useCallback(() => {
    if (state.selectedGoalId) {
      skillGapAnalysisManager.stopAnalysis(state.selectedGoalId)
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage('🛑 分析已停止')
    }
  }, [state.selectedGoalId])

  // 清除分析缓存
  const clearAnalysisCache = useCallback((goalId: string) => {
    skillGapAnalysisManager.clearAnalysisCache(goalId)
    updateAllAnalysisStates(goals)
    setMessage('🗑️ 已清除分析缓存')
  }, [goals])

  // 批量分析所有目标
  const analyzeAllGoals = useCallback(async () => {
    const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3) // 限制并发数量
    
    setMessage(`🔍 开始批量分析 ${activeGoals.length} 个目标...`)
    
    for (const goal of activeGoals) {
      try {
        await skillGapAnalysisManager.startAnalysis(goal.id)
      } catch (error) {
        log(`[PathPlan] Failed to start analysis for goal ${goal.id}:`, error)
      }
    }
  }, [goals])

  // 生成学习路径
  const generatePath = async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🛤️ 正在生成学习路径...')

    try {
      // 使用路径规划管理器生成路径
      await pathPlanningManager.startGeneration(state.selectedGoalId, config)
      // 状态更新将通过监听器处理
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 启动生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 重新生成路径（强制刷新）
  const handleForceGeneratePath = useCallback(async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🛤️ 正在重新生成学习路径...')

    try {
      // 使用路径规划管理器强制重新生成路径
      await pathPlanningManager.startGeneration(state.selectedGoalId, config, true)
      // 状态更新将通过监听器处理
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 启动生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [state.selectedGoalId, config])

  // 停止路径生成
  const stopPathGeneration = useCallback(() => {
    if (state.selectedGoalId) {
      pathPlanningManager.stopGeneration(state.selectedGoalId)
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage('🛑 路径生成已停止')
    }
  }, [state.selectedGoalId])

  // 清除路径生成缓存
  const clearPathGenerationCache = useCallback((goalId: string) => {
    pathPlanningManager.clearPathCache(goalId, config)
    updateAllGenerationStates(goals)
    setMessage('🗑️ 已清除路径生成缓存')
  }, [config, goals])

  // 获取缓存统计
  const pathCacheStats = pathPlanningManager.getCacheStats()
  const cacheStats = skillGapAnalysisManager.getCacheStats()

  // 确认并激活路径
  const confirmPath = async () => {
    if (!state.generatedPath) return

    try {
      // 激活目标（如果需要）
      if (state.selectedGoalId) {
        await updateLearningGoal(state.selectedGoalId, { status: 'active' })
      }
      
      setMessage('✅ 学习路径已确认并激活！')
      setState(prev => ({
        ...prev,
        currentStep: 'confirmation'
      }))
      refreshData()
    } catch (error) {
      setMessage(`❌ 确认失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 重新开始规划
  const resetPlanning = () => {
    setState({
      currentStep: 'analysis',
      selectedGoalId: null,
      skillGapAnalysis: null,
      generatedPath: null,
      isProcessing: false
    })
    setMessage('')
  }

  // 获取当前评估状态
  const assessment = getCurrentAssessment()
  const selectedGoal = goals.find(g => g.id === state.selectedGoalId)
  const selectedGoalAnalysisState = state.selectedGoalId ? analysisStates.get(state.selectedGoalId) : null

  // 动态获取当前选中目标的实时分析状态
  const currentAnalysisStatus = state.selectedGoalId ? 
    skillGapAnalysisManager.getAnalysisStatus(state.selectedGoalId) : AnalysisStatus.IDLE
  
  // 计算UI应该显示的处理状态
  const isCurrentlyProcessing = state.isProcessing || currentAnalysisStatus === AnalysisStatus.ANALYZING

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 智能路径规划
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          基于能力评估的个性化学习路径生成与可视化管理
        </p>
        
        {/* 缓存统计信息 */}
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '8px',
          display: 'flex',
          gap: '16px'
        }}>
          <span>💾 已缓存分析: {cacheStats.totalCached} 个</span>
          <span>⚡ 活跃分析: {cacheStats.activeAnalyses} 个</span>
          <span>🛤️ 已缓存路径: {pathCacheStats.totalCached} 个</span>
          <span>🚀 活跃生成: {pathCacheStats.activeGenerations} 个</span>
          {(cacheStats.totalCached > 0 || pathCacheStats.totalCached > 0) && (
            <button
              onClick={() => {
                skillGapAnalysisManager.clearAllCache()
                pathPlanningManager.clearAllCache()
                updateAllAnalysisStates(goals)
                updateAllGenerationStates(goals)
                setMessage('🗑️ 已清除所有缓存')
              }}
              style={{
                fontSize: '12px',
                padding: '2px 6px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              清除所有缓存
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.includes('❌') ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${message.includes('❌') ? '#fca5a5' : '#86efac'}`,
          color: message.includes('❌') ? '#dc2626' : '#166534',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* 能力评估检查 */}
      {!assessment && (
        <div style={{
          padding: '20px',
          border: '2px dashed #fbbf24',
          borderRadius: '12px',
          backgroundColor: '#fef3c7',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#d97706', marginBottom: '8px' }}>需要完成能力评估</h3>
          <p style={{ color: '#92400e' }}>
            为了生成个性化的学习路径，请先完成能力评估以了解您的技能水平
          </p>
        </div>
      )}

      {/* 步骤指示器 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        position: 'relative'
      }}>
        {['analysis', 'generation', 'review', 'confirmation'].map((step, index) => {
          const stepNames = ['分析技能', '生成路径', '审查确认', '完成激活']
          const stepIcons = ['🔍', '🛤️', '👀', '✅']
          const isActive = state.currentStep === step
          const isCompleted = ['analysis', 'generation', 'review', 'confirmation'].indexOf(state.currentStep) > index
          
          return (
            <div key={step} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              position: 'relative'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
                color: isCompleted || isActive ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }}>
                {stepIcons[index]}
              </div>
              <span style={{
                fontSize: '14px',
                color: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#6b7280',
                fontWeight: isActive ? 'bold' : 'normal'
              }}>
                {stepNames[index]}
              </span>
              {index < 3 && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: '60%',
                  width: '40%',
                  height: '2px',
                  backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 左侧：目标选择和配置 */}
        <div>
          {/* 目标选择 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              📋 选择学习目标
            </h3>
            
            {goals.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
                <p>还没有学习目标</p>
                <p style={{ fontSize: '14px' }}>请先创建学习目标</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {goals.filter(g => g.status !== 'cancelled').map(goal => {
                  const goalAnalysisState = analysisStates.get(goal.id)
                  const analysisStatus = goalAnalysisState?.status || AnalysisStatus.IDLE
                  const analysisProgress = goalAnalysisState?.progress
                  
                  // 获取路径生成状态
                  const goalGenerationState = generationStates.get(goal.id)
                  const generationStatus = goalGenerationState?.status || PathGenerationStatus.IDLE
                  const generationProgress = goalGenerationState?.progress
                  
                  return (
                    <div
                      key={goal.id}
                      onClick={() => selectGoal(goal.id)}
                      style={{
                        padding: '16px',
                        border: `2px solid ${state.selectedGoalId === goal.id ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: state.selectedGoalId === goal.id ? '#eff6ff' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {goal.title}
                          </h4>
                          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                            {goal.description}
                          </p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                            <span>📂 {goal.category}</span>
                            <span>📊 {goal.targetLevel}</span>
                            <span>⏱️ {goal.estimatedTimeWeeks}周</span>
                          </div>
                          
                          {/* 分析状态显示 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563' }}>
                              分析:
                            </span>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              backgroundColor: analysisStatus === AnalysisStatus.COMPLETED || analysisStatus === AnalysisStatus.CACHED ? '#dcfce7' :
                                             analysisStatus === AnalysisStatus.ANALYZING ? '#dbeafe' :
                                             analysisStatus === AnalysisStatus.FAILED ? '#fee2e2' : '#f3f4f6',
                              color: analysisStatus === AnalysisStatus.COMPLETED || analysisStatus === AnalysisStatus.CACHED ? '#166534' :
                                    analysisStatus === AnalysisStatus.ANALYZING ? '#1e40af' :
                                    analysisStatus === AnalysisStatus.FAILED ? '#dc2626' : '#6b7280'
                            }}>
                              {analysisStatus === AnalysisStatus.ANALYZING ? 
                                `分析中 ${analysisProgress ? `(${analysisProgress}%)` : ''}` :
                                analysisStatusText[analysisStatus]
                              }
                            </span>
                            
                            {/* 分析进度条 */}
                            {analysisStatus === AnalysisStatus.ANALYZING && typeof analysisProgress === 'number' && (
                              <div style={{ flex: 1, maxWidth: '40px' }}>
                                <div style={{
                                  width: '100%',
                                  height: '3px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${analysisProgress}%`,
                                    height: '100%',
                                    backgroundColor: '#3b82f6',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* 路径生成状态显示 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563' }}>
                              路径:
                            </span>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              backgroundColor: generationStatus === PathGenerationStatus.COMPLETED || generationStatus === PathGenerationStatus.CACHED ? '#dcfce7' :
                                             generationStatus === PathGenerationStatus.GENERATING ? '#dbeafe' :
                                             generationStatus === PathGenerationStatus.FAILED ? '#fee2e2' : '#f3f4f6',
                              color: generationStatus === PathGenerationStatus.COMPLETED || generationStatus === PathGenerationStatus.CACHED ? '#166534' :
                                    generationStatus === PathGenerationStatus.GENERATING ? '#1e40af' :
                                    generationStatus === PathGenerationStatus.FAILED ? '#dc2626' : '#6b7280'
                            }}>
                              {generationStatus === PathGenerationStatus.GENERATING ? 
                                `生成中 ${generationProgress ? `(${generationProgress}%)` : ''}` :
                                generationStatusText[generationStatus]
                              }
                            </span>
                            
                            {/* 路径生成进度条 */}
                            {generationStatus === PathGenerationStatus.GENERATING && typeof generationProgress === 'number' && (
                              <div style={{ flex: 1, maxWidth: '40px' }}>
                                <div style={{
                                  width: '100%',
                                  height: '3px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${generationProgress}%`,
                                    height: '100%',
                                    backgroundColor: '#10b981',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            )}
                            
                            {/* 快速操作按钮 */}
                            {(generationStatus === PathGenerationStatus.COMPLETED || generationStatus === PathGenerationStatus.CACHED) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearPathGenerationCache(goal.id)
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#6b7280'
                                }}
                                title="清除路径缓存"
                              >
                                🗑️
                              </button>
                            )}
                            
                            {generationStatus === PathGenerationStatus.GENERATING && goal.id === state.selectedGoalId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  stopPathGeneration()
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  backgroundColor: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#dc2626'
                                }}
                                title="停止生成"
                              >
                                🛑
                              </button>
                            )}
                          </div>
                          
                          {/* 原有的分析操作按钮 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 分析操作按钮 */}
                            {(analysisStatus === AnalysisStatus.COMPLETED || analysisStatus === AnalysisStatus.CACHED) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearAnalysisCache(goal.id)
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#6b7280'
                                }}
                                title="清除分析缓存"
                              >
                                🗑️
                              </button>
                            )}
                            
                            {analysisStatus === AnalysisStatus.ANALYZING && goal.id === state.selectedGoalId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  stopAnalysis()
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  backgroundColor: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#dc2626'
                                }}
                                title="停止分析"
                              >
                                🛑
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: goal.status === 'active' ? '#dcfce7' : '#f3f4f6',
                          color: goal.status === 'active' ? '#166534' : '#374151'
                        }}>
                          {goal.status === 'active' ? '进行中' : 
                           goal.status === 'paused' ? '已暂停' : 
                           goal.status === 'completed' ? '已完成' : '草稿'}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* 批量分析按钮 */}
                {goals.filter(g => g.status === 'active').length > 0 && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      onClick={analyzeAllGoals}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      🔍 批量分析活跃目标
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 已关联路径显示和管理 */}
          {state.selectedGoalId && selectedGoalPaths.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                🛤️ 已关联的学习路径 ({selectedGoalPaths.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedGoalPaths.map(path => {
                  const completedNodes = path.nodes.filter(n => n.status === 'completed')
                  const progress = path.nodes.length > 0 ? 
                    (completedNodes.length / path.nodes.length) * 100 : 0
                  
                  return (
                    <div
                      key={path.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {path.title}
                          </h4>
                          <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                            {path.description}
                          </p>
                          
                          {/* 路径统计信息 */}
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                            <span>📚 {path.nodes.length} 个节点</span>
                            <span>⏱️ {path.totalEstimatedHours}小时</span>
                            <span>✅ {completedNodes.length} 个已完成</span>
                          </div>
                          
                          {/* 进度条 */}
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#666' }}>学习进度</span>
                              <span style={{ fontSize: '12px', color: '#666' }}>{Math.round(progress)}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: progress >= 100 ? '#10b981' : progress >= 50 ? '#3b82f6' : '#f59e0b',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </div>
                        
                        {/* 状态标签 */}
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: 
                            path.status === 'active' ? '#dcfce7' : 
                            path.status === 'completed' ? '#dbeafe' : 
                            path.status === 'paused' ? '#fef3c7' : 
                            path.status === 'frozen' ? '#f3f4f6' : '#fecaca',
                          color: 
                            path.status === 'active' ? '#166534' : 
                            path.status === 'completed' ? '#1e40af' : 
                            path.status === 'paused' ? '#92400e' : 
                            path.status === 'frozen' ? '#374151' : '#dc2626'
                        }}>
                          {path.status === 'active' ? '进行中' : 
                           path.status === 'completed' ? '已完成' : 
                           path.status === 'paused' ? '已暂停' : 
                           path.status === 'frozen' ? '已冻结' : 
                           path.status === 'archived' ? '已归档' : '草稿'}
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {path.status === 'draft' && (
                          <button
                            onClick={() => activatePath(path.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ▶️ 激活
                          </button>
                        )}
                        
                        {path.status === 'active' && (
                          <>
                            <button
                              onClick={() => pausePath(path.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ⏸️ 暂停
                            </button>
                            <button
                              onClick={() => completePath(path.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ 完成
                            </button>
                          </>
                        )}
                        
                        {(path.status === 'paused' || path.status === 'frozen') && (
                          <button
                            onClick={() => activatePath(path.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ▶️ 重新激活
                          </button>
                        )}
                        
                        {path.status === 'completed' && (
                          <button
                            onClick={() => activatePath(path.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            🔄 重新开始
                          </button>
                        )}
                        
                        {path.status !== 'archived' && (
                          <button
                            onClick={() => archivePath(path.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            📦 归档
                          </button>
                        )}
                      </div>
                      
                      {/* 节点预览 */}
                      {path.nodes.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                            节点预览 (前3个):
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {path.nodes.slice(0, 3).map((node, index) => (
                              <div key={node.id} style={{
                                padding: '8px 10px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                fontSize: '12px',
                                border: '1px solid #e5e7eb'
                              }}>
                                {/* 节点标题和状态 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '500', flex: 1 }}>
                                    {index + 1}. {node.title}
                                  </span>
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    backgroundColor: node.status === 'completed' ? '#dcfce7' : 
                                                    node.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
                                    color: node.status === 'completed' ? '#166534' : 
                                           node.status === 'in_progress' ? '#1e40af' : '#374151'
                                  }}>
                                    {node.status === 'completed' ? '已完成' : 
                                     node.status === 'in_progress' ? '进行中' : '未开始'}
                                  </span>
                                </div>
                                
                                {/* 节点描述和时间 */}
                                <div style={{ color: '#666', fontSize: '11px', marginBottom: '4px' }}>
                                  {node.description?.split('\n')[0] || '暂无描述'} • {node.estimatedHours}h • 难度{node.difficulty}/5
                                </div>
                                
                                {/* 个性化标签 */}
                                {node.tags && node.tags.length > 0 && (
                                  <div style={{ marginBottom: '4px' }}>
                                    {node.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                      <span
                                        key={tagIndex}
                                        style={{
                                          display: 'inline-block',
                                          padding: '1px 4px',
                                          backgroundColor: tag === '重点提升' ? '#fecaca' : 
                                                           tag === '实战项目' ? '#bfdbfe' : '#e5e7eb',
                                          color: tag === '重点提升' ? '#dc2626' : 
                                                 tag === '实战项目' ? '#1e40af' : '#374151',
                                          borderRadius: '8px',
                                          fontSize: '9px',
                                          marginRight: '3px',
                                          marginBottom: '1px'
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* 学习目标简要显示 */}
                                {node.learningObjectives && node.learningObjectives.length > 0 && (
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                    🎯 {node.learningObjectives[0]}
                                    {node.learningObjectives.length > 1 && ` (+ ${node.learningObjectives.length - 1} 个目标)`}
                                  </div>
                                )}
                                
                                {/* 实践项目简要显示 */}
                                {node.practiceProjects && node.practiceProjects.length > 0 && (
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                                    🛠️ {node.practiceProjects[0].title} 
                                    {node.practiceProjects.length > 1 && ` (+ ${node.practiceProjects.length - 1} 个项目)`}
                                  </div>
                                )}
                              </div>
                            ))}
                            {path.nodes.length > 3 && (
                              <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', padding: '4px' }}>
                                ... 还有 {path.nodes.length - 3} 个详细节点
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* 快速操作提示 */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                <strong>💡 提示:</strong> 您可以继续生成新的学习路径，现有路径会自动保留并可以独立管理。
                支持多路径并行学习或根据需要激活不同的路径。
              </div>
            </div>
          )}

          {/* 路径生成配置 */}
          {state.selectedGoalId && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                ⚙️ 路径生成配置
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    学习风格
                  </label>
                  <select
                    value={config.learningStyle}
                    onChange={(e) => setConfig(prev => ({ ...prev, learningStyle: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="theory-first">理论优先</option>
                    <option value="practice-first">实践优先</option>
                    <option value="balanced">理论实践并重</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    学习节奏
                  </label>
                  <select
                    value={config.timePreference}
                    onChange={(e) => setConfig(prev => ({ ...prev, timePreference: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="intensive">密集型 (快速掌握)</option>
                    <option value="moderate">适中型 (稳步推进)</option>
                    <option value="relaxed">轻松型 (循序渐进)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    难度递增方式
                  </label>
                  <select
                    value={config.difficultyProgression}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficultyProgression: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="linear">线性递增</option>
                    <option value="exponential">指数递增</option>
                    <option value="plateau">阶段性提升</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.includeProjects}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeProjects: e.target.checked }))}
                    />
                    包含实战项目
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.includeMilestones}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeMilestones: e.target.checked }))}
                    />
                    设置里程碑
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：分析结果和路径预览 */}
        <div>
          {/* 技能差距分析 */}
          {state.selectedGoalId && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  🔍 技能差距分析
                </h3>
                {state.currentStep === 'analysis' && assessment && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleAnalyzeSkillGap}
                      disabled={isCurrentlyProcessing}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isCurrentlyProcessing ? '#e5e7eb' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: isCurrentlyProcessing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCurrentlyProcessing ? '分析中...' : '开始分析'}
                    </button>
                    
                    {/* 停止分析按钮，仅在分析中显示 */}
                    {currentAnalysisStatus === AnalysisStatus.ANALYZING && (
                      <button
                        onClick={stopAnalysis}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        🛑 停止
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!assessment ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>⚠️ 需要先完成能力评估</p>
                </div>
              ) : state.skillGapAnalysis ? (
                <div>
                  {/* 分析结果头部操作区 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                        ✅ 分析完成
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(state.skillGapAnalysis.timestamp || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* 重新分析按钮 */}
                    <button
                      onClick={handleForceAnalyzeSkillGap}
                      disabled={isCurrentlyProcessing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isCurrentlyProcessing ? '#f3f4f6' : '#f59e0b',
                        color: isCurrentlyProcessing ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: isCurrentlyProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔄 重新分析
                    </button>
                  </div>

                  {/* AI分析置信度指示器 */}
                  <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: state.skillGapAnalysis.fallbackUsed ? '#fef3c7' : '#ecfdf5', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ color: state.skillGapAnalysis.fallbackUsed ? '#92400e' : '#065f46' }}>
                      {state.skillGapAnalysis.fallbackUsed ? '⚠️ 使用规则分析' : '🤖 AI智能分析'} • 
                      置信度: {Math.round((state.skillGapAnalysis.analysisConfidence || state.skillGapAnalysis.confidence || 0.8) * 100)}%
                    </span>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>当前水平: {state.skillGapAnalysis.currentLevel || state.skillGapAnalysis.overallAssessment?.currentLevel || 0}/10</span>
                      <span>目标水平: {state.skillGapAnalysis.targetLevel || state.skillGapAnalysis.overallAssessment?.targetLevel || 8}/10</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((state.skillGapAnalysis.currentLevel || state.skillGapAnalysis.overallAssessment?.currentLevel || 0) / (state.skillGapAnalysis.targetLevel || state.skillGapAnalysis.overallAssessment?.targetLevel || 8)) * 100}%`,
                        height: '100%',
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                  </div>

                  {/* 个性化洞察 */}
                  {state.skillGapAnalysis.overallAssessment?.personalizedInsights && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#7c3aed' }}>
                        💡 个性化洞察:
                      </h4>
                      {state.skillGapAnalysis.overallAssessment.personalizedInsights.slice(0, 2).map((insight, index) => (
                        <div key={index} style={{
                          padding: '6px 10px',
                          backgroundColor: '#f3e8ff',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          fontSize: '12px',
                          color: '#6b21a8'
                        }}>
                          {insight}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      主要技能差距:
                    </h4>
                    {(state.skillGapAnalysis.skillGaps || state.skillGapAnalysis.gaps || []).slice(0, 3).map((gap, index) => (
                      <div key={index} style={{
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{gap.skill}</span>
                          <span style={{
                            color: gap.priority === 'high' ? '#dc2626' : 
                                  gap.priority === 'medium' ? '#f59e0b' : '#10b981'
                          }}>
                            {gap.priority === 'high' ? '高优先级' : 
                             gap.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          差距: {gap.gap} 分
                          {gap.estimatedHours && ` • 预计: ${gap.estimatedHours}小时`}
                          {gap.category && ` • ${gap.category}`}
                        </div>
                        {gap.learningStrategy && (
                          <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px', fontStyle: 'italic' }}>
                            策略: {gap.learningStrategy}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 个性化建议 */}
                  {state.skillGapAnalysis.personalizedRecommendations && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#059669' }}>
                        🎯 个性化建议:
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {state.skillGapAnalysis.personalizedRecommendations.leverageStrengths?.slice(0, 2).map((rec, index) => (
                          <div key={index} style={{
                            padding: '6px 8px',
                            backgroundColor: '#d1fae5',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#065f46'
                          }}>
                            <strong>优势利用:</strong> {rec}
                          </div>
                        ))}
                        {state.skillGapAnalysis.personalizedRecommendations.addressWeaknesses?.slice(0, 2).map((rec, index) => (
                          <div key={index} style={{
                            padding: '6px 8px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#92400e'
                          }}>
                            <strong>薄弱改进:</strong> {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <strong>预计学习时间:</strong> {state.skillGapAnalysis.estimatedTimeWeeks || state.skillGapAnalysis.summary?.estimatedWeeks || 0} 周
                    <br />
                    <strong>分析置信度:</strong> {Math.round((state.skillGapAnalysis.analysisConfidence || state.skillGapAnalysis.confidence || 0.8) * 100)}%
                    {state.skillGapAnalysis.overallAssessment?.readinessScore && (
                      <>
                        <br />
                        <strong>学习准备度:</strong> {state.skillGapAnalysis.overallAssessment.readinessScore}%
                      </>
                    )}
                  </div>

                  {state.currentStep === 'generation' && (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      {/* 路径生成状态显示 */}
                      {state.selectedGoalId && (() => {
                        const currentGenerationState = generationStates.get(state.selectedGoalId)
                        const currentGenerationStatus = currentGenerationState?.status || PathGenerationStatus.IDLE
                        const currentGenerationProgress = currentGenerationState?.progress
                        const currentGenerationStage = currentGenerationState?.stage
                        
                        return (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              marginBottom: '8px',
                              padding: '8px 12px',
                              backgroundColor: 
                                currentGenerationStatus === PathGenerationStatus.COMPLETED || currentGenerationStatus === PathGenerationStatus.CACHED ? '#ecfdf5' :
                                currentGenerationStatus === PathGenerationStatus.GENERATING ? '#eff6ff' :
                                currentGenerationStatus === PathGenerationStatus.FAILED ? '#fef2f2' : '#f9fafb',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold',
                                color: 
                                  currentGenerationStatus === PathGenerationStatus.COMPLETED || currentGenerationStatus === PathGenerationStatus.CACHED ? '#059669' :
                                  currentGenerationStatus === PathGenerationStatus.GENERATING ? '#2563eb' :
                                  currentGenerationStatus === PathGenerationStatus.FAILED ? '#dc2626' : '#6b7280'
                              }}>
                                {currentGenerationStatus === PathGenerationStatus.GENERATING ? 
                                  `🛤️ 正在生成路径... ${currentGenerationProgress ? `(${currentGenerationProgress}%)` : ''}` :
                                  currentGenerationStatus === PathGenerationStatus.COMPLETED ? '✅ 路径生成完成' :
                                  currentGenerationStatus === PathGenerationStatus.CACHED ? '💾 使用缓存路径' :
                                  currentGenerationStatus === PathGenerationStatus.FAILED ? '❌ 生成失败' :
                                  '⭕ 准备生成路径'
                                }
                              </span>
                              
                              {/* 生成进度条 */}
                              {currentGenerationStatus === PathGenerationStatus.GENERATING && typeof currentGenerationProgress === 'number' && (
                                <div style={{ flex: 1, maxWidth: '100px' }}>
                                  <div style={{
                                    width: '100%',
                                    height: '6px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${currentGenerationProgress}%`,
                                      height: '100%',
                                      backgroundColor: '#10b981',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>
                              )}
                              
                              {/* 阶段显示 */}
                              {currentGenerationStage && (
                                <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                  {currentGenerationStage}
                                </span>
                              )}
                            </div>
                            
                            {/* 缓存路径信息显示 */}
                            {(currentGenerationStatus === PathGenerationStatus.CACHED || currentGenerationStatus === PathGenerationStatus.COMPLETED) && 
                             currentGenerationState?.result && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#059669',
                                backgroundColor: '#ecfdf5',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                              }}>
                                📊 已生成路径：{currentGenerationState.result.nodes.length} 个节点，
                                预计 {currentGenerationState.result.totalEstimatedHours} 小时
                                {currentGenerationStatus === PathGenerationStatus.CACHED && ' (来自缓存)'}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      
                      {/* 按钮组 */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={generatePath}
                          disabled={isCurrentlyProcessing}
                          style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: isCurrentlyProcessing ? '#e5e7eb' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: isCurrentlyProcessing ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isCurrentlyProcessing ? '生成中...' : '🛤️ 生成学习路径'}
                        </button>
                        
                        {/* 重新生成按钮 */}
                        {state.selectedGoalId && (() => {
                          const currentGenerationState = generationStates.get(state.selectedGoalId)
                          const hasResult = currentGenerationState?.result || 
                                          currentGenerationState?.status === PathGenerationStatus.COMPLETED ||
                                          currentGenerationState?.status === PathGenerationStatus.CACHED
                          
                          return hasResult ? (
                            <button
                              onClick={handleForceGeneratePath}
                              disabled={isCurrentlyProcessing}
                              style={{
                                padding: '12px 16px',
                                backgroundColor: isCurrentlyProcessing ? '#f3f4f6' : '#f59e0b',
                                color: isCurrentlyProcessing ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: isCurrentlyProcessing ? 'not-allowed' : 'pointer'
                              }}
                              title="强制重新生成，忽略缓存"
                            >
                              🔄 重新生成
                            </button>
                          ) : null
                        })()}
                        
                        {/* 停止生成按钮 */}
                        {state.selectedGoalId && (() => {
                          const currentGenerationState = generationStates.get(state.selectedGoalId)
                          const isGenerating = currentGenerationState?.status === PathGenerationStatus.GENERATING
                          
                          return isGenerating ? (
                            <button
                              onClick={stopPathGeneration}
                              style={{
                                padding: '12px 16px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              🛑 停止生成
                            </button>
                          ) : null
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : state.currentStep !== 'analysis' ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>✅ 技能差距分析已完成</p>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>点击"开始分析"来分析技能差距</p>
                </div>
              )}
            </div>
          )}

          {/* 生成的路径预览 */}
          {state.generatedPath && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  🛤️ 生成的学习路径
                </h3>
                {state.currentStep === 'review' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleForceGeneratePath}
                      disabled={isCurrentlyProcessing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      重新生成
                    </button>
                    <button
                      onClick={confirmPath}
                      disabled={isCurrentlyProcessing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isCurrentlyProcessing ? '#e5e7eb' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: isCurrentlyProcessing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      确认激活
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {state.generatedPath.title}
                </h4>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                  {state.generatedPath.description}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888' }}>
                  <span>📚 {state.generatedPath.nodes.length} 个学习节点</span>
                  <span>⏱️ 预计 {state.generatedPath.totalEstimatedHours} 小时</span>
                  <span>🎯 平均难度 {Math.round(state.generatedPath.nodes.reduce((sum, node) => sum + node.difficulty, 0) / state.generatedPath.nodes.length)}/5</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  学习节点预览:
                </h5>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {state.generatedPath.nodes.slice(0, 5).map((node, index) => (
                    <div key={node.id} style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      fontSize: '13px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {/* 节点标题和基本信息 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '500', flex: 1 }}>
                          {index + 1}. {node.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                          {node.estimatedHours}h • 难度{node.difficulty}/10
                        </div>
                      </div>
                      
                      {/* 节点描述 */}
                      <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px', lineHeight: '1.4' }}>
                        {node.description?.split('\n')[0] || '暂无描述'}
                      </div>
                      
                      {/* 个性化标签 */}
                      {node.tags && node.tags.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          {node.tags.map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                backgroundColor: tag === '重点提升' ? '#fecaca' : 
                                                 tag === '实战项目' ? '#bfdbfe' : '#e5e7eb',
                                color: tag === '重点提升' ? '#dc2626' : 
                                       tag === '实战项目' ? '#1e40af' : '#374151',
                                borderRadius: '12px',
                                fontSize: '10px',
                                marginRight: '4px',
                                marginBottom: '2px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 学习目标 */}
                      {node.learningObjectives && node.learningObjectives.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563', marginBottom: '2px' }}>
                            🎯 学习目标:
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '8px' }}>
                            {node.learningObjectives.slice(0, 2).map((objective: string, objIndex: number) => (
                              <div key={objIndex}>• {objective}</div>
                            ))}
                            {node.learningObjectives.length > 2 && (
                              <div style={{ color: '#9ca3af' }}>... 还有 {node.learningObjectives.length - 2} 个目标</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 学习资源预览 */}
                      {node.resources && node.resources.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563', marginBottom: '2px' }}>
                            📚 学习资源:
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '8px' }}>
                            {node.resources.slice(0, 2).map((resource: any, resIndex: number) => (
                              <div key={resIndex}>
                                • {resource.type === 'video' ? '📹' : 
                                    resource.type === 'article' ? '📄' : 
                                    resource.type === 'book' ? '📖' : '💻'} {resource.title}
                              </div>
                            ))}
                            {node.resources.length > 2 && (
                              <div style={{ color: '#9ca3af' }}>... 还有 {node.resources.length - 2} 个资源</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 实践项目预览 */}
                      {node.practiceProjects && node.practiceProjects.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563', marginBottom: '2px' }}>
                            🛠️ 实践项目:
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '8px' }}>
                            {node.practiceProjects.slice(0, 1).map((project: any, projIndex: number) => (
                              <div key={projIndex}>
                                • {project.title} ({project.difficulty})
                              </div>
                            ))}
                            {node.practiceProjects.length > 1 && (
                              <div style={{ color: '#9ca3af' }}>... 还有 {node.practiceProjects.length - 1} 个项目</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 个性化提示预览 */}
                      {node.personalizedHints && node.personalizedHints.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '500', color: '#1e40af', marginBottom: '2px' }}>
                            💡 个性化建议:
                          </div>
                          <div style={{ fontSize: '10px', color: '#1e40af' }}>
                            {node.personalizedHints[0]}
                            {node.personalizedHints.length > 1 && ' ...'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {state.generatedPath.nodes.length > 5 && (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', padding: '8px' }}>
                      ... 还有 {state.generatedPath.nodes.length - 5} 个详细节点
                    </div>
                  )}
                </div>
              </div>

              {state.generatedPath.milestones && state.generatedPath.milestones.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    🏆 学习里程碑:
                  </h5>
                  {state.generatedPath.milestones.map((milestone, index) => (
                    <div key={milestone.id} style={{
                      padding: '6px 10px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      🏆 {milestone.title} ({milestone.nodeIds.length} 个节点)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 确认完成状态 */}
          {state.currentStep === 'confirmation' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#10b981' }}>
                学习路径规划完成！
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                个性化学习路径已成功生成并激活，您可以开始学习了！
              </p>
              <button
                onClick={resetPlanning}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🎯 规划新路径
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          💡 使用指南
        </h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
          <p><strong>智能路径规划与管理流程：</strong></p>
          <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li>选择一个学习目标</li>
            <li>查看已关联的路径状态和进度</li>
            <li>配置您的学习偏好</li>
            <li>分析当前技能与目标的差距</li>
            <li>生成个性化的学习路径</li>
            <li>审查并确认路径内容</li>
          </ol>
          
          <p><strong>🛤️ 路径管理功能：</strong></p>
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li><strong>可视化显示：</strong> 查看所有关联路径的进度、状态和节点详情</li>
            <li><strong>灵活操作：</strong> 激活、暂停、完成、归档不同状态的路径</li>
            <li><strong>多路径支持：</strong> 支持为同一目标创建多条路径，并行或替代学习</li>
            <li><strong>状态管理：</strong> 智能状态转换，保持学习路径的有序管理</li>
            <li><strong>缓存机制：</strong> 路径生成结果自动缓存1小时，配置变化时自动失效</li>
            <li><strong>进度追踪：</strong> 实时显示路径生成进度和状态，支持随时停止</li>
          </ul>
          
          <p><strong>💾 智能缓存系统：</strong></p>
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li><strong>技能分析缓存：</strong> 30分钟内相同目标的分析结果直接使用缓存</li>
            <li><strong>路径生成缓存：</strong> 1小时内相同目标和配置的路径直接使用缓存</li>
            <li><strong>配置感知：</strong> 学习配置改变时自动重新生成，确保路径符合最新需求</li>
            <li><strong>状态同步：</strong> 实时显示缓存状态、生成进度和活跃任务数量</li>
            <li><strong>手动管理：</strong> 支持清除单个目标或全部缓存，强制重新分析/生成</li>
          </ul>
          
          <p><strong>💡 提示：</strong> 基于您的能力评估结果，系统会生成更精准的个性化路径。
          智能缓存系统确保快速响应的同时保持数据的准确性。您可以为同一目标创建多条路径进行A/B测试，
          或在不同时期激活不同的学习策略。配置改变时系统会智能判断是否需要重新生成路径。</p>
        </div>
      </div>
    </div>
  )
}

export default PathPlanView 