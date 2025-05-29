/**
 * 统一日志输出工具
 * 格式: [模块名] 消息内容
 */
export const log = (message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, ...args)
}

export const error = (message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ERROR: ${message}`, ...args)
}

export const warn = (message: string, ...args: unknown[]) => {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] WARN: ${message}`, ...args)
} 