import React, { useState, useEffect } from 'react'
import { getCurrentProfile, getProfileData } from '../utils/profile'
import { 
  getLearningGoals, 
  getLearningPaths, 
  getCourseUnits, 
  getAgentActions,
  deleteLearningGoal,
  deleteLearningPath,
  deleteCourseUnit
} from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'
import { addActivityRecord } from '../modules/profileSettings/service'

export const DataInspector: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null)
  const [coreData, setCoreData] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'goal' | 'path' | 'unit' | null
    id: string
    title: string
  } | null>(null)

  const refreshData = () => {
    const profile = getCurrentProfile()
    if (profile) {
      setProfileData({
        profile: profile,
        coreData: getProfileData('coreData'),
        assessment: getProfileData('abilityAssessment'),
        assessmentHistory: getProfileData('assessmentHistory') || []
      })

      setCoreData({
        goals: getLearningGoals(),
        paths: getLearningPaths(),
        courseUnits: getCourseUnits(),
        agentActions: getAgentActions(),
        currentAssessment: getCurrentAssessment()
      })
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, null, 2)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  const handleDelete = async (type: 'goal' | 'path' | 'unit', id: string, title: string) => {
    setDeleteConfirm({ type, id, title })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      let success = false
      let message = ''

      switch (deleteConfirm.type) {
        case 'goal':
          success = deleteLearningGoal(deleteConfirm.id)
          message = success ? '学习目标删除成功' : '学习目标删除失败'
          break
        case 'path':
          success = deleteLearningPath(deleteConfirm.id)
          message = success ? '学习路径删除成功' : '学习路径删除失败'
          break
        case 'unit':
          success = deleteCourseUnit(deleteConfirm.id)
          message = success ? '课程单元删除成功' : '课程单元删除失败'
          break
      }

      if (success) {
        // 记录删除操作到活动历史
        addActivityRecord({
          type: 'data_operation',
          action: `删除${deleteConfirm.type === 'goal' ? '学习目标' : deleteConfirm.type === 'path' ? '学习路径' : '课程单元'}`,
          details: {
            itemType: deleteConfirm.type,
            itemId: deleteConfirm.id,
            itemTitle: deleteConfirm.title,
            success: true
          }
        })

        alert(message)
        refreshData()
      } else {
        alert(message)
      }
    } catch (error) {
      const errorMessage = `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      alert(errorMessage)
      
      // 记录失败的删除操作
      addActivityRecord({
        type: 'data_operation',
        action: `删除${deleteConfirm.type === 'goal' ? '学习目标' : deleteConfirm.type === 'path' ? '学习路径' : '课程单元'}失败`,
        details: {
          itemType: deleteConfirm.type,
          itemId: deleteConfirm.id,
          itemTitle: deleteConfirm.title,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }
      })
    } finally {
      setDeleteConfirm(null)
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
        <h1>🗂️ 数据管理</h1>
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
          🔄 刷新数据
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* 实时数据统计 */}
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>📊 实时数据统计</h3>
          {coreData && (
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>学习目标：</strong> {coreData.goals.length} 个</p>
              <p><strong>学习路径：</strong> {coreData.paths.length} 个</p>
              <p><strong>课程单元：</strong> {coreData.courseUnits.length} 个</p>
              <p><strong>AI动作记录：</strong> {coreData.agentActions.length} 个</p>
              <p><strong>能力评估：</strong> {coreData.currentAssessment ? '已完成' : '未完成'}</p>
              
              {coreData.goals.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>目标状态分布：</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {['active', 'completed', 'paused', 'cancelled'].map(status => {
                      const count = coreData.goals.filter((g: any) => g.status === status).length
                      return count > 0 ? <li key={status}>{status}: {count}</li> : null
                    })}
                  </ul>
                </div>
              )}

              {coreData.paths.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>路径状态分布：</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {['active', 'completed', 'archived', 'frozen', 'paused', 'draft'].map(status => {
                      const count = coreData.paths.filter((p: any) => p.status === status).length
                      return count > 0 ? <li key={status}>{status}: {count}</li> : null
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile信息 */}
        <div style={{
          padding: '15px',
          backgroundColor: '#f3e5f5',
          borderRadius: '8px',
          border: '1px solid #ce93d8'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>👤 Profile信息</h3>
          {profileData && (
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>用户名：</strong> {profileData.profile.name}</p>
              <p><strong>创建时间：</strong> {new Date(profileData.profile.createdAt).toLocaleString()}</p>
              <p><strong>是否加密：</strong> {profileData.profile.isEncrypted ? '是' : '否'}</p>
              <p><strong>数据版本：</strong> {profileData.coreData?.metadata?.version || '未知'}</p>
              <p><strong>最后更新：</strong> {profileData.coreData?.metadata?.lastUpdated ? 
                new Date(profileData.coreData.metadata.lastUpdated).toLocaleString() : '未知'}</p>
              <p><strong>总学习时间：</strong> {profileData.coreData?.metadata?.totalStudyTime || 0} 分钟</p>
            </div>
          )}
        </div>
      </div>

      {/* 数据管理区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 学习目标管理 */}
        {coreData?.goals?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🎯 学习目标管理</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(coreData.goals))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 复制数据
              </button>
            </div>
            
            {/* 目标列表 */}
            <div style={{ marginTop: '15px' }}>
              {coreData.goals.map((goal: any) => (
                <div key={goal.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <strong>{goal.title}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                      {goal.category} | {goal.status} | 优先级: {goal.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete('goal', goal.id, goal.title)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              ))}
            </div>
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看完整数据 ({coreData.goals.length} 个目标)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {formatJSON(coreData.goals)}
              </pre>
            </details>
          </div>
        )}

        {/* 学习路径管理 */}
        {coreData?.paths?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🛤️ 学习路径管理</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(coreData.paths))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 复制数据
              </button>
            </div>
            
            {/* 路径列表 */}
            <div style={{ marginTop: '15px' }}>
              {coreData.paths.map((path: any) => (
                <div key={path.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <strong>{path.title}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                      {path.nodes.length} 节点 | {path.status} | {path.totalEstimatedHours}h
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete('path', path.id, path.title)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              ))}
            </div>
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看完整数据 ({coreData.paths.length} 条路径)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {formatJSON(coreData.paths)}
              </pre>
            </details>
          </div>
        )}

        {/* 课程单元管理 */}
        {coreData?.courseUnits?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>📚 课程单元管理</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(coreData.courseUnits))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 复制数据
              </button>
            </div>
            
            {/* 单元列表 */}
            <div style={{ marginTop: '15px' }}>
              {coreData.courseUnits.map((unit: any) => (
                <div key={unit.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <strong>{unit.title}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                      {unit.type} | 难度: {unit.metadata?.difficulty || 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete('unit', unit.id, unit.title)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              ))}
            </div>
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看完整数据 ({coreData.courseUnits.length} 个单元)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {formatJSON(coreData.courseUnits)}
              </pre>
            </details>
          </div>
        )}

        {/* AI动作记录 */}
        {coreData?.agentActions?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🤖 AI动作记录</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(coreData.agentActions))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 复制
              </button>
            </div>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看 ({coreData.agentActions.length} 个动作记录)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {formatJSON(coreData.agentActions)}
              </pre>
            </details>
          </div>
        )}

        {/* 能力评估数据 */}
        {coreData?.currentAssessment && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>📊 能力评估数据</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(coreData.currentAssessment))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 复制
              </button>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <p><strong>总体评分：</strong> {coreData.currentAssessment.overallScore}/100</p>
              <p><strong>评估日期：</strong> {coreData.currentAssessment.metadata.assessmentDate}</p>
              <p><strong>置信度：</strong> {Math.round(coreData.currentAssessment.metadata.confidence * 100)}%</p>
            </div>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看完整评估数据
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '10px'
              }}>
                {formatJSON(coreData.currentAssessment)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc3545' }}>⚠️ 确认删除</h3>
            <p style={{ margin: '0 0 20px 0' }}>
              您确定要删除 <strong>"{deleteConfirm.title}"</strong> 吗？
            </p>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
              此操作不可撤销。删除学习目标会同时删除相关的学习路径和课程内容。
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 使用说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#856404' }}>
          <li><strong>数据管理：</strong> 可以查看和删除学习目标、路径、课程单元</li>
          <li><strong>级联删除：</strong> 删除学习目标会自动删除相关的路径和内容</li>
          <li><strong>活动记录：</strong> 所有删除操作都会记录到活动历史中</li>
          <li><strong>数据导出：</strong> 点击"复制数据"按钮可以导出JSON格式的数据</li>
          <li><strong>实时更新：</strong> 点击"刷新数据"按钮可以获取最新的数据状态</li>
        </ul>
      </div>
    </div>
  )
}

export default DataInspector 