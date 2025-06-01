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

import React, { forwardRef } from 'react'

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  error?: boolean
  success?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  id?: string
  name?: string
  autoComplete?: string
  autoFocus?: boolean
}

/**
 * 重构系统 - 基础Input组件
 * 
 * 提供统一的输入框样式和行为
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  required = false,
  readOnly = false,
  error = false,
  success = false,
  size = 'md',
  className = '',
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  id,
  name,
  autoComplete,
  autoFocus = false,
}, ref) => {
  const baseClasses = 'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  
  const stateClasses = () => {
    if (error) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
    }
    if (success) {
      return 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50'
    }
    if (disabled) {
      return 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
    }
    if (readOnly) {
      return 'border-gray-200 bg-gray-50 text-gray-700'
    }
    return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white'
  }
  
  const finalClasses = [
    baseClasses,
    sizeClasses[size],
    stateClasses(),
    className
  ].filter(Boolean).join(' ')

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      className={finalClasses}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      id={id}
      name={name}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
    />
  )
})

Input.displayName = 'Input'

// Label 组件
interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = ''
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

// FormField 组合组件
interface FormFieldProps {
  label?: string
  error?: string
  success?: string
  helpText?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  success,
  helpText,
  required = false,
  className = '',
  children
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 flex items-center">
          <span className="mr-1">✅</span>
          {success}
        </p>
      )}
      {helpText && !error && !success && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}

export default Input 