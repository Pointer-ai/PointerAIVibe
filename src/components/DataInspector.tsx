import React, { useState, useEffect } from 'react'
import { getCurrentProfile, getProfileData } from '../utils/profile'
import { getLearningGoals, getLearningPaths, getCourseUnits, getAgentActions } from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'

export const DataInspector: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null)
  const [coreData, setCoreData] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
    setRefreshKey(prev => prev + 1)
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>🔍 数据检查器</h1>
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

      {/* 详细数据查看 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 学习目标数据 */}
        {coreData?.goals?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🎯 学习目标数据</h3>
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
                📋 复制
              </button>
            </div>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看 ({coreData.goals.length} 个目标)
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

        {/* 学习路径数据 */}
        {coreData?.paths?.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🛤️ 学习路径数据</h3>
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
                📋 复制
              </button>
            </div>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看 ({coreData.paths.length} 个路径)
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
                展开查看 ({coreData.agentActions.length} 个动作)
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
                {formatJSON(coreData.agentActions.slice(-10))} 
              </pre>
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                显示最近10条记录，总共{coreData.agentActions.length}条
              </p>
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
              <h3 style={{ margin: 0, color: '#333' }}>🧠 能力评估数据</h3>
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
              <p><strong>评估方式：</strong> {coreData.currentAssessment.metadata.assessmentMethod}</p>
              <p><strong>评估时间：</strong> {coreData.currentAssessment.metadata.assessmentDate}</p>
              <p><strong>置信度：</strong> {Math.round(coreData.currentAssessment.metadata.confidence * 100)}%</p>
            </div>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                展开查看完整数据
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

        {/* 原始Profile数据 */}
        {profileData && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ffcc02'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#ef6c00' }}>🗄️ 完整Profile数据</h3>
              <button
                onClick={() => copyToClipboard(formatJSON(profileData))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ff9800',
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
              <summary style={{ cursor: 'pointer', color: '#f57c00' }}>
                展开查看完整Profile数据 (包含所有模块数据)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px',
                marginTop: '10px'
              }}>
                {formatJSON(profileData)}
              </pre>
            </details>
            <div style={{ 
              marginTop: '10px', 
              padding: '10px',
              backgroundColor: '#ffecb3',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#e65100'
            }}>
              <strong>注意：</strong> 这是存储在localStorage中的完整数据，包含所有模块的数据。
              如果AI工具调用生效，您应该能看到对应的数据变化。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataInspector 