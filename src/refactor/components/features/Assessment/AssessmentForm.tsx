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

import React, { useState } from 'react'
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Input, FormField, Label } from '../../ui/Input/Input'
import { Loading } from '../../ui/Loading/Loading'
import { Alert } from '../../ui/Alert/Alert'
import { AssessmentInput, QuestionnaireResponse } from '../../../types/assessment'

interface AssessmentFormProps {
  onSubmit: (input: AssessmentInput) => Promise<void>
  loading?: boolean
}

interface QuestionnaireData {
  experience: string
  languages: string[]
  projectCount: string
  industryExperience: string
  preferredRole: string
  learningGoal: string
  timeCommitment: string
  challenges: string
}

const PROGRAMMING_LANGUAGES = [
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 
  'PHP', 'Swift', 'Kotlin', 'C', 'Ruby', 'SQL', 'HTML/CSS'
]

const EXPERIENCE_OPTIONS = [
  { value: '0', label: '0年 - 完全新手' },
  { value: '0.5', label: '6个月内 - 初学者' },
  { value: '1', label: '1年 - 基础入门' },
  { value: '2', label: '2年 - 初级开发' },
  { value: '3-5', label: '3-5年 - 中级开发' },
  { value: '5+', label: '5年以上 - 高级开发' }
]

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, loading = false }) => {
  const [assessmentType, setAssessmentType] = useState<'resume' | 'questionnaire' | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    experience: '',
    languages: [],
    projectCount: '',
    industryExperience: '',
    preferredRole: '',
    learningGoal: '',
    timeCommitment: '',
    challenges: ''
  })
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.type.includes('text')) {
      setError('请上传PDF或文本文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      setError('文件大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setResumeText(content)
      setError(null)
    }
    
    if (file.type === 'application/pdf') {
      // 简单的PDF文本提取提示
      setResumeText(`PDF文件已上传：${file.name}\n请手动复制PDF中的文本内容到下方文本框中。`)
    } else {
      reader.readAsText(file)
    }
  }

  const handleLanguageToggle = (language: string) => {
    setQuestionnaire(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const handleQuestionnaireChange = (field: keyof QuestionnaireData, value: string) => {
    setQuestionnaire(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitResume = async () => {
    if (!resumeText.trim()) {
      setError('请输入简历内容')
      return
    }

    const input: AssessmentInput = {
      type: 'resume',
      data: {
        resumeText: resumeText.trim()
      }
    }

    try {
      await onSubmit(input)
    } catch (error) {
      setError(error instanceof Error ? error.message : '提交失败')
    }
  }

  const handleSubmitQuestionnaire = async () => {
    // 验证必填字段
    if (!questionnaire.experience || questionnaire.languages.length === 0) {
      setError('请完成必填项：编程经验和熟悉的编程语言')
      return
    }

    // 转换为QuestionnaireResponse格式
    const questionnaireResponses: QuestionnaireResponse[] = [
      { questionId: 'experience', answer: questionnaire.experience },
      { questionId: 'languages', answer: questionnaire.languages.join(',') },
      { questionId: 'projectCount', answer: questionnaire.projectCount },
      { questionId: 'industryExperience', answer: questionnaire.industryExperience },
      { questionId: 'preferredRole', answer: questionnaire.preferredRole },
      { questionId: 'learningGoal', answer: questionnaire.learningGoal },
      { questionId: 'timeCommitment', answer: questionnaire.timeCommitment },
      { questionId: 'challenges', answer: questionnaire.challenges }
    ]

    const input: AssessmentInput = {
      type: 'questionnaire',
      data: {
        questionnaire: questionnaireResponses
      }
    }

    try {
      await onSubmit(input)
    } catch (error) {
      setError(error instanceof Error ? error.message : '提交失败')
    }
  }

  const resetForm = () => {
    setAssessmentType(null)
    setResumeText('')
    setQuestionnaire({
      experience: '',
      languages: [],
      projectCount: '',
      industryExperience: '',
      preferredRole: '',
      learningGoal: '',
      timeCommitment: '',
      challenges: ''
    })
    setError(null)
  }

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loading variant="spinner" size="lg" />
          <p className="mt-4 text-gray-600">正在分析您的能力水平...</p>
          <p className="text-sm text-gray-500">这可能需要几秒钟时间</p>
        </CardContent>
      </Card>
    )
  }

  if (!assessmentType) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>选择评估方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 mb-6">
            请选择一种评估方式，我们将基于您提供的信息进行全面的能力分析：
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="lg"
              className="h-auto p-6 flex-col items-start space-y-2"
              onClick={() => setAssessmentType('resume')}
            >
              <div className="text-2xl">📄</div>
              <div className="font-semibold">简历分析</div>
              <div className="text-sm text-left">
                上传或粘贴您的简历，AI将自动分析您的技能和经验
              </div>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="h-auto p-6 flex-col items-start space-y-2"
              onClick={() => setAssessmentType('questionnaire')}
            >
              <div className="text-2xl">📝</div>
              <div className="font-semibold">问卷评估</div>
              <div className="text-sm text-left">
                填写详细问卷，帮助我们更准确地评估您的技能水平
              </div>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">评估维度说明</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div>• 编程基础能力</div>
              <div>• 算法与数据结构</div>
              <div>• 项目实战经验</div>
              <div>• 系统设计能力</div>
              <div>• 沟通协作能力</div>
              <div>• 学习成长潜力</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {assessmentType === 'resume' ? '📄 简历分析' : '📝 问卷评估'}
          <Button
            variant="secondary"
            size="sm"
            onClick={resetForm}
          >
            重新选择
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {assessmentType === 'resume' && (
          <div className="space-y-4">
            <FormField
              label="上传简历文件"
              helpText="支持PDF或文本文件，最大5MB"
            >
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </FormField>

            <FormField
              label="简历内容"
              helpText="请粘贴您的简历文本内容，或在上方上传文件后进行编辑"
              required
            >
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="请在此粘贴您的简历内容..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={resetForm}>
                取消
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmitResume}
                disabled={!resumeText.trim()}
              >
                开始分析
              </Button>
            </div>
          </div>
        )}

        {assessmentType === 'questionnaire' && (
          <div className="space-y-6">
            {/* 编程经验 */}
            <FormField label="编程经验" required>
              <select
                value={questionnaire.experience}
                onChange={(e) => handleQuestionnaireChange('experience', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择您的编程经验</option>
                {EXPERIENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* 编程语言 */}
            <FormField label="熟悉的编程语言" required helpText="可多选">
              <div className="grid grid-cols-3 gap-2">
                {PROGRAMMING_LANGUAGES.map(language => (
                  <label key={language} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionnaire.languages.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </FormField>

            {/* 项目经验 */}
            <FormField label="完成的项目数量" helpText="包括学习、工作、个人项目">
              <select
                value={questionnaire.projectCount}
                onChange={(e) => handleQuestionnaireChange('projectCount', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择</option>
                <option value="0">0个项目</option>
                <option value="1-3">1-3个项目</option>
                <option value="4-10">4-10个项目</option>
                <option value="10+">10个以上项目</option>
              </select>
            </FormField>

            {/* 行业经验 */}
            <FormField label="相关行业经验">
              <Input
                value={questionnaire.industryExperience}
                onChange={(e) => handleQuestionnaireChange('industryExperience', e.target.value)}
                placeholder="如：Web开发、移动应用、数据科学、游戏开发等"
              />
            </FormField>

            {/* 期望角色 */}
            <FormField label="期望的发展方向">
              <Input
                value={questionnaire.preferredRole}
                onChange={(e) => handleQuestionnaireChange('preferredRole', e.target.value)}
                placeholder="如：前端工程师、后端工程师、全栈工程师、算法工程师等"
              />
            </FormField>

            {/* 学习目标 */}
            <FormField label="当前学习目标">
              <textarea
                value={questionnaire.learningGoal}
                onChange={(e) => handleQuestionnaireChange('learningGoal', e.target.value)}
                placeholder="描述您希望达到的技能水平或学习目标..."
                className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            {/* 时间投入 */}
            <FormField label="可投入的学习时间">
              <select
                value={questionnaire.timeCommitment}
                onChange={(e) => handleQuestionnaireChange('timeCommitment', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择</option>
                <option value="1-2h/day">每天1-2小时</option>
                <option value="3-4h/day">每天3-4小时</option>
                <option value="5-6h/day">每天5-6小时</option>
                <option value="weekend">仅周末</option>
                <option value="flexible">时间较灵活</option>
              </select>
            </FormField>

            {/* 学习挑战 */}
            <FormField label="当前面临的学习挑战">
              <textarea
                value={questionnaire.challenges}
                onChange={(e) => handleQuestionnaireChange('challenges', e.target.value)}
                placeholder="如：时间不够、缺乏实践机会、不知道从何入手等..."
                className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={resetForm}>
                取消
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmitQuestionnaire}
                disabled={!questionnaire.experience || questionnaire.languages.length === 0}
              >
                开始评估
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 