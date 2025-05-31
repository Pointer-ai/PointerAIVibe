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
  currentLevel: number
  targetLevel: number
  gaps: SkillGap[]
  recommendations: string[]
  estimatedTimeWeeks: number
  confidence?: number // 新增：分析置信度
  personalizationLevel?: string // 新增：个性化程度
}

export interface SkillGap {
  skill: string
  currentLevel: number
  targetLevel: number
  gap: number
  priority: 'low' | 'medium' | 'high'
  learningOrder: number
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