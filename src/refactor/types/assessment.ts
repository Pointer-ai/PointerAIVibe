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

// 能力评估相关类型定义

export interface SkillAssessment {
  skill: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  score: number
  confidence: number
  evidence: string[]
  improvements: string[]
}

export interface DimensionAssessment {
  name: string
  score: number
  skills: SkillAssessment[]
  summary: string
  recommendations: string[]
}

export interface Assessment {
  id: string
  profileId: string
  type: 'resume' | 'questionnaire' | 'hybrid'
  overallScore: number
  dimensions: {
    [key: string]: DimensionAssessment
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentInput {
  type: 'resume' | 'questionnaire'
  data: {
    resumeText?: string
    questionnaire?: QuestionnaireResponse[]
  }
}

export interface QuestionnaireResponse {
  questionId: string
  answer: string | number | boolean
} 