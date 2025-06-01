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

// Profile同步Hook - 处理Profile切换时的状态同步

import { useEffect, useState, useCallback } from 'react'
import { refactorProfileService } from '../services/profileService'
import { syncManager } from '../services/syncManager'
import { Profile } from '../types/profile'

export interface UseProfileSyncResult {
  currentProfile: Profile | null
  isLoading: boolean
  isSyncing: boolean
  switchProfile: (id: string) => Promise<boolean>
  reloadProfile: () => void
}

/**
 * Profile同步Hook
 * 提供稳定的Profile状态管理和切换功能
 */
export const useProfileSync = (): UseProfileSyncResult => {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // 加载当前Profile
  const loadCurrentProfile = useCallback(() => {
    try {
      const profile = refactorProfileService.getCurrentProfile()
      setCurrentProfile(profile)
    } catch (error) {
      console.error('[useProfileSync] Failed to load current profile:', error)
      setCurrentProfile(null)
    }
  }, [])

  // Profile切换处理器
  const handleProfileSwitch = useCallback(() => {
    console.log('[useProfileSync] Profile switch detected, reloading...')
    loadCurrentProfile()
  }, [loadCurrentProfile])

  // 初始化和事件监听
  useEffect(() => {
    // 初始加载
    loadCurrentProfile()

    // 监听Profile切换事件
    refactorProfileService.addProfileSwitchListener(handleProfileSwitch)

    // 监听同步状态变化
    const syncStatusInterval = setInterval(() => {
      setIsSyncing(syncManager.isSyncing())
    }, 100)

    return () => {
      refactorProfileService.removeProfileSwitchListener(handleProfileSwitch)
      clearInterval(syncStatusInterval)
    }
  }, [handleProfileSwitch, loadCurrentProfile])

  // 切换Profile方法
  const switchProfile = useCallback(async (id: string): Promise<boolean> => {
    if (isLoading || isSyncing) {
      console.warn('[useProfileSync] Switch operation already in progress')
      return false
    }

    setIsLoading(true)

    try {
      const success = await refactorProfileService.switchProfile(id)
      if (success) {
        // Profile切换事件会自动触发状态更新
        console.log(`[useProfileSync] Profile switched to: ${id}`)
      }
      return success
    } catch (error) {
      console.error('[useProfileSync] Profile switch failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, isSyncing])

  // 手动重新加载Profile
  const reloadProfile = useCallback(() => {
    loadCurrentProfile()
  }, [loadCurrentProfile])

  return {
    currentProfile,
    isLoading,
    isSyncing,
    switchProfile,
    reloadProfile
  }
} 