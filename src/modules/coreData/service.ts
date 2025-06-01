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
    syncPathsWithGoalStatus(goalId, 'archived')
  }
  return result
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
export const createCourseUnit = (unit: Omit<CourseUnit, 'id' | 'createdAt' | 'updatedAt'>): CourseUnit => {
  const coreData = getUserCoreData()
  
  const newUnit: CourseUnit = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...unit
  }
  
  coreData.courseUnits.push(newUnit)
  saveUserCoreData(coreData)
  
  return newUnit
}

export const getCourseUnits = (): CourseUnit[] => {
  const coreData = getUserCoreData()
  return coreData.courseUnits
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
  return coreData.courseUnits[index]
}

export const deleteCourseUnit = (id: string): boolean => {
  const coreData = getUserCoreData()
  const index = coreData.courseUnits.findIndex(u => u.id === id)
  if (index === -1) return false
  
  coreData.courseUnits.splice(index, 1)
  saveUserCoreData(coreData)
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
