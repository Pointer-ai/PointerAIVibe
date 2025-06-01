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
import { learningApi } from '../../api'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card'
import { Button } from '../components/ui/Button/Button'
import { Badge, StatusBadge } from '../components/ui/Badge/Badge'
import { Alert } from '../components/ui/Alert/Alert'
import { ProgressBar } from '../components/ui/ProgressBar/ProgressBar'
import { Loading } from '../components/ui/Loading/Loading'

interface DiagnosticsData {
  profileSystem: {
    currentProfile: any
    allProfiles: any[]
    stats: any
  }
  apiConfig: {
    rawConfig: any
    refactorApiConfig: any
  }
  systemHealth: {
    storageAvailable: boolean
    profilesLoaded: boolean
    dataIntegrity: boolean
  }
}

export default function SystemDiagnostics() {
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Profile系统诊断
      const currentProfileResponse = learningApi.getCurrentProfile()
      const allProfilesResponse = learningApi.getAllProfiles()
      const statsResponse = learningApi.getProfileStats()

      const profileSystem = {
        currentProfile: currentProfileResponse.data,
        allProfiles: allProfilesResponse.data || [],
        stats: statsResponse.data
      }

      // API配置诊断
      const apiConfig = {
        rawConfig: currentProfileResponse.data?.data?.settings?.apiConfig,
        refactorApiConfig: currentProfileResponse.data?.data?.settings?.apiConfig
      }

      // 系统健康检查
      const systemHealth = {
        storageAvailable: checkStorageAvailable(),
        profilesLoaded: allProfilesResponse.success && (allProfilesResponse.data?.length || 0) > 0,
        dataIntegrity: await checkDataIntegrity()
      }

      setDiagnosticsData({
        profileSystem,
        apiConfig,
        systemHealth
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : '诊断失败')
    } finally {
      setIsLoading(false)
    }
  }

  const checkStorageAvailable = (): boolean => {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  const checkDataIntegrity = async (): Promise<boolean> => {
    try {
      const validationResponse = await learningApi.validateDataSync()
      return validationResponse.success && (validationResponse.data?.isValid || false)
    } catch {
      return false
    }
  }

  const handleAutoFix = async () => {
    setIsFixing(true)
    setError(null)
    
    try {
      const fixResponse = await learningApi.autoFixDataSync()
      if (fixResponse.success) {
        await runDiagnostics() // 重新运行诊断
      } else {
        setError(fixResponse.error || '自动修复失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '自动修复失败')
    } finally {
      setIsFixing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" text="运行系统诊断..." />
          </div>
        </div>
      </div>
    )
  }

  if (!diagnosticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="error">
            无法获取诊断数据
          </Alert>
        </div>
      </div>
    )
  }

  const { profileSystem, apiConfig, systemHealth } = diagnosticsData

  // 计算总体健康分数
  const healthScore = [
    systemHealth.storageAvailable,
    systemHealth.profilesLoaded,
    systemHealth.dataIntegrity,
    !!profileSystem.currentProfile,
    !!apiConfig.refactorApiConfig
  ].filter(Boolean).length

  const totalChecks = 5
  const healthPercentage = (healthScore / totalChecks) * 100

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">系统诊断</h1>
            <p className="text-gray-600 mt-2">检查系统健康状态和配置</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={runDiagnostics} disabled={isLoading}>
              🔄 重新诊断
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAutoFix} 
              disabled={isFixing || healthPercentage === 100}
            >
              {isFixing ? '修复中...' : '🔧 自动修复'}
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="error" closable onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 总体健康状态 */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              系统健康状态
              <StatusBadge 
                status={healthPercentage === 100 ? 'completed' : healthPercentage >= 80 ? 'active' : 'error'} 
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">总体健康分数</span>
                  <span className="text-sm text-gray-600">{healthScore}/{totalChecks}</span>
                </div>
                <ProgressBar
                  value={healthPercentage}
                  showLabel={true}
                  labelPosition="outside"
                  variant={healthPercentage === 100 ? 'success' : healthPercentage >= 80 ? 'info' : 'danger'}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {systemHealth.storageAvailable ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">存储访问</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {systemHealth.profilesLoaded ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Profile加载</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {systemHealth.dataIntegrity ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">数据完整性</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile系统状态 */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                Profile系统
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">当前Profile</div>
                  {profileSystem.currentProfile ? (
                    <div className="flex items-center gap-2">
                      <span>{profileSystem.currentProfile.avatar || '👤'}</span>
                      <span className="font-medium">{profileSystem.currentProfile.name}</span>
                      <Badge variant="success">活跃</Badge>
                    </div>
                  ) : (
                    <div className="text-gray-500">未设置</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Profile统计</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总数:</span>
                      <span className="ml-1 font-medium">{profileSystem.allProfiles.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">活跃:</span>
                      <span className="ml-1 font-medium">
                        {profileSystem.allProfiles.filter((p: any) => p.isActive).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {profileSystem.stats && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">系统统计</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">存储使用:</span>
                        <span className="ml-1 font-medium">{profileSystem.stats.storageUsed}MB</span>
                      </div>
                      <div>
                        <span className="text-gray-600">评估数:</span>
                        <span className="ml-1 font-medium">{profileSystem.stats.assessmentCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API配置状态 */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🔌</span>
                API配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">重构系统配置</div>
                  {apiConfig.refactorApiConfig ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{apiConfig.refactorApiConfig.model}</Badge>
                        <span className="text-sm text-gray-600">
                          {apiConfig.refactorApiConfig.specificModel || '默认模型'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        API Key: {apiConfig.refactorApiConfig.key ? '已配置' : '未配置'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">未配置</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">原系统配置</div>
                  {apiConfig.rawConfig ? (
                    <div className="text-sm text-gray-600">
                      <div>类型: {typeof apiConfig.rawConfig}</div>
                      <div>存在: ✅</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">未找到</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">兼容性检查</div>
                  <div className="flex items-center gap-2">
                    {apiConfig.refactorApiConfig && apiConfig.rawConfig ? (
                      <>
                        <Badge variant="success">兼容</Badge>
                        <span className="text-xs text-gray-600">配置格式正确</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="warning">需要配置</Badge>
                        <span className="text-xs text-gray-600">缺少必要配置</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细诊断信息 */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              详细诊断信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">检查项目</div>
                <div className="space-y-2">
                  <CheckItem 
                    label="localStorage 可用性" 
                    status={systemHealth.storageAvailable}
                    description="检查浏览器存储功能是否正常"
                  />
                  <CheckItem 
                    label="Profile 数据加载" 
                    status={systemHealth.profilesLoaded}
                    description="检查Profile数据是否正确加载"
                  />
                  <CheckItem 
                    label="数据完整性验证" 
                    status={systemHealth.dataIntegrity}
                    description="检查学习数据的完整性和一致性"
                  />
                  <CheckItem 
                    label="当前Profile状态" 
                    status={!!profileSystem.currentProfile}
                    description="检查是否有活跃的Profile"
                  />
                  <CheckItem 
                    label="API配置状态" 
                    status={!!apiConfig.refactorApiConfig}
                    description="检查AI服务配置是否完整"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 检查项目组件
const CheckItem: React.FC<{
  label: string
  status: boolean
  description: string
}> = ({ label, status, description }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <div className="flex items-center gap-3">
        <span className="text-xl">{status ? '✅' : '❌'}</span>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-gray-600">{description}</div>
        </div>
      </div>
    </div>
    <Badge variant={status ? 'success' : 'danger'}>
      {status ? '正常' : '异常'}
    </Badge>
  </div>
)

// 命名导出，用于其他组件导入
export const SystemDiagnosticsPage = SystemDiagnostics 