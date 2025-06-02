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

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface SuccessToastProps {
  isOpen: boolean
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

const getToastConfig = (type: string) => {
  switch (type) {
    case 'success':
      return {
        icon: '✅',
        bg: 'bg-green-500',
        bgLight: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800'
      }
    case 'error':
      return {
        icon: '❌',
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800'
      }
    case 'warning':
      return {
        icon: '⚠️',
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800'
      }
    case 'info':
    default:
      return {
        icon: 'ℹ️',
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      }
  }
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  isOpen,
  title,
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  const config = getToastConfig(type)

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[10000] animate-slide-in-from-right">
      <div className={`min-w-80 max-w-md ${config.bgLight} border ${config.border} rounded-2xl shadow-2xl backdrop-blur-xl border-white/20 overflow-hidden`}>
        {/* 进度条 */}
        {duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${config.bg} transition-all ease-linear`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className="text-2xl mt-0.5">
              {config.icon}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`text-sm font-semibold ${config.text} mb-1`}>
                  {title}
                </h4>
              )}
              <p className={`text-sm ${config.text}`}>
                {message}
              </p>
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Toast Hook 用于管理多个toast
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    props: Omit<SuccessToastProps, 'isOpen' | 'onClose'>
  }>>([])

  const showToast = (props: Omit<SuccessToastProps, 'isOpen' | 'onClose'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, props }])
  }

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message: string, title?: string) => {
    showToast({ type: 'success', message, title })
  }

  const showError = (message: string, title?: string) => {
    showToast({ type: 'error', message, title })
  }

  const showWarning = (message: string, title?: string) => {
    showToast({ type: 'warning', message, title })
  }

  const showInfo = (message: string, title?: string) => {
    showToast({ type: 'info', message, title })
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[10000] space-y-2">
      {toasts.map(({ id, props }) => (
        <SuccessToast
          key={id}
          isOpen={true}
          onClose={() => hideToast(id)}
          {...props}
        />
      ))}
    </div>
  )

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer
  }
}

// 添加CSS动画到全局样式
export const toastStyles = `
  @keyframes slide-in-from-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
  
  .animate-slide-in-from-right {
    animation: slide-in-from-right 0.3s ease-out;
  }
` 