import React from 'react'
import { 
  AbilityAssessment, 
  getScoreLevel, 
  ScoreLevel,
  getSkillScoreValue,
  getSkillConfidence,
  isSkillInferred
} from '../types'

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
  
  // 为 report 添加默认值，防止 undefined 错误
  const report = assessment.report || {
    summary: '暂无评估总结',
    strengths: [],
    improvements: [],
    recommendations: []
  }
  
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

  // 技能名称中文映射
  const skillNameMap: Record<string, string> = {
    syntax: '基础语法',
    dataStructures: '数据结构',
    errorHandling: '错误处理',
    codeQuality: '代码质量',
    tooling: '开发工具',
    stringProcessing: '字符串处理',
    recursion: '递归',
    dynamicProgramming: '动态规划',
    graph: '图算法',
    tree: '树算法',
    sorting: '排序算法',
    searching: '搜索算法',
    greedy: '贪心算法',
    planning: '项目规划',
    architecture: '架构设计',
    implementation: '实现能力',
    testing: '测试能力',
    deployment: '部署运维',
    documentation: '文档能力',
    scalability: '可扩展性',
    reliability: '可靠性',
    performance: '性能优化',
    security: '安全设计',
    databaseDesign: '数据库设计',
    codeReview: '代码评审',
    technicalWriting: '技术写作',
    teamCollaboration: '团队协作',
    mentoring: '指导他人',
    presentation: '演讲展示'
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

      {/* 说明信息 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-amber-600">ℹ️</span>
          <div className="text-amber-800">
            <p className="font-medium mb-1">评分说明：</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>实线表示基于简历中明确信息得出的评分</li>
              <li>虚线表示基于整体信息推理得出的评分，仅供参考</li>
              <li>带 * 标记的技能表示 AI 推理得出，可能与实际有偏差</li>
            </ul>
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
            <div className="space-y-2">
              {Object.entries(dimension.skills).map(([skill, skillData]) => {
                const score = getSkillScoreValue(skillData)
                const confidence = getSkillConfidence(skillData)
                const isInferred = isSkillInferred(skillData)
                const skillName = skillNameMap[skill] || skill
                
                return (
                  <div key={skill} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-600">
                        {skillName}
                        {isInferred && <span className="text-amber-600 ml-1">*</span>}
                      </span>
                      {/* 进度条 */}
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${
                              score < 60 ? 'bg-red-400' : 'bg-gray-400'
                            } ${isInferred ? 'opacity-50' : ''}`}
                            style={{ 
                              width: `${score}%`,
                              backgroundImage: isInferred 
                                ? 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px)' 
                                : 'none'
                            }}
                            title={isInferred ? '基于整体信息推理' : `置信度: ${(confidence * 100).toFixed(0)}%`}
                          />
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      score < 60 ? 'text-red-600' : 'text-gray-800'
                    } ${isInferred ? 'opacity-60' : ''}`}>
                      {score}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 评估报告 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-bold text-lg mb-4">评估报告</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">总结</h4>
            <p className="text-gray-600">{report.summary}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">✨ 优势领域</h4>
            {report.strengths.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-600">{strength}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">暂无优势领域信息</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">📈 待改进项</h4>
            {report.improvements.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {report.improvements.map((improvement, index) => (
                  <li key={index} className="text-gray-600">{improvement}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">暂无改进建议信息</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">💡 发展建议</h4>
            {report.recommendations.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-600">{recommendation}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">暂无发展建议信息</p>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 下一步行动</h3>
          <p className="text-gray-600">
            基于您的能力评估结果，我们可以为您生成个性化的智能提升计划
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onGenerateImprovement && (
            <button
              onClick={onGenerateImprovement}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              🚀 生成智能提升计划
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              📄 导出评估报告
            </button>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            智能提升计划将根据您的{assessment.overallScore}分评估结果，
            为您量身定制短期和中期学习目标
          </p>
        </div>
      </div>
    </div>
  )
} 