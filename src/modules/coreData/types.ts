export interface CoreDataEvent {
  id: string
  type: string
  timestamp: string
  details: Record<string, any>
}

export interface AbilityProfile {
  overallScore: number
  dimensions: {
    [key: string]: {
      score: number
      confidence: number
      skills: { [skill: string]: number }
    }
  }
  lastAssessed: string
  version: string
}

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

export interface PathNode {
  id: string
  title: string
  description: string
  type: 'concept' | 'practice' | 'project' | 'assessment' | 'milestone'
  estimatedHours: number
  difficulty: 1 | 2 | 3 | 4 | 5
  prerequisites: string[]
  skills: string[]
  resources: {
    type: 'article' | 'video' | 'exercise' | 'project' | 'quiz'
    title: string
    url?: string
    content?: string
    metadata?: Record<string, any>
  }[]
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  progress: number
  startedAt?: string
  completedAt?: string
}

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
  status: 'draft' | 'active' | 'completed' | 'archived'
}

export interface CourseUnit {
  id: string
  nodeId: string
  title: string
  description: string
  type: 'theory' | 'example' | 'exercise' | 'project' | 'quiz'
  content: {
    markdown?: string
    code?: {
      language: string
      source: string
      solution?: string
      tests?: string
    }
    quiz?: {
      questions: {
        id: string
        type: 'single' | 'multiple' | 'code' | 'essay'
        question: string
        options?: string[]
        correctAnswer?: string | string[]
        explanation?: string
      }[]
    }
    project?: {
      requirements: string[]
      starter?: string
      solution?: string
      evaluation: string
    }
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

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface AgentAction {
  toolName: string
  parameters: Record<string, any>
  result?: any
  timestamp: string
}

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
