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

import React, { useState, useEffect } from 'react'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  closable?: boolean
  icon?: boolean
  className?: string
  onClose?: () => void
}

/**
 * 重构系统 - 基础Alert组件
 * 
 * 提供统一的警告/提示样式
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  closable = false,
  icon = true,
  className = '',
  onClose
}) => {
  const [visible, setVisible] = useState(true)
  
  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }
  
  if (!visible) return null
  
  const variantConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      icon: 'ℹ️'
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      icon: '✅'
    },
    warning: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      iconColor: 'text-amber-600',
      icon: '⚠️'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      icon: '❌'
    }
  }
  
  const config = variantConfig[variant]
  
  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex items-start">
        {icon && (
          <div className={`mr-3 ${config.iconColor}`}>
            <span className="text-lg">{config.icon}</span>
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h4 className={`font-medium ${config.textColor} mb-1`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
        
        {closable && (
          <button
            onClick={handleClose}
            className={`ml-3 ${config.textColor} hover:opacity-70 transition-opacity`}
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Toast 通知组件
interface ToastProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  message,
  duration = 3000,
  position = 'top-right',
  onClose
}) => {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])
  
  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }
  
  if (!visible) return null
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }
  
  const variantConfig = {
    info: {
      bgColor: 'bg-blue-600',
      icon: 'ℹ️'
    },
    success: {
      bgColor: 'bg-green-600',
      icon: '✅'
    },
    warning: {
      bgColor: 'bg-amber-600',
      icon: '⚠️'
    },
    error: {
      bgColor: 'bg-red-600',
      icon: '❌'
    }
  }
  
  const config = variantConfig[variant]
  
  return (
    <div className={`fixed z-50 ${positionClasses[position]} animate-slide-in-from-top-2`}>
      <div className={`${config.bgColor} text-white rounded-lg shadow-lg p-4 max-w-sm w-full`}>
        <div className="flex items-start">
          <div className="mr-3">
            <span className="text-lg">{config.icon}</span>
          </div>
          
          <div className="flex-1">
            {title && (
              <h4 className="font-medium mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm">
              {message}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="ml-3 text-white hover:opacity-70 transition-opacity"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast 管理器
interface ToastMessage {
  id: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  duration?: number
}

class ToastManager {
  private toasts: ToastMessage[] = []
  private listeners: ((toasts: ToastMessage[]) => void)[] = []
  
  add(toast: Omit<ToastMessage, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    this.toasts.push(newToast)
    this.notify()
    
    // 自动移除
    if ((toast.duration ?? 3000) > 0) {
      setTimeout(() => {
        this.remove(id)
      }, toast.duration ?? 3000)
    }
  }
  
  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }
  
  clear() {
    this.toasts = []
    this.notify()
  }
  
  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
  
  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }
}

export const toastManager = new ToastManager()

// Toast 容器组件
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  useEffect(() => {
    return toastManager.subscribe(setToasts)
  }, [])
  
  return (
    <>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          duration={0} // 由 manager 控制
          position="top-right"
          onClose={() => toastManager.remove(toast.id)}
        />
      ))}
    </>
  )
}

// 便捷方法
export const toast = {
  info: (message: string, title?: string, duration?: number) => 
    toastManager.add({ variant: 'info', message, title, duration }),
  success: (message: string, title?: string, duration?: number) => 
    toastManager.add({ variant: 'success', message, title, duration }),
  warning: (message: string, title?: string, duration?: number) => 
    toastManager.add({ variant: 'warning', message, title, duration }),
  error: (message: string, title?: string, duration?: number) => 
    toastManager.add({ variant: 'error', message, title, duration })
}

export default Alert 