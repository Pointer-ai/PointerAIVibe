/**
 * 能力评估模块类型定义
 * 定义多维度的能力评价体系
 */

// 能力维度枚举
export enum AbilityDimension {
  Programming = 'programming',      // 编程基本功
  Algorithm = 'algorithm',          // 算法能力
  Project = 'project',             // 项目能力
  SystemDesign = 'systemDesign',   // 系统设计
  Communication = 'communication'   // 沟通协作
}

// 技能评分类型
export interface SkillScore {
  score: number           // 分数 (0-100)
  confidence: number      // 置信度 (0-1)
  isInferred: boolean     // 是否为推理得出
}

// 编程基本功细分技能
export interface ProgrammingSkills {
  syntax: SkillScore | number           // 基础语法
  dataStructures: SkillScore | number   // 数据结构
  errorHandling: SkillScore | number    // 错误处理
  codeQuality: SkillScore | number      // 代码质量
  tooling: SkillScore | number          // 开发工具
}

// 算法能力细分技能
export interface AlgorithmSkills {
  stringProcessing: SkillScore | number     // 字符串处理
  recursion: SkillScore | number            // 递归
  dynamicProgramming: SkillScore | number   // 动态规划
  graph: SkillScore | number                // 图算法
  tree: SkillScore | number                 // 树算法
  sorting: SkillScore | number              // 排序算法
  searching: SkillScore | number            // 搜索算法
  greedy: SkillScore | number               // 贪心算法
}

// 项目能力细分技能
export interface ProjectSkills {
  planning: SkillScore | number        // 项目规划
  architecture: SkillScore | number    // 架构设计
  implementation: SkillScore | number  // 实现能力
  testing: SkillScore | number         // 测试能力
  deployment: SkillScore | number      // 部署运维
  documentation: SkillScore | number   // 文档能力
}

// 系统设计细分技能
export interface SystemDesignSkills {
  scalability: SkillScore | number     // 可扩展性
  reliability: SkillScore | number     // 可靠性
  performance: SkillScore | number     // 性能优化
  security: SkillScore | number        // 安全设计
  databaseDesign: SkillScore | number  // 数据库设计
}

// 沟通协作细分技能
export interface CommunicationSkills {
  codeReview: SkillScore | number       // 代码评审
  technicalWriting: SkillScore | number // 技术写作
  teamCollaboration: SkillScore | number // 团队协作
  mentoring: SkillScore | number        // 指导他人
  presentation: SkillScore | number     // 演讲展示
}

// 完整的能力评估结果
export interface AbilityAssessment {
  // 总体评分（基于各维度加权平均）
  overallScore: number
  
  // 各大维度评分
  dimensions: {
    programming: {
      score: number              // 维度总分（0-100）
      weight: number             // 权重（0-1）
      skills: ProgrammingSkills  // 细分技能
    }
    algorithm: {
      score: number
      weight: number
      skills: AlgorithmSkills
    }
    project: {
      score: number
      weight: number
      skills: ProjectSkills
    }
    systemDesign: {
      score: number
      weight: number
      skills: SystemDesignSkills
    }
    communication: {
      score: number
      weight: number
      skills: CommunicationSkills
    }
  }
  
  // 评估元数据
  metadata: {
    assessmentDate: string       // 评估日期
    assessmentMethod: 'resume' | 'questionnaire' | 'mixed'  // 评估方式
    confidence: number           // 置信度（0-1）
  }
  
  // AI 生成的评估报告
  report: {
    summary: string              // 总结
    strengths: string[]          // 优势
    improvements: string[]       // 待改进项
    recommendations: string[]    // 建议
  }
}

// 评估输入类型
export interface AssessmentInput {
  type: 'resume' | 'questionnaire'
  content: string | QuestionnaireResponse
}

// 问卷回答类型
export interface QuestionnaireResponse {
  basicInfo: {
    experience: number
    domain: string[]
    role: string
  }
  technicalSkills: Record<string, number>
  projectExperience: {
    complexity: number
    teamSize: number
    duration: number
  }
  preferences: {
    learningStyle: string
    timeCommitment: number
  }
}

// 项目信息
export interface ProjectInfo {
  name: string
  description: string
  role: string
  technologies: string[]
  teamSize: number
  duration: string
}

// 默认权重配置
export const DEFAULT_WEIGHTS = {
  programming: 0.3,      // 30%
  algorithm: 0.2,        // 20%
  project: 0.25,         // 25%
  systemDesign: 0.15,    // 15%
  communication: 0.1     // 10%
}

// 评分等级
export enum ScoreLevel {
  Novice = 'novice',           // 0-20: 新手
  Beginner = 'beginner',       // 21-40: 初学者
  Intermediate = 'intermediate', // 41-60: 中级
  Advanced = 'advanced',       // 61-80: 高级
  Expert = 'expert'            // 81-100: 专家
}

// 获取评分等级
export const getScoreLevel = (score: number): ScoreLevel => {
  if (score <= 20) return ScoreLevel.Novice
  if (score <= 40) return ScoreLevel.Beginner
  if (score <= 60) return ScoreLevel.Intermediate
  if (score <= 80) return ScoreLevel.Advanced
  return ScoreLevel.Expert
}

// 辅助函数：获取技能分数值
export const getSkillScoreValue = (skill: SkillScore | number): number => {
  return typeof skill === 'number' ? skill : skill.score
}

// 辅助函数：获取技能置信度
export const getSkillConfidence = (skill: SkillScore | number): number => {
  return typeof skill === 'number' ? 1 : skill.confidence
}

// 辅助函数：判断技能是否为推理得出
export const isSkillInferred = (skill: SkillScore | number): boolean => {
  return typeof skill === 'object' && (skill.isInferred || skill.confidence < 0.7)
}

// 能力档案（简化版，用于其他模块）
export interface AbilityProfile {
  overallScore: number
  dimensions: AbilityAssessment['dimensions']
  lastAssessed: string
  version: string
}

// ========== 提升计划相关类型 ==========

// 提升计划类型
export interface ImprovementPlan {
  id: string
  createdAt: string
  assessmentId: string
  
  // 计划元数据
  metadata: {
    baseScore: number           // 基础评分
    targetImprovement: number   // 目标提升分数
    estimatedTimeMonths: number // 预计完成时间（月）
    planType: 'comprehensive' | 'focused' // 计划类型
    confidence: number          // 置信度
  }
  
  // 生成的目标和路径
  generatedGoals: {
    shortTerm: GeneratedGoal[]  // 1-2个短期目标
    mediumTerm: GeneratedGoal[] // 1-2个中期目标
  }
  
  // 整体建议
  overallStrategy: {
    focusAreas: string[]        // 重点关注领域
    learningApproach: string    // 学习方法建议
    timeAllocation: string      // 时间分配建议
    milestones: Milestone[]     // 关键里程碑
  }
  
  // 可视化数据
  visualData: {
    skillGapChart: SkillGapData[]
    progressTimeline: TimelineData[]
    priorityMatrix: PriorityData[]
  }
}

// 生成的目标
export interface GeneratedGoal {
  title: string
  description: string
  category: string
  duration: 'short' | 'medium'  // 短期(1个月) | 中期(3个月)
  priority: number
  targetLevel: string
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  
  // 关联的学习路径
  associatedPath: GeneratedPath
}

// 生成的学习路径
export interface GeneratedPath {
  title: string
  description: string
  totalEstimatedHours: number
  nodes: GeneratedPathNode[]
  milestones: Milestone[]
}

// 生成的路径节点
export interface GeneratedPathNode {
  title: string
  description: string
  type: 'theory' | 'practice' | 'project' | 'review'
  difficulty: number
  estimatedHours: number
  skills: string[]
  prerequisites: string[]
  order: number
}

// 里程碑
export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  associatedSkills: string[]
  successCriteria: string[]
}

// 技能差距数据（用于可视化）
export interface SkillGapData {
  skillName: string
  currentScore: number
  targetScore: number
  gap: number
  priority: 'high' | 'medium' | 'low'
  estimatedWeeks: number
}

// 时间线数据（用于可视化）
export interface TimelineData {
  date: string
  milestone: string
  description: string
  type: 'goal' | 'path' | 'milestone'
}

// 优先级矩阵数据（用于可视化）
export interface PriorityData {
  skill: string
  impact: number      // 影响程度 (1-5)
  difficulty: number  // 学习难度 (1-5)
  urgency: number     // 紧急程度 (1-5)
  priority: number    // 综合优先级 (1-5)
} 