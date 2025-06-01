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
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { Loading } from '../../ui/Loading/Loading'
import { Alert } from '../../ui/Alert/Alert'
import { refactorAIService } from '../../../services/aiService'
import { refactorGoalService } from '../../../services/goalService'
import { GoalFormData } from '../../../types/goal'
import { AIServiceStatus } from '../../../types/ai'

export interface GoalRecommendationsProps {
  onSelectRecommendation?: (recommendation: GoalRecommendation) => void
  onCreateFromNLP?: (description: string) => void
  className?: string
}

interface GoalRecommendation {
  id: string
  title: string
  description: string
  category: string
  priority: number
  reasoning: string
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  confidence: number
}

interface QuestionnaireAnswers {
  experience_level: string
  learning_time: string
  learning_goal: string[]
  project_preference: string[]
  career_direction: string
  current_skills: string[]
  challenge_level: string
}

const GOAL_CATEGORIES = [
  { id: 'frontend', name: '前端开发', icon: '🎨', description: '构建用户界面和交互体验' },
  { id: 'backend', name: '后端开发', icon: '⚙️', description: '服务器端开发和API设计' },
  { id: 'fullstack', name: '全栈开发', icon: '🚀', description: '前后端全栈技术栈' },
  { id: 'automation', name: '办公自动化', icon: '🤖', description: 'Python自动化和脚本编程' },
  { id: 'ai', name: 'AI与机器学习', icon: '🧠', description: '人工智能和数据科学' },
  { id: 'mobile', name: '移动开发', icon: '📱', description: 'iOS和Android应用开发' },
  { id: 'game', name: '游戏开发', icon: '🎮', description: '游戏编程和引擎开发' },
  { id: 'data', name: '数据分析', icon: '📊', description: '数据分析和可视化' }
]

const QUESTIONNAIRE_CONFIG = [
  {
    key: 'experience_level',
    question: '您的编程经验水平？',
    type: 'radio',
    options: [
      { value: 'beginner', label: '新手 - 刚开始学习编程' },
      { value: 'junior', label: '初级 - 有一些基础，能写简单程序' },
      { value: 'intermediate', label: '中级 - 能独立完成项目' },
      { value: 'senior', label: '高级 - 有丰富项目经验' }
    ]
  },
  {
    key: 'learning_time',
    question: '每周可投入的学习时间？',
    type: 'radio',
    options: [
      { value: '5-10h', label: '5-10小时 - 业余时间学习' },
      { value: '10-20h', label: '10-20小时 - 较多空闲时间' },
      { value: '20-30h', label: '20-30小时 - 全职学习' },
      { value: '30h+', label: '30小时以上 - 密集学习' }
    ]
  },
  {
    key: 'learning_goal',
    question: '您的学习目标是？（可多选）',
    type: 'checkbox',
    options: [
      { value: 'job', label: '找工作/转行' },
      { value: 'skill_upgrade', label: '技能提升' },
      { value: 'side_project', label: '个人项目' },
      { value: 'startup', label: '创业准备' },
      { value: 'hobby', label: '兴趣爱好' }
    ]
  },
  {
    key: 'project_preference',
    question: '更喜欢哪类项目？（可多选）',
    type: 'checkbox',
    options: [
      { value: 'web', label: '网站应用' },
      { value: 'mobile', label: '手机应用' },
      { value: 'desktop', label: '桌面软件' },
      { value: 'data', label: '数据分析' },
      { value: 'ai', label: 'AI/机器学习' },
      { value: 'game', label: '游戏开发' }
    ]
  },
  {
    key: 'career_direction',
    question: '期望的职业方向？',
    type: 'radio',
    options: [
      { value: 'frontend', label: '前端工程师' },
      { value: 'backend', label: '后端工程师' },
      { value: 'fullstack', label: '全栈工程师' },
      { value: 'data_scientist', label: '数据科学家' },
      { value: 'ai_engineer', label: 'AI工程师' },
      { value: 'mobile_dev', label: '移动开发工程师' }
    ]
  }
]

export const GoalRecommendations: React.FC<GoalRecommendationsProps> = ({
  onSelectRecommendation,
  onCreateFromNLP,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState<'selection' | 'categories' | 'questionnaire' | 'nlp' | 'recommendations'>('selection')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers>({
    experience_level: '',
    learning_time: '',
    learning_goal: [],
    project_preference: [],
    career_direction: '',
    current_skills: [],
    challenge_level: ''
  })
  const [nlpInput, setNlpInput] = useState('')
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<AIServiceStatus | null>(null)

  // 检查AI状态
  useEffect(() => {
    checkAIStatus()
  }, [])

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

  // 处理类别选择
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // 处理问卷答案更新
  const handleQuestionnaireUpdate = (key: string, value: string | string[]) => {
    setQuestionnaireAnswers(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 生成AI推荐
  const generateRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      let recommendations: GoalRecommendation[]

      if (currentMode === 'nlp') {
        // 自然语言处理模式
        recommendations = await refactorGoalService.generateFromNLP(nlpInput)
      } else {
        // 结构化推荐模式
        recommendations = await refactorGoalService.generateRecommendations(
          selectedCategories,
          questionnaireAnswers
        )
      }

      setRecommendations(recommendations)
      setCurrentMode('recommendations')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成推荐失败'
      setError(errorMessage)
      console.error('Failed to generate recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 选择推荐
  const handleSelectRecommendation = (recommendation: GoalRecommendation) => {
    if (onSelectRecommendation) {
      onSelectRecommendation(recommendation)
    }
  }

  // 重新开始
  const handleRestart = () => {
    setCurrentMode('selection')
    setSelectedCategories([])
    setQuestionnaireAnswers({
      experience_level: '',
      learning_time: '',
      learning_goal: [],
      project_preference: [],
      career_direction: '',
      current_skills: [],
      challenge_level: ''
    })
    setNlpInput('')
    setRecommendations([])
    setError(null)
  }

  // 渲染模式选择
  if (currentMode === 'selection') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>✨ AI智能目标推荐</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            选择您偏好的目标创建方式，AI将为您生成个性化的学习目标：
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="lg"
              className="h-auto p-6 flex-col items-start space-y-3"
              onClick={() => setCurrentMode('categories')}
            >
              <div className="text-3xl">🎯</div>
              <div className="font-semibold">结构化推荐</div>
              <div className="text-sm text-left">
                通过选择感兴趣的领域和填写问卷，获得精准的学习目标推荐
              </div>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="h-auto p-6 flex-col items-start space-y-3"
              onClick={() => setCurrentMode('nlp')}
            >
              <div className="text-3xl">💬</div>
              <div className="font-semibold">自然语言描述</div>
              <div className="text-sm text-left">
                用自然语言描述您的学习意图，AI为您智能解析并推荐目标
              </div>
            </Button>
          </div>

          {aiStatus && !aiStatus.available && (
            <Alert variant="warning">
              <p>AI服务暂不可用，将使用基础推荐功能。</p>
              <p className="text-sm mt-1">配置API密钥后可享受完整AI推荐体验。</p>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // 渲染类别选择
  if (currentMode === 'categories') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>选择感兴趣的学习领域</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            选择您感兴趣的技术领域（可多选），我们将为您推荐相关的学习目标：
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GOAL_CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={selectedCategories.includes(category.id) ? 'primary' : 'secondary'}
                className="h-auto p-4 flex-col items-center space-y-2"
                onClick={() => handleCategoryToggle(category.id)}
              >
                <div className="text-2xl">{category.icon}</div>
                <div className="font-semibold">{category.name}</div>
                <div className="text-xs text-center">{category.description}</div>
              </Button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="secondary" onClick={handleRestart}>
              重新选择
            </Button>
            <Badge variant="info">
              已选择 {selectedCategories.length} 个领域
            </Badge>
            <Button
              variant="primary"
              onClick={() => setCurrentMode('questionnaire')}
              disabled={selectedCategories.length === 0}
            >
              下一步：填写问卷
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 渲染问卷
  if (currentMode === 'questionnaire') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>个性化问卷</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            请填写以下信息，帮助我们为您生成更精准的学习目标推荐：
          </p>

          <div className="space-y-6">
            {QUESTIONNAIRE_CONFIG.map(config => (
              <div key={config.key} className="space-y-3">
                <h4 className="font-medium text-gray-900">{config.question}</h4>
                
                {config.type === 'radio' && (
                  <div className="space-y-2">
                    {config.options.map(option => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={config.key}
                          value={option.value}
                          checked={questionnaireAnswers[config.key as keyof QuestionnaireAnswers] === option.value}
                          onChange={(e) => handleQuestionnaireUpdate(config.key, e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {config.type === 'checkbox' && (
                  <div className="space-y-2">
                    {config.options.map(option => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={(questionnaireAnswers[config.key as keyof QuestionnaireAnswers] as string[]).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = questionnaireAnswers[config.key as keyof QuestionnaireAnswers] as string[]
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value)
                            handleQuestionnaireUpdate(config.key, newValues)
                          }}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="secondary" onClick={() => setCurrentMode('categories')}>
              上一步
            </Button>
            <Button
              variant="primary"
              onClick={generateRecommendations}
              loading={loading}
              disabled={!questionnaireAnswers.experience_level || !questionnaireAnswers.learning_time}
            >
              生成AI推荐
            </Button>
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // 渲染自然语言输入
  if (currentMode === 'nlp') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>💬 描述您的学习意图</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            用自然语言详细描述您想要学习的内容、目标和期望，AI将为您智能解析并生成合适的学习目标：
          </p>

          <div className="space-y-4">
            <textarea
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder="例如：我想学习前端开发，希望能够独立做出漂亮的网站，我是编程新手，每周可以投入15小时学习，目标是3个月后能找到相关工作..."
              rows={6}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-sm text-gray-500">
              {nlpInput.length}/500 字符 - 建议详细描述您的背景、目标和期望
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 描述建议</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 说明您的编程基础和经验水平</li>
              <li>• 描述具体想学习的技术或领域</li>
              <li>• 提及学习目标和时间规划</li>
              <li>• 说明学习动机（工作、兴趣、项目等）</li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="secondary" onClick={handleRestart}>
              重新选择模式
            </Button>
            <Button
              variant="primary"
              onClick={generateRecommendations}
              loading={loading}
              disabled={nlpInput.length < 20}
            >
              AI智能解析
            </Button>
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // 渲染推荐结果
  if (currentMode === 'recommendations') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>🎯 为您推荐的学习目标</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🤔</div>
              <p className="text-gray-600 mb-4">暂未生成推荐，请重试或调整输入</p>
              <Button variant="primary" onClick={handleRestart}>
                重新开始
              </Button>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                基于您的输入，AI为您推荐以下学习目标，点击选择感兴趣的目标：
              </p>

              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <Card key={recommendation.id} hover className="transition-all">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {recommendation.title}
                            </h3>
                            <Badge variant="primary">
                              优先级 {recommendation.priority}
                            </Badge>
                            <Badge variant="secondary">
                              {recommendation.targetLevel}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{recommendation.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-sm text-gray-500">技能要求：</span>
                            {recommendation.requiredSkills.slice(0, 4).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {recommendation.requiredSkills.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{recommendation.requiredSkills.length - 4}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>💡 推荐理由：{recommendation.reasoning}</p>
                            <p>⏱️ 预计时间：{recommendation.estimatedTimeWeeks} 周</p>
                          </div>
                        </div>
                        
                        <div className="ml-4 space-y-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSelectRecommendation(recommendation)}
                          >
                            选择目标
                          </Button>
                          {recommendation.confidence && (
                            <div className="text-xs text-center text-gray-500">
                              置信度 {Math.round(recommendation.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="secondary" onClick={handleRestart}>
                  重新推荐
                </Button>
                <div className="text-sm text-gray-500">
                  共推荐 {recommendations.length} 个目标
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
} 