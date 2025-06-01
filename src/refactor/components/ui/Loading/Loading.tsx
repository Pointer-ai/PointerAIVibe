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

import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  text?: string
  center?: boolean
  overlay?: boolean
  className?: string
}

/**
 * 重构系统 - 基础Loading组件
 * 
 * 提供统一的加载动画样式
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  center = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  
  const spinnerElement = () => {
    switch (variant) {
      case 'spinner':
        return (
          <svg 
            className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[0]} rounded-full ${colorClasses[color]} bg-current animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`} />
        )
      
      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 ${colorClasses[color]} bg-current animate-pulse`}
                style={{ 
                  height: `${12 + (i % 2) * 8}px`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      
      default:
        return null
    }
  }
  
  const content = (
    <div className={`flex items-center space-x-2 ${className}`}>
      {spinnerElement()}
      {text && (
        <span className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {text}
        </span>
      )}
    </div>
  )
  
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          {content}
        </div>
      </div>
    )
  }
  
  if (center) {
    return (
      <div className="flex items-center justify-center w-full">
        {content}
      </div>
    )
  }
  
  return content
}

// 页面加载组件
interface PageLoadingProps {
  text?: string
  className?: string
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  text = '加载中...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-64 space-y-4 ${className}`}>
      <Loading size="lg" variant="spinner" />
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  )
}

// 按钮加载组件
interface ButtonLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  className?: string
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  size = 'sm',
  color = 'white',
  className = ''
}) => {
  return (
    <Loading 
      size={size} 
      variant="spinner" 
      color={color} 
      className={className}
    />
  )
}

// 内容加载占位符
interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = false,
  lines = 1
}) => {
  const skeletonLine = (index: number) => (
    <div
      key={index}
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  )
  
  if (lines === 1) {
    return skeletonLine(0)
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => skeletonLine(i))}
    </div>
  )
}

export default Loading 