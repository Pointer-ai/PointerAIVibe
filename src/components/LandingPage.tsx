import React, { useState, useEffect } from 'react'
import { getCurrentProfile } from '../utils/profile'
import AppleProfileSwitcher from './AppleProfileSwitcher'

interface LandingPageProps {
  onGetStarted: () => void
  onLogin: () => void
  onDashboard?: () => void
  onProfileSwitch?: () => void
  onLogout?: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onLogin, 
  onDashboard, 
  onProfileSwitch,
  onLogout 
}) => {
  const [currentProfile, setCurrentProfile] = useState(getCurrentProfile())
  const [isLoggedIn, setIsLoggedIn] = useState(!!currentProfile)
  const [currentSlide, setCurrentSlide] = useState(0)

  // 监听 profile 状态变化
  useEffect(() => {
    const profile = getCurrentProfile()
    setCurrentProfile(profile)
    setIsLoggedIn(!!profile)
  }, []) // 仅在组件挂载时执行

  // 创建一个刷新 profile 状态的函数
  const refreshProfile = () => {
    const profile = getCurrentProfile()
    setCurrentProfile(profile)
    setIsLoggedIn(!!profile)
  }

  // 包装原有的回调函数，在执行后刷新 profile 状态
  const handleProfileSwitch = () => {
    onProfileSwitch?.()
    // 延迟一下再刷新，确保 localStorage 已经更新
    setTimeout(refreshProfile, 0)
  }

  const handleLogout = () => {
    onLogout?.()
    // 延迟一下再刷新，确保 localStorage 已经更新
    setTimeout(refreshProfile, 0)
  }

  // 滑动数据
  const slides = [
    {
      id: 'evolution',
      title: '随AI进化',
      subtitle: '自动升级的学习平台',
      description: '随着大语言模型的不断进化，我们的平台自动获得更强的教学能力。今天学不懂的概念，明天可能就有更好的解释方式。',
      visual: '🧠✨',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'personalized',
      title: '千人千面',
      subtitle: '专属定制的学习体验',
      description: '基于你的简历、目标和学习反馈，AI动态生成完全个性化的学习内容。每个人的学习路径都是独一无二的。',
      visual: '👤🎯',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      id: 'dynamic',
      title: '动态生成',
      subtitle: '实时创建的学习内容',
      description: '不是预制的课程，而是根据最新技术趋势和你的实际需求，AI实时生成的新鲜内容。永远保持前沿。',
      visual: '⚡🔮',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      id: 'ai-squared',
      title: 'AI 平方',
      subtitle: '连网站都是AI生成的',
      description: '本网站完全基于AI Coding生成，体验AI²的产品力量。从学习平台到平台本身，全程AI驱动开发。',
      visual: '🤖²',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'apikey',
      title: '一键启动',
      subtitle: '只需API Key即可开始',
      description: '无需复杂配置，只要提供大语言模型的API Key，就能立即享受最智能的编程教育体验。',
      visual: '🔑🚀',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  // 自动切换轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  // 平滑滚动到指定section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 固定导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Pointer.ai</span>
            </div>
            
            {/* AI Badges */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-medium text-purple-700">
                🤖 AI Native
              </div>
              <div className="px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
                ⚡ Auto Evolving
              </div>
              <div className="px-3 py-1 bg-indigo-100 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                🔥 AI Coded
              </div>
            </div>

            {/* 登录/用户信息 */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <AppleProfileSwitcher 
                  onProfileSwitch={handleProfileSwitch}
                  onLogout={handleLogout}
                />
                {onDashboard && (
                  <button
                    onClick={onDashboard}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                  >
                    进入控制台
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-all"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主滑动展示区域 */}
      <div className="relative h-screen flex items-center justify-center bg-white">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            {/* 背景渐变 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-5`} />
            
            {/* 内容 */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="max-w-4xl">
                {/* 视觉元素 */}
                <div className="text-8xl mb-8 animate-pulse">
                  {slide.visual}
                </div>
                
                {/* 标题 */}
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-4 tracking-tight text-gray-900">
                  {slide.title}
                </h1>
                
                {/* 副标题 */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-8 text-gray-700">
                  {slide.subtitle}
                </h2>
                
                {/* 描述 */}
                <p className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed mb-12 text-gray-600 max-w-3xl">
                  {slide.description}
                </p>

                {/* CTA 按钮 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {isLoggedIn && onDashboard ? (
                    <button
                      onClick={onDashboard}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl"
                    >
                      继续学习
                    </button>
                  ) : (
                    <button
                      onClick={onGetStarted}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl"
                    >
                      开始学习之旅
                    </button>
                  )}
                  <button 
                    onClick={() => scrollToSection(`section-${slide.id}`)}
                    className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    了解更多
                  </button>
                </div>
              </div>
            </div>

            {/* 装饰性几何图形 */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-gray-100 to-transparent rounded-full blur-xl opacity-60" />
            <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-to-r from-gray-200 to-transparent rounded-full blur-2xl opacity-40" />
          </div>
        ))}

        {/* 进度指示器 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-12 h-1 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-gray-800 shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* 滑动指示 */}
        <div className="absolute bottom-20 right-8 text-sm text-gray-500 animate-bounce">
          <div className="flex items-center space-x-2">
            <span>滑动浏览</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* 详细内容区域 - 随AI进化 */}
      <section id="section-evolution" className="py-24 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-6xl mb-6">🧠✨</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                随AI进化，永不过时的学习平台
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                我们的平台连接最新的大语言模型API，随着AI技术的快速进化自动升级教学能力。
                不需要等待版本更新，每一次AI模型的改进都会直接反映在你的学习体验中。
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">智能更新</h3>
                    <p className="text-gray-600">模型更新时，平台教学质量自动提升，无需手动升级</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">前沿技术</h3>
                    <p className="text-gray-600">始终基于最新AI技术，学习内容与时俱进</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">持续优化</h3>
                    <p className="text-gray-600">解释方式越来越好，难懂的概念变得简单易懂</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">AI模型版本更新：</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-green-700 font-medium">GPT-4 Turbo</span>
                      <span className="text-green-600 text-sm">✅ 已连接</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-700 font-medium">Claude 3.5 Sonnet</span>
                      <span className="text-blue-600 text-sm">✅ 已连接</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-700 font-medium">通义千问 Max</span>
                      <span className="text-purple-600 text-sm">✅ 已连接</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 text-center pt-4">
                    教学能力自动升级中...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 详细内容区域 - 千人千面 */}
      <section id="section-personalized" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold mb-6 text-gray-900">个性化学习路径示例</h3>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <div className="text-sm text-blue-600 font-medium">初学者 - 文科背景</div>
                    <div className="text-gray-700 mt-1">从基础概念开始，循序渐进，注重实践应用</div>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <div className="text-sm text-green-600 font-medium">有经验 - 理工背景</div>
                    <div className="text-gray-700 mt-1">快速跳过基础，专注高级技能和架构设计</div>
                  </div>
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <div className="text-sm text-purple-600 font-medium">转行者 - 其他技术栈</div>
                    <div className="text-gray-700 mt-1">基于已有经验，快速迁移到新技术领域</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm">
                    👤 基于你的简历智能生成
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="text-6xl mb-6">👤🎯</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                千人千面，专属定制学习
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                上传简历，AI分析你的技能背景、工作经验和学习目标，
                为你量身定制独一无二的学习路径。每个人的编程之旅都不相同。
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">简历智能分析</h3>
                    <p className="text-gray-600">AI深度解析你的简历，准确评估当前技能水平</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">目标导向设计</h3>
                    <p className="text-gray-600">根据你的职业目标，设计最高效的学习路径</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">动态调整</h3>
                    <p className="text-gray-600">根据学习反馈实时调整难度和节奏</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 详细内容区域 - 动态生成 */}
      <section id="section-dynamic" className="py-24 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">⚡🔮</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              动态生成，永远新鲜的内容
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              告别预制课程的局限，AI根据最新技术趋势和你的实际需求，
              实时生成新鲜、前沿的学习内容。永远保持技术前沿。
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">实时生成</h3>
              <p className="text-gray-600">根据你的需求，AI实时创建个性化课程内容</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">前沿技术</h3>
              <p className="text-gray-600">涵盖最新技术栈，紧跟行业发展趋势</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">智能适配</h3>
              <p className="text-gray-600">内容难度和风格自动适配你的水平</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 text-center">动态生成示例</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-gray-500 mb-2">传统预制课程</div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-700">
                    📚 React 基础教程 (2022版)<br/>
                    🔒 固定内容，无法更新<br/>
                    📅 可能包含过时信息<br/>
                    👥 千篇一律，缺乏针对性
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-green-600 font-medium mb-2">AI动态生成</div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-gray-700">
                    🚀 React 19 + Next.js 15 实战<br/>
                    ⚡ 基于你的Vue经验定制<br/>
                    🔄 包含最新Hooks和特性<br/>
                    🎯 针对你的项目需求优化
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 详细内容区域 - AI 平方 */}
      <section id="section-ai-squared" className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-6xl mb-6">🤖²</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                AI 平方：连网站都是AI生成的
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                这不只是一个使用AI的平台，连平台本身都是由AI编写的。
                体验AI²的产品力量：从学习内容到平台架构，全程AI驱动开发。
              </p>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">🎨 UI/UX 设计</h3>
                  <p className="text-gray-600">界面设计、用户体验流程全部由AI规划和实现</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">⚙️ 核心架构</h3>
                  <p className="text-gray-600">React组件、状态管理、路由设计等核心代码由AI编写</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">🧠 智能逻辑</h3>
                  <p className="text-gray-600">学习路径规划、能力评估算法等智能功能由AI实现</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl shadow-xl p-6 text-green-400 font-mono">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-2">AI Coding Terminal</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>$ claude: 设计一个现代化的学习平台</div>
                  <div className="text-blue-400">✓ 生成 React 组件架构</div>
                  <div className="text-blue-400">✓ 实现响应式 UI 界面</div>
                  <div className="text-blue-400">✓ 集成 AI 学习算法</div>
                  <div className="text-blue-400">✓ 配置测试和构建流程</div>
                  <div>$ 平台完成! 100% AI 生成 🚀</div>
                  <div className="animate-pulse">▌</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                AI Powered Development
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 详细内容区域 - 一键启动 */}
      <section id="section-apikey" className="py-24 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">🔑🚀</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              一键启动，30秒开始学习
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              无需复杂配置，只要提供大语言模型的API Key，
              就能立即享受最智能的编程教育体验。数据本地存储，隐私安全。
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">简单三步，立即开始</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">获取 API Key</h4>
                      <p className="text-gray-600">从 OpenAI、Claude 或通义千问获取API密钥</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">配置平台</h4>
                      <p className="text-gray-600">在设置中输入API Key，选择偏好的AI模型</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">开始学习</h4>
                      <p className="text-gray-600">上传简历，设定目标，AI为你生成专属学习路径</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">零后端架构</h3>
                  </div>
                  <p className="text-gray-600">纯前端设计，无需服务器，数据本地存储，隐私安全</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">数据安全</h3>
                  </div>
                  <p className="text-gray-600">API Key和学习数据仅存储在你的浏览器本地，绝不上传到服务器</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">即时启动</h3>
                  </div>
                  <p className="text-gray-600">无需等待安装或下载，打开浏览器即可使用</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特性展示区 */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              为什么选择 Pointer.ai
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我们不只是一个学习平台，而是一个随着AI进化而不断升级的智能教育生态
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 特性卡片 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300 transition-all">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">零配置启动</h3>
              <p className="text-gray-600">
                纯前端架构，无需服务器。输入API Key即可开始，数据本地存储，隐私安全。
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300 transition-all">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">精准个性化</h3>
              <p className="text-gray-600">
                AI分析你的简历和目标，生成专属学习路径。每个人的编程之旅都独一无二。
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300 transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">专业代码环境</h3>
              <p className="text-gray-600">
                集成Monaco Editor（VS Code内核），支持Python/JavaScript/C++三语言运行，语法高亮+智能补全。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-24 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            你的编程未来
            <br />
            从这里开始
          </h2>
          <p className="text-xl mb-12 text-white/90">
            加入数千名学习者，体验随AI进化的智能编程教育
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {isLoggedIn && onDashboard ? (
              <button
                onClick={onDashboard}
                className="px-12 py-4 bg-white text-purple-600 rounded-xl text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
              >
                继续学习
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="px-12 py-4 bg-white text-purple-600 rounded-xl text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
              >
                立即开始
              </button>
            )}
            <div className="text-sm text-white/80">
              只需 30 秒设置 · 终身受益
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded shadow-md"></div>
              <span className="font-semibold text-gray-900">Pointer.ai</span>
            </div>
            <div className="text-sm text-gray-500 text-center md:text-right">
              <p>Powered by Claude 4 Sonnet AI · 100% AI Generated Website</p>
              <p className="mt-1">© 2024 Pointer.ai · MIT License</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage