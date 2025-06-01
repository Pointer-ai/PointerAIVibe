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

// 目标相关类型定义

export interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: number
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  targetLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateGoalRequest {
  title: string
  description: string
  category: string
  priority: number
  targetLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  category?: string
  priority?: number
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  targetLevel?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeWeeks?: number
  requiredSkills?: string[]
  outcomes?: string[]
}

export interface GoalFilter {
  status?: string[]
  category?: string[]
  priority?: number[]
  targetLevel?: string[]
}

// 目标表单数据类型
export interface GoalFormData {
  title: string
  description: string
  category: string
  priority: number
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
}

// 目标推荐类型
export interface GoalRecommendation {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedWeeks: number
  skills: string[]
  outcomes: string[]
  reasoning: string
  priority?: number
  targetLevel?: 'beginner' | 'intermediate' | 'advanced'
  requiredSkills?: string[]
  estimatedTimeWeeks?: number
  confidence?: number
} 