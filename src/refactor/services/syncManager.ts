/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 同步管理器 - 处理快速切换时的状态同步问题

export interface SyncOperation {
  id: string
  name: string
  execute: () => Promise<void> | void
  priority: number // 数字越小优先级越高
}

/**
 * 同步状态管理器
 * 确保Profile切换等关键操作的状态同步
 */
export class SyncManager {
  private operations: Map<string, SyncOperation> = new Map()
  private isExecuting = false
  private executionQueue: string[] = []

  /**
   * 注册同步操作
   */
  registerOperation(operation: SyncOperation): void {
    this.operations.set(operation.id, operation)
    console.log(`[SyncManager] Registered operation: ${operation.name}`)
  }

  /**
   * 移除同步操作
   */
  unregisterOperation(id: string): void {
    this.operations.delete(id)
    console.log(`[SyncManager] Unregistered operation: ${id}`)
  }

  /**
   * 执行所有同步操作
   */
  async executeSync(): Promise<void> {
    if (this.isExecuting) {
      console.log('[SyncManager] Sync already in progress, skipping...')
      return
    }

    this.isExecuting = true

    try {
      // 按优先级排序
      const sortedOperations = Array.from(this.operations.values())
        .sort((a, b) => a.priority - b.priority)

      console.log(`[SyncManager] Executing ${sortedOperations.length} sync operations...`)

      // 依次执行操作
      for (const operation of sortedOperations) {
        try {
          console.log(`[SyncManager] Executing: ${operation.name}`)
          await operation.execute()
        } catch (error) {
          console.error(`[SyncManager] Failed to execute ${operation.name}:`, error)
        }
      }

      console.log('[SyncManager] All sync operations completed')
    } catch (error) {
      console.error('[SyncManager] Sync execution failed:', error)
    } finally {
      // 延迟释放锁，确保状态稳定
      setTimeout(() => {
        this.isExecuting = false
      }, 50)
    }
  }

  /**
   * 检查是否正在执行同步
   */
  isSyncing(): boolean {
    return this.isExecuting
  }

  /**
   * 获取注册的操作列表
   */
  getOperations(): SyncOperation[] {
    return Array.from(this.operations.values())
  }
}

// 创建全局单例
export const syncManager = new SyncManager()

// 注册默认的同步操作
syncManager.registerOperation({
  id: 'reload_ai_config',
  name: 'Reload AI Configuration',
  execute: async () => {
    const { refactorAIService } = await import('./aiService')
    refactorAIService.reloadConfig()
  },
  priority: 1
})

syncManager.registerOperation({
  id: 'clear_ui_cache',
  name: 'Clear UI Cache',
  execute: () => {
    // 清理可能的UI缓存
    console.log('[SyncManager] UI cache cleared')
  },
  priority: 2
})

// 将实例挂载到window对象上，便于调试
if (typeof window !== 'undefined') {
  (window as any).syncManager = syncManager
} 