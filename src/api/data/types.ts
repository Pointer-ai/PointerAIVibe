/**
 * Learning API 数据层核心类型定义
 * 整合原有的各种数据类型，提供统一的数据结构
 */

// ========== 核心数据类型 ==========

export interface CoreData {
  events: CoreDataEvent[]
  abilityProfile?: AbilityProfile
  goals: LearningGoal[]
  paths: LearningPath[]
  courseUnits: CourseUnit[]
  agentActions: AgentAction[]
  metadata: {
    version: string
    lastUpdated: string
    totalStudyTime: number
    streakDays: number
  }
}

export interface CoreDataEvent {
  id: string
  type: string
  timestamp: string
  data: any
  metadata?: any
}

// ========== 学习目标相关 ==========

export interface LearningGoal {
  id: string
  title: string
  description: string
  category: 'frontend' | 'backend' | 'fullstack' | 'automation' | 'ai' | 'mobile' | 'game' | 'data' | 'custom'
  priority: number
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  createdAt: string
  updatedAt: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
}

export interface GoalStats {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  averageCompletionWeeks: number
}

export interface CreateGoalData {
  title: string
  description: string
  category: LearningGoal['category']
  priority: number
  targetLevel: LearningGoal['targetLevel']
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
}

// ========== 学习路径相关 ==========

export interface LearningPath {
  id: string
  goalId: string
  title: string
  description: string
  totalEstimatedHours: number
  nodes: PathNode[]
  dependencies: { from: string; to: string }[]
  milestones: {
    id: string
    title: string
    nodeIds: string[]
    reward?: string
  }[]
  createdAt: string
  updatedAt: string
  version: string
  status: 'draft' | 'active' | 'completed' | 'archived' | 'frozen' | 'paused'
}

export interface PathNode {
  id: string
  title: string
  description: string
  type: 'concept' | 'practice' | 'project' | 'assessment' | 'milestone'
  estimatedMinutes: number
  difficulty: number
  skills: string[]
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  completedAt?: string
}

export interface PathStats {
  total: number
  byStatus: Record<string, number>
  totalEstimatedHours: number
  averageProgress: number
}

export interface CreatePathData {
  goalId: string
  title: string
  description: string
  config?: PathGenerationConfig
}

export interface PathGenerationConfig {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'balanced'
  timePreference: 'intensive' | 'moderate' | 'relaxed'
  difficultyProgression: 'linear' | 'adaptive' | 'challenging'
  includeProjects: boolean
  includeMilestones: boolean
}

// ========== 课程内容相关 ==========

export interface CourseUnit {
  id: string
  nodeId: string
  title: string
  description: string
  type: 'theory' | 'example' | 'exercise' | 'project' | 'quiz'
  content: {
    markdown?: string
    code?: string
    quiz?: any[]
    project?: any
  }
  metadata: {
    difficulty: number
    estimatedTime: number
    keywords: string[]
    learningObjectives: string[]
  }
  createdAt: string
  updatedAt: string
}

export interface ContentStats {
  total: number
  byType: Record<string, number>
  totalEstimatedTime: number
  averageDifficulty: number
}

export interface CreateContentData {
  nodeId: string
  title: string
  description: string
  type: CourseUnit['type']
  content: CourseUnit['content']
  metadata: CourseUnit['metadata']
}

// ========== 能力评估相关 ==========

export interface AbilityProfile {
  id: string
  overallScore: number
  dimensions: Record<string, {
    score: number
    weight: number
    details: any
  }>
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  lastUpdated: string
  confidence: number
}

export interface AssessmentInput {
  type: 'questionnaire' | 'resume' | 'code_review' | 'interview'
  content: any
  metadata?: any
}

export interface AssessmentResult {
  overallScore: number
  dimensions: Record<string, any>
  report: {
    summary: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
  metadata: {
    confidence: number
    assessmentDate: string
    version: string
  }
}

// ========== Agent相关 ==========

export interface AgentAction {
  id: string
  type: string
  params: any
  result: any
  timestamp: string
  success: boolean
}

export interface AgentInteraction {
  id: string
  timestamp: string
  userMessage: string
  agentResponse: string
  toolsUsed: string[]
  context: any
}

// ========== 存储相关 ==========

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  clear(): Promise<void>
}

export interface SyncResult {
  success: boolean
  syncedItems: string[]
  errors: string[]
  timestamp: string
}

// ========== 系统状态相关 ==========

export interface SystemStatus {
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

// ========== 数据验证相关 ==========

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// ========== 工具函数类型 ==========

export type DataHandler<T, CreateData = Partial<T>, UpdateData = Partial<T>> = {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(data: CreateData): Promise<T>
  update(id: string, updates: UpdateData): Promise<T>
  delete(id: string): Promise<boolean>
  validate(data: any): ValidationResult
  getStats(): Promise<any>
} 