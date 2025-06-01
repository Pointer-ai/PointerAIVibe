import React, { useState } from 'react'
import { getCurrentProfile } from '../utils/profile'
import { getCurrentAssessment } from '../modules/abilityAssess'
import AppleProfileSwitcher from './AppleProfileSwitcher'

interface DashboardProps {
  onLogout: () => void
  onNavigate: (view: 'ability-assess' | 'goal-setting' | 'path-plan' | 'course-content' | 'code-runner' | 'profile-settings' | 'learning-path-view' | 'data-inspector' | 'refactor-dashboard') => void
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
      id: 'assessment',
      view: 'ability-assess' as const,
      title: '能力评估',
      description: '上传简历或完成问卷，AI 分析你的技能水平',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      status: currentAssessment ? '已完成' : '待评估',
      available: true
    },
    {
      id: 'refactor',
      view: 'refactor-dashboard' as const,
      title: '🏗️ 重构系统测试',
      description: '体验重构后的系统架构和新功能',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-500',
      status: '🆕 重构版',
      available: true
    },
    {
      id: 'goal',
      view: 'goal-setting' as const,
      title: '目标设定',
      description: '设定学习目标，智能激活管理，与能力差距分析',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      status: '可使用',
      available: true
    },
    {
      id: 'path',
      view: 'path-plan' as const,
      title: '路径规划',
      description: 'AI 为你生成个性化的学习路径',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-green-500 to-teal-500',
      status: '待开发',
      available: false
    },
    {
      id: 'course',
      view: 'course-content' as const,
      title: '课程内容',
      description: 'AI 生成的交互式编程课程',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      status: '待开发',
      available: false
    },
    {
      id: 'runner',
      view: 'code-runner' as const,
      title: '代码运行',
      description: '专业代码编辑器，支持Python/JS/C++多语言运行',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      status: '已开发',
      available: true
    },
    {
      id: 'learning-path',
      view: 'learning-path-view' as const,
      title: '学习路径管理',
      description: '可视化管理学习目标和路径，支持流程控制',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6m3-3l3 3-3 3" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-500',
      status: '可使用',
      available: true
    },
    {
      id: 'data-inspector',
      view: 'data-inspector' as const,
      title: '数据管理',
      description: '管理和查看学习数据，支持删除和导出功能',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      status: '数据工具',
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
            </div>
            <div className="flex items-center gap-4">
              {/* 测试随意搜 - 仅开发环境显示 - 已隐藏 */}
              {/* {window.location.hostname === 'localhost' && (
                <button 
                  onClick={() => onNavigate('test-random-search')}
                  className="text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 border border-purple-200"
                >
                  <span>🧪</span>
                  测试随意搜
                </button>
              )} */}
              
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
            选择一个模块开始你的学习之旅
          </p>
          {currentAssessment && (
            <div className="mt-4 inline-flex items-center text-sm text-gray-600">
              <span className="mr-2">当前能力评分：</span>
              <span className="font-bold text-lg text-blue-600">{currentAssessment.overallScore}</span>
              <span className="ml-1">/ 100</span>
            </div>
          )}
        </div>

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
                      : module.status === '开发中' 
                      ? 'bg-yellow-100 text-yellow-800'
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
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>

                {/* Hover Effect */}
                {module.available && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-black ring-opacity-0 group-hover:ring-opacity-10 transition-all duration-200"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            学习进度
          </h3>
          <div className="space-y-4">
            {currentAssessment ? (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">能力评估已完成</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">总体评分</span>
                    <span className="font-bold">{currentAssessment.overallScore}/100</span>
                  </div>
                </div>
                
                {/* 各维度进度 */}
                <div className="space-y-3">
                  {Object.entries(currentAssessment.dimensions).map(([key, dimension]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {key === 'programming' && '编程基本功'}
                          {key === 'algorithm' && '算法能力'}
                          {key === 'project' && '项目能力'}
                          {key === 'systemDesign' && '系统设计'}
                          {key === 'communication' && '沟通协作'}
                        </span>
                        <span className="font-medium">{dimension.score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            dimension.score >= 80 ? 'bg-green-500' :
                            dimension.score >= 60 ? 'bg-blue-500' :
                            dimension.score >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${dimension.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">请先完成能力评估，开启你的学习之旅</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 