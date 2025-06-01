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

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  showLabel?: boolean
  labelPosition?: 'inside' | 'outside' | 'none'
  animated?: boolean
  striped?: boolean
  className?: string
  label?: string
}

/**
 * 重构系统 - 基础ProgressBar组件
 * 
 * 提供统一的进度条样式
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  labelPosition = 'outside',
  animated = false,
  striped = false,
  className = '',
  label
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500'
  }
  
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden'
  const barClasses = `h-full transition-all duration-500 ease-out rounded-full ${variantClasses[variant]}`
  
  const stripedClasses = striped ? 'bg-stripes' : ''
  const animatedClasses = animated ? 'animate-pulse' : ''
  
  const displayLabel = label || `${Math.round(percentage)}%`
  
  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{label && label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`${baseClasses} ${sizeClasses[size]} relative`}>
        <div
          className={`${barClasses} ${stripedClasses} ${animatedClasses}`}
          style={{ width: `${percentage}%` }}
        >
          {showLabel && labelPosition === 'inside' && size !== 'sm' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
              {displayLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 技能进度条组件
interface SkillProgressProps {
  skillName: string
  currentLevel: number
  targetLevel: number
  maxLevel?: number
  className?: string
}

export const SkillProgress: React.FC<SkillProgressProps> = ({
  skillName,
  currentLevel,
  targetLevel,
  maxLevel = 100,
  className = ''
}) => {
  const currentPercentage = (currentLevel / maxLevel) * 100
  const targetPercentage = (targetLevel / maxLevel) * 100
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{skillName}</span>
        <span className="text-sm text-gray-500">
          {currentLevel}/{targetLevel}
        </span>
      </div>
      
      <div className="relative">
        {/* 背景条 */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* 目标进度（浅色） */}
          <div
            className="h-full bg-blue-200 transition-all duration-500 ease-out"
            style={{ width: `${targetPercentage}%` }}
          />
          {/* 当前进度（深色） */}
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out absolute top-0 left-0"
            style={{ width: `${currentPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// 多步骤进度条
interface StepProgressProps {
  steps: string[]
  currentStep: number
  completedSteps?: number[]
  className?: string
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  completedSteps.includes(index)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {completedSteps.includes(index) ? '✓' : index + 1}
              </div>
              <span className={`text-xs text-center max-w-16 ${
                index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2">
                <div
                  className={`h-full transition-colors ${
                    completedSteps.includes(index) || currentStep > index
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default ProgressBar 