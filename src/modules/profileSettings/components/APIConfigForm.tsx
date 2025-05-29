import React, { useState } from 'react'
import { 
  getAPIConfig, 
  saveAPIConfig, 
  validateAPIKey, 
  getSupportedModels, 
  getSupportedParams,
  resetParamsToDefault 
} from '../service'
import { AIModel, AI_MODEL_INFO, PARAM_DEFINITIONS, ModelParams } from '../types'
import { log } from '../../../utils/logger'

export const APIConfigForm: React.FC = () => {
  const [config, setConfig] = useState(getAPIConfig())
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supportedModels = getSupportedModels(config.model)
  const supportedParams = getSupportedParams(config.model)

  const handleModelChange = (model: AIModel) => {
    const newSpecificModel = AI_MODEL_INFO[model].models[0].id
    const newParams = resetParamsToDefault(model)
    
    setConfig({ 
      ...config, 
      model,
      specificModel: newSpecificModel,
      params: newParams
    })
    setMessage(null)
  }

  const handleSpecificModelChange = (specificModel: string) => {
    setConfig({ ...config, specificModel })
    setMessage(null)
  }

  const handleKeyChange = (key: string) => {
    setConfig({ ...config, key })
    setMessage(null)
  }

  const handleParamChange = (paramKey: string, value: any) => {
    setConfig({
      ...config,
      params: {
        ...config.params,
        [paramKey]: value
      }
    })
  }

  const handlePresetSelect = (preset: 'creative' | 'balanced' | 'precise') => {
    let newParams = { ...config.params }
    
    switch (preset) {
      case 'creative':
        newParams.temperature = 1.2
        newParams.topP = 0.9
        newParams.presencePenalty = 0.6
        break
      case 'balanced':
        newParams.temperature = 0.7
        newParams.topP = 0.9
        newParams.presencePenalty = 0
        break
      case 'precise':
        newParams.temperature = 0.1
        newParams.topP = 0.5
        newParams.presencePenalty = 0
        break
    }
    
    setConfig({ ...config, params: newParams })
  }

  const handleResetParams = () => {
    const defaultParams = resetParamsToDefault(config.model)
    setConfig({ ...config, params: defaultParams })
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

  const renderParamControl = (paramKey: string) => {
    const param = PARAM_DEFINITIONS[paramKey as keyof typeof PARAM_DEFINITIONS]
    const value = config.params[paramKey as keyof ModelParams]
    
    if (!param) return null

    if (paramKey === 'stopSequences') {
      return (
        <div key={paramKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {param.name}
          </label>
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => handleParamChange(paramKey, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="输入停止序列，用逗号分隔"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">{param.description}</p>
        </div>
      )
    }

    if (paramKey === 'systemPrompt') {
      return (
        <div key={paramKey} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {param.name}
          </label>
          <textarea
            value={value as string || ''}
            onChange={(e) => handleParamChange(paramKey, e.target.value)}
            placeholder="输入系统提示词..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">{param.description}</p>
        </div>
      )
    }

    return (
      <div key={paramKey} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {param.name}
          </label>
          <span className="text-sm text-gray-500">{value}</span>
        </div>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={value as number || param.default}
          onChange={(e) => handleParamChange(paramKey, parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <p className="text-xs text-gray-500">{param.description}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">API 配置</h2>
        <p className="text-gray-600 text-sm">
          配置 AI 服务的 API Key 和模型参数，用于生成课程内容和能力评估
        </p>
      </div>

      {/* 服务商选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择 AI 服务商
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
                <div className="text-xs text-gray-500 mt-2">
                  {info.models.length} 个模型可用
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 具体模型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择具体模型
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supportedModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSpecificModelChange(model.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                config.specificModel === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{model.name}</div>
              <div className="text-xs text-gray-600 mt-1">{model.description}</div>
            </button>
          ))}
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
        
        {config.key && (
          <div className="mt-2 text-sm text-gray-600">
            当前配置: {maskKey(config.key)}
          </div>
        )}
      </div>

      {/* 高级参数配置 */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          高级参数配置
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-6 p-4 bg-gray-50 rounded-lg">
            {/* 预设模板 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                快速预设
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePresetSelect('creative')}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200"
                >
                  创意模式
                </button>
                <button
                  onClick={() => handlePresetSelect('balanced')}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                >
                  平衡模式
                </button>
                <button
                  onClick={() => handlePresetSelect('precise')}
                  className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  精确模式
                </button>
                <button
                  onClick={handleResetParams}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  重置默认
                </button>
              </div>
            </div>

            {/* 参数控制 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportedParams.map(paramKey => renderParamControl(paramKey))}
            </div>
          </div>
        )}
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
          onClick={() => {
            const urls = {
              openai: 'https://platform.openai.com/api-keys',
              claude: 'https://console.anthropic.com/account/keys',
              qwen: 'https://dashscope.console.aliyun.com/apiKey'
            }
            window.open(urls[config.model], '_blank')
          }}
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
          <li>不同模型的参数范围和效果可能有所差异</li>
        </ul>
      </div>
    </div>
  )
} 