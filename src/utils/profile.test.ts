import { describe, it, expect, beforeEach } from 'vitest'
import {
  createProfile,
  setCurrentProfile,
  getCurrentProfile,
  changePassword,
  verifyPassword
} from './profile'

describe('Profile Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('changePassword', () => {
    it('should change password with correct old password', () => {
      const profile = createProfile('test-user', 'oldpass123')
      setCurrentProfile(profile.id)
      
      const result = changePassword(profile.id, 'oldpass123', 'newpass456')
      expect(result).toBe(true)
      
      // 验证新密码
      expect(verifyPassword(profile.id, 'newpass456')).toBe(true)
      expect(verifyPassword(profile.id, 'oldpass123')).toBe(false)
    })
    
    it('should fail with incorrect old password', () => {
      const profile = createProfile('test-user', 'correctpass')
      
      const result = changePassword(profile.id, 'wrongpass', 'newpass')
      expect(result).toBe(false)
      
      // 密码应该保持不变
      expect(verifyPassword(profile.id, 'correctpass')).toBe(true)
    })
    
    it('should remove password protection when new password is empty', () => {
      const profile = createProfile('test-user', 'oldpass')
      
      const result = changePassword(profile.id, 'oldpass', '')
      expect(result).toBe(true)
      
      // 验证密码已被移除
      expect(verifyPassword(profile.id, '')).toBe(true)
    })
    
    it('should add password to profile without password', () => {
      const profile = createProfile('test-user') // 无密码
      
      const result = changePassword(profile.id, '', 'newpass')
      expect(result).toBe(true)
      
      // 验证新密码
      expect(verifyPassword(profile.id, 'newpass')).toBe(true)
    })
    
    it('should return false for non-existent profile', () => {
      const result = changePassword('non-existent-id', 'pass', 'newpass')
      expect(result).toBe(false)
    })
  })
}) 