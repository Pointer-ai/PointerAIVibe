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
import { createPortal } from 'react-dom'

export interface DeleteConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  itemName?: string
  itemType?: 'goal' | 'path' | 'unit' | 'profile' | 'general'
  cascadeMessage?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  dangerLevel?: 'low' | 'medium' | 'high'
}

const getItemTypeInfo = (itemType: string) => {
  switch (itemType) {
    case 'goal':
      return {
        icon: '🎯',
        name: '学习目标',
        color: 'blue'
      }
    case 'path':
      return {
        icon: '🛤️',
        name: '学习路径',
        color: 'green'
      }
    case 'unit':
      return {
        icon: '📚',
        name: '课程单元',
        color: 'orange'
      }
    case 'profile':
      return {
        icon: '👤',
        name: '用户档案',
        color: 'purple'
      }
    default:
      return {
        icon: '🗑️',
        name: '项目',
        color: 'gray'
      }
  }
}

const getDangerColors = (dangerLevel: string) => {
  switch (dangerLevel) {
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
        icon: '⚠️'
      }
    case 'medium':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700',
        icon: '⚡'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        button: 'bg-gray-600 hover:bg-gray-700',
        icon: 'ℹ️'
      }
  }
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  itemName,
  itemType = 'general',
  cascadeMessage,
  onConfirm,
  onCancel,
  isLoading = false,
  dangerLevel = 'medium'
}) => {
  if (!isOpen) return null

  const itemInfo = getItemTypeInfo(itemType)
  const dangerColors = getDangerColors(dangerLevel)

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onCancel()
    }
  }

  // 阻止点击对话框外部关闭（安全考虑）
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] animate-fade-in">
      <div className="absolute inset-0 flex items-center justify-center min-h-screen p-4">
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 animate-zoom-in-95 mx-auto my-auto relative"
          onClick={handleBackdropClick}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl bg-gradient-to-br from-red-50 to-orange-50 rounded-full border-2 border-red-100/50 shadow-lg">
              {itemInfo.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">
              {message}
              {itemName && (
                <>
                  <br />
                  <span className="font-medium text-gray-900 mt-1 inline-block">"{itemName}"</span>
                </>
              )}
            </p>
          </div>

          {/* 级联删除警告 */}
          {cascadeMessage && (
            <div className={`mb-6 p-4 ${dangerColors.bg} border ${dangerColors.border} rounded-2xl`}>
              <div className="flex items-start space-x-3">
                <span className="text-xl">{dangerColors.icon}</span>
                <div>
                  <h4 className={`text-sm font-medium ${dangerColors.text}`}>
                    {dangerLevel === 'high' ? '高危操作' : dangerLevel === 'medium' ? '注意事项' : '提示信息'}
                  </h4>
                  <p className={`text-sm ${dangerColors.text} mt-1`}>
                    {cascadeMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 ${dangerColors.button} text-white rounded-2xl font-medium active:scale-[0.95] transition-all duration-150 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </button>
          </div>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              此操作无法撤销，请谨慎操作
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// CSS 动画类（如果需要添加到全局CSS中）
export const deleteDialogStyles = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes zoom-in-95 {
    from { 
      opacity: 0; 
      transform: scale(0.95) translate(-50%, -50%); 
    }
    to { 
      opacity: 1; 
      transform: scale(1) translate(-50%, -50%); 
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .animate-zoom-in-95 {
    animation: zoom-in-95 0.2s ease-out;
  }
` 