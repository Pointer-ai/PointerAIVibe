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

// 学习路径相关类型定义

export interface PathNode {
  id: string
  title: string
  description: string
  type: 'concept' | 'practice' | 'project' | 'assessment'
  estimatedHours: number
  prerequisites: string[]
  resources: Resource[]
  completed: boolean
  completedAt?: Date
}

export interface Resource {
  id: string
  title: string
  type: 'article' | 'video' | 'exercise' | 'documentation'
  url: string
  description?: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  goalId: string
  nodes: PathNode[]
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  progress: number
  estimatedTotalHours: number
  createdAt: Date
  updatedAt: Date
}

export interface CreatePathRequest {
  title: string
  description: string
  goalId: string
  nodes: Omit<PathNode, 'id' | 'completed' | 'completedAt'>[]
}

export interface UpdatePathRequest {
  title?: string
  description?: string
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  nodes?: PathNode[]
} 