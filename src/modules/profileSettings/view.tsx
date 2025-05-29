import React, { useState } from 'react'
import { getCurrentProfile } from '../../utils/profile'
import { APIConfigForm } from './components/APIConfigForm'
import { ActivityHistory } from './components/ActivityHistory'
import { ProfileInfo } from './components/ProfileInfo'

export const ProfileSettingsView: React.FC = () => {
  const profile = getCurrentProfile()
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'activity'>('profile')

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-500">
          请先登录
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as const, label: '个人信息', icon: '👤' },
    { id: 'api' as const, label: 'API 配置', icon: '🔑' },
    { id: 'activity' as const, label: '活动记录', icon: '📊' }
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile 设置</h1>
          <p className="mt-2 text-gray-600">管理你的个人信息、API 配置和查看活动记录</p>
        </div>

        {/* Tab 导航 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'profile' && <ProfileInfo profile={profile} />}
          {activeTab === 'api' && <APIConfigForm />}
          {activeTab === 'activity' && <ActivityHistory />}
        </div>
      </div>
    </div>
  )
} 