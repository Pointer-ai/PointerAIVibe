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

// Profile同步管理Hook

import { useState, useEffect, useCallback } from 'react'
import { learningApi } from '../../api'
import { syncManager } from '../services/syncManager'
import { Profile } from '../types/profile'

export interface ProfileSyncState {
  currentProfile: Profile | null
  isLoading: boolean
  error: string | null
  isSwitching: boolean
}

export interface ProfileSyncActions {
  switchProfile: (id: string) => Promise<boolean>
  refreshProfile: () => void
  clearError: () => void
}

/**
 * Profile同步管理Hook
 * 提供稳定的Profile状态管理和同步操作
 */
export function useProfileSync(): ProfileSyncState & ProfileSyncActions {
  const [state, setState] = useState<ProfileSyncState>({
    currentProfile: null,
    isLoading: true,
    error: null,
    isSwitching: false
  })

  /**
   * 加载当前Profile
   */
  const loadCurrentProfile = useCallback(() => {
    try {
      const response = learningApi.getCurrentProfile()
      if (response.success) {
        setState(prev => ({
          ...prev,
          currentProfile: response.data || null,
          isLoading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          currentProfile: null,
          isLoading: false,
          error: response.error || 'Failed to load profile'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        currentProfile: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [])

  /**
   * 处理Profile切换事件
   */
  const handleProfileSwitch = useCallback(() => {
    loadCurrentProfile()
  }, [loadCurrentProfile])

  /**
   * 切换Profile
   */
  const switchProfile = useCallback(async (id: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isSwitching: true, error: null }))
    
    try {
      const response = await learningApi.switchProfile(id)
      if (response.success) {
        // Profile切换成功，重新加载当前Profile
        loadCurrentProfile()
        // 执行同步操作
        await syncManager.executeSync()
        setState(prev => ({ ...prev, isSwitching: false }))
        return true
      } else {
        setState(prev => ({ 
          ...prev, 
          isSwitching: false,
          error: response.error || 'Profile切换失败'
        }))
        return false
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSwitching: false,
        error: error instanceof Error ? error.message : 'Profile切换失败'
      }))
      return false
    }
  }, [loadCurrentProfile])

  /**
   * 刷新Profile
   */
  const refreshProfile = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    loadCurrentProfile()
  }, [loadCurrentProfile])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // 初始加载
  useEffect(() => {
    loadCurrentProfile()
  }, [loadCurrentProfile])

  return {
    ...state,
    switchProfile,
    refreshProfile,
    clearError
  }
} 