import React, { useState, useEffect } from 'react'
import { getCourseUnits, getLearningPaths, updateCourseUnit, addCoreEvent } from '../coreData'
import { CourseContentService } from './service'
import { CourseUnit, LearningPath } from '../coreData/types'
import { log } from '../../utils/logger'

const courseContentService = new CourseContentService()

export const CourseContentView = () => {
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([])
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [selectedPath, setSelectedPath] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 加载数据
  useEffect(() => {
    loadCourseUnits()
    loadLearningPaths()
  }, [])

  const loadCourseUnits = () => {
    const units = getCourseUnits()
    setCourseUnits(units)
  }

  const loadLearningPaths = () => {
    const paths = getLearningPaths()
    setLearningPaths(paths)
  }

  // 筛选课程单元
  const filteredUnits = courseUnits.filter(unit => {
    const matchesPath = selectedPath === 'all' || learningPaths.some(path => 
      path.nodes.some(node => node.id === unit.nodeId) && path.id === selectedPath
    )
    const matchesType = selectedType === 'all' || unit.type === selectedType
    const matchesSearch = searchTerm === '' || 
      unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.metadata.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesPath && matchesType && matchesSearch
  })

  // 开始学习课程单元
  const startLearning = async (unit: CourseUnit) => {
    try {
      const updatedUnit = {
        ...unit,
        progress: {
          ...unit.progress,
          status: 'reading' as const,
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        }
      }
      
      updateCourseUnit(unit.id, { progress: updatedUnit.progress })
      loadCourseUnits()
      setSelectedUnit(updatedUnit)

      // 记录学习开始事件
      addCoreEvent({
        type: 'course_unit_started',
        details: {
          unitId: unit.id,
          title: unit.title,
          nodeId: unit.nodeId
        }
      })

      log('[CourseContent] Started learning unit:', unit.title)
    } catch (error) {
      log('[CourseContent] Failed to start learning:', error)
    }
  }

  // 继续学习
  const continueLearning = (unit: CourseUnit) => {
    setSelectedUnit(unit)
  }

  // 完成学习部分
  const completeSection = async (unitId: string, section: 'reading' | 'practice' | 'summary') => {
    try {
      const unit = courseUnits.find(u => u.id === unitId)
      if (!unit) return

      const updatedProgress = {
        ...unit.progress,
        sections: {
          ...unit.progress.sections,
          [section]: {
            ...unit.progress.sections[section],
            completed: true,
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

      updateCourseUnit(unitId, { progress: updatedProgress })
      loadCourseUnits()

      // 更新当前选中的单元
      if (selectedUnit && selectedUnit.id === unitId) {
        setSelectedUnit({ ...selectedUnit, progress: updatedProgress })
      }

      // 记录完成事件
      addCoreEvent({
        type: 'course_section_completed',
        details: {
          unitId,
          section,
          overallProgress: updatedProgress.overallProgress
        }
      })
    } catch (error) {
      log('[CourseContent] Failed to complete section:', error)
    }
  }

  // 生成推荐内容
  const generateRecommendations = async () => {
    try {
      setIsGenerating(true)
      const recommendations = await courseContentService.recommendContent(
        'current_user', 
        courseUnits.map(unit => ({
          unitId: unit.id,
          title: unit.title,
          progress: unit.progress.overallProgress,
          type: unit.type
        }))
      )
      
      log('[CourseContent] Generated recommendations:', recommendations)
      // 这里可以显示推荐结果
    } catch (error) {
      log('[CourseContent] Failed to generate recommendations:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 获取进度颜色
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200'
    if (progress < 30) return 'bg-red-400'
    if (progress < 70) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory':
        return '📚'
      case 'example':
        return '💡'
      case 'exercise':
        return '🏋️'
      case 'project':
        return '🚀'
      case 'quiz':
        return '📝'
      default:
        return '📖'
    }
  }

  if (selectedUnit) {
    return <CourseUnitDetail 
      unit={selectedUnit} 
      onBack={() => setSelectedUnit(null)} 
      onCompleteSection={completeSection}
    />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">课程内容</h1>
        <p className="text-gray-600">浏览和学习您的个性化课程内容</p>
      </div>

      {/* 筛选和搜索 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* 学习路径筛选 */}
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有路径</option>
            {learningPaths.map(path => (
              <option key={path.id} value={path.id}>{path.title}</option>
            ))}
          </select>

          {/* 内容类型筛选 */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有类型</option>
            <option value="theory">理论学习</option>
            <option value="example">示例代码</option>
            <option value="exercise">练习题目</option>
            <option value="project">项目实战</option>
            <option value="quiz">测试评估</option>
          </select>

          {/* 推荐按钮 */}
          <button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? '生成中...' : '🎯 智能推荐'}
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索课程内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总课程数</p>
              <p className="text-2xl font-semibold text-gray-900">{courseUnits.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已完成</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courseUnits.filter(u => u.progress.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">🔄</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">进行中</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courseUnits.filter(u => ['reading', 'practicing', 'summarizing'].includes(u.progress.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">平均进度</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courseUnits.length > 0 ? Math.round(
                  courseUnits.reduce((sum, unit) => sum + unit.progress.overallProgress, 0) / courseUnits.length
                ) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 课程卡片网格 */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程内容</h3>
          <p className="text-gray-500">请先创建学习路径或调整筛选条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map(unit => (
            <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              {/* 卡片头部 */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(unit.type)}</span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {unit.type === 'theory' ? '理论' : 
                       unit.type === 'example' ? '示例' :
                       unit.type === 'exercise' ? '练习' :
                       unit.type === 'project' ? '项目' : '测试'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {unit.metadata.estimatedTime}分钟
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineClamp: 2
                }}>
                  {unit.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  lineClamp: 3
                }}>
                  {unit.description}
                </p>

                {/* 学习目标 */}
                {unit.metadata.learningObjectives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">学习目标</p>
                    <div className="space-y-1">
                      {unit.metadata.learningObjectives.slice(0, 2).map((objective, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                          {objective}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 关键词标签 */}
                {unit.metadata.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {unit.metadata.keywords.slice(0, 3).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 进度条 */}
              <div className="px-6 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">学习进度</span>
                  <span className="font-medium text-gray-900">{unit.progress.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(unit.progress.overallProgress)}`}
                    style={{ width: `${unit.progress.overallProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="px-6 pb-6">
                {unit.progress.status === 'not_started' ? (
                  <button
                    onClick={() => startLearning(unit)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    开始学习
                  </button>
                ) : unit.progress.status === 'completed' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => continueLearning(unit)}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                    >
                      ✅ 已完成
                    </button>
                    <button
                      onClick={() => continueLearning(unit)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      回顾
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => continueLearning(unit)}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    继续学习
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 课程单元详情组件
const CourseUnitDetail: React.FC<{
  unit: CourseUnit
  onBack: () => void
  onCompleteSection: (unitId: string, section: 'reading' | 'practice' | 'summary') => void
}> = ({ unit, onBack, onCompleteSection }) => {
  const [currentSection, setCurrentSection] = useState<'overview' | 'reading' | 'practice' | 'summary'>('overview')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 导航栏 */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回课程列表
        </button>
      </div>

      {/* 课程标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{unit.title}</h1>
        <p className="text-gray-600 mb-4">{unit.description}</p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📚 {unit.type === 'theory' ? '理论学习' : unit.type === 'example' ? '示例代码' : unit.type === 'exercise' ? '练习题目' : unit.type === 'project' ? '项目实战' : '测试评估'}</span>
          <span>⏱️ 预计 {unit.metadata.estimatedTime} 分钟</span>
          <span>📊 难度 {unit.metadata.difficulty}/5</span>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: '概览', icon: '👁️' },
            { key: 'reading', label: '阅读学习', icon: '📖' },
            { key: 'practice', label: '练习实践', icon: '🏋️' },
            { key: 'summary', label: '总结回顾', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setCurrentSection(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentSection === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {currentSection === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">学习目标</h3>
              <ul className="space-y-2">
                {unit.metadata.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">学习进度</h3>
              <div className="space-y-3">
                {Object.entries(unit.progress.sections).map(([section, sectionProgress]) => (
                  <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-3 ${sectionProgress.completed ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                      <span className="capitalize">
                        {section === 'reading' ? '阅读学习' : section === 'practice' ? '练习实践' : '总结回顾'}
                      </span>
                    </div>
                    <span className={`text-sm ${sectionProgress.completed ? 'text-green-600' : 'text-gray-500'}`}>
                      {sectionProgress.completed ? '已完成' : '未完成'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentSection === 'reading' && unit.content.reading && (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: unit.content.reading.markdown.replace(/\n/g, '<br>') }} />
            </div>
            
            {unit.content.reading.keyPoints.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">💡 关键要点</h4>
                <ul className="space-y-1">
                  {unit.content.reading.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!unit.progress.sections.reading.completed && (
              <button
                onClick={() => onCompleteSection(unit.id, 'reading')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✅ 完成阅读
              </button>
            )}
          </div>
        )}

        {currentSection === 'practice' && unit.content.practice && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">练习题目</h3>
            
            {unit.content.practice.exercises.map((exercise, index) => (
              <div key={exercise.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">{exercise.title}</h4>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    难度: {exercise.difficulty}/5
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{exercise.description}</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">题目:</p>
                  <p>{exercise.content.question}</p>
                  
                  {exercise.content.options && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">选项:</p>
                      <div className="space-y-2">
                        {exercise.content.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center">
                            <input type="radio" name={`exercise-${exercise.id}`} className="mr-2" />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {exercise.content.code && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">代码模板 ({exercise.content.code.language}):</p>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                        {exercise.content.code.starter}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!unit.progress.sections.practice.completed && (
              <button
                onClick={() => onCompleteSection(unit.id, 'practice')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✅ 完成练习
              </button>
            )}
          </div>
        )}

        {currentSection === 'summary' && unit.content.summary && (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: unit.content.summary.markdown.replace(/\n/g, '<br>') }} />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 关键收获</h4>
              <ul className="space-y-1">
                {unit.content.summary.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🚀 下一步</h4>
              <ul className="space-y-1">
                {unit.content.summary.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {!unit.progress.sections.summary.completed && (
              <button
                onClick={() => onCompleteSection(unit.id, 'summary')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✅ 完成总结
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContentView 