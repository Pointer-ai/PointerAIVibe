import React, { useState, useEffect } from 'react'
import { 
  RuntimeProvider,
  IntegratedCodeRunner,
  PythonRunner,
  JavaScriptRunner,
  CppRunner,
  useRuntimeStatus
} from './index'
import { CODE_EXAMPLES } from './types'
import { log, error } from '../../utils/logger'

type SupportedLanguage = 'python' | 'cpp' | 'javascript'

// 内部组件：语言选择器
const LanguageSelector: React.FC<{
  selectedLanguage: SupportedLanguage
  onLanguageChange: (lang: SupportedLanguage) => void
}> = ({ selectedLanguage, onLanguageChange }) => {
  const runtimeStatus = useRuntimeStatus()

  // 获取语言显示信息
  const getLanguageInfo = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'javascript':
        return { icon: '🚀', name: 'JavaScript', description: '最快启动，立即运行' }
      case 'python':
        return { icon: '🐍', name: 'Python', description: '丰富库支持，功能强大' }
      case 'cpp':
        return { icon: '⚡', name: 'C++', description: '系统级语言，编译较慢' }
    }
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">选择编程语言</h2>
      <div className="flex gap-3">
        {(['javascript', 'python', 'cpp'] as SupportedLanguage[]).map(lang => {
          const langInfo = getLanguageInfo(lang)
          const status = runtimeStatus[lang]
          
          return (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`relative px-4 py-3 rounded-lg font-medium transition-colors ${
                selectedLanguage === lang
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{langInfo.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{langInfo.name}</div>
                  <div className="text-xs opacity-75">{langInfo.description}</div>
                </div>
              </div>
              
              {/* 状态指示器 */}
              {status?.isLoading && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
              {status?.isReady && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
              )}
              {status?.error && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* C++性能说明 */}
      {selectedLanguage === 'cpp' && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <h3 className="font-medium text-amber-800 mb-2">C++ 前端编译说明</h3>
              <div className="text-sm text-amber-700 space-y-1">
                <p>• 前端编译情况相对复杂，编译和运行速度较慢</p>
                <p>• 主要用于教学演示，占用浏览器编译资源</p>
                <p>• 性能表现一般，请理解并耐心等待</p>
                <p>• 如需快速体验，建议选择 JavaScript 或 Python</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 示例选择器组件
const ExampleSelector: React.FC<{
  language: SupportedLanguage
  selectedExample: string
  onSelectExample: (exampleId: string) => void
}> = ({ language, selectedExample, onSelectExample }) => {
  const currentLanguageExamples = CODE_EXAMPLES.filter(example => example.language === language)

  if (currentLanguageExamples.length === 0) return null

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-md font-semibold mb-3">代码示例</h3>
      <div className="flex flex-wrap gap-2">
        {currentLanguageExamples.map(example => (
          <button
            key={example.id}
            onClick={() => onSelectExample(example.id)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              selectedExample === example.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">{example.title}</div>
              <div className="text-xs opacity-75">{example.difficulty}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// 主视图组件
const CodeRunnerContent: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript')
  const [selectedExample, setSelectedExample] = useState('')
  const [code, setCode] = useState('')

  // 获取当前语言的示例
  const currentLanguageExamples = CODE_EXAMPLES.filter(example => example.language === selectedLanguage)

  // 初始化时设置第一个示例
  useEffect(() => {
    const firstExample = currentLanguageExamples[0]
    if (firstExample) {
      setSelectedExample(firstExample.id)
      setCode(firstExample.code)
    }
  }, [selectedLanguage]) // 依赖语言变化

  // 选择示例
  const handleSelectExample = (exampleId: string) => {
    const example = CODE_EXAMPLES.find(e => e.id === exampleId)
    if (example) {
      setSelectedExample(exampleId)
      setCode(example.code)
    }
  }

  // 获取对应的组件
  const getLanguageRunner = () => {
    const commonProps = {
      initialCode: code,
      onCodeChange: setCode,
      height: '400px',
      theme: 'dark' as const,
      onRunComplete: (execution: any) => {
        console.log('执行完成:', execution)
      },
      onError: (error: Error) => {
        console.error('执行出错:', error)
      }
    }

    switch (selectedLanguage) {
      case 'javascript':
        return <JavaScriptRunner {...commonProps} />
      case 'python':
        return <PythonRunner {...commonProps} />
      case 'cpp':
        return <CppRunner {...commonProps} />
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">多语言代码运行器</h1>
          <p className="mt-2 text-gray-600">
            基于 Monaco Editor 的专业代码编辑器，支持语法高亮、智能补全和多语言运行
          </p>
        </div>

        {/* 语言选择器 */}
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />

        {/* 示例选择器 */}
        <ExampleSelector
          language={selectedLanguage}
          selectedExample={selectedExample}
          onSelectExample={handleSelectExample}
        />

        {/* 代码运行器 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {getLanguageRunner()}
        </div>

        {/* 功能说明 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">功能特性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🎨 语法高亮</h4>
              <p className="text-sm text-gray-600">支持多种编程语言的完整语法高亮</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🧠 智能补全</h4>
              <p className="text-sm text-gray-600">VS Code 级别的智能代码补全和提示</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">⚡ 快速运行</h4>
              <p className="text-sm text-gray-600">Ctrl/Cmd + Enter 快捷键快速运行</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🚀 性能优化</h4>
              <p className="text-sm text-gray-600">Lazy loading 和缓存机制优化性能</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🔧 多语言支持</h4>
              <p className="text-sm text-gray-600">支持 Python、JavaScript、C++ 运行</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📊 实时输出</h4>
              <p className="text-sm text-gray-600">完整的运行结果和错误信息显示</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 导出主组件（包装在RuntimeProvider中）
export const CodeRunnerView: React.FC = () => {
  return (
    <RuntimeProvider config={{
      preloadLanguages: ['javascript'], // 预加载最快的JavaScript
      autoCleanup: true,
      statusUpdateInterval: 1000
    }}>
      <CodeRunnerContent />
    </RuntimeProvider>
  )
} 