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

/**
 * 能力评估API
 * 
 * 提供能力评估相关的所有操作接口：
 * - 评估执行和更新
 * - 评估结果分析
 * - 能力概要获取
 * - 提升计划生成
 */

import { AbilityAssessmentService } from '../modules/abilityAssess/service'
import { AbilityAssessment, AssessmentInput } from '../modules/abilityAssess/types'
import { LearningSystemStatus } from '../modules/learningSystem'
import { APIResponse } from './learningApi'

/**
 * 能力概要接口
 */
export interface AbilitySummary {
  hasAssessment: boolean
  overallScore: number
  lastUpdate: string | null
  strongPoints: string[]
  weakPoints: string[]
  needsAssessment: boolean
  level: string
  assessmentDate: string | null
}

/**
 * 评估结果接口
 */
export interface AssessmentResult {
  assessment: AbilityAssessment
  systemStatus: LearningSystemStatus
  nextRecommendations: string[]
  message: string
}

/**
 * 能力评估API类
 */
export class AssessmentAPI {
  private static instance: AssessmentAPI
  private assessmentService: AbilityAssessmentService

  private constructor() {
    this.assessmentService = new AbilityAssessmentService()
  }

  public static getInstance(): AssessmentAPI {
    if (!AssessmentAPI.instance) {
      AssessmentAPI.instance = new AssessmentAPI()
    }
    return AssessmentAPI.instance
  }

  // ========== 评估执行和管理 ==========

  /**
   * 执行能力评估
   */
  async executeAssessment(input: AssessmentInput): Promise<APIResponse<AbilityAssessment>> {
    try {
      const result = await this.assessmentService.executeAssessment(input)
      return {
        success: true,
        data: result,
        message: '✅ 能力评估执行成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '能力评估执行失败'
      }
    }
  }

  /**
   * 更新能力评估
   */
  async updateAssessment(updates: Partial<AbilityAssessment>): Promise<APIResponse<AbilityAssessment | null>> {
    try {
      const result = await this.assessmentService.updateAssessment(updates)
      return {
        success: true,
        data: result,
        message: '✅ 能力评估更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新能力评估失败'
      }
    }
  }

  /**
   * 获取当前评估结果
   */
  getCurrentAssessment(): APIResponse<AbilityAssessment | null> {
    try {
      const assessment = this.assessmentService.getCurrentAssessment()
      return {
        success: true,
        data: assessment
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取当前评估失败'
      }
    }
  }

  /**
   * 生成能力提升计划
   */
  async generateImprovementPlan(): Promise<APIResponse<string>> {
    try {
      const plan = await this.assessmentService.generateImprovementPlan()
      return {
        success: true,
        data: plan,
        message: '✅ 能力提升计划生成成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成能力提升计划失败'
      }
    }
  }

  // ========== 能力分析和概要 ==========

  /**
   * 获取能力概要
   */
  getAbilitySummary(): APIResponse<AbilitySummary> {
    try {
      const summary = this.assessmentService.getAbilitySummary()
      
      // 转换为标准格式
      const standardSummary: AbilitySummary = {
        hasAssessment: summary.hasAssessment,
        overallScore: summary.overallScore,
        lastUpdate: summary.assessmentDate,
        strongPoints: summary.strengths || [],
        weakPoints: summary.improvements || [],
        needsAssessment: summary.needsAssessment,
        level: summary.level,
        assessmentDate: summary.assessmentDate
      }

      return {
        success: true,
        data: standardSummary
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取能力概要失败'
      }
    }
  }

  /**
   * 分析技能强项
   */
  analyzeStrengths(): APIResponse<{
    skills: string[]
    scores: Record<string, number>
    recommendations: string[]
  }> {
    try {
      const assessment = this.getCurrentAssessment()
      if (!assessment.success || !assessment.data) {
        return {
          success: false,
          error: '暂无评估数据'
        }
      }

      const assessmentData = assessment.data
      const skills: string[] = []
      const scores: Record<string, number> = {}
      const recommendations: string[] = []

      // 分析各维度技能评分
      Object.entries(assessmentData.dimensions).forEach(([dimension, data]) => {
        if (data.score >= 70) {
          skills.push(dimension)
          scores[dimension] = data.score
          
          if (data.score >= 90) {
            recommendations.push(`${dimension}能力优秀，可以考虑深度发展或指导他人`)
          } else if (data.score >= 80) {
            recommendations.push(`${dimension}能力良好，可以在实际项目中多加应用`)
          }
        }
      })

      return {
        success: true,
        data: {
          skills,
          scores,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析技能强项失败'
      }
    }
  }

  /**
   * 分析需要改进的领域
   */
  analyzeWeaknesses(): APIResponse<{
    skills: string[]
    scores: Record<string, number>
    recommendations: string[]
  }> {
    try {
      const assessment = this.getCurrentAssessment()
      if (!assessment.success || !assessment.data) {
        return {
          success: false,
          error: '暂无评估数据'
        }
      }

      const assessmentData = assessment.data
      const skills: string[] = []
      const scores: Record<string, number> = {}
      const recommendations: string[] = []

      // 分析各维度技能评分
      Object.entries(assessmentData.dimensions).forEach(([dimension, data]) => {
        if (data.score < 60) {
          skills.push(dimension)
          scores[dimension] = data.score
          
          if (data.score < 30) {
            recommendations.push(`${dimension}需要从基础开始系统学习`)
          } else if (data.score < 50) {
            recommendations.push(`${dimension}有一定基础，需要加强练习`)
          } else {
            recommendations.push(`${dimension}接近及格水平，再努力一下就能掌握`)
          }
        }
      })

      return {
        success: true,
        data: {
          skills,
          scores,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析待改进领域失败'
      }
    }
  }

  /**
   * 获取评估历史
   */
  getAssessmentHistory(): APIResponse<{
    assessments: AbilityAssessment[]
    progressTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
    improvements: string[]
  }> {
    try {
      // 目前只有一个评估，后续可以扩展为多个
      const current = this.getCurrentAssessment()
      
      const assessments: AbilityAssessment[] = []
      if (current.success && current.data) {
        assessments.push(current.data)
      }

      const progressTrend = assessments.length < 2 ? 'insufficient_data' : 'stable'
      const improvements: string[] = []

      if (assessments.length === 0) {
        improvements.push('建议完成首次能力评估')
      } else if (assessments.length === 1) {
        improvements.push('建议定期重新评估，跟踪学习进度')
      }

      return {
        success: true,
        data: {
          assessments,
          progressTrend,
          improvements
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取评估历史失败'
      }
    }
  }

  /**
   * 检查是否需要重新评估
   */
  checkReassessmentNeeded(): APIResponse<{
    needsReassessment: boolean
    reason: string
    daysSinceLastAssessment: number
    recommendations: string[]
  }> {
    try {
      const assessment = this.getCurrentAssessment()
      const recommendations: string[] = []
      
      if (!assessment.success || !assessment.data) {
        return {
          success: true,
          data: {
            needsReassessment: true,
            reason: '尚未进行能力评估',
            daysSinceLastAssessment: 0,
            recommendations: ['建议进行首次能力评估以了解当前技能水平']
          }
        }
      }

      const assessmentDate = new Date(assessment.data.metadata.assessmentDate)
      const now = new Date()
      const daysSinceLastAssessment = Math.floor((now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24))

      let needsReassessment = false
      let reason = '评估较新，暂不需要重新评估'

      if (daysSinceLastAssessment > 90) {
        needsReassessment = true
        reason = '距离上次评估已超过3个月'
        recommendations.push('建议重新评估以反映最新的学习成果')
      } else if (daysSinceLastAssessment > 30) {
        recommendations.push('可以考虑重新评估以更新技能水平')
      } else {
        recommendations.push('继续按照当前学习计划学习')
      }

      return {
        success: true,
        data: {
          needsReassessment,
          reason,
          daysSinceLastAssessment,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查重评需求失败'
      }
    }
  }

  /**
   * 获取评估建议
   */
  getAssessmentRecommendations(): APIResponse<{
    hasAssessment: boolean
    recommendations: string[]
    nextSteps: string[]
  }> {
    try {
      const summary = this.getAbilitySummary()
      if (!summary.success || !summary.data) {
        return {
          success: false,
          error: summary.error || '获取能力概要失败'
        }
      }

      const summaryData = summary.data
      const recommendations: string[] = []
      const nextSteps: string[] = []

      if (!summaryData.hasAssessment) {
        recommendations.push('完成能力评估是制定个性化学习计划的第一步')
        recommendations.push('上传简历或完成技能问卷来快速评估')
        nextSteps.push('前往能力评估页面')
        nextSteps.push('选择评估方式（简历上传或问卷填写）')
      } else {
        recommendations.push('基于您的评估结果设定合适的学习目标')
        
        if (summaryData.overallScore < 40) {
          recommendations.push('建议从基础课程开始，夯实编程基础')
          nextSteps.push('选择基础级别的学习目标')
        } else if (summaryData.overallScore >= 70) {
          recommendations.push('您的基础较好，可以考虑挑战性更高的学习目标')
          nextSteps.push('选择中高级学习目标')
        } else {
          recommendations.push('适合选择中级难度的学习目标')
          nextSteps.push('选择中级学习目标')
        }

        nextSteps.push('生成个性化学习路径')
      }

      return {
        success: true,
        data: {
          hasAssessment: summaryData.hasAssessment,
          recommendations,
          nextSteps
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取评估建议失败'
      }
    }
  }
}

// 导出单例实例
export const assessmentApi = AssessmentAPI.getInstance()

// 导出类型定义已在文件开头定义，不需要重复导出 