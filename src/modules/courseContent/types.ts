import { CourseUnit } from '../coreData/types'

// 课程内容相关的接口扩展
export interface CourseContentState {
  currentUnit: CourseUnit | null
  currentStep: 'overview' | 'content' | 'practice' | 'assessment' | 'completed'
  progress: CourseProgress
  isGenerating: boolean
}

export interface CourseProgress {
  unitId: string
  completedSections: string[]
  currentSection: string | null
  score: number
  timeSpent: number // 分钟
  startedAt: string
  lastActivity: string
}

// 内容生成配置
export interface ContentGenerationConfig {
  contentType: 'theory' | 'example' | 'exercise' | 'project' | 'quiz'
  difficulty: 1 | 2 | 3 | 4 | 5
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  includeExamples: boolean
  includeExercises: boolean
  language: 'chinese' | 'english'
}

// 练习题类型
export interface Exercise {
  id: string
  type: 'coding' | 'multiple-choice' | 'fill-blank' | 'essay' | 'diagram'
  title: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number // 分钟
  content: {
    question: string
    options?: string[]
    correctAnswer?: string | string[]
    code?: {
      starter: string
      solution: string
      language: string
      tests: string
    }
    hints?: string[]
    explanation?: string
  }
  metadata: {
    skills: string[]
    concepts: string[]
    prerequisites: string[]
  }
}

// 项目模板
export interface ProjectTemplate {
  id: string
  title: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedHours: number
  category: string
  technologies: string[]
  requirements: string[]
  deliverables: string[]
  evaluation: {
    criteria: string[]
    rubric: { [key: string]: number }
  }
  resources: {
    type: 'tutorial' | 'reference' | 'example' | 'tool'
    title: string
    url?: string
    description: string
  }[]
}

// 评估结果
export interface AssessmentResult {
  unitId: string
  exerciseId?: string
  score: number
  maxScore: number
  feedback: string
  strengths: string[]
  improvements: string[]
  nextSteps: string[]
  timestamp: string
} 