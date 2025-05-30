// 学习进度统计展示组件

import React, { useState, useEffect } from 'react'
import { getLearningStats, getChatSessions } from './service'
import { log } from '../../utils/logger'

interface LearningStatsProps {
  isOpen: boolean
  onClose: () => void
}

export const LearningStats: React.FC<LearningStatsProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  const loadStats = async () => {
    try {
      setLoading(true)
      const statsData = getLearningStats()
      const sessions = getChatSessions()
      
      setStats({
        ...statsData,
        recentSessions: sessions.slice(0, 5)
      })
      
      log('[LearningStats] Stats loaded:', statsData)
    } catch (err) {
      console.error('Failed to load learning stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">📊 学习进度统计</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* 总体统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalKeywords}</div>
                  <div className="text-sm text-gray-600">查询词汇</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalQueries}</div>
                  <div className="text-sm text-gray-600">总查询次数</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalSessions}</div>
                  <div className="text-sm text-gray-600">对话会话</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalInteractions}</div>
                  <div className="text-sm text-gray-600">总互动次数</div>
                </div>
              </div>

              {/* 最常查询的关键词 */}
              {stats.mostQueriedKeywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">🔥 最常查询的关键词</h3>
                  <div className="space-y-2">
                    {stats.mostQueriedKeywords.map((item: any, index: number) => (
                      <div key={item.keyword} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium">{item.keyword}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{item.count} 次</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 最近的对话会话 */}
              {stats.recentSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">💬 最近的对话</h3>
                  <div className="space-y-2">
                    {stats.recentSessions.map((session: any) => (
                      <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{session.title}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.lastActivity).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.trigger === 'keyword' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {session.trigger === 'keyword' ? '关键词' : '手动'}
                          </span>
                          <span>{session.messages.length} 条消息</span>
                          {session.keyword && (
                            <span className="text-yellow-600">#{session.keyword}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学习建议 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">💡 学习建议</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {stats.totalKeywords === 0 && (
                    <p>• 开始浏览页面内容，点击高亮的关键词来开始学习</p>
                  )}
                  {stats.totalKeywords > 0 && stats.totalKeywords < 10 && (
                    <p>• 继续探索更多关键词，扩展你的知识面</p>
                  )}
                  {stats.totalQueries > 10 && (
                    <p>• 尝试回顾之前学过的概念，加深理解</p>
                  )}
                  {stats.totalSessions < 5 && (
                    <p>• 可以主动提问，与AI助手进行更深入的对话</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无学习数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 