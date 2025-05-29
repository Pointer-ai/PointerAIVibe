import { log } from '../../utils/logger'

/**
 * 生成课程内容
 */
export const generateLesson = async (topic: string): Promise<string> => {
  log(`[courseContent] Generating lesson for topic: ${topic}`)
  // TODO: 实现课程生成逻辑
  return '课程内容占位'
}

/**
 * 获取课程列表
 */
export const getLessons = (): string[] => {
  log('[courseContent] Getting lesson list')
  // TODO: 从存储中获取课程列表
  return []
} 