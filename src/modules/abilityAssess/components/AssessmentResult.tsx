import React from 'react'
import { AbilityAssessment, getScoreLevel, ScoreLevel } from '../types'

interface AssessmentResultProps {
  assessment: AbilityAssessment
  onGenerateImprovement?: () => void
  onExport?: () => void
}

export const AssessmentResult: React.FC<AssessmentResultProps> = ({ 
  assessment, 
  onGenerateImprovement,
  onExport 
}) => {
  const level = getScoreLevel(assessment.overallScore)
  
  // 获取等级对应的颜色
  const getLevelColor = (level: ScoreLevel) => {
    const colors: Record<ScoreLevel, string> = {
      [ScoreLevel.Novice]: 'text-gray-600 bg-gray-100',
      [ScoreLevel.Beginner]: 'text-blue-600 bg-blue-100',
      [ScoreLevel.Intermediate]: 'text-green-600 bg-green-100',
      [ScoreLevel.Advanced]: 'text-purple-600 bg-purple-100',
      [ScoreLevel.Expert]: 'text-red-600 bg-red-100'
    }
    return colors[level]
  }

  // 获取分数对应的进度条颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 总体评分 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">能力评估结果</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(level)}`}>
            {level.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600">{assessment.overallScore}</div>
            <div className="text-gray-600 mt-1">总体评分</div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">
              置信度: {(assessment.metadata.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">
              评估日期: {new Date(assessment.metadata.assessmentDate).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* 各维度评分 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(assessment.dimensions).map(([key, dimension]) => (
          <div key={key} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">
                {key === 'programming' && '编程基本功'}
                {key === 'algorithm' && '算法能力'}
                {key === 'project' && '项目能力'}
                {key === 'systemDesign' && '系统设计'}
                {key === 'communication' && '沟通协作'}
              </h3>
              <span className="text-2xl font-bold">{dimension.score}</span>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all ${getScoreColor(dimension.score)}`}
                style={{ width: `${dimension.score}%` }}
              />
            </div>
            
            {/* 细分技能 */}
            <div className="space-y-1">
              {Object.entries(dimension.skills).map(([skill, score]) => (
                <div key={skill} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{skill}</span>
                  <span className={score < 60 ? 'text-red-600' : 'text-gray-800'}>
                    {score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 评估报告 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">评估报告</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">总结</h4>
            <p className="text-gray-600">{assessment.report.summary}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">✨ 优势领域</h4>
            <ul className="list-disc list-inside space-y-1">
              {assessment.report.strengths.map((strength, index) => (
                <li key={index} className="text-gray-600">{strength}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">📈 待改进项</h4>
            <ul className="list-disc list-inside space-y-1">
              {assessment.report.improvements.map((improvement, index) => (
                <li key={index} className="text-gray-600">{improvement}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">💡 发展建议</h4>
            <ul className="list-disc list-inside space-y-1">
              {assessment.report.recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-600">{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        {onGenerateImprovement && (
          <button
            onClick={onGenerateImprovement}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            生成提升计划
          </button>
        )}
        
        {onExport && (
          <button
            onClick={onExport}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            导出报告
          </button>
        )}
      </div>
    </div>
  )
} 