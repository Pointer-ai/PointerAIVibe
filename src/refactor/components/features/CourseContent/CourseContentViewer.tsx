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
import { Button } from '../../ui/Button/Button'
import { Badge } from '../../ui/Badge/Badge'
import { ProgressBar } from '../../ui/ProgressBar/ProgressBar'
import { Alert } from '../../ui/Alert/Alert'
import { CourseContent, CodeExample, Exercise } from '../../../types/courseContent'

interface CourseContentViewerProps {
  content: CourseContent
  onProgressUpdate?: (contentId: string, progress: any) => void
  onComplete?: (contentId: string) => void
}

type ViewMode = 'explanation' | 'practice' | 'summary'

/**
 * 课程内容查看器组件
 * 
 * 功能：
 * - 展示讲解部分（markdown内容、代码示例）
 * - 展示练习部分（编程题、选择题等）
 * - 进度跟踪和状态管理
 * - 学习目标和关键概念展示
 */
export const CourseContentViewer: React.FC<CourseContentViewerProps> = ({
  content,
  onProgressUpdate,
  onComplete
}) => {
  const [currentMode, setCurrentMode] = useState<ViewMode>('explanation')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [exerciseAttempts, setExerciseAttempts] = useState<{ [key: string]: number }>({})

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

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode)
    if (mode === 'practice') {
      setCurrentExerciseIndex(0)
    }
  }

  const renderMarkdownContent = (markdown: string) => {
    // 简单的markdown渲染（实际项目中可以使用react-markdown）
    return (
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
          {markdown}
        </pre>
      </div>
    )
  }

  const renderCodeExample = (example: CodeExample) => {
    return (
      <Card key={example.id} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            {example.title}
            <Badge variant="info">{example.language}</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">{example.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 代码块 */}
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code className="text-green-400 text-sm font-mono">
                <pre>{example.code}</pre>
              </code>
            </div>
            
            {/* 输出结果 */}
            {example.output && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">输出结果：</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <pre className="text-sm text-gray-800 font-mono">{example.output}</pre>
                </div>
              </div>
            )}
            
            {/* 解释 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">解释：</h4>
              <p className="text-sm text-gray-600">{example.explanation}</p>
            </div>
            
            {/* 概念标签 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">涉及概念：</h4>
              <div className="flex flex-wrap gap-1">
                {example.concepts.map((concept, index) => (
                  <Badge key={index} variant="secondary">{concept}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderExplanationSection = () => {
    const { explanation } = content
    
    return (
      <div className="space-y-6">
        {/* 学习目标 */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 学习目标</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {explanation.learningObjectives.map((objective, index) => (
                <li key={index} className="text-sm text-gray-700">{objective}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 前置知识 */}
        {explanation.prerequisites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📚 前置知识</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {explanation.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-sm text-gray-700">{prereq}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 主要内容 */}
        <Card>
          <CardHeader>
            <CardTitle>{explanation.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMarkdownContent(explanation.content.markdown)}
          </CardContent>
        </Card>

        {/* 代码示例 */}
        {explanation.content.codeExamples && explanation.content.codeExamples.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 代码示例</h3>
            {explanation.content.codeExamples.map(renderCodeExample)}
          </div>
        )}

        {/* 关键概念 */}
        {explanation.keyConcepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🔑 关键概念</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {explanation.keyConcepts.map((concept, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{concept.term}</h4>
                    <p className="text-sm text-gray-700 mt-1">{concept.definition}</p>
                    {concept.examples && concept.examples.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">示例：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {concept.examples.map((example, exampleIndex) => (
                            <code key={exampleIndex} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {example}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderExercise = (exercise: Exercise, index: number) => {
    const attempts = exerciseAttempts[exercise.id] || 0
    
    return (
      <Card key={exercise.id}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{exercise.title}</span>
            <div className="flex items-center gap-2">
              {getDifficultyBadge(exercise.difficulty)}
              <Badge variant="info">{exercise.estimatedTime}分钟</Badge>
              <Badge variant="secondary">{exercise.points}分</Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">{exercise.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 题目内容 */}
            {exercise.type === 'coding' && exercise.content.type === 'coding' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">题目描述</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {exercise.content.problemStatement}
                  </pre>
                </div>
                
                {/* 代码编辑器占位 */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">代码编辑器</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm font-mono">
                      <pre>{exercise.content.starterCode}</pre>
                    </code>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="primary" size="sm">运行代码</Button>
                    <Button variant="secondary" size="sm">提交答案</Button>
                  </div>
                </div>
              </div>
            )}

            {exercise.type === 'quiz' && exercise.content.type === 'quiz' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">题目</h4>
                <p className="text-gray-700 mb-4">{exercise.content.question}</p>
                
                <div className="space-y-2">
                  {exercise.content.options.map((option) => (
                    <label key={option.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input 
                        type={exercise.content.type === 'quiz' && exercise.content.multipleChoice ? "checkbox" : "radio"} 
                        name={`exercise_${exercise.id}`}
                        value={option.id}
                        className="form-radio"
                      />
                      <span className="text-sm">{option.text}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button variant="primary" size="sm">提交答案</Button>
                </div>
              </div>
            )}

            {/* 提示 */}
            {exercise.hints.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💡 提示</h4>
                <ul className="list-disc list-inside space-y-1">
                  {exercise.hints.map((hint, hintIndex) => (
                    <li key={hintIndex} className="text-sm text-gray-600">{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 尝试次数 */}
            {attempts > 0 && (
              <Alert variant="info">
                你已经尝试了 {attempts} 次。最多可以尝试 {content.practice.assessment.attempts} 次。
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPracticeSection = () => {
    const { practice } = content
    const currentExercise = practice.exercises[currentExerciseIndex]
    
    return (
      <div className="space-y-6">
        {/* 练习概览 */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 练习概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">练习数量:</span>
                <span className="ml-2 font-medium">{practice.exercises.length}</span>
              </div>
              <div>
                <span className="text-gray-500">通过分数:</span>
                <span className="ml-2 font-medium">{practice.assessment.passingScore}%</span>
              </div>
              <div>
                <span className="text-gray-500">允许尝试:</span>
                <span className="ml-2 font-medium">{practice.assessment.attempts}次</span>
              </div>
              {practice.assessment.timeLimit && (
                <div>
                  <span className="text-gray-500">时间限制:</span>
                  <span className="ml-2 font-medium">{practice.assessment.timeLimit}分钟</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 练习导航 */}
        {practice.exercises.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>练习导航</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {practice.exercises.map((exercise, index) => (
                  <Button
                    key={exercise.id}
                    variant={index === currentExerciseIndex ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    练习 {index + 1}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 当前练习 */}
        {currentExercise && renderExercise(currentExercise, currentExerciseIndex)}

        {/* 练习导航按钮 */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
          >
            上一题
          </Button>
          <Button
            variant="secondary"
            disabled={currentExerciseIndex === practice.exercises.length - 1}
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
          >
            下一题
          </Button>
        </div>
      </div>
    )
  }

  const renderSummarySection = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 学习总结</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 学习成果 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">学习成果</h4>
                <ul className="list-disc list-inside space-y-1">
                  {content.metadata.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="text-sm text-gray-700">{outcome}</li>
                  ))}
                </ul>
              </div>

              {/* 技能收获 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">技能收获</h4>
                <div className="flex flex-wrap gap-1">
                  {content.metadata.skills.map((skill, index) => (
                    <Badge key={index} variant="success">{skill}</Badge>
                  ))}
                </div>
              </div>

              {/* 掌握概念 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">掌握概念</h4>
                <div className="flex flex-wrap gap-1">
                  {content.metadata.concepts.map((concept, index) => (
                    <Badge key={index} variant="info">{concept}</Badge>
                  ))}
                </div>
              </div>

              {/* 进度总结 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🎉 恭喜完成学习!</h4>
                <p className="text-sm text-green-700">
                  你已经完成了「{content.title}」的学习。建议在学习后进行实践练习，加深理解。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 课程内容头部 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{content.title}</CardTitle>
              <p className="text-gray-600 mt-1">{content.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(content.status)}
              {getDifficultyBadge(content.metadata.difficulty)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">预计时间:</span>
              <span className="ml-2 font-medium">{content.metadata.estimatedReadingTime}分钟</span>
            </div>
            <div>
              <span className="text-gray-500">编程语言:</span>
              <span className="ml-2 font-medium">{content.metadata.language.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-500">已用时间:</span>
              <span className="ml-2 font-medium">{content.progress.timeSpent}分钟</span>
            </div>
            <div>
              <span className="text-gray-500">版本:</span>
              <span className="ml-2 font-medium">{content.metadata.version}</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>学习进度</span>
              <span>
                {content.progress.explanationCompleted && content.progress.practiceCompleted 
                  ? '100%' 
                  : content.progress.explanationCompleted 
                    ? '50%' 
                    : '0%'
                }
              </span>
            </div>
            <ProgressBar 
              value={
                content.progress.explanationCompleted && content.progress.practiceCompleted 
                  ? 100 
                  : content.progress.explanationCompleted 
                    ? 50 
                    : 0
              }
              variant="success"
              showLabel={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* 模式切换 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={currentMode === 'explanation' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('explanation')}
            >
              📖 讲解部分
            </Button>
            <Button
              variant={currentMode === 'practice' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('practice')}
            >
              💻 练习部分
            </Button>
            <Button
              variant={currentMode === 'summary' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('summary')}
            >
              📊 学习总结
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 内容区域 */}
      {currentMode === 'explanation' && renderExplanationSection()}
      {currentMode === 'practice' && renderPracticeSection()}
      {currentMode === 'summary' && renderSummarySection()}
    </div>
  )
}

export default CourseContentViewer 