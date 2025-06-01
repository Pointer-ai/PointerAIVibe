import React, { useState, useEffect } from 'react'
import { getLearningGoals, getLearningPaths, updateLearningGoal, updateLearningPath, getGoalStatusStats } from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'
import { agentToolExecutor } from '../modules/coreData'
import { LearningGoal, LearningPath } from '../modules/coreData/types'
import { log } from '../utils/logger'

export const LearningPathView: React.FC = () => {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [goalStats, setGoalStats] = useState<any>(null)

  // 刷新数据
  const refreshData = () => {
    setGoals(getLearningGoals())
    setPaths(getLearningPaths())
    setGoalStats(getGoalStatusStats())
  }

  useEffect(() => {
    refreshData()
  }, [])

  // 创建新目标
  const createNewGoal = async () => {
    setLoading(true)
    try {
      const assessment = getCurrentAssessment()
      
      const goal = await agentToolExecutor.executeTool('create_learning_goal', {
        title: '新的学习目标',
        description: '请编辑此目标的详细信息',
        category: 'frontend',
        priority: 3,
        targetLevel: assessment ? 
          (assessment.overallScore >= 70 ? 'advanced' : 
           assessment.overallScore >= 40 ? 'intermediate' : 'beginner') : 'beginner',
        estimatedTimeWeeks: 8,
        requiredSkills: ['编程基础'],
        outcomes: ['掌握新技能']
      })

      setMessage(`✅ 成功创建目标: ${goal.title}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 创建目标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 为目标生成学习路径
  const generatePathForGoal = async (goalId: string) => {
    setLoading(true)
    try {
      // 首先冻结现有路径
      const existingPaths = paths.filter(p => p.goalId === goalId && p.status === 'active')
      for (const path of existingPaths) {
        await agentToolExecutor.executeTool('update_learning_path', {
          pathId: path.id,
          updates: { status: 'frozen' }
        })
      }

      // 生成新的学习路径节点
      const assessment = getCurrentAssessment()
      const userLevel = assessment ? 
        (assessment.overallScore >= 70 ? 'intermediate' : 
         assessment.overallScore >= 40 ? 'beginner' : 'novice') : 'beginner'

      const nodes = await agentToolExecutor.executeTool('generate_path_nodes', {
        goalId: goalId,
        userLevel: userLevel,
        preferences: { 
          learningStyle: 'project-based', 
          pace: 'normal' 
        }
      })

      // 创建新的学习路径
      const path = await agentToolExecutor.executeTool('create_learning_path', {
        goalId: goalId,
        title: `${goals.find(g => g.id === goalId)?.title} - 学习路径`,
        description: '个性化学习路径',
        nodes: nodes,
        dependencies: [],
        milestones: []
      })

      setMessage(`✅ 成功为目标生成学习路径: ${path.nodes.length} 个节点`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 生成路径失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 更新目标状态
  const updateGoalStatus = async (goalId: string, status: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_goal', {
        goalId: goalId,
        updates: { status }
      })

      // 如果目标被暂停或取消，相关路径也要更新
      if (status === 'paused' || status === 'cancelled') {
        const relatedPaths = paths.filter(p => p.goalId === goalId && p.status === 'active')
        for (const path of relatedPaths) {
          await agentToolExecutor.executeTool('update_learning_path', {
            pathId: path.id,
            updates: { status: status === 'paused' ? 'paused' : 'archived' }
          })
        }
      }

      setMessage(`✅ 目标状态已更新为: ${status}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 激活冻结的路径
  const activateFrozenPath = async (pathId: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status: 'active' }
      })

      setMessage(`✅ 路径已激活`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 激活失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除路径
  const deletePath = async (pathId: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status: 'archived' }
      })

      setMessage(`✅ 路径已归档`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'completed': return '#2196F3'
      case 'paused': return '#FF9800'
      case 'cancelled': return '#f44336'
      case 'frozen': return '#9E9E9E'
      case 'archived': return '#795548'
      default: return '#6c757d'
    }
  }

  // 获取状态中文
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'paused': return '已暂停'
      case 'cancelled': return '已取消'
      case 'frozen': return '已冻结'
      case 'archived': return '已归档'
      case 'draft': return '草稿'
      default: return '未知'
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>🎯 学习路径管理</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={createNewGoal}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            ➕ 新建目标
          </button>
          <button
            onClick={refreshData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          color: message.startsWith('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      {loading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ⏳ 处理中...
        </div>
      )}

      {/* 目标状态统计卡片 */}
      {goalStats && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 目标状态统计
            {!goalStats.canActivateMore && (
              <span style={{
                padding: '4px 8px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'normal'
              }}>
                已达上限
              </span>
            )}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '15px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {goalStats.active}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>激活中</div>
              <div style={{ fontSize: '10px', color: '#999' }}>最多3个</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {goalStats.completed}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>已完成</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                {goalStats.paused}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>已暂停</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                {goalStats.cancelled}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>已取消</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
                {goalStats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>总计</div>
            </div>
          </div>
          
          {/* 激活限制提醒 */}
          {!goalStats.canActivateMore && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '5px',
              color: '#856404'
            }}>
              <strong>⚠️ 提醒：</strong> 您已激活3个目标（上限）。要激活新目标，请先暂停或完成现有目标。
            </div>
          )}
          
          {goalStats.canActivateMore && goalStats.active > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '5px',
              color: '#0c5460'
            }}>
              <strong>💡 提示：</strong> 您还可以激活 {3 - goalStats.active} 个目标。
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* 学习目标列表 */}
        <div>
          <h2>📋 学习目标 ({goals.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '15px',
                  border: `2px solid ${selectedGoal === goal.id ? '#007bff' : '#ddd'}`,
                  borderRadius: '8px',
                  backgroundColor: selectedGoal === goal.id ? '#f8f9fa' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{goal.title}</h3>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'white',
                      backgroundColor: getStatusColor(goal.status)
                    }}
                  >
                    {getStatusText(goal.status)}
                  </span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  {goal.description}
                </p>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  📂 {goal.category} | ⏱️ {goal.estimatedTimeWeeks}周 | 📈 {goal.targetLevel}
                </div>
                
                {selectedGoal === goal.id && (
                  <div style={{ 
                    marginTop: '10px', 
                    paddingTop: '10px', 
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '5px',
                    flexWrap: 'wrap'
                  }}>
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generatePathForGoal(goal.id)
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🛤️ 生成路径
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateGoalStatus(goal.id, 'paused')
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ⏸️ 暂停
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateGoalStatus(goal.id, 'completed')
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ 完成
                        </button>
                      </>
                    )}
                    {goal.status === 'paused' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateGoalStatus(goal.id, 'active')
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ▶️ 恢复
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {goals.length === 0 && (
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
                <p style={{ fontSize: '14px' }}>点击"新建目标"开始您的学习之旅</p>
              </div>
            )}
          </div>
        </div>

        {/* 学习路径列表 */}
        <div>
          <h2>🛤️ 学习路径 ({paths.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {paths.map((path) => {
              const relatedGoal = goals.find(g => g.id === path.goalId)
              const completedNodes = path.nodes.filter(n => n.status === 'completed')
              const progress = path.nodes.length > 0 ? 
                (completedNodes.length / path.nodes.length) * 100 : 0

              return (
                <div
                  key={path.id}
                  style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{path.title}</h3>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'white',
                        backgroundColor: getStatusColor(path.status)
                      }}
                    >
                      {getStatusText(path.status)}
                    </span>
                  </div>
                  
                  {relatedGoal && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      marginBottom: '10px'
                    }}>
                      📋 目标: {relatedGoal.title}
                    </div>
                  )}

                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {path.description}
                  </p>

                  {/* 进度条 */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        进度: {completedNodes.length}/{path.nodes.length} 节点
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: progress > 80 ? '#28a745' : 
                                      progress > 50 ? '#ffc107' : '#007bff',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    marginTop: '8px'
                  }}>
                    ⏱️ 预计 {path.totalEstimatedHours}小时 | 🆔 {path.id}
                  </div>

                  {/* 路径节点预览 */}
                  {path.nodes.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <details>
                        <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#007bff' }}>
                          📚 查看节点 ({path.nodes.length}个)
                        </summary>
                        <div style={{ marginTop: '8px', paddingLeft: '10px' }}>
                          {path.nodes.slice(0, 5).map((node, index) => (
                            <div key={node.id} style={{
                              fontSize: '11px',
                              padding: '2px 0',
                              color: node.status === 'completed' ? '#28a745' : 
                                    node.status === 'in_progress' ? '#ffc107' : '#6c757d'
                            }}>
                              {index + 1}. {node.title} ({node.estimatedHours}h)
                              {node.status === 'completed' && ' ✅'}
                              {node.status === 'in_progress' && ' 🔄'}
                            </div>
                          ))}
                          {path.nodes.length > 5 && (
                            <div style={{ fontSize: '11px', color: '#888' }}>
                              ... 还有 {path.nodes.length - 5} 个节点
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* 路径操作按钮 */}
                  <div style={{ 
                    marginTop: '10px', 
                    display: 'flex', 
                    gap: '5px',
                    flexWrap: 'wrap'
                  }}>
                    {path.status === 'frozen' && (
                      <button
                        onClick={() => activateFrozenPath(path.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔥 激活路径
                      </button>
                    )}
                    {(path.status === 'active' || path.status === 'frozen') && (
                      <button
                        onClick={() => deletePath(path.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ 归档
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {paths.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#888',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛤️</div>
                <p>还没有学习路径</p>
                <p style={{ fontSize: '14px' }}>先创建学习目标，然后生成学习路径</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 流程说明 */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #bbdefb'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🔄 流程控制说明</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>目标状态管理：</strong></p>
          <ul>
            <li>🟢 <strong>进行中</strong>：可以生成新的学习路径</li>
            <li>🟡 <strong>已暂停</strong>：相关路径也会暂停，可以恢复</li>
            <li>🔵 <strong>已完成</strong>：学习目标完成</li>
          </ul>
          
          <p><strong>路径状态管理：</strong></p>
          <ul>
            <li>🟢 <strong>进行中</strong>：当前活跃的学习路径</li>
            <li>🔒 <strong>已冻结</strong>：生成新路径时，旧路径自动冻结</li>
            <li>📦 <strong>已归档</strong>：不再使用的路径</li>
          </ul>
          
          <p><strong>智能流程控制：</strong></p>
          <ul>
            <li>重新设定目标后，原有路径会被冻结，等待重新生成</li>
            <li>可以激活冻结的路径或者归档不需要的路径</li>
            <li>支持多个目标和路径的并行管理</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LearningPathView 