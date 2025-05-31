import { LearningPath, PathNode } from '../coreData/types'

// 路径规划相关的接口扩展
export interface PathPlanState {
  currentStep: 'analysis' | 'generation' | 'review' | 'confirmation'
  selectedGoalId: string | null
  skillGapAnalysis: SkillGapAnalysis | null
  generatedPath: LearningPath | null
  isProcessing: boolean
}

export interface SkillGapAnalysis {
  currentLevel: number
  targetLevel: number
  gaps: SkillGap[]
  recommendations: string[]
  estimatedTimeWeeks: number
}

export interface SkillGap {
  skill: string
  currentLevel: number
  targetLevel: number
  gap: number
  priority: 'high' | 'medium' | 'low'
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

// 路径节点模板
export interface NodeTemplate {
  type: 'concept' | 'practice' | 'project' | 'assessment' | 'milestone'
  title: string
  description: string
  estimatedHours: number
  difficulty: 1 | 2 | 3 | 4 | 5
  prerequisites: string[]
  skills: string[]
  content: {
    theory?: string
    practice?: string
    project?: string
    assessment?: string
  }
} 