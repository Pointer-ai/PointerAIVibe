import React, { useState } from 'react'
import { getCurrentProfile } from '../utils/profile'
import { getCurrentAssessment } from '../modules/abilityAssess'
import AppleProfileSwitcher from './AppleProfileSwitcher'

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
      id: 'agent-demo',
      view: 'agent-demo' as const,
      title: 'AI 智能对话',
      description: '与真实AI助手对话，体验智能学习指导',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/10 to-rose-500/10',
      iconBg: 'from-pink-500 to-rose-500',
      status: '可对话',
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
      title: '学习路径管理',
      description: 'AI生成个性化学习路径，可视化管理',
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
      status: '待开发',
      available: false
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
              <div>
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100/50">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    能力评估已完成
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总体评分</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{currentAssessment.overallScore}</span>
                      <span className="text-gray-500">/100</span>
                    </div>
                  </div>
                </div>
                
                {/* 各维度进度 */}
                <div className="space-y-4">
                  {Object.entries(currentAssessment.dimensions).map(([key, dimension]) => (
                    <div key={key} className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          {key === 'programming' && '编程基本功'}
                          {key === 'algorithm' && '算法能力'}
                          {key === 'project' && '项目能力'}
                          {key === 'systemDesign' && '系统设计'}
                          {key === 'communication' && '沟通协作'}
                        </span>
                        <span className="text-lg font-bold text-gray-800">{dimension.score}</span>
                      </div>
                      <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ease-out ${
                            dimension.score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            dimension.score >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            dimension.score >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          } shadow-sm`}
                          style={{ width: `${dimension.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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