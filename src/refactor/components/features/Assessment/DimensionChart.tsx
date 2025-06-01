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

import React, { useRef, useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { DimensionAssessment } from '../../../types/assessment'

interface DimensionChartProps {
  dimensions: Record<string, DimensionAssessment>
  size?: number
  showLegend?: boolean
  showValues?: boolean
}

interface RadarPoint {
  x: number
  y: number
  label: string
  value: number
  dimension: DimensionAssessment
}

export const DimensionChart: React.FC<DimensionChartProps> = ({
  dimensions,
  size = 300,
  showLegend = true,
  showValues = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<RadarPoint | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const dimensionArray = Object.entries(dimensions).map(([key, dimension]) => ({
    key,
    ...dimension
  }))

  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#F97316'  // orange-500
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = size * 0.35
    const levels = 5 // 5个等级圈

    // 清空画布
    ctx.clearRect(0, 0, size, size)
    
    // 绘制背景网格
    drawGrid(ctx, centerX, centerY, maxRadius, levels, dimensionArray.length)
    
    // 绘制数据区域
    drawDataArea(ctx, centerX, centerY, maxRadius, dimensionArray)
    
    // 绘制维度标签
    drawLabels(ctx, centerX, centerY, maxRadius, dimensionArray)

  }, [dimensions, size])

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    levels: number,
    dimensionCount: number
  ) => {
    // 绘制同心圆
    ctx.strokeStyle = '#E5E7EB' // gray-200
    ctx.lineWidth = 1

    for (let i = 1; i <= levels; i++) {
      const radius = (maxRadius / levels) * i
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // 绘制放射线
    for (let i = 0; i < dimensionCount; i++) {
      const angle = (2 * Math.PI / dimensionCount) * i - Math.PI / 2
      const x = centerX + Math.cos(angle) * maxRadius
      const y = centerY + Math.sin(angle) * maxRadius

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // 绘制等级标签
    ctx.fillStyle = '#9CA3AF' // gray-400
    ctx.font = '12px Inter, sans-serif'
    ctx.textAlign = 'center'
    
    for (let i = 1; i <= levels; i++) {
      const radius = (maxRadius / levels) * i
      const value = (100 / levels) * i
      ctx.fillText(value.toString(), centerX + radius, centerY - 5)
    }
  }

  const drawDataArea = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    dimensions: Array<DimensionAssessment & { key: string }>
  ) => {
    if (dimensions.length === 0) return

    const points: RadarPoint[] = []

    // 计算所有点的坐标
    dimensions.forEach((dimension, index) => {
      const angle = (2 * Math.PI / dimensions.length) * index - Math.PI / 2
      const radius = (dimension.score / 100) * maxRadius
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      points.push({
        x,
        y,
        label: dimension.name,
        value: dimension.score,
        dimension
      })
    })

    // 绘制填充区域
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)' // blue with opacity
    ctx.strokeStyle = '#3B82F6' // blue-500
    ctx.lineWidth = 2

    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 绘制数据点
    points.forEach((point, index) => {
      const color = colors[index % colors.length]
      
      // 点的外圈
      ctx.fillStyle = '#FFFFFF'
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // 点的内圈
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    dimensions: Array<DimensionAssessment & { key: string }>
  ) => {
    ctx.fillStyle = '#374151' // gray-700
    ctx.font = 'bold 13px Inter, sans-serif'

    dimensions.forEach((dimension, index) => {
      const angle = (2 * Math.PI / dimensions.length) * index - Math.PI / 2
      const labelRadius = maxRadius + 25
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius

      // 根据角度调整文本对齐
      if (angle > -Math.PI / 2 && angle < Math.PI / 2) {
        ctx.textAlign = 'left'
      } else {
        ctx.textAlign = 'right'
      }
      
      ctx.textBaseline = 'middle'
      ctx.fillText(dimension.name, x, y)

      // 绘制分数
      if (showValues) {
        ctx.font = '11px Inter, sans-serif'
        ctx.fillStyle = '#6B7280' // gray-500
        ctx.fillText(`${dimension.score}`, x, y + 15)
      }
    })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setMousePos({ x: event.clientX, y: event.clientY })

    // 检查是否悬停在数据点上
    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = size * 0.35

    let hoveredPoint: RadarPoint | null = null

    dimensionArray.forEach((dimension, index) => {
      const angle = (2 * Math.PI / dimensionArray.length) * index - Math.PI / 2
      const radius = (dimension.score / 100) * maxRadius
      const pointX = centerX + Math.cos(angle) * radius
      const pointY = centerY + Math.sin(angle) * radius

      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)
      if (distance <= 10) {
        hoveredPoint = {
          x: pointX,
          y: pointY,
          label: dimension.name,
          value: dimension.score,
          dimension
        }
      }
    })

    setHoveredPoint(hoveredPoint)
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  const getLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: '专家', color: 'bg-purple-100 text-purple-800' }
    if (score >= 75) return { label: '高级', color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { label: '中级', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { label: '初级', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '入门', color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📊</span>
          <span>能力维度雷达图</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* 雷达图 */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              className="cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            
            {/* 悬停提示 */}
            {hoveredPoint && (
              <div
                className="absolute z-10 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
                style={{
                  left: mousePos.x - 150,
                  top: mousePos.y - 100,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="font-semibold">{hoveredPoint.label}</div>
                <div className="text-sm">评分: {hoveredPoint.value}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {hoveredPoint.dimension.summary}
                </div>
              </div>
            )}
          </div>

          {/* 图例 */}
          {showLegend && (
            <div className="mt-6 w-full">
              <h4 className="font-semibold mb-3">维度详情</h4>
              <div className="space-y-2">
                {dimensionArray.map((dimension, index) => {
                  const level = getLevel(dimension.score)
                  const color = colors[index % colors.length]
                  
                  return (
                    <div key={dimension.key} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium">{dimension.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={level.color}>
                          {level.label}
                        </Badge>
                        <span className="font-bold">{dimension.score}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>各维度评分基于AI分析和算法评估</p>
            <p>将鼠标悬停在数据点上查看详细信息</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 