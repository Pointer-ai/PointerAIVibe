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
import { Button } from '../components/ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card'
import { Badge } from '../components/ui/Badge/Badge'
import { Alert } from '../components/ui/Alert/Alert'
import { CourseContentViewer } from '../components/features/CourseContent'
import { sampleCourseContents, getCourseContentById } from '../data/sampleCourseContent'
import { CourseContent } from '../types/courseContent'

interface CourseContentPageProps {
  onNavigate: (view: string) => void
}

/**
 * 课程内容管理页面
 * 
 * 功能：
 * - 展示课程内容列表
 * - 课程内容详细查看
 * - 课程内容学习进度跟踪
 * - 样例课程内容演示
 */
export const CourseContentPage: React.FC<CourseContentPageProps> = ({ onNavigate }) => {
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'viewer'>('list')

  const selectedContent = selectedContentId ? getCourseContentById(selectedContentId) : null

  const getDifficultyBadge = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return <Badge variant="success">初级</Badge>
      case 2:
        return <Badge variant="info">入门</Badge>
      case 3:
        return <Badge variant="warning">中级</Badge>
      case 4:
        return <Badge variant="danger">高级</Badge>
      case 5:
        return <Badge variant="danger">专家</Badge>
      default:
        return <Badge variant="default">未知</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="default">未开始</Badge>
      case 'in_progress':
        return <Badge variant="info">进行中</Badge>
      case 'completed':
        return <Badge variant="success">已完成</Badge>
      default:
        return <Badge variant="default">未知</Badge>
    }
  }

  const handleContentSelect = (contentId: string) => {
    setSelectedContentId(contentId)
    setViewMode('viewer')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedContentId(null)
  }

  const handleProgressUpdate = (contentId: string, progress: any) => {
    console.log('Progress updated for content:', contentId, progress)
    // 这里可以调用API更新进度
  }

  const handleContentComplete = (contentId: string) => {
    console.log('Content completed:', contentId)
    // 这里可以调用API标记完成状态
  }

  const renderContentList = () => {
    return (
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 课程内容管理</h1>
            <p className="text-gray-600 mt-1">管理和查看学习路径中的课程内容</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => onNavigate('dashboard')}
          >
            返回主页
          </Button>
        </div>

        {/* 功能说明 */}
        <Alert variant="info">
          <div className="space-y-2">
            <p><strong>课程内容模块特点：</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>讲解部分</strong>：包含Markdown内容、代码示例、关键概念解释</li>
              <li><strong>练习部分</strong>：支持编程题、选择题、填空题等多种练习类型</li>
              <li><strong>时间控制</strong>：每个课程内容阅读时长控制在15分钟以内</li>
              <li><strong>语言默认</strong>：默认使用Python进行讲解，支持多种编程语言</li>
              <li><strong>编程集成</strong>：集成coderunner框架，支持代码执行和评测</li>
            </ul>
          </div>
        </Alert>

        {/* 课程内容统计 */}
        <Card>
          <CardHeader>
            <CardTitle>📊 内容统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{sampleCourseContents.length}</div>
                <div className="text-sm text-gray-600">总课程数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {sampleCourseContents.filter(c => c.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">已完成</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-amber-600">
                  {sampleCourseContents.filter(c => c.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">进行中</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {sampleCourseContents.reduce((sum, c) => sum + c.metadata.estimatedReadingTime, 0)}
                </div>
                <div className="text-sm text-gray-600">总学时(分钟)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 课程内容列表 */}
        <Card>
          <CardHeader>
            <CardTitle>📖 课程内容列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleCourseContents.map((content) => (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
                          {getStatusBadge(content.status)}
                          {getDifficultyBadge(content.metadata.difficulty)}
                        </div>
                        <p className="text-gray-600 mb-3">{content.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">预计时间:</span>
                            <span className="ml-1 font-medium">{content.metadata.estimatedReadingTime}分钟</span>
                          </div>
                          <div>
                            <span className="text-gray-500">编程语言:</span>
                            <span className="ml-1 font-medium">{content.metadata.language.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">练习数量:</span>
                            <span className="ml-1 font-medium">{content.practice.exercises.length}题</span>
                          </div>
                          <div>
                            <span className="text-gray-500">已用时间:</span>
                            <span className="ml-1 font-medium">{content.progress.timeSpent}分钟</span>
                          </div>
                        </div>

                        {/* 技能标签 */}
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {content.metadata.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                            {content.metadata.skills.length > 3 && (
                              <Badge variant="default">+{content.metadata.skills.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleContentSelect(content.id)}
                        >
                          学习内容
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            console.log('Viewing content details:', content.id)
                          }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 技术说明 */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 技术实现说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">数据结构设计</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li><strong>CourseContent</strong>：主要课程内容接口，包含讲解和练习两个部分</li>
                  <li><strong>ExplanationSection</strong>：讲解部分，支持Markdown、代码示例、图表等</li>
                  <li><strong>PracticeSection</strong>：练习部分，支持多种练习类型和评估配置</li>
                  <li><strong>Exercise</strong>：练习题接口，支持编程题、选择题、填空题等</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">组件架构</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li><strong>CourseContentViewer</strong>：课程内容查看器，支持讲解、练习、总结三种模式</li>
                  <li><strong>CourseContentPage</strong>：课程内容管理页面，展示内容列表和统计</li>
                  <li><strong>样例数据</strong>：Python变量和列表基础的完整课程内容样例</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">集成特性</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li><strong>代码执行</strong>：基于现有coderunner框架，支持代码运行和测试</li>
                  <li><strong>进度跟踪</strong>：实时跟踪学习进度和练习完成情况</li>
                  <li><strong>多语言支持</strong>：默认Python，支持扩展其他编程语言</li>
                  <li><strong>响应式设计</strong>：适配不同屏幕尺寸的学习体验</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-500">未找到指定的课程内容</p>
          <Button variant="secondary" className="mt-4" onClick={handleBackToList}>
            返回列表
          </Button>
        </div>
      )
    }

    return (
      <div>
        {/* 返回按钮 */}
        <div className="mb-4">
          <Button variant="secondary" onClick={handleBackToList}>
            ← 返回课程列表
          </Button>
        </div>

        {/* 课程内容查看器 */}
        <CourseContentViewer
          content={selectedContent}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleContentComplete}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {viewMode === 'list' ? renderContentList() : renderContentViewer()}
      </div>
    </div>
  )
}

export default CourseContentPage 