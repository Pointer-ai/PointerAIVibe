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

// 技能评分详情
export interface SkillScore {
  score: number                // 分数（0-100）
  confidence: number           // 置信度（0-1）
  isInferred?: boolean        // 是否为推理得出
}

// 编程基本功细分维度
export interface ProgrammingSkills {
  syntax: SkillScore | number               // 基础语法（保持向后兼容）
  dataStructures: SkillScore | number       // 数据结构基本使用
  errorHandling: SkillScore | number        // 错误处理
  codeQuality: SkillScore | number          // 代码质量
  tooling: SkillScore | number              // 开发工具使用
}

// 算法能力细分维度
export interface AlgorithmSkills {
  stringProcessing: SkillScore | number     // 字符串处理
  recursion: SkillScore | number            // 递归
  dynamicProgramming: SkillScore | number   // 动态规划
  graph: SkillScore | number                // 图算法
  tree: SkillScore | number                 // 树相关
  sorting: SkillScore | number              // 排序算法
  searching: SkillScore | number            // 搜索算法
  greedy: SkillScore | number               // 贪心算法
}

// 项目能力细分维度
export interface ProjectSkills {
  planning: SkillScore | number             // 项目规划
  architecture: SkillScore | number         // 架构设计
  implementation: SkillScore | number       // 实现能力
  testing: SkillScore | number              // 测试能力
  deployment: SkillScore | number           // 部署运维
  documentation: SkillScore | number        // 文档能力
}

// 系统设计细分维度
export interface SystemDesignSkills {
  scalability: SkillScore | number          // 可扩展性设计
  reliability: SkillScore | number          // 可靠性设计
  performance: SkillScore | number          // 性能优化
  security: SkillScore | number             // 安全设计
  databaseDesign: SkillScore | number       // 数据库设计
}

// 沟通协作细分维度
export interface CommunicationSkills {
  codeReview: SkillScore | number           // 代码评审
  technicalWriting: SkillScore | number     // 技术写作
  teamCollaboration: SkillScore | number    // 团队协作
  mentoring: SkillScore | number            // 指导他人
  presentation: SkillScore | number         // 演讲展示
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

// 问卷回答
export interface QuestionnaireResponse {
  experience: {
    yearsOfCoding: number
    languages: string[]
    frameworks: string[]
    projects: ProjectInfo[]
  }
  skills: {
    [key: string]: number  // 自评分数
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
  programming: 0.25,
  algorithm: 0.25,
  project: 0.20,
  systemDesign: 0.15,
  communication: 0.15
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