import { log, error } from './logger'

// 定义本地存储数据结构
export interface UserProfile {
  name?: string
  email?: string
  resume?: string
  skills?: string[]
  level?: 'beginner' | 'intermediate' | 'advanced'
}

export interface LearningStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export interface Lesson {
  id: string
  title: string
  content: string
  code?: string
}

export interface LocalState {
  profile: UserProfile | null
  goal: string | null
  path: LearningStep[]
  lessons: Record<string, Lesson>
  apiConfig: {
    model: 'claude' | 'openai' | 'qwen'
    key: string
  }
}

const STORAGE_KEY = 'vibe-coding-edu'

/**
 * 获取完整状态
 */
export const getState = (): LocalState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return getDefaultState()
    }
    return JSON.parse(data)
  } catch (e) {
    error('[storage] Failed to parse state', e)
    return getDefaultState()
  }
}

/**
 * 保存完整状态
 */
export const setState = (state: LocalState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    log('[storage] State saved')
  } catch (e) {
    error('[storage] Failed to save state', e)
  }
}

/**
 * 部分更新状态
 */
export const updateState = (updates: Partial<LocalState>): void => {
  const current = getState()
  const newState = { ...current, ...updates }
  setState(newState)
}

/**
 * 清空所有数据
 */
export const clearState = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  log('[storage] State cleared')
}

/**
 * 获取默认状态
 */
const getDefaultState = (): LocalState => ({
  profile: null,
  goal: null,
  path: [],
  lessons: {},
  apiConfig: {
    model: 'openai',
    key: ''
  }
}) 