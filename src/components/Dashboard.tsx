import React from 'react'
import { getCurrentProfile, logout } from '../utils/profile'

interface DashboardProps {
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const profile = getCurrentProfile()

  if (!profile) {
    return null
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const modules = [
    {
      id: 'ability',
      title: '能力评估',
      description: '通过简历或问卷评估你的编程能力',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      status: '待开发'
    },
    {
      id: 'goal',
      title: '目标设定',
      description: '设定学习目标，分析与当前能力的差距',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      status: '待开发'
    },
    {
      id: 'path',
      title: '路径规划',
      description: 'AI 为你生成个性化的学习路径',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-green-500 to-teal-500',
      status: '待开发'
    },
    {
      id: 'course',
      title: '课程内容',
      description: 'AI 生成的交互式编程课程',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      status: '待开发'
    },
    {
      id: 'runner',
      title: '代码运行',
      description: '在浏览器中运行 Python 代码',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      status: '开发中'
    },
    {
      id: 'settings',
      title: 'Profile 设置',
      description: '管理你的学习档案和偏好设置',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-gray-500 to-gray-700',
      status: '待开发'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Pointer.ai</h1>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span className="text-2xl">{profile.avatar}</span>
                <span>{profile.name}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              退出登录
            </button>
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
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className="relative group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-all duration-200">
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    module.status === '开发中' 
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
                <div className="absolute inset-0 rounded-2xl ring-2 ring-black ring-opacity-0 group-hover:ring-opacity-10 transition-all duration-200"></div>
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
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2">开始学习后，这里将显示你的学习进度</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 