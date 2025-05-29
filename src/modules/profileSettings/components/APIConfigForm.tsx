import React, { useState, useEffect } from 'react'
import { getAPIConfig, saveAPIConfig, validateAPIKey } from '../service'
import { AIModel, AI_MODEL_INFO } from '../types'
import { log } from '../../../utils/logger'

export const APIConfigForm: React.FC = () => {
  const [config, setConfig] = useState(getAPIConfig())
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleModelChange = (model: AIModel) => {
    setConfig({ ...config, model })
    setMessage(null)
  }

  const handleKeyChange = (key: string) => {
    setConfig({ ...config, key })
    setMessage(null)
  }

  const handleSave = async () => {
    // 验证 API key
    if (!config.key) {
      setMessage({ type: 'error', text: '请输入 API Key' })
      return
    }

    if (!validateAPIKey(config.model, config.key)) {
      setMessage({ type: 'error', text: 'API Key 格式不正确' })
      return
    }

    setSaving(true)
    try {
      saveAPIConfig(config)
      setMessage({ type: 'success', text: 'API 配置已保存' })
      log('[APIConfigForm] API config saved successfully')
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    const start = key.slice(0, 8)
    const end = key.slice(-4)
    return `${start}${'*'.repeat(20)}${end}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">API 配置</h2>
        <p className="text-gray-600 text-sm">
          配置 AI 服务的 API Key，用于生成课程内容和能力评估
        </p>
      </div>

      {/* 模型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择 AI 模型
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(AI_MODEL_INFO) as AIModel[]).map((model) => {
            const info = AI_MODEL_INFO[model]
            return (
              <button
                key={model}
                onClick={() => handleModelChange(model)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  config.model === model
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium mb-1">{info.name}</div>
                <div className="text-sm text-gray-600">{info.description}</div>
                <div className="text-xs text-gray-500 mt-2">API: {info.apiUrl}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* API Key 输入 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder={`输入 ${AI_MODEL_INFO[config.model].name} 的 API Key (${AI_MODEL_INFO[config.model].keyHint})`}
            className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>
        
        {/* 当前 Key 状态 */}
        {config.key && (
          <div className="mt-2 text-sm text-gray-600">
            当前配置: {maskKey(config.key)}
          </div>
        )}
      </div>

      {/* 模型信息 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-sm mb-2">支持的模型</h3>
        <div className="space-y-1 text-sm text-gray-600">
          {AI_MODEL_INFO[config.model].models.map((modelName) => (
            <div key={modelName} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{modelName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 保存按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
        
        <button
          onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          获取 API Key
        </button>
      </div>

      {/* 注意事项 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <div className="font-medium mb-1">⚠️ 注意事项</div>
        <ul className="list-disc list-inside space-y-1">
          <li>API Key 仅保存在本地浏览器中，不会上传到服务器</li>
          <li>请妥善保管你的 API Key，避免泄露</li>
          <li>使用 AI 服务可能产生费用，请查看相应平台的计费规则</li>
        </ul>
      </div>
    </div>
  )
} 