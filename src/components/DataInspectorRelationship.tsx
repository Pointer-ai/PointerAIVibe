import React, { useState, useEffect } from 'react'
import { 
  getLearningGoals, 
  getLearningPaths, 
  getCourseUnits, 
  linkPathToGoal,
  linkCourseUnitToNode,
  unlinkPathFromGoal,
  unlinkCourseUnitFromNode,
  getPathsByGoal,
  getGoalByPath,
  getCourseUnitsByNodeId,
  getSourceByUri,
  syncDataRelationships,
  getLearningHierarchy,
  getRelationshipStats,
  agentToolExecutor,
  validateDataRelationships,
  getRelationshipSuggestions
} from '../modules/coreData'
import { LearningGoal, LearningPath, CourseUnit } from '../modules/coreData/types'

export const DataInspectorRelationship: React.FC = () => {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([])
  const [relationshipStats, setRelationshipStats] = useState<any>(null)
  const [learningHierarchy, setLearningHierarchy] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any>(null)
  
  // 选择状态
  const [selectedGoalForLink, setSelectedGoalForLink] = useState<string | null>(null)
  const [selectedPathForLink, setSelectedPathForLink] = useState<string | null>(null)
  const [selectedNodeForLink, setSelectedNodeForLink] = useState<string | null>(null)
  const [selectedUnitForLink, setSelectedUnitForLink] = useState<string | null>(null)
  
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const refreshData = () => {
    setGoals(getLearningGoals())
    setPaths(getLearningPaths())
    setCourseUnits(getCourseUnits())
    setRelationshipStats(getRelationshipStats())
    setLearningHierarchy(getLearningHierarchy())
    setValidationResult(validateDataRelationships())
    setSuggestions(getRelationshipSuggestions())
  }

  useEffect(() => {
    refreshData()
  }, [])

  // 关联路径到目标
  const linkPath = async () => {
    if (!selectedGoalForLink || !selectedPathForLink) {
      setMessage('❌ 请选择目标和路径')
      return
    }

    setLoading(true)
    try {
      const result = linkPathToGoal(selectedGoalForLink, selectedPathForLink)
      if (result) {
        setMessage(`✅ 成功关联路径到目标`)
        setSelectedGoalForLink(null)
        setSelectedPathForLink(null)
        refreshData()
      } else {
        setMessage(`❌ 关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 关联课程内容到节点
  const linkCourseUnit = async () => {
    if (!selectedPathForLink || !selectedNodeForLink || !selectedUnitForLink) {
      setMessage('❌ 请选择路径、节点和课程内容')
      return
    }

    setLoading(true)
    try {
      const result = linkCourseUnitToNode(selectedPathForLink, selectedNodeForLink, selectedUnitForLink)
      if (result) {
        setMessage(`✅ 成功关联课程内容到节点`)
        setSelectedPathForLink(null)
        setSelectedNodeForLink(null)
        setSelectedUnitForLink(null)
        refreshData()
      } else {
        setMessage(`❌ 关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 同步关联关系
  const syncRelationships = async () => {
    setLoading(true)
    try {
      const result = syncDataRelationships()
      setMessage(`✅ 同步完成: ${result.removedLinks.length > 0 ? 
        `清理了 ${result.removedLinks.length} 个无效关联` : 
        '数据关联关系正常'}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 使用Agent工具执行关联操作
  const linkPathWithAgent = async () => {
    if (!selectedGoalForLink || !selectedPathForLink) {
      setMessage('❌ 请选择目标和路径')
      return
    }

    setLoading(true)
    try {
      await agentToolExecutor.executeTool('link_path_to_goal', {
        goalId: selectedGoalForLink,
        pathId: selectedPathForLink
      })
      setMessage(`✅ 通过Agent成功关联路径到目标`)
      setSelectedGoalForLink(null)
      setSelectedPathForLink(null)
      refreshData()
    } catch (error) {
      setMessage(`❌ Agent关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 验证数据关联
  const validateRelationships = async () => {
    setLoading(true)
    try {
      const result = await agentToolExecutor.executeTool('validate_data_relationships', {})
      setValidationResult(result)
      setMessage(`✅ ${result.message}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 获取智能建议
  const getSmartSuggestions = async () => {
    setLoading(true)
    try {
      const result = await agentToolExecutor.executeTool('get_relationship_suggestions', {})
      setSuggestions(result.suggestions)
      setMessage(`✅ ${result.message}`)
    } catch (error) {
      setMessage(`❌ 获取建议失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <h2 style={{ 
        marginBottom: '20px', 
        color: '#333',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
      }}>
        🔗 数据关联关系管理
      </h2>

      {/* 消息显示 */}
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={refreshData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 刷新数据
        </button>
        
        <button
          onClick={validateRelationships}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔍 验证关联
        </button>
        
        <button
          onClick={getSmartSuggestions}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          💡 智能建议
        </button>
        
        <button
          onClick={syncRelationships}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🧹 同步关联
        </button>
      </div>

      {/* 验证结果显示 */}
      {validationResult && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            🔍 数据验证结果
          </h3>
          <div style={{
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: validationResult.isValid ? '#d4edda' : '#f8d7da',
            border: `1px solid ${validationResult.isValid ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              状态: {validationResult.isValid ? '✅ 数据关联完整' : '⚠️ 存在问题'}
            </p>
            
            {validationResult.issues && validationResult.issues.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>发现的问题:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {validationResult.issues.map((issue: any, index: number) => (
                    <li key={index} style={{ 
                      color: issue.severity === 'error' ? '#dc3545' : '#fd7e14',
                      marginBottom: '5px'
                    }}>
                      {issue.severity === 'error' ? '❌' : '⚠️'} {issue.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.suggestions && validationResult.suggestions.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>修复建议:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {validationResult.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} style={{ color: '#007bff', marginBottom: '5px' }}>
                      💡 {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 智能建议显示 */}
      {suggestions && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            💡 智能关联建议
          </h3>
          
          {/* 路径建议 */}
          {suggestions.pathSuggestions && suggestions.pathSuggestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>🛤️ 路径创建建议</h4>
              {suggestions.pathSuggestions.map((suggestion: any, index: number) => (
                <div key={index} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '5px'
                }}>
                  <strong>{suggestion.goalTitle}</strong>
                  <p style={{ margin: '5px 0', color: '#856404' }}>{suggestion.reason}</p>
                  {suggestion.recommendedPaths.map((path: any, pathIndex: number) => (
                    <div key={pathIndex} style={{ 
                      marginLeft: '15px', 
                      padding: '5px',
                      backgroundColor: '#fff',
                      borderRadius: '3px',
                      marginTop: '5px'
                    }}>
                      📚 {path.title} ({path.estimatedHours}小时)
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          
          {/* 课程内容建议 */}
          {suggestions.unitSuggestions && suggestions.unitSuggestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#495057', marginBottom: '10px' }}>📚 课程内容建议</h4>
              {suggestions.unitSuggestions.map((suggestion: any, index: number) => (
                <div key={index} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '5px'
                }}>
                  <strong>{suggestion.pathTitle} &gt; {suggestion.nodeTitle}</strong>
                  <p style={{ margin: '5px 0', color: '#0c5460' }}>{suggestion.reason}</p>
                  {suggestion.recommendedUnits.map((unit: any, unitIndex: number) => (
                    <div key={unitIndex} style={{ 
                      marginLeft: '15px', 
                      padding: '5px',
                      backgroundColor: '#fff',
                      borderRadius: '3px',
                      marginTop: '5px'
                    }}>
                      📖 {unit.title} ({unit.type})
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 关联统计 */}
      {relationshipStats && (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 关联统计</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {relationshipStats.totalGoals}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>总目标数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {relationshipStats.goalsWithPaths}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>有路径的目标</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {relationshipStats.orphanedPaths}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>孤立路径</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {relationshipStats.orphanedCourseUnits}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>孤立课程</div>
            </div>
          </div>
          
          {/* 健康度评分 */}
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              数据关联健康度: {relationshipStats.healthScore || 0}%
            </div>
          </div>
        </div>
      )}

      {/* 关联操作界面 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🔗 建立关联关系</h3>
        
        {/* Goal -> Path 关联 */}
        <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>目标 → 路径关联</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedGoalForLink || ''}
              onChange={(e) => setSelectedGoalForLink(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="">-- 选择目标 --</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            
            <span style={{ color: '#666' }}>→</span>
            
            <select
              value={selectedPathForLink || ''}
              onChange={(e) => setSelectedPathForLink(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="">-- 选择路径 --</option>
              {paths.map(path => (
                <option key={path.id} value={path.id}>
                  {path.title}
                </option>
              ))}
            </select>
            
            <button
              onClick={linkPath}
              disabled={loading || !selectedGoalForLink || !selectedPathForLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || !selectedGoalForLink || !selectedPathForLink) ? 0.6 : 1
              }}
            >
              关联
            </button>
            
            <button
              onClick={linkPathWithAgent}
              disabled={loading || !selectedGoalForLink || !selectedPathForLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || !selectedGoalForLink || !selectedPathForLink) ? 0.6 : 1
              }}
            >
              Agent关联
            </button>
          </div>
        </div>
        
        {/* Node -> CourseUnit 关联 */}
        <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>节点 → 课程内容关联</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedPathForLink || ''}
              onChange={(e) => setSelectedPathForLink(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="">-- 选择路径 --</option>
              {paths.map(path => (
                <option key={path.id} value={path.id}>
                  {path.title}
                </option>
              ))}
            </select>
            
            <select
              value={selectedNodeForLink || ''}
              onChange={(e) => setSelectedNodeForLink(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '150px'
              }}
              disabled={!selectedPathForLink}
            >
              <option value="">-- 选择节点 --</option>
              {selectedPathForLink && paths.find(p => p.id === selectedPathForLink)?.nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            
            <span style={{ color: '#666' }}>→</span>
            
            <select
              value={selectedUnitForLink || ''}
              onChange={(e) => setSelectedUnitForLink(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="">-- 选择课程内容 --</option>
              {courseUnits.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
            
            <button
              onClick={linkCourseUnit}
              disabled={loading || !selectedPathForLink || !selectedNodeForLink || !selectedUnitForLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || !selectedPathForLink || !selectedNodeForLink || !selectedUnitForLink) ? 0.6 : 1
              }}
            >
              关联
            </button>
          </div>
        </div>
      </div>

      {/* 学习层次结构展示 */}
      {learningHierarchy && (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🌳 学习层次结构</h3>
          
          {learningHierarchy.goals.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>暂无学习数据</p>
          ) : (
            learningHierarchy.goals.map((goalItem: any) => (
              <div key={goalItem.goal.id} style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  🎯 {goalItem.goal.title}
                </h4>
                
                {goalItem.paths.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 0 20px' }}>
                    暂无关联路径
                  </p>
                ) : (
                  goalItem.paths.map((pathItem: any) => (
                    <div key={pathItem.path.id} style={{ marginLeft: '20px', marginBottom: '15px' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: '#6c757d' }}>
                        📚 {pathItem.path.title}
                      </h5>
                      
                      {pathItem.nodes.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 0 20px' }}>
                          暂无节点
                        </p>
                      ) : (
                        pathItem.nodes.map((nodeItem: any) => (
                          <div key={nodeItem.node.id} style={{ marginLeft: '20px', marginBottom: '10px' }}>
                            <h6 style={{ margin: '0 0 5px 0', color: '#868e96' }}>
                              🔗 {nodeItem.node.title}
                            </h6>
                            
                            {nodeItem.courseUnits.length === 0 ? (
                              <p style={{ color: '#666', fontSize: '12px', margin: '0 0 0 20px' }}>
                                暂无课程内容
                              </p>
                            ) : (
                              <div style={{ marginLeft: '20px' }}>
                                {nodeItem.courseUnits.map((unit: CourseUnit) => (
                                  <div key={unit.id} style={{ 
                                    fontSize: '12px', 
                                    color: '#adb5bd',
                                    marginBottom: '2px'
                                  }}>
                                    📄 {unit.title}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
              </div>
            ))
          )}
          
          {/* 层次结构摘要 */}
          {learningHierarchy.summary && (
            <div style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>摘要：</strong>
              {learningHierarchy.summary.totalGoals} 个目标，
              {learningHierarchy.summary.totalPaths} 个路径，
              {learningHierarchy.summary.totalNodes} 个节点，
              {learningHierarchy.summary.totalCourseUnits} 个课程内容
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DataInspectorRelationship 