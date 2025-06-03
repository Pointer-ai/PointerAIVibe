import React, { useState, useEffect, useRef } from 'react'
import { getCurrentProfile } from '../utils/profile'
import { t } from '../utils/i18n'
import AppleProfileSwitcher from './AppleProfileSwitcher'
import LanguageSwitcher from './common/LanguageSwitcher'

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
  const [showContactCard, setShowContactCard] = useState(false)
  
  // 触摸滑动相关状态
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)

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

  // 滑动数据 - 使用翻译函数
  const slides = [
    {
      id: 'evolution',
      title: t('landing.slides.evolution.title'),
      subtitle: t('landing.slides.evolution.subtitle'),
      description: t('landing.slides.evolution.description'),
      visual: '🧠✨',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      id: 'personalized',
      title: t('landing.slides.personalized.title'),
      subtitle: t('landing.slides.personalized.subtitle'),
      description: t('landing.slides.personalized.description'),
      visual: '👤🎯',
      gradient: 'from-blue-500 to-purple-500',
      bgGradient: 'from-blue-500/10 to-purple-500/10'
    },
    {
      id: 'dynamic',
      title: t('landing.slides.dynamic.title'),
      subtitle: t('landing.slides.dynamic.subtitle'),
      description: t('landing.slides.dynamic.description'),
      visual: '⚡🔮',
      gradient: 'from-green-500 to-teal-500',
      bgGradient: 'from-green-500/10 to-teal-500/10'
    },
    {
      id: 'ai-squared',
      title: t('landing.slides.aiSquared.title'),
      subtitle: t('landing.slides.aiSquared.subtitle'),
      description: t('landing.slides.aiSquared.description'),
      visual: '🤖²',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-500/10 to-purple-500/10'
    },
    {
      id: 'apikey',
      title: t('landing.slides.apikey.title'),
      subtitle: t('landing.slides.apikey.subtitle'),
      description: t('landing.slides.apikey.description'),
      visual: '🔑🚀',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10'
    }
  ]

  // 自动切换轮播 - 修改为可暂停和重启
  const startAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
  }

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
      autoSlideRef.current = null
    }
  }

  useEffect(() => {
    startAutoSlide()
    return () => stopAutoSlide()
  }, [slides.length])

  // 触摸滑动处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    stopAutoSlide() // 触摸时停止自动滑动
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      // 左滑 - 下一张
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    } else if (isRightSwipe) {
      // 右滑 - 上一张
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    }
    
    // 触摸结束后重新开始自动滑动
    setTimeout(() => {
      startAutoSlide()
    }, 3000) // 3秒后重新开始自动滑动
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
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
            <div className="flex items-center space-x-3">
              {/* 语言切换器 */}
              <LanguageSwitcher compact />
              
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
                        {t('navigation.dashboard')}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="px-6 py-3 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-2xl font-semibold text-gray-700 hover:bg-white/70 hover:border-gray-300/50 hover:text-gray-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-gray-200/25 hover:scale-105"
                >
                  {t('landing.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主滑动展示区域 - 添加触摸事件 */}
      <div 
        className="relative h-screen flex items-center justify-center overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
                        {t('landing.continueLeaning')}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={onGetStarted}
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-purple-200/25"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                        {t('landing.getStarted')}
                      </span>
                    </button>
                  )}
                  <button 
                    onClick={() => scrollToSection(`section-${slide.id}`)}
                    className="px-8 py-4 bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl text-lg font-semibold text-gray-700 hover:bg-white/70 hover:border-white/50 hover:text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gray-200/25 hover:scale-105"
                  >
                    {t('landing.learnMore')}
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

        {/* 滑动指示 - 更新文本 */}
        <div className="absolute bottom-20 right-8 z-20">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/30 shadow-lg text-gray-600 animate-bounce">
            <span className="text-sm font-medium">滑动浏览</span>
            <div className="flex space-x-1">
              <span className="text-xs">👆</span>
              <span className="text-xs">⌨️</span>
            </div>
          </div>
        </div>
      </div>

      {/* 联系方式角标 */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          {/* 联系按钮 */}
          <button
            onClick={() => setShowContactCard(!showContactCard)}
            className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>

          {/* 联系信息卡片 */}
          {showContactCard && (
            <div className="absolute bottom-16 left-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 min-w-80 animate-fadeInUp">
              <button
                onClick={() => setShowContactCard(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Tzion</h3>
                    <p className="text-gray-600 text-sm">Vibe Coding 创作者</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a 
                    href="mailto:tzion@pointer.ai"
                    className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 hover:border-blue-300/50 hover:shadow-md transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-700 font-medium">tzion@pointer.ai</span>
                  </a>

                  <a 
                    href="https://github.com/Pointer-ai/PointerAIVibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-gray-50/80 to-slate-50/80 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-md transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-gray-700 font-medium">GitHub 项目</span>
                  </a>
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 border border-purple-200/50 rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    🎓 欢迎对 <strong>Vibe Coding</strong> 和 <strong>AI 编程教育</strong> 感兴趣的伙伴联系我！
                  </p>
                </div>
              </div>
            </div>
          )}
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