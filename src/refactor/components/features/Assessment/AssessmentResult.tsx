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
import { Button } from '../../ui/Button/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'
import { Alert } from '../../ui/Alert/Alert'
import { Assessment, DimensionAssessment, SkillAssessment } from '../../../types/assessment'
import { DimensionChart } from './DimensionChart'
import { SkillMatrix } from './SkillMatrix'

interface AssessmentResultProps {
  assessment: Assessment
  onReassess?: () => void
  onGenerateImprovement?: () => Promise<void>
  onExport?: () => void
  loading?: boolean
}

export const AssessmentResult: React.FC<AssessmentResultProps> = ({
  assessment,
  onReassess,
  onGenerateImprovement,
  onExport,
  loading = false
}) => {
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [improvementPlan, setImprovementPlan] = useState<string[] | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'matrix' | 'recommendations'>('overview')

  // 获取评估等级
  const getLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: '专家', color: 'bg-purple-100 text-purple-800' }
    if (score >= 75) return { label: '高级', color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { label: '中级', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { label: '初级', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '入门', color: 'bg-gray-100 text-gray-800' }
  }

  // 获取技能等级颜色
  const getSkillLevelColor = (level: string): string => {
    switch (level) {
      case 'expert': return 'text-purple-600'
      case 'advanced': return 'text-green-600'
      case 'intermediate': return 'text-blue-600'
      case 'beginner': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // 获取技能等级中文
  const getSkillLevelLabel = (level: string): string => {
    switch (level) {
      case 'expert': return '专家'
      case 'advanced': return '高级'
      case 'intermediate': return '中级'
      case 'beginner': return '入门'
      default: return '未知'
    }
  }

  const handleGenerateImprovement = async () => {
    if (!onGenerateImprovement) return
    
    setGeneratingPlan(true)
    try {
      await onGenerateImprovement()
      // 这里应该从父组件获取改进计划，暂时设置模拟数据
      setImprovementPlan([
        '加强算法和数据结构练习',
        '参与开源项目提升实战经验',
        '学习系统设计相关知识',
        '提升代码审查和团队协作能力'
      ])
    } catch (error) {
      console.error('生成改进计划失败:', error)
    } finally {
      setGeneratingPlan(false)
    }
  }

  const overallLevel = getLevel(assessment.overallScore)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 总体评分卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>能力评估结果</span>
            <Badge className={overallLevel.color}>
              {overallLevel.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {assessment.overallScore}
              </div>
              <div className="text-gray-600">总体评分</div>
            </div>
            
            <div className="flex-1 ml-8">
              <ProgressBar
                value={assessment.overallScore}
                max={100}
                variant="success"
                showLabel={true}
                label="总体能力"
                className="mb-4"
              />
              <div className="text-sm text-gray-500 space-y-1">
                <div>评估时间: {new Date(assessment.createdAt).toLocaleDateString('zh-CN')}</div>
                <div>评估方式: {assessment.type === 'resume' ? '简历分析' : '问卷评估'}</div>
              </div>
            </div>
          </div>

          {/* 说明信息 */}
          <Alert variant="info">
            <div className="space-y-2">
              <p className="font-medium">评估说明：</p>
              <ul className="text-sm space-y-1">
                <li>• 评分基于您提供的信息进行AI分析得出</li>
                <li>• 各维度评分反映当前技能水平和发展潜力</li>
                <li>• 建议定期重新评估以跟踪学习进度</li>
              </ul>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* 标签页导航 */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 border-b">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="rounded-b-none border-b-0"
            >
              📊 概览
            </Button>
            <Button
              variant={activeTab === 'radar' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('radar')}
              className="rounded-b-none border-b-0"
            >
              🎯 雷达图
            </Button>
            <Button
              variant={activeTab === 'matrix' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('matrix')}
              className="rounded-b-none border-b-0"
            >
              📋 技能矩阵
            </Button>
            <Button
              variant={activeTab === 'recommendations' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('recommendations')}
              className="rounded-b-none border-b-0"
            >
              💡 建议
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 概览视图 */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {Object.entries(assessment.dimensions).map(([key, dimension]) => {
                const dimensionLevel = getLevel(dimension.score)
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{dimension.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={dimensionLevel.color}>
                          {dimensionLevel.label}
                        </Badge>
                        <span className="font-bold text-xl">{dimension.score}</span>
                      </div>
                    </div>

                    <ProgressBar
                      value={dimension.score}
                      max={100}
                      variant="success"
                      className="mb-3"
                    />

                    <p className="text-gray-600 mb-3">{dimension.summary}</p>

                    {/* 技能详情切换 */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {dimension.skills.length} 项技能
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDetails(showDetails === key ? null : key)}
                      >
                        {showDetails === key ? '收起详情' : '查看详情'}
                      </Button>
                    </div>

                    {/* 技能详情 */}
                    {showDetails === key && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dimension.skills.map((skill, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{skill.skill}</div>
                                <div className={`text-sm ${getSkillLevelColor(skill.level)}`}>
                                  {getSkillLevelLabel(skill.level)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{skill.score}</div>
                                <div className="text-xs text-gray-500">
                                  置信度: {(skill.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {dimension.recommendations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">改进建议:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {dimension.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 雷达图视图 */}
          {activeTab === 'radar' && (
            <DimensionChart 
              dimensions={assessment.dimensions}
              size={400}
              showLegend={true}
              showValues={true}
            />
          )}

          {/* 技能矩阵视图 */}
          {activeTab === 'matrix' && (
            <SkillMatrix 
              dimensions={assessment.dimensions}
              showHeatmap={true}
              groupByDimension={true}
            />
          )}

          {/* 建议视图 */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* 优势与改进 */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 优势领域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-700">💪 优势领域</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessment.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {assessment.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">暂无明显优势，建议继续努力学习</p>
                    )}
                  </CardContent>
                </Card>

                {/* 待改进领域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-700">🎯 待改进领域</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessment.weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {assessment.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-amber-500 mr-2">⚠</span>
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">各方面表现均衡，继续保持</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 发展建议 */}
              <Card>
                <CardHeader>
                  <CardTitle>💡 发展建议</CardTitle>
                </CardHeader>
                <CardContent>
                  {assessment.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {assessment.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-500 mr-3 mt-1">💡</span>
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">继续保持当前的学习状态</p>
                  )}
                </CardContent>
              </Card>

              {/* 改进计划 */}
              {improvementPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle>📋 个性化改进计划</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {improvementPlan.map((plan, index) => (
                        <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                          <span className="text-green-500 mr-3 mt-1">{index + 1}.</span>
                          <span className="text-gray-700">{plan}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardFooter className="flex justify-between">
          <div className="space-x-3">
            {onReassess && (
              <Button variant="secondary" onClick={onReassess}>
                重新评估
              </Button>
            )}
            {onExport && (
              <Button variant="secondary" onClick={onExport}>
                导出报告
              </Button>
            )}
          </div>
          
          <div className="space-x-3">
            {onGenerateImprovement && (
              <Button
                variant="primary"
                onClick={handleGenerateImprovement}
                loading={generatingPlan}
                disabled={generatingPlan}
              >
                {improvementPlan ? '重新生成改进计划' : '生成改进计划'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 