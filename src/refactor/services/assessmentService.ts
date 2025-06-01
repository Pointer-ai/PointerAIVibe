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

// 能力评估服务实现 - 通过Profile Service访问数据

import { Assessment, AssessmentInput, SkillAssessment, DimensionAssessment } from '../types/assessment'

// 导入原有的profile工具函数来访问当前Profile的数据
import {
  getCurrentProfile,
  getProfileData,
  setProfileData
} from '../../utils/profile'

// 导入原系统的评估类型和服务，用于数据格式转换
import type { AbilityAssessment } from '../../modules/abilityAssess/types'
import { analyzeAbility } from '../../modules/abilityAssess/service'

/**
 * 重构评估服务类
 * 通过ProfileService访问数据，确保数据隔离和与原系统兼容
 */
export class RefactorAssessmentService {
  
  /**
   * 获取当前Profile的评估数据（原系统格式）
   */
  private getCurrentAbilityAssessment(): AbilityAssessment | null {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        console.warn('[RefactorAssessmentService] No active profile')
        return null
      }

      return getProfileData('abilityAssessment') || null
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to get ability assessment:', error)
      return null
    }
  }

  /**
   * 获取评估历史（原系统格式）
   */
  private getAssessmentHistoryFromProfile(): any[] {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        console.warn('[RefactorAssessmentService] No active profile')
        return []
      }

      return getProfileData('assessmentHistory') || []
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to get assessment history:', error)
      return []
    }
  }

  /**
   * 保存评估数据到当前Profile（原系统格式）
   */
  private saveAbilityAssessment(assessment: AbilityAssessment): void {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      // 保存当前评估
      setProfileData('abilityAssessment', assessment)
      
      // 保存到历史记录
      const history = this.getAssessmentHistoryFromProfile()
      history.push({
        date: assessment.metadata.assessmentDate,
        overallScore: assessment.overallScore,
        level: this.getScoreLevel(assessment.overallScore)
      })
      setProfileData('assessmentHistory', history)

      console.log('[RefactorAssessmentService] Assessment saved to profile:', profile.name)
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to save assessment:', error)
      throw error
    }
  }

  /**
   * 执行能力评估
   */
  async executeAssessment(input: AssessmentInput): Promise<Assessment> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      // 转换输入格式为原系统格式
      const originalInput: import('../../modules/abilityAssess/types').AssessmentInput = {
        type: input.type,
        content: input.type === 'resume' 
          ? input.data.resumeText || ''
          : JSON.stringify(input.data.questionnaire || [])
      }

      try {
        // 尝试使用原系统的AI评估服务
        const abilityAssessment = await analyzeAbility(originalInput)
        
        // 数据已经由原系统保存，这里只需要转换格式
        return this.convertToNewFormat(abilityAssessment)
      } catch (aiError) {
        // AI评估失败，检查是否是API配置问题
        console.warn('[RefactorAssessmentService] AI assessment failed, using fallback:', aiError)
        
        // 检查是否是API key相关问题
        const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
        const isApiKeyIssue = errorMessage.toLowerCase().includes('api') || 
                             errorMessage.toLowerCase().includes('key') ||
                             errorMessage.toLowerCase().includes('unauthorized') ||
                             errorMessage.toLowerCase().includes('forbidden')
        
        if (isApiKeyIssue) {
          throw new Error('AI服务暂时不可用，请检查API KEY配置。系统将使用基础评估模式继续为您服务。')
        }
        
        // 其他AI服务问题
        console.log('[RefactorAssessmentService] Generating fallback assessment due to AI service error')
        const fallbackAssessment = this.createFallbackAssessment(originalInput)
        this.saveAbilityAssessment(fallbackAssessment)
        
        return this.convertToNewFormat(fallbackAssessment)
      }
    } catch (error) {
      console.error('[RefactorAssessmentService] Assessment execution failed:', error)
      
      // 如果是我们抛出的API key错误，直接重新抛出
      if (error instanceof Error && error.message.includes('API KEY')) {
        throw error
      }
      
      // 其他错误，提供基础评估
      const originalInput: import('../../modules/abilityAssess/types').AssessmentInput = {
        type: input.type,
        content: input.type === 'resume' 
          ? input.data.resumeText || ''
          : JSON.stringify(input.data.questionnaire || [])
      }
      
      const fallbackAssessment = this.createFallbackAssessment(originalInput)
      this.saveAbilityAssessment(fallbackAssessment)
      
      return this.convertToNewFormat(fallbackAssessment)
    }
  }

  /**
   * 获取当前评估结果（转换为新格式）
   */
  getCurrentAssessment(): Assessment | null {
    try {
      const abilityAssessment = this.getCurrentAbilityAssessment()
      if (!abilityAssessment) {
        return null
      }

      return this.convertToNewFormat(abilityAssessment)
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to get current assessment:', error)
      return null
    }
  }

  /**
   * 获取评估历史（转换为新格式）
   */
  getAssessmentHistory(): Assessment[] {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        return []
      }

      // 目前只返回当前评估作为历史的一部分
      // 后续可以扩展为完整的历史记录
      const current = this.getCurrentAssessment()
      return current ? [current] : []
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to get assessment history:', error)
      return []
    }
  }

  /**
   * 更新评估结果
   */
  async updateAssessment(assessmentId: string, updates: Partial<Assessment>): Promise<Assessment | null> {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        throw new Error('没有活跃的Profile')
      }

      const currentAbilityAssessment = this.getCurrentAbilityAssessment()
      if (!currentAbilityAssessment) {
        throw new Error('Assessment not found')
      }

      // 应用更新到原系统格式
      const updatedAbilityAssessment: AbilityAssessment = {
        ...currentAbilityAssessment,
        metadata: {
          ...currentAbilityAssessment.metadata,
          // 注意：这里需要小心更新，确保不破坏原系统结构
        }
      }

      // 如果有评分更新，需要更新
      if (updates.overallScore !== undefined) {
        updatedAbilityAssessment.overallScore = updates.overallScore
      }

      // 保存更新后的数据
      this.saveAbilityAssessment(updatedAbilityAssessment)

      return this.convertToNewFormat(updatedAbilityAssessment)
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to update assessment:', error)
      return null
    }
  }

  /**
   * 删除评估结果
   */
  deleteAssessment(assessmentId: string): boolean {
    try {
      const profile = getCurrentProfile()
      if (!profile) {
        return false
      }

      // 清空当前评估
      setProfileData('abilityAssessment', null)
      
      // 清空历史记录
      setProfileData('assessmentHistory', [])

      return true
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to delete assessment:', error)
      return false
    }
  }

  /**
   * 生成能力改进建议
   */
  async generateImprovementPlan(assessment?: Assessment): Promise<string[]> {
    try {
      const targetAssessment = assessment || this.getCurrentAssessment()
      if (!targetAssessment) {
        throw new Error('No assessment available for improvement plan')
      }

      // 基于评估结果生成建议，暂时使用静态建议
      const suggestions: string[] = []
      
      // 基于弱点生成建议
      targetAssessment.weaknesses.forEach(weakness => {
        if (weakness.includes('算法')) {
          suggestions.push('建议多做算法练习，推荐使用LeetCode等平台')
        } else if (weakness.includes('项目')) {
          suggestions.push('建议参与更多实际项目，积累项目经验')
        } else if (weakness.includes('基础')) {
          suggestions.push('建议加强编程基础，多做基础练习')
        } else if (weakness.includes('系统设计')) {
          suggestions.push('建议学习系统设计相关知识，了解大型系统架构')
        } else {
          suggestions.push(`针对"${weakness}"，建议制定专门的学习计划`)
        }
      })

      // 基于评分生成建议
      if (targetAssessment.overallScore < 50) {
        suggestions.push('建议从基础开始，制定系统的学习计划')
      } else if (targetAssessment.overallScore < 70) {
        suggestions.push('建议在现有基础上深入学习，提升实战经验')
      } else {
        suggestions.push('建议向更高级的技能领域挑战，如架构设计等')
      }

      return suggestions.length > 0 ? suggestions : [
        '建议加强编程基础练习',
        '多做算法和数据结构题目',
        '参与开源项目提升实战经验',
        '学习系统设计相关知识',
        '提升代码审查和团队协作能力'
      ]
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to generate improvement plan:', error)
      return [
        '建议加强编程基础练习',
        '多做算法和数据结构题目',
        '参与开源项目提升实战经验',
        '学习系统设计相关知识',
        '提升代码审查和团队协作能力'
      ]
    }
  }

  /**
   * 获取能力概要
   */
  getAbilitySummary(): {
    hasAssessment: boolean
    overallScore: number
    level: string
    lastUpdate: string | null
    strongPoints: string[]
    weakPoints: string[]
    needsAssessment: boolean
  } {
    const abilityAssessment = this.getCurrentAbilityAssessment()
    
    if (!abilityAssessment) {
      return {
        hasAssessment: false,
        overallScore: 0,
        level: 'unknown',
        lastUpdate: null,
        strongPoints: [],
        weakPoints: [],
        needsAssessment: true
      }
    }

    return {
      hasAssessment: true,
      overallScore: abilityAssessment.overallScore,
      level: this.getAssessmentLevel(abilityAssessment.overallScore),
      lastUpdate: abilityAssessment.metadata.assessmentDate,
      strongPoints: abilityAssessment.report?.strengths || [],
      weakPoints: abilityAssessment.report?.improvements || [],
      needsAssessment: this.checkIfReassessmentNeeded(abilityAssessment)
    }
  }

  /**
   * 导出评估报告
   */
  exportAssessmentReport(assessment?: Assessment): string {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      return '暂无评估数据'
    }

    const level = this.getAssessmentLevel(targetAssessment.overallScore)
    
    let report = `# 能力评估报告\n\n`
    report += `**评估日期**: ${targetAssessment.createdAt.toLocaleDateString()}\n`
    report += `**总体评分**: ${targetAssessment.overallScore}/100\n`
    report += `**能力级别**: ${level}\n\n`
    
    report += `## 各维度评分\n\n`
    Object.entries(targetAssessment.dimensions).forEach(([key, dimension]) => {
      report += `### ${dimension.name}\n`
      report += `- **评分**: ${dimension.score}/100\n`
      report += `- **概要**: ${dimension.summary}\n`
      if (dimension.skills.length > 0) {
        report += `- **技能**: ${dimension.skills.map(s => s.skill).join(', ')}\n`
      }
      report += `\n`
    })
    
    if (targetAssessment.strengths.length > 0) {
      report += `## 优势领域\n\n`
      targetAssessment.strengths.forEach(strength => {
        report += `- ${strength}\n`
      })
      report += `\n`
    }
    
    if (targetAssessment.weaknesses.length > 0) {
      report += `## 待改进领域\n\n`
      targetAssessment.weaknesses.forEach(weakness => {
        report += `- ${weakness}\n`
      })
      report += `\n`
    }
    
    if (targetAssessment.recommendations.length > 0) {
      report += `## 学习建议\n\n`
      targetAssessment.recommendations.forEach(recommendation => {
        report += `- ${recommendation}\n`
      })
      report += `\n`
    }
    
    return report
  }

  // ========== 私有方法 ==========

  /**
   * 将原系统的AbilityAssessment转换为新系统的Assessment
   */
  private convertToNewFormat(abilityAssessment: AbilityAssessment): Assessment {
    const profile = getCurrentProfile()
    
    return {
      id: `assessment_${Date.now()}`,
      profileId: profile?.id || 'unknown',
      type: abilityAssessment.metadata.assessmentMethod === 'resume' ? 'resume' : 'questionnaire',
      overallScore: abilityAssessment.overallScore,
      dimensions: this.convertDimensions(abilityAssessment.dimensions),
      strengths: abilityAssessment.report?.strengths || [],
      weaknesses: abilityAssessment.report?.improvements || [],
      recommendations: abilityAssessment.report?.recommendations || [],
      createdAt: new Date(abilityAssessment.metadata.assessmentDate),
      updatedAt: new Date(abilityAssessment.metadata.assessmentDate)
    }
  }

  /**
   * 转换维度数据
   */
  private convertDimensions(dimensions: AbilityAssessment['dimensions']): { [key: string]: DimensionAssessment } {
    const result: { [key: string]: DimensionAssessment } = {}
    
    Object.entries(dimensions).forEach(([key, dimension]) => {
      const skills: SkillAssessment[] = Object.entries(dimension.skills).map(([skillName, skillData]) => {
        const score = typeof skillData === 'number' ? skillData : skillData.score || 0
        const confidence = typeof skillData === 'number' ? 1.0 : skillData.confidence || 1.0
        
        return {
          skill: skillName,
          level: this.getSkillLevel(score),
          score,
          confidence,
          evidence: [],
          improvements: []
        }
      })

      result[key] = {
        name: this.getDimensionDisplayName(key),
        score: dimension.score,
        skills,
        summary: `${this.getDimensionDisplayName(key)}维度评估`,
        recommendations: [`继续提升${this.getDimensionDisplayName(key)}技能`]
      }
    })
    
    return result
  }

  /**
   * 获取维度显示名称
   */
  private getDimensionDisplayName(dimension: string): string {
    const dimensionMap: Record<string, string> = {
      programming: '编程基础',
      algorithm: '算法能力',
      project: '项目能力',
      systemDesign: '系统设计',
      communication: '沟通协作'
    }
    return dimensionMap[dimension] || dimension
  }

  /**
   * 获取技能级别
   */
  private getSkillLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (score >= 90) return 'expert'
    if (score >= 70) return 'advanced'
    if (score >= 50) return 'intermediate'
    return 'beginner'
  }

  /**
   * 获取评估级别
   */
  private getAssessmentLevel(score: number): string {
    if (score >= 90) return '专家级'
    if (score >= 80) return '高级'
    if (score >= 70) return '中高级'
    if (score >= 60) return '中级'
    if (score >= 50) return '中初级'
    if (score >= 40) return '初级'
    return '入门级'
  }

  /**
   * 获取评分级别（原系统兼容）
   */
  private getScoreLevel(score: number): string {
    if (score >= 80) return 'advanced'
    if (score >= 60) return 'intermediate'
    if (score >= 40) return 'beginner'
    return 'novice'
  }

  /**
   * 检查是否需要重新评估
   */
  private checkIfReassessmentNeeded(assessment: AbilityAssessment | Assessment): boolean {
    let assessmentDate: Date
    
    if ('metadata' in assessment) {
      // AbilityAssessment类型
      assessmentDate = new Date(assessment.metadata.assessmentDate)
    } else {
      // Assessment类型
      assessmentDate = assessment.createdAt
    }
    
    const now = new Date()
    const daysDiff = (now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // 30天后建议重新评估
    return daysDiff > 30
  }

  /**
   * 创建兜底评估（原系统格式）
   */
  private createFallbackAssessment(input: import('../../modules/abilityAssess/types').AssessmentInput): AbilityAssessment {
    const now = new Date().toISOString()
    
    // 基于输入内容进行简单分析，提供更有意义的基础评估
    let baseScore = 45 // 默认基础分数
    let analysisText = ''
    
    if (input.type === 'resume') {
      // 确保content是字符串类型
      const contentStr = typeof input.content === 'string' ? input.content : String(input.content)
      analysisText = contentStr.toLowerCase()
      
      // 简单的关键词分析来调整评分
      const keywords = {
        // 编程语言
        programming: ['javascript', 'python', 'java', 'react', 'vue', 'node', 'html', 'css', 'typescript'],
        // 算法相关
        algorithm: ['算法', 'algorithm', 'leetcode', '数据结构', 'data structure'],
        // 项目经验
        project: ['项目', 'project', '开发', 'develop', '实现', 'implement'],
        // 系统设计
        system: ['架构', 'architecture', '设计', 'design', '系统', 'system'],
        // 工作经验
        experience: ['年', 'year', '经验', 'experience', '工作', 'work']
      }
      
      let foundKeywords = 0
      Object.values(keywords).forEach(keywordList => {
        if (keywordList.some(keyword => analysisText.includes(keyword))) {
          foundKeywords++
          baseScore += 8 // 每个领域增加8分
        }
      })
      
      // 经验年限分析
      const experienceMatches = analysisText.match(/(\d+)\s*年|(\d+)\s*year/g)
      if (experienceMatches) {
        const years = Math.max(...experienceMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0')))
        if (years >= 3) baseScore += 15
        else if (years >= 1) baseScore += 10
      }
    } else {
      // 问卷评估
      try {
        const contentStr = typeof input.content === 'string' ? input.content : String(input.content)
        const questionnaire = JSON.parse(contentStr)
        if (Array.isArray(questionnaire) && questionnaire.length > 0) {
          // 根据问卷回答质量调整分数
          const answerQuality = questionnaire.length * 5 // 每个回答增加5分
          baseScore += Math.min(answerQuality, 25) // 最多增加25分
        }
      } catch (e) {
        console.warn('Failed to parse questionnaire content')
      }
    }
    
    // 确保分数在合理范围内
    baseScore = Math.max(30, Math.min(75, baseScore))
    
    // 根据总分调整各维度评分
    const scoreFactor = baseScore / 50 // 基准分数50
    
    return {
      overallScore: baseScore,
      dimensions: {
        programming: {
          score: Math.round(baseScore * 1.1), // 编程基础稍高
          weight: 0.3,
          skills: {
            syntax: Math.round(baseScore * 1.0),
            dataStructures: Math.round(baseScore * 0.9),
            errorHandling: Math.round(baseScore * 0.95),
            codeQuality: Math.round(baseScore * 0.9),
            tooling: Math.round(baseScore * 0.85)
          }
        },
        algorithm: {
          score: Math.round(baseScore * 0.8), // 算法相对较低
          weight: 0.25,
          skills: {
            stringProcessing: Math.round(baseScore * 0.9),
            recursion: Math.round(baseScore * 0.7),
            dynamicProgramming: Math.round(baseScore * 0.6),
            graph: Math.round(baseScore * 0.65),
            tree: Math.round(baseScore * 0.75),
            sorting: Math.round(baseScore * 0.8),
            searching: Math.round(baseScore * 0.8),
            greedy: Math.round(baseScore * 0.65)
          }
        },
        project: {
          score: Math.round(baseScore * 0.95),
          weight: 0.25,
          skills: {
            planning: Math.round(baseScore * 0.9),
            architecture: Math.round(baseScore * 0.8),
            implementation: Math.round(baseScore * 0.95),
            testing: Math.round(baseScore * 0.75),
            deployment: Math.round(baseScore * 0.7),
            documentation: Math.round(baseScore * 0.85)
          }
        },
        systemDesign: {
          score: Math.round(baseScore * 0.7), // 系统设计较难
          weight: 0.15,
          skills: {
            scalability: Math.round(baseScore * 0.6),
            reliability: Math.round(baseScore * 0.7),
            performance: Math.round(baseScore * 0.7),
            security: Math.round(baseScore * 0.6),
            databaseDesign: Math.round(baseScore * 0.75)
          }
        },
        communication: {
          score: Math.round(baseScore * 1.15), // 沟通能力稍高
          weight: 0.05,
          skills: {
            codeReview: Math.round(baseScore * 1.0),
            technicalWriting: Math.round(baseScore * 1.0),
            teamCollaboration: Math.round(baseScore * 1.2),
            mentoring: Math.round(baseScore * 0.9),
            presentation: Math.round(baseScore * 1.0)
          }
        }
      },
      metadata: {
        assessmentDate: now,
        assessmentMethod: input.type,
        confidence: 0.6 // 基础评估置信度较低
      },
      report: {
        summary: input.type === 'resume' ? 
          '基于简历内容的基础评估，建议配置AI服务获得更精准的分析' :
          '基于问卷回答的基础评估，建议配置AI服务获得更精准的分析',
        strengths: this.generateBasicStrengths(baseScore),
        improvements: this.generateBasicImprovements(baseScore),
        recommendations: this.generateBasicRecommendations(baseScore, input.type)
      }
    }
  }

  /**
   * 生成基础优势点
   */
  private generateBasicStrengths(score: number): string[] {
    const strengths: string[] = []
    
    if (score >= 60) {
      strengths.push('具备良好的编程基础')
      strengths.push('学习能力和适应性强')
    } else if (score >= 45) {
      strengths.push('具备基本的编程概念理解')
      strengths.push('有一定的学习积极性')
    } else {
      strengths.push('学习态度积极')
      strengths.push('有编程学习的基础动机')
    }
    
    if (score >= 50) {
      strengths.push('具备一定的问题解决能力')
    }
    
    return strengths
  }

  /**
   * 生成基础改进建议
   */
  private generateBasicImprovements(score: number): string[] {
    const improvements: string[] = []
    
    if (score < 60) {
      improvements.push('需要加强编程基础知识')
      improvements.push('建议多做基础算法练习')
    }
    
    if (score < 50) {
      improvements.push('需要系统学习数据结构')
      improvements.push('建议从简单项目开始实践')
    }
    
    improvements.push('需要提升系统设计思维')
    improvements.push('建议增加实际项目经验')
    
    return improvements
  }

  /**
   * 生成基础学习建议
   */
  private generateBasicRecommendations(score: number, assessmentType: string): string[] {
    const recommendations: string[] = []
    
    if (assessmentType === 'resume') {
      recommendations.push('建议完善简历中的技术细节')
      recommendations.push('可以尝试填写问卷评估获得更全面的分析')
    } else {
      recommendations.push('基于问卷回答，建议制定系统的学习计划')
    }
    
    if (score < 50) {
      recommendations.push('从编程基础开始，建议学习一门主流编程语言')
      recommendations.push('每天坚持编程练习，培养编程思维')
    } else if (score < 70) {
      recommendations.push('在现有基础上，重点提升算法和数据结构')
      recommendations.push('尝试参与开源项目或完成实际项目')
    } else {
      recommendations.push('继续深入学习，可以考虑系统设计和架构')
      recommendations.push('分享技术经验，提升影响力')
    }
    
    recommendations.push('配置AI服务后可获得更精准的个性化建议')
    
    return recommendations
  }
}

// 导出单例实例
export const refactorAssessmentService = new RefactorAssessmentService() 