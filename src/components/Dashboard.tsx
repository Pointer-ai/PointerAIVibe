import React, { useState } from 'react'
import { getCurrentProfile } from '../utils/profile'
import { getCurrentAssessment } from '../modules/abilityAssess'
import { getLearningGoals, getLearningPaths, getCourseUnits } from '../modules/coreData'
import AppleProfileSwitcher from './AppleProfileSwitcher'

// 简单的雷达图组件
const AbilityRadarChart: React.FC<{ assessment: any }> = ({ assessment }) => {
  const dimensions = Object.entries(assessment.dimensions).map(([key, dimension]: [string, any]) => ({
    name: key === 'programming' ? '编程' :
          key === 'algorithm' ? '算法' :
          key === 'project' ? '项目' :
          key === 'systemDesign' ? '设计' :
          key === 'communication' ? '协作' : key,
    score: dimension.score,
    fullName: key === 'programming' ? '编程基本功' :
              key === 'algorithm' ? '算法能力' :
              key === 'project' ? '项目能力' :
              key === 'systemDesign' ? '系统设计' :
              key === 'communication' ? '沟通协作' : key
  }))

  const size = 120
  const center = size / 2
  const radius = 40

  // 生成雷达图的点
  const points = dimensions.map((dim, index) => {
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2
    const distance = (dim.score / 100) * radius
    const x = center + Math.cos(angle) * distance
    const y = center + Math.sin(angle) * distance
    return { x, y, angle, distance: radius }
  })

  // 生成网格线
  const gridPoints = dimensions.map((_, index) => {
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    return { x, y, angle }
  })

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {/* 网格圆圈 */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * ratio}
              fill="none"
              stroke="rgb(226 232 240)"
              strokeWidth="1"
              opacity={0.3}
            />
          ))}
          
          {/* 网格线 */}
          {gridPoints.map((point, index) => (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgb(226 232 240)"
              strokeWidth="1"
              opacity={0.3}
            />
          ))}
          
          {/* 能力区域 */}
          <path
            d={pathData}
            fill="rgba(59 130 246 / 0.2)"
            stroke="rgb(59 130 246)"
            strokeWidth="2"
          />
          
          {/* 能力点 */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="rgb(59 130 246)"
            />
          ))}
          
          {/* 标签 */}
          {gridPoints.map((point, index) => {
            const labelX = center + Math.cos(point.angle) * (radius + 15)
            const labelY = center + Math.sin(point.angle) * (radius + 15)
            return (
              <text
                key={index}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
                fontSize="10"
              >
                {dimensions[index].name}
              </text>
            )
          })}
        </svg>
      </div>
      
      <div className="flex-1 space-y-2">
        {dimensions.map((dim, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 w-20 truncate" title={dim.fullName}>{dim.fullName}</span>
            <div className="flex items-center gap-2 flex-1 ml-2">
              <div className="flex-1 bg-gray-200/50 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 ${
                    dim.score >= 80 ? 'bg-green-400' :
                    dim.score >= 60 ? 'bg-blue-400' :
                    dim.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <span className="text-gray-800 font-medium w-8 text-right">{dim.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 学习数据摘要组件
const LearningSummary: React.FC = () => {
  const goals = getLearningGoals()
  const paths = getLearningPaths()
  const units = getCourseUnits()
  
  const activeGoals = goals.filter(g => g.status === 'active')
  const activePaths = paths.filter(p => p.status === 'active')
  const completedPaths = paths.filter(p => p.status === 'completed')
  
  const totalNodes = activePaths.reduce((sum, path) => sum + path.nodes.length, 0)
  const completedNodes = activePaths.reduce((sum, path) => 
    sum + path.nodes.filter(node => node.status === 'completed').length, 0
  )
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 学习目标摘要 */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span className="font-medium text-gray-700">学习目标</span>
        </div>
        <div className="text-lg font-bold text-gray-900">{activeGoals.length}</div>
        <div className="text-sm text-gray-500">
          {goals.length > activeGoals.length && `共${goals.length}个目标`}
        </div>
        {activeGoals.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 truncate">
            当前: {activeGoals[0].title}
          </div>
        )}
      </div>
      
      {/* 学习路径摘要 */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-medium text-gray-700">学习路径</span>
        </div>
        <div className="text-lg font-bold text-gray-900">{activePaths.length}</div>
        <div className="text-sm text-gray-500">
          {completedPaths.length > 0 && `已完成${completedPaths.length}条`}
        </div>
        {totalNodes > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            进度: {completedNodes}/{totalNodes} 节点
          </div>
        )}
      </div>
      
      {/* 学习内容摘要 */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>
          <span className="font-medium text-gray-700">学习内容</span>
        </div>
        <div className="text-lg font-bold text-gray-900">{units.length}</div>
        <div className="text-sm text-gray-500">
          课程单元
        </div>
        {units.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {units.filter(u => u.type === 'theory').length}理论 + {units.filter(u => u.type === 'project').length}项目
          </div>
        )}
      </div>
    </div>
  )
}

interface DashboardProps {
  onLogout: () => void
  onNavigate: (view: 'ability-assess' | 'goal-setting' | 'path-plan' | 'course-content' | 'code-runner' | 'profile-settings' | 'test-random-search' | 'agent-demo' | 'data-inspector') => void
  onHome: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate, onHome }) => {
  const [profile, setProfile] = useState(getCurrentProfile())
  const currentAssessment = getCurrentAssessment()

  if (!profile) {
    return null
  }

  const handleProfileSwitch = () => {
    // 刷新profile状态
    const newProfile = getCurrentProfile()
    setProfile(newProfile)
  }

  const modules = [
    {
      id: 'ability',
      view: 'ability-assess' as const,
      title: '能力评估',
      description: '通过简历或问卷评估你的编程能力',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      iconBg: 'from-purple-500 to-pink-500',
      status: currentAssessment ? '已完成' : '待评估',
      available: true
    },
    {
      id: 'goal',
      view: 'goal-setting' as const,
      title: '目标设定',
      description: '设定学习目标，智能激活管理',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      iconBg: 'from-blue-500 to-cyan-500',
      status: '可使用',
      available: true
    },
    {
      id: 'path',
      view: 'path-plan' as const,
      title: '路径规划',
      description: 'AI智能路径规划与可视化管理',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-green-500 to-teal-500',
      bgGradient: 'from-green-500/10 to-teal-500/10',
      iconBg: 'from-green-500 to-teal-500',
      status: '可使用',
      available: true
    },
    {
      id: 'course',
      view: 'course-content' as const,
      title: '课程内容',
      description: 'AI生成的交互式编程课程',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      iconBg: 'from-orange-500 to-red-500',
      status: '可使用',
      available: true
    },
    {
      id: 'runner',
      view: 'code-runner' as const,
      title: '代码运行',
      description: '专业代码编辑器，支持Python/JS/C++',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-500/10 to-purple-500/10',
      iconBg: 'from-indigo-500 to-purple-500',
      status: '已开发',
      available: true
    },
    {
      id: 'data-inspector',
      view: 'data-inspector' as const,
      title: '数据检查器',
      description: '验证AI工具调用和数据存储',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
      iconBg: 'from-amber-500 to-orange-500',
      status: '调试工具',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* 可点击的 Logo */}
              {onHome ? (
                <button
                  onClick={onHome}
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300 cursor-pointer"
                  title="返回首页"
                >
                  Pointer.ai
                </button>
              ) : (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pointer.ai</h1>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* 设置按钮 */}
              <button
                onClick={() => onNavigate('profile-settings')}
                className="group flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:border-gray-300/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/25 hover:scale-105"
              >
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">⚙️</span>
                <span className="text-sm font-medium">设置</span>
              </button>
              
              {/* Profile切换器 */}
              <AppleProfileSwitcher 
                onProfileSwitch={handleProfileSwitch}
                onLogout={onLogout}
                className=""
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg">
            <span className="text-3xl">{profile.avatar || '👤'}</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            欢迎回来，{profile.name}！
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            选择一个模块开始你的个性化学习之旅
          </p>
          {currentAssessment && (
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">当前能力评分</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{currentAssessment.overallScore}</span>
              <span className="text-gray-500">/100</span>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`group relative ${module.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => module.available && onNavigate(module.view)}
            >
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${module.bgGradient} backdrop-blur-md border border-white/20 p-8 shadow-lg ${
                module.available 
                  ? 'hover:shadow-2xl hover:shadow-gray-200/25 hover:scale-[1.02] hover:border-white/30' 
                  : 'opacity-60'
              } transition-all duration-300 ease-out`}>
                
                {/* Background Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 ${module.available ? 'group-hover:opacity-5' : ''} transition-opacity duration-300`}></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                    module.status === '已完成' 
                      ? 'bg-green-100/80 text-green-700 border-green-200/50'
                      : module.status === '待评估'
                      ? 'bg-blue-100/80 text-blue-700 border-blue-200/50'
                      : module.status === '待开发' 
                      ? 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50'
                      : 'bg-gray-100/80 text-gray-700 border-gray-200/50'
                  }`}>
                    {module.status}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${module.iconBg} text-white mb-6 shadow-lg ${module.available ? 'group-hover:scale-110 group-hover:shadow-xl' : ''} transition-all duration-300`}>
                  {module.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {module.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {module.description}
                </p>

                {/* Hover Indicator */}
                {module.available && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              学习进度
            </h3>
          </div>
          
          <div className="space-y-6">
            {currentAssessment ? (
              <>
                {/* 能力评估雷达图 */}
                <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <h4 className="text-lg font-semibold text-gray-800">能力评估概览</h4>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-gray-600">总体评分</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {currentAssessment.overallScore}
                      </span>
                      <span className="text-gray-500 text-sm">/100</span>
                    </div>
                  </div>
                  
                  <AbilityRadarChart assessment={currentAssessment} />
                </div>
                
                {/* 学习数据摘要 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    学习概况
                  </h4>
                  <LearningSummary />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">开始你的学习之旅</h4>
                <p className="text-gray-600 mb-6">请先完成能力评估，获取个性化学习建议</p>
                <button
                  onClick={() => onNavigate('ability-assess')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-600 hover:shadow-lg hover:shadow-blue-200/25 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  开始评估
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 