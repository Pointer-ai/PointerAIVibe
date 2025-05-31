import React, { useState, useEffect } from 'react'
import { getActivityHistory, clearActivityHistory } from '../service'
import { ActivityRecord, ACTIVITY_TYPE_LABELS } from '../types'

export const ActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [filter, setFilter] = useState<ActivityRecord['type'] | 'all'>('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = () => {
    const history = getActivityHistory()
    setActivities(history)
  }

  const handleClear = () => {
    clearActivityHistory()
    setActivities([])
    setShowClearConfirm(false)
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter)

  const getActivityIcon = (type: ActivityRecord['type']) => {
    const icons = {
      assessment: '📊',
      goal_set: '🎯',
      course_view: '📚',
      code_run: '💻',
      profile_update: '👤',
      function_call: '🔧',
      ai_chat: '🤖',
      data_operation: '🗂️'
    }
    return icons[type] || '📝'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">活动记录</h2>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
          disabled={activities.length === 0}
        >
          清除记录
        </button>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({activities.length})
        </button>
        {(Object.keys(ACTIVITY_TYPE_LABELS) as Array<keyof typeof ACTIVITY_TYPE_LABELS>).map((type) => {
          const count = activities.filter(a => a.type === type).length
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {ACTIVITY_TYPE_LABELS[type]} ({count})
            </button>
          )
        })}
      </div>

      {/* 活动列表 */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {filter === 'all' ? '暂无活动记录' : `暂无${ACTIVITY_TYPE_LABELS[filter as keyof typeof ACTIVITY_TYPE_LABELS]}记录`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{activity.action}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {ACTIVITY_TYPE_LABELS[activity.type]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(activity.timestamp)}</span>
                </div>
                {activity.details && (
                  <div className="mt-1 text-sm text-gray-600">
                    {Object.entries(activity.details).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        {key}: <span className="font-medium">{String(value)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 清除确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">确认清除记录？</h3>
            <p className="text-gray-600 mb-6">
              清除后将无法恢复活动记录
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认清除
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 