import React from 'react'
import { ImprovementPlan, GeneratedGoal, SkillGapData, TimelineData, PriorityData } from '../types'
import { Calendar, Target, TrendingUp, Clock, Users, BookOpen, CheckCircle, AlertCircle, Zap } from 'lucide-react'

interface ImprovementPlanViewProps {
  plan: ImprovementPlan
  onStartLearning?: (goalId: string) => void
  onViewProgress?: () => void
  onRegenerate?: () => void
}

export const ImprovementPlanView: React.FC<ImprovementPlanViewProps> = ({
  plan,
  onStartLearning,
  onViewProgress,
  onRegenerate
}) => {
  // 计算统计数据
  const totalGoals = plan.generatedGoals.shortTerm.length + plan.generatedGoals.mediumTerm.length
  const totalWeeks = Math.max(
    ...plan.generatedGoals.shortTerm.map(g => g.estimatedTimeWeeks),
    ...plan.generatedGoals.mediumTerm.map(g => g.estimatedTimeWeeks)
  )
  const totalHours = plan.generatedGoals.shortTerm.reduce((sum, g) => sum + g.associatedPath.totalEstimatedHours, 0) +
                    plan.generatedGoals.mediumTerm.reduce((sum, g) => sum + g.associatedPath.totalEstimatedHours, 0)

  const renderGoalCard = (goal: GeneratedGoal, index: number) => {
    const isShortTerm = goal.duration === 'short'
    const isAdvanced = goal.targetLevel === 'expert' || goal.targetLevel === 'advanced'
    const isHighPriority = goal.priority >= 4
    
    // 根据目标类型和难度调整样式
    let bgColor, iconColor, badgeColor, borderStyle
    if (isAdvanced && isHighPriority) {
      bgColor = isShortTerm ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300' : 'bg-gradient-to-r from-green-50 to-teal-50 border-green-300'
      iconColor = isShortTerm ? 'text-purple-600' : 'text-green-600'
      badgeColor = isShortTerm ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
      borderStyle = 'border-2'
    } else {
      bgColor = isShortTerm ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
      iconColor = isShortTerm ? 'text-blue-600' : 'text-green-600'
      badgeColor = isShortTerm ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      borderStyle = 'border'
    }

    return (
      <div key={index} className={`${bgColor} ${borderStyle} rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${isAdvanced ? 'shadow-md' : ''}`}>
        {/* 高级标识 */}
        {isAdvanced && (
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
              🚀 高级内容
            </span>
            {goal.associatedPath.totalEstimatedHours >= 50 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                🔥 深度项目
              </span>
            )}
          </div>
        )}

        {/* 目标头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAdvanced ? 'bg-gradient-to-r from-purple-100 to-blue-100' : isShortTerm ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Target className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isAdvanced ? 'text-xl text-gray-900' : 'text-lg text-gray-900'}`}>
                {goal.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                  {isShortTerm ? '短期目标 (1个月)' : '中期目标 (3个月)'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {goal.category}
                </span>
                {isAdvanced && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800">
                    ⭐ {goal.targetLevel.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">优先级</div>
            <div className="flex items-center gap-1">
              {Array.from({ length: goal.priority }, (_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${isHighPriority ? 'bg-red-500' : 'bg-yellow-400'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* 目标描述 */}
        <p className={`text-gray-700 mb-4 ${isAdvanced ? 'text-base leading-relaxed' : ''}`}>
          {goal.description}
        </p>

        {/* 目标信息 - 增强版 */}
        <div className={`grid ${isAdvanced ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-4`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{goal.estimatedTimeWeeks} 周</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{goal.targetLevel}</span>
          </div>
          {isAdvanced && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 font-medium">
                💼 {goal.associatedPath.totalEstimatedHours}h 深度学习
              </span>
            </div>
          )}
        </div>

        {/* 技能标签 - 高级内容突出显示 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {isAdvanced ? '🎯 核心技术栈:' : '需要技能:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {goal.requiredSkills.map((skill, skillIndex) => (
              <span 
                key={skillIndex}
                className={`px-2 py-1 rounded text-xs ${
                  isAdvanced 
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-medium border border-purple-200' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 预期成果 - 高级内容增强 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {isAdvanced ? '🚀 核心产出与成果:' : '预期成果:'}
          </div>
          <ul className="list-disc list-inside space-y-1">
            {goal.outcomes.map((outcome, outcomeIndex) => (
              <li key={outcomeIndex} className={`text-sm ${isAdvanced ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                {isAdvanced && '💼 '}{outcome}
              </li>
            ))}
          </ul>
        </div>

        {/* 学习路径预览 - 增强版 */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className={`text-sm font-medium text-gray-700 ${isAdvanced ? 'text-base' : ''}`}>
              {isAdvanced ? '🎓 高级学习路径' : '学习路径'}: {goal.associatedPath.title}
            </span>
            <span className={`text-xs text-gray-500 ${isAdvanced ? 'font-medium text-purple-600' : ''}`}>
              ({goal.associatedPath.totalEstimatedHours}h)
            </span>
          </div>
          
          <div className="space-y-2">
            {goal.associatedPath.nodes.slice(0, isAdvanced ? 5 : 3).map((node, nodeIndex) => (
              <div key={nodeIndex} className={`flex items-center gap-3 p-3 bg-white rounded border ${isAdvanced ? 'border-purple-100 hover:bg-purple-50' : ''} transition-colors`}>
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isAdvanced ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700' : 'bg-gray-100'
                  }`}>
                    {nodeIndex + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isAdvanced ? 'text-gray-900' : 'text-gray-800'}`}>
                    {isAdvanced && '⚡ '}{node.title}
                  </div>
                  <div className={`text-xs text-gray-500 ${isAdvanced ? 'font-medium' : ''}`}>
                    {node.type} • {node.estimatedHours}h • 难度 {node.difficulty}/5
                    {isAdvanced && node.difficulty >= 4 && (
                      <span className="ml-2 text-red-600 font-bold">🔥 高难度</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {goal.associatedPath.nodes.length > (isAdvanced ? 5 : 3) && (
              <div className={`text-xs text-center py-2 ${isAdvanced ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                还有 {goal.associatedPath.nodes.length - (isAdvanced ? 5 : 3)} 个{isAdvanced ? '高级' : ''}学习节点...
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 - 高级内容特殊样式 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onStartLearning?.(goal.title)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              isAdvanced
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                : isShortTerm 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAdvanced ? '🚀 开始高级学习' : '开始学习'}
          </button>
          <button className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
            isAdvanced 
              ? 'border-purple-300 text-purple-700 hover:bg-purple-50' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            查看详情
          </button>
        </div>
      </div>
    )
  }

  const renderSkillGapChart = () => {
    const highPriorityGaps = plan.visualData.skillGapChart.filter(gap => gap.priority === 'high').slice(0, 5)
    
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">技能差距分析</h3>
        </div>
        
        <div className="space-y-4">
          {highPriorityGaps.map((gap, index) => {
            const progressPercentage = (gap.currentScore / gap.targetScore) * 100
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {gap.skillName.split('.')[1]} ({gap.skillName.split('.')[0]})
                  </span>
                  <span className="text-xs text-gray-500">
                    {gap.currentScore} → {gap.targetScore} (+{gap.gap})
                  </span>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>当前: {gap.currentScore}</span>
                    <span>目标: {gap.targetScore}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded text-white ${
                    gap.priority === 'high' ? 'bg-red-500' : 
                    gap.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {gap.priority === 'high' ? '高优先级' : 
                     gap.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                  <span className="text-gray-500">预计 {gap.estimatedWeeks} 周</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTimeline = () => {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">学习时间线</h3>
        </div>
        
        <div className="space-y-4">
          {plan.overallStrategy.milestones.map((milestone, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(milestone.targetDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                <div className="flex flex-wrap gap-1">
                  {milestone.associatedSkills.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPriorityMatrix = () => {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">优先级矩阵</h3>
        </div>
        
        <div className="grid gap-3">
          {plan.visualData.priorityMatrix.slice(0, 8).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{item.skill}</span>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">影响</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < item.impact ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">难度</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < item.difficulty ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">紧急</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < item.urgency ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 头部信息 */}
      <div className={`rounded-xl text-white p-8 ${plan.metadata.baseScore >= 80 ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-green-600'}`}>
        {plan.metadata.baseScore >= 80 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/30">
              🚀 高级开发者专属计划
            </span>
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              ⭐ EXPERT LEVEL
            </span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`font-bold mb-2 ${plan.metadata.baseScore >= 80 ? 'text-4xl' : 'text-3xl'}`}>
              {plan.metadata.baseScore >= 80 ? '🚀 智能高级提升计划' : '🚀 智能提升计划'}
            </h1>
            <p className={`mb-4 ${plan.metadata.baseScore >= 80 ? 'text-blue-100 text-lg' : 'text-blue-100'}`}>
              {plan.metadata.baseScore >= 80 
                ? '基于您的高级技能水平，AI 为您量身定制的架构级学习路径和专业目标' 
                : '基于您的能力评估，AI 为您量身定制的学习路径和目标'
              }
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{totalGoals} 个{plan.metadata.baseScore >= 80 ? '高级' : ''}目标</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{totalHours} 小时{plan.metadata.baseScore >= 80 ? '深度学习' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{plan.metadata.estimatedTimeMonths} 个月</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>目标提升 {plan.metadata.targetImprovement} 分</span>
              </div>
              {plan.metadata.baseScore >= 80 && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">💼 架构级项目</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm mb-1 ${plan.metadata.baseScore >= 80 ? 'text-yellow-200' : 'text-blue-100'}`}>
              {plan.metadata.baseScore >= 80 ? '高级开发者基础评分' : '当前基础评分'}
            </div>
            <div className={`font-bold ${plan.metadata.baseScore >= 80 ? 'text-5xl text-yellow-300' : 'text-4xl'}`}>
              {plan.metadata.baseScore}
            </div>
            <div className={`text-sm ${plan.metadata.baseScore >= 80 ? 'text-yellow-200' : 'text-blue-100'}`}>
              / 100 {plan.metadata.baseScore >= 80 ? '(专家级)' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 整体策略 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 整体学习策略</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">🎯 重点关注领域</h3>
            <div className="flex flex-wrap gap-2">
              {plan.overallStrategy.focusAreas.map((area, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">⏰ 时间分配建议</h3>
            <p className="text-gray-600 text-sm">{plan.overallStrategy.timeAllocation}</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-gray-800 mb-2">📚 学习方法</h3>
          <p className="text-gray-600 text-sm">{plan.overallStrategy.learningApproach}</p>
        </div>
      </div>

      {/* 短期目标 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 短期目标 (1个月)</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {plan.generatedGoals.shortTerm.map((goal, index) => renderGoalCard(goal, index))}
        </div>
      </div>

      {/* 中期目标 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 中期目标 (3个月)</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {plan.generatedGoals.mediumTerm.map((goal, index) => renderGoalCard(goal, index))}
        </div>
      </div>

      {/* 数据分析 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {renderSkillGapChart()}
        {renderTimeline()}
      </div>

      {/* 优先级矩阵 */}
      {renderPriorityMatrix()}

      {/* 操作按钮 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 计划管理</h3>
          <p className="text-gray-600 text-sm">
            管理您的学习计划，跟踪进度或重新生成更适合的计划
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onViewProgress}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            📊 查看学习进度
          </button>
          
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              🔄 重新生成计划
            </button>
          )}
          
          <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
            📥 下载学习计划
          </button>
          
          <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg">
            📤 分享计划
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 提示：如果您的能力有所提升或学习偏好发生变化，可以重新生成更适合的学习计划
          </p>
        </div>
      </div>
    </div>
  )
} 