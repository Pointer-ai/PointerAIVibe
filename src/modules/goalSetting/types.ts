import { LearningGoal } from '../coreData/types'

// 目标设定相关的接口扩展
export interface GoalSettingState {
  currentStep: 'welcome' | 'categories' | 'details' | 'questionnaire' | 'confirmation'
  selectedCategories: string[]
  goalDetails: Partial<LearningGoal>
  questionnaireAnswers: Record<string, any>
  isProcessing: boolean
}

export interface GoalCategory {
  id: string
  name: string
  description: string
  icon: string
  popular: boolean
  skills: string[]
  estimatedTimeWeeks: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface GoalQuestionnaire {
  id: string
  question: string
  type: 'single' | 'multiple' | 'scale' | 'text'
  options?: string[]
  required: boolean
  category?: string
}

// 目标推荐结果
export interface GoalRecommendation {
  category: string
  title: string
  description: string
  priority: number
  reasoning: string
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
} 