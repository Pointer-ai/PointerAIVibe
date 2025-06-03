import React, { useState } from 'react'
import { CourseContentGenerator } from './CourseContentGenerator'
import { CourseContentViewer } from './CourseContentViewer'

type TabType = 'generate' | 'learn'

interface CourseContentPageProps {
  onBack?: () => void
  onHome?: () => void
}

export const CourseContentPage: React.FC<CourseContentPageProps> = ({ onBack, onHome }) => {
  const [activeTab, setActiveTab] = useState<TabType>('generate')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部和导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* 返回按钮 */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回
                </button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">课程内容管理</h1>
                <p className="text-sm text-gray-600">生成和学习个性化课程内容</p>
              </div>
            </div>
            
            {/* 标签导航 */}
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('generate')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'generate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>内容生成</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('learn')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'learn'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>开始学习</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1">
        {activeTab === 'generate' && <CourseContentGenerator />}
        {activeTab === 'learn' && <CourseContentViewer />}
      </div>

      {/* 页面底部信息 */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {activeTab === 'generate' && (
                <span>💡 提示：选择目标和路径后，可以为特定节点生成4-5个学习内容模块</span>
              )}
              {activeTab === 'learn' && (
                <span>📚 提示：点击课程卡片开始学习，系统会自动记录你的学习进度和时间</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span>支持语言：JavaScript, Python</span>
              <span>•</span>
              <span>内容格式：Markdown</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 