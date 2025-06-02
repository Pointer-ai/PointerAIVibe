import { LearningSystemStatus } from '../learning/types'

/**
 * 智能建议生成服务
 */
export class SuggestionGeneratorService {
  /**
   * 基于AI响应生成智能建议
   */
  generateSmartSuggestions(aiResponse: string, systemStatus: LearningSystemStatus): string[] {
    const suggestions: string[] = []
    const response = aiResponse.toLowerCase()
    
    // 基于AI响应内容分析
    if (response.includes('评估') || response.includes('能力')) {
      suggestions.push('查看详细能力分析')
    }
    if (response.includes('目标') || response.includes('学习')) {
      suggestions.push('设定新的学习目标')
    }
    if (response.includes('路径') || response.includes('计划')) {
      suggestions.push('生成学习路径')
    }
    if (response.includes('进度') || response.includes('状态')) {
      suggestions.push('查看学习进度')
    }
    if (response.includes('困难') || response.includes('问题')) {
      suggestions.push('获取学习帮助')
    }
    
    // 基于系统状态补充建议
    if (!systemStatus.progress.hasAbilityProfile) {
      suggestions.push('完成能力评估')
    }
    if (systemStatus.progress.activeGoals === 0) {
      suggestions.push('创建学习目标')
    }
    if (systemStatus.progress.activePaths === 0 && systemStatus.progress.activeGoals > 0) {
      suggestions.push('生成学习路径')
    }
    
    // 智能去重和限制数量
    const uniqueSuggestions = [...new Set(suggestions)]
    return uniqueSuggestions.slice(0, 4)
  }

  /**
   * 基于系统状态和用户消息生成建议
   */
  async generateSuggestions(systemStatus: LearningSystemStatus, userMessage: string): Promise<string[]> {
    const suggestions: string[] = []
    
    // 基于系统状态的建议
    if (!systemStatus.progress.hasAbilityProfile) {
      suggestions.push('完成能力评估以获得个性化建议')
    }
    
    if (systemStatus.progress.activeGoals === 0) {
      suggestions.push('设定您的第一个学习目标')
    }
    
    if (systemStatus.progress.activePaths === 0 && systemStatus.progress.activeGoals > 0) {
      suggestions.push('为目标生成学习路径')
    }
    
    if (systemStatus.progress.totalNodes > 0 && systemStatus.progress.overallProgress > 0) {
      suggestions.push('查看学习进度报告')
    }
    
    // 基于用户消息的建议
    if (userMessage.includes('困难') || userMessage.includes('不懂')) {
      suggestions.push('获得针对性的学习帮助')
    }
    
    if (userMessage.includes('时间') || userMessage.includes('安排')) {
      suggestions.push('制定个性化学习时间表')
    }
    
    return suggestions.slice(0, 3) // 返回前3个建议
  }
}

export const suggestionGeneratorService = new SuggestionGeneratorService() 