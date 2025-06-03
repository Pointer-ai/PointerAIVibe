/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react'
import { Language, getCurrentLanguage, setLanguage } from '../../utils/i18n'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
  onLanguageChange?: (lang: Language) => void
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '',
  compact = false,
  onLanguageChange
}) => {
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage())
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (lang: Language) => {
    if (lang === currentLang) return
    
    setLanguage(lang)
    setCurrentLang(lang)
    setIsOpen(false)
    onLanguageChange?.(lang)
    
    // 延迟刷新页面，让动画完成
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  const languages = [
    {
      code: 'zh' as Language,
      name: '中文',
      flag: '🇨🇳',
      shortName: '中'
    },
    {
      code: 'en' as Language,
      name: 'English',
      flag: '🇺🇸',
      shortName: 'EN'
    }
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLang)!

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:border-gray-300/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/25"
        >
          <span className="text-sm">{currentLanguage.flag}</span>
          <span className="text-sm font-medium">{currentLanguage.shortName}</span>
          <svg 
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* 下拉菜单 */}
            <div className="absolute top-full mt-2 right-0 z-50 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition-colors duration-200 ${
                    lang.code === currentLang 
                      ? 'bg-blue-50/50 text-blue-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {lang.code === currentLang && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:border-gray-300/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-200/25 hover:scale-105"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{currentLanguage.name}</span>
          <span className="text-xs text-gray-500">Language</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute top-full mt-3 right-0 z-50 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 min-w-[200px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors duration-200 ${
                  lang.code === currentLang 
                    ? 'bg-blue-50/50 text-blue-600' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-semibold">{lang.name}</span>
                  <span className="text-xs text-gray-500">
                    {lang.code === 'zh' ? '简体中文' : 'English (US)'}
                  </span>
                </div>
                {lang.code === currentLang && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher 