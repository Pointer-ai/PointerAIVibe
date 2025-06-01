/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 课程内容模块类型定义

/**
 * 课程内容 - 路径节点下的具体教学内容
 * 一个节点可以有多个课程内容
 */
export interface CourseContent {
  id: string
  nodeId: string
  title: string
  description: string
  order: number // 在节点中的排序
  
  // 内容结构
  explanation: ExplanationSection // 讲解部分
  practice: PracticeSection       // 练习评测部分
  
  // 元数据
  metadata: CourseContentMetadata
  
  // 状态
  status: 'not_started' | 'in_progress' | 'completed'
  progress: {
    explanationCompleted: boolean
    practiceCompleted: boolean
    score?: number
    timeSpent: number // 分钟
  }
  
  createdAt: string
  updatedAt: string
}

/**
 * 讲解部分
 */
export interface ExplanationSection {
  id: string
  title: string
  content: {
    markdown: string           // 主要文本内容
    codeExamples?: CodeExample[]  // 代码示例
    diagrams?: DiagramContent[]   // 图表内容
    videos?: VideoContent[]      // 视频内容（可选）
  }
  
  // 学习目标
  learningObjectives: string[]
  
  // 前置知识点
  prerequisites: string[]
  
  // 关键概念
  keyConcepts: {
    term: string
    definition: string
    examples?: string[]
  }[]
}

/**
 * 练习评测部分
 */
export interface PracticeSection {
  id: string
  title: string
  exercises: Exercise[]
  
  // 评估配置
  assessment: {
    passingScore: number // 通过分数
    attempts: number     // 允许尝试次数
    timeLimit?: number   // 时间限制（分钟）
  }
}

/**
 * 练习题
 */
export interface Exercise {
  id: string
  type: 'coding' | 'quiz' | 'fill_blank' | 'drag_drop' | 'interactive'
  title: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number // 分钟
  points: number        // 分值
  
  content: ExerciseContent
  
  // 提示和解释
  hints: string[]
  solution: SolutionContent
  explanation: string
}

/**
 * 练习题内容（根据类型不同）
 */
export type ExerciseContent = 
  | CodingExerciseContent
  | QuizExerciseContent
  | FillBlankExerciseContent
  | DragDropExerciseContent
  | InteractiveExerciseContent

/**
 * 编程练习内容
 */
export interface CodingExerciseContent {
  type: 'coding'
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'rust'
  
  // 题目描述
  problemStatement: string
  
  // 代码框架
  starterCode: string
  
  // 测试用例
  testCases: {
    id: string
    input: any
    expectedOutput: any
    description: string
    isHidden?: boolean  // 是否为隐藏测试用例
  }[]
  
  // 代码模板配置
  template: {
    imports: string[]
    functions: string[]
    constraints: string[]
  }
  
  // 评估标准
  evaluation: {
    autoGrading: boolean
    criteria: string[]
    performance?: {
      timeComplexity?: string
      spaceComplexity?: string
    }
  }
}

/**
 * 选择题内容
 */
export interface QuizExerciseContent {
  type: 'quiz'
  question: string
  options: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  multipleChoice: boolean // 是否多选
}

/**
 * 填空题内容
 */
export interface FillBlankExerciseContent {
  type: 'fill_blank'
  template: string // 包含 {{blank}} 占位符的模板
  blanks: {
    id: string
    correctAnswers: string[]
    caseSensitive: boolean
  }[]
}

/**
 * 拖拽题内容
 */
export interface DragDropExerciseContent {
  type: 'drag_drop'
  description: string
  items: {
    id: string
    content: string
    type: 'draggable' | 'droppable'
  }[]
  correctMapping: { [draggableId: string]: string } // 正确的拖拽映射
}

/**
 * 交互式练习内容
 */
export interface InteractiveExerciseContent {
  type: 'interactive'
  interactionType: 'simulation' | 'diagram_completion' | 'code_debugging'
  config: Record<string, any> // 具体的交互配置
}

/**
 * 解决方案内容
 */
export interface SolutionContent {
  code?: string
  explanation: string
  approach: string
  alternativeSolutions?: {
    code: string
    explanation: string
    pros: string[]
    cons: string[]
  }[]
}

/**
 * 代码示例
 */
export interface CodeExample {
  id: string
  title: string
  description: string
  language: string
  code: string
  output?: string
  explanation: string
  concepts: string[] // 展示的概念
}

/**
 * 图表内容
 */
export interface DiagramContent {
  id: string
  title: string
  type: 'flowchart' | 'sequence' | 'class' | 'mind_map' | 'image'
  content: string | { [key: string]: any } // SVG字符串或图表配置
  description: string
}

/**
 * 视频内容
 */
export interface VideoContent {
  id: string
  title: string
  url: string
  duration: number // 秒
  thumbnail?: string
  captions?: string[]
}

/**
 * 课程内容元数据
 */
export interface CourseContentMetadata {
  estimatedReadingTime: number // 分钟，默认不超过15分钟
  difficulty: 1 | 2 | 3 | 4 | 5
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'rust' | 'auto'
  
  // 技能标签
  skills: string[]
  concepts: string[]
  keywords: string[]
  
  // 学习目标
  learningOutcomes: string[]
  
  // 适用的学习风格
  learningStyles: ('visual' | 'auditory' | 'kinesthetic' | 'reading')[]
  
  // 版本信息
  version: string
  author?: string
  reviewedBy?: string[]
}

/**
 * 课程内容进度
 */
export interface CourseContentProgress {
  contentId: string
  nodeId: string
  
  // 讲解部分进度
  explanationProgress: {
    sectionsViewed: string[]
    timeSpent: number
    completed: boolean
    completedAt?: string
  }
  
  // 练习部分进度
  practiceProgress: {
    exercisesAttempted: {
      exerciseId: string
      attempts: number
      bestScore: number
      completed: boolean
      timeSpent: number
      lastAttemptAt: string
    }[]
    overallScore: number
    passed: boolean
    completedAt?: string
  }
  
  // 总体进度
  totalTimeSpent: number
  lastAccessAt: string
  startedAt: string
}

/**
 * 课程内容创建请求
 */
export interface CreateCourseContentRequest {
  nodeId: string
  title: string
  description: string
  order?: number
  template?: 'basic' | 'coding_heavy' | 'theory_heavy' | 'project_based'
  generationConfig?: {
    language: string
    difficulty: number
    includeExamples: boolean
    includeInteractive: boolean
    focusAreas: string[]
  }
}

/**
 * 课程内容更新请求
 */
export interface UpdateCourseContentRequest {
  title?: string
  description?: string
  order?: number
  explanation?: Partial<ExplanationSection>
  practice?: Partial<PracticeSection>
  metadata?: Partial<CourseContentMetadata>
}

/**
 * 练习提交请求
 */
export interface ExerciseSubmissionRequest {
  exerciseId: string
  contentId: string
  submission: {
    type: 'coding' | 'quiz' | 'fill_blank' | 'drag_drop' | 'interactive'
    answer: any // 根据类型不同，答案格式不同
    timeSpent: number
  }
}

/**
 * 练习评估结果
 */
export interface ExerciseEvaluationResult {
  exerciseId: string
  submissionId: string
  score: number
  maxScore: number
  passed: boolean
  
  feedback: {
    overall: string
    detailed: {
      section: string
      message: string
      type: 'success' | 'error' | 'warning' | 'info'
    }[]
  }
  
  // 代码练习特有
  codeEvaluation?: {
    testResults: {
      testCaseId: string
      passed: boolean
      actualOutput: any
      error?: string
    }[]
    codeQuality: {
      score: number
      issues: {
        type: 'style' | 'performance' | 'logic' | 'security'
        message: string
        line?: number
      }[]
    }
  }
  
  // 建议和下一步
  recommendations: string[]
  nextSteps: string[]
  
  timestamp: string
} 