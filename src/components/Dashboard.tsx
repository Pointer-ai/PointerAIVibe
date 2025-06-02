import React, { useState, useEffect } from 'react'
import { getCurrentProfile } from '../utils/profile'
import { getCurrentAssessment } from '../modules/abilityAssess'
import { learningApiV2 } from '../api/learningApi_v2'
import AppleProfileSwitcher from './AppleProfileSwitcher'

interface DashboardProps {
  onLogout: () => void
  onNavigate: (view: 'refactor-assessment' | 'refactor-goal-management' | 'refactor-path-planning' | 'refactor-course-content' | 'refactor-code-runner' | 'refactor-data-management' | 'refactor-path-activation-debug' | 'profile-settings') => void
  onHome: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate, onHome }) => {
  const [profile, setProfile] = useState(getCurrentProfile())
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const currentAssessment = getCurrentAssessment()

  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        // 使用learningApiV2获取系统状态
        const statusResult = await learningApiV2.getSystemStatus()
        console.log('🎯 Dashboard API v2 调试信息:')
        console.log('- 系统状态:', statusResult)
        
        if (statusResult.success && statusResult.data) {
          const status = statusResult.data
          
          // 构建Dashboard需要的状态格式
          const dashboardStatus = {
            goals: {
              total: 0, // 需要从API获取
              active: status.progress.activeGoals,
              completed: 0 // 需要从API获取
            },
            paths: {
              total: 0, // 需要从API获取
              active: status.progress.activePaths
            },
            courses: {
              total: 0 // 需要从API获取
            },
            progressOverall: status.progress.overallProgress || 0
          }
          
          // 获取详细数据来补充统计信息
          const goalsResult = await learningApiV2.getAllGoals()
          const pathsResult = await learningApiV2.getAllPaths()
          
          if (goalsResult.success && goalsResult.data) {
            dashboardStatus.goals.total = goalsResult.data.length
            dashboardStatus.goals.completed = goalsResult.data.filter((g: any) => g.status === 'completed').length
          }
          
          if (pathsResult.success && pathsResult.data) {
            dashboardStatus.paths.total = pathsResult.data.length
          }
          
          console.log('🔧 Dashboard状态对象:', dashboardStatus)
          setSystemStatus(dashboardStatus)
        } else {
          console.error('❌ 获取系统状态失败:', statusResult.error)
          
          // 降级方案：直接使用API方法
          const goalsResult = await learningApiV2.getAllGoals()
          const pathsResult = await learningApiV2.getAllPaths()
          
          console.log('🔄 降级方案结果:')
          console.log('- 目标数据:', goalsResult)
          console.log('- 路径数据:', pathsResult)
          
          const goals = goalsResult.success ? goalsResult.data : []
          const paths = pathsResult.data
          
          const fallbackStatus = {
            goals: {
              total: goals?.length || 0,
              active: goals?.filter((g: any) => g.status === 'active').length || 0,
              completed: goals?.filter((g: any) => g.status === 'completed').length || 0
            },
            paths: {
              total: paths?.length || 0,
              active: paths?.filter((p: any) => p.status === 'active').length || 0
            },
            courses: {
              total: 0  // 待实现
            },
            progressOverall: 0
          }
          
          console.log('🔧 降级状态对象:', fallbackStatus)
          setSystemStatus(fallbackStatus)
        }
      } catch (error) {
        console.error('❌ 加载系统状态失败:', error)
        // 设置默认状态
        setSystemStatus({
          goals: { total: 0, active: 0, completed: 0 },
          paths: { total: 0, active: 0 },
          courses: { total: 0 },
          progressOverall: 0
        })
      } finally {
        setLoading(false)
      }
    }

    loadSystemStatus()
  }, [])

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
      id: 'assessment',
      view: 'refactor-assessment' as const,
      title: '🔍 能力评估',
      description: 'AI驱动的多维度能力分析，简历解析，可视化技能展示',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      status: currentAssessment ? '已完成' : '待评估',
      available: true
    },
    {
      id: 'goal',
      view: 'refactor-goal-management' as const,
      title: '🎯 目标设定',
      description: '设定学习目标，AI智能推荐，完整的目标生命周期管理',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      status: systemStatus?.goals 
        ? `${systemStatus.goals.active}/3 激活 (${systemStatus.goals.total}总)` 
        : '管理目标',
      available: true
    },
    {
      id: 'path',
      view: 'refactor-path-planning' as const,
      title: '🛤️ 路径规划',
      description: 'AI驱动的个性化学习路径生成、管理和进度跟踪系统',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
      status: systemStatus?.paths 
        ? `${systemStatus.paths.active}条激活 (${systemStatus.paths.total}总)` 
        : '规划路径',
      available: true
    },
    {
      id: 'course',
      view: 'refactor-course-content' as const,
      title: '📚 课程内容',
      description: '完整的课程内容管理系统，支持讲解部分和练习评测，集成代码运行器',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      status: systemStatus?.courses ? `${systemStatus.courses.total}个单元` : '管理课程',
      available: true
    },
    {
      id: 'runner',
      view: 'refactor-code-runner' as const,
      title: '💻 代码运行',
      description: '专业代码编辑器，支持Python/JS/C++多语言运行，Monaco Editor集成',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      status: '开发环境',
      available: true
    },
    {
      id: 'data-management',
      view: 'refactor-data-management' as const,
      title: '🗂️ 数据管理',
      description: '重构版数据管理系统，查看和管理学习数据，支持删除和导出功能',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      status: '数据工具',
      available: true
    },
    {
      id: 'path-activation-debug',
      view: 'refactor-path-activation-debug' as const,
      title: '🧪 路径激活调试',
      description: '测试和验证路径激活、冻结功能是否正常工作',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'from-yellow-500 to-orange-500',
      status: '调试工具',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* 可点击的 Logo */}
              {onHome ? (
                <button
                  onClick={onHome}
                  className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer"
                  title="返回首页"
                >
                  Pointer.ai
                </button>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">Pointer.ai</h1>
              )}
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">重构版 v2.0</span>
            </div>
            <div className="flex items-center gap-4">
              {/* 设置按钮 */}
              <button
                onClick={() => onNavigate('profile-settings')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <span>⚙️</span>
                设置
              </button>
              
              {/* Profile切换器 - 适配Dashboard样式 */}
              <div className="relative">
                {/* 创建一个渐变背景用于Dashboard样式 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                <AppleProfileSwitcher 
                  onProfileSwitch={handleProfileSwitch}
                  onLogout={onLogout}
                  className="relative"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            欢迎回来，{profile.name}！
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            使用重构后的系统，体验全新的学习管理体验
          </p>
          {currentAssessment && (
            <div className="mt-4 inline-flex items-center text-sm text-gray-600">
              <span className="mr-2">当前能力评分：</span>
              <span className="font-bold text-lg text-blue-600">{currentAssessment.overallScore}</span>
              <span className="ml-1">/ 100</span>
            </div>
          )}
        </div>

        {/* System Status */}
        {systemStatus && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">学习系统状态</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.goals?.total || 0}</div>
                <div className="text-sm text-gray-600">学习目标</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStatus.paths?.total || 0}</div>
                <div className="text-sm text-gray-600">学习路径</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemStatus.courses?.total || 0}</div>
                <div className="text-sm text-gray-600">课程单元</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.progressOverall?.toFixed(0) || 0}%</div>
                <div className="text-sm text-gray-600">总进度</div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Progress */}
        {systemStatus && systemStatus.progressOverall > 0 && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">学习进度概览</h3>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${systemStatus.progressOverall}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              已完成 {systemStatus.progressOverall?.toFixed(1)}% 的学习任务
            </div>
          </div>
        )}

        {/* Ability Assessment Display */}
        {currentAssessment && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">能力评估概览</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{currentAssessment.overallScore}</div>
                <div className="text-sm text-gray-600">综合评分</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentAssessment.dimensions ? Object.keys(currentAssessment.dimensions).length : 0}</div>
                <div className="text-sm text-gray-600">评估维度</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentAssessment.dimensions ? Object.values(currentAssessment.dimensions).filter(d => d.score >= 70).length : 0}
                </div>
                <div className="text-sm text-gray-600">优势技能</div>
              </div>
            </div>
          </div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`relative group ${module.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => module.available && onNavigate(module.view)}
            >
              <div className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 ${
                module.available ? 'hover:shadow-lg' : 'opacity-60'
              } transition-all duration-200`}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    module.status === '已完成' 
                      ? 'bg-green-100 text-green-800'
                      : module.status === '待评估'
                      ? 'bg-blue-100 text-blue-800'
                      : module.status.includes('激活') || module.status.includes('条路径') || module.status.includes('个单元')
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {module.status}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${module.color} text-white mb-4`}>
                  {module.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {module.description}
                </p>

                {/* Hover effect */}
                {module.available && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-white/10 group-hover:to-transparent transition-all duration-200 pointer-events-none" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Pointer.ai v2.0 重构版 - 基于 learningApi 统一架构</p>
          <p className="mt-1">享受全新的学习管理体验</p>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 