// 随意搜功能测试页面

import React from 'react'
import { GlobalAIAssistant } from '../components/AIAssistant/GlobalAIAssistant'

export const TestRandomSearch: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">随意搜功能测试</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">测试文本段落</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              请先完成能力评估，开启你的学习之旅。这是一个包含多种概念的段落，你可以选中其中的任何文字来测试随意搜功能。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              人工智能（Artificial Intelligence, AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器学习、深度学习、神经网络等技术。
            </p>
            <p className="text-gray-700 leading-relaxed">
              前端开发主要使用JavaScript、React、Vue等技术栈。后端开发常用的语言包括Python、Java、Node.js等。数据库技术包括MySQL、PostgreSQL、MongoDB等。
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">使用说明</h3>
            <ol className="space-y-2 text-blue-800">
              <li>1. 确保你已经配置了API Key（在Profile设置中）</li>
              <li>2. 选中页面中的任意文字</li>
              <li>3. 点击出现的"随意搜"按钮</li>
              <li>4. 悟语AI助手会自动解释选中的内容</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-medium text-yellow-900 mb-3">代码示例</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
              <code>{`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 输出: 55`}</code>
            </pre>
            <p className="text-yellow-800 mt-3">
              你也可以选中代码片段来让AI解释算法逻辑！
            </p>
          </div>
        </div>
      </div>
      
      {/* 全局AI助手 */}
      <GlobalAIAssistant />
    </div>
  )
} 