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
  
  const newGoal: LearningGoal = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...goal
  }
  
  coreData.goals.push(newGoal)
  saveUserCoreData(coreData)
  
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
  
  coreData.goals[index] = { 
    ...coreData.goals[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  }
  
  saveUserCoreData(coreData)
  return coreData.goals[index]
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
