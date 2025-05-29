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

// 编程基本功细分维度
export interface ProgrammingSkills {
  syntax: number               // 基础语法（0-100）
  dataStructures: number       // 数据结构基本使用（0-100）
  errorHandling: number        // 错误处理（0-100）
  codeQuality: number          // 代码质量（0-100）
  tooling: number              // 开发工具使用（0-100）
}

// 算法能力细分维度
export interface AlgorithmSkills {
  stringProcessing: number     // 字符串处理（0-100）
  recursion: number            // 递归（0-100）
  dynamicProgramming: number   // 动态规划（0-100）
  graph: number                // 图算法（0-100）
  tree: number                 // 树相关（0-100）
  sorting: number              // 排序算法（0-100）
  searching: number            // 搜索算法（0-100）
  greedy: number               // 贪心算法（0-100）
}

// 项目能力细分维度
export interface ProjectSkills {
  planning: number             // 项目规划（0-100）
  architecture: number         // 架构设计（0-100）
  implementation: number       // 实现能力（0-100）
  testing: number              // 测试能力（0-100）
  deployment: number           // 部署运维（0-100）
  documentation: number        // 文档能力（0-100）
}

// 系统设计细分维度
export interface SystemDesignSkills {
  scalability: number          // 可扩展性设计（0-100）
  reliability: number          // 可靠性设计（0-100）
  performance: number          // 性能优化（0-100）
  security: number             // 安全设计（0-100）
  databaseDesign: number       // 数据库设计（0-100）
}

// 沟通协作细分维度
export interface CommunicationSkills {
  codeReview: number           // 代码评审（0-100）
  technicalWriting: number     // 技术写作（0-100）
  teamCollaboration: number    // 团队协作（0-100）
  mentoring: number            // 指导他人（0-100）
  presentation: number         // 演讲展示（0-100）
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