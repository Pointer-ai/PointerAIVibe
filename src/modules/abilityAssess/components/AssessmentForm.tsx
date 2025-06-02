import React, { useState } from 'react'
import { AssessmentInput, QuestionnaireResponse } from '../types'
import { parsePDF, isPDF, validatePDFFile } from '../../../utils/pdfParser'
import { log } from '../../../utils/logger'
import { useToast } from '../../../components/common'

interface AssessmentFormProps {
  onSubmit: (input: AssessmentInput) => void
  loading?: boolean
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, loading }) => {
  const [mode, setMode] = useState<'resume' | 'questionnaire'>('resume')
  const [resumeText, setResumeText] = useState('')
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<Partial<QuestionnaireResponse>>({
    experience: {
      yearsOfCoding: 0,
      languages: [],
      frameworks: [],
      projects: []
    },
    skills: {}
  })

  const { showSuccess, showError, showWarning, ToastContainer } = useToast()

  // 处理文件上传（支持文本和 PDF）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 处理 PDF 文件
    if (isPDF(file)) {
      // 先验证文件
      const validation = validatePDFFile(file)
      if (!validation.valid) {
        showError(validation.error || '文件验证失败', '文件验证失败')
        e.target.value = '' // 清空文件选择
        return
      }

      setUploadingPDF(true)
      try {
        log('[AssessmentForm] Parsing PDF file')
        const text = await parsePDF(file)
        
        if (text.length < 50) {
          showWarning('PDF 解析成功，但内容较少。请确保 PDF 包含完整的简历信息。', 'PDF 内容提醒')
        }
        
        setResumeText(text)
        log('[AssessmentForm] PDF parsed successfully')
        showSuccess(`PDF 解析成功！提取了 ${text.length} 个字符的文本内容。`, 'PDF 解析成功')
        
      } catch (error) {
        console.error('PDF parsing error:', error)
        const errorMessage = error instanceof Error ? error.message : 'PDF 解析失败'
        showError(errorMessage, 'PDF 解析失败')
        e.target.value = '' // 清空文件选择
      } finally {
        setUploadingPDF(false)
      }
      return
    }

    // 处理文本文件
    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
      if (file.size > 1024 * 1024) { // 1MB limit for text files
        showError('文本文件过大，请选择小于 1MB 的文件', '文件大小限制')
        e.target.value = ''
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setResumeText(content)
        showSuccess(`文本文件读取成功！内容长度：${content.length} 个字符。`, '文件读取成功')
      }
      reader.onerror = () => {
        showError('文件读取失败，请重试', '文件读取失败')
        e.target.value = ''
      }
      reader.readAsText(file, 'UTF-8')
    } else {
      showError('请上传文本文件（.txt）或 PDF 文件（.pdf）', '文件格式错误')
      e.target.value = ''
    }
  }

  // 简历示例模板
  const resumeTemplate = `姓名：张三
联系方式：zhangsan@email.com | 186xxxx1234

教育背景：
2016-2020 北京大学 计算机科学与技术 本科

工作经历：
2020.07-至今 某某科技公司 前端工程师
- 负责公司核心产品的前端开发，使用 React + TypeScript
- 参与系统架构设计，优化前端性能，页面加载速度提升 40%
- 带领 3 人小组完成新功能模块开发

项目经验：
1. 电商平台前端重构（2021.03-2021.08）
   - 技术栈：React, Redux, Ant Design
   - 负责内容：商品详情页、购物车模块
   - 成果：用户转化率提升 15%

2. 数据可视化平台（2020.09-2021.02）
   - 技术栈：Vue 3, ECharts, TypeScript
   - 负责内容：图表组件开发、数据处理
   - 成果：支持 20+ 种图表类型

技能：
- 编程语言：JavaScript/TypeScript (精通), Python (熟练)
- 前端框架：React, Vue, Angular
- 后端了解：Node.js, Express
- 数据库：MySQL, MongoDB
- 其他：Git, Webpack, Docker`

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
          <div className="text-sm text-gray-600 mt-1">AI 智能分析您的简历</div>
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
            {/* 说明文字 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">📝 使用说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>请在下方文本框中粘贴您的简历内容</li>
                <li>支持上传 PDF 或文本文件</li>
                <li>建议包含：教育背景、工作经历、项目经验、技能清单等</li>
                <li>AI 将基于简历内容评估您的编程能力</li>
                <li>评估结果仅供参考，帮助您了解自己的技能水平</li>
              </ul>
            </div>

            {/* 文本输入 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  简历内容
                </label>
                <button
                  type="button"
                  onClick={() => setResumeText(resumeTemplate)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  使用模板
                </button>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="请输入您的简历内容..."
                disabled={uploadingPDF}
              />
              <div className="mt-2 text-sm text-gray-500">
                字数：{resumeText.length} 字
              </div>
            </div>

            {/* 文件上传（支持 txt 和 pdf） */}
            <div className="text-center text-sm text-gray-500">
              {uploadingPDF ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  正在解析 PDF，请稍候...
                </div>
              ) : (
                <>
                  或者
                  <label className="mx-2 text-blue-600 hover:text-blue-700 cursor-pointer">
                    上传文件
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  （支持 .txt 和 .pdf 格式，PDF 限制 10MB）
                </>
              )}
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
          disabled={loading || uploadingPDF || (mode === 'resume' && !resumeText.trim())}
          className="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              AI 正在分析...
            </>
          ) : (
            <>
              开始评估
              <span>→</span>
            </>
          )}
        </button>
      </form>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
} 