import React, { useState, useEffect } from 'react'
import { AssessmentForm } from './components/AssessmentForm'
import { AssessmentResult } from './components/AssessmentResult'
import { ImprovementPlanView } from './components/ImprovementPlanView'
import { AbilityAssessment, AssessmentInput, ImprovementPlan } from './types'
import { AbilityAssessmentService } from './service'
import { learningSystemService } from '../learningSystem'
import { addActivityRecord } from '../profileSettings/service'
import { log, error } from '../../utils/logger'

export const AbilityAssessView: React.FC<{ onNavigate?: (view: string, goalTitle?: string) => void }> = ({ onNavigate }) => {
  const [assessment, setAssessment] = useState<AbilityAssessment | null>(null)
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [planGenerating, setPlanGenerating] = useState(false)

  const abilityService = new AbilityAssessmentService()

  // 刷新系统状态
  const refreshSystemStatus = async () => {
    try {
      const status = await learningSystemService.getSystemStatus()
      setSystemStatus(status)
    } catch (err) {
      error('[AbilityAssessView] Failed to refresh system status:', err)
    }
  }

  // 刷新数据
  const refreshData = async () => {
    try {
      const currentAssessment = abilityService.getCurrentAssessment()
      setAssessment(currentAssessment)
      
      if (currentAssessment) {
        // 尝试从缓存恢复提升计划
        const cachedPlan = abilityService.getCachedImprovementPlan(currentAssessment)
        if (cachedPlan) {
          setImprovementPlan(cachedPlan)
          log('[AbilityAssessView] Cached improvement plan restored')
        }
        
        await refreshSystemStatus()
      }
    } catch (err) {
      error('[AbilityAssessView] Failed to refresh data:', err)
    }
  }

  // 检查是否有缓存的提升计划
  const hasCachedPlan = (assessment: AbilityAssessment): boolean => {
    const cachedPlan = abilityService.getCachedImprovementPlan(assessment)
    return !!cachedPlan
  }

  useEffect(() => {
    refreshData()
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
    // 清除缓存的提升计划
    abilityService.clearImprovementPlanCache()
    refreshSystemStatus()
  }

  // 生成智能提升计划
  const handleGenerateIntelligentPlan = async () => {
    if (!assessment) return
    
    setPlanGenerating(true)
    setErrorMsg(null)
    
    try {
      log('[AbilityAssessView] Starting intelligent improvement plan generation')
      const plan = await abilityService.generateIntelligentImprovementPlan(assessment)
      setImprovementPlan(plan)
      
      log('[AbilityAssessView] Intelligent improvement plan generated successfully')
    } catch (err) {
      error('[AbilityAssessView] Failed to generate intelligent improvement plan:', err)
      setErrorMsg('生成智能提升计划失败，请重试')
    } finally {
      setPlanGenerating(false)
    }
  }

  // 重新生成智能提升计划
  const handleRegenerateIntelligentPlan = async () => {
    if (!assessment) return
    
    setPlanGenerating(true)
    setErrorMsg(null)
    
    try {
      log('[AbilityAssessView] Regenerating intelligent improvement plan')
      
      // 清除缓存的提升计划
      abilityService.clearImprovementPlanCache()
      
      // 重新生成计划
      const plan = await abilityService.generateIntelligentImprovementPlan(assessment)
      setImprovementPlan(plan)
      
      log('[AbilityAssessView] Intelligent improvement plan regenerated successfully')
    } catch (err) {
      error('[AbilityAssessView] Failed to regenerate intelligent improvement plan:', err)
      setErrorMsg('重新生成智能提升计划失败，请重试')
    } finally {
      setPlanGenerating(false)
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

  // 查看目标详情
  const handleViewGoalDetails = (goalTitle: string) => {
    // 导航到目标管理页面并选中对应目标
    onNavigate?.('goal-setting', goalTitle)
  }

  // 开始学习
  const handleStartLearning = (goalTitle: string) => {
    // 导航到学习路径管理页面
    window.location.href = '#learning-path'
  }

  // 查看学习进度
  const handleViewProgress = () => {
    // 导航到数据检查器页面
    window.location.href = '#data-inspector'
  }

  // 查看缓存的提升计划
  const handleViewCachedPlan = () => {
    if (assessment) {
      const cachedPlan = abilityService.getCachedImprovementPlan(assessment)
      if (cachedPlan) {
        setImprovementPlan(cachedPlan)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🧠 智能能力评估</h1>
        <p className="text-gray-600 mt-2">
          通过AI分析您的简历或完成技能问卷，获得个性化的能力评估报告和智能提升计划
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
          {/* 如果有提升计划，显示提升计划视图 */}
          {improvementPlan ? (
            <ImprovementPlanView 
              plan={improvementPlan}
              onViewGoalDetails={handleViewGoalDetails}
              onRegenerate={handleRegenerateIntelligentPlan}
            />
          ) : (
            /* 否则显示评估结果 */
            <AssessmentResult 
              assessment={assessment}
              onGenerateImprovement={handleGenerateIntelligentPlan}
              onExport={handleExport}
              hasCachedPlan={hasCachedPlan(assessment)}
              onViewCachedPlan={handleViewCachedPlan}
            />
          )}
          
          {/* 统一系统操作提示 */}
          {systemStatus && !systemStatus.setupComplete && !improvementPlan && (
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
                      onClick={() => onNavigate?.('goal-setting')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      设定学习目标
                    </button>
                    <button
                      onClick={() => onNavigate?.('path-plan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      管理学习路径
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-8 flex flex-wrap gap-4">
            {improvementPlan ? (
              <>
                <button
                  onClick={handleReassess}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  重新评估
                </button>
                <button
                  onClick={() => setImprovementPlan(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  查看评估详情
                </button>
                <button
                  onClick={handleExport}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  导出完整报告
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleReassess}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  重新评估
                </button>
                <button
                  onClick={handleGenerateIntelligentPlan}
                  disabled={planGenerating}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {planGenerating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      生成智能提升计划...
                    </span>
                  ) : (
                    '🚀 生成智能提升计划'
                  )}
                </button>
                <button
                  onClick={handleExport}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  导出报告
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
} 