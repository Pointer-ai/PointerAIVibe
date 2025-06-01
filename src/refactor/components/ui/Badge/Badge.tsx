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

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  outline?: boolean
  rounded?: boolean
  className?: string
  onClick?: () => void
}

/**
 * 重构系统 - 基础Badge组件
 * 
 * 提供统一的徽章样式
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  outline = false,
  rounded = true,
  className = '',
  onClick,
}) => {
  const baseClasses = 'inline-flex items-center font-medium transition-colors'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  const roundedClasses = rounded ? 'rounded-full' : 'rounded'
  
  const variantClasses = {
    default: outline 
      ? 'text-gray-600 border border-gray-300 bg-transparent hover:bg-gray-50' 
      : 'text-gray-600 bg-gray-100 hover:bg-gray-200',
    primary: outline 
      ? 'text-blue-600 border border-blue-300 bg-transparent hover:bg-blue-50' 
      : 'text-blue-600 bg-blue-100 hover:bg-blue-200',
    secondary: outline 
      ? 'text-purple-600 border border-purple-300 bg-transparent hover:bg-purple-50' 
      : 'text-purple-600 bg-purple-100 hover:bg-purple-200',
    success: outline 
      ? 'text-green-600 border border-green-300 bg-transparent hover:bg-green-50' 
      : 'text-green-600 bg-green-100 hover:bg-green-200',
    warning: outline 
      ? 'text-amber-600 border border-amber-300 bg-transparent hover:bg-amber-50' 
      : 'text-amber-600 bg-amber-100 hover:bg-amber-200',
    danger: outline 
      ? 'text-red-600 border border-red-300 bg-transparent hover:bg-red-50' 
      : 'text-red-600 bg-red-100 hover:bg-red-200',
    info: outline 
      ? 'text-cyan-600 border border-cyan-300 bg-transparent hover:bg-cyan-50' 
      : 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200'
  }
  
  const clickableClasses = onClick ? 'cursor-pointer' : ''
  
  const finalClasses = [
    baseClasses,
    sizeClasses[size],
    roundedClasses,
    variantClasses[variant],
    clickableClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <span
      className={finalClasses}
      onClick={onClick}
    >
      {children}
    </span>
  )
}

// 状态徽章组件
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'error'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = ''
}) => {
  const statusConfig = {
    active: { variant: 'success' as const, text: '激活' },
    inactive: { variant: 'default' as const, text: '未激活' },
    pending: { variant: 'warning' as const, text: '等待中' },
    completed: { variant: 'success' as const, text: '已完成' },
    cancelled: { variant: 'danger' as const, text: '已取消' },
    error: { variant: 'danger' as const, text: '错误' }
  }
  
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.text}
    </Badge>
  )
}

// 数字徽章组件
interface CountBadgeProps {
  count: number
  max?: number
  showZero?: boolean
  className?: string
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  className = ''
}) => {
  if (count === 0 && !showZero) return null
  
  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <Badge variant="danger" size="sm" className={className}>
      {displayCount}
    </Badge>
  )
}

export default Badge 