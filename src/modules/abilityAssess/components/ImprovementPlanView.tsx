import React from 'react'
import { ImprovementPlan, GeneratedGoal, SkillGapData, TimelineData, PriorityData } from '../types'
import { Calendar, Target, TrendingUp, Clock, Users, BookOpen, CheckCircle, AlertCircle, Zap } from 'lucide-react'

interface ImprovementPlanViewProps {
  plan: ImprovementPlan
  onStartLearning?: (goalId: string) => void
  onViewProgress?: () => void
}

export const ImprovementPlanView: React.FC<ImprovementPlanViewProps> = ({
  plan,
  onStartLearning,
  onViewProgress
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
    const bgColor = isShortTerm ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
    const iconColor = isShortTerm ? 'text-blue-600' : 'text-green-600'
    const badgeColor = isShortTerm ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'

    return (
      <div key={index} className={`${bgColor} border rounded-xl p-6 hover:shadow-md transition-shadow`}>
        {/* 目标头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isShortTerm ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Target className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{goal.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                  {isShortTerm ? '短期目标 (1个月)' : '中期目标 (3个月)'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {goal.category}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">优先级</div>
            <div className="flex items-center gap-1">
              {Array.from({ length: goal.priority }, (_, i) => (
                <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* 目标描述 */}
        <p className="text-gray-700 mb-4">{goal.description}</p>

        {/* 目标信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{goal.estimatedTimeWeeks} 周</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{goal.targetLevel}</span>
          </div>
        </div>

        {/* 技能标签 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">需要技能:</div>
          <div className="flex flex-wrap gap-2">
            {goal.requiredSkills.map((skill, skillIndex) => (
              <span 
                key={skillIndex}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 预期成果 */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">预期成果:</div>
          <ul className="list-disc list-inside space-y-1">
            {goal.outcomes.map((outcome, outcomeIndex) => (
              <li key={outcomeIndex} className="text-sm text-gray-600">{outcome}</li>
            ))}
          </ul>
        </div>

        {/* 学习路径预览 */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">学习路径: {goal.associatedPath.title}</span>
            <span className="text-xs text-gray-500">({goal.associatedPath.totalEstimatedHours}h)</span>
          </div>
          
          <div className="space-y-2">
            {goal.associatedPath.nodes.slice(0, 3).map((node, nodeIndex) => (
              <div key={nodeIndex} className="flex items-center gap-3 p-2 bg-white rounded border">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {nodeIndex + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{node.title}</div>
                  <div className="text-xs text-gray-500">
                    {node.type} • {node.estimatedHours}h • 难度 {node.difficulty}/5
                  </div>
                </div>
              </div>
            ))}
            {goal.associatedPath.nodes.length > 3 && (
              <div className="text-xs text-gray-500 text-center py-1">
                还有 {goal.associatedPath.nodes.length - 3} 个学习节点...
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onStartLearning?.(goal.title)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isShortTerm 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            开始学习
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 智能提升计划</h1>
            <p className="text-blue-100 mb-4">
              基于您的能力评估，AI 为您量身定制的学习路径和目标
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{totalGoals} 个目标</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{totalHours} 小时</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{plan.metadata.estimatedTimeMonths} 个月</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>目标提升 {plan.metadata.targetImprovement} 分</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">当前基础评分</div>
            <div className="text-4xl font-bold">{plan.metadata.baseScore}</div>
            <div className="text-sm text-blue-100">/ 100</div>
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
      <div className="flex justify-center gap-4">
        <button
          onClick={onViewProgress}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          查看学习进度
        </button>
        <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          下载学习计划
        </button>
        <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          分享计划
        </button>
      </div>
    </div>
  )
} 