import React, { useState } from 'react'
import { AssessmentForm } from './components/AssessmentForm'
import { AssessmentResult } from './components/AssessmentResult'
import { 
  learningSystemService,
  LearningSystemStatus
} from '../learningSystem'
import { AbilityAssessmentService } from './service'
import { AssessmentInput, AbilityAssessment } from './types'
import { log, error } from '../../utils/logger'
import { addActivityRecord } from '../profileSettings/service'

export const AbilityAssessView: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [abilityService] = useState(() => new AbilityAssessmentService())
  const [assessment, setAssessment] = useState<AbilityAssessment | null>(
    abilityService.getCurrentAssessment()
  )
  const [systemStatus, setSystemStatus] = useState<LearningSystemStatus | null>(null)
  const [improvementPlan, setImprovementPlan] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 获取系统状态
  const refreshSystemStatus = async () => {
    try {
      const status = await learningSystemService.getSystemStatus()
      setSystemStatus(status)
    } catch (err) {
      log('[AbilityAssessView] Failed to get system status:', err)
    }
  }

  // 刷新评估数据和系统状态
  const refreshData = async () => {
    setAssessment(abilityService.getCurrentAssessment())
    await refreshSystemStatus()
  }

  // 初始化时获取系统状态
  React.useEffect(() => {
    refreshSystemStatus()
  }, [])

  // 处理评估提交
  const handleAssessmentSubmit = async (input: AssessmentInput) => {
    setLoading(true)
    setErrorMsg(null)
    
    try {
      log('[AbilityAssessView] Starting assessment through Learning System')
      
      // 使用Learning System统一服务
      const result = await learningSystemService.executeAbilityAssessment(input)
      setAssessment(result.assessment)
      setSystemStatus(result.systemStatus)
      
      // 记录活动
      addActivityRecord({
        type: 'assessment',
        action: '完成能力评估',
        details: {
          overallScore: result.assessment.overallScore,
          assessmentDate: result.assessment.metadata.assessmentDate,
          assessmentMethod: result.assessment.metadata.assessmentMethod
        }
      })
      
      log('[AbilityAssessView] Assessment completed through Learning System')
    } catch (err) {
      error('[AbilityAssessView] Assessment failed:', err)
      setErrorMsg(err instanceof Error ? err.message : '评估失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重新评估
  const handleReassess = () => {
    setAssessment(null)
    setImprovementPlan(null)
    setErrorMsg(null)
    refreshSystemStatus()
  }

  // 生成改进计划
  const handleGenerateImprovement = async () => {
    if (!assessment) return
    
    setLoading(true)
    try {
      const plan = await learningSystemService.generateAbilityImprovementPlan()
      setImprovementPlan(plan)
    } catch (err) {
      error('[AbilityAssessView] Failed to generate improvement plan:', err)
      setErrorMsg('生成改进计划失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出报告
  const handleExport = () => {
    if (!assessment) return
    
    try {
      const report = abilityService.exportReport(assessment)
      
      // 创建下载链接
      const blob = new Blob([report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `能力评估报告_${new Date().toLocaleDateString()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      error('[AbilityAssessView] Failed to export report:', err)
      setErrorMsg('导出报告失败')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🧠 智能能力评估</h1>
        <p className="text-gray-600 mt-2">
          通过AI分析您的简历或完成技能问卷，获得个性化的能力评估报告
        </p>
      </div>

      {/* 系统状态提示 */}
      {systemStatus && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-blue-500 text-2xl flex-shrink-0">🏗️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Learning System状态</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 mb-1">
                    📊 <strong>当前阶段</strong>: {
                      systemStatus.currentPhase === 'assessment' ? '能力评估' :
                      systemStatus.currentPhase === 'goal_setting' ? '目标设定' :
                      systemStatus.currentPhase === 'path_planning' ? '路径规划' :
                      systemStatus.currentPhase === 'learning' ? '学习进行中' : '学习回顾'
                    }
                  </p>
                  <p className="text-blue-700 mb-1">
                    🎯 <strong>设置完成度</strong>: {systemStatus.setupComplete ? '✅ 已完成' : '🔄 进行中'}
                  </p>
                  <p className="text-blue-700">
                    📈 <strong>整体进度</strong>: {Math.round(systemStatus.progress.overallProgress)}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 mb-1">
                    🎯 <strong>活跃目标</strong>: {systemStatus.progress.activeGoals} 个
                  </p>
                  <p className="text-blue-700 mb-1">
                    🛤️ <strong>活跃路径</strong>: {systemStatus.progress.activePaths} 条
                  </p>
                  <p className="text-blue-700">
                    📝 <strong>完成节点</strong>: {systemStatus.progress.completedNodes}/{systemStatus.progress.totalNodes}
                  </p>
                </div>
              </div>
              {systemStatus.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-800 font-medium mb-2">💡 系统建议:</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {systemStatus.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 主要内容 */}
      {!assessment ? (
        <>
          <AssessmentForm 
            onSubmit={handleAssessmentSubmit}
            loading={loading}
          />
        </>
      ) : (
        <>
          <AssessmentResult 
            assessment={assessment}
            onGenerateImprovement={handleGenerateImprovement}
            onExport={handleExport}
          />
          
          {/* 统一系统操作提示 */}
          {systemStatus && !systemStatus.setupComplete && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-green-500 text-2xl flex-shrink-0">🎯</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">下一步建议</h3>
                  <p className="text-green-800 mb-3">
                    能力评估已完成！根据您的评估结果，建议继续以下步骤：
                  </p>
                  <div className="space-y-2">
                    {systemStatus.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-green-700">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => window.location.href = '#goal-setting'}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      设定学习目标
                    </button>
                    <button
                      onClick={() => window.location.href = '#learning-path'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      管理学习路径
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 改进计划 */}
          {improvementPlan && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">📈 能力提升计划</h3>
              <div className="text-yellow-800 whitespace-pre-wrap">
                {improvementPlan}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleReassess}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              重新评估
            </button>
            {!improvementPlan && (
              <button
                onClick={handleGenerateImprovement}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? '生成中...' : '生成提升计划'}
              </button>
            )}
            <button
              onClick={handleExport}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              导出报告
            </button>
            <button
              onClick={refreshData}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              刷新状态
            </button>
          </div>
        </>
      )}
    </div>
  )
} 