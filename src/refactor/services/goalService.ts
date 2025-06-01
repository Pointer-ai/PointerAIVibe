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

// 目标推荐服务实现

import { refactorAIService } from './aiService'

interface GoalRecommendation {
  id: string
  title: string
  description: string
  category: string
  priority: number
  reasoning: string
  estimatedTimeWeeks: number
  requiredSkills: string[]
  outcomes: string[]
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  confidence: number
}

interface QuestionnaireAnswers {
  experience_level: string
  learning_time: string
  learning_goal: string[]
  project_preference: string[]
  career_direction: string
  current_skills: string[]
  challenge_level: string
}

class GoalService {
  /**
   * 基于自然语言生成目标推荐
   */
  async generateFromNLP(description: string): Promise<GoalRecommendation[]> {
    try {
      const prompt = this.buildNLPPrompt(description)
      const response = await refactorAIService.chat(prompt)
      return this.parseRecommendations(response)
    } catch (error) {
      console.error('Failed to generate from NLP:', error)
      return this.getFallbackNLPRecommendations(description)
    }
  }

  /**
   * 基于结构化问卷生成推荐
   */
  async generateRecommendations(
    selectedCategories: string[],
    questionnaireAnswers: QuestionnaireAnswers
  ): Promise<GoalRecommendation[]> {
    try {
      const prompt = this.buildStructuredPrompt(selectedCategories, questionnaireAnswers)
      const response = await refactorAIService.chat(prompt)
      return this.parseRecommendations(response)
    } catch (error) {
      console.error('Failed to generate structured recommendations:', error)
      return this.getFallbackStructuredRecommendations(selectedCategories, questionnaireAnswers)
    }
  }

  /**
   * 构建自然语言处理提示词
   */
  private buildNLPPrompt(description: string): string {
    return `作为专业的编程学习顾问，请分析以下用户描述并生成3个个性化的学习目标推荐：

用户描述：
"${description}"

请以JSON格式返回推荐结果，数组格式，每个推荐包含：
- id: 唯一标识符
- title: 目标标题（简洁明确，15字内）
- description: 详细描述（100-150字）
- category: 类别（frontend/backend/fullstack/automation/ai/mobile/game/data）
- priority: 优先级（1-5，5最高）
- reasoning: 推荐理由（50-80字）
- estimatedTimeWeeks: 预计学习周数（1-24）
- requiredSkills: 需要掌握的技能列表（3-6个）
- outcomes: 学习成果列表（3-5个）
- targetLevel: 目标级别（beginner/intermediate/advanced/expert）
- confidence: 推荐置信度（0.0-1.0）

确保推荐切合用户描述的背景和目标，难度适中，循序渐进。`
  }

  /**
   * 构建结构化推荐提示词
   */
  private buildStructuredPrompt(
    categories: string[],
    answers: QuestionnaireAnswers
  ): string {
    return `作为专业的编程学习顾问，请根据以下信息为用户推荐3个最合适的学习目标：

选择的学习领域：${categories.join('、')}

问卷回答：
- 编程经验：${answers.experience_level}
- 学习时间：${answers.learning_time}
- 学习目标：${answers.learning_goal.join('、')}
- 项目偏好：${answers.project_preference.join('、')}
- 职业方向：${answers.career_direction}

请以JSON格式返回推荐结果，数组格式，每个推荐包含：
- id: 唯一标识符
- title: 目标标题（简洁明确，15字内）
- description: 详细描述（100-150字）
- category: 类别（从用户选择的领域中选择）
- priority: 优先级（1-5，5最高）
- reasoning: 推荐理由（50-80字）
- estimatedTimeWeeks: 预计学习周数（根据学习时间调整）
- requiredSkills: 需要掌握的技能列表（3-6个）
- outcomes: 学习成果列表（3-5个）
- targetLevel: 目标级别（根据经验水平确定）
- confidence: 推荐置信度（0.0-1.0）

确保推荐符合用户的经验水平和时间投入，实用性强。`
  }

  /**
   * 解析AI响应为推荐列表
   */
  private parseRecommendations(response: string): GoalRecommendation[] {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        
        // 确保每个推荐都有必要的字段
        return recommendations.map((rec: any, index: number) => ({
          id: rec.id || `goal_${Date.now()}_${index}`,
          title: rec.title || '学习目标',
          description: rec.description || '详细的学习目标描述',
          category: rec.category || 'frontend',
          priority: rec.priority || 3,
          reasoning: rec.reasoning || '基于您的需求推荐',
          estimatedTimeWeeks: rec.estimatedTimeWeeks || 8,
          requiredSkills: rec.requiredSkills || [],
          outcomes: rec.outcomes || [],
          targetLevel: rec.targetLevel || 'intermediate',
          confidence: rec.confidence || 0.8
        }))
      }
      
      return []
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error)
      return []
    }
  }

  /**
   * 自然语言兜底推荐
   */
  private getFallbackNLPRecommendations(description: string): GoalRecommendation[] {
    const lowerDesc = description.toLowerCase()
    
    // 基于关键词识别推荐
    const recommendations: GoalRecommendation[] = []
    
    if (lowerDesc.includes('前端') || lowerDesc.includes('网页') || lowerDesc.includes('界面')) {
      recommendations.push({
        id: `nlp_frontend_${Date.now()}`,
        title: '前端开发入门',
        description: '学习HTML、CSS、JavaScript基础，掌握现代前端开发技能，能够构建响应式网页应用。',
        category: 'frontend',
        priority: 4,
        reasoning: '基于您对前端开发的兴趣',
        estimatedTimeWeeks: 12,
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
        outcomes: ['构建响应式网页', '掌握前端框架', '完成项目作品'],
        targetLevel: 'intermediate',
        confidence: 0.8
      })
    }
    
    if (lowerDesc.includes('后端') || lowerDesc.includes('服务器') || lowerDesc.includes('api')) {
      recommendations.push({
        id: `nlp_backend_${Date.now()}`,
        title: '后端开发实践',
        description: '学习服务器端编程，掌握API设计、数据库操作和服务器部署技能。',
        category: 'backend',
        priority: 4,
        reasoning: '适合您的后端开发需求',
        estimatedTimeWeeks: 16,
        requiredSkills: ['Python', 'Node.js', 'SQL', 'API设计'],
        outcomes: ['开发REST API', '数据库设计', '服务器部署'],
        targetLevel: 'intermediate',
        confidence: 0.8
      })
    }
    
    if (lowerDesc.includes('python') || lowerDesc.includes('自动化') || lowerDesc.includes('脚本')) {
      recommendations.push({
        id: `nlp_automation_${Date.now()}`,
        title: 'Python自动化编程',
        description: '学习Python编程，掌握办公自动化、数据处理和脚本编写技能。',
        category: 'automation',
        priority: 3,
        reasoning: '适合提高工作效率',
        estimatedTimeWeeks: 8,
        requiredSkills: ['Python', '数据处理', 'Excel操作', '文件处理'],
        outcomes: ['自动化办公流程', '数据分析脚本', '提高工作效率'],
        targetLevel: 'beginner',
        confidence: 0.9
      })
    }
    
    // 如果没有匹配到特定技术，提供通用推荐
    if (recommendations.length === 0) {
      recommendations.push({
        id: `nlp_general_${Date.now()}`,
        title: '编程基础入门',
        description: '从编程基础开始，学习核心概念和基本技能，为后续深入学习打下坚实基础。',
        category: 'frontend',
        priority: 3,
        reasoning: '适合编程初学者',
        estimatedTimeWeeks: 10,
        requiredSkills: ['编程思维', '基础语法', '问题解决'],
        outcomes: ['掌握编程基础', '培养逻辑思维', '完成入门项目'],
        targetLevel: 'beginner',
        confidence: 0.7
      })
    }
    
    return recommendations.slice(0, 3)
  }

  /**
   * 结构化兜底推荐
   */
  private getFallbackStructuredRecommendations(
    categories: string[],
    answers: QuestionnaireAnswers
  ): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = []
    
    // 根据经验水平确定目标级别
    const getTargetLevel = (): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
      switch (answers.experience_level) {
        case 'beginner': return 'beginner'
        case 'junior': return 'intermediate'
        case 'intermediate': return 'intermediate'
        case 'senior': return 'advanced'
        default: return 'intermediate'
      }
    }
    
    // 根据学习时间确定周数
    const getEstimatedWeeks = (): number => {
      switch (answers.learning_time) {
        case '5-10h': return 16
        case '10-20h': return 12
        case '20-30h': return 8
        case '30h+': return 6
        default: return 12
      }
    }
    
    const targetLevel = getTargetLevel()
    const estimatedWeeks = getEstimatedWeeks()
    
    // 为每个选择的类别生成推荐
    categories.slice(0, 3).forEach((category, index) => {
      const categoryConfig = this.getCategoryConfig(category)
      
      recommendations.push({
        id: `structured_${category}_${Date.now()}`,
        title: `${categoryConfig.name}学习之路`,
        description: categoryConfig.description,
        category,
        priority: 5 - index,
        reasoning: `基于您选择的${categoryConfig.name}方向和${answers.experience_level}经验水平`,
        estimatedTimeWeeks: estimatedWeeks,
        requiredSkills: categoryConfig.skills,
        outcomes: categoryConfig.outcomes,
        targetLevel,
        confidence: 0.8
      })
    })
    
    return recommendations
  }

  /**
   * 获取类别配置
   */
  private getCategoryConfig(category: string) {
    const configs: Record<string, any> = {
      frontend: {
        name: '前端开发',
        description: '学习现代前端技术，掌握用户界面开发和交互设计技能，能够构建优秀的Web应用。',
        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
        outcomes: ['响应式网页开发', '前端框架应用', '用户体验设计']
      },
      backend: {
        name: '后端开发',
        description: '掌握服务器端编程技术，学习API设计、数据库管理和系统架构设计。',
        skills: ['Python', 'Node.js', 'SQL', 'API设计'],
        outcomes: ['后端服务开发', '数据库设计', '系统架构']
      },
      fullstack: {
        name: '全栈开发',
        description: '综合前后端技术，成为全能开发者，能够独立完成完整的Web应用项目。',
        skills: ['前端技术', '后端技术', '数据库', '部署运维'],
        outcomes: ['全栈项目开发', '端到端解决方案', '项目管理']
      },
      automation: {
        name: '自动化编程',
        description: '学习Python自动化编程，提高工作效率，解决重复性任务和数据处理问题。',
        skills: ['Python', '数据处理', 'Excel自动化', '脚本编程'],
        outcomes: ['办公自动化', '数据分析', '效率提升']
      },
      ai: {
        name: 'AI与机器学习',
        description: '探索人工智能技术，学习机器学习算法和深度学习框架，构建智能应用。',
        skills: ['Python', '机器学习', '数据科学', 'TensorFlow'],
        outcomes: ['AI模型开发', '数据分析', '智能应用']
      },
      mobile: {
        name: '移动开发',
        description: '学习移动应用开发技术，掌握iOS和Android平台的应用开发技能。',
        skills: ['React Native', 'Flutter', '移动UI', 'App发布'],
        outcomes: ['移动应用开发', '跨平台技术', 'App Store发布']
      },
      game: {
        name: '游戏开发',
        description: '学习游戏开发技术，掌握游戏引擎使用和游戏逻辑编程技能。',
        skills: ['Unity', 'C#', '游戏设计', '3D建模'],
        outcomes: ['游戏原型开发', '游戏逻辑编程', '游戏发布']
      },
      data: {
        name: '数据分析',
        description: '学习数据科学技术，掌握数据收集、处理、分析和可视化技能。',
        skills: ['Python', 'SQL', '数据可视化', '统计分析'],
        outcomes: ['数据分析报告', '数据可视化', '商业洞察']
      }
    }
    
    return configs[category] || configs.frontend
  }
}

export const goalService = new GoalService() 