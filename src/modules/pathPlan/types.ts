import { LearningPath, PathNode, LearningGoal } from '../coreData/types'

// 路径规划相关的接口扩展
export interface PathPlanState {
  currentStep: 'analysis' | 'generation' | 'review' | 'confirmation'
  selectedGoalId: string | null
  skillGapAnalysis: SkillGapAnalysis | null
  generatedPath: LearningPath | null
  isProcessing: boolean
}

// 技能差距分析
export interface SkillGapAnalysis {
  hasAbilityData: boolean
  currentLevel?: number
  targetLevel?: number
  gaps?: SkillGap[] // 兼容旧格式
  skillGaps?: SkillGap[] // 新格式
  recommendations?: string[]
  estimatedTimeWeeks?: number
  confidence?: number // 新增：分析置信度
  analysisConfidence?: number // AI分析置信度
  personalizationLevel?: string // 新增：个性化程度
  fallbackUsed?: boolean // 是否使用了规则分析
  timestamp?: string
  contextUsed?: boolean
  
  // AI分析新增字段
  overallAssessment?: {
    currentLevel: number
    targetLevel: number
    gapSeverity: 'low' | 'medium' | 'high'
    readinessScore: number
    learningStyle: string
    personalizedInsights: string[]
  }
  
  personalizedRecommendations?: {
    leverageStrengths: string[]
    addressWeaknesses: string[]
    learningStyle: string[]
    timeManagement: string[]
    motivationTips: string[]
  }
  
  riskAssessment?: {
    challengingAreas: Array<{
      area: string
      reason: string
      mitigation: string
    }>
    successFactors: string[]
    fallbackPlan: string
  }
  
  learningPath?: {
    phaseStructure: Array<{
      phase: string
      duration: string
      focus: string
      skills: string[]
      rationale: string
    }>
    criticalMilestones: Array<{
      milestone: string
      timeframe: string
      deliverable: string
      successCriteria: string
    }>
  }
  
  summary?: {
    averageGap: number
    highPriorityCount: number
    estimatedWeeks: number
    totalEstimatedHours: number
    averageConfidence: number
  }
  
  nextSteps?: string[]
  confidenceLevel?: number
}

export interface SkillGap {
  skill: string
  currentLevel: number
  targetLevel: number
  gap: number
  priority: 'low' | 'medium' | 'high'
  learningOrder: number
  
  // AI分析新增字段
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  prerequisiteSkills?: string[]
  relatedStrengths?: string[]
  estimatedHours?: number
  learningStrategy?: string
  assessmentCriteria?: string
  practicalApplication?: string
}

// 路径生成配置
export interface PathGenerationConfig {
  learningStyle: 'theory-first' | 'practice-first' | 'balanced'
  timePreference: 'intensive' | 'moderate' | 'relaxed'
  difficultyProgression: 'linear' | 'exponential' | 'plateau'
  includeProjects: boolean
  includeMilestones: boolean
}

// 节点模板
export interface NodeTemplate {
  title: string
  description: string
  type: PathNode['type']
  estimatedHours: number
  difficulty: number
  skills: string[]
  prerequisites?: string[]
}

// 学习上下文（新增）
export interface LearningContext {
  abilityProfile: {
    overallScore: number
    overallLevel: string
    strengths: string[]
    weaknesses: string[]
    dimensions: {
      name: string
      score: number
      weight: number
      skills: {
        name: string
        score: number
        confidence: number
        isInferred: boolean
      }[]
    }[]
    assessmentDate: string
    confidence: number
  } | null
  currentGoal: LearningGoal | null
  learningHistory: {
    activeGoals: number
    completedGoals: number
    preferredCategories: string[]
    averageTimeInvestment: number
  }
  hasAbilityData: boolean
  timestamp: string
} 