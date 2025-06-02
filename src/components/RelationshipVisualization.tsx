import React, { useState, useEffect, useMemo } from 'react'
import { 
  getLearningGoals, 
  getLearningPaths, 
  getCourseUnits, 
  getRelationshipStats,
  getLearningHierarchy,
  linkPathToGoal,
  linkCourseUnitToNode,
  unlinkPathFromGoal,
  unlinkCourseUnitFromNode
} from '../modules/coreData'
import { LearningGoal, LearningPath, CourseUnit } from '../modules/coreData/types'

interface RelationshipVisualizationProps {
  onMessage?: (message: string) => void
}

export const RelationshipVisualization: React.FC<RelationshipVisualizationProps> = ({ onMessage }) => {
  const [goals, setGoals] = useState<any[]>([])
  const [paths, setPaths] = useState<any[]>([])
  const [courseUnits, setCourseUnits] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<{type: string, id: string} | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // 数据验证和清理函数
  const validateAndCleanData = (data: any[], type: string) => {
    if (!Array.isArray(data)) {
      console.warn(`${type} data is not an array:`, data)
      return []
    }
    
    return data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn(`Invalid ${type} item:`, item)
        return false
      }
      if (!item.id) {
        console.warn(`${type} item missing id:`, item)
        return false
      }
      return true
    }).map(item => ({
      ...item,
      title: item.title || `未命名${type}`,
      status: item.status || 'unknown'
    }))
  }

  const refreshData = () => {
    try {
      const rawGoals = getLearningGoals()
      const rawPaths = getLearningPaths()
      const rawCourseUnits = getCourseUnits()
      
      setGoals(validateAndCleanData(rawGoals, '目标'))
      setPaths(validateAndCleanData(rawPaths, '路径'))
      setCourseUnits(validateAndCleanData(rawCourseUnits, '课程'))
      
      setStats(getRelationshipStats())
      setHierarchy(getLearningHierarchy())
    } catch (error) {
      console.error('Error refreshing relationship data:', error)
      onMessage?.(`❌ 数据刷新失败: ${error instanceof Error ? error.message : '未知错误'}`)
      // 设置空数据以防止后续错误
      setGoals([])
      setPaths([])
      setCourseUnits([])
      setStats(null)
    }
  }

  useEffect(() => {
    refreshData()
    // 每30秒自动刷新数据
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  // 计算关联图的节点和连线
  const graphData = useMemo(() => {
    const nodes: any[] = []
    const links: any[] = []

    // 添加目标节点
    goals.forEach(goal => {
      nodes.push({
        id: goal.id,
        label: goal.title || '未命名目标',
        type: 'goal',
        status: goal.status,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50
      })
    })

    // 添加路径节点
    paths.forEach((path, index) => {
      nodes.push({
        id: path.id,
        label: path.title || '未命名路径',
        type: 'path',
        status: path.status,
        x: Math.random() * 300 + 400,
        y: Math.random() * 200 + 50
      })

      // 添加目标到路径的连线
      if (path.sourceGoalId || path.goalId) {
        const goalId = path.sourceGoalId || path.goalId
        links.push({
          source: goalId,
          target: path.id,
          type: 'goal-path'
        })
      }

      // 查找关联的目标
      goals.forEach(goal => {
        if (goal.pathIds?.includes(path.id)) {
          links.push({
            source: goal.id,
            target: path.id,
            type: 'goal-path'
          })
        }
      })
    })

    // 添加课程内容节点
    courseUnits.forEach((unit, index) => {
      nodes.push({
        id: unit.id,
        label: unit.title || '未命名课程',
        type: 'unit',
        x: Math.random() * 300 + 750,
        y: Math.random() * 200 + 50
      })

      // 添加路径节点到课程内容的连线
      if (unit.sourcePathId && unit.sourceNodeId) {
        // 找到对应的路径
        const path = paths.find(p => p.id === unit.sourcePathId)
        if (path) {
          links.push({
            source: path.id,
            target: unit.id,
            type: 'path-unit',
            nodeId: unit.sourceNodeId
          })
        }
      }

      // 查找关联的节点
      paths.forEach(path => {
        if (path.nodes && Array.isArray(path.nodes)) {
          path.nodes.forEach(node => {
            if (node.courseUnitIds?.includes(unit.id)) {
              links.push({
                source: path.id,
                target: unit.id,
                type: 'path-unit',
                nodeId: node.id
              })
            }
          })
        }
      })
    })

    return { nodes, links }
  }, [goals, paths, courseUnits])

  // 获取节点颜色
  const getNodeColor = (node: any) => {
    if (hoveredItem === node.id) return '#ffd700'
    if (selectedItem?.id === node.id) return '#ff6b6b'
    
    switch (node.type) {
      case 'goal':
        return node.status === 'completed' ? '#28a745' : 
               node.status === 'active' ? '#007bff' : '#6c757d'
      case 'path':
        return node.status === 'completed' ? '#28a745' : 
               node.status === 'active' ? '#17a2b8' : '#6c757d'
      case 'unit':
        return '#ffc107'
      default:
        return '#6c757d'
    }
  }

  // 获取连线颜色
  const getLinkColor = (link: any) => {
    return link.type === 'goal-path' ? '#007bff' : '#28a745'
  }

  // 处理节点点击
  const handleNodeClick = (node: any) => {
    setSelectedItem({ type: node.type, id: node.id })
  }

  // 快速关联操作
  const handleQuickLink = async (sourceId: string, targetId: string, linkType: 'goal-path' | 'path-unit') => {
    try {
      if (linkType === 'goal-path') {
        await linkPathToGoal(sourceId, targetId)
        onMessage?.('✅ 成功关联目标和路径')
      } else if (linkType === 'path-unit') {
        // 需要选择具体的节点
        const path = paths.find(p => p.id === sourceId)
        if (path && path.nodes && Array.isArray(path.nodes) && path.nodes.length > 0) {
          // 默认关联到第一个节点
          await linkCourseUnitToNode(sourceId, path.nodes[0].id, targetId)
          onMessage?.('✅ 成功关联路径节点和课程内容')
        } else {
          onMessage?.('❌ 路径没有可用的节点')
        }
      }
      refreshData()
    } catch (error) {
      onMessage?.(`❌ 关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>🔗 关联关系可视化</h3>
        <button
          onClick={refreshData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 刷新
        </button>
      </div>

      {/* 统计面板 */}
      {stats && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #007bff'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {stats.totalGoals}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              学习目标
            </div>
            <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
              已关联: {stats.goalsWithPaths}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #17a2b8'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              {stats.totalPaths}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              学习路径
            </div>
            <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
              已关联: {stats.pathsWithGoals}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ffc107'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
              {stats.totalCourseUnits}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              课程内容
            </div>
            <div style={{ fontSize: '10px', color: '#28a745', marginTop: '2px' }}>
              已关联: {stats.courseUnitsWithSources}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: `2px solid ${stats.orphanedPaths + stats.orphanedCourseUnits > 0 ? '#dc3545' : '#28a745'}`
          }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: stats.orphanedPaths + stats.orphanedCourseUnits > 0 ? '#dc3545' : '#28a745'
            }}>
              {Math.round(((stats.goalsWithPaths + stats.pathsWithGoals + stats.courseUnitsWithSources) / 
                (stats.totalGoals + stats.totalPaths + stats.totalCourseUnits)) * 100) || 0}%
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              关联健康度
            </div>
            <div style={{ fontSize: '10px', color: '#dc3545', marginTop: '2px' }}>
              孤立项: {stats.orphanedPaths + stats.orphanedCourseUnits}
            </div>
          </div>
        </div>
      )}

      {/* 关联图表 */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #ddd',
        minHeight: '400px',
        position: 'relative'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 关联关系图</h4>
        
        {/* SVG图表 */}
        <svg width="100%" height="350" style={{ border: '1px solid #eee', borderRadius: '4px' }}>
          {/* 绘制连线 */}
          {graphData.links.map((link, index) => {
            const sourceNode = graphData.nodes.find(n => n.id === link.source)
            const targetNode = graphData.nodes.find(n => n.id === link.target)
            if (!sourceNode || !targetNode) return null

            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={getLinkColor(link)}
                strokeWidth="2"
                strokeDasharray={link.type === 'path-unit' ? '5,5' : '0'}
              />
            )
          })}

          {/* 绘制节点 */}
          {graphData.nodes.map((node, index) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={getNodeColor(node)}
                stroke="#fff"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredItem(node.id)}
                onMouseLeave={() => setHoveredItem(null)}
              />
              <text
                x={node.x}
                y={node.y + 30}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
                style={{ 
                  maxWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {(node.label && typeof node.label === 'string' && node.label.length > 10) 
                  ? node.label.substring(0, 10) + '...' 
                  : (node.label || '未知')
                }
              </text>
            </g>
          ))}
        </svg>

        {/* 图例 */}
        <div style={{ 
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#007bff',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            学习目标
          </div>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#17a2b8',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            学习路径
          </div>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#ffc107',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            课程内容
          </div>
        </div>
      </div>

      {/* 选中项详情 */}
      {selectedItem && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #ddd',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
            📋 选中项详情
          </h4>
          {(() => {
            if (selectedItem.type === 'goal') {
              const goal = goals.find(g => g.id === selectedItem.id)
              if (!goal) return null
              const relatedPaths = paths.filter(p => p.sourceGoalId === goal.id || goal.pathIds?.includes(p.id))
              
              return (
                <div>
                  <p><strong>目标:</strong> {goal.title}</p>
                  <p><strong>状态:</strong> {goal.status}</p>
                  <p><strong>相关路径:</strong> {relatedPaths.length} 个</p>
                  {relatedPaths.length > 0 && (
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {relatedPaths.map(path => (
                        <li key={path.id} style={{ fontSize: '14px', color: '#666' }}>
                          {path.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            } else if (selectedItem.type === 'path') {
              const path = paths.find(p => p.id === selectedItem.id)
              if (!path) return null
              const relatedGoal = goals.find(g => g.id === path.sourceGoalId || g.pathIds?.includes(path.id))
              const relatedUnits = courseUnits.filter(u => 
                u.sourcePathId === path.id || 
                (path.nodes && Array.isArray(path.nodes) && path.nodes.some(n => n.courseUnitIds?.includes(u.id)))
              )
              
              return (
                <div>
                  <p><strong>路径:</strong> {path.title}</p>
                  <p><strong>状态:</strong> {path.status}</p>
                  <p><strong>节点数:</strong> {(path.nodes && Array.isArray(path.nodes)) ? path.nodes.length : 0} 个</p>
                  <p><strong>关联目标:</strong> {relatedGoal?.title || '无'}</p>
                  <p><strong>关联课程:</strong> {relatedUnits.length} 个</p>
                </div>
              )
            } else if (selectedItem.type === 'unit') {
              const unit = courseUnits.find(u => u.id === selectedItem.id)
              if (!unit) return null
              const relatedPath = paths.find(p => p.id === unit.sourcePathId)
              
              return (
                <div>
                  <p><strong>课程:</strong> {unit.title}</p>
                  <p><strong>类型:</strong> {unit.type}</p>
                  <p><strong>关联路径:</strong> {relatedPath?.title || '无'}</p>
                  <p><strong>关联节点:</strong> {unit.sourceNodeId || '无'}</p>
                </div>
              )
            }
            return null
          })()}
        </div>
      )}

      {/* 快速统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #ddd'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>📈 关联趋势</h5>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p>目标关联率: {Math.round((stats?.goalsWithPaths / Math.max(1, stats?.totalGoals)) * 100) || 0}%</p>
            <p>路径关联率: {Math.round((stats?.pathsWithGoals / Math.max(1, stats?.totalPaths)) * 100) || 0}%</p>
            <p>课程关联率: {Math.round((stats?.courseUnitsWithSources / Math.max(1, stats?.totalCourseUnits)) * 100) || 0}%</p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #ddd'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>⚠️ 需要关注</h5>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {stats?.orphanedPaths > 0 && (
              <p style={{ color: '#dc3545' }}>孤立路径: {stats.orphanedPaths} 个</p>
            )}
            {stats?.orphanedCourseUnits > 0 && (
              <p style={{ color: '#dc3545' }}>孤立课程: {stats.orphanedCourseUnits} 个</p>
            )}
            {(stats?.totalNodes - stats?.nodesWithCourseUnits) > 0 && (
              <p style={{ color: '#ffc107' }}>空节点: {stats.totalNodes - stats.nodesWithCourseUnits} 个</p>
            )}
            {!stats?.orphanedPaths && !stats?.orphanedCourseUnits && (stats?.totalNodes === stats?.nodesWithCourseUnits) && (
              <p style={{ color: '#28a745' }}>✅ 关联关系良好</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 