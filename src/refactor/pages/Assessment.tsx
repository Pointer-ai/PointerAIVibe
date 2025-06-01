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
      const result = await learningApi.getAbilitySummary()
      if (result.success && result.data?.hasAssessment) {
        // 这里需要从系统中获取完整的评估数据
        // 目前先设置为null，表示需要重新评估
        setCurrentAssessment(null)
      }
    } catch (error) {
      console.error('Failed to load assessment:', error)
    }
  }

  const checkAIStatus = async () => {
    try {
      const status = await refactorAIService.getStatus()
      setAiStatus(status)
    } catch (error) {
      console.error('Failed to check AI status:', error)
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
      // 转换为API期望的格式
      const apiInput = {
        type: input.type,
        content: input.type === 'resume' ? input.data.resumeText || '' : JSON.stringify(input.data.questionnaire || {})
      }
      
      // 使用统一的learningApi执行评估
      const result = await learningApi.executeAbilityAssessment(apiInput)
      
      if (result.success && result.data) {
        // 转换为Assessment格式
        const assessment: Assessment = {
          id: `assessment_${Date.now()}`,
          profileId: 'current',
          type: input.type,
          overallScore: result.data.assessment.overallScore,
          dimensions: Object.entries(result.data.assessment.dimensions).reduce((acc, [key, value]: [string, any]) => {
            acc[key] = {
              name: key,
              score: value.score,
              skills: [], // 暂时设为空数组
              summary: `${key}维度评估`,
              recommendations: [`继续提升${key}技能`]
            }
            return acc
          }, {} as { [key: string]: DimensionAssessment }),
          strengths: result.data.assessment.report?.strengths || [],
          weaknesses: result.data.assessment.report?.improvements || [],
          recommendations: result.data.assessment.report?.recommendations || [],
          createdAt: new Date(result.data.assessment.metadata.assessmentDate),
          updatedAt: new Date()
        }
        
        setCurrentAssessment(assessment)
        console.log('评估完成:', assessment)
      } else {
        throw new Error(result.error || '评估失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '评估失败，请重试'
      setError(errorMessage)
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

  const handleGenerateImprovement = async () => {
    if (!currentAssessment) return

    try {
      const result = await learningApi.generateAbilityImprovementPlan()
      if (result.success && result.data) {
        // 将字符串分割成数组
        const planArray = result.data.split('\n').filter(line => line.trim())
        setImprovementPlan(planArray)
      } else {
        throw new Error(result.error || '生成改进计划失败')
      }
    } catch (error) {
      console.error('Failed to generate improvement plan:', error)
      setError('生成改进计划失败，请重试')
    }
  }

  const handleExportReport = () => {
    if (!currentAssessment) return

    // 生成Markdown格式的报告
    const report = [
      `# 能力评估报告`,
      ``,
      `**评估时间**: ${new Date(currentAssessment.createdAt).toLocaleDateString('zh-CN')}`,
      `**总体评分**: ${currentAssessment.overallScore}/100`,
      ``,
      `## 维度评分`,
      ``,
      ...Object.entries(currentAssessment.dimensions).map(([key, dimension]) => 
        `- **${key}**: ${dimension.score}/100`
      ),
      ``,
      `## 优势领域`,
      ``,
      ...currentAssessment.strengths.map(strength => `- ${strength}`),
      ``,
      `## 待改进项`,
      ``,
      ...currentAssessment.weaknesses.map(weakness => `- ${weakness}`),
      ``,
      `## 发展建议`,
      ``,
      ...currentAssessment.recommendations.map(rec => `- ${rec}`),
      ``
    ].join('\n')
    
    // 创建并下载文件
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `能力评估报告_${new Date().toLocaleDateString('zh-CN')}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                请先在Profile设置中配置AI API密钥以获得更准确的评估结果。
                未配置AI服务时将使用基础评估模式。
              </p>
              {onNavigate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('profile-settings')}
                  className="mt-2"
                >
                  前往配置
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
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
            onGenerateImprovement={handleGenerateImprovement}
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