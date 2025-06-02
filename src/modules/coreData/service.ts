import { getProfileData, setProfileData } from '../../utils/profile'
import { getCurrentProfile } from '../../utils/profile'
import { log, error } from '../../utils/logger'
import { 
  CoreData, 
  LearningGoal, 
  LearningPath, 
  CourseUnit,
  AgentAction,
  PathNode,
  AbilityProfile
} from './types'

// 获取当前用户的核心数据
const getUserCoreData = (): CoreData => {
  const profile = getCurrentProfile()
  if (!profile) {
    // 如果没有登录用户，返回空数据
    return {
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
  }

  // 从profile数据中获取或创建coreData
  const coreData = getProfileData('coreData') || {
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

  return coreData
}

// 保存用户的核心数据
const saveUserCoreData = (coreData: CoreData): void => {
  const profile = getCurrentProfile()
  if (!profile) {
    log('[coreData] Warning: Trying to save data without active profile')
    return
  }

  coreData.metadata.lastUpdated = new Date().toISOString()
  setProfileData('coreData', coreData)
  log('[coreData] User core data saved for profile:', profile.name)
}

// 学习目标相关
export const createLearningGoal = (goal: Omit<LearningGoal, 'id' | 'createdAt' | 'updatedAt'>): LearningGoal => {
  const coreData = getUserCoreData()
  
  // 检查激活目标数量限制
  const activeGoals = coreData.goals.filter(g => g.status === 'active')
  if (goal.status === 'active' && activeGoals.length >= 3) {
    throw new Error('最多只能同时激活3个学习目标。请先暂停或完成其他目标。')
  }
  
  const newGoal: LearningGoal = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...goal
  }
  
  coreData.goals.push(newGoal)
  saveUserCoreData(coreData)
  
  // 记录事件
  addCoreEvent({
    type: 'goal_created',
    data: { goalId: newGoal.id, title: newGoal.title, category: newGoal.category }
  })
  
  return newGoal
}

export const getLearningGoals = (): LearningGoal[] => {
  const coreData = getUserCoreData()
  return coreData.goals
}

export const updateLearningGoal = (id: string, updates: Partial<LearningGoal>): LearningGoal | null => {
  const coreData = getUserCoreData()
  const index = coreData.goals.findIndex(g => g.id === id)
  if (index === -1) return null
  
  const currentGoal = coreData.goals[index]
  
  // 检查激活目标数量限制
  if (updates.status === 'active' && currentGoal.status !== 'active') {
    const activeGoals = coreData.goals.filter(g => g.status === 'active')
    if (activeGoals.length >= 3) {
      throw new Error('最多只能同时激活3个学习目标。请先暂停或完成其他目标。')
    }
  }
  
  coreData.goals[index] = { 
    ...currentGoal, 
    ...updates, 
    updatedAt: new Date().toISOString() 
  }
  
  saveUserCoreData(coreData)
  
  // 记录状态变更事件
  if (updates.status && updates.status !== currentGoal.status) {
    addCoreEvent({
      type: 'goal_status_changed',
      data: { 
        goalId: id, 
        oldStatus: currentGoal.status, 
        newStatus: updates.status,
        title: currentGoal.title
      }
    })
    
    // 如果目标被暂停或取消，同步更新相关路径
    if (['paused', 'cancelled'].includes(updates.status)) {
      syncPathsWithGoalStatus(id, updates.status)
    }
  }
  
  return coreData.goals[index]
}

export const deleteLearningGoal = (id: string): boolean => {
  const coreData = getUserCoreData()
  const index = coreData.goals.findIndex(g => g.id === id)
  if (index === -1) return false
  
  const goal = coreData.goals[index]
  
  // 删除关联的学习路径
  const relatedPaths = coreData.paths.filter(p => p.goalId === id)
  relatedPaths.forEach(path => {
    deleteLearningPath(path.id)
  })
  
  coreData.goals.splice(index, 1)
  saveUserCoreData(coreData)
  
  // 记录删除事件
  addCoreEvent({
    type: 'goal_deleted',
    data: { goalId: id, title: goal.title, category: goal.category }
  })
  
  return true
}

// 新增：目标状态管理功能
export const getActiveGoals = (): LearningGoal[] => {
  return getLearningGoals().filter(g => g.status === 'active')
}

export const getGoalStatusStats = () => {
  const goals = getLearningGoals()
  return {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused: goals.filter(g => g.status === 'paused').length,
    cancelled: goals.filter(g => g.status === 'cancelled').length,
    canActivateMore: goals.filter(g => g.status === 'active').length < 3
  }
}

// 保留原有简单接口，内部使用新的激活管理器
export const activateGoal = (goalId: string): LearningGoal | null => {
  const activeGoals = getActiveGoals()
  if (activeGoals.length >= 3) {
    throw new Error('最多只能同时激活3个学习目标。请先暂停或完成其他目标。')
  }
  
  return updateLearningGoal(goalId, { status: 'active' })
}

export const pauseGoal = (goalId: string): LearningGoal | null => {
  const result = updateLearningGoal(goalId, { status: 'paused' })
  if (result) {
    // 暂停关联的路径
    syncPathsWithGoalStatus(goalId, 'paused')
  }
  return result
}

export const completeGoal = (goalId: string): LearningGoal | null => {
  const result = updateLearningGoal(goalId, { status: 'completed' })
  if (result) {
    // 完成关联的路径
    syncPathsWithGoalStatus(goalId, 'completed')
  }
  return result
}

export const cancelGoal = (goalId: string): LearningGoal | null => {
  const result = updateLearningGoal(goalId, { status: 'cancelled' })
  if (result) {
    // 归档关联的路径
    syncPathsWithGoalStatus(goalId, 'cancelled')
  }
  return result
}

// 新增：高级目标激活管理函数
export const activateGoalAdvanced = async (goalId: string, options?: {
  force?: boolean
  priority?: number
  reason?: string
}): Promise<{
  success: boolean
  message: string
  affectedPaths: string[]
  recommendations: string[]
}> => {
  try {
    // 动态导入以避免循环依赖
    const { goalActivationManager } = await import('./goalActivationManager')
    const result = await goalActivationManager.activateGoal(goalId, options)
    
    return {
      success: result.success,
      message: result.message,
      affectedPaths: result.affectedPaths,
      recommendations: result.systemRecommendations
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '激活失败',
      affectedPaths: [],
      recommendations: ['检查目标状态', '确认激活限制']
    }
  }
}

export const getGoalActivationAdvice = async (): Promise<{
  suggestions: Array<{
    type: string
    goalId: string
    goalTitle: string
    reason: string
    priority: string
  }>
  stats: any
  recommendations: string[]
}> => {
  try {
    // 动态导入以避免循环依赖
    const { getActivationStats } = await import('./goalActivationManager')
    const stats = getActivationStats()
    
    // 移除基本建议功能，建议通过LLM生成智能建议
    const basicRecommendations = [
      '建议使用AI助手获取个性化的目标管理建议',
      '通过"AI智能对话"功能获取智能的学习规划指导',
      '可以询问AI："我应该如何管理我的学习目标？"'
    ]
    
    return {
      suggestions: [], // 移除基本建议，推荐使用LLM
      stats,
      recommendations: basicRecommendations
    }
    
  } catch (error) {
    log('[CoreData] Failed to get goal activation advice:', error)
    return {
      suggestions: [],
      stats: {
        total: 0,
        active: 0,
        paused: 0,
        completed: 0,
        cancelled: 0,
        maxActive: 3,
        availableSlots: 3,
        utilizationRate: 0,
        completionRate: 0
      },
      recommendations: ['系统错误，请稍后重试']
    }
  }
}

// 同步路径状态与目标状态
const syncPathsWithGoalStatus = (goalId: string, goalStatus: string) => {
  const coreData = getUserCoreData()
  const relatedPaths = coreData.paths.filter(p => p.goalId === goalId)
  
  relatedPaths.forEach(path => {
    let newPathStatus: LearningPath['status'] = path.status
    
    switch (goalStatus) {
      case 'paused':
        if (path.status === 'active') {
          newPathStatus = 'paused'
        }
        break
      case 'completed':
        if (['active', 'paused'].includes(path.status)) {
          newPathStatus = 'completed'
        }
        break
      case 'cancelled':
        if (['active', 'paused', 'draft'].includes(path.status)) {
          newPathStatus = 'archived'
        }
        break
      case 'active':
        if (path.status === 'paused') {
          newPathStatus = 'active'
        }
        break
    }
    
    if (newPathStatus !== path.status) {
      updateLearningPath(path.id, { status: newPathStatus })
    }
  })
}

// 学习路径相关
export const createLearningPath = (path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>): LearningPath => {
  const coreData = getUserCoreData()
  
  const newPath: LearningPath = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...path
  }
  
  coreData.paths.push(newPath)
  saveUserCoreData(coreData)
  
  return newPath
}

export const getLearningPaths = (): LearningPath[] => {
  const coreData = getUserCoreData()
  return coreData.paths
}

export const updateLearningPath = (id: string, updates: Partial<LearningPath>): LearningPath | null => {
  const coreData = getUserCoreData()
  const index = coreData.paths.findIndex(p => p.id === id)
  if (index === -1) return null
  
  coreData.paths[index] = {
    ...coreData.paths[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveUserCoreData(coreData)
  return coreData.paths[index]
}

export const deleteLearningPath = (id: string): boolean => {
  const coreData = getUserCoreData()
  const index = coreData.paths.findIndex(p => p.id === id)
  if (index === -1) return false
  
  coreData.paths.splice(index, 1)
  saveUserCoreData(coreData)
  return true
}

// 课程单元相关
export const createCourseUnit = (unit: Omit<CourseUnit, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): CourseUnit => {
  const coreData = getUserCoreData()
  
  // 初始化进度状态
  const initialProgress = {
    status: 'not_started' as const,
    sections: {
      reading: {
        completed: false,
        timeSpent: 0
      },
      practice: {
        completed: false,
        timeSpent: 0,
        completedExercises: [],
        scores: {}
      },
      summary: {
        completed: false,
        timeSpent: 0,
        selfAssessmentCompleted: false
      }
    },
    overallProgress: 0
  }
  
  const newUnit: CourseUnit = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: initialProgress,
    ...unit
  }
  
  coreData.courseUnits.push(newUnit)
  saveUserCoreData(coreData)
  
  // 记录事件
  addCoreEvent({
    type: 'course_unit_created',
    data: { unitId: newUnit.id, nodeId: newUnit.nodeId, title: newUnit.title }
  })
  
  return newUnit
}

// 确保课程单元有progress属性的辅助函数
const ensureUnitProgress = (unit: CourseUnit): CourseUnit => {
  if (!unit.progress) {
    return {
      ...unit,
      progress: {
        status: 'not_started' as const,
        sections: {
          reading: { completed: false, timeSpent: 0 },
          practice: { completed: false, timeSpent: 0, completedExercises: [], scores: {} },
          summary: { completed: false, timeSpent: 0, selfAssessmentCompleted: false }
        },
        overallProgress: 0
      }
    }
  }
  return unit
}

export const getCourseUnits = (): CourseUnit[] => {
  const coreData = getUserCoreData()
  // 确保所有课程单元都有progress属性
  return coreData.courseUnits.map(ensureUnitProgress)
}

// 根据节点ID获取课程单元
export const getCourseUnitsByNode = (nodeId: string): CourseUnit[] => {
  const coreData = getUserCoreData()
  return coreData.courseUnits
    .filter(unit => unit.nodeId === nodeId)
    .map(ensureUnitProgress)
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0))
}

// 获取节点的学习统计
export const getNodeLearningStats = (nodeId: string) => {
  const units = getCourseUnitsByNode(nodeId)
  if (units.length === 0) {
    return {
      totalUnits: 0,
      completedUnits: 0,
      progress: 0,
      totalTime: 0,
      estimatedTime: 0
    }
  }
  
  const completedUnits = units.filter(unit => unit.progress?.status === 'completed').length
  const totalTime = units.reduce((sum, unit) => {
    if (!unit.progress) return sum
    return sum + (unit.progress.sections.reading.timeSpent || 0) + 
           (unit.progress.sections.practice.timeSpent || 0) + 
           (unit.progress.sections.summary.timeSpent || 0)
  }, 0)
  const estimatedTime = units.reduce((sum, unit) => sum + (unit.metadata.estimatedTime || 0), 0)
  
  return {
    totalUnits: units.length,
    completedUnits,
    progress: Math.round((completedUnits / units.length) * 100),
    totalTime,
    estimatedTime
  }
}

export const updateCourseUnit = (id: string, updates: Partial<CourseUnit>): CourseUnit | null => {
  const coreData = getUserCoreData()
  const index = coreData.courseUnits.findIndex(u => u.id === id)
  if (index === -1) return null
  
  coreData.courseUnits[index] = {
    ...coreData.courseUnits[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveUserCoreData(coreData)
  
  // 记录事件
  addCoreEvent({
    type: 'course_unit_updated',
    data: { unitId: id, updates: Object.keys(updates) }
  })
  
  return coreData.courseUnits[index]
}

// 更新课程进度
export const updateCourseProgress = (unitId: string, progressUpdates: Partial<CourseUnit['progress']>): CourseUnit | null => {
  const coreData = getUserCoreData()
  const index = coreData.courseUnits.findIndex(u => u.id === unitId)
  if (index === -1) return null
  
  const unit = coreData.courseUnits[index]
  // 确保单元有progress属性
  const unitWithProgress = ensureUnitProgress(unit)
  
  const updatedProgress = {
    ...unitWithProgress.progress,
    ...progressUpdates,
    lastActivity: new Date().toISOString()
  }
  
  // 重新计算总体进度
  updatedProgress.overallProgress = calculateUnitProgress(updatedProgress)
  
  // 更新状态
  if (updatedProgress.overallProgress === 100 && updatedProgress.status !== 'completed') {
    updatedProgress.status = 'completed'
    updatedProgress.completedAt = new Date().toISOString()
  }
  
  coreData.courseUnits[index] = {
    ...unitWithProgress,
    progress: updatedProgress,
    updatedAt: new Date().toISOString()
  }
  
  saveUserCoreData(coreData)
  
  // 记录事件
  addCoreEvent({
    type: 'course_progress_updated',
    data: { 
      unitId, 
      progress: updatedProgress.overallProgress,
      status: updatedProgress.status
    }
  })
  
  return coreData.courseUnits[index]
}

// 标记章节完成
export const markSectionComplete = (
  unitId: string, 
  section: 'reading' | 'practice' | 'summary',
  timeSpent: number = 0,
  additionalData?: any
): CourseUnit | null => {
  const units = getCourseUnits()
  const unit = units.find(u => u.id === unitId)
  if (!unit) return null
  
  // 确保单元有progress属性
  const unitWithProgress = ensureUnitProgress(unit)
  
  const sectionProgress = { ...unitWithProgress.progress.sections[section] }
  sectionProgress.completed = true
  sectionProgress.timeSpent += timeSpent
  sectionProgress.completedAt = new Date().toISOString()
  
  // 处理特定章节的额外数据
  if (section === 'practice' && additionalData?.exerciseId && additionalData?.score !== undefined) {
    const practiceProgress = sectionProgress as typeof unitWithProgress.progress.sections.practice
    practiceProgress.completedExercises.push(additionalData.exerciseId)
    practiceProgress.scores[additionalData.exerciseId] = additionalData.score
  }
  
  if (section === 'summary' && additionalData?.selfAssessmentCompleted) {
    const summaryProgress = sectionProgress as typeof unitWithProgress.progress.sections.summary
    summaryProgress.selfAssessmentCompleted = true
  }
  
  return updateCourseProgress(unitId, {
    sections: {
      ...unitWithProgress.progress.sections,
      [section]: sectionProgress
    }
  })
}

// 开始学习课程单元
export const startCourseUnit = (unitId: string): CourseUnit | null => {
  const units = getCourseUnits()
  const unit = units.find(u => u.id === unitId)
  if (!unit) return null
  
  // 确保单元有progress属性
  const unitWithProgress = ensureUnitProgress(unit)
  
  if (unitWithProgress.progress.status !== 'not_started') {
    return unitWithProgress
  }
  
  return updateCourseProgress(unitId, {
    status: 'reading',
    startedAt: new Date().toISOString()
  })
}

// 计算单元进度百分比
const calculateUnitProgress = (progress: CourseUnit['progress']): number => {
  let totalSections = 0
  let completedSections = 0
  
  // 阅读部分
  totalSections += 1
  if (progress.sections.reading.completed) completedSections += 1
  
  // 练习部分
  totalSections += 1
  if (progress.sections.practice.completed) completedSections += 1
  
  // 总结部分  
  totalSections += 1
  if (progress.sections.summary.completed) completedSections += 1
  
  return Math.round((completedSections / totalSections) * 100)
}

// 获取课程学习统计
export const getCourseStats = () => {
  const units = getCourseUnits() // 现在已经确保所有单元都有progress属性
  const totalUnits = units.length
  
  const completedUnits = units.filter(u => u.progress.status === 'completed').length
  const inProgressUnits = units.filter(u => u.progress.status !== 'not_started' && u.progress.status !== 'completed').length
  
  const totalTimeSpent = units.reduce((sum, unit) => {
    return sum + unit.progress.sections.reading.timeSpent + 
           unit.progress.sections.practice.timeSpent + 
           unit.progress.sections.summary.timeSpent
  }, 0)
  
  const averageScore = units
    .filter(unit => Object.keys(unit.progress.sections.practice.scores).length > 0)
    .reduce((sum, unit) => {
      const scores = Object.values(unit.progress.sections.practice.scores)
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      return sum + avgScore
    }, 0) / Math.max(1, units.filter(u => Object.keys(u.progress.sections.practice.scores).length > 0).length)
  
  return {
    totalUnits,
    completedUnits,
    inProgressUnits,
    notStartedUnits: totalUnits - completedUnits - inProgressUnits,
    totalTimeSpent: Math.round(totalTimeSpent),
    averageScore: Math.round(averageScore || 0),
    completionRate: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0
  }
}

export const deleteCourseUnit = (id: string): boolean => {
  const coreData = getUserCoreData()
  const index = coreData.courseUnits.findIndex(u => u.id === id)
  if (index === -1) return false
  
  const unit = coreData.courseUnits[index]
  coreData.courseUnits.splice(index, 1)
  saveUserCoreData(coreData)
  
  // 记录事件
  addCoreEvent({
    type: 'course_unit_deleted',
    data: { unitId: id, nodeId: unit.nodeId, title: unit.title }
  })
  
  return true
}

// Agent 动作记录
export const recordAgentAction = (action: Omit<AgentAction, 'timestamp'>): AgentAction => {
  const coreData = getUserCoreData()
  
  const newAction: AgentAction = {
    timestamp: new Date().toISOString(),
    ...action
  }
  
  coreData.agentActions.push(newAction)
  saveUserCoreData(coreData)
  
  return newAction
}

export const getAgentActions = (): AgentAction[] => {
  const coreData = getUserCoreData()
  return coreData.agentActions
}

// 能力档案相关 - 直接从profile中获取ability assessment
export const getAbilityProfile = (): AbilityProfile | null => {
  const profile = getCurrentProfile()
  if (!profile) return null
  
  const assessment = getProfileData('abilityAssessment')
  if (!assessment) return null
  
  // 转换为AbilityProfile格式
  return {
    overallScore: assessment.overallScore || 0,
    dimensions: assessment.dimensions || {},
    lastAssessed: assessment.metadata?.assessmentDate || new Date().toISOString(),
    version: assessment.metadata?.version || '1.0.0'
  }
}

// 核心事件记录
export const addCoreEvent = (event: any): void => {
  const coreData = getUserCoreData()
  const newEvent = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...event
  }
  
  coreData.events.push(newEvent)
  
  // 保持事件记录不超过1000条
  if (coreData.events.length > 1000) {
    coreData.events = coreData.events.slice(-1000)
  }
  
  saveUserCoreData(coreData)
}

// 获取学习统计
export const getStudyStats = () => {
  const coreData = getUserCoreData()
  const completedNodes = coreData.paths.reduce((total, path) => {
    return total + path.nodes.filter(node => node.status === 'completed').length
  }, 0)
  
  return {
    totalHours: coreData.metadata.totalStudyTime || 0,
    completedUnits: completedNodes,
    streak: coreData.metadata.streakDays || 0
  }
}

// 简化的导出功能
export const exportLearningData = async (): Promise<string> => {
  try {
    const profile = getCurrentProfile()
    if (!profile) {
      throw new Error('No active profile found')
    }

    const coreData = getUserCoreData()
    const abilityProfile = getAbilityProfile()

    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      profile: {
        id: profile.id,
        name: profile.name,
        createdAt: profile.createdAt
      },
      abilityProfile,
      coreData,
      goals: coreData.goals,
      paths: coreData.paths,
      courses: coreData.courseUnits,
      agents: coreData.agentActions
    }

    return JSON.stringify(exportData, null, 2)
  } catch (err) {
    error('[coreData] Failed to export learning data:', err)
    throw err
  }
}

// 其他需要的导出
export const coreData = getUserCoreData()
