import { LearningGoal } from '../coreData/types'

// 目标设定相关的接口扩展
export interface GoalSettingState {
  currentStep: 'welcome' | 'categories' | 'details' | 'questionnaire' | 'confirmation' | 'natural_language'
  selectedCategories: string[]
  goalDetails: Partial<LearningGoal>
  questionnaireAnswers: Record<string, any>
  isProcessing: boolean
  // 新增自然语言模式相关状态
  mode: 'form' | 'natural_language'
  naturalLanguageInput?: string
  aiGeneratedGoals?: ParsedGoalData[]
}

// 目标创建模式
export type GoalCreationMode = 'form' | 'natural_language'

// 自然语言输入接口
export interface NaturalLanguageInput {
  description: string           // 用户的工作描述或目标描述
  context?: string             // 可选的上下文信息
  urgency?: 'low' | 'medium' | 'high'  // 紧急程度
  timeframe?: string           // 期望的时间框架
}

// AI 解析后的目标数据
export interface ParsedGoalData {
  title: string
  description: string
  category: string
  priority: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  learningPath: LearningPathNode[]
  outcomes: string[]
  reasoning: string            // AI 生成此目标的理由
  confidence: number           // AI 对此解析的置信度 (0-1)
}

// 学习路径节点
export interface LearningPathNode {
  id: string
  title: string
  description: string
  type: 'theory' | 'practice' | 'project' | 'assessment'
  order: number
  estimatedHours: number
  prerequisites: string[]
  skills: string[]
  resources?: LearningResource[]
}

// 学习资源
export interface LearningResource {
  type: 'video' | 'article' | 'book' | 'course' | 'documentation' | 'practice'
  title: string
  url?: string
  description?: string
}

// AI 响应解析结果
export interface AIGoalParseResult {
  success: boolean
  goals: ParsedGoalData[]
  originalInput: string
  parseErrors?: string[]
  suggestions?: string[]       // AI 给出的补充建议
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