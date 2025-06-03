import React, { useState, useEffect } from 'react'
import { getCourseUnits, updateCourseUnit, addCoreEvent } from '../coreData'
import { CourseUnit, LearningPath } from '../coreData/types'
import { log } from '../../utils/logger'

interface CourseContentViewerProps {
  nodeId?: string
  pathId?: string
}

export const CourseContentViewer: React.FC<CourseContentViewerProps> = ({ nodeId, pathId }) => {
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null)
  const [currentSection, setCurrentSection] = useState<'reading' | 'practice' | 'summary'>('reading')
  const [studySessionStart, setStudySessionStart] = useState<Date | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [notes, setNotes] = useState('')
  const [highlights, setHighlights] = useState<Array<{ text: string; position: number }>>([])

  // 加载课程单元
  useEffect(() => {
    loadCourseUnits()
  }, [nodeId, pathId])

  // 时间追踪
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (studySessionStart) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - studySessionStart.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [studySessionStart])

  const loadCourseUnits = () => {
    const allUnits = getCourseUnits()
    const filteredUnits = nodeId 
      ? allUnits.filter(unit => unit.nodeId === nodeId)
      : allUnits
    setCourseUnits(filteredUnits)
  }

  // 开始学习
  const startLearning = (unit: CourseUnit) => {
    setSelectedUnit(unit)
    setStudySessionStart(new Date())
    setTimeSpent(0)
    setCurrentSection('reading')

    // 更新学习状态
    const updatedUnit = {
      ...unit,
      progress: {
        ...unit.progress,
        status: 'reading' as const,
        startedAt: unit.progress.startedAt || new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }
    }

    updateCourseUnit(unit.id, { progress: updatedUnit.progress })

    // 记录学习开始事件
    addCoreEvent({
      type: 'course_unit_started',
      details: {
        unitId: unit.id,
        title: unit.title,
        nodeId: unit.nodeId
      }
    })
  }

  // 完成当前部分
  const completeCurrentSection = () => {
    if (!selectedUnit) return

    const sessionTimeSpent = studySessionStart 
      ? Math.floor((Date.now() - studySessionStart.getTime()) / 1000 / 60) // 转换为分钟
      : 0

    const updatedProgress = {
      ...selectedUnit.progress,
      sections: {
        ...selectedUnit.progress.sections,
        [currentSection]: {
          ...selectedUnit.progress.sections[currentSection],
          completed: true,
          timeSpent: selectedUnit.progress.sections[currentSection].timeSpent + sessionTimeSpent,
          completedAt: new Date().toISOString()
        }
      },
      lastActivity: new Date().toISOString()
    }

    // 计算总体进度
    const completedSections = Object.values(updatedProgress.sections).filter(s => s.completed).length
    const totalSections = Object.keys(updatedProgress.sections).length
    updatedProgress.overallProgress = Math.round((completedSections / totalSections) * 100)

    // 如果所有部分都完成，标记为已完成
    if (completedSections === totalSections) {
      updatedProgress.status = 'completed'
      updatedProgress.completedAt = new Date().toISOString()
    }

    updateCourseUnit(selectedUnit.id, { progress: updatedProgress })
    setSelectedUnit({ ...selectedUnit, progress: updatedProgress })

    // 记录完成事件
    addCoreEvent({
      type: 'course_section_completed',
      details: {
        unitId: selectedUnit.id,
        section: currentSection,
        timeSpent: sessionTimeSpent,
        overallProgress: updatedProgress.overallProgress
      }
    })

    // 移动到下一个部分
    if (currentSection === 'reading' && !updatedProgress.sections.practice.completed) {
      setCurrentSection('practice')
    } else if (currentSection === 'practice' && !updatedProgress.sections.summary.completed) {
      setCurrentSection('summary')
    }

    setStudySessionStart(new Date()) // 重置计时器
  }

  // 标记内容状态
  const markContentStatus = (status: 'understood' | 'confused' | 'needs_review') => {
    if (!selectedUnit) return

    // 可以在这里添加状态标记逻辑
    addCoreEvent({
      type: 'content_status_marked',
      details: {
        unitId: selectedUnit.id,
        section: currentSection,
        status,
        timestamp: new Date().toISOString()
      }
    })
  }

  // 添加高亮
  const addHighlight = (text: string, position: number) => {
    const newHighlights = [...highlights, { text, position }]
    setHighlights(newHighlights)
    
    // 保存到本地存储或后端
    localStorage.setItem(`highlights_${selectedUnit?.id}`, JSON.stringify(newHighlights))
  }

  // 渲染Markdown内容
  const renderMarkdownContent = (markdown: string) => {
    // 简单的markdown渲染，实际项目中建议使用react-markdown或类似库
    const htmlContent = markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto"><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/gim, '<br/>')

    return { __html: htmlContent }
  }

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (selectedUnit) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 学习头部 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedUnit(null)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回课程列表
            </button>
            
            <div className="flex items-center space-x-4">
              {/* 学习计时器 */}
              <div className="text-sm text-gray-600">
                学习时间: {formatTime(timeSpent)}
              </div>
              
              {/* 进度显示 */}
              <div className="text-sm text-gray-600">
                进度: {selectedUnit.progress.overallProgress}%
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedUnit.title}</h1>
          <p className="text-gray-600 mb-4">{selectedUnit.description}</p>

          {/* 学习导航 */}
          <div className="flex space-x-1 border-b">
            {(['reading', 'practice', 'summary'] as const).map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  currentSection === section
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                } ${
                  selectedUnit.progress.sections[section].completed
                    ? 'text-green-600'
                    : ''
                }`}
              >
                {section === 'reading' ? '阅读' : section === 'practice' ? '练习' : '总结'}
                {selectedUnit.progress.sections[section].completed && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 学习内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主要内容区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {currentSection === 'reading' && selectedUnit.content.reading && (
                <div className="prose prose-lg max-w-none">
                  <div 
                    dangerouslySetInnerHTML={renderMarkdownContent(selectedUnit.content.reading.markdown)}
                    className="leading-relaxed"
                  />
                </div>
              )}

              {currentSection === 'practice' && selectedUnit.content.practice && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">练习题目</h3>
                  {selectedUnit.content.practice.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">{index + 1}. {exercise.title}</h4>
                      <p className="text-gray-600 mb-3">{exercise.description}</p>
                      <div className="text-sm text-gray-500">
                        难度: {'⭐'.repeat(exercise.difficulty)} | 
                        预计时间: {exercise.estimatedTime}分钟
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentSection === 'summary' && selectedUnit.content.summary && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">学习总结</h3>
                  <div 
                    dangerouslySetInnerHTML={renderMarkdownContent(selectedUnit.content.summary.markdown)}
                    className="leading-relaxed mb-6"
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">关键要点</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedUnit.content.summary.keyTakeaways.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 学习操作按钮 */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => markContentStatus('understood')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    ✓ 理解了
                  </button>
                  <button
                    onClick={() => markContentStatus('confused')}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                  >
                    ? 有困惑
                  </button>
                  <button
                    onClick={() => markContentStatus('needs_review')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    ↻ 需复习
                  </button>
                </div>

                <button
                  onClick={completeCurrentSection}
                  disabled={selectedUnit.progress.sections[currentSection].completed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedUnit.progress.sections[currentSection].completed ? '已完成' : '完成当前部分'}
                </button>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 学习进度 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h4 className="font-medium mb-3">学习进度</h4>
                <div className="space-y-2">
                  {Object.entries(selectedUnit.progress.sections).map(([key, section]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className={section.completed ? 'text-green-600' : 'text-gray-600'}>
                        {key === 'reading' ? '阅读' : key === 'practice' ? '练习' : '总结'}
                      </span>
                      <span className={section.completed ? 'text-green-600' : 'text-gray-400'}>
                        {section.completed ? '✓' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>总进度</span>
                    <span>{selectedUnit.progress.overallProgress}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedUnit.progress.overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 学习笔记 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h4 className="font-medium mb-3">学习笔记</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="记录你的学习心得..."
                  className="w-full h-24 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    // 保存笔记到本地存储或后端
                    localStorage.setItem(`notes_${selectedUnit.id}`, notes)
                    alert('笔记已保存')
                  }}
                  className="mt-2 w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存笔记
                </button>
              </div>

              {/* 关键要点 */}
              {selectedUnit.content.reading?.keyPoints && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h4 className="font-medium mb-3">关键要点</h4>
                  <ul className="space-y-1">
                    {selectedUnit.content.reading.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">课程内容学习</h1>
        <p className="text-gray-600">选择课程开始学习</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseUnits.map((unit) => (
          <div key={unit.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded text-xs ${
                unit.type === 'theory' ? 'bg-blue-100 text-blue-800' :
                unit.type === 'example' ? 'bg-green-100 text-green-800' :
                unit.type === 'exercise' ? 'bg-yellow-100 text-yellow-800' :
                unit.type === 'project' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {unit.type === 'theory' ? '理论' :
                 unit.type === 'example' ? '示例' :
                 unit.type === 'exercise' ? '练习' :
                 unit.type === 'project' ? '项目' : '测验'}
              </span>
              <div className="text-xs text-gray-500">
                {unit.metadata.estimatedTime} 分钟
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{unit.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{unit.description}</p>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>进度</span>
                <span>{unit.progress.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    unit.progress.overallProgress === 0 ? 'bg-gray-300' :
                    unit.progress.overallProgress < 100 ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${unit.progress.overallProgress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => startLearning(unit)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              {unit.progress.status === 'not_started' ? '开始学习' : '继续学习'}
            </button>
          </div>
        ))}
      </div>

      {courseUnits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">暂无课程内容</div>
          <p className="text-sm text-gray-400">请先使用课程内容生成器创建学习内容</p>
        </div>
      )}
    </div>
  )
} 