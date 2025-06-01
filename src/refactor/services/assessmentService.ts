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

// 能力评估服务实现

import { Assessment, AssessmentInput, SkillAssessment, DimensionAssessment } from '../types/assessment'
import { refactorAIService } from './aiService'

/**
 * 评估服务类
 * 复刻原有评估系统的完整功能
 */
export class RefactorAssessmentService {
  private readonly STORAGE_KEY = 'refactor_assessments'
  private readonly CURRENT_KEY = 'refactor_current_assessment'

  /**
   * 执行能力评估
   */
  async executeAssessment(input: AssessmentInput): Promise<Assessment> {
    try {
      // 使用AI服务进行评估
      const assessment = await refactorAIService.assessAbility(input)
      
      // 保存评估结果
      this.saveAssessment(assessment)
      this.setCurrentAssessment(assessment)
      
      return assessment
    } catch (error) {
      console.error('[RefactorAssessmentService] Assessment execution failed:', error)
      
      // 如果AI评估失败，返回基础模拟评估
      const fallbackAssessment = this.createFallbackAssessment(input)
      this.saveAssessment(fallbackAssessment)
      this.setCurrentAssessment(fallbackAssessment)
      
      return fallbackAssessment
    }
  }

  /**
   * 获取当前评估结果
   */
  getCurrentAssessment(): Assessment | null {
    try {
      const currentProfile = this.getCurrentProfileId()
      const data = localStorage.getItem(`${this.CURRENT_KEY}_${currentProfile}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('[RefactorAssessmentService] Failed to get current assessment:', error)
      return null
    }
  }

  /**
   * 获取评估历史
   */
  getAssessmentHistory(): Assessment[] {
    try {
      const currentProfile = this.getCurrentProfileId()
      const data = localStorage.getItem(`${this.STORAGE_KEY}_${currentProfile}`)
      return data ? JSON.parse(data) : []
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
      const history = this.getAssessmentHistory()
      const assessmentIndex = history.findIndex(a => a.id === assessmentId)
      
      if (assessmentIndex === -1) {
        throw new Error('Assessment not found')
      }

      const updatedAssessment = {
        ...history[assessmentIndex],
        ...updates,
        updatedAt: new Date()
      }

      history[assessmentIndex] = updatedAssessment
      this.saveAssessmentHistory(history)

      // 如果更新的是当前评估，也更新当前评估
      const current = this.getCurrentAssessment()
      if (current && current.id === assessmentId) {
        this.setCurrentAssessment(updatedAssessment)
      }

      return updatedAssessment
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
      const history = this.getAssessmentHistory()
      const filteredHistory = history.filter(a => a.id !== assessmentId)
      
      if (filteredHistory.length === history.length) {
        return false // 没有找到要删除的评估
      }

      this.saveAssessmentHistory(filteredHistory)

      // 如果删除的是当前评估，清空当前评估
      const current = this.getCurrentAssessment()
      if (current && current.id === assessmentId) {
        this.clearCurrentAssessment()
      }

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

      const context = {
        assessment: targetAssessment,
        weaknesses: targetAssessment.weaknesses,
        currentLevel: this.getAssessmentLevel(targetAssessment.overallScore)
      }

      return await refactorAIService.generateLearningAdvice(context)
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
    const current = this.getCurrentAssessment()
    
    if (!current) {
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
      overallScore: current.overallScore,
      level: this.getAssessmentLevel(current.overallScore),
      lastUpdate: current.updatedAt.toISOString(),
      strongPoints: current.strengths,
      weakPoints: current.weaknesses,
      needsAssessment: this.checkIfReassessmentNeeded(current)
    }
  }

  /**
   * 导出评估报告
   */
  exportAssessmentReport(assessment?: Assessment): string {
    const targetAssessment = assessment || this.getCurrentAssessment()
    if (!targetAssessment) {
      return '暂无评估数据可导出'
    }

    const level = this.getAssessmentLevel(targetAssessment.overallScore)
    
    return `# 能力评估报告

## 基本信息
- 评估时间：${new Date(targetAssessment.createdAt).toLocaleDateString('zh-CN')}
- 评估类型：${targetAssessment.type === 'resume' ? '简历分析' : '问卷评估'}
- 总体评分：${targetAssessment.overallScore}/100
- 能力等级：${level}

## 维度评分
${Object.entries(targetAssessment.dimensions).map(([key, dimension]) => `
### ${dimension.name}
- 评分：${dimension.score}/100
- 概述：${dimension.summary}
${dimension.skills.map(skill => `- ${skill.skill}: ${skill.score}分 (${skill.level})`).join('\n')}
`).join('')}

## 优势领域
${targetAssessment.strengths.map(s => `- ${s}`).join('\n')}

## 待改进领域
${targetAssessment.weaknesses.map(w => `- ${w}`).join('\n')}

## 发展建议
${targetAssessment.recommendations.map(r => `- ${r}`).join('\n')}

---
*报告生成时间：${new Date().toLocaleString('zh-CN')}*`
  }

  /**
   * 私有方法：获取当前Profile ID
   */
  private getCurrentProfileId(): string {
    return localStorage.getItem('currentProfile') || 'default'
  }

  /**
   * 私有方法：保存评估结果
   */
  private saveAssessment(assessment: Assessment): void {
    const history = this.getAssessmentHistory()
    
    // 检查是否已存在相同ID的评估
    const existingIndex = history.findIndex(a => a.id === assessment.id)
    if (existingIndex >= 0) {
      history[existingIndex] = assessment
    } else {
      history.unshift(assessment) // 新评估放在最前面
    }

    // 保持最多10个历史记录
    if (history.length > 10) {
      history.splice(10)
    }

    this.saveAssessmentHistory(history)
  }

  /**
   * 私有方法：保存评估历史
   */
  private saveAssessmentHistory(history: Assessment[]): void {
    const currentProfile = this.getCurrentProfileId()
    localStorage.setItem(`${this.STORAGE_KEY}_${currentProfile}`, JSON.stringify(history))
  }

  /**
   * 私有方法：设置当前评估
   */
  private setCurrentAssessment(assessment: Assessment): void {
    const currentProfile = this.getCurrentProfileId()
    localStorage.setItem(`${this.CURRENT_KEY}_${currentProfile}`, JSON.stringify(assessment))
  }

  /**
   * 私有方法：清空当前评估
   */
  private clearCurrentAssessment(): void {
    const currentProfile = this.getCurrentProfileId()
    localStorage.removeItem(`${this.CURRENT_KEY}_${currentProfile}`)
  }

  /**
   * 私有方法：获取评估等级
   */
  private getAssessmentLevel(score: number): string {
    if (score >= 90) return '专家'
    if (score >= 75) return '高级'
    if (score >= 60) return '中级'
    if (score >= 40) return '初级'
    return '入门'
  }

  /**
   * 私有方法：检查是否需要重新评估
   */
  private checkIfReassessmentNeeded(assessment: Assessment): boolean {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(assessment.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceUpdate > 90 // 90天后建议重新评估
  }

  /**
   * 私有方法：创建回退评估结果
   */
  private createFallbackAssessment(input: AssessmentInput): Assessment {
    const baseScore = 50 // 基础分数

    // 创建基础维度评估
    const dimensions: { [key: string]: DimensionAssessment } = {
      programming: {
        name: '编程基础',
        score: baseScore,
        skills: [
          this.createSkillAssessment('语法基础', baseScore),
          this.createSkillAssessment('数据结构', baseScore - 10),
          this.createSkillAssessment('代码质量', baseScore + 5)
        ],
        summary: '编程基础能力中等，有一定的代码编写经验',
        recommendations: ['加强语法练习', '深入学习数据结构']
      },
      algorithm: {
        name: '算法能力',
        score: baseScore - 15,
        skills: [
          this.createSkillAssessment('排序算法', baseScore - 20),
          this.createSkillAssessment('搜索算法', baseScore - 15),
          this.createSkillAssessment('动态规划', baseScore - 25)
        ],
        summary: '算法能力有待提升，建议多做练习',
        recommendations: ['刷算法题', '学习经典算法']
      }
    }

    return {
      id: `fallback_${Date.now()}`,
      profileId: this.getCurrentProfileId(),
      type: input.type,
      overallScore: baseScore,
      dimensions,
      strengths: ['基础扎实', '学习态度良好'],
      weaknesses: ['算法能力不足', '缺乏实战经验'],
      recommendations: ['多做项目实践', '加强算法学习', '参与开源贡献'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 私有方法：创建技能评估
   */
  private createSkillAssessment(skill: string, score: number): SkillAssessment {
    let level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    
    if (score >= 80) level = 'expert'
    else if (score >= 65) level = 'advanced'
    else if (score >= 45) level = 'intermediate'
    else level = 'beginner'

    return {
      skill,
      level,
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.7,
      evidence: ['基于输入信息推断'],
      improvements: ['需要更多实践']
    }
  }
}

/**
 * 默认评估服务实例
 */
export const refactorAssessmentService = new RefactorAssessmentService() 