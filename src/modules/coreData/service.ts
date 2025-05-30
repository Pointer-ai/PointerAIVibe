import { getProfileData, setProfileData } from '../../utils/profile'
import { log } from '../../utils/logger'
import { CoreData, CoreDataEvent } from './types'

const CORE_DATA_KEY = 'coreData'

/**
 * 获取当前 Profile 的核心数据
 */
export const getCoreData = (): CoreData => {
  const data = getProfileData(CORE_DATA_KEY) as CoreData
  return data || { events: [] }
}

/**
 * 保存核心数据
 */
const saveCoreData = (data: CoreData): void => {
  setProfileData(CORE_DATA_KEY, data)
  log('[coreData] data saved')
}

/**
 * 新增核心事件
 */
export const addCoreEvent = (
  event: Omit<CoreDataEvent, 'id' | 'timestamp'>
): CoreDataEvent => {
  const current = getCoreData()
  const newEvent: CoreDataEvent = {
    ...event,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString()
  }
  current.events.unshift(newEvent)
  current.events = current.events.slice(0, 1000)
  saveCoreData(current)
  return newEvent
}

/**
 * 按类型获取事件列表
 */
export const getEventsByType = (type: string): CoreDataEvent[] => {
  return getCoreData().events.filter(e => e.type === type)
}

/**
 * 清空核心数据
 */
export const clearCoreData = (): void => {
  saveCoreData({ events: [] })
}
