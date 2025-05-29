import React from 'react'

interface LandingPageProps {
  onGetStarted: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        {/* AI Native Badge */}
        <div className="absolute top-8 right-8 flex items-center space-x-2">
          <div className="flex items-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Generated
          </div>
          <div className="flex items-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-semibold text-white">
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Native
          </div>
        </div>

        {/* Hero Content */}
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl">
              Pointer.ai
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                智能编程教育
              </span>
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-600 sm:text-2xl">
              零后端 · 纯前端 · AI 驱动的个性化编程学习平台
            </p>
            <p className="mt-4 text-lg text-gray-500">
              无需服务器，所有数据本地存储，支持离线学习
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button 
                onClick={onGetStarted}
                className="rounded-full bg-black px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all duration-200"
              >
                开始学习之旅
              </button>
              <button className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors">
                了解更多 <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Background Gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-200 to-pink-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AI 与人类协作的开发模式
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              本项目由 Claude 4 Sonnet AI 助手协助开发，展示了 AI Native 产品的开发新范式
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  纯前端架构
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    基于 React 19 + Vite 5 + TypeScript，所有功能运行在浏览器中，无需后端服务器
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  AI 驱动学习
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    通过 AI 评估能力、设定目标、规划路径、生成课程，实现千人千面的个性化学习体验
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-teal-500">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  隐私优先
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    所有数据存储在本地浏览器，用户自带 API Key，保护隐私同时支持离线学习
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              为每一个学习者而设计
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              无论你是零基础小白还是想要提升的开发者，我们都能为你定制学习路径
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">编程小白</h3>
              </div>
              <p className="mt-4 text-base leading-7 text-gray-600">
                从零开始，循序渐进。AI 会根据你的学习速度和理解能力，动态调整课程难度
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">转行开发者</h3>
              </div>
              <p className="mt-4 text-base leading-7 text-gray-600">
                快速补齐技能短板，聚焦实战项目。让你在最短时间内达到工作要求
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">进阶工程师</h3>
              </div>
              <p className="mt-4 text-base leading-7 text-gray-600">
                深度学习新技术栈，掌握架构设计。AI 帮你规划从初级到高级的成长路径
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              开启你的编程学习之旅
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              由 AI 与人类协作开发，为你提供最智能的学习体验
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <a href="#" className="hover:text-gray-300 transition-colors">
                能力评估 <span aria-hidden="true">→</span>
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                目标设定 <span aria-hidden="true">→</span>
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                路径规划 <span aria-hidden="true">→</span>
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                开始学习 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
        {/* Background Pattern */}
        <svg
          viewBox="0 0 1024 1024"
          className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
          aria-hidden="true"
        >
          <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.7" />
          <defs>
            <radialGradient id="gradient">
              <stop stopColor="#7c3aed" />
              <stop offset={1} stopColor="#a855f7" />
            </radialGradient>
          </defs>
        </svg>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-500">
              Powered by Claude 4 Sonnet AI · Vibe Coding 开发范式
            </p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Pointer.ai. MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 