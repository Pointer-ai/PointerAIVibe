export interface Profile {
  id: string
  name: string
  hasPassword: boolean
  passwordHash?: string
  createdAt: string
  lastLogin?: string
  avatar?: string // emoji 或颜色标识
  data: Record<string, any> // 该 profile 的所有数据
}

export interface ProfileStore {
  profiles: Profile[]
  currentProfileId: string | null
}

const PROFILE_STORE_KEY = 'pointer_ai_profiles'

// 简单的哈希函数，用于密码存储（注意：这不是安全的加密方式，仅用于演示）
const simpleHash = (text: string): string => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// 获取所有 profiles
export const getProfiles = (): Profile[] => {
  const store = localStorage.getItem(PROFILE_STORE_KEY)
  if (!store) return []
  const profileStore: ProfileStore = JSON.parse(store)
  return profileStore.profiles || []
}

// 获取当前 profile ID
export const getCurrentProfileId = (): string | null => {
  const store = localStorage.getItem(PROFILE_STORE_KEY)
  if (!store) return null
  const profileStore: ProfileStore = JSON.parse(store)
  return profileStore.currentProfileId
}

// 获取当前 profile
export const getCurrentProfile = (): Profile | null => {
  const profileId = getCurrentProfileId()
  if (!profileId) return null
  const profiles = getProfiles()
  return profiles.find(p => p.id === profileId) || null
}

// 创建新 profile
export const createProfile = (name: string, password?: string, avatar?: string): Profile => {
  const profiles = getProfiles()
  const newProfile: Profile = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    name,
    hasPassword: !!password,
    passwordHash: password ? simpleHash(password) : undefined,
    createdAt: new Date().toISOString(),
    avatar: avatar || '👤',
    data: {}
  }
  
  profiles.push(newProfile)
  saveProfiles(profiles)
  return newProfile
}

// 删除 profile
export const deleteProfile = (profileId: string): void => {
  const profiles = getProfiles().filter(p => p.id !== profileId)
  const currentId = getCurrentProfileId()
  
  saveProfiles(profiles)
  
  // 如果删除的是当前 profile，清除当前选择
  if (currentId === profileId) {
    setCurrentProfile(null)
  }
}

// 验证密码
export const verifyPassword = (profileId: string, password: string): boolean => {
  const profile = getProfiles().find(p => p.id === profileId)
  if (!profile || !profile.hasPassword) return true
  return profile.passwordHash === simpleHash(password)
}

// 设置当前 profile
export const setCurrentProfile = (profileId: string | null): void => {
  const store = localStorage.getItem(PROFILE_STORE_KEY)
  const profileStore: ProfileStore = store ? JSON.parse(store) : { profiles: [], currentProfileId: null }
  
  profileStore.currentProfileId = profileId
  
  // 更新最后登录时间
  if (profileId) {
    const profile = profileStore.profiles.find(p => p.id === profileId)
    if (profile) {
      profile.lastLogin = new Date().toISOString()
    }
  }
  
  localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(profileStore))
}

// 保存 profiles
const saveProfiles = (profiles: Profile[]): void => {
  const store = localStorage.getItem(PROFILE_STORE_KEY)
  const profileStore: ProfileStore = store ? JSON.parse(store) : { profiles: [], currentProfileId: null }
  profileStore.profiles = profiles
  localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(profileStore))
}

// 获取 profile 数据
export const getProfileData = (key: string): any => {
  const profile = getCurrentProfile()
  if (!profile) return null
  return profile.data[key]
}

// 设置 profile 数据
export const setProfileData = (key: string, value: any): void => {
  const profiles = getProfiles()
  const currentId = getCurrentProfileId()
  if (!currentId) return
  
  const profileIndex = profiles.findIndex(p => p.id === currentId)
  if (profileIndex === -1) return
  
  profiles[profileIndex].data[key] = value
  saveProfiles(profiles)
}

// 更新 profile 设置
export const updateProfile = (profileId: string, updates: Partial<Profile>): void => {
  const profiles = getProfiles()
  const profileIndex = profiles.findIndex(p => p.id === profileId)
  if (profileIndex === -1) return
  
  profiles[profileIndex] = { ...profiles[profileIndex], ...updates }
  saveProfiles(profiles)
}

// 修改密码
export const changePassword = (profileId: string, oldPassword: string, newPassword: string): boolean => {
  const profiles = getProfiles()
  const profile = profiles.find(p => p.id === profileId)
  
  if (!profile) return false
  
  // 如果有旧密码，验证旧密码
  if (profile.hasPassword && profile.passwordHash !== simpleHash(oldPassword)) {
    return false
  }
  
  // 更新密码
  const profileIndex = profiles.findIndex(p => p.id === profileId)
  profiles[profileIndex] = {
    ...profile,
    hasPassword: !!newPassword,
    passwordHash: newPassword ? simpleHash(newPassword) : undefined
  }
  
  saveProfiles(profiles)
  return true
}

// 退出登录
export const logout = (): void => {
  setCurrentProfile(null)
} 