import React, { useState } from 'react'
import { AssessmentForm } from './components/AssessmentForm'
import { AssessmentResult } from './components/AssessmentResult'
import { 
  analyzeAbility, 
  getCurrentAssessment, 
  generateImprovementPlan,
  exportAssessmentReport 
} from './service'
import { AssessmentInput, AbilityAssessment } from './types'
import { log, error } from '../../utils/logger'
import { addActivityRecord } from '../profileSettings/service'

export const AbilityAssessView: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [assessment, setAssessment] = useState<AbilityAssessment | null>(
    getCurrentAssessment()
  )
  const [improvementPlan, setImprovementPlan] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 处理评估提交
  const handleAssessmentSubmit = async (input: AssessmentInput) => {
    setLoading(true)
    setErrorMsg(null)
    
    try {
      log('[AbilityAssessView] Starting assessment')
      const result = await analyzeAbility(input)
      setAssessment(result)
      
      // 记录活动
      addActivityRecord({
        type: 'assessment',
        action: '完成能力评估',
        details: {
          overallScore: result.overallScore,
          assessmentDate: result.metadata.assessmentDate,
          assessmentMethod: result.metadata.assessmentMethod
        }
      })
      
      log('[AbilityAssessView] Assessment completed')
    } catch (err) {
      error('[AbilityAssessView] Assessment failed:', err)
      setErrorMsg(err instanceof Error ? err.message : '评估失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 生成提升计划
  const handleGenerateImprovement = async () => {
    if (!assessment) return
    
    setLoading(true)
    setErrorMsg(null)
    
    try {
      log('[AbilityAssessView] Generating improvement plan')
      const plan = await generateImprovementPlan(assessment)
      setImprovementPlan(plan)
    } catch (err) {
      error('[AbilityAssessView] Failed to generate improvement plan:', err)
      setErrorMsg('生成提升计划失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 导出报告
  const handleExport = () => {
    if (!assessment) return
    
    const report = exportAssessmentReport(assessment)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `能力评估报告_${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 重新评估
  const handleNewAssessment = () => {
    setAssessment(null)
    setImprovementPlan(null)
    setErrorMsg(null)
  }

  return (
    <div className="bg-gray-50">
      {/* 错误提示 */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        </div>
      )}

      {/* 主要内容 */}
      {!assessment ? (
        <AssessmentForm 
          onSubmit={handleAssessmentSubmit}
          loading={loading}
        />
      ) : (
        <>
          <AssessmentResult 
            assessment={assessment}
            onGenerateImprovement={handleGenerateImprovement}
            onExport={handleExport}
          />
          
          {/* 提升计划 */}
          {improvementPlan && (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-bold text-lg mb-4">30天提升计划</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-600">
                    {improvementPlan}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {/* 重新评估按钮 */}
          <div className="max-w-4xl mx-auto px-6 pb-6">
            <button
              onClick={handleNewAssessment}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重新评估
            </button>
          </div>
        </>
      )}
    </div>
  )
} 