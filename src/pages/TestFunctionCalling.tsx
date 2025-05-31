import React, { useState } from 'react'
import { RealLLMDemo } from '../components/AIAgent/RealLLMDemo'
import { getAPIConfig } from '../modules/profileSettings/service'

export const TestFunctionCalling: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false)
  const apiConfig = getAPIConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🤖 LLM Function Calling测试
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            验证真实大语言模型的智能工具调用能力
          </p>
          
          {/* API配置状态 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 配置状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${apiConfig.key ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'} border`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{apiConfig.key ? '✅' : '❌'}</span>
                  <div>
                    <div className="font-medium">API Key</div>
                    <div className="text-sm text-gray-600">
                      {apiConfig.key ? '已配置' : '未配置'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-100 border-blue-200 border">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🤖</span>
                  <div>
                    <div className="font-medium">AI模型</div>
                    <div className="text-sm text-gray-600">
                      {apiConfig.model || 'openai'} ({apiConfig.specificModel || 'gpt-4o'})
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-100 border-purple-200 border">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🛠️</span>
                  <div>
                    <div className="font-medium">可用工具</div>
                    <div className="text-sm text-gray-600">
                      22个AI工具
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {!apiConfig.key && (
              <div className="mt-4 p-4 bg-yellow-100 border-yellow-200 border rounded-lg">
                <div className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-800">需要配置API Key</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      请在Dashboard → Profile设置 → API配置中设置您的API Key。
                      <br />
                      支持 OpenAI GPT-4、Claude 3.5 Sonnet、阿里通义千问。
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 功能介绍 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">✨ 功能特性</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">🧠 智能工具选择</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 根据用户意图自动选择合适的工具</li>
                  <li>• 支持同时调用多个工具</li>
                  <li>• 智能生成工具参数</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">🔗 多模型支持</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OpenAI GPT-4 Function Calling</li>
                  <li>• Claude 3.5 Sonnet Tools</li>
                  <li>• 阿里通义千问 Function Calling</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">🛠️ 丰富的工具集</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 学习目标管理 (5个工具)</li>
                  <li>• 学习路径管理 (5个工具)</li>
                  <li>• 课程内容管理 (5个工具)</li>
                  <li>• 智能分析工具 (7个工具)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">📊 实时反馈</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 工具调用过程实时显示</li>
                  <li>• 详细的执行结果</li>
                  <li>• 成功率统计</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDemo(!showDemo)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            {showDemo ? '🔼 收起测试' : '🚀 开始测试'}
          </button>
        </div>

        {/* 测试界面 */}
        {showDemo && (
          <div className="opacity-0 animate-pulse">
            <RealLLMDemo />
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">🧪 自动测试</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>点击"自动测试"按钮，系统将执行5个预设的测试案例：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>查询学习目标</li>
                  <li>能力分析</li>
                  <li>创建学习目标</li>
                  <li>生成学习报告</li>
                  <li>学习困难处理</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">💬 自定义测试</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>在输入框中输入自然语言，测试AI的理解能力：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>"我想学习前端开发"</li>
                  <li>"分析一下我的学习进度"</li>
                  <li>"为我制定一个学习计划"</li>
                  <li>"我觉得学习太难了"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 