import React, { useState, useEffect } from 'react'
import { RelationshipVisualization } from './RelationshipVisualization'
import { DataInspectorRelationship } from './DataInspectorRelationship'
import { 
  getLearningGoals, 
  getLearningPaths, 
  getCourseUnits, 
  getRelationshipStats,
  agentToolExecutor,
  syncDataRelationships
} from '../modules/coreData'

export const EnhancedRelationshipPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'visualization' | 'management' | 'analytics'>('overview')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refreshData = () => {
    setStats(getRelationshipStats())
    setLastUpdate(new Date())
  }

  useEffect(() => {
    refreshData()
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // 每30秒刷新
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // 自动诊断关联问题
  const diagnoseProblem = async () => {
    setLoading(true)
    try {
      const currentStats = getRelationshipStats()
      const issues: string[] = []
      const suggestions: string[] = []

      if (currentStats.orphanedPaths > 0) {
        issues.push(`发现 ${currentStats.orphanedPaths} 个孤立路径`)
        suggestions.push('建议将这些路径关联到对应的学习目标')
      }

      if (currentStats.orphanedCourseUnits > 0) {
        issues.push(`发现 ${currentStats.orphanedCourseUnits} 个孤立课程`)
        suggestions.push('建议将这些课程关联到相应的学习路径节点')
      }

      if (currentStats.totalNodes - currentStats.nodesWithCourseUnits > 0) {
        issues.push(`发现 ${currentStats.totalNodes - currentStats.nodesWithCourseUnits} 个空节点`)
        suggestions.push('建议为这些节点添加适当的课程内容')
      }

      if (issues.length === 0) {
        setMessage('✅ 关联关系检查完成，未发现问题')
      } else {
        setMessage(`🔍 诊断完成:\n问题: ${issues.join(', ')}\n建议: ${suggestions.join(', ')}`)
      }
    } catch (error) {
      setMessage(`❌ 诊断失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 一键修复关联问题
  const autoFixRelationships = async () => {
    setLoading(true)
    try {
      // 同步数据关联
      const syncResult = syncDataRelationships()
      
      // 使用AI工具获取智能建议
      const suggestions = await agentToolExecutor.executeTool('get_relationship_suggestions', {})
      
      let fixCount = 0
      
      // 自动执行部分建议
      if (suggestions.autoFix && suggestions.autoFix.length > 0) {
        for (const fix of suggestions.autoFix) {
          try {
            if (fix.type === 'link_path_to_goal') {
              await agentToolExecutor.executeTool('link_path_to_goal', {
                goalId: fix.goalId,
                pathId: fix.pathId
              })
              fixCount++
            } else if (fix.type === 'link_courseunit_to_node') {
              await agentToolExecutor.executeTool('link_courseunit_to_node', {
                pathId: fix.pathId,
                nodeId: fix.nodeId,
                courseUnitId: fix.courseUnitId
              })
              fixCount++
            }
          } catch (error) {
            console.warn('自动修复失败:', error)
          }
        }
      }

      setMessage(`✅ 自动修复完成: 清理了 ${syncResult.removedLinks.length} 个无效关联，应用了 ${fixCount} 个智能修复`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 自动修复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 生成关联报告
  const generateReport = () => {
    if (!stats) return null

    const healthScore = Math.round(
      ((stats.goalsWithPaths / Math.max(1, stats.totalGoals)) * 0.3 +
       (stats.pathsWithGoals / Math.max(1, stats.totalPaths)) * 0.3 +
       (stats.nodesWithCourseUnits / Math.max(1, stats.totalNodes)) * 0.2 +
       (stats.courseUnitsWithSources / Math.max(1, stats.totalCourseUnits)) * 0.2) * 100
    )

    return {
      healthScore,
      totalItems: stats.totalGoals + stats.totalPaths + stats.totalCourseUnits,
      linkedItems: stats.goalsWithPaths + stats.pathsWithGoals + stats.courseUnitsWithSources,
      orphanedItems: stats.orphanedPaths + stats.orphanedCourseUnits,
      coverage: Math.round(((stats.goalsWithPaths + stats.pathsWithGoals + stats.courseUnitsWithSources) / 
        (stats.totalGoals + stats.totalPaths + stats.totalCourseUnits)) * 100)
    }
  }

  const report = generateReport()

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* 头部控制栏 */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>🔗 智能关联管理中心</h2>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            最后更新: {lastUpdate.toLocaleTimeString()} 
            {autoRefresh && <span style={{ color: '#28a745', marginLeft: '10px' }}>● 自动刷新</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自动刷新
          </label>
          
          <button
            onClick={diagnoseProblem}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔍 智能诊断
          </button>
          
          <button
            onClick={autoFixRelationships}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            🔧 一键修复
          </button>
        </div>
      </div>

      {/* 快速状态面板 */}
      {report && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '15px 20px',
          borderBottom: '1px solid #ddd',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: report.healthScore >= 80 ? '#28a745' : 
                     report.healthScore >= 60 ? '#ffc107' : '#dc3545' 
            }}>
              {report.healthScore}%
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>健康度</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {report.linkedItems}/{report.totalItems}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>已关联项目</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              {report.coverage}%
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>覆盖率</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: report.orphanedItems > 0 ? '#dc3545' : '#28a745' 
            }}>
              {report.orphanedItems}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>孤立项目</div>
          </div>
        </div>
      )}

      {/* 消息显示 */}
      {message && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: message.includes('✅') ? '#d4edda' : 
                           message.includes('🔍') ? '#d1ecf1' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : 
                 message.includes('🔍') ? '#0c5460' : '#721c24',
          borderBottom: '1px solid #ddd',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
      )}

      {/* 标签页导航 */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #ddd',
        display: 'flex'
      }}>
        {[
          { key: 'overview', label: '📊 概览', icon: '📊' },
          { key: 'visualization', label: '🎯 可视化', icon: '🎯' },
          { key: 'management', label: '⚙️ 管理', icon: '⚙️' },
          { key: 'analytics', label: '📈 分析', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '15px 20px',
              backgroundColor: activeTab === tab.key ? '#007bff' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 关联概览</h3>
            
            {stats && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* 目标统计 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>🎯 学习目标</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>总数:</span>
                      <strong>{stats.totalGoals}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>已关联:</span>
                      <strong style={{ color: '#28a745' }}>{stats.goalsWithPaths}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>关联率:</span>
                      <strong style={{ 
                        color: (stats.goalsWithPaths / Math.max(1, stats.totalGoals)) >= 0.8 ? '#28a745' : '#ffc107'
                      }}>
                        {Math.round((stats.goalsWithPaths / Math.max(1, stats.totalGoals)) * 100)}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 路径统计 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#17a2b8' }}>🛤️ 学习路径</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>总数:</span>
                      <strong>{stats.totalPaths}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>已关联:</span>
                      <strong style={{ color: '#28a745' }}>{stats.pathsWithGoals}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>孤立路径:</span>
                      <strong style={{ color: '#dc3545' }}>{stats.orphanedPaths}</strong>
                    </div>
                  </div>
                </div>

                {/* 课程统计 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#ffc107' }}>📚 课程内容</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>总数:</span>
                      <strong>{stats.totalCourseUnits}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>已关联:</span>
                      <strong style={{ color: '#28a745' }}>{stats.courseUnitsWithSources}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>孤立课程:</span>
                      <strong style={{ color: '#dc3545' }}>{stats.orphanedCourseUnits}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 快速操作 */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>⚡ 快速操作</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('visualization')}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🎯 查看可视化
                </button>
                <button
                  onClick={() => setActiveTab('management')}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ 管理关联
                </button>
                <button
                  onClick={refreshData}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 刷新数据
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visualization' && (
          <RelationshipVisualization onMessage={setMessage} />
        )}

        {activeTab === 'management' && (
          <DataInspectorRelationship />
        )}

        {activeTab === 'analytics' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📈 深度分析</h3>
            
            {/* 关联趋势分析 */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 关联趋势</h4>
              {stats && (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>目标关联进度</div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(stats.goalsWithPaths / Math.max(1, stats.totalGoals)) * 100}%`,
                        height: '100%',
                        backgroundColor: '#007bff'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {Math.round((stats.goalsWithPaths / Math.max(1, stats.totalGoals)) * 100)}%
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>路径关联进度</div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(stats.pathsWithGoals / Math.max(1, stats.totalPaths)) * 100}%`,
                        height: '100%',
                        backgroundColor: '#17a2b8'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {Math.round((stats.pathsWithGoals / Math.max(1, stats.totalPaths)) * 100)}%
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>课程关联进度</div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(stats.courseUnitsWithSources / Math.max(1, stats.totalCourseUnits)) * 100}%`,
                        height: '100%',
                        backgroundColor: '#ffc107'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {Math.round((stats.courseUnitsWithSources / Math.max(1, stats.totalCourseUnits)) * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 问题分析 */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>⚠️ 问题分析</h4>
              {stats && (
                <div>
                  {stats.orphanedPaths === 0 && stats.orphanedCourseUnits === 0 && (stats.totalNodes === stats.nodesWithCourseUnits) ? (
                    <div style={{ 
                      padding: '15px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      ✅ 恭喜！您的学习数据关联关系非常健康，没有发现需要修复的问题。
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {stats.orphanedPaths > 0 && (
                        <div style={{ 
                          padding: '10px',
                          backgroundColor: '#f8d7da',
                          color: '#721c24',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          🔴 发现 {stats.orphanedPaths} 个孤立学习路径，建议关联到相应的学习目标
                        </div>
                      )}
                      {stats.orphanedCourseUnits > 0 && (
                        <div style={{ 
                          padding: '10px',
                          backgroundColor: '#f8d7da',
                          color: '#721c24',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          🟠 发现 {stats.orphanedCourseUnits} 个孤立课程内容，建议关联到学习路径的节点
                        </div>
                      )}
                      {(stats.totalNodes - stats.nodesWithCourseUnits) > 0 && (
                        <div style={{ 
                          padding: '10px',
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          🟡 发现 {stats.totalNodes - stats.nodesWithCourseUnits} 个空节点，建议添加课程内容
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 