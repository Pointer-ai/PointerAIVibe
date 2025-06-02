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
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      id: 'personalized',
      title: '千人千面',
      subtitle: '专属定制的学习体验',
      description: '基于你的简历、目标和学习反馈，AI动态生成完全个性化的学习内容。每个人的学习路径都是独一无二的。',
      visual: '👤🎯',
      gradient: 'from-blue-500 to-purple-500',
      bgGradient: 'from-blue-500/10 to-purple-500/10'
    },
    {
      id: 'dynamic',
      title: '动态生成',
      subtitle: '实时创建的学习内容',
      description: '不是预制的课程，而是根据最新技术趋势和你的实际需求，AI实时生成的新鲜内容。永远保持前沿。',
      visual: '⚡🔮',
      gradient: 'from-green-500 to-teal-500',
      bgGradient: 'from-green-500/10 to-teal-500/10'
    },
    {
      id: 'ai-squared',
      title: 'AI 平方',
      subtitle: '连网站都是AI生成的',
      description: '本网站完全基于AI Coding生成，体验AI²的产品力量。从学习平台到平台本身，全程AI驱动开发。',
      visual: '🤖²',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-500/10 to-purple-500/10'
    },
    {
      id: 'apikey',
      title: '一键启动',
      subtitle: '只需API Key即可开始',
      description: '无需复杂配置，只要提供大语言模型的API Key，就能立即享受最智能的编程教育体验。',
      visual: '🔑🚀',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* 固定导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pointer.ai</span>
            </div>
            
            {/* AI Badges */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="px-4 py-2 bg-purple-100/80 backdrop-blur-md border border-purple-200/50 rounded-full text-sm font-semibold text-purple-700 shadow-sm">
                🤖 AI Native
              </div>
              <div className="px-4 py-2 bg-blue-100/80 backdrop-blur-md border border-blue-200/50 rounded-full text-sm font-semibold text-blue-700 shadow-sm">
                ⚡ Auto Evolving
              </div>
              <div className="px-4 py-2 bg-indigo-100/80 backdrop-blur-md border border-indigo-200/50 rounded-full text-sm font-semibold text-indigo-700 shadow-sm">
                🔥 AI Coded
              </div>
            </div>

            {/* 登录/用户信息 */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <AppleProfileSwitcher 
                  onProfileSwitch={handleProfileSwitch}
                  onLogout={handleLogout}
                  className=""
                />
                {onDashboard && (
                  <button
                    onClick={onDashboard}
                    className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-200/25 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                      进入控制台
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-6 py-3 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-2xl font-semibold text-gray-700 hover:bg-white/70 hover:border-gray-300/50 hover:text-gray-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-gray-200/25 hover:scale-105"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主滑动展示区域 */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-r from-green-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentSlide ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95'
            }`}
          >
            {/* 背景渐变 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient}`} />
            
            {/* 内容 */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="max-w-4xl">
                {/* 视觉元素 */}
                <div className="inline-flex items-center justify-center w-32 h-32 mb-8 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl">
                  <span className="text-6xl animate-bounce">{slide.visual}</span>
                </div>
                
                {/* 标题 */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
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
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-purple-200/25"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                        继续学习
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={onGetStarted}
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-purple-200/25"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                        开始学习之旅
                      </span>
                    </button>
                  )}
                  <button 
                    onClick={() => scrollToSection(`section-${slide.id}`)}
                    className="px-8 py-4 bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl text-lg font-semibold text-gray-700 hover:bg-white/70 hover:border-white/50 hover:text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gray-200/25 hover:scale-105"
                  >
                    了解更多
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 进度指示器 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-12 h-1.5 rounded-full transition-all duration-300 backdrop-blur-md ${
                index === currentSlide 
                  ? 'bg-white/80 shadow-lg scale-110' 
                  : 'bg-white/40 hover:bg-white/60 hover:scale-105'
              }`}
            />
          ))}
        </div>

        {/* 滑动指示 */}
        <div className="absolute bottom-20 right-8 z-20">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/30 shadow-lg text-gray-600 animate-bounce">
            <span className="text-sm font-medium">滑动浏览</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* 详细内容区域 - 随AI进化 */}
      <section id="section-evolution" className="py-24 bg-gradient-to-br from-purple-50/50 to-pink-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg">
                <span className="text-4xl">🧠✨</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent">
                随AI进化，永不过时的学习平台
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                我们的平台连接最新的大语言模型API，随着AI技术的快速进化自动升级教学能力。
                不需要等待版本更新，每一次AI模型的改进都会直接反映在你的学习体验中。
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">智能更新</h3>
                    <p className="text-gray-600">模型更新时，平台教学质量自动提升，无需手动升级</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">前沿技术</h3>
                    <p className="text-gray-600">始终基于最新AI技术，学习内容与时俱进</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">持续优化</h3>
                    <p className="text-gray-600">解释方式越来越好，难懂的概念变得简单易懂</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse delay-300"></div>
                </div>
                <div className="space-y-6">
                  <div className="text-sm text-gray-500 font-medium">AI模型版本更新：</div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-sm">
                      <span className="text-green-700 font-semibold">GPT-4 Turbo</span>
                      <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        已连接
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-sm">
                      <span className="text-blue-700 font-semibold">Claude 3.5 Sonnet</span>
                      <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                        已连接
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/80 to-violet-50/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-sm">
                      <span className="text-purple-700 font-semibold">通义千问 Max</span>
                      <span className="text-purple-600 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                        已连接
                      </span>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm rounded-full border border-gray-300/50 shadow-sm">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 font-medium">教学能力自动升级中...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 详细内容区域 - 千人千面 */}
      <section id="section-personalized" className="py-24 bg-gradient-to-br from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
                <h3 className="text-xl font-bold mb-6 text-gray-900">个性化学习路径示例</h3>
                <div className="space-y-4">
                  <div className="p-5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-sm">
                    <div className="text-sm text-blue-600 font-bold">初学者 - 文科背景</div>
                    <div className="text-gray-700 mt-2 leading-relaxed">从基础概念开始，循序渐进，注重实践应用</div>
                  </div>
                  <div className="p-5 border-l-4 border-green-500 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-sm">
                    <div className="text-sm text-green-600 font-bold">有经验 - 理工背景</div>
                    <div className="text-gray-700 mt-2 leading-relaxed">快速跳过基础，专注高级技能和架构设计</div>
                  </div>
                  <div className="p-5 border-l-4 border-purple-500 bg-gradient-to-r from-purple-50/80 to-violet-50/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-sm">
                    <div className="text-sm text-purple-600 font-bold">转行者 - 其他技术栈</div>
                    <div className="text-gray-700 mt-2 leading-relaxed">基于已有经验，快速迁移到新技术领域</div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl text-sm font-semibold shadow-lg">
                    <span className="text-lg">👤</span>
                    基于你的简历智能生成
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg">
                <span className="text-4xl">👤🎯</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                千人千面，专属定制学习
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                上传简历，AI分析你的技能背景、工作经验和学习目标，
                为你量身定制独一无二的学习路径。每个人的编程之旅都不相同。
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">简历智能分析</h3>
                    <p className="text-gray-600">AI深度解析你的简历，准确评估当前技能水平</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">目标驱动定制</h3>
                    <p className="text-gray-600">根据你的职业目标，定制最高效的学习路径</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mt-1 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">动态适应调整</h3>
                    <p className="text-gray-600">学习过程中持续优化，确保最佳学习效果</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 更多内容区域可以继续按相同风格升级... */}
      
    </div>
  )
}

export default LandingPage