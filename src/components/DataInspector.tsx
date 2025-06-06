import React, { useState, useEffect } from 'react'
import { getCurrentProfile, getProfileData } from '../utils/profile'
import { 
  getLearningGoals, 
  getLearningPaths, 
  getCourseUnits, 
  getAgentActions,
  deleteLearningGoal,
  deleteLearningPath,
  deleteCourseUnit,
  updateLearningGoal,
  updateLearningPath,
  getGoalStatusStats,
  getCourseUnitsByNode,
  getNodeLearningStats,
  updateCourseProgress,
  markSectionComplete,
  startCourseUnit,
  getCourseStats,
  createCourseUnit,
  // 新增：关联管理功能
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
  getRelationshipStats
} from '../modules/coreData'
import { getCurrentAssessment } from '../modules/abilityAssess/service'
import { addActivityRecord } from '../modules/profileSettings/service'
import { agentToolExecutor } from '../modules/coreData'
import { LearningGoal, LearningPath, CourseUnit } from '../modules/coreData/types'
import { EnhancedRelationshipPanel } from './EnhancedRelationshipPanel'
import { DeleteConfirmDialog, useToast } from './common'

export const DataInspector: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null)
  const [coreData, setCoreData] = useState<any>(null)
  
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'goal' | 'path' | 'unit'
    id: string
    title: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast组件
  const { showSuccess, showError, ToastContainer } = useToast()

  // 学习路径管理相关状态
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [goalStats, setGoalStats] = useState<any>(null)

  // 课程内容管理相关状态
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null)
  const [courseStats, setCourseStats] = useState<any>(null)
  const [showCourseManagement, setShowCourseManagement] = useState(false)

  // 新增：关联管理相关状态
  const [showRelationshipManagement, setShowRelationshipManagement] = useState(false)
  const [relationshipStats, setRelationshipStats] = useState<any>(null)
  const [learningHierarchy, setLearningHierarchy] = useState<any>(null)
  const [selectedPathForLink, setSelectedPathForLink] = useState<string | null>(null)
  const [selectedGoalForLink, setSelectedGoalForLink] = useState<string | null>(null)
  const [selectedNodeForLink, setSelectedNodeForLink] = useState<string | null>(null)
  const [selectedUnitForLink, setSelectedUnitForLink] = useState<string | null>(null)

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

    // 刷新学习路径管理数据
    setGoals(getLearningGoals())
    setPaths(getLearningPaths())
    setGoalStats(getGoalStatusStats())
    
    // 刷新课程内容管理数据
    setCourseUnits(getCourseUnits())
    setCourseStats(getCourseStats())
    
    // 刷新关联管理数据
    setRelationshipStats(getRelationshipStats())
    setLearningHierarchy(getLearningHierarchy())
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
      setIsDeleting(false)
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
      setIsDeleting(false)
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

  // 更新路径状态
  const updatePathStatus = async (pathId: string, status: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status }
      })

      setMessage(`✅ 路径状态已更新为: ${getStatusText(status)}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 更新路径状态失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

  // 暂停路径
  const pausePath = async (pathId: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status: 'paused' }
      })

      setMessage(`✅ 路径已暂停`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 暂停失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 完成路径
  const completePath = async (pathId: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status: 'completed' }
      })

      setMessage(`✅ 路径已完成`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 完成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 恢复暂停的路径
  const resumePath = async (pathId: string) => {
    try {
      await agentToolExecutor.executeTool('update_learning_path', {
        pathId: pathId,
        updates: { status: 'active' }
      })

      setMessage(`✅ 路径已恢复`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 恢复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除路径
  const deletePathAdvanced = async (pathId: string) => {
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

  const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, null, 2)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('已复制到剪贴板')
  }

  const handleDelete = async (type: 'goal' | 'path' | 'unit', id: string, title: string) => {
    setDeleteConfirm({ type, id, title })
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
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

        showSuccess(message, "删除成功")
        refreshData()
      } else {
        showError(message, "删除失败")
      }
    } catch (error) {
      const errorMessage = `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      showError(errorMessage, "删除失败")
      
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
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // 开始学习课程单元
  const startLearning = async (unitId: string) => {
    try {
      const result = startCourseUnit(unitId)
      if (result) {
        setMessage(`✅ 开始学习: ${result.title}`)
        refreshData()
      } else {
        setMessage(`❌ 无法开始学习该课程单元`)
      }
    } catch (error) {
      setMessage(`❌ 开始学习失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 标记章节完成
  const completeSection = async (unitId: string, section: 'reading' | 'practice' | 'summary', timeSpent: number = 0) => {
    try {
      const result = markSectionComplete(unitId, section, timeSpent)
      if (result) {
        setMessage(`✅ ${section === 'reading' ? '阅读' : section === 'practice' ? '练习' : '总结'}部分已完成`)
        refreshData()
      } else {
        setMessage(`❌ 无法完成该章节`)
      }
    } catch (error) {
      setMessage(`❌ 完成章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建新的课程单元
  const createNewCourseUnit = async (nodeId: string) => {
    if (!nodeId) {
      setMessage(`❌ 请先选择一个路径节点`)
      return
    }
    
    try {
      setLoading(true)
      
      // 获取节点现有的课程单元数量，用于排序
      const existingUnits = getCourseUnitsByNode(nodeId)
      const order = existingUnits.length + 1
      
      const newUnit = createCourseUnit({
        nodeId: nodeId,
        title: `新课程单元 ${order}`,
        description: '请编辑此课程单元的详细信息',
        type: 'theory',
        content: {
          reading: {
            markdown: '# 课程内容\n\n请在此处添加课程的阅读内容...',
            estimatedTime: 30,
            keyPoints: ['关键点1', '关键点2'],
            resources: []
          },
          practice: {
            exercises: [],
            totalEstimatedTime: 20
          },
          summary: {
            markdown: '## 课程总结\n\n请在此处添加课程总结...',
            keyTakeaways: ['要点1', '要点2'],
            nextSteps: ['下一步1', '下一步2'],
            relatedTopics: ['相关主题1', '相关主题2']
          }
        },
        metadata: {
          difficulty: 3,
          estimatedTime: 50,
          keywords: ['新课程'],
          learningObjectives: ['学会新技能'],
          prerequisites: [],
          order: order
        }
      })

      setMessage(`✅ 成功创建课程单元: ${newUnit.title}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 创建课程单元失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsDeleting(false)
      setLoading(false)
    }
  }

  // 获取节点的课程单元
  const getNodeUnits = (nodeId: string) => {
    return getCourseUnitsByNode(nodeId)
  }

  // 获取节点学习统计
  const getNodeStats = (nodeId: string) => {
    return getNodeLearningStats(nodeId)
  }

  // ========== 关联管理功能 ==========
  
  // 关联路径到目标
  const linkPath = async (goalId: string, pathId: string) => {
    try {
      const result = linkPathToGoal(goalId, pathId)
      if (result) {
        setMessage(`✅ 成功关联路径到目标`)
        refreshData()
      } else {
        setMessage(`❌ 关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 关联课程内容到节点
  const linkCourseUnit = async (pathId: string, nodeId: string, courseUnitId: string) => {
    try {
      const result = linkCourseUnitToNode(pathId, nodeId, courseUnitId)
      if (result) {
        setMessage(`✅ 成功关联课程内容到节点`)
        refreshData()
      } else {
        setMessage(`❌ 关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 移除关联
  const unlinkPath = async (goalId: string, pathId: string) => {
    try {
      const result = unlinkPathFromGoal(goalId, pathId)
      if (result) {
        setMessage(`✅ 成功移除路径与目标的关联`)
        refreshData()
      } else {
        setMessage(`❌ 移除关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 移除关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const unlinkUnit = async (pathId: string, nodeId: string, courseUnitId: string) => {
    try {
      const result = unlinkCourseUnitFromNode(pathId, nodeId, courseUnitId)
      if (result) {
        setMessage(`✅ 成功移除课程内容与节点的关联`)
        refreshData()
      } else {
        setMessage(`❌ 移除关联失败`)
      }
    } catch (error) {
      setMessage(`❌ 移除关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 同步关联关系
  const syncRelationships = async () => {
    try {
      const result = syncDataRelationships()
      setMessage(`✅ 同步完成: ${result.removedLinks.length > 0 ? 
        `清理了 ${result.removedLinks.length} 个无效关联` : 
        '数据关联关系正常'}`)
      refreshData()
    } catch (error) {
      setMessage(`❌ 同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 使用Agent工具执行关联操作
  const linkPathWithAgent = async () => {
    if (!selectedGoalForLink || !selectedPathForLink) {
      setMessage('❌ 请选择目标和路径')
      return
    }

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
    }
  }

  const linkUnitWithAgent = async () => {
    if (!selectedPathForLink || !selectedNodeForLink || !selectedUnitForLink) {
      setMessage('❌ 请选择路径、节点和课程内容')
      return
    }

    try {
      await agentToolExecutor.executeTool('link_courseunit_to_node', {
        pathId: selectedPathForLink,
        nodeId: selectedNodeForLink,
        courseUnitId: selectedUnitForLink
      })
      setMessage(`✅ 通过Agent成功关联课程内容到节点`)
      setSelectedPathForLink(null)
      setSelectedNodeForLink(null)
      setSelectedUnitForLink(null)
      refreshData()
    } catch (error) {
      setMessage(`❌ Agent关联失败: ${error instanceof Error ? error.message : '未知错误'}`)
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
            🔄 刷新数据
          </button>
        </div>
      </div>

      {/* 消息显示区域 */}
      {message && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '20px',
          backgroundColor: message.includes('✅') ? '#d1ecf1' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#bee5eb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: message.includes('✅') ? '#0c5460' : '#721c24'
        }}>
          {message}
        </div>
      )}

      {/* 操作提示 */}
      <div style={{
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #bbdefb',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>💡 状态管理操作指南</h4>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>🎯 目标操作：</strong>点击目标卡片展开操作按钮，支持暂停、完成、取消、重新激活等操作</p>
          <p><strong>🛤️ 路径操作：</strong>每个路径都有对应的状态管理按钮，可以灵活控制学习进度</p>
          <p><strong>🔄 智能同步：</strong>目标状态变化会自动同步相关路径，保持数据一致性</p>
          <p><strong>📊 实时反馈：</strong>所有操作都会显示结果消息，并更新数据统计</p>
        </div>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        {/* 学习目标管理 */}
        <div>
          <h2>📋 学习目标管理 ({goals.length})</h2>
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
                    {goal.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateGoalStatus(goal.id, 'active')
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 重新开始
                      </button>
                    )}
                    {['active', 'paused'].includes(goal.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateGoalStatus(goal.id, 'cancelled')
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ 取消
                      </button>
                    )}
                    {goal.status === 'cancelled' && (
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
                        🔄 重新激活
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete('goal', goal.id, goal.title)
                      }}
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
                      🗑️ 删除
                    </button>
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

        {/* 学习路径管理 */}
        <div>
          <h2>🛤️ 学习路径管理 ({paths.length})</h2>
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
                    {/* 激活状态的路径操作 */}
                    {path.status === 'active' && (
                      <>
                        <button
                          onClick={() => pausePath(path.id)}
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
                          onClick={() => completePath(path.id)}
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
                        <button
                          onClick={() => updatePathStatus(path.id, 'archived')}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📦 归档
                        </button>
                      </>
                    )}

                    {/* 暂停状态的路径操作 */}
                    {path.status === 'paused' && (
                      <>
                        <button
                          onClick={() => resumePath(path.id)}
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
                        <button
                          onClick={() => completePath(path.id)}
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
                        <button
                          onClick={() => updatePathStatus(path.id, 'archived')}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📦 归档
                        </button>
                      </>
                    )}

                    {/* 冻结状态的路径操作 */}
                    {path.status === 'frozen' && (
                      <>
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
                          🔥 激活
                        </button>
                        <button
                          onClick={() => updatePathStatus(path.id, 'archived')}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📦 归档
                        </button>
                      </>
                    )}

                    {/* 草稿状态的路径操作 */}
                    {path.status === 'draft' && (
                      <>
                        <button
                          onClick={() => updatePathStatus(path.id, 'active')}
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
                          🚀 启动
                        </button>
                        <button
                          onClick={() => updatePathStatus(path.id, 'archived')}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📦 归档
                        </button>
                      </>
                    )}

                    {/* 已归档状态的路径操作 */}
                    {path.status === 'archived' && (
                      <button
                        onClick={() => updatePathStatus(path.id, 'active')}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 重新激活
                      </button>
                    )}

                    {/* 已完成状态的路径操作 */}
                    {path.status === 'completed' && (
                      <button
                        onClick={() => updatePathStatus(path.id, 'active')}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 重新开始
                      </button>
                    )}

                    {/* 通用删除按钮 */}
                    <button
                      onClick={() => handleDelete('path', path.id, path.title)}
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
                      🗑️ 删除
                    </button>
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

      {/* 数据管理区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 课程内容管理 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📚 课程内容管理</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowCourseManagement(!showCourseManagement)
                  setShowRelationshipManagement(false)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: showCourseManagement ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showCourseManagement ? '📚 隐藏课程管理' : '📚 显示课程管理'}
              </button>
            </div>
          </div>

          {showCourseManagement && (
            <div>
              {/* 节点选择器 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', color: '#495057' }}>🎯 选择学习节点</h4>
                <select
                  value={selectedNode || ''}
                  onChange={(e) => setSelectedNode(e.target.value || null)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '300px'
                  }}
                >
                  <option value="">-- 选择节点 --</option>
                  {paths.flatMap(path => 
                    path.nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {path.title} - {node.title}
                      </option>
                    ))
                  )}
                </select>
                {selectedNode && (
                  <button
                    onClick={() => createNewCourseUnit(selectedNode)}
                    style={{
                      marginLeft: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ➕ 创建课程单元
                  </button>
                )}
              </div>

              {/* 选中节点的统计信息 */}
              {selectedNode && (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #bbdefb'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📈 节点学习统计</h4>
                  {(() => {
                    const stats = getNodeStats(selectedNode)
                    return (
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                        <span><strong>课程单元：</strong> {stats.totalUnits} 个</span>
                        <span><strong>完成进度：</strong> {stats.progress}%</span>
                        <span><strong>学习时长：</strong> {Math.round(stats.totalTime)} 分钟</span>
                        <span><strong>预计时长：</strong> {stats.estimatedTime} 分钟</span>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 课程单元列表 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '15px', color: '#495057' }}>
                  📋 课程单元 ({selectedNode ? getNodeUnits(selectedNode).length : courseUnits.length} 个)
                </h4>
                
                {(selectedNode ? getNodeUnits(selectedNode) : courseUnits).map((unit: CourseUnit) => (
                  <div key={unit.id} style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h5 style={{ margin: '0 0 5px 0', color: '#333' }}>{unit.title}</h5>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                          {unit.description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          类型: {unit.type} | 难度: {unit.metadata.difficulty}/5 | 
                          预计: {unit.metadata.estimatedTime}min | 排序: {unit.metadata.order}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => setSelectedUnit(unit)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          📝 详情
                        </button>
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
                    </div>

                    {/* 进度条 */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '5px'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          学习进度: {unit.progress?.overallProgress || 0}%
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: unit.progress?.status === 'completed' ? '#28a745' : 
                                          unit.progress?.status === 'not_started' ? '#6c757d' : '#ffc107',
                          color: 'white'
                        }}>
                          {unit.progress?.status === 'not_started' ? '未开始' :
                           unit.progress?.status === 'reading' ? '阅读中' :
                           unit.progress?.status === 'practicing' ? '练习中' :
                           unit.progress?.status === 'summarizing' ? '总结中' : '已完成'}
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
                          width: `${unit.progress?.overallProgress || 0}%`,
                          height: '100%',
                          backgroundColor: '#28a745',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* 章节状态 */}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: unit.progress?.sections?.reading?.completed ? '#28a745' : '#6c757d'
                      }}>
                        {unit.progress?.sections?.reading?.completed ? '✅' : '📖'} 
                        阅读 ({unit.progress?.sections?.reading?.timeSpent}min)
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: unit.progress?.sections?.practice?.completed ? '#28a745' : '#6c757d'
                      }}>
                        {unit.progress?.sections?.practice?.completed ? '✅' : '💻'} 
                        练习 ({unit.progress?.sections?.practice?.timeSpent}min)
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: unit.progress?.sections?.summary?.completed ? '#28a745' : '#6c757d'
                      }}>
                        {unit.progress?.sections?.summary?.completed ? '✅' : '📝'} 
                        总结 ({unit.progress?.sections?.summary?.timeSpent}min)
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {unit.progress?.status !== 'completed' && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        {unit.progress?.status === 'not_started' && (
                          <button
                            onClick={() => startLearning(unit.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🚀 开始学习
                          </button>
                        )}
                        
                        {unit.progress?.status !== 'not_started' && !unit.progress?.sections?.reading?.completed && (
                          <button
                            onClick={() => completeSection(unit.id, 'reading', 30)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✅ 完成阅读
                          </button>
                        )}
                        
                        {unit.progress?.sections?.reading?.completed && !unit.progress?.sections?.practice?.completed && (
                          <button
                            onClick={() => completeSection(unit.id, 'practice', 45)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ffc107',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✅ 完成练习
                          </button>
                        )}
                        
                        {unit.progress?.sections?.reading?.completed && unit.progress?.sections?.practice?.completed && !unit.progress?.sections?.summary?.completed && (
                          <button
                            onClick={() => completeSection(unit.id, 'summary', 15)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#6f42c1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✅ 完成总结
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 快速操作面板 */}
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚡ 快速操作</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyToClipboard(formatJSON(selectedNode ? getNodeUnits(selectedNode) : courseUnits))}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📋 复制数据
                  </button>
                  <button
                    onClick={refreshData}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔄 刷新数据
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 简化视图 */}
          {!showCourseManagement && coreData?.courseUnits?.length > 0 && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p>总课程单元数: <strong>{coreData.courseUnits.length}</strong></p>
              {courseStats && (
                <p>完成率: <strong>{courseStats.completionRate}%</strong> 
                   | 总学习时长: <strong>{Math.round(courseStats.totalTimeSpent / 60)}小时</strong></p>
              )}
            </div>
          )}
        </div>

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

        {/* 关联管理 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>🔗 关联管理</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowRelationshipManagement(!showRelationshipManagement)
                  setShowCourseManagement(false)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: showRelationshipManagement ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showRelationshipManagement ? '🔗 隐藏关联管理' : '🔗 显示关联管理'}
              </button>
            </div>
          </div>

          {showRelationshipManagement ? (
            <EnhancedRelationshipPanel />
          ) : (
            relationshipStats && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p>关联统计: <strong>{relationshipStats.goalsWithPaths}</strong> 个目标-路径关联, 
                   <strong>{relationshipStats.courseUnitsWithSources}</strong> 个节点-课程关联</p>
                {(relationshipStats.orphanedPaths > 0 || relationshipStats.orphanedCourseUnits > 0) && (
                  <p style={{ color: '#dc3545' }}>
                    ⚠️ 发现 <strong>{relationshipStats.orphanedPaths}</strong> 个孤立路径, 
                    <strong>{relationshipStats.orphanedCourseUnits}</strong> 个孤立课程
                  </p>
                )}
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setShowRelationshipManagement(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🚀 打开智能关联管理
                  </button>
                </div>
              </div>
            )
          )}
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
            <li>🟢 <strong>进行中</strong>：可以生成新的学习路径，可暂停或完成</li>
            <li>🟡 <strong>已暂停</strong>：相关路径也会暂停，可以恢复或取消</li>
            <li>🔵 <strong>已完成</strong>：学习目标完成，可以重新开始</li>
            <li>🔴 <strong>已取消</strong>：目标被取消，相关路径归档，可重新激活</li>
          </ul>
          
          <p><strong>路径状态管理：</strong></p>
          <ul>
            <li>🟢 <strong>进行中</strong>：当前活跃的学习路径，可暂停、完成或归档</li>
            <li>🟡 <strong>已暂停</strong>：暂时停止的路径，可恢复、完成或归档</li>
            <li>🔒 <strong>已冻结</strong>：生成新路径时，旧路径自动冻结，可激活或归档</li>
            <li>📝 <strong>草稿</strong>：待激活的路径，可启动或归档</li>
            <li>🔵 <strong>已完成</strong>：完成的路径，可重新开始</li>
            <li>📦 <strong>已归档</strong>：不再使用的路径，可重新激活</li>
          </ul>
          
          <p><strong>智能流程控制：</strong></p>
          <ul>
            <li>重新设定目标后，原有路径会被冻结，等待重新生成</li>
            <li>可以激活冻结的路径或者归档不需要的路径</li>
            <li>支持多个目标和路径的并行管理</li>
          </ul>
          
          <p><strong>状态转换流程：</strong></p>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div><strong>目标状态流转：</strong></div>
            <div>草稿 → 进行中 ⇄ 已暂停</div>
            <div>进行中 → 已完成 / 已取消</div>
            <div>已完成/已取消 → 重新激活</div>
            <br />
            <div><strong>路径状态流转：</strong></div>
            <div>草稿 → 进行中 ⇄ 已暂停</div>
            <div>进行中 → 已完成 / 已归档</div>
            <div>已冻结 → 激活 / 归档</div>
            <div>已完成/已归档 → 重新激活</div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 使用说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#856404' }}>
          <li><strong>数据管理：</strong> 可以查看和删除学习目标、路径、课程单元</li>
          <li><strong>级联删除：</strong> 删除学习目标会自动删除相关的学习路径和课程内容</li>
          <li><strong>活动记录：</strong> 所有删除操作都会记录到活动历史中</li>
          <li><strong>数据导出：</strong> 点击"复制数据"按钮可以导出JSON格式的数据</li>
          <li><strong>实时更新：</strong> 点击"刷新数据"按钮可以获取最新的数据状态</li>
          <li><strong>路径管理：</strong> 支持目标状态控制、路径生成、激活和归档等操作</li>
        </ul>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          isOpen={deleteConfirm !== null}
          title="确认删除"
          message={`确定要删除这个${deleteConfirm.type === 'goal' ? '学习目标' : deleteConfirm.type === 'path' ? '学习路径' : '课程单元'}吗？`}
          itemName={deleteConfirm.title}
          itemType={deleteConfirm.type}
          cascadeMessage={deleteConfirm.type === 'goal' ? '删除目标会同时删除相关的学习路径和课程内容。' : undefined}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
          dangerLevel={deleteConfirm.type === 'goal' ? 'high' : 'medium'}
        />
      )}

      {/* Toast容器 */}
      <ToastContainer />
    </div>
  )
}

export default DataInspector

