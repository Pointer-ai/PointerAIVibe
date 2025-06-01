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
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../ui/Card/Card'
import { Input, FormField } from '../../ui/Input/Input'
import { Badge } from '../../ui/Badge/Badge'
import { Modal } from '../../ui/Modal/Modal'
import { GoalFormData } from '../../../types/goal'

export interface GoalFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: GoalFormData) => Promise<void>
  initialData?: Partial<GoalFormData>
  loading?: boolean
  title?: string
}

const GOAL_CATEGORIES = [
  { id: 'frontend', name: '前端开发', icon: '🎨' },
  { id: 'backend', name: '后端开发', icon: '⚙️' },
  { id: 'fullstack', name: '全栈开发', icon: '🚀' },
  { id: 'automation', name: '办公自动化', icon: '🤖' },
  { id: 'ai', name: 'AI与机器学习', icon: '🧠' },
  { id: 'mobile', name: '移动开发', icon: '📱' },
  { id: 'game', name: '游戏开发', icon: '🎮' },
  { id: 'data', name: '数据分析', icon: '📊' },
  { id: 'custom', name: '自定义', icon: '✨' }
]

const TARGET_LEVELS = [
  { id: 'beginner', name: '初级', description: '新手入门，基础学习' },
  { id: 'intermediate', name: '中级', description: '有一定基础，深入学习' },
  { id: 'advanced', name: '高级', description: '有较强基础，专业提升' },
  { id: 'expert', name: '专家', description: '深度专业，引领创新' }
]

export const GoalForm: React.FC<GoalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title = '创建目标'
}) => {
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'frontend',
    priority: 3,
    targetLevel: 'intermediate',
    estimatedTimeWeeks: 8,
    requiredSkills: [],
    outcomes: []
  })

  const [newSkill, setNewSkill] = useState('')
  const [newOutcome, setNewOutcome] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }))
    } else {
      // 重置为默认值
      setFormData({
        title: '',
        description: '',
        category: 'frontend',
        priority: 3,
        targetLevel: 'intermediate',
        estimatedTimeWeeks: 8,
        requiredSkills: [],
        outcomes: []
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '目标标题不能为空'
    } else if (formData.title.length > 50) {
      newErrors.title = '目标标题不能超过50个字符'
    }

    if (!formData.description.trim()) {
      newErrors.description = '目标描述不能为空'
    } else if (formData.description.length < 10) {
      newErrors.description = '目标描述至少10个字符'
    } else if (formData.description.length > 500) {
      newErrors.description = '目标描述不能超过500个字符'
    }

    if (formData.priority < 1 || formData.priority > 5) {
      newErrors.priority = '优先级必须在1-5之间'
    }

    if (formData.estimatedTimeWeeks < 1 || formData.estimatedTimeWeeks > 52) {
      newErrors.estimatedTimeWeeks = '预计时间必须在1-52周之间'
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.requiredSkills = '至少需要添加一个技能要求'
    }

    if (formData.outcomes.length === 0) {
      newErrors.outcomes = '至少需要添加一个学习成果'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Goal form submission failed:', error)
    }
  }

  // 添加技能
  const addSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  // 移除技能
  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }))
  }

  // 添加成果
  const addOutcome = () => {
    if (newOutcome.trim() && !formData.outcomes.includes(newOutcome.trim())) {
      setFormData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, newOutcome.trim()]
      }))
      setNewOutcome('')
    }
  }

  // 移除成果
  const removeOutcome = (outcome: string) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(o => o !== outcome)
    }))
  }

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息 */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField 
            label="目标标题" 
            required 
            error={errors.title}
          >
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例如：掌握React前端开发"
              error={!!errors.title}
            />
          </FormField>

          <FormField label="目标类别" required>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {GOAL_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField 
          label="目标描述" 
          required 
          error={errors.description}
        >
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="详细描述您想要达到的学习目标..."
            rows={4}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.description.length}/500 字符
          </div>
        </FormField>

        {/* 级别和时间设置 */}
        <div className="grid md:grid-cols-3 gap-4">
          <FormField label="目标级别" required>
            <select
              value={formData.targetLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, targetLevel: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TARGET_LEVELS.map(level => (
                <option key={level.id} value={level.id} title={level.description}>
                  {level.name} - {level.description}
                </option>
              ))}
            </select>
          </FormField>

          <FormField 
            label="优先级" 
            required
            error={errors.priority}
          >
            <input
              type="number"
              min="1"
              max="5"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="text-xs text-gray-500 mt-1">1=最低, 5=最高</div>
          </FormField>

          <FormField 
            label="预计时间(周)" 
            required
            error={errors.estimatedTimeWeeks}
          >
            <input
              type="number"
              min="1"
              max="52"
              value={formData.estimatedTimeWeeks}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedTimeWeeks: parseInt(e.target.value) || 1 }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.estimatedTimeWeeks ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </FormField>
        </div>

        {/* 技能要求 */}
        <FormField 
          label="技能要求" 
          required
          error={errors.requiredSkills}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="添加需要掌握的技能"
                onKeyDown={(e) => handleKeyPress(e, addSkill)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button type="button" onClick={addSkill} disabled={!newSkill.trim()}>
                添加
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.requiredSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => removeSkill(skill)}
                >
                  {skill} ×
                </Badge>
              ))}
            </div>
            
            {formData.requiredSkills.length === 0 && (
              <div className="text-sm text-gray-500">
                点击添加技能要求，例如：JavaScript、React、HTML/CSS等
              </div>
            )}
          </div>
        </FormField>

        {/* 学习成果 */}
        <FormField 
          label="预期成果" 
          required
          error={errors.outcomes}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="添加预期的学习成果"
                onKeyDown={(e) => handleKeyPress(e, addOutcome)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button type="button" onClick={addOutcome} disabled={!newOutcome.trim()}>
                添加
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.outcomes.map((outcome, index) => (
                <Badge
                  key={index}
                  variant="primary"
                  className="cursor-pointer hover:bg-blue-200"
                  onClick={() => removeOutcome(outcome)}
                >
                  {outcome} ×
                </Badge>
              ))}
            </div>
            
            {formData.outcomes.length === 0 && (
              <div className="text-sm text-gray-500">
                添加预期成果，例如：能独立开发项目、掌握核心概念等
              </div>
            )}
          </div>
        </FormField>

        {/* 表单操作 */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {initialData ? '更新目标' : '创建目标'}
          </Button>
        </div>
      </form>
    </Modal>
  )
} 