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

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'shadow' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
  onClick?: () => void
}

/**
 * 重构系统 - 基础Card组件
 * 
 * 提供统一的卡片容器样式
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  hover = false,
  className = '',
  onClick,
}) => {
  const baseClasses = 'bg-white rounded-lg transition-all duration-200'
  
  const variantClasses = {
    default: 'shadow-sm border border-gray-100',
    bordered: 'border border-gray-200',
    shadow: 'shadow-md border border-gray-100',
    outlined: 'border-2 border-gray-200'
  }
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:border-gray-200 cursor-pointer' : ''
  
  const finalClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    hoverClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={finalClasses}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Card子组件 - Header
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

// Card子组件 - Title
interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

// Card子组件 - Content
interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`text-gray-600 ${className}`}>
      {children}
    </div>
  )
}

// Card子组件 - Footer
interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export default Card 