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

// ========== 数据关联关系管理功能 ==========

/**
 * 数据关联关系管理功能
 * 支持 Goal -> Path -> Node -> CourseUnit 的层级依赖
 */

// 为目标添加路径关联
export const linkPathToGoal = (goalId: string, pathId: string): boolean => {
  const coreData = getUserCoreData()
  
  const goal = coreData.goals.find(g => g.id === goalId)
  const path = coreData.paths.find(p => p.id === pathId)
  
  if (!goal || !path) return false
  
  // 更新目标的路径关联
  if (!goal.pathIds) goal.pathIds = []
  if (!goal.pathIds.includes(pathId)) {
    goal.pathIds.push(pathId)
  }
  
  // 更新路径的来源目标关联
  path.sourceGoalId = goalId
  
  saveUserCoreData(coreData)
  
  addCoreEvent({
    type: 'goal_path_linked',
    data: { goalId, pathId, goalTitle: goal.title, pathTitle: path.title }
  })
  
  return true
}

// 为节点添加课程内容关联
export const linkCourseUnitToNode = (pathId: string, nodeId: string, courseUnitId: string): boolean => {
  const coreData = getUserCoreData()
  
  const path = coreData.paths.find(p => p.id === pathId)
  const courseUnit = coreData.courseUnits.find(c => c.id === courseUnitId)
  
  if (!path || !courseUnit) return false
  
  const node = path.nodes.find(n => n.id === nodeId)
  if (!node) return false
  
  // 更新节点的课程内容关联
  if (!node.courseUnitIds) node.courseUnitIds = []
  if (!node.courseUnitIds.includes(courseUnitId)) {
    node.courseUnitIds.push(courseUnitId)
  }
  
  // 更新课程内容的来源关联
  courseUnit.sourcePathId = pathId
  courseUnit.sourceNodeId = nodeId
  
  saveUserCoreData(coreData)
  
  addCoreEvent({
    type: 'node_courseunit_linked',
    data: { pathId, nodeId, courseUnitId, nodeTitle: node.title, unitTitle: courseUnit.title }
  })
  
  return true
}

// 移除路径与目标的关联
export const unlinkPathFromGoal = (goalId: string, pathId: string): boolean => {
  const coreData = getUserCoreData()
  
  const goal = coreData.goals.find(g => g.id === goalId)
  const path = coreData.paths.find(p => p.id === pathId)
  
  if (!goal || !path) return false
  
  // 移除目标的路径关联
  if (goal.pathIds) {
    goal.pathIds = goal.pathIds.filter(id => id !== pathId)
  }
  
  // 移除路径的来源目标关联
  delete path.sourceGoalId
  
  saveUserCoreData(coreData)
  
  addCoreEvent({
    type: 'goal_path_unlinked',
    data: { goalId, pathId, goalTitle: goal.title, pathTitle: path.title }
  })
  
  return true
}

// 移除课程内容与节点的关联
export const unlinkCourseUnitFromNode = (pathId: string, nodeId: string, courseUnitId: string): boolean => {
  const coreData = getUserCoreData()
  
  const path = coreData.paths.find(p => p.id === pathId)
  const courseUnit = coreData.courseUnits.find(c => c.id === courseUnitId)
  
  if (!path || !courseUnit) return false
  
  const node = path.nodes.find(n => n.id === nodeId)
  if (!node) return false
  
  // 移除节点的课程内容关联
  if (node.courseUnitIds) {
    node.courseUnitIds = node.courseUnitIds.filter(id => id !== courseUnitId)
  }
  
  // 移除课程内容的来源关联
  delete courseUnit.sourcePathId
  delete courseUnit.sourceNodeId
  
  saveUserCoreData(coreData)
  
  addCoreEvent({
    type: 'node_courseunit_unlinked',
    data: { pathId, nodeId, courseUnitId, nodeTitle: node.title, unitTitle: courseUnit.title }
  })
  
  return true
}

// 获取目标的所有关联路径
export const getPathsByGoal = (goalId: string): LearningPath[] => {
  const coreData = getUserCoreData()
  
  // 通过两种方式查找：pathIds和goalId字段
  const pathsByPathIds = coreData.paths.filter(path => {
    const goal = coreData.goals.find(g => g.id === goalId)
    return goal?.pathIds?.includes(path.id)
  })
  
  const pathsByGoalId = coreData.paths.filter(path => path.goalId === goalId)
  
  // 合并并去重
  const allPaths = [...pathsByPathIds, ...pathsByGoalId]
  const uniquePaths = allPaths.filter((path, index, arr) => 
    arr.findIndex(p => p.id === path.id) === index
  )
  
  return uniquePaths
}

// 获取路径的来源目标
export const getGoalByPath = (pathId: string): LearningGoal | null => {
  const coreData = getUserCoreData()
  const path = coreData.paths.find(p => p.id === pathId)
  
  if (!path) return null
  
  // 优先使用sourceGoalId，回退到goalId
  const goalId = path.sourceGoalId || path.goalId
  return coreData.goals.find(g => g.id === goalId) || null
}

// 获取节点的所有关联课程内容
export const getCourseUnitsByNodeId = (pathId: string, nodeId: string): CourseUnit[] => {
  const coreData = getUserCoreData()
  const path = coreData.paths.find(p => p.id === pathId)
  
  if (!path) return []
  
  const node = path.nodes.find(n => n.id === nodeId)
  if (!node) return []
  
  // 通过两种方式查找：courseUnitIds和nodeId字段
  const unitsByIds = node.courseUnitIds ? 
    coreData.courseUnits.filter(unit => node.courseUnitIds!.includes(unit.id)) : []
  
  const unitsByNodeId = coreData.courseUnits.filter(unit => unit.nodeId === nodeId)
  
  // 合并并去重
  const allUnits = [...unitsByIds, ...unitsByNodeId]
  const uniqueUnits = allUnits.filter((unit, index, arr) => 
    arr.findIndex(u => u.id === unit.id) === index
  )
  
  return uniqueUnits.map(ensureUnitProgress)
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0))
}

// 获取课程内容的来源节点和路径
export const getSourceByUri = (courseUnitId: string): { 
  path: LearningPath | null, 
  node: PathNode | null 
} => {
  const coreData = getUserCoreData()
  const courseUnit = coreData.courseUnits.find(c => c.id === courseUnitId)
  
  if (!courseUnit) return { path: null, node: null }
  
  // 优先使用sourcePathId，回退到nodeId查找
  let path: LearningPath | null = null
  let node: PathNode | null = null
  
  if (courseUnit.sourcePathId) {
    path = coreData.paths.find(p => p.id === courseUnit.sourcePathId) || null
    if (path && courseUnit.sourceNodeId) {
      node = path.nodes.find(n => n.id === courseUnit.sourceNodeId) || null
    }
  } else if (courseUnit.nodeId) {
    // 回退：通过nodeId在所有路径中查找
    for (const p of coreData.paths) {
      const n = p.nodes.find(n => n.id === courseUnit.nodeId)
      if (n) {
        path = p
        node = n
        break
      }
    }
  }
  
  return { path, node }
}

// 同步关联关系（清理无效关联）
export const syncDataRelationships = (): {
  removedLinks: string[]
  errors: string[]
} => {
  const coreData = getUserCoreData()
  const removedLinks: string[] = []
  const errors: string[] = []
  
  try {
    // 清理目标中的无效路径关联
    coreData.goals.forEach(goal => {
      if (goal.pathIds) {
        const validPathIds = goal.pathIds.filter(pathId => 
          coreData.paths.some(p => p.id === pathId)
        )
        
        if (validPathIds.length !== goal.pathIds.length) {
          const removedPaths = goal.pathIds.filter(id => !validPathIds.includes(id))
          removedLinks.push(`Goal ${goal.title}: removed invalid path links ${removedPaths.join(', ')}`)
          goal.pathIds = validPathIds
        }
      }
    })
    
    // 清理路径中的无效目标关联
    coreData.paths.forEach(path => {
      if (path.sourceGoalId && !coreData.goals.some(g => g.id === path.sourceGoalId)) {
        removedLinks.push(`Path ${path.title}: removed invalid goal link ${path.sourceGoalId}`)
        delete path.sourceGoalId
      }
    })
    
    // 清理节点中的无效课程内容关联
    coreData.paths.forEach(path => {
      path.nodes.forEach(node => {
        if (node.courseUnitIds) {
          const validUnitIds = node.courseUnitIds.filter(unitId =>
            coreData.courseUnits.some(u => u.id === unitId)
          )
          
          if (validUnitIds.length !== node.courseUnitIds.length) {
            const removedUnits = node.courseUnitIds.filter(id => !validUnitIds.includes(id))
            removedLinks.push(`Node ${node.title}: removed invalid course unit links ${removedUnits.join(', ')}`)
            node.courseUnitIds = validUnitIds
          }
        }
      })
    })
    
    // 清理课程内容中的无效来源关联
    coreData.courseUnits.forEach(unit => {
      if (unit.sourcePathId && !coreData.paths.some(p => p.id === unit.sourcePathId)) {
        removedLinks.push(`CourseUnit ${unit.title}: removed invalid path link ${unit.sourcePathId}`)
        delete unit.sourcePathId
      }
      
      if (unit.sourceNodeId && unit.sourcePathId) {
        const path = coreData.paths.find(p => p.id === unit.sourcePathId)
        if (path && !path.nodes.some(n => n.id === unit.sourceNodeId)) {
          removedLinks.push(`CourseUnit ${unit.title}: removed invalid node link ${unit.sourceNodeId}`)
          delete unit.sourceNodeId
        }
      }
    })
    
    if (removedLinks.length > 0) {
      saveUserCoreData(coreData)
      
      addCoreEvent({
        type: 'data_relationships_synced',
        data: { removedLinks, errors }
      })
    }
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    errors.push(`Sync error: ${errorMsg}`)
  }
  
  return { removedLinks, errors }
}

// 获取完整的学习层次结构
export const getLearningHierarchy = (): {
  goals: Array<{
    goal: LearningGoal
    paths: Array<{
      path: LearningPath
      nodes: Array<{
        node: PathNode
        courseUnits: CourseUnit[]
      }>
    }>
  }>
} => {
  const coreData = getUserCoreData()
  
  return {
    goals: coreData.goals.map(goal => ({
      goal,
      paths: getPathsByGoal(goal.id).map(path => ({
        path,
        nodes: path.nodes.map(node => ({
          node,
          courseUnits: getCourseUnitsByNodeId(path.id, node.id)
        }))
      }))
    }))
  }
}

// 获取数据关联统计
export const getRelationshipStats = (): {
  totalGoals: number
  goalsWithPaths: number
  totalPaths: number
  pathsWithGoals: number
  totalNodes: number
  nodesWithCourseUnits: number
  totalCourseUnits: number
  courseUnitsWithSources: number
  orphanedPaths: number
  orphanedCourseUnits: number
} => {
  const coreData = getUserCoreData()
  
  const totalGoals = coreData.goals.length
  const goalsWithPaths = coreData.goals.filter(g => g.pathIds && g.pathIds.length > 0).length
  
  const totalPaths = coreData.paths.length
  const pathsWithGoals = coreData.paths.filter(p => 
    p.sourceGoalId || p.goalId || coreData.goals.some(g => g.pathIds?.includes(p.id))
  ).length
  
  const totalNodes = coreData.paths.reduce((sum, path) => sum + path.nodes.length, 0)
  const nodesWithCourseUnits = coreData.paths.reduce((sum, path) => 
    sum + path.nodes.filter(n => n.courseUnitIds && n.courseUnitIds.length > 0).length, 0
  )
  
  const totalCourseUnits = coreData.courseUnits.length
  const courseUnitsWithSources = coreData.courseUnits.filter(u => 
    u.sourcePathId || u.sourceNodeId || 
    coreData.paths.some(p => p.nodes.some(n => n.courseUnitIds?.includes(u.id)))
  ).length
  
  const orphanedPaths = totalPaths - pathsWithGoals
  const orphanedCourseUnits = totalCourseUnits - courseUnitsWithSources
  
  return {
    totalGoals,
    goalsWithPaths,
    totalPaths,
    pathsWithGoals,
    totalNodes,
    nodesWithCourseUnits,
    totalCourseUnits,
    courseUnitsWithSources,
    orphanedPaths,
    orphanedCourseUnits
  }
}

// 新增：批量关联管理功能
export const createLearningPathWithGoalLink = (
  path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>,
  goalId: string
): LearningPath => {
  // 确保goalId有效
  const goal = getLearningGoals().find(g => g.id === goalId)
  if (!goal) {
    throw new Error('指定的学习目标不存在')
  }
  
  // 创建路径并自动关联
  const newPath = createLearningPath({
    ...path,
    goalId: goalId,
    sourceGoalId: goalId
  })
  
  // 更新目标的pathIds
  linkPathToGoal(goalId, newPath.id)
  
  return newPath
}

export const createCourseUnitWithNodeLink = (
  unit: Omit<CourseUnit, 'id' | 'createdAt' | 'updatedAt' | 'progress'>,
  pathId: string,
  nodeId: string
): CourseUnit => {
  // 验证路径和节点存在
  const path = getLearningPaths().find(p => p.id === pathId)
  if (!path) {
    throw new Error('指定的学习路径不存在')
  }
  
  const node = path.nodes.find(n => n.id === nodeId)
  if (!node) {
    throw new Error('指定的路径节点不存在')
  }
  
  // 创建课程单元并自动关联
  const newUnit = createCourseUnit({
    ...unit,
    nodeId: nodeId,
    sourcePathId: pathId,
    sourceNodeId: nodeId
  })
  
  // 更新节点的courseUnitIds
  linkCourseUnitToNode(pathId, nodeId, newUnit.id)
  
  return newUnit
}

// 新增：关联关系验证功能
export const validateDataRelationships = (): {
  isValid: boolean
  issues: Array<{
    type: 'missing_goal' | 'missing_path' | 'missing_node' | 'orphaned_path' | 'orphaned_unit'
    id: string
    description: string
    severity: 'warning' | 'error'
  }>
  suggestions: string[]
} => {
  const coreData = getUserCoreData()
  const issues: any[] = []
  const suggestions: string[] = []
  
  // 检查路径的目标关联
  coreData.paths.forEach(path => {
    if (path.goalId && !coreData.goals.find(g => g.id === path.goalId)) {
      issues.push({
        type: 'missing_goal',
        id: path.id,
        description: `路径 "${path.title}" 关联的目标 ${path.goalId} 不存在`,
        severity: 'error'
      })
    }
    
    if (!path.goalId && !path.sourceGoalId) {
      issues.push({
        type: 'orphaned_path',
        id: path.id,
        description: `路径 "${path.title}" 没有关联任何目标`,
        severity: 'warning'
      })
    }
  })
  
  // 检查课程单元的节点关联
  coreData.courseUnits.forEach(unit => {
    if (unit.nodeId) {
      const parentPath = coreData.paths.find(p => 
        p.nodes.some(n => n.id === unit.nodeId)
      )
      
      if (!parentPath) {
        issues.push({
          type: 'missing_node',
          id: unit.id,
          description: `课程单元 "${unit.title}" 关联的节点 ${unit.nodeId} 不存在`,
          severity: 'error'
        })
      }
    } else {
      issues.push({
        type: 'orphaned_unit',
        id: unit.id,
        description: `课程单元 "${unit.title}" 没有关联任何节点`,
        severity: 'warning'
      })
    }
  })
  
  // 生成修复建议
  if (issues.some(i => i.type === 'orphaned_path')) {
    suggestions.push('考虑为孤立的学习路径创建对应的学习目标')
  }
  if (issues.some(i => i.type === 'orphaned_unit')) {
    suggestions.push('为孤立的课程单元分配到合适的学习路径节点')
  }
  if (issues.some(i => i.severity === 'error')) {
    suggestions.push('运行数据同步功能清理无效关联')
  }
  
  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    suggestions
  }
}

// 新增：智能关联建议功能
export const getRelationshipSuggestions = (): {
  pathSuggestions: Array<{
    goalId: string
    goalTitle: string
    reason: string
    recommendedPaths: Array<{
      title: string
      description: string
      estimatedHours: number
    }>
  }>
  unitSuggestions: Array<{
    pathId: string
    pathTitle: string
    nodeId: string
    nodeTitle: string
    reason: string
    recommendedUnits: Array<{
      title: string
      type: CourseUnit['type']
      description: string
    }>
  }>
  autoFix: Array<{
    type: 'link_path_to_goal' | 'link_courseunit_to_node'
    goalId?: string
    pathId?: string
    nodeId?: string
    courseUnitId?: string
    confidence: number
  }>
} => {
  const coreData = getUserCoreData()
  const pathSuggestions: any[] = []
  const unitSuggestions: any[] = []
  const autoFix: any[] = []
  
  // 为没有路径的目标生成路径建议
  coreData.goals.forEach(goal => {
    const hasRelatedPaths = coreData.paths.some(p => 
      p.sourceGoalId === goal.id || 
      p.goalId === goal.id || 
      goal.pathIds?.includes(p.id)
    )
    
    if (!hasRelatedPaths && goal.status === 'active') {
      // 基于目标标题和描述生成路径建议
      const keywords = goal.title.toLowerCase()
      let recommendedPaths: any[] = []
      
      if (keywords.includes('javascript') || keywords.includes('js')) {
        recommendedPaths = [
          {
            title: 'JavaScript基础语法',
            description: '掌握JavaScript核心语法和基本概念',
            estimatedHours: 40
          },
          {
            title: 'DOM操作与事件处理',
            description: '学习网页交互开发技术',
            estimatedHours: 30
          }
        ]
      } else if (keywords.includes('react')) {
        recommendedPaths = [
          {
            title: 'React基础入门',
            description: '学习React组件化开发',
            estimatedHours: 50
          },
          {
            title: 'React Hooks深入',
            description: '掌握现代React开发模式',
            estimatedHours: 35
          }
        ]
      } else if (keywords.includes('python')) {
        recommendedPaths = [
          {
            title: 'Python基础编程',
            description: '学习Python语法和编程思维',
            estimatedHours: 60
          },
          {
            title: 'Python数据分析',
            description: '使用pandas和numpy进行数据分析',
            estimatedHours: 45
          }
        ]
      } else {
        recommendedPaths = [
          {
            title: `${goal.title} - 基础学习路径`,
            description: `针对${goal.title}的入门学习计划`,
            estimatedHours: 40
          }
        ]
      }
      
      pathSuggestions.push({
        goalId: goal.id,
        goalTitle: goal.title,
        reason: '该目标尚未有相关的学习路径，建议创建学习计划',
        recommendedPaths
      })
    }
  })
  
  // 为空节点生成课程内容建议
  coreData.paths.forEach(path => {
    path.nodes.forEach(node => {
      const hasRelatedUnits = coreData.courseUnits.some(u => 
        u.sourceNodeId === node.id || 
        u.nodeId === node.id ||
        node.courseUnitIds?.includes(u.id)
      )
      
      if (!hasRelatedUnits) {
        // 基于节点标题生成课程建议
        const keywords = node.title.toLowerCase()
        let recommendedUnits: any[] = []
        
        if (keywords.includes('基础') || keywords.includes('入门')) {
          recommendedUnits = [
            {
              title: `${node.title} - 理论学习`,
              type: 'reading' as CourseUnit['type'],
              description: '阅读相关理论知识和概念'
            },
            {
              title: `${node.title} - 实践练习`,
              type: 'practice' as CourseUnit['type'],
              description: '通过练习巩固所学知识'
            }
          ]
        } else if (keywords.includes('项目') || keywords.includes('实战')) {
          recommendedUnits = [
            {
              title: `${node.title} - 项目规划`,
              type: 'reading' as CourseUnit['type'],
              description: '项目需求分析和技术选型'
            },
            {
              title: `${node.title} - 代码实现`,
              type: 'coding' as CourseUnit['type'],
              description: '完成项目核心功能开发'
            }
          ]
        } else {
          recommendedUnits = [
            {
              title: `${node.title} - 学习资料`,
              type: 'reading' as CourseUnit['type'],
              description: `关于${node.title}的学习内容`
            }
          ]
        }
        
        unitSuggestions.push({
          pathId: path.id,
          pathTitle: path.title,
          nodeId: node.id,
          nodeTitle: node.title,
          reason: '该节点没有相关的课程内容，建议添加学习材料',
          recommendedUnits
        })
      }
    })
  })
  
  // 生成自动修复建议
  // 查找可能的路径-目标匹配
  coreData.paths.forEach(path => {
    if (!path.sourceGoalId && !path.goalId) {
      // 尝试基于标题匹配找到合适的目标
      const matchingGoal = coreData.goals.find(goal => 
        goal.title.toLowerCase().includes(path.title.toLowerCase().substring(0, 10)) ||
        path.title.toLowerCase().includes(goal.title.toLowerCase().substring(0, 10))
      )
      
      if (matchingGoal) {
        autoFix.push({
          type: 'link_path_to_goal' as const,
          goalId: matchingGoal.id,
          pathId: path.id,
          confidence: 0.8
        })
      }
    }
  })
  
  // 查找可能的课程-节点匹配
  coreData.courseUnits.forEach(unit => {
    if (!unit.sourceNodeId && !unit.nodeId) {
      // 尝试基于标题匹配找到合适的节点
      for (const path of coreData.paths) {
        const matchingNode = path.nodes.find(node =>
          node.title.toLowerCase().includes(unit.title.toLowerCase().substring(0, 8)) ||
          unit.title.toLowerCase().includes(node.title.toLowerCase().substring(0, 8))
        )
        
        if (matchingNode) {
          autoFix.push({
            type: 'link_courseunit_to_node' as const,
            pathId: path.id,
            nodeId: matchingNode.id,
            courseUnitId: unit.id,
            confidence: 0.7
          })
          break
        }
      }
    }
  })
  
  return {
    pathSuggestions,
    unitSuggestions,
    autoFix: autoFix.filter(fix => fix.confidence >= 0.7) // 只返回高置信度的修复建议
  }
}

// 新增：批量数据操作功能
export const batchCreatePathsForGoal = async (
  goalId: string,
  pathConfigs: Array<{
    title: string
    description: string
    nodes: Omit<PathNode, 'id' | 'status' | 'progress' | 'courseUnitIds'>[]
  }>
): Promise<LearningPath[]> => {
  const goal = getLearningGoals().find(g => g.id === goalId)
  if (!goal) {
    throw new Error('指定的学习目标不存在')
  }
  
  const createdPaths: LearningPath[] = []
  
  for (const config of pathConfigs) {
    const nodesWithIds = config.nodes.map(node => ({
      ...node,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'not_started' as const,
      progress: 0,
      courseUnitIds: []
    }))
    
    const path = createLearningPathWithGoalLink({
      goalId,
      title: config.title,
      description: config.description,
      totalEstimatedHours: nodesWithIds.reduce((sum, node) => sum + node.estimatedHours, 0),
      nodes: nodesWithIds,
      dependencies: [],
      milestones: [],
      version: '1.0.0',
      status: 'draft'
    }, goalId)
    
    createdPaths.push(path)
  }
  
  return createdPaths
}

export const batchCreateUnitsForNode = async (
  pathId: string,
  nodeId: string,
  unitConfigs: Array<{
    title: string
    description: string
    type: CourseUnit['type']
    content: CourseUnit['content']
    metadata: CourseUnit['metadata']
  }>
): Promise<CourseUnit[]> => {
  const path = getLearningPaths().find(p => p.id === pathId)
  if (!path) {
    throw new Error('指定的学习路径不存在')
  }
  
  const node = path.nodes.find(n => n.id === nodeId)
  if (!node) {
    throw new Error('指定的路径节点不存在')
  }
  
  const createdUnits: CourseUnit[] = []
  
  for (const config of unitConfigs) {
    const unit = createCourseUnitWithNodeLink({
      nodeId,
      title: config.title,
      description: config.description,
      type: config.type,
      content: config.content,
      metadata: {
        ...config.metadata,
        order: createdUnits.length
      },
      sourcePathId: pathId,
      sourceNodeId: nodeId
    }, pathId, nodeId)
    
    createdUnits.push(unit)
  }
  
  return createdUnits
}
