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

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { Button } from '../../ui/Button/Button'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'
import { DimensionAssessment, SkillAssessment } from '../../../types/assessment'

interface SkillMatrixProps {
  dimensions: Record<string, DimensionAssessment>
  showHeatmap?: boolean
  groupByDimension?: boolean
}

interface SkillWithDimension extends SkillAssessment {
  dimensionKey: string
  dimensionName: string
}

type ViewMode = 'table' | 'heatmap' | 'grouped'

export const SkillMatrix: React.FC<SkillMatrixProps> = ({
  dimensions,
  showHeatmap = true,
  groupByDimension = true
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortBy, setSortBy] = useState<'score' | 'level' | 'name'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  // 收集所有技能
  const allSkills: SkillWithDimension[] = []
  Object.entries(dimensions).forEach(([dimKey, dimension]) => {
    dimension.skills.forEach(skill => {
      allSkills.push({
        ...skill,
        dimensionKey: dimKey,
        dimensionName: dimension.name
      })
    })
  })

  // 排序技能
  const sortedSkills = [...allSkills].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'score':
        comparison = a.score - b.score
        break
      case 'level':
        const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 }
        comparison = (levelOrder[a.level as keyof typeof levelOrder] || 0) - 
                    (levelOrder[b.level as keyof typeof levelOrder] || 0)
        break
      case 'name':
        comparison = a.skill.localeCompare(b.skill, 'zh-CN')
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 过滤技能
  const filteredSkills = sortedSkills.filter(skill => {
    if (filterLevel === 'all') return true
    return skill.level === filterLevel
  })

  // 获取技能等级信息
  const getSkillLevelInfo = (level: string): { label: string; color: string; bgColor: string } => {
    switch (level) {
      case 'expert':
        return { 
          label: '专家', 
          color: 'text-purple-700',
          bgColor: 'bg-purple-100'
        }
      case 'advanced':
        return { 
          label: '高级', 
          color: 'text-green-700',
          bgColor: 'bg-green-100'
        }
      case 'intermediate':
        return { 
          label: '中级', 
          color: 'text-blue-700',
          bgColor: 'bg-blue-100'
        }
      case 'beginner':
        return { 
          label: '入门', 
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        }
      default:
        return { 
          label: '未知', 
          color: 'text-gray-700',
          bgColor: 'bg-gray-100'
        }
    }
  }

  // 获取热力图颜色
  const getHeatmapColor = (score: number): string => {
    if (score >= 90) return 'bg-purple-500'
    if (score >= 75) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    if (score >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getHeatmapOpacity = (score: number): string => {
    return `opacity-${Math.max(20, Math.min(100, Math.round(score)))}` 
  }

  // 按维度分组的技能
  const skillsByDimension = Object.entries(dimensions).map(([key, dimension]) => ({
    key,
    name: dimension.name,
    score: dimension.score,
    skills: dimension.skills
  }))

  // 统计信息
  const stats = {
    total: allSkills.length,
    expert: allSkills.filter(s => s.level === 'expert').length,
    advanced: allSkills.filter(s => s.level === 'advanced').length,
    intermediate: allSkills.filter(s => s.level === 'intermediate').length,
    beginner: allSkills.filter(s => s.level === 'beginner').length,
    averageScore: Math.round(allSkills.reduce((sum, s) => sum + s.score, 0) / allSkills.length)
  }

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('name')
                    setSortOrder('asc')
                  }
                }}
              >
                技能名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </th>
            <th className="text-left p-3 font-semibold">所属维度</th>
            <th className="text-left p-3 font-semibold">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (sortBy === 'score') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('score')
                    setSortOrder('desc')
                  }
                }}
              >
                评分 {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </th>
            <th className="text-left p-3 font-semibold">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (sortBy === 'level') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('level')
                    setSortOrder('desc')
                  }
                }}
              >
                等级 {sortBy === 'level' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </th>
            <th className="text-left p-3 font-semibold">进度</th>
          </tr>
        </thead>
        <tbody>
          {filteredSkills.map((skill, index) => {
            const levelInfo = getSkillLevelInfo(skill.level)
            return (
              <tr key={`${skill.dimensionKey}-${index}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{skill.skill}</td>
                <td className="p-3">
                  <Badge variant="secondary">{skill.dimensionName}</Badge>
                </td>
                <td className="p-3">
                  <span className="font-bold text-lg">{skill.score}</span>
                </td>
                <td className="p-3">
                  <Badge className={`${levelInfo.bgColor} ${levelInfo.color}`}>
                    {levelInfo.label}
                  </Badge>
                </td>
                <td className="p-3">
                  <ProgressBar
                    value={skill.score}
                    max={100}
                    variant="success"
                    size="sm"
                    className="w-24"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderHeatmapView = () => {
    // 按维度组织技能进行热力图展示
    const maxSkillsPerRow = 8
    
    return (
      <div className="space-y-6">
        {skillsByDimension.map(dimension => (
          <div key={dimension.key}>
            <h4 className="font-semibold mb-3 flex items-center justify-between">
              <span>{dimension.name}</span>
              <Badge variant="primary">{dimension.score}分</Badge>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {dimension.skills.map((skill, index) => {
                const levelInfo = getSkillLevelInfo(skill.level)
                return (
                  <div
                    key={index}
                    className={`relative p-4 rounded-lg border-2 ${levelInfo.bgColor} transition-all hover:shadow-md`}
                  >
                    <div className="text-sm font-medium mb-1">{skill.skill}</div>
                    <div className="flex items-center justify-between">
                      <Badge size="sm" className={`${levelInfo.bgColor} ${levelInfo.color}`}>
                        {levelInfo.label}
                      </Badge>
                      <span className="font-bold">{skill.score}</span>
                    </div>
                    
                    {/* 热力图指示器 */}
                    <div className="absolute top-1 right-1">
                      <div 
                        className={`w-3 h-3 rounded-full ${getHeatmapColor(skill.score)}`}
                        title={`评分: ${skill.score}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderGroupedView = () => (
    <div className="space-y-6">
      {skillsByDimension.map(dimension => (
        <Card key={dimension.key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{dimension.name}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="primary">{dimension.skills.length} 项技能</Badge>
                <Badge variant="success">{dimension.score} 分</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dimension.skills
                .sort((a, b) => b.score - a.score)
                .map((skill, index) => {
                  const levelInfo = getSkillLevelInfo(skill.level)
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{skill.skill}</span>
                        <Badge size="sm" className={`${levelInfo.bgColor} ${levelInfo.color}`}>
                          {levelInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <ProgressBar
                          value={skill.score}
                          max={100}
                          variant="success"
                          size="sm"
                          className="w-20"
                        />
                        <span className="font-bold w-8 text-right">{skill.score}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🎯</span>
            <span>技能评估矩阵</span>
          </div>
          
          {/* 视图切换 */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              表格视图
            </Button>
            <Button
              variant={viewMode === 'heatmap' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('heatmap')}
            >
              热力图
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              分组视图
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总技能数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.expert}</div>
            <div className="text-sm text-gray-600">专家级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.advanced}</div>
            <div className="text-sm text-gray-600">高级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.intermediate}</div>
            <div className="text-sm text-gray-600">中级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.beginner}</div>
            <div className="text-sm text-gray-600">入门</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.averageScore}</div>
            <div className="text-sm text-gray-600">平均分</div>
          </div>
        </div>

        {/* 过滤器 (仅表格视图显示) */}
        {viewMode === 'table' && (
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-medium">等级过滤:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">全部等级</option>
              <option value="expert">专家</option>
              <option value="advanced">高级</option>
              <option value="intermediate">中级</option>
              <option value="beginner">入门</option>
            </select>
            
            <span className="text-sm text-gray-500">
              显示 {filteredSkills.length} / {allSkills.length} 项技能
            </span>
          </div>
        )}

        {/* 渲染对应视图 */}
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'heatmap' && renderHeatmapView()}
        {viewMode === 'grouped' && renderGroupedView()}

        {/* 图例说明 */}
        <div className="mt-6 pt-4 border-t">
          <h5 className="font-medium mb-2">评分说明：</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>90-100: 专家级</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>75-89: 高级</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>60-74: 中级</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>40-59: 入门</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 