/**
 * 学习系统状态
 */
export interface LearningSystemStatus {
  setupComplete: boolean
  currentPhase: 'assessment' | 'goal_setting' | 'path_planning' | 'learning' | 'review'
  progress: {
    hasAbilityProfile: boolean
    activeGoals: number
    activePaths: number
    completedNodes: number
    totalNodes: number
    overallProgress: number
  }
  recommendations: string[]
  nextActions: string[]
  systemHealth: {
    dataIntegrity: boolean
    lastSyncTime: string
    coreDataSize: number
    missingData: string[]
  }
}

/**
 * 智能推荐结果
 */
export interface SmartRecommendations {
  needsAbilityAssessment: boolean
  needsGoalSetting: boolean
  needsPathGeneration: boolean
  recommendations: string[]
}

/**
 * 数据同步验证结果
 */
export interface DataSyncValidation {
  isValid: boolean
  issues: string[]
  recommendations: string[]
  autoFixResults?: any[]
}

/**
 * 数据同步修复结果
 */
export interface DataSyncFixResult {
  success: boolean
  fixedIssues: string[]
  failedFixes: string[]
  summary: string
}

/**
 * 强制同步结果
 */
export interface ForceSyncResult {
  success: boolean
  syncedItems: string[]
  errors: string[]
} 