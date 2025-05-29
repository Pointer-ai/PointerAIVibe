import React, { useState, useEffect } from 'react'
import { getCurrentProfile } from '../utils/profile'

interface LandingPageProps {
  onGetStarted: () => void
  onLogin: () => void
  onDashboard?: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onDashboard }) => {
  const currentProfile = getCurrentProfile()
  const isLoggedIn = !!currentProfile
  const [currentSlide, setCurrentSlide] = useState(0)

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
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-xl">{currentProfile.avatar || '👤'}</span>
                  <span>{currentProfile.name}</span>
                </div>
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
                  <button className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all">
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
              <h3 className="text-xl font-semibold mb-3 text-gray-900">实时代码执行</h3>
              <p className="text-gray-600">
                基于Pyodide的浏览器Python环境，无需安装即可运行代码，学习效果立竿见影。
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