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

import { Language, getCurrentLanguage } from './i18n'

/**
 * 获取当前语言的AI指令描述
 */
export const getLanguageInstruction = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `Please respond in English. Generate all content, explanations, and outputs in English language.`
  } else {
    return `请用中文回答。所有生成的内容、解释和输出都使用中文。`
  }
}

/**
 * 在AI提示词中添加语言指令
 */
export const addLanguageInstruction = (prompt: string, language?: Language): string => {
  const languageInstruction = getLanguageInstruction(language)
  return `${languageInstruction}\n\n${prompt}`
}

/**
 * 获取语言特定的AI系统提示
 */
export const getLanguageSystemPrompt = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `You are an AI programming education assistant. You must respond in English and generate all content in English. When creating learning materials, assessments, or explanations, ensure everything is in English and culturally appropriate for English-speaking learners.`
  } else {
    return `你是一个AI编程教育助手。你必须用中文回答，并且所有生成的内容都要用中文。在创建学习材料、评估或解释时，确保一切都用中文，并且适合中文学习者的文化背景。`
  }
}

/**
 * 语言特定的内容类型描述
 */
export const getContentTypeNames = (language?: Language) => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return {
      theory: 'Theory',
      practice: 'Practice',
      project: 'Project',
      quiz: 'Quiz',
      tutorial: 'Tutorial',
      exercise: 'Exercise',
      example: 'Example',
      case_study: 'Case Study'
    }
  } else {
    return {
      theory: '理论',
      practice: '实践',
      project: '项目',
      quiz: '测验',
      tutorial: '教程',
      exercise: '练习',
      example: '示例',
      case_study: '案例研究'
    }
  }
}

/**
 * 语言特定的技能级别描述
 */
export const getSkillLevelNames = (language?: Language) => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert'
    }
  } else {
    return {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      expert: '专家'
    }
  }
}

/**
 * 语言特定的编程领域描述
 */
export const getProgrammingDomainNames = (language?: Language) => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return {
      frontend: 'Frontend Development',
      backend: 'Backend Development',
      fullstack: 'Full-stack Development',
      mobile: 'Mobile Development',
      ai: 'Artificial Intelligence',
      data: 'Data Science',
      game: 'Game Development',
      automation: 'Test Automation',
      devops: 'DevOps',
      security: 'Cybersecurity'
    }
  } else {
    return {
      frontend: '前端开发',
      backend: '后端开发',
      fullstack: '全栈开发',
      mobile: '移动开发',
      ai: '人工智能',
      data: '数据科学',
      game: '游戏开发',
      automation: '自动化测试',
      devops: '运维开发',
      security: '网络安全'
    }
  }
}

/**
 * 为AI生成请求添加语言上下文
 */
export const createLanguageAwarePrompt = (
  basePrompt: string,
  contentType?: string,
  domain?: string,
  level?: string,
  language?: Language
): string => {
  const lang = language || getCurrentLanguage()
  const languageInstruction = getLanguageInstruction(lang)
  
  let contextualPrompt = basePrompt
  
  // 添加语言特定的内容类型
  if (contentType) {
    const contentTypeNames = getContentTypeNames(lang)
    const localizedContentType = contentTypeNames[contentType as keyof typeof contentTypeNames] || contentType
    contextualPrompt = contextualPrompt.replace(contentType, localizedContentType)
  }
  
  // 添加语言特定的领域描述
  if (domain) {
    const domainNames = getProgrammingDomainNames(lang)
    const localizedDomain = domainNames[domain as keyof typeof domainNames] || domain
    contextualPrompt = contextualPrompt.replace(domain, localizedDomain)
  }
  
  // 添加语言特定的级别描述
  if (level) {
    const levelNames = getSkillLevelNames(lang)
    const localizedLevel = levelNames[level as keyof typeof levelNames] || level
    contextualPrompt = contextualPrompt.replace(level, localizedLevel)
  }
  
  return `${languageInstruction}\n\n${contextualPrompt}`
}

/**
 * 生成语言特定的评估提示词前缀
 */
export const getAssessmentPromptPrefix = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `As a programming education expert, please conduct a comprehensive ability assessment. Generate all content in English.`
  } else {
    return `作为编程教育专家，请进行全面的能力评估。所有内容都用中文生成。`
  }
}

/**
 * 生成语言特定的学习路径提示词前缀
 */
export const getPathPlanPromptPrefix = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `As a learning path design expert, please create a personalized learning path. All content must be in English.`
  } else {
    return `作为学习路径设计专家，请创建个性化学习路径。所有内容必须用中文。`
  }
}

/**
 * 生成语言特定的课程内容提示词前缀
 */
export const getCourseContentPromptPrefix = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `As an experienced programming content creator, please generate high-quality course content. All content must be in English.`
  } else {
    return `作为资深的编程教育内容创作者，请生成高质量的课程内容。所有内容必须用中文。`
  }
}

/**
 * 为AI助手对话添加语言指令
 */
export const createAssistantLanguagePrompt = (userMessage: string, language?: Language): string => {
  const lang = language || getCurrentLanguage()
  const systemInstruction = getLanguageSystemPrompt(lang)
  
  return `${systemInstruction}\n\nUser: ${userMessage}`
}

/**
 * 语言特定的JSON输出指令
 */
export const getJSONOutputInstruction = (language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  if (lang === 'en') {
    return `Please provide your response in JSON format. All text content within the JSON must be in English.`
  } else {
    return `请以JSON格式提供回答。JSON中的所有文本内容都必须是中文。`
  }
}

/**
 * 根据语言获取错误消息
 */
export const getErrorMessage = (errorKey: string, language?: Language): string => {
  const lang = language || getCurrentLanguage()
  
  const errorMessages = {
    en: {
      network_error: 'Network connection failed. Please check your internet connection.',
      ai_service_error: 'AI service is temporarily unavailable. Please try again later.',
      parsing_error: 'Failed to parse AI response. Please try regenerating.',
      invalid_input: 'Invalid input provided. Please check your data.',
      generation_failed: 'Content generation failed. Please try again.',
      assessment_failed: 'Ability assessment failed. Please try again.',
      path_generation_failed: 'Learning path generation failed. Please try again.'
    },
    zh: {
      network_error: '网络连接失败。请检查您的网络连接。',
      ai_service_error: 'AI服务暂时不可用。请稍后重试。',
      parsing_error: '解析AI响应失败。请尝试重新生成。',
      invalid_input: '输入无效。请检查您的数据。',
      generation_failed: '内容生成失败。请重试。',
      assessment_failed: '能力评估失败。请重试。',
      path_generation_failed: '学习路径生成失败。请重试。'
    }
  }
  
  return errorMessages[lang][errorKey as keyof typeof errorMessages[typeof lang]] || 
         errorMessages[lang].generation_failed
} 