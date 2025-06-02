/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card'
import { Badge } from '../components/ui/Badge/Badge'
import { toast } from '../components/ui/Alert/Alert'
import { learningApiV2 } from '../../api/learningApi_v2'

interface PathActivationDebugProps {
  onNavigate: (view: string) => void
}

/**
 * 路径激活功能调试页面
 * 用于测试和验证激活/冻结功能是否正常工作
 */
export const PathActivationDebugPage: React.FC<PathActivationDebugProps> = ({ onNavigate }) => {
  const [paths, setPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<string>('未测试')

  // 刷新路径数据
  const refreshPaths = async () => {
    console.log('🔄 刷新路径数据...')
    try {
      const response = await learningApiV2.getAllPaths()
      console.log('📊 获取路径数据结果:', response)
      
      if (response.success) {
        setPaths(response.data || [])
        setApiStatus('API正常')
        console.log('✅ 路径数据刷新成功，共', response.data?.length || 0, '条路径')
      } else {
        setApiStatus('API错误: ' + response.error)
        console.error('❌ 获取路径失败:', response.error)
      }
    } catch (error) {
      setApiStatus('API异常: ' + (error as Error).message)
      console.error('❌ 刷新路径异常:', error)
    }
  }

  // 测试激活路径
  const testActivatePath = async (path: any) => {
    console.log('🧪 测试激活路径:', path.id, path.title)
    setLoading(true)
    
    try {
      console.log('📡 调用 API.updatePath (status: active)...')
      const result = await learningApiV2.updatePath(path.id, { status: 'active' })
      console.log('📡 API响应:', result)
      
      if (result.success) {
        toast.success(`✅ 测试成功！路径"${path.title}"已激活`)
        console.log('✅ 激活成功，刷新数据...')
        await refreshPaths()
      } else {
        toast.error(`❌ 激活失败: ${result.error}`)
        console.error('❌ 激活失败:', result.error)
      }
    } catch (error) {
      toast.error(`❌ 激活异常: ${(error as Error).message}`)
      console.error('❌ 激活异常:', error)
    } finally {
      setLoading(false)
    }
  }

  // 测试冻结路径  
  const testFreezePath = async (path: any) => {
    console.log('🧪 测试冻结路径:', path.id, path.title)
    setLoading(true)
    
    try {
      console.log('📡 调用 API.updatePath (status: frozen)...')
      const result = await learningApiV2.updatePath(path.id, { status: 'frozen' })
      console.log('📡 API响应:', result)
      
      if (result.success) {
        toast.success(`✅ 测试成功！路径"${path.title}"已冻结`)
        console.log('✅ 冻结成功，刷新数据...')
        await refreshPaths()
      } else {
        toast.error(`❌ 冻结失败: ${result.error}`)
        console.error('❌ 冻结失败:', result.error)
      }
    } catch (error) {
      toast.error(`❌ 冻结异常: ${(error as Error).message}`)
      console.error('❌ 冻结异常:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建测试路径
  const createTestPath = async () => {
    console.log('🧪 创建测试路径...')
    setLoading(true)
    
    try {
      // 首先获取一个目标
      const goalsResponse = await learningApiV2.getAllGoals()
      if (!goalsResponse.success || !goalsResponse.data?.length) {
        toast.error('没有可用的目标，请先创建一个目标')
        return
      }
      
      const testGoal = goalsResponse.data[0]
      console.log('🎯 使用目标:', testGoal.title)
      
      // 使用generatePathForGoal方法创建路径，然后冻结它
      const result = await learningApiV2.generatePathForGoal(testGoal.id, {
        learningStyle: 'visual',
        timePreference: 'moderate',
        difficultyProgression: 'gradual',
        includeProjects: true,
        includeExercises: true
      })
      
      if (result.success && result.data) {
        // 生成后立即冻结，以便测试激活功能
        const freezeResult = await learningApiV2.updatePath(result.data.id, { status: 'frozen' })
        if (freezeResult.success) {
          toast.success('✅ 测试路径创建并冻结成功')
        } else {
          toast.success('✅ 测试路径创建成功（但冻结失败）')
        }
        await refreshPaths()
      } else {
        toast.error(`❌ 创建测试路径失败: ${result.error}`)
      }
    } catch (error) {
      toast.error(`❌ 创建测试路径异常: ${(error as Error).message}`)
      console.error('❌ 创建测试路径异常:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    refreshPaths()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🧪 路径激活功能调试</h1>
              <p className="text-gray-600">测试和验证路径激活/冻结功能</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={apiStatus.includes('正常') ? 'success' : apiStatus.includes('错误') ? 'danger' : 'secondary'}>
                {apiStatus}
              </Badge>
              <Button variant="secondary" onClick={refreshPaths} disabled={loading}>
                🔄 刷新数据
              </Button>
              <Button variant="primary" onClick={createTestPath} disabled={loading}>
                ➕ 创建测试路径
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 调试信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 调试信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">总路径数：</span>
                <span>{paths.length}</span>
              </div>
              <div>
                <span className="font-medium">活跃路径：</span>
                <span>{paths.filter(p => p.status === 'active').length}</span>
              </div>
              <div>
                <span className="font-medium">冻结路径：</span>
                <span>{paths.filter(p => p.status === 'frozen').length}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>使用说明：</strong>
                <br />• 点击"激活"测试冻结路径的激活功能
                <br />• 点击"冻结"测试活跃路径的冻结功能
                <br />• 查看浏览器控制台获取详细调试信息
                <br />• 如果没有路径，点击"创建测试路径"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 路径列表 */}
        {paths.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🛤️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无路径数据</h3>
              <p className="text-gray-600 mb-6">请先创建一个测试路径进行功能验证</p>
              <Button onClick={createTestPath} disabled={loading}>
                创建测试路径
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paths.map((path) => (
              <Card key={path.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{path.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>状态: {path.status}</span>
                        <span>节点: {path.nodes?.length || 0}个</span>
                        <span>ID: {path.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        path.status === 'active' ? 'success' :
                        path.status === 'frozen' ? 'info' :
                        path.status === 'archived' ? 'secondary' : 'warning'
                      }>
                        {path.status}
                      </Badge>
                      
                      {path.status === 'frozen' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => testActivatePath(path)}
                          disabled={loading}
                          className="flex items-center gap-1"
                        >
                          🔥 测试激活
                        </Button>
                      )}
                      
                      {path.status === 'active' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testFreezePath(path)}
                          disabled={loading}
                          className="flex items-center gap-1"
                        >
                          ❄️ 测试冻结
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 底部说明 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🔧 调试提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 打开浏览器开发者工具的Console标签查看详细日志</li>
            <li>• 所有API调用和响应都会在控制台显示</li>
            <li>• 如果功能不工作，检查控制台是否有错误信息</li>
            <li>• 测试完成后可以返回正常的路径管理页面</li>
          </ul>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('path-planning')}
            className="mt-3"
          >
            返回路径规划页面
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PathActivationDebugPage 