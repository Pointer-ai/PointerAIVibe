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

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  maskClosable?: boolean
  showHeader?: boolean
  showFooter?: boolean
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * 重构系统 - 基础Modal组件
 * 
 * 提供统一的对话框样式
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closable = true,
  maskClosable = true,
  showHeader = true,
  showFooter = false,
  className = '',
  children,
  footer
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closable, onClose])
  
  // 处理点击遮罩关闭
  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-none w-full h-full'
  }
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      onClick={handleMaskClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${size === 'full' ? '' : 'max-h-[90vh]'} overflow-hidden animate-zoom-in-95 ${className}`}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={`${size === 'full' ? 'flex-1' : ''} ${showHeader || showFooter ? 'p-6' : 'p-6'} ${size === 'full' ? 'overflow-auto' : 'overflow-y-auto'}`}>
          {children}
        </div>
        
        {/* Footer */}
        {showFooter && footer && (
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
  
  return createPortal(modalContent, document.body)
}

// 确认对话框
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  content,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }
  
  const variantConfig = {
    danger: {
      color: 'bg-red-600 hover:bg-red-700 text-white',
      icon: '⚠️'
    },
    warning: {
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: '⚠️'
    },
    info: {
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'ℹ️'
    }
  }
  
  const config = variantConfig[variant]
  
  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={handleConfirm}
        className={`px-4 py-2 rounded-lg transition-colors ${config.color}`}
      >
        {confirmText}
      </button>
    </>
  )
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showFooter={true}
      footer={footer}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">
          {config.icon}
        </div>
        <div className="text-gray-700">
          {content}
        </div>
      </div>
    </Modal>
  )
}

// 表单对话框
interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  title: string
  children: React.ReactNode
  submitText?: string
  cancelText?: string
  loading?: boolean
  submitDisabled?: boolean
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = '提交',
  cancelText = '取消',
  loading = false,
  submitDisabled = false
}) => {
  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={onSubmit}
        disabled={loading || submitDisabled}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        )}
        <span>{submitText}</span>
      </button>
    </>
  )
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      showFooter={true}
      footer={footer}
      maskClosable={!loading}
      closable={!loading}
    >
      {children}
    </Modal>
  )
}

// 图片预览对话框
interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  src,
  alt = '图片预览'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showHeader={false}
      className="bg-black bg-opacity-90"
    >
      <div className="flex items-center justify-center h-full">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </Modal>
  )
}

export default Modal 