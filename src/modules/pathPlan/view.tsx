import React, { useState, useEffect } from 'react'
import { log } from '../../utils/logger'
import { PathPlanService } from './service'
import { PathPlanState, SkillGapAnalysis, PathGenerationConfig } from './types'
import { getLearningGoals, getLearningPaths, updateLearningGoal } from '../coreData'
import { getCurrentAssessment } from '../abilityAssess/service'
import { LearningGoal, LearningPath } from '../coreData/types'

const pathPlanService = new PathPlanService()

export const PathPlanView = () => {
  log('[pathPlan] View loaded')
  
  const [state, setState] = useState<PathPlanState>({
    currentStep: 'analysis',
    selectedGoalId: null,
    skillGapAnalysis: null,
    generatedPath: null,
    isProcessing: false
  })
  
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [config, setConfig] = useState<PathGenerationConfig>({
    learningStyle: 'balanced',
    timePreference: 'moderate',
    difficultyProgression: 'linear',
    includeProjects: true,
    includeMilestones: true
  })
  const [message, setMessage] = useState<string>('')

  // 刷新数据
  const refreshData = () => {
    setGoals(getLearningGoals())
    setPaths(getLearningPaths())
  }

  useEffect(() => {
    refreshData()
  }, [])

  // 选择目标
  const selectGoal = (goalId: string) => {
    setState(prev => ({
      ...prev,
      selectedGoalId: goalId,
      currentStep: 'analysis',
      skillGapAnalysis: null,
      generatedPath: null
    }))
  }

  // 执行技能差距分析
  const analyzeSkillGap = async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🔍 正在分析技能差距...')

    try {
      const analysis = await pathPlanService.analyzeSkillGap(state.selectedGoalId)
      setState(prev => ({
        ...prev,
        skillGapAnalysis: analysis,
        currentStep: 'generation',
        isProcessing: false
      }))
      setMessage('✅ 技能差距分析完成！')
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 生成学习路径
  const generatePath = async () => {
    if (!state.selectedGoalId) return

    setState(prev => ({ ...prev, isProcessing: true }))
    setMessage('🛤️ 正在生成学习路径...')

    try {
      const path = await pathPlanService.generateLearningPath(state.selectedGoalId, config)
      setState(prev => ({
        ...prev,
        generatedPath: path,
        currentStep: 'review',
        isProcessing: false
      }))
      setMessage('✅ 学习路径生成完成！')
      refreshData() // 刷新数据显示新路径
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      setMessage(`❌ 生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 确认并激活路径
  const confirmPath = async () => {
    if (!state.generatedPath) return

    try {
      // 激活目标（如果需要）
      if (state.selectedGoalId) {
        await updateLearningGoal(state.selectedGoalId, { status: 'active' })
      }
      
      setMessage('✅ 学习路径已确认并激活！')
      setState(prev => ({
        ...prev,
        currentStep: 'confirmation'
      }))
      refreshData()
    } catch (error) {
      setMessage(`❌ 确认失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 重新开始规划
  const resetPlanning = () => {
    setState({
      currentStep: 'analysis',
      selectedGoalId: null,
      skillGapAnalysis: null,
      generatedPath: null,
      isProcessing: false
    })
    setMessage('')
  }

  // 获取当前评估状态
  const assessment = getCurrentAssessment()
  const selectedGoal = goals.find(g => g.id === state.selectedGoalId)

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 智能路径规划
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          基于能力评估的个性化学习路径生成
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.includes('❌') ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${message.includes('❌') ? '#fca5a5' : '#86efac'}`,
          color: message.includes('❌') ? '#dc2626' : '#166534',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* 能力评估检查 */}
      {!assessment && (
        <div style={{
          padding: '20px',
          border: '2px dashed #fbbf24',
          borderRadius: '12px',
          backgroundColor: '#fef3c7',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#d97706', marginBottom: '8px' }}>需要完成能力评估</h3>
          <p style={{ color: '#92400e' }}>
            为了生成个性化的学习路径，请先完成能力评估以了解您的技能水平
          </p>
        </div>
      )}

      {/* 步骤指示器 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        position: 'relative'
      }}>
        {['analysis', 'generation', 'review', 'confirmation'].map((step, index) => {
          const stepNames = ['分析技能', '生成路径', '审查确认', '完成激活']
          const stepIcons = ['🔍', '🛤️', '👀', '✅']
          const isActive = state.currentStep === step
          const isCompleted = ['analysis', 'generation', 'review', 'confirmation'].indexOf(state.currentStep) > index
          
          return (
            <div key={step} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              position: 'relative'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb',
                color: isCompleted || isActive ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }}>
                {stepIcons[index]}
              </div>
              <span style={{
                fontSize: '14px',
                color: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#6b7280',
                fontWeight: isActive ? 'bold' : 'normal'
              }}>
                {stepNames[index]}
              </span>
              {index < 3 && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: '60%',
                  width: '40%',
                  height: '2px',
                  backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 左侧：目标选择和配置 */}
        <div>
          {/* 目标选择 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              📋 选择学习目标
            </h3>
            
            {goals.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
                <p>还没有学习目标</p>
                <p style={{ fontSize: '14px' }}>请先创建学习目标</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {goals.filter(g => g.status !== 'cancelled').map(goal => (
                  <div
                    key={goal.id}
                    onClick={() => selectGoal(goal.id)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${state.selectedGoalId === goal.id ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: state.selectedGoalId === goal.id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {goal.title}
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                          {goal.description}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                          <span>📂 {goal.category}</span>
                          <span>📊 {goal.targetLevel}</span>
                          <span>⏱️ {goal.estimatedTimeWeeks}周</span>
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: goal.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color: goal.status === 'active' ? '#166534' : '#374151'
                      }}>
                        {goal.status === 'active' ? '进行中' : 
                         goal.status === 'paused' ? '已暂停' : 
                         goal.status === 'completed' ? '已完成' : '草稿'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 路径生成配置 */}
          {state.selectedGoalId && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                ⚙️ 路径生成配置
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    学习风格
                  </label>
                  <select
                    value={config.learningStyle}
                    onChange={(e) => setConfig(prev => ({ ...prev, learningStyle: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="theory-first">理论优先</option>
                    <option value="practice-first">实践优先</option>
                    <option value="balanced">理论实践并重</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    学习节奏
                  </label>
                  <select
                    value={config.timePreference}
                    onChange={(e) => setConfig(prev => ({ ...prev, timePreference: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="intensive">密集型 (快速掌握)</option>
                    <option value="moderate">适中型 (稳步推进)</option>
                    <option value="relaxed">轻松型 (循序渐进)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    难度递增方式
                  </label>
                  <select
                    value={config.difficultyProgression}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficultyProgression: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="linear">线性递增</option>
                    <option value="exponential">指数递增</option>
                    <option value="plateau">阶段性提升</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.includeProjects}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeProjects: e.target.checked }))}
                    />
                    包含实战项目
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.includeMilestones}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeMilestones: e.target.checked }))}
                    />
                    设置里程碑
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：分析结果和路径预览 */}
        <div>
          {/* 技能差距分析 */}
          {state.selectedGoalId && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  🔍 技能差距分析
                </h3>
                {state.currentStep === 'analysis' && assessment && (
                  <button
                    onClick={analyzeSkillGap}
                    disabled={state.isProcessing}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: state.isProcessing ? '#e5e7eb' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: state.isProcessing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {state.isProcessing ? '分析中...' : '开始分析'}
                  </button>
                )}
              </div>

              {!assessment ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>⚠️ 需要先完成能力评估</p>
                </div>
              ) : state.skillGapAnalysis ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>当前水平: {state.skillGapAnalysis.currentLevel}/10</span>
                      <span>目标水平: {state.skillGapAnalysis.targetLevel}/10</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(state.skillGapAnalysis.currentLevel / state.skillGapAnalysis.targetLevel) * 100}%`,
                        height: '100%',
                        backgroundColor: '#10b981'
                      }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      主要技能差距:
                    </h4>
                    {state.skillGapAnalysis.gaps.slice(0, 3).map((gap, index) => (
                      <div key={index} style={{
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{gap.skill}</span>
                          <span style={{
                            color: gap.priority === 'high' ? '#dc2626' : 
                                  gap.priority === 'medium' ? '#f59e0b' : '#10b981'
                          }}>
                            {gap.priority === 'high' ? '高优先级' : 
                             gap.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          差距: {gap.gap} 分
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <strong>预计学习时间:</strong> {state.skillGapAnalysis.estimatedTimeWeeks} 周
                    <br />
                    <strong>分析置信度:</strong> {Math.round((state.skillGapAnalysis.confidence || 0.8) * 100)}%
                  </div>

                  {state.currentStep === 'generation' && (
                    <button
                      onClick={generatePath}
                      disabled={state.isProcessing}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: state.isProcessing ? '#e5e7eb' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        marginTop: '16px',
                        cursor: state.isProcessing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {state.isProcessing ? '生成中...' : '🛤️ 生成学习路径'}
                    </button>
                  )}
                </div>
              ) : state.currentStep !== 'analysis' ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>✅ 技能差距分析已完成</p>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  <p>点击"开始分析"来分析技能差距</p>
                </div>
              )}
            </div>
          )}

          {/* 生成的路径预览 */}
          {state.generatedPath && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  🛤️ 生成的学习路径
                </h3>
                {state.currentStep === 'review' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={generatePath}
                      disabled={state.isProcessing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      重新生成
                    </button>
                    <button
                      onClick={confirmPath}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      确认激活
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {state.generatedPath.title}
                </h4>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                  {state.generatedPath.description}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#888' }}>
                  <span>📚 {state.generatedPath.nodes.length} 个学习节点</span>
                  <span>⏱️ 预计 {state.generatedPath.totalEstimatedHours} 小时</span>
                  <span>🎯 平均难度 {Math.round(state.generatedPath.nodes.reduce((sum, node) => sum + node.difficulty, 0) / state.generatedPath.nodes.length)}/5</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  学习节点预览:
                </h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {state.generatedPath.nodes.slice(0, 5).map((node, index) => (
                    <div key={node.id} style={{
                      padding: '8px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: '500' }}>
                        {index + 1}. {node.title}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                        {node.description} • {node.estimatedHours}h • 难度{node.difficulty}/10
                      </div>
                    </div>
                  ))}
                  {state.generatedPath.nodes.length > 5 && (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', padding: '8px' }}>
                      ... 还有 {state.generatedPath.nodes.length - 5} 个节点
                    </div>
                  )}
                </div>
              </div>

              {state.generatedPath.milestones && state.generatedPath.milestones.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    🏆 学习里程碑:
                  </h5>
                  {state.generatedPath.milestones.map((milestone, index) => (
                    <div key={milestone.id} style={{
                      padding: '6px 10px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      🏆 {milestone.title} ({milestone.nodeIds.length} 个节点)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 确认完成状态 */}
          {state.currentStep === 'confirmation' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#10b981' }}>
                学习路径规划完成！
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                个性化学习路径已成功生成并激活，您可以开始学习了！
              </p>
              <button
                onClick={resetPlanning}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🎯 规划新路径
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          💡 使用指南
        </h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
          <p><strong>智能路径规划流程：</strong></p>
          <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li>选择一个学习目标</li>
            <li>配置您的学习偏好</li>
            <li>分析当前技能与目标的差距</li>
            <li>生成个性化的学习路径</li>
            <li>审查并确认路径内容</li>
          </ol>
          <p><strong>💡 提示：</strong> 基于您的能力评估结果，系统会生成更精准的个性化路径。置信度越高，路径越适合您的实际水平。</p>
        </div>
      </div>
    </div>
  )
}

export default PathPlanView 