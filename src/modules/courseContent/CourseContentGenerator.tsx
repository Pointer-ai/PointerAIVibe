import React, { useState, useEffect } from 'react'
import { getLearningGoals, getLearningPaths, createCourseUnit, addCoreEvent, getPathsByGoal } from '../coreData'
import { LearningGoal, LearningPath, PathNode, CourseUnit } from '../coreData/types'
import { CourseContentService } from './service'
import { getCurrentAssessment } from '../abilityAssess/service'
import { getAIResponse } from '../../components/AIAssistant/service'
import { log } from '../../utils/logger'

const courseContentService = new CourseContentService()

interface ContentGenerationRequest {
  goalId: string
  pathId: string
  nodeId: string
  contentCount: number
  language: 'javascript' | 'python'
  estimatedReadingTime: number
}

interface GeneratedContent {
  id: string
  title: string
  markdown: string
  type: 'theory' | 'example' | 'exercise' | 'project'
  estimatedTime: number
  keyPoints: string[]
  language?: string
}

interface AsyncGenerationTask {
  id: string
  request: ContentGenerationRequest
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  currentIndex: number
  totalCount: number
  generatedContents: GeneratedContent[]
  error?: string
  startTime: number
  estimatedCompletion?: number
}

interface AsyncGenerationState {
  tasks: Map<string, AsyncGenerationTask>
  activeTaskId: string | null
}

export const CourseContentGenerator: React.FC = () => {
  // 状态管理
  const [currentStep, setCurrentStep] = useState<'goal' | 'path' | 'node' | 'generate' | 'preview'>('goal')
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null)
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null)
  const [contentCount, setContentCount] = useState(4)
  const [preferredLanguage, setPreferredLanguage] = useState<'javascript' | 'python'>('javascript')
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(12)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])

  // 异步生成管理器状态
  const [asyncState, setAsyncState] = useState<AsyncGenerationState>({
    tasks: new Map(),
    activeTaskId: null
  })
  const [currentTask, setCurrentTask] = useState<AsyncGenerationTask | null>(null)

  // 缓存键名
  const CACHE_KEY = 'courseContentGenerator_asyncTasks'

  // 从缓存恢复异步任务状态
  const loadCachedTasks = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const tasksData = JSON.parse(cached)
        const tasksMap = new Map()
        
        Object.entries(tasksData).forEach(([taskId, taskData]: [string, any]) => {
          tasksMap.set(taskId, taskData)
        })
        
        setAsyncState(prev => ({
          ...prev,
          tasks: tasksMap
        }))
        
        log('[CourseContentGenerator] Loaded cached tasks:', tasksMap.size)
      }
    } catch (error) {
      log('[CourseContentGenerator] Failed to load cached tasks:', error)
    }
  }

  // 保存异步任务状态到缓存
  const saveCachedTasks = (tasks: Map<string, AsyncGenerationTask>) => {
    try {
      const tasksData: Record<string, AsyncGenerationTask> = {}
      tasks.forEach((task, taskId) => {
        tasksData[taskId] = task
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify(tasksData))
    } catch (error) {
      log('[CourseContentGenerator] Failed to save cached tasks:', error)
    }
  }

  // 更新任务状态并缓存
  const updateTaskState = (taskId: string, updates: Partial<AsyncGenerationTask>) => {
    setAsyncState(prev => {
      const newTasks = new Map(prev.tasks)
      const existingTask = newTasks.get(taskId)
      
      if (existingTask) {
        const updatedTask = { ...existingTask, ...updates }
        newTasks.set(taskId, updatedTask)
        
        // 保存到缓存
        saveCachedTasks(newTasks)
        
        // 如果是当前任务，更新当前任务状态
        if (taskId === prev.activeTaskId) {
          setCurrentTask(updatedTask)
        }
        
        return {
          ...prev,
          tasks: newTasks
        }
      }
      
      return prev
    })
  }

  // 加载数据
  useEffect(() => {
    loadGoals()
    loadCachedTasks()
    
    // 检查是否有进行中的任务需要恢复
    const checkForActiveTask = () => {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const tasksData = JSON.parse(cached)
        const activeTasks = Object.entries(tasksData).filter(([_, task]: [string, any]) => 
          task.status === 'generating' || task.status === 'pending'
        )
        
        if (activeTasks.length > 0) {
          const [taskId, taskData] = activeTasks[0] as [string, AsyncGenerationTask]
          setAsyncState(prev => ({
            ...prev,
            activeTaskId: taskId
          }))
          setCurrentTask(taskData)
          
          // 如果任务状态是generating，可能需要重新启动
          if (taskData.status === 'generating') {
            log('[CourseContentGenerator] Found interrupted task, may need manual restart')
          }
        }
      }
    }
    
    checkForActiveTask()
    
    // 自动清理7天前的旧任务
    setTimeout(() => {
      cleanupOldTasks()
    }, 1000)
  }, [])

  const loadGoals = () => {
    const allGoals = getLearningGoals()
    // 显示活跃的和已完成的目标，过滤掉取消的
    setGoals(allGoals.filter(goal => goal.status !== 'cancelled'))
  }

  const loadPathsForGoal = (goalId: string) => {
    // 使用正确的关联函数获取目标的路径，并过滤已归档的路径
    const goalPaths = getPathsByGoal(goalId).filter(path => 
      path.status !== 'archived'
    )
    setPaths(goalPaths)
  }

  // 步骤1: 选择目标
  const selectGoal = (goal: LearningGoal) => {
    setSelectedGoal(goal)
    loadPathsForGoal(goal.id)
    setCurrentStep('path')
  }

  // 步骤2: 选择路径
  const selectPath = (path: LearningPath) => {
    setSelectedPath(path)
    setCurrentStep('node')
  }

  // 步骤3: 选择节点
  const selectNode = (node: PathNode) => {
    setSelectedNode(node)
    setCurrentStep('generate')
  }

  // 步骤4: 异步生成内容配置
  const generateContentAsync = async () => {
    if (!selectedGoal || !selectedPath || !selectedNode) return

    const taskId = `task_${Date.now()}_${selectedNode.id}`
    const request: ContentGenerationRequest = {
      goalId: selectedGoal.id,
      pathId: selectedPath.id,
      nodeId: selectedNode.id,
      contentCount,
      language: preferredLanguage,
      estimatedReadingTime
    }

    // 创建新任务
    const newTask: AsyncGenerationTask = {
      id: taskId,
      request,
      status: 'pending',
      progress: 0,
      currentIndex: 0,
      totalCount: contentCount,
      generatedContents: [],
      startTime: Date.now(),
      estimatedCompletion: Date.now() + (contentCount * 30000) // 预估每个内容30秒
    }

    // 添加到任务队列并更新状态
    setAsyncState(prev => {
      const newTasks = new Map(prev.tasks)
      newTasks.set(taskId, newTask)
      saveCachedTasks(newTasks)
      
      return {
        tasks: newTasks,
        activeTaskId: taskId
      }
    })

    setCurrentTask(newTask)

    // 记录生成事件
    addCoreEvent({
      type: 'course_content_generation_started',
      details: {
        taskId,
        goalId: selectedGoal.id,
        pathId: selectedPath.id,
        nodeId: selectedNode.id,
        contentCount,
        language: preferredLanguage
      }
    })

    // 立即开始异步生成（使用newTask而不是从状态获取）
    startAsyncGenerationWithTask(newTask)

    // 重置界面到目标选择页面，让用户可以继续操作
    resetToGoalSelection()
  }

  // 重置到目标选择页面但保留异步任务
  const resetToGoalSelection = () => {
    setCurrentStep('goal')
    setSelectedGoal(null)
    setSelectedPath(null)
    setSelectedNode(null)
    setGeneratedContents([])
    setPaths([])
    // 注意：不清除currentTask和asyncState，保持异步任务运行
  }

  // 使用传入的task开始异步生成过程
  const startAsyncGenerationWithTask = async (task: AsyncGenerationTask) => {
    updateTaskState(task.id, { status: 'generating' })

    try {
      // 获取用户能力评估信息
      const userAssessment = getCurrentAssessment()
      
      // 构建完整的上下文信息
      const contextInfo = {
        goal: {
          title: selectedGoal?.title,
          description: selectedGoal?.description,
          category: selectedGoal?.category,
          estimatedTimeWeeks: selectedGoal?.estimatedTimeWeeks
        },
        path: {
          title: selectedPath?.title,
          description: selectedPath?.description,
          totalNodes: selectedPath?.nodes.length || 0,
          currentNodeIndex: selectedPath?.nodes ? selectedPath.nodes.findIndex(n => n.id === selectedNode?.id) + 1 : 0,
          totalEstimatedHours: selectedPath?.totalEstimatedHours
        },
        node: {
          title: selectedNode?.title,
          description: selectedNode?.description,
          skills: selectedNode?.skills,
          difficulty: selectedNode?.difficulty,
          estimatedHours: selectedNode?.estimatedHours,
          prerequisites: selectedNode?.prerequisites
        },
        user: userAssessment ? {
          overallScore: userAssessment.overallScore,
          level: getScoreLevel(userAssessment.overallScore),
          strengths: userAssessment.report.strengths,
          improvements: userAssessment.report.improvements,
          dimensions: userAssessment.dimensions,
          assessmentDate: userAssessment.metadata.assessmentDate
        } : null
      }

      const contents: GeneratedContent[] = []
      const contentTypes: Array<'theory' | 'example' | 'exercise' | 'project'> = ['theory', 'example', 'exercise', 'project']
      
      for (let i = 0; i < task.request.contentCount; i++) {
        const type = contentTypes[i % contentTypes.length]
        
        // 更新进度
        updateTaskState(task.id, {
          currentIndex: i + 1,
          progress: Math.round(((i + 1) / task.request.contentCount) * 100)
        })

        const contentTitle = `${task.request.nodeId.split('_').pop() || '未知节点'} - ${type === 'theory' ? '理论基础' : type === 'example' ? '示例讲解' : type === 'exercise' ? '练习实战' : '实践项目'} (${i + 1}/${task.request.contentCount})`
        
        try {
          log(`[CourseContentGenerator] Async generating content ${i + 1}/${task.request.contentCount}: ${type}`)
          
          const aiPrompt = buildAdvancedContentPrompt(type, task.request, contextInfo, i + 1)
          const aiResponse = await getAIResponse(aiPrompt)
          const markdownContent = extractMarkdownFromAI(aiResponse)
          
          const newContent: GeneratedContent = {
            id: `content_${task.id}_${i}`,
            title: contentTitle,
            markdown: markdownContent,
            type,
            estimatedTime: Math.floor(task.request.estimatedReadingTime / task.request.contentCount),
            keyPoints: extractKeyPointsFromMarkdown(markdownContent),
            language: task.request.language
          }

          contents.push(newContent)
          
          // 实时更新生成的内容
          updateTaskState(task.id, {
            generatedContents: [...contents]
          })
          
          // 给AI一点时间休息，避免请求过快
          if (i < task.request.contentCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
          
        } catch (error) {
          log(`[CourseContentGenerator] Failed to generate content ${i + 1}:`, error)
          // 如果AI生成失败，使用备用内容
          const fallbackContent: GeneratedContent = {
            id: `content_${task.id}_${i}`,
            title: contentTitle,
            markdown: generateFallbackContent(type, task.request.language, selectedNode!, contextInfo),
            type,
            estimatedTime: Math.floor(task.request.estimatedReadingTime / task.request.contentCount),
            keyPoints: generateKeyPoints(type, selectedNode!),
            language: task.request.language
          }

          contents.push(fallbackContent)
          
          updateTaskState(task.id, {
            generatedContents: [...contents]
          })
        }
      }

      // 任务完成
      updateTaskState(task.id, {
        status: 'completed',
        progress: 100,
        generatedContents: contents
      })

      // 自动保存到学习库
      await autoSaveGeneratedContent(task.id, contents)

      log('[CourseContentGenerator] Async generation completed:', contents.length)

    } catch (error) {
      log('[CourseContentGenerator] Async generation failed:', error)
      updateTaskState(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : '生成失败'
      })
    }
  }

  // 自动保存生成的内容
  const autoSaveGeneratedContent = async (taskId: string, contents: GeneratedContent[]) => {
    if (!selectedNode || contents.length === 0) return

    try {
      for (const content of contents) {
        const courseUnit = {
          nodeId: selectedNode.id,
          title: content.title,
          description: `AI生成的${content.type}类型学习内容`,
          type: content.type,
          content: {
            reading: {
              markdown: content.markdown,
              estimatedTime: content.estimatedTime,
              keyPoints: content.keyPoints
            }
          },
          metadata: {
            difficulty: selectedNode.difficulty,
            estimatedTime: content.estimatedTime,
            keywords: selectedNode.skills,
            learningObjectives: content.keyPoints,
            prerequisites: selectedNode.prerequisites,
            order: contents.indexOf(content),
            generationTaskId: taskId
          }
        }

        createCourseUnit(courseUnit)
      }

      // 记录保存事件
      addCoreEvent({
        type: 'course_contents_auto_saved',
        details: {
          taskId,
          nodeId: selectedNode.id,
          contentCount: contents.length
        }
      })

      log('[CourseContentGenerator] Auto-saved generated contents:', contents.length)
    } catch (error) {
      log('[CourseContentGenerator] Failed to auto-save content:', error)
    }
  }

  // 构建高质量的AI提示词
  const buildAdvancedContentPrompt = (
    type: string, 
    request: ContentGenerationRequest, 
    context: any, 
    contentIndex: number
  ): string => {
    const typeMap = {
      theory: '理论基础',
      example: '示例讲解', 
      exercise: '练习实战',
      project: '实践项目'
    }

    return `# 课程内容生成任务

## 任务概述
请为编程学习路径生成一个高质量的${typeMap[type]}内容模块。

## 学习上下文
### 目标信息
- 学习目标: ${context.goal.title}
- 目标描述: ${context.goal.description}
- 目标分类: ${context.goal.category}
- 目标难度: ${context.goal.difficulty}/5
- 预计学习周期: ${context.goal.estimatedTimeWeeks}周

### 路径信息  
- 学习路径: ${context.path.title}
- 路径描述: ${context.path.description}
- 当前进度: 第${context.path.currentNodeIndex}/${context.path.totalNodes}个节点
- 路径总时长: ${context.path.totalEstimatedHours}小时

### 节点信息
- 节点标题: ${context.node.title}
- 节点描述: ${context.node.description}
- 核心技能: ${context.node.skills?.join(', ') || '无'}
- 节点难度: ${context.node.difficulty}/5
- 预计时长: ${context.node.estimatedHours}小时
- 前置要求: ${context.node.prerequisites?.join(', ') || '无'}

### 用户能力画像
${context.user ? `
- 整体评分: ${context.user.overallScore}/100 (${context.user.level}水平)
- 优势领域: ${context.user.strengths?.join(', ') || '无'}  
- 待改进: ${context.user.improvements?.join(', ') || '无'}
- 评估时间: ${new Date(context.user.assessmentDate).toLocaleDateString()}
` : '- 暂无用户能力评估数据'}

## 内容要求
1. **字数要求**: 1000-1500字的深度内容
2. **格式要求**: 使用Markdown格式，结构清晰
3. **代码语言**: 主要使用${request.language}，代码示例要完整可运行
4. **内容类型**: ${typeMap[type]}内容
5. **目标读者**: ${context.user?.level || '中级'}程序员
6. **阅读时长**: 约${Math.floor(request.estimatedReadingTime / request.contentCount)}分钟

## 内容结构要求
### 对于理论基础内容:
- 核心概念解释 (300-400字)
- 原理深度分析 (400-500字)  
- 实际应用场景 (200-300字)
- 与其他概念的关联 (100-200字)
- 学习要点总结

### 对于示例讲解内容:
- 问题背景介绍 (200-300字)
- 完整代码示例 (至少30行有效代码)
- 逐行代码解析 (400-500字)
- 运行结果展示 (100-200字)
- 变体和扩展思路 (200-300字)

### 对于练习实战内容:
- 练习目标说明 (200字)
- 3-5个递进式练习题目
- 每题详细解答思路 (200-300字/题)
- 常见错误分析 (200字)
- 进阶挑战建议 (100字)

### 对于实践项目内容:
- 项目需求分析 (300-400字)
- 技术选型说明 (200字)
- 实现步骤指导 (400-500字)
- 完整代码框架 (至少50行)
- 部署和测试指南 (200-300字)

## 质量标准
- 内容必须准确、实用、有深度
- 代码示例要完整、规范、可运行
- 语言表达要通俗易懂但不失专业性
- 要考虑用户的能力水平进行适度调整
- 内容要与节点技能目标紧密相关

请基于以上要求生成高质量的${typeMap[type]}内容，确保内容丰富实用，代码准确完整。`
  }

  // 从AI响应中提取Markdown内容
  const extractMarkdownFromAI = (aiResponse: string): string => {
    // 尝试提取markdown代码块
    const markdownMatch = aiResponse.match(/```markdown\n([\s\S]*?)\n```/) ||
                         aiResponse.match(/```md\n([\s\S]*?)\n```/) ||
                         aiResponse.match(/```\n([\s\S]*?)\n```/)
    
    if (markdownMatch) {
      return markdownMatch[1].trim()
    }
    
    // 如果没有代码块，直接返回内容
    return aiResponse.trim()
  }

  // 从Markdown内容中提取关键要点
  const extractKeyPointsFromMarkdown = (markdown: string): string[] => {
    const keyPoints: string[] = []
    
    // 提取所有二级标题作为关键要点
    const headingMatches = markdown.match(/^## (.+)$/gm)
    if (headingMatches) {
      keyPoints.push(...headingMatches.map(h => h.replace('## ', '')))
    }
    
    // 提取总结部分的要点
    const summaryMatch = markdown.match(/## 总结[\s\S]*?(?=##|$)/)
    if (summaryMatch) {
      const bulletPoints = summaryMatch[0].match(/^- (.+)$/gm)
      if (bulletPoints) {
        keyPoints.push(...bulletPoints.map(b => b.replace('- ', '')))
      }
    }
    
    // 如果没有提取到要点，生成默认要点
    if (keyPoints.length === 0) {
      keyPoints.push(
        `掌握${selectedNode?.title}的核心概念`,
        `理解${selectedNode?.skills?.[0] || '相关技能'}的应用`,
        '能够独立完成相关练习'
      )
    }
    
    return keyPoints.slice(0, 5) // 最多返回5个要点
  }

  // 备用内容生成（当AI失败时使用）
  const generateFallbackContent = (
    type: string, 
    language: string, 
    node: PathNode, 
    context: any
  ): string => {
    const typeMap = {
      theory: '理论基础',
      example: '示例讲解',
      exercise: '练习实战', 
      project: '实践项目'
    }

    return `# ${node.title} - ${typeMap[type]}

## 学习目标
通过本节内容，你将能够：
${node.skills.map(skill => `- 掌握${skill}的核心概念和应用`).join('\n')}

## 内容概述
${node.description}

本节将深入探讨${node.title}的相关知识点，通过理论讲解、代码示例和实践练习，帮助你全面理解和掌握这一重要技能。

## 核心概念

### 基础定义
${node.title}是现代软件开发中的重要概念，它在实际项目中有着广泛的应用。理解这个概念对于提升编程能力具有重要意义。

### 应用场景
在实际开发中，${node.title}常用于：
- 解决复杂的业务逻辑问题
- 提高代码的可维护性和可扩展性
- 优化系统性能和用户体验

## 代码示例

以下是一个使用${language}实现的基础示例：

\`\`\`${language}
${language === 'javascript' ? `
// ${node.title}的JavaScript实现示例
function ${toCamelCase(node.title)}Example() {
  console.log("开始学习${node.title}");
  
  // 核心逻辑实现
  const result = processData();
  
  console.log("处理结果:", result);
  return result;
}

function processData() {
  // 这里实现具体的业务逻辑
  const data = { message: "Hello, ${node.title}!" };
  return data;
}

// 调用示例
const output = ${toCamelCase(node.title)}Example();
console.log(output);
` : `
# ${node.title}的Python实现示例
def ${toSnakeCase(node.title)}_example():
    print(f"开始学习${node.title}")
    
    # 核心逻辑实现
    result = process_data()
    
    print(f"处理结果: {result}")
    return result

def process_data():
    # 这里实现具体的业务逻辑
    data = {"message": f"Hello, ${node.title}!"}
    return data

# 调用示例
if __name__ == "__main__":
    output = ${toSnakeCase(node.title)}_example()
    print(output)
`}
\`\`\`

## 实践练习

### 练习1：基础应用
请根据上述示例，修改代码实现以下功能：
- 添加错误处理机制
- 支持不同类型的输入参数
- 优化代码结构和可读性

### 练习2：进阶挑战
尝试结合${node.skills.slice(1, 3).join('和')}，设计一个更复杂的应用场景。

## 学习要点总结

1. **核心概念理解**：深入掌握${node.title}的基本原理和应用方式
2. **代码实现能力**：能够使用${language}正确实现相关功能
3. **实际应用能力**：理解如何在真实项目中应用这些知识
4. **问题解决能力**：能够独立分析和解决相关技术问题

## 延伸阅读

- 官方文档和最佳实践指南
- 相关开源项目和案例分析  
- 进阶技术栈和工具使用
- 行业应用案例和发展趋势

---

*注意：本内容为自动生成的学习材料，建议结合实际项目练习以加深理解。*`
  }

  // 辅助函数：转换为驼峰命名
  const toCamelCase = (str: string): string => {
    return str.replace(/[^a-zA-Z0-9]/g, ' ')
              .split(' ')
              .map((word, index) => 
                index === 0 ? word.toLowerCase() : 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join('')
  }

  // 辅助函数：转换为下划线命名
  const toSnakeCase = (str: string): string => {
    return str.replace(/[^a-zA-Z0-9]/g, '_')
              .toLowerCase()
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '')
  }

  // 辅助函数：获取分数等级
  const getScoreLevel = (score: number): string => {
    if (score >= 80) return '高级'
    if (score >= 60) return '中级'
    if (score >= 40) return '初级'
    return '入门'
  }

  // 生成关键要点
  const generateKeyPoints = (type: string, node: PathNode): string[] => {
    const basePoints = [
      `掌握${node.title}的核心概念`,
      `理解${node.skills[0] || '相关技能'}的应用`,
      `能够独立完成相关练习`
    ]
    
    if (type === 'theory') {
      basePoints.push('理解理论基础和原理')
    } else if (type === 'example') {
      basePoints.push('通过示例理解实际应用')
    } else if (type === 'exercise') {
      basePoints.push('通过练习巩固知识点')
    } else {
      basePoints.push('通过实践项目提升技能')
    }
    
    return basePoints
  }

  // 重置生成器
  const resetGenerator = () => {
    setCurrentStep('goal')
    setSelectedGoal(null)
    setSelectedPath(null)
    setSelectedNode(null)
    setGeneratedContents([])
    setPaths([])
    setCurrentTask(null)
    setAsyncState(prev => ({
      ...prev,
      activeTaskId: null
    }))
  }

  // 返回上一步
  const goBack = () => {
    switch (currentStep) {
      case 'path':
        setCurrentStep('goal')
        setSelectedGoal(null)
        setPaths([])
        break
      case 'node':
        setCurrentStep('path')
        setSelectedPath(null)
        break
      case 'generate':
        setCurrentStep('node')
        setSelectedNode(null)
        break
      case 'preview':
        setCurrentStep('generate')
        setGeneratedContents([])
        break
    }
  }

  // 清理旧任务缓存
  const cleanupOldTasks = () => {
    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000 // 7天
    
    setAsyncState(prev => {
      const newTasks = new Map()
      
      prev.tasks.forEach((task, taskId) => {
        // 保留7天内的任务，或者状态为generating的任务
        if (now - task.startTime < SEVEN_DAYS || task.status === 'generating') {
          newTasks.set(taskId, task)
        }
      })
      
      // 保存清理后的任务
      saveCachedTasks(newTasks)
      
      log('[CourseContentGenerator] Cleaned up old tasks:', prev.tasks.size - newTasks.size)
      
      return {
        ...prev,
        tasks: newTasks
      }
    })
  }

  // 清除所有任务缓存
  const clearAllTasks = () => {
    if (confirm('确定要清除所有任务历史吗？这将删除所有缓存的生成记录。')) {
      setAsyncState({
        tasks: new Map(),
        activeTaskId: null
      })
      setCurrentTask(null)
      localStorage.removeItem(CACHE_KEY)
      log('[CourseContentGenerator] Cleared all tasks')
    }
  }

  // 开始异步生成过程 - 支持通过taskId重新生成
  const startAsyncGeneration = async (taskId: string) => {
    const task = asyncState.tasks.get(taskId)
    if (!task) {
      log('[CourseContentGenerator] Task not found:', taskId)
      return
    }
    
    // 重新开始生成
    startAsyncGenerationWithTask(task)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部进度指示器 - 升级版 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                智能课程内容生成器
              </h1>
              <p className="text-gray-600 mt-2">基于AI技术，为你量身定制高质量学习内容</p>
            </div>
            <div className="flex items-center space-x-2">
              {['goal', 'path', 'node', 'generate', 'preview'].map((step, index) => {
                const isActive = currentStep === step
                const isCompleted = ['goal', 'path', 'node', 'generate', 'preview'].indexOf(currentStep) > index
                
                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg scale-110' 
                          : isCompleted 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    {index < 4 && (
                      <div className={`w-12 h-1 mx-2 rounded transition-colors duration-300 ${
                        isCompleted ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentStep === 'goal' && '🎯 第1步：选择你的学习目标'}
                  {currentStep === 'path' && '🛤️ 第2步：选择最适合的学习路径'}
                  {currentStep === 'node' && '📍 第3步：选择要学习的具体节点'}
                  {currentStep === 'generate' && '⚙️ 第4步：配置内容生成参数'}
                  {currentStep === 'preview' && '👀 第5步：预览生成的学习内容'}
                </span>
              </div>
              {selectedGoal && (
                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  目标：{selectedGoal.title}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 返回按钮 - 升级版 */}
        {currentStep !== 'goal' && (
          <button
            onClick={goBack}
            className="mb-6 group flex items-center text-blue-600 hover:text-blue-800 transition-all duration-200 hover:translate-x-1"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mr-3 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-medium">返回上一步</span>
          </button>
        )}

        {/* 异步任务状态监控组件 */}
        {currentTask && currentTask.status !== 'completed' && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className={`px-6 py-4 ${
              currentTask.status === 'generating' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
              currentTask.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-pink-500'
            }`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {currentTask.status === 'generating' && (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {currentTask.status === 'pending' && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {currentTask.status === 'failed' && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.266 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">
                        {currentTask.status === 'generating' && '🚀 AI正在后台生成内容'}
                        {currentTask.status === 'pending' && '⏳ 内容生成任务准备中'}
                        {currentTask.status === 'failed' && '❌ 内容生成遇到问题'}
                      </h3>
                      <p className="text-sm opacity-90">
                        {currentTask.status === 'generating' && `正在生成第 ${currentTask.currentIndex}/${currentTask.totalCount} 个模块`}
                        {currentTask.status === 'pending' && '即将开始AI内容生成'}
                        {currentTask.status === 'failed' && `错误：${currentTask.error || '未知错误'}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 进度信息 */}
                  <div className="text-right">
                    <div className="text-2xl font-bold">{currentTask.progress}%</div>
                    <div className="text-sm opacity-90">
                      {currentTask.generatedContents.length}/{currentTask.totalCount}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentStep('preview')}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      查看详情
                    </button>
                    {currentTask.status === 'failed' && (
                      <button
                        onClick={() => startAsyncGeneration(currentTask.id)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                      >
                        重试
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="bg-gray-100 h-2">
              <div 
                className={`h-2 transition-all duration-500 ${
                  currentTask.status === 'generating' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                  currentTask.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-pink-500'
                }`}
                style={{ width: `${currentTask.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 已完成任务的通知 */}
        {currentTask && currentTask.status === 'completed' && currentStep !== 'preview' && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg border border-green-200 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">✅ 内容生成完成！</h3>
                  <p className="text-sm opacity-90">
                    已成功生成 {currentTask.generatedContents.length} 个学习模块并自动保存
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentStep('preview')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  查看内容
                </button>
                <button
                  onClick={resetGenerator}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  生成新内容
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 步骤1: 选择目标 - 升级版 */}
        {currentStep === 'goal' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 选择你的学习目标</h2>
              <p className="text-gray-600">从现有目标中选择一个，开始生成个性化学习内容</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => selectGoal(goal)}
                  className="group relative border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{goal.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {goal.category}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      ⏱️ {goal.estimatedTimeWeeks} 周
                    </span>
                  </div>
                  
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            {goals.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学习目标</h3>
                <p className="text-gray-500">请先创建学习目标，然后回到这里生成课程内容</p>
              </div>
            )}
          </div>
        )}

        {/* 步骤2: 选择路径 - 升级版 */}
        {currentStep === 'path' && selectedGoal && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🛤️ 选择学习路径</h2>
              <p className="text-gray-600">为目标 <span className="font-semibold text-blue-600">{selectedGoal.title}</span> 选择最适合的学习路径</p>
            </div>
            
            <div className="space-y-6">
              {paths.map((path) => (
                <div
                  key={path.id}
                  onClick={() => selectPath(path)}
                  className="group relative border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 bg-gradient-to-r from-white via-blue-50/30 to-white"
                >
                  <div className="absolute top-6 right-6">
                    <div className="w-4 h-4 border-2 border-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-blue-400 rounded-full m-0.5 scale-0 group-hover:scale-100 transition-transform"></div>
                    </div>
                  </div>
                  
                  <div className="pr-12">
                    <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-700 transition-colors mb-3">
                      {path.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{path.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium">{path.nodes.length} 个节点</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="font-medium">{path.totalEstimatedHours} 小时</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="font-medium">{path.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (path.nodes.filter(n => n.status === 'completed').length / path.nodes.length) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {Math.round((path.nodes.filter(n => n.status === 'completed').length / path.nodes.length) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {paths.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学习路径</h3>
                <p className="text-gray-500">该目标还没有关联的学习路径，请先创建路径</p>
              </div>
            )}
          </div>
        )}

        {/* 步骤3: 选择节点 - 升级版 */}
        {currentStep === 'node' && selectedPath && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📍 选择学习节点</h2>
              <p className="text-gray-600">从路径 <span className="font-semibold text-blue-600">{selectedPath.title}</span> 中选择要生成内容的节点</p>
            </div>
            
            <div className="space-y-4">
              {selectedPath.nodes.map((node, index) => (
                <div
                  key={node.id}
                  onClick={() => selectNode(node)}
                  className="group relative border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                            {node.title}
                          </h3>
                          <p className="text-gray-600 mt-2 leading-relaxed">{node.description}</p>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            {node.skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                              >
                                ✨ {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-6 text-right">
                          <div className="flex items-center space-x-1 text-yellow-500 mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < node.difficulty ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            ⏱️ {node.estimatedHours} 小时
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            难度 {node.difficulty}/5
                          </div>
                        </div>
                      </div>
                      
                      {node.prerequisites && node.prerequisites.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800 font-medium mb-1">🔐 前置要求：</p>
                          <p className="text-xs text-amber-700">{node.prerequisites.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 步骤4: 配置生成 - 升级版 */}
        {currentStep === 'generate' && selectedNode && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ 配置内容生成</h2>
              <p className="text-gray-600">为节点 <span className="font-semibold text-blue-600">{selectedNode.title}</span> 配置AI生成参数</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* 左侧配置 */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      📊 内容数量
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="3"
                        max="8"
                        value={contentCount}
                        onChange={(e) => setContentCount(Number(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>3</span>
                        <span className="font-bold text-blue-600">{contentCount}</span>
                        <span>8</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">推荐生成4-5个内容模块</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      💻 编程语言
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'javascript', label: 'JavaScript', icon: '🟨', desc: '现代Web开发首选' },
                        { value: 'python', label: 'Python', icon: '🐍', desc: '数据科学和AI热门' }
                      ].map((lang) => (
                        <label key={lang.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="radio"
                            name="language"
                            value={lang.value}
                            checked={preferredLanguage === lang.value}
                            onChange={(e) => setPreferredLanguage(e.target.value as 'javascript' | 'python')}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                            preferredLanguage === lang.value 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300'
                          }`}>
                            {preferredLanguage === lang.value && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <span className="text-lg mr-2">{lang.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{lang.label}</div>
                            <div className="text-xs text-gray-500">{lang.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右侧配置 */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      ⏱️ 预计阅读时长（分钟）
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="10"
                        max="20"
                        value={estimatedReadingTime}
                        onChange={(e) => setEstimatedReadingTime(Number(e.target.value))}
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>10分钟</span>
                        <span className="font-bold text-purple-600">{estimatedReadingTime}分钟</span>
                        <span>20分钟</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600">
                        每个模块约 <span className="font-bold text-purple-600">{Math.floor(estimatedReadingTime / contentCount)}</span> 分钟
                      </p>
                    </div>
                  </div>

                  {/* 用户能力展示 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                    <h3 className="font-bold text-gray-900 mb-3">👤 你的能力画像</h3>
                    {getCurrentAssessment() ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">整体水平</span>
                          <span className="font-bold text-amber-600">
                            {getScoreLevel(getCurrentAssessment()!.overallScore)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">评分</span>
                          <span className="font-bold text-amber-600">
                            {getCurrentAssessment()!.overallScore}/100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700">暂无能力评估数据</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={generateContentAsync}
                  disabled={false}
                  className="relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" />
                  </svg>
                  开始异步AI生成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 步骤5: 异步生成预览 - 升级版 */}
        {currentStep === 'preview' && (
          <div className="space-y-8">
            {currentTask && (
              <>
                {/* 生成进度面板 */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentTask.status === 'pending' && '🚀 准备开始生成'}
                      {currentTask.status === 'generating' && '⚡ AI正在生成内容'}
                      {currentTask.status === 'completed' && '✅ 内容生成完成！'}
                      {currentTask.status === 'failed' && '❌ 生成遇到问题'}
                    </h2>
                    <p className="text-gray-600">
                      {currentTask.status === 'pending' && '任务已创建，即将开始AI内容生成'}
                      {currentTask.status === 'generating' && `正在生成第 ${currentTask.currentIndex}/${currentTask.totalCount} 个内容模块`}
                      {currentTask.status === 'completed' && `已成功生成 ${currentTask.generatedContents.length} 个高质量学习模块并自动保存`}
                      {currentTask.status === 'failed' && `生成失败：${currentTask.error || '未知错误'}`}
                    </p>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>生成进度</span>
                      <span>{currentTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          currentTask.status === 'generating' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                          currentTask.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          currentTask.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${currentTask.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 状态信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentTask.currentIndex}</div>
                      <div className="text-sm text-blue-800">当前进度</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{currentTask.generatedContents.length}</div>
                      <div className="text-sm text-green-800">已完成</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{currentTask.totalCount}</div>
                      <div className="text-sm text-purple-800">总数量</div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {currentTask.status === 'completed' && (
                      <button
                        onClick={resetGenerator}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        生成新内容
                      </button>
                    )}
                    {currentTask.status === 'failed' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => startAsyncGeneration(currentTask.id)}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重试生成
                        </button>
                        <button
                          onClick={resetGenerator}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          重新开始
                        </button>
                      </div>
                    )}
                    {currentTask.status === 'generating' && (
                      <div className="text-center">
                        <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-xl">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          正在后台生成，你可以离开页面
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 实时内容预览 */}
                {currentTask.generatedContents.length > 0 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">实时内容预览</h3>
                      <p className="text-gray-600">内容生成完成后会自动保存到学习库</p>
                    </div>

                    {currentTask.generatedContents.map((content, index) => (
                      <div key={content.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">{content.title}</h3>
                                <p className="text-blue-100 mt-1">预计阅读 {content.estimatedTime} 分钟</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                content.type === 'theory' ? 'bg-blue-100 text-blue-800' :
                                content.type === 'example' ? 'bg-green-100 text-green-800' :
                                content.type === 'exercise' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {content.type === 'theory' ? '📚 理论' :
                                 content.type === 'example' ? '💡 示例' :
                                 content.type === 'exercise' ? '✍️ 练习' : '🚀 实践'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="mb-6">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              学习要点
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {content.keyPoints.map((point, i) => (
                                <div key={i} className="flex items-start space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-600">{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <details className="cursor-pointer group">
                            <summary className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <span className="font-medium text-blue-600 group-hover:text-blue-800">
                                🔍 查看完整内容预览
                              </span>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                                {content.markdown.length > 800 
                                  ? content.markdown.substring(0, 800) + '\n\n... (内容较长，已截取前800字符)'
                                  : content.markdown
                                }
                              </div>
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 任务历史查看器 */}
        {asyncState.tasks.size > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">📋 生成任务历史</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{asyncState.tasks.size} 个任务</span>
                <div className="flex space-x-1">
                  <button
                    onClick={cleanupOldTasks}
                    className="text-xs px-2 py-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                    title="清理7天前的任务"
                  >
                    清理
                  </button>
                  <button
                    onClick={clearAllTasks}
                    className="text-xs px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="清除所有任务历史"
                  >
                    全部清除
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(asyncState.tasks.values())
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 6)
                .map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    task.id === asyncState.activeTaskId 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setCurrentTask(task)
                    if (task.status !== 'completed') {
                      setAsyncState(prev => ({ ...prev, activeTaskId: task.id }))
                    }
                    setCurrentStep('preview')
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-400' :
                      task.status === 'generating' ? 'bg-blue-400' :
                      task.status === 'failed' ? 'bg-red-400' :
                      'bg-yellow-400'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      {new Date(task.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-800 truncate mb-1">
                    {task.request.nodeId.split('_').pop() || '未知节点'}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{task.generatedContents.length}/{task.totalCount}</span>
                    <span className={
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'generating' ? 'text-blue-600' :
                      task.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }>
                      {task.status === 'completed' ? '完成' :
                       task.status === 'generating' ? '生成中' :
                       task.status === 'failed' ? '失败' : '待处理'}
                    </span>
                  </div>
                  
                  {task.status !== 'pending' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${
                            task.status === 'completed' ? 'bg-green-400' :
                            task.status === 'generating' ? 'bg-blue-400' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {asyncState.tasks.size > 6 && (
              <div className="mt-3 text-center">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    // 可以扩展为显示更多任务
                    log('[CourseContentGenerator] Show more tasks')
                  }}
                >
                  查看更多任务...
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 