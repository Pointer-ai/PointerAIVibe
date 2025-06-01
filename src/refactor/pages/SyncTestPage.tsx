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
import { Alert } from '../components/ui/Alert/Alert'
import { Badge } from '../components/ui/Badge/Badge'
import { useProfileSync } from '../hooks/useProfileSync'
import { refactorProfileService } from '../services/profileService'
import { refactorAIService } from '../services/aiService'
import { syncManager } from '../services/syncManager'

interface SyncTestPageProps {
  onNavigate?: (view: string) => void
}

export const SyncTestPage: React.FC<SyncTestPageProps> = ({ onNavigate }) => {
  const { currentProfile, isLoading, isSyncing, switchProfile } = useProfileSync()
  const [profiles, setProfiles] = useState<any[]>([])
  const [testResults, setTestResults] = useState<any[]>([])
  const [autoTestRunning, setAutoTestRunning] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = () => {
    const allProfiles = refactorProfileService.getAllProfiles()
    setProfiles(allProfiles)
  }

  const runQuickSwitchTest = async () => {
    if (profiles.length < 2) {
      alert('需要至少2个Profile才能进行切换测试')
      return
    }

    setAutoTestRunning(true)
    const results: any[] = []

    try {
      // 快速切换测试
      for (let i = 0; i < 5; i++) {
        const targetProfile = profiles[i % profiles.length]
        const startTime = Date.now()
        
        console.log(`[SyncTest] Round ${i + 1}: Switching to ${targetProfile.name}`)
        
        const success = await switchProfile(targetProfile.id)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        // 验证状态同步
        const currentProfileAfter = refactorProfileService.getCurrentProfile()
        const aiConfig = refactorAIService.getConfig()
        
        results.push({
          round: i + 1,
          targetProfile: targetProfile.name,
          targetId: targetProfile.id,
          success,
          duration,
          profileMatch: currentProfileAfter?.id === targetProfile.id,
          aiConfigLoaded: !!aiConfig,
          timestamp: new Date().toISOString()
        })

        // 短暂延迟确保状态稳定
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } catch (error) {
      console.error('[SyncTest] Quick switch test failed:', error)
    } finally {
      setAutoTestRunning(false)
      setTestResults(results)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const getStatusBadge = (success: boolean) => (
    <Badge variant={success ? 'success' : 'danger'}>
      {success ? '成功' : '失败'}
    </Badge>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔄 同步测试</h1>
          <p className="mt-2 text-gray-600">测试快速切换时的状态同步性能</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={runQuickSwitchTest}
            loading={autoTestRunning}
            disabled={profiles.length < 2}
          >
            快速切换测试
          </Button>
          <Button variant="secondary" onClick={clearTestResults}>
            清空结果
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
            返回Dashboard
          </Button>
        </div>
      </div>

      {/* 当前状态 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>当前Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {currentProfile ? (
              <div className="space-y-2">
                <div><strong>名称:</strong> {currentProfile.name}</div>
                <div><strong>ID:</strong> {currentProfile.id}</div>
                <div><strong>头像:</strong> {currentProfile.avatar}</div>
              </div>
            ) : (
              <div className="text-gray-500">无Profile</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>状态指示器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>加载中:</span>
                <Badge variant={isLoading ? 'warning' : 'success'}>
                  {isLoading ? '是' : '否'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>同步中:</span>
                <Badge variant={isSyncing ? 'warning' : 'success'}>
                  {isSyncing ? '是' : '否'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>AI配置:</span>
                <Badge variant={refactorAIService.getConfig() ? 'success' : 'danger'}>
                  {refactorAIService.getConfig() ? '已加载' : '未加载'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可用Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>总数:</strong> {profiles.length}</div>
              <div className="max-h-32 overflow-y-auto">
                {profiles.map(p => (
                  <div key={p.id} className="text-sm flex justify-between">
                    <span>{p.name}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => switchProfile(p.id)}
                      disabled={isLoading || isSyncing || p.id === currentProfile?.id}
                    >
                      切换
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 测试说明 */}
      <Alert variant="info">
        <strong>测试说明:</strong> 快速切换测试会在多个Profile之间快速切换，验证状态同步的稳定性。
        测试将检查Profile切换成功率、AI配置加载状态和同步耗时。
      </Alert>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 结果汇总 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">成功切换</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length)}ms
                  </div>
                  <div className="text-sm text-gray-600">平均耗时</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.filter(r => r.profileMatch).length}
                  </div>
                  <div className="text-sm text-gray-600">Profile匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {testResults.filter(r => r.aiConfigLoaded).length}
                  </div>
                  <div className="text-sm text-gray-600">AI配置成功</div>
                </div>
              </div>

              {/* 详细结果 */}
              <div className="space-y-2">
                <h4 className="font-medium">详细测试结果</h4>
                <div className="max-h-64 overflow-y-auto border rounded">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-3 border-b flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-sm">第{result.round}轮</span>
                        <span className="text-sm">{result.targetProfile}</span>
                        <span className="text-xs text-gray-500">{result.duration}ms</span>
                      </div>
                      <div className="flex space-x-2">
                        {getStatusBadge(result.success)}
                        {getStatusBadge(result.profileMatch)}
                        {getStatusBadge(result.aiConfigLoaded)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 同步管理器状态 */}
      <Card>
        <CardHeader>
          <CardTitle>同步管理器状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>同步操作数:</span>
              <span>{syncManager.getOperations().length}</span>
            </div>
            <div className="flex justify-between">
              <span>正在同步:</span>
              <Badge variant={syncManager.isSyncing() ? 'warning' : 'success'}>
                {syncManager.isSyncing() ? '是' : '否'}
              </Badge>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">注册的同步操作:</h4>
              <div className="space-y-1">
                {syncManager.getOperations().map((op, index) => (
                  <div key={index} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                    <span>{op.name}</span>
                    <span className="text-gray-500">优先级: {op.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 