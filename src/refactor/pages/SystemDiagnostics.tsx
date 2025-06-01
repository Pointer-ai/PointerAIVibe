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
import { refactorProfileService } from '../services/profileService'
import { refactorAIService } from '../services/aiService'
import { legacyDataService } from '../services/legacyDataService'

interface SystemDiagnosticsPageProps {
  onNavigate?: (view: string) => void
}

export const SystemDiagnosticsPage: React.FC<SystemDiagnosticsPageProps> = ({ onNavigate }) => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      // 收集诊断数据
      const data = {
        timestamp: new Date().toISOString(),
        refactorProfile: {
          currentProfile: refactorProfileService.getCurrentProfile(),
          allProfiles: refactorProfileService.getAllProfiles(),
          stats: refactorProfileService.getProfileStats()
        },
        legacyData: legacyDataService.diagnoseDataState(),
        aiService: {
          config: refactorAIService.getConfig(),
          hasConfig: !!refactorAIService.getConfig(),
          rawConfig: refactorProfileService.getCurrentProfile()?.data?.settings?.apiConfig
        },
        configAnalysis: {
          refactorApiConfig: refactorProfileService.getCurrentProfile()?.data?.settings?.apiConfig,
          legacyApiConfig: legacyDataService.getAPIConfig(),
          configComparison: {
            bothHaveKeys: false,
            keysMatch: false,
            providersMatch: false
          }
        }
      }

      setDiagnosticData(data)

      // 分析配置状态
      if (data.configAnalysis.refactorApiConfig && data.configAnalysis.legacyApiConfig) {
        const refactorKey = data.configAnalysis.refactorApiConfig.key
        const legacyKey = data.configAnalysis.legacyApiConfig.key
        
        data.configAnalysis.configComparison.bothHaveKeys = !!(refactorKey && legacyKey)
        data.configAnalysis.configComparison.keysMatch = refactorKey === legacyKey
        data.configAnalysis.configComparison.providersMatch = 
          data.configAnalysis.refactorApiConfig.model === data.configAnalysis.legacyApiConfig.model
      }

      // 运行测试
      const tests = await runTests()
      setTestResults(tests)
    } catch (error) {
      console.error('Diagnostics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const runTests = async () => {
    const tests = {
      profileCompatibility: false,
      apiConfigAccess: false,
      aiServiceHealth: false,
      dataConsistency: false,
      details: {
        profileCompatibility: '',
        apiConfigAccess: '',
        aiServiceHealth: '',
        dataConsistency: ''
      }
    }

    try {
      // 测试Profile兼容性
      const refactorProfile = refactorProfileService.getCurrentProfile()
      const legacyProfile = legacyDataService.getCurrentProfile()
      tests.profileCompatibility = !!(refactorProfile && legacyProfile && refactorProfile.id === legacyProfile.id)
      tests.details.profileCompatibility = tests.profileCompatibility 
        ? `Profile ID匹配: ${refactorProfile?.id}` 
        : '重构系统与Legacy系统Profile不一致'

      // 测试API配置访问
      const refactorApiConfig = refactorProfile?.data?.settings?.apiConfig
      const legacyApiConfig = legacyDataService.getAPIConfig()
      
      const hasRefactorKey = !!(refactorApiConfig?.key && refactorApiConfig.key.trim())
      const hasLegacyKey = !!(legacyApiConfig?.key && legacyApiConfig.key.trim())
      
      tests.apiConfigAccess = hasRefactorKey || hasLegacyKey
      tests.details.apiConfigAccess = `重构系统API密钥: ${hasRefactorKey ? '已配置' : '未配置'}, Legacy系统API密钥: ${hasLegacyKey ? '已配置' : '未配置'}`

      // 测试AI服务健康
      if (tests.apiConfigAccess) {
        try {
          const healthCheck = await refactorAIService.checkHealth()
          tests.aiServiceHealth = healthCheck
          tests.details.aiServiceHealth = healthCheck ? 'AI服务响应正常' : 'AI服务无响应或配置错误'
        } catch (error) {
          tests.aiServiceHealth = false
          tests.details.aiServiceHealth = `AI服务测试失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
      } else {
        tests.details.aiServiceHealth = '跳过测试 - 无有效API配置'
      }

      // 测试数据一致性
      if (hasRefactorKey && hasLegacyKey) {
        tests.dataConsistency = refactorApiConfig.key === legacyApiConfig.key
        tests.details.dataConsistency = tests.dataConsistency 
          ? 'API密钥完全一致' 
          : '重构系统和Legacy系统API密钥不一致'
      } else if (hasRefactorKey || hasLegacyKey) {
        tests.dataConsistency = false
        tests.details.dataConsistency = '只有一个系统配置了API密钥'
      } else {
        tests.dataConsistency = true
        tests.details.dataConsistency = '两个系统都未配置API密钥（一致）'
      }

    } catch (error) {
      console.error('Tests failed:', error)
      tests.details.profileCompatibility = `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }

    return tests
  }

  const reloadAIConfig = () => {
    refactorAIService.reloadConfig()
    runDiagnostics()
  }

  const autoFixConfig = () => {
    try {
      // 重新加载配置以应用修复
      refactorAIService.reloadConfig()
      
      // 运行诊断验证修复结果
      runDiagnostics()
      
      console.log('[SystemDiagnostics] Auto-fix attempted')
    } catch (error) {
      console.error('[SystemDiagnostics] Auto-fix failed:', error)
    }
  }

  const renderProfileInfo = (profile: any, title: string) => {
    if (!profile) {
      return (
        <div className="text-gray-500 text-sm">
          无可用Profile
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-sm space-y-1">
          <div><strong>ID:</strong> {profile.id}</div>
          <div><strong>名称:</strong> {profile.name}</div>
          <div><strong>头像:</strong> {profile.avatar || '无'}</div>
          {profile.email && <div><strong>邮箱:</strong> {profile.email}</div>}
        </div>
      </div>
    )
  }

  const renderAPIConfig = (config: any, title: string) => {
    if (!config) {
      return (
        <div className="text-gray-500 text-sm">
          无API配置
        </div>
      )
    }

    // 处理重构AI服务配置
    if (title.includes('重构AI服务')) {
      return (
        <div className="space-y-2">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-sm space-y-1">
            <div><strong>服务商:</strong> {config.provider || '未设置'}</div>
            <div><strong>模型:</strong> {config.model || '未设置'}</div>
            <div><strong>API密钥:</strong> 
              {config.apiKey ? (
                <Badge variant="success" className="ml-2">已配置 ({config.apiKey.length}字符)</Badge>
              ) : (
                <Badge variant="danger" className="ml-2">未配置</Badge>
              )}
            </div>
            {config.temperature !== undefined && (
              <div><strong>Temperature:</strong> {config.temperature}</div>
            )}
            {config.maxTokens !== undefined && (
              <div><strong>Max Tokens:</strong> {config.maxTokens}</div>
            )}
          </div>
        </div>
      )
    }

    // 处理Legacy API配置
    return (
      <div className="space-y-2">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-sm space-y-1">
          <div><strong>服务商:</strong> {config.model || '未设置'}</div>
          <div><strong>具体模型:</strong> {config.specificModel || '未设置'}</div>
          <div><strong>API密钥:</strong> 
            {config.key ? (
              <Badge variant="success" className="ml-2">已配置 ({config.key.length}字符)</Badge>
            ) : (
              <Badge variant="danger" className="ml-2">未配置</Badge>
            )}
          </div>
          {config.params && (
            <>
              <div><strong>Temperature:</strong> {config.params.temperature || '未设置'}</div>
              <div><strong>Max Tokens:</strong> {config.params.maxTokens || '未设置'}</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderTestResults = () => {
    const getStatusBadge = (passed: boolean) => (
      <Badge variant={passed ? 'success' : 'danger'}>
        {passed ? '通过' : '失败'}
      </Badge>
    )

    const testItems = [
      { key: 'profileCompatibility', label: 'Profile兼容性' },
      { key: 'apiConfigAccess', label: 'API配置访问' },
      { key: 'aiServiceHealth', label: 'AI服务健康' },
      { key: 'dataConsistency', label: '数据一致性' }
    ]

    return (
      <div className="space-y-4">
        {testItems.map(item => (
          <div key={item.key} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{item.label}</span>
              {getStatusBadge(testResults[item.key])}
            </div>
            {testResults.details && testResults.details[item.key] && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {testResults.details[item.key]}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">系统诊断</h1>
          <p className="mt-2 text-gray-600">检查Profile服务和数据兼容性</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={reloadAIConfig}>
            重新加载AI配置
          </Button>
          <Button variant="success" onClick={autoFixConfig}>
            自动修复配置
          </Button>
          <Button onClick={runDiagnostics} loading={loading}>
            重新运行诊断
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
            返回Dashboard
          </Button>
        </div>
      </div>

      {/* 测试结果概览 */}
      <Card>
        <CardHeader>
          <CardTitle>测试结果概览</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(testResults).length > 0 ? (
            renderTestResults()
          ) : (
            <div className="text-gray-500">运行诊断以查看测试结果</div>
          )}
        </CardContent>
      </Card>

      {diagnosticData && (
        <>
          {/* Profile对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>重构Profile服务</CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileInfo(diagnosticData.refactorProfile.currentProfile, '当前Profile')}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div><strong>总Profile数:</strong> {diagnosticData.refactorProfile.allProfiles.length}</div>
                    <div><strong>存储使用:</strong> {diagnosticData.refactorProfile.stats.storageUsed}MB</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legacy数据服务</CardTitle>
              </CardHeader>
              <CardContent>
                {renderProfileInfo(diagnosticData.legacyData.profile.current, '当前Profile')}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div><strong>有数据:</strong> 
                      <Badge variant={diagnosticData.legacyData.profile.hasData ? 'success' : 'danger'} className="ml-2">
                        {diagnosticData.legacyData.profile.hasData ? '是' : '否'}
                      </Badge>
                    </div>
                    <div><strong>数据键数:</strong> {diagnosticData.legacyData.profile.dataKeys.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API配置对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>重构AI服务配置</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAPIConfig(diagnosticData.aiService.config, '重构AI服务配置')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legacy API配置</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAPIConfig(diagnosticData.legacyData.apiConfig, 'Legacy API配置')}
              </CardContent>
            </Card>
          </div>

          {/* 配置分析 */}
          <Card>
            <CardHeader>
              <CardTitle>配置分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium text-sm mb-3">原始配置数据</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>重构系统原始配置:</strong>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(diagnosticData.configAnalysis.refactorApiConfig, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong>Legacy系统原始配置:</strong>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(diagnosticData.configAnalysis.legacyApiConfig, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-3">配置比较结果</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>两者都有API密钥:</span>
                      <Badge variant={diagnosticData.configAnalysis.configComparison.bothHaveKeys ? 'success' : 'danger'}>
                        {diagnosticData.configAnalysis.configComparison.bothHaveKeys ? '是' : '否'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>API密钥匹配:</span>
                      <Badge variant={diagnosticData.configAnalysis.configComparison.keysMatch ? 'success' : 'danger'}>
                        {diagnosticData.configAnalysis.configComparison.keysMatch ? '是' : '否'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>服务商匹配:</span>
                      <Badge variant={diagnosticData.configAnalysis.configComparison.providersMatch ? 'success' : 'danger'}>
                        {diagnosticData.configAnalysis.configComparison.providersMatch ? '是' : '否'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 详细信息 */}
          <Card>
            <CardHeader>
              <CardTitle>详细诊断信息</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(diagnosticData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* 存储状态 */}
          <Card>
            <CardHeader>
              <CardTitle>存储状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-sm mb-2">存储检查</div>
                  <div className="text-sm space-y-1">
                    <div><strong>Profile存储:</strong> 
                      <Badge variant={diagnosticData.legacyData.storage.hasProfileStorage ? 'success' : 'danger'} className="ml-2">
                        {diagnosticData.legacyData.storage.hasProfileStorage ? '存在' : '不存在'}
                      </Badge>
                    </div>
                    <div><strong>设置数据:</strong> 
                      <Badge variant={diagnosticData.legacyData.storage.hasSettingsData ? 'success' : 'danger'} className="ml-2">
                        {diagnosticData.legacyData.storage.hasSettingsData ? '存在' : '不存在'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-2">存储键 ({diagnosticData.legacyData.storage.storageKeys.length})</div>
                  <div className="text-xs max-h-32 overflow-y-auto">
                    {diagnosticData.legacyData.storage.storageKeys.map((key: string, index: number) => (
                      <div key={index} className="font-mono">{key}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 推荐操作 */}
          {!testResults.profileCompatibility && (
            <Alert variant="warning">
              <strong>Profile不兼容:</strong> 重构系统无法正确读取原有Profile数据。建议检查Profile服务配置或联系技术支持。
            </Alert>
          )}

          {!testResults.apiConfigAccess && (
            <Alert variant="warning">
              <strong>API配置缺失:</strong> 两个系统都没有有效的API配置。请前往Profile设置页面配置API密钥，或点击"自动修复配置"按钮。
            </Alert>
          )}

          {testResults.apiConfigAccess && !testResults.aiServiceHealth && (
            <Alert variant="warning">
              <strong>AI服务不健康:</strong> API配置存在但AI服务测试失败。可能的原因：
              <ul className="list-disc list-inside mt-2 ml-4">
                <li>API密钥无效或已过期</li>
                <li>模型名称不正确</li>
                <li>网络连接问题</li>
                <li>服务商API服务不可用</li>
              </ul>
              建议点击"自动修复配置"按钮或重新配置API设置。
            </Alert>
          )}

          {testResults.apiConfigAccess && !testResults.dataConsistency && (
            <Alert variant="info">
              <strong>数据不一致:</strong> 重构系统和Legacy系统的API配置不完全匹配。这可能导致功能表现不一致。建议点击"自动修复配置"来同步配置。
            </Alert>
          )}

          {testResults.profileCompatibility && testResults.apiConfigAccess && testResults.aiServiceHealth && testResults.dataConsistency && (
            <Alert variant="success">
              <strong>系统状态正常:</strong> 所有测试均通过！
              <ul className="list-disc list-inside mt-2 ml-4">
                <li>✅ Profile服务工作正常</li>
                <li>✅ API配置有效</li>
                <li>✅ AI服务响应正常</li>
                <li>✅ 数据一致性良好</li>
              </ul>
              您可以正常使用所有功能，包括能力评估、AI对话等。
            </Alert>
          )}
        </>
      )}
    </div>
  )
} 