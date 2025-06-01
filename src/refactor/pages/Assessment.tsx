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

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card'
import { Alert } from '../components/ui/Alert/Alert'
import { AssessmentForm, AssessmentResult } from '../components/features/Assessment'
import { learningApi } from '../../api'
import { refactorAIService } from '../services/aiService'
import { Assessment, AssessmentInput, DimensionAssessment } from '../types/assessment'
import { AIServiceStatus } from '../types/ai'

interface AssessmentPageProps {
  onNavigate?: (view: string) => void
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ onNavigate }) => {
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<AIServiceStatus | null>(null)
  const [improvementPlan, setImprovementPlan] = useState<string[] | null>(null)

  // 初始化时加载数据
  useEffect(() => {
    loadCurrentAssessment()
    checkAIStatus()
    debugAIConfiguration()
  }, [])

  const loadCurrentAssessment = async () => {
    try {
      // 通过 learningApi 获取能力概要
      const summaryResponse = await learningApi.getAbilitySummary()
      if (summaryResponse.success && summaryResponse.data) {
        const summary = summaryResponse.data
        console.log('Assessment summary:', summary)
        
        // 如果有评估数据，尝试构建Assessment对象
        if (summary.hasAssessment) {
          // 这里可以扩展为完整的Assessment对象，目前暂时显示概要信息
          console.log('Found existing assessment, overall score:', summary.overallScore)
        }
      }
    } catch (error) {
      console.error('Failed to load assessment:', error)
    }
  }

  const checkAIStatus = async () => {
    try {
      const isHealthy = await refactorAIService.checkHealth()
      const config = refactorAIService.getConfig()
      setAiStatus({
        isConfigured: !!config,
        available: !!config && isHealthy,
        isHealthy,
        provider: config?.provider || null,
        model: config?.model || null,
        lastCheck: new Date()
      })
    } catch (error) {
      console.error('Failed to check AI status:', error)
      setAiStatus({
        isConfigured: false,
        available: false,
        isHealthy: false,
        provider: null,
        model: null,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : '检查状态失败'
      })
    }
  }

  const debugAIConfiguration = () => {
    console.log('=== AI配置调试信息 ===')
    
    // 检查profiles系统
    const profiles = localStorage.getItem('profiles')
    if (profiles) {
      const profileStore = JSON.parse(profiles)
      console.log('Profiles系统状态:', {
        currentProfileId: profileStore.currentProfileId,
        profilesCount: profileStore.profiles?.length || 0
      })
      
      if (profileStore.currentProfileId) {
        const currentProfile = profileStore.profiles.find((p: any) => p.id === profileStore.currentProfileId)
        if (currentProfile) {
          console.log('当前Profile:', currentProfile.name)
          console.log('API配置:', currentProfile.data?.settings?.apiConfig)
        }
      }
    }
    
    // 检查AI服务配置
    const aiConfig = refactorAIService.getConfig()
    console.log('AI服务配置:', aiConfig)
    
    // 检查旧格式
    const oldProfile = localStorage.getItem('currentProfile')
    console.log('旧Profile系统:', oldProfile)
  }

  const handleAssessmentSubmit = async (input: AssessmentInput) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Starting assessment with input:', input)
      
      // 转换输入格式为 learningApi 期望的格式
      const assessmentInput = {
        type: input.type,
        content: input.type === 'resume' 
          ? input.data.resumeText || ''
          : JSON.stringify(input.data.questionnaire || [])
      }
      
      // 通过 learningApi 执行评估
      const response = await learningApi.executeAbilityAssessment(assessmentInput)
      
      if (response.success && response.data) {
        console.log('评估完成:', response.data)
        
        // 转换原系统的评估结果为新格式
        const assessment = convertAbilityAssessmentToAssessment(response.data.assessment)
        setCurrentAssessment(assessment)
        
        // 生成改进计划
        const planResponse = await learningApi.generateAbilityImprovementPlan()
        if (planResponse.success && planResponse.data) {
          // 将字符串分割为数组
          const planLines = planResponse.data.split('\n').filter(line => line.trim())
          setImprovementPlan(planLines)
        }
        
      } else {
        throw new Error(response.error || '评估失败')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '评估失败，请重试'
      
      // 检查是否是API key相关的错误
      if (errorMessage.includes('API KEY') || errorMessage.includes('AI服务暂时不可用')) {
        setError(errorMessage)
        
        // 如果是API key问题，显示基础评估信息
        try {
          console.log('API服务不可用，显示基础评估信息...')
          const summaryResponse = await learningApi.getAbilitySummary()
          if (summaryResponse.success && summaryResponse.data) {
            console.log('基础评估信息:', summaryResponse.data)
          }
        } catch (fallbackError) {
          console.error('获取基础评估信息也失败了:', fallbackError)
        }
      } else {
        setError(errorMessage)
      }
      
      console.error('Assessment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReassess = () => {
    setCurrentAssessment(null)
    setImprovementPlan(null)
    setError(null)
  }

  const handleGenerateImprovementPlan = async () => {
    if (!currentAssessment) return
    
    try {
      const response = await learningApi.generateAbilityImprovementPlan()
      if (response.success && response.data) {
        // 将字符串分割为数组
        const planLines = response.data.split('\n').filter(line => line.trim())
        setImprovementPlan(planLines)
      } else {
        throw new Error(response.error || '生成改进计划失败')
      }
    } catch (error) {
      console.error('Failed to generate improvement plan:', error)
      setError('生成改进计划失败')
    }
  }

  const handleExportReport = () => {
    if (!currentAssessment) return
    
    try {
      // 生成报告内容
      const report = generateAssessmentReport(currentAssessment)
      
      // 创建并下载文件
      const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `能力评估报告_${new Date().toLocaleDateString()}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('评估报告已导出')
    } catch (error) {
      console.error('Failed to export report:', error)
      setError('导出报告失败')
    }
  }

  /**
   * 将原系统的 AbilityAssessment 转换为新系统的 Assessment
   */
  const convertAbilityAssessmentToAssessment = (abilityAssessment: any): Assessment => {
    return {
      id: `assessment_${Date.now()}`,
      profileId: 'current',
      type: abilityAssessment.metadata?.assessmentMethod === 'resume' ? 'resume' : 'questionnaire',
      overallScore: abilityAssessment.overallScore,
      dimensions: convertDimensions(abilityAssessment.dimensions || {}),
      strengths: abilityAssessment.report?.strengths || [],
      weaknesses: abilityAssessment.report?.improvements || [],
      recommendations: abilityAssessment.report?.recommendations || [],
      createdAt: new Date(abilityAssessment.metadata?.assessmentDate || Date.now()),
      updatedAt: new Date(abilityAssessment.metadata?.assessmentDate || Date.now())
    }
  }

  /**
   * 转换维度数据
   */
  const convertDimensions = (dimensions: any): { [key: string]: DimensionAssessment } => {
    const result: { [key: string]: DimensionAssessment } = {}
    
    Object.entries(dimensions).forEach(([key, dimension]: [string, any]) => {
      const skills = Object.entries(dimension.skills || {}).map(([skillName, skillData]: [string, any]) => {
        const score = typeof skillData === 'number' ? skillData : skillData.score || 0
        const confidence = typeof skillData === 'number' ? 1.0 : skillData.confidence || 1.0
        
        return {
          skill: skillName,
          level: getSkillLevel(score),
          score,
          confidence,
          evidence: [],
          improvements: []
        }
      })

      result[key] = {
        name: getDimensionDisplayName(key),
        score: dimension.score || 0,
        skills,
        summary: `${getDimensionDisplayName(key)}维度评估`,
        recommendations: [`继续提升${getDimensionDisplayName(key)}技能`]
      }
    })
    
    return result
  }

  /**
   * 获取维度显示名称
   */
  const getDimensionDisplayName = (dimension: string): string => {
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
  const getSkillLevel = (score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
    if (score >= 90) return 'expert'
    if (score >= 70) return 'advanced'
    if (score >= 50) return 'intermediate'
    return 'beginner'
  }

  /**
   * 生成评估报告
   */
  const generateAssessmentReport = (assessment: Assessment): string => {
    const level = getAssessmentLevel(assessment.overallScore)
    
    let report = `# 能力评估报告\n\n`
    report += `**评估日期**: ${assessment.createdAt.toLocaleDateString()}\n`
    report += `**总体评分**: ${assessment.overallScore}/100\n`
    report += `**能力级别**: ${level}\n\n`
    
    report += `## 各维度评分\n\n`
    Object.entries(assessment.dimensions).forEach(([key, dimension]) => {
      report += `### ${dimension.name}\n`
      report += `- **评分**: ${dimension.score}/100\n`
      report += `- **概要**: ${dimension.summary}\n`
      if (dimension.skills.length > 0) {
        report += `- **技能**: ${dimension.skills.map(s => s.skill).join(', ')}\n`
      }
      report += `\n`
    })
    
    if (assessment.strengths.length > 0) {
      report += `## 优势领域\n\n`
      assessment.strengths.forEach(strength => {
        report += `- ${strength}\n`
      })
      report += `\n`
    }
    
    if (assessment.weaknesses.length > 0) {
      report += `## 待改进领域\n\n`
      assessment.weaknesses.forEach(weakness => {
        report += `- ${weakness}\n`
      })
      report += `\n`
    }
    
    if (assessment.recommendations.length > 0) {
      report += `## 学习建议\n\n`
      assessment.recommendations.forEach(recommendation => {
        report += `- ${recommendation}\n`
      })
      report += `\n`
    }
    
    return report
  }

  /**
   * 获取评估级别
   */
  const getAssessmentLevel = (score: number): string => {
    if (score >= 90) return '专家级'
    if (score >= 80) return '高级'
    if (score >= 70) return '中高级'
    if (score >= 60) return '中级'
    if (score >= 50) return '中初级'
    if (score >= 40) return '初级'
    return '入门级'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧠 能力评估</h1>
              <p className="text-gray-600 mt-2">
                通过AI智能分析，全面评估您的编程能力和技能水平
              </p>
            </div>
            
            {onNavigate && (
              <Button
                variant="secondary"
                onClick={() => onNavigate('main')}
              >
                返回主页
              </Button>
            )}
          </div>
        </div>

        {/* AI服务状态检查 */}
        {aiStatus && !aiStatus.isConfigured && (
          <Alert variant="warning" className="mb-6">
            <div className="space-y-2">
              <p className="font-medium">⚠️ AI服务未配置</p>
              <p className="text-sm">
                当前未配置AI API密钥，系统将使用基础评估模式。配置AI服务后可获得：
              </p>
              <ul className="text-sm ml-4 space-y-1">
                <li>• 更精准的简历和技能分析</li>
                <li>• 个性化的能力评估报告</li>
                <li>• 智能的学习建议和职业规划</li>
              </ul>
              {onNavigate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('profile-settings')}
                  className="mt-2"
                >
                  立即配置AI服务
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* AI服务错误状态 */}
        {aiStatus && aiStatus.isConfigured && !aiStatus.available && (
          <Alert variant="error" className="mb-6">
            <div className="space-y-2">
              <p className="font-medium">❌ AI服务连接失败</p>
              <p className="text-sm">
                已配置API密钥但服务无法连接，可能原因：
              </p>
              <ul className="text-sm ml-4 space-y-1">
                <li>• API密钥无效或已过期</li>
                <li>• 网络连接问题</li>
                <li>• API服务暂时不可用</li>
              </ul>
              <p className="text-sm">
                系统将使用基础评估模式，建议检查配置后重试。
              </p>
              {onNavigate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('profile-settings')}
                  className="mt-2"
                >
                  检查配置
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant={currentAssessment ? "warning" : "error"} className="mb-6">
            <div className="space-y-2">
              <p className="font-medium">
                {currentAssessment ? "⚠️ 基础评估模式" : "❌ 评估失败"}
              </p>
              <p className="text-sm">{error}</p>
              {currentAssessment && (
                <p className="text-sm">
                  评估已完成，但使用的是基础模式。配置AI服务后可获得更精准的分析。
                </p>
              )}
            </div>
          </Alert>
        )}

        {/* 成功提示 - 当有评估结果且没有错误时 */}
        {currentAssessment && !error && aiStatus?.available && (
          <Alert variant="success" className="mb-6">
            <div className="space-y-2">
              <p className="font-medium">✅ AI智能评估完成</p>
              <p className="text-sm">
                已使用AI服务对您的能力进行全面分析，评估结果更加精准和个性化。
              </p>
            </div>
          </Alert>
        )}

        {/* 评估状态说明 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">📊</div>
                <div>
                  <h3 className="font-medium">评估状态</h3>
                  <p className="text-sm text-gray-600">
                    {currentAssessment 
                      ? `已完成评估 - ${new Date(currentAssessment.createdAt).toLocaleDateString('zh-CN')}`
                      : '尚未进行能力评估'
                    }
                  </p>
                </div>
              </div>
              
              {currentAssessment && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {currentAssessment.overallScore}
                  </span>
                  <span className="text-gray-500">/ 100</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 主要内容区域 */}
        {!currentAssessment ? (
          // 显示评估表单
          <AssessmentForm
            onSubmit={handleAssessmentSubmit}
            loading={loading}
          />
        ) : (
          // 显示评估结果
          <AssessmentResult
            assessment={currentAssessment}
            onReassess={handleReassess}
            onGenerateImprovement={handleGenerateImprovementPlan}
            onExport={handleExportReport}
            loading={loading}
          />
        )}

        {/* 改进计划显示 */}
        {improvementPlan && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>💡 个性化改进计划</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvementPlan.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 系统特性说明 */}
        {!currentAssessment && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🌟 评估系统特性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-blue-600 text-xl">🤖</div>
                  <h4 className="font-semibold">AI智能分析</h4>
                  <p className="text-sm text-gray-600">
                    使用先进的AI技术分析您的简历或问卷回答，提供专业的能力评估
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-green-600 text-xl">📊</div>
                  <h4 className="font-semibold">多维度评估</h4>
                  <p className="text-sm text-gray-600">
                    从编程基础、算法能力、项目经验、系统设计、沟通协作等5个维度全面评估
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-purple-600 text-xl">💡</div>
                  <h4 className="font-semibold">个性化建议</h4>
                  <p className="text-sm text-gray-600">
                    基于评估结果生成针对性的学习建议和职业发展规划
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-amber-600 text-xl">📈</div>
                  <h4 className="font-semibold">进度跟踪</h4>
                  <p className="text-sm text-gray-600">
                    支持定期重新评估，跟踪技能提升和学习进度
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-red-600 text-xl">🎯</div>
                  <h4 className="font-semibold">精准定位</h4>
                  <p className="text-sm text-gray-600">
                    准确识别技能优势和薄弱环节，为学习规划提供科学依据
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-indigo-600 text-xl">📝</div>
                  <h4 className="font-semibold">报告导出</h4>
                  <p className="text-sm text-gray-600">
                    支持评估报告导出，便于保存和分享评估结果
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AssessmentPage 