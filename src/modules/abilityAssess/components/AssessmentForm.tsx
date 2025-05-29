import React, { useState } from 'react'
import { AssessmentInput, QuestionnaireResponse } from '../types'

interface AssessmentFormProps {
  onSubmit: (input: AssessmentInput) => void
  loading?: boolean
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, loading }) => {
  const [mode, setMode] = useState<'resume' | 'questionnaire'>('resume')
  const [resumeText, setResumeText] = useState('')
  const [questionnaire, setQuestionnaire] = useState<Partial<QuestionnaireResponse>>({
    experience: {
      yearsOfCoding: 0,
      languages: [],
      frameworks: [],
      projects: []
    },
    skills: {}
  })

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setResumeText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'resume' && resumeText.trim()) {
      onSubmit({
        type: 'resume',
        content: resumeText
      })
    } else if (mode === 'questionnaire') {
      onSubmit({
        type: 'questionnaire',
        content: questionnaire as QuestionnaireResponse
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">能力评估</h2>
      
      {/* 模式选择 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('resume')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            mode === 'resume' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">📄</div>
          <div className="font-medium">简历分析</div>
          <div className="text-sm text-gray-600 mt-1">上传简历或粘贴文本</div>
        </button>
        
        <button
          onClick={() => setMode('questionnaire')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            mode === 'questionnaire' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">📋</div>
          <div className="font-medium">技能问卷</div>
          <div className="text-sm text-gray-600 mt-1">填写详细技能问卷</div>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'resume' ? (
          <div className="space-y-4">
            {/* 文件上传 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📤</div>
              <label className="cursor-pointer">
                <span className="text-blue-500 hover:text-blue-600">选择文件</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="text-sm text-gray-500 mt-2">
                支持 TXT, PDF, DOC, DOCX 格式
              </div>
            </div>

            {/* 文本输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                或者直接粘贴简历内容
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入您的简历内容，包括教育背景、工作经历、项目经验、技能等..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 编程经验 */}
            <div>
              <h3 className="font-medium mb-3">编程经验</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    编程年限
                  </label>
                  <select
                    value={questionnaire.experience?.yearsOfCoding || 0}
                    onChange={(e) => setQuestionnaire({
                      ...questionnaire,
                      experience: {
                        ...questionnaire.experience!,
                        yearsOfCoding: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value={0}>少于1年</option>
                    <option value={1}>1-2年</option>
                    <option value={3}>3-5年</option>
                    <option value={5}>5-10年</option>
                    <option value={10}>10年以上</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    熟悉的编程语言（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={questionnaire.experience?.languages?.join(', ') || ''}
                    onChange={(e) => setQuestionnaire({
                      ...questionnaire,
                      experience: {
                        ...questionnaire.experience!,
                        languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="如：Python, JavaScript, Java"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    使用过的框架（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={questionnaire.experience?.frameworks?.join(', ') || ''}
                    onChange={(e) => setQuestionnaire({
                      ...questionnaire,
                      experience: {
                        ...questionnaire.experience!,
                        frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="如：React, Django, Spring"
                  />
                </div>
              </div>
            </div>

            {/* 技能自评 */}
            <div>
              <h3 className="font-medium mb-3">技能自评（0-10分）</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'algorithm', label: '算法基础' },
                  { key: 'dataStructure', label: '数据结构' },
                  { key: 'systemDesign', label: '系统设计' },
                  { key: 'database', label: '数据库' },
                  { key: 'frontend', label: '前端开发' },
                  { key: 'backend', label: '后端开发' },
                  { key: 'devops', label: '运维部署' },
                  { key: 'testing', label: '测试能力' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={questionnaire.skills?.[key] || 0}
                      onChange={(e) => setQuestionnaire({
                        ...questionnaire,
                        skills: {
                          ...questionnaire.skills,
                          [key]: Number(e.target.value)
                        }
                      })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || (mode === 'resume' && !resumeText.trim())}
          className="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              正在分析...
            </>
          ) : (
            <>
              开始评估
              <span>→</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
} 