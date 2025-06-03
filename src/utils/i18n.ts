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

import { useState } from 'react'

export type Language = 'zh' | 'en'

// 语言存储键
const LANGUAGE_STORAGE_KEY = 'pointer-ai-language'

// 获取当前语言
export const getCurrentLanguage = (): Language => {
  if (typeof window === 'undefined') return 'zh'
  
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && (stored === 'zh' || stored === 'en')) {
    return stored as Language
  }
  
  // 检测浏览器语言
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  
  return 'zh' // 默认中文
}

// 设置语言
export const setLanguage = (lang: Language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  // 更新HTML标签的lang属性
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  // 更新页面标题
  updatePageTitle(lang)
}

// 更新页面标题
const updatePageTitle = (lang: Language) => {
  const titles = {
    zh: 'Pointer.ai - AI Native 编程教育平台',
    en: 'Pointer.ai - AI Native Programming Education Platform'
  }
  document.title = titles[lang]
}

// 翻译对象类型
export interface Translations {
  // 通用
  common: {
    loading: string
    error: string
    success: string
    confirm: string
    cancel: string
    delete: string
    edit: string
    save: string
    close: string
    back: string
    next: string
    previous: string
    home: string
    refresh: string
    copy: string
    export: string
    import: string
    search: string
    filter: string
    sort: string
    more: string
    less: string
    yes: string
    no: string
    unknown: string
    processing: string
    completed: string
    failed: string
    pending: string
    active: string
    inactive: string
    paused: string
    cancelled: string
    draft: string
    archived: string
    frozen: string
  }
  
  // 导航和布局
  navigation: {
    dashboard: string
    profile: string
    abilityAssess: string
    goalSetting: string
    pathPlan: string
    courseContent: string
    codeRunner: string
    profileSettings: string
    dataInspector: string
    agentDemo: string
    backToConsole: string
    returnHome: string
    logout: string
  }
  
  // 首页
  landing: {
    title: string
    subtitle: string
    getStarted: string
    continueLeaning: string
    learnMore: string
    login: string
    
    // 轮播内容
    slides: {
      evolution: {
        title: string
        subtitle: string
        description: string
      }
      personalized: {
        title: string
        subtitle: string
        description: string
      }
      dynamic: {
        title: string
        subtitle: string
        description: string
      }
      aiSquared: {
        title: string
        subtitle: string
        description: string
      }
      apikey: {
        title: string
        subtitle: string
        description: string
      }
    }
    
    // 详细说明段落
    sections: {
      evolution: {
        title: string
        subtitle: string
        description: string
      }
      personalized: {
        title: string
        subtitle: string
        description: string
      }
      dynamic: {
        title: string
        subtitle: string
        description: string
      }
      aiSquared: {
        title: string
        subtitle: string
        description: string
      }
      apikey: {
        title: string  
        subtitle: string
        description: string
      }
    }
  }
  
  // 仪表板
  dashboard: {
    title: string
    welcome: string
    welcomeBack: string
    startJourney: string
    startJourneyDesc: string
    startAssessment: string
    quickActions: string
    learningProgress: string
    recentActivities: string
    noActivities: string
    noGoalsYet: string
    createFirstGoal: string
    learningGoals: string
    learningPaths: string
    courseUnits: string
    total: string
    goals: string
    paths: string
    completed: string
    current: string
    progress: string
    nodes: string
    availableUnits: string
    latest: string
    abilityAssessDesc: string
    goalSettingDesc: string
    pathPlanDesc: string
    courseContentDesc: string
    codeRunnerDesc: string
    dataInspectorDesc: string
    pendingAssessment: string
    available: string
    developed: string
    debugTool: string
    inDevelopment: string
    settings: string
    selectModule: string
    currentAbilityScore: string
  }
  
  // 能力评估
  abilityAssess: {
    title: string
    description: string
    uploadResume: string
    completeQuestionnaire: string
    viewResult: string
    generatePlan: string
    exportReport: string
    overallScore: string
    skillGaps: string
    recommendations: string
    improvementPlan: string
    intelligentPlan: string
    advancedPlan: string
    baseOnAssessment: string
    advancedLearning: string
    goals: string
    hours: string
    months: string
    targetImprovement: string
    architecturalProjects: string
    nextStep: string
    personalizedPlan: string
    tip: string
    tipDescription: string
    dimensions: {
      programming: string
      algorithm: string
      project: string
      systemDesign: string
      communication: string
      programmingFull: string
      algorithmFull: string
      projectFull: string
      systemDesignFull: string
      communicationFull: string
    }
  }
  
  // 目标设定
  goalSetting: {
    title: string
    description: string
    newGoal: string
    refresh: string
    goalStats: string
    totalGoals: string
    activeGoals: string
    completedGoals: string
    pausedGoals: string
    inProgress: string
    completed: string
    paused: string
    cancelled: string
    unknown: string
    // 类别
    categories: {
      frontend: string
      backend: string
      fullstack: string
      automation: string
      ai: string
      mobile: string
      game: string
      data: string
      custom: string
    }
    // 级别
    levels: {
      beginner: string
      intermediate: string
      advanced: string
      expert: string
    }
  }
  
  // 数据检查器
  dataInspector: {
    title: string
    operationGuide: string
    goalOperations: string
    pathOperations: string
    smartSync: string
    realtimeFeedback: string
    confirmDelete: string
    deleteMessage: string
    learningGoal: string
    learningPath: string
    courseUnit: string
    cascadeDeleteWarning: string
    dangerOperation: string
    attention: string
    tipInfo: string
    connected: string
    autoUpgrading: string
    basedOnResume: string
    personalizedCustomized: string
    copiedToClipboard: string
  }
  
  // AI助手
  aiAssistant: {
    title: string
    questionMode: string
    agentMode: string
    assistantSwitch: string
    smartSearch: string
    hello: string
    introduction: string
    howToActivate: string
    step1: string
    step2: string
    step3: string
    searchAnything: string
    keywordLearning: string
    multiChat: string
    learningProgress: string
  }
  
  // 状态文本
  status: {
    active: string
    completed: string
    paused: string
    cancelled: string
    frozen: string
    archived: string
    draft: string
    unknown: string
  }
  
  // 系统消息
  messages: {
    deleteConfirm: string
    deleteSuccess: string
    saveSuccess: string
    updateSuccess: string
    operationSuccess: string
    operationFailed: string
    networkError: string
    invalidInput: string
    accessDenied: string
    fileUploadSuccess: string
    fileUploadFailed: string
  }
  
  // 表单和输入
  forms: {
    required: string
    optional: string
    placeholder: string
    selectOption: string
    enterText: string
    chooseFile: string
    submit: string
    reset: string
    validate: string
  }
}

// 中文翻译
const zhTranslations: Translations = {
  common: {
    loading: '加载中',
    error: '错误',
    success: '成功',
    confirm: '确认',
    cancel: '取消', 
    delete: '删除',
    edit: '编辑',
    save: '保存',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    home: '首页',
    refresh: '刷新',
    copy: '复制',
    export: '导出',
    import: '导入',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    more: '更多',
    less: '收起',
    yes: '是',
    no: '否',
    unknown: '未知',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    pending: '待处理',
    active: '进行中',
    inactive: '未激活',
    paused: '已暂停',
    cancelled: '已取消',
    draft: '草稿',
    archived: '已归档',
    frozen: '已冻结'
  },
  
  navigation: {
    dashboard: '控制台',
    profile: 'Profile',
    abilityAssess: '能力评估',
    goalSetting: '目标设定',
    pathPlan: '路径规划',
    courseContent: '课程内容',
    codeRunner: '代码运行器',
    profileSettings: 'Profile 设置',
    dataInspector: '数据检查器',
    agentDemo: 'Agent Demo',
    backToConsole: '返回控制台',
    returnHome: '返回首页',
    logout: '退出登录'
  },
  
  landing: {
    title: 'Pointer.ai',
    subtitle: 'AI Native 编程教育平台',
    getStarted: '开始学习之旅',
    continueLeaning: '继续学习',
    learnMore: '了解更多',
    login: '登录',
    
    slides: {
      evolution: {
        title: '随AI进化',
        subtitle: '自动升级的学习平台',
        description: '随着大语言模型的不断进化，我们的平台自动获得更强的教学能力。今天学不懂的概念，明天可能就有更好的解释方式。'
      },
      personalized: {
        title: '千人千面',
        subtitle: '专属定制的学习体验',
        description: '基于你的简历、目标和学习反馈，AI动态生成完全个性化的学习内容。每个人的学习路径都是独一无二的。'
      },
      dynamic: {
        title: '动态生成',
        subtitle: '实时创建的学习内容',
        description: '不是预制的课程，而是根据最新技术趋势和你的实际需求，AI实时生成的新鲜内容。永远保持前沿。'
      },
      aiSquared: {
        title: 'AI 平方',
        subtitle: '连网站都是AI生成的',
        description: '本网站完全基于AI Coding生成，体验AI²的产品力量。从学习平台到平台本身，全程AI驱动开发。'
      },
      apikey: {
        title: '一键启动',
        subtitle: '只需API Key即可开始',
        description: '无需复杂配置，只要提供大语言模型的API Key，就能立即享受最智能的编程教育体验。'
      }
    },
    
    sections: {
      evolution: {
        title: '随AI模型自动进化',
        subtitle: '学习能力持续升级',
        description: '我们的平台直接连接最新的大语言模型，随着AI技术的进步，教学质量自动提升。今天解决不了的问题，明天可能就有更好的答案。'
      },
      personalized: {
        title: '千人千面，专属定制学习',
        subtitle: '基于简历的智能分析',
        description: '上传简历，AI分析你的技能背景、工作经验和学习目标，为你量身定制独一无二的学习路径。每个人的编程之旅都不相同。'
      },
      dynamic: {
        title: '动态内容，永远新鲜',
        subtitle: '实时生成的学习材料',
        description: '告别过时的预制课程。我们根据最新的技术趋势、你的学习进度和实际需求，实时生成最适合的学习内容。'
      },
      aiSquared: {
        title: 'AI² - 平台本身就是AI的作品',
        subtitle: '体验完全AI驱动的产品',
        description: '这个网站完全由AI编程生成，从界面设计到核心功能，展示了AI在软件开发领域的强大能力。'
      },
      apikey: {
        title: '一键启动智能学习',
        subtitle: '简单配置，极致体验',
        description: '只需要一个API Key，就能解锁完整的AI编程教育体验。无需复杂设置，即刻开始你的智能学习之旅。'
      }
    }
  },
  
  dashboard: {
    title: '控制台',
    welcome: '欢迎',
    welcomeBack: '欢迎回来，',
    startJourney: '开始你的学习之旅',
    startJourneyDesc: '请先完成能力评估，获取个性化学习建议',
    startAssessment: '开始评估',
    quickActions: '快速操作',
    learningProgress: '学习进度',
    recentActivities: '最近活动',
    noActivities: '暂无活动记录',
    noGoalsYet: '还没有学习目标',
    createFirstGoal: '创建第一个目标',
    learningGoals: '学习目标',
    learningPaths: '学习路径',
    courseUnits: '课程单元',
    total: '总数',
    goals: '个目标',
    paths: '个路径',
    completed: '已完成',
    current: '进行中',
    progress: '进度',
    nodes: '节点',
    availableUnits: '可用单元',
    latest: '最新',
    abilityAssessDesc: '通过简历或问卷评估你的编程能力',
    goalSettingDesc: '设定学习目标，智能激活管理',
    pathPlanDesc: 'AI智能路径规划与可视化管理',
    courseContentDesc: 'AI生成的交互式编程课程',
    codeRunnerDesc: '专业代码编辑器，支持Python/JS/C++',
    dataInspectorDesc: '验证AI工具调用和数据存储',
    pendingAssessment: '待评估',
    available: '可使用',
    developed: '已开发',
    debugTool: '调试工具',
    inDevelopment: '待开发',
    settings: '设置',
    selectModule: '选择一个模块开始你的个性化学习之旅',
    currentAbilityScore: '当前能力评分'
  },
  
  abilityAssess: {
    title: '🧠 智能能力评估',
    description: '通过AI分析您的简历或完成技能问卷，获得个性化的能力评估报告和智能提升计划',
    uploadResume: '上传简历',
    completeQuestionnaire: '完成问卷',
    viewResult: '查看结果',
    generatePlan: '生成计划',
    exportReport: '导出评估报告',
    overallScore: '综合得分',
    skillGaps: '技能差距',
    recommendations: '建议',
    improvementPlan: '提升计划',
    intelligentPlan: '🚀 智能提升计划',
    advancedPlan: '🚀 智能高级提升计划',
    baseOnAssessment: '基于您的能力评估，AI 为您量身定制的学习路径和目标',
    advancedLearning: '基于您的高级技能水平，AI 为您量身定制的架构级学习路径和专业目标',
    goals: '个目标',
    hours: '小时',
    months: '个月',
    targetImprovement: '目标提升',
    architecturalProjects: '💼 架构级项目',
    nextStep: '🚀 下一步行动',
    personalizedPlan: '基于您的能力评估结果，我们可以为您生成个性化的智能提升计划',
    tip: '💡 提示',
    tipDescription: '如果您的技能有所提升或学习偏好发生变化，可以在计划页面重新生成更适合的学习计划',
    dimensions: {
      programming: '编程',
      algorithm: '算法',
      project: '项目',
      systemDesign: '设计',
      communication: '协作',
      programmingFull: '编程基本功',
      algorithmFull: '算法能力',
      projectFull: '项目能力',
      systemDesignFull: '系统设计',
      communicationFull: '沟通协作'
    }
  },
  
  goalSetting: {
    title: '🎯 目标设定',
    description: '设定和管理你的学习目标，分析与当前能力的差距',
    newGoal: '新建目标',
    refresh: '刷新',
    goalStats: '目标统计',
    totalGoals: '总目标',
    activeGoals: '进行中',
    completedGoals: '已完成',
    pausedGoals: '已暂停',
    inProgress: '进行中',
    completed: '已完成', 
    paused: '已暂停',
    cancelled: '已取消',
    unknown: '未知',
    categories: {
      frontend: '前端开发',
      backend: '后端开发', 
      fullstack: '全栈开发',
      automation: '自动化测试',
      ai: '人工智能',
      mobile: '移动开发',
      game: '游戏开发',
      data: '数据科学',
      custom: '自定义'
    },
    levels: {
      beginner: '初级',
      intermediate: '中级', 
      advanced: '高级',
      expert: '专家'
    }
  },
  
  dataInspector: {
    title: '数据检查器',
    operationGuide: '💡 状态管理操作指南',
    goalOperations: '🎯 目标操作：点击目标卡片展开操作按钮，支持暂停、完成、取消、重新激活等操作',
    pathOperations: '🛤️ 路径操作：每个路径都有对应的状态管理按钮，可以灵活控制学习进度',
    smartSync: '🔄 智能同步：目标状态变化会自动同步相关路径，保持数据一致性',
    realtimeFeedback: '📊 实时反馈：所有操作都会显示结果消息，并更新数据统计',
    confirmDelete: '确认删除',
    deleteMessage: '确定要删除这个',
    learningGoal: '学习目标',
    learningPath: '学习路径',
    courseUnit: '课程单元',
    cascadeDeleteWarning: '删除目标会同时删除相关的学习路径和课程内容。',
    dangerOperation: '高危操作',
    attention: '注意事项',
    tipInfo: '提示信息',
    connected: '已连接',
    autoUpgrading: '教学能力自动升级中...',
    basedOnResume: '基于你的简历智能生成',
    personalizedCustomized: '千人千面，专属定制学习',
    copiedToClipboard: '已复制到剪贴板'
  },
  
  aiAssistant: {
    title: '悟语 AI助手',
    questionMode: '💬 问答',
    agentMode: '🤖 Agent',
    assistantSwitch: '助手开关',
    smartSearch: '✨随意搜🔍',
    hello: '你好！',
    introduction: '你好！我是悟语，你的专属AI学习伙伴。选中页面任意文字，我可以帮你解释和分析。',
    howToActivate: '如何激活我：',
    step1: '创建或登录Profile',
    step2: '在设置中配置AI API Key',
    step3: '我就会变成彩色并为你服务！',
    searchAnything: '搜索任意内容',
    keywordLearning: '关键词学习',
    multiChat: '多对话管理',
    learningProgress: '学习进度追踪'
  },
  
  status: {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
    frozen: '已冻结',
    archived: '已归档',
    draft: '草稿',
    unknown: '未知'
  },
  
  messages: {
    deleteConfirm: '确认删除',
    deleteSuccess: '删除成功',
    saveSuccess: '保存成功',
    updateSuccess: '更新成功',
    operationSuccess: '操作成功',
    operationFailed: '操作失败',
    networkError: '网络错误',
    invalidInput: '输入无效',
    accessDenied: '访问被拒绝',
    fileUploadSuccess: '文件上传成功',
    fileUploadFailed: '文件上传失败'
  },
  
  forms: {
    required: '必填',
    optional: '可选',
    placeholder: '请输入',
    selectOption: '请选择',
    enterText: '输入文本',
    chooseFile: '选择文件',
    submit: '提交',
    reset: '重置',
    validate: '验证'
  }
}

// 英文翻译
const enTranslations: Translations = {
  common: {
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    home: 'Home',
    refresh: 'Refresh',
    copy: 'Copy',
    export: 'Export',
    import: 'Import',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    more: 'More',
    less: 'Less',
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending',
    active: 'Active',
    inactive: 'Inactive',
    paused: 'Paused',
    cancelled: 'Cancelled',
    draft: 'Draft',
    archived: 'Archived',
    frozen: 'Frozen'
  },
  
  navigation: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    abilityAssess: 'Ability Assessment',
    goalSetting: 'Goal Setting',
    pathPlan: 'Path Planning',
    courseContent: 'Course Content',
    codeRunner: 'Code Runner',
    profileSettings: 'Profile Settings',
    dataInspector: 'Data Inspector',
    agentDemo: 'Agent Demo',
    backToConsole: 'Back to Console',
    returnHome: 'Return Home',
    logout: 'Logout'
  },
  
  landing: {
    title: 'Pointer.ai',
    subtitle: 'AI Native Programming Education Platform',
    getStarted: 'Get Started',
    continueLeaning: 'Continue Learning',
    learnMore: 'Learn More',
    login: 'Login',
    
    slides: {
      evolution: {
        title: 'Evolve with AI',
        subtitle: 'Auto-upgrading Learning Platform',
        description: 'As large language models continuously evolve, our platform automatically gains stronger teaching capabilities. Concepts you can\'t understand today might have better explanations tomorrow.'
      },
      personalized: {
        title: 'Personalized',
        subtitle: 'Customized Learning Experience',
        description: 'Based on your resume, goals, and learning feedback, AI dynamically generates completely personalized learning content. Everyone\'s learning path is unique.'
      },
      dynamic: {
        title: 'Dynamic Generation',
        subtitle: 'Real-time Created Learning Content',
        description: 'Not pre-made courses, but fresh content generated in real-time by AI based on the latest technology trends and your actual needs. Always stay cutting-edge.'
      },
      aiSquared: {
        title: 'AI Squared',
        subtitle: 'Even the Website is AI-Generated',
        description: 'This website is completely generated by AI Coding, experiencing the power of AI² products. From learning platform to the platform itself, fully AI-driven development.'
      },
      apikey: {
        title: 'One-Click Start',
        subtitle: 'Just Need API Key to Begin',
        description: 'No complex configuration needed, just provide a large language model API Key, and you can immediately enjoy the smartest programming education experience.'
      }
    },
    
    sections: {
      evolution: {
        title: 'Auto Evolution with AI Models',
        subtitle: 'Continuously Upgrading Learning Capabilities',
        description: 'Our platform connects directly to the latest large language models. As AI technology advances, teaching quality automatically improves. Problems unsolvable today might have better answers tomorrow.'
      },
      personalized: {
        title: 'Personalized, Customized Learning',
        subtitle: 'Intelligent Analysis Based on Resume',
        description: 'Upload your resume, AI analyzes your skill background, work experience and learning goals, creating a unique learning path tailored just for you. Everyone\'s programming journey is different.'
      },
      dynamic: {
        title: 'Dynamic Content, Always Fresh',
        subtitle: 'Real-time Generated Learning Materials',
        description: 'Say goodbye to outdated pre-made courses. We generate the most suitable learning content in real-time based on the latest technology trends, your learning progress, and actual needs.'
      },
      aiSquared: {
        title: 'AI² - The Platform Itself is AI\'s Creation',
        subtitle: 'Experience Fully AI-Driven Products',
        description: 'This website is completely generated by AI programming, from interface design to core functionality, showcasing AI\'s powerful capabilities in software development.'
      },
      apikey: {
        title: 'One-Click Smart Learning',
        subtitle: 'Simple Configuration, Ultimate Experience',
        description: 'Just need one API Key to unlock the complete AI programming education experience. No complex setup required, start your intelligent learning journey immediately.'
      }
    }
  },
  
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    welcomeBack: 'Welcome Back',
    startJourney: 'Start Your Learning Journey',
    startJourneyDesc: 'Please complete the ability assessment first to get personalized learning recommendations',
    startAssessment: 'Start Assessment',
    quickActions: 'Quick Actions',
    learningProgress: 'Learning Progress',
    recentActivities: 'Recent Activities',
    noActivities: 'No activity records yet',
    noGoalsYet: 'No learning goals yet',
    createFirstGoal: 'Create your first goal',
    learningGoals: 'learning goals',
    learningPaths: 'learning paths',
    courseUnits: 'course units',
    total: 'total',
    goals: 'goals',
    paths: 'paths',
    completed: 'completed',
    current: 'current',
    progress: 'progress',
    nodes: 'nodes',
    availableUnits: 'available units',
    latest: 'latest',
    abilityAssessDesc: 'Assess your programming abilities through resume or questionnaire',
    goalSettingDesc: 'Set learning goals with intelligent activation management',
    pathPlanDesc: 'AI-powered intelligent path planning and visualization management',
    courseContentDesc: 'AI-generated interactive programming courses',
    codeRunnerDesc: 'Professional code editor supporting Python/JS/C++',
    dataInspectorDesc: 'Verify AI tool calls and data storage',
    pendingAssessment: 'Pending Assessment',
    available: 'Available',
    developed: 'Developed',
    debugTool: 'Debug Tool',
    inDevelopment: 'In Development',
    settings: 'Settings',
    selectModule: 'Choose a module to start your personalized learning journey',
    currentAbilityScore: 'Current Ability Score'
  },
  
  abilityAssess: {
    title: '🧠 Intelligent Ability Assessment',
    description: 'Get personalized ability assessment reports and intelligent improvement plans by AI analyzing your resume or completing skill questionnaires',
    uploadResume: 'Upload Resume',
    completeQuestionnaire: 'Complete Questionnaire',
    viewResult: 'View Results',
    generatePlan: 'Generate Plan',
    exportReport: 'Export Assessment Report',
    overallScore: 'Overall Score',
    skillGaps: 'Skill Gaps',
    recommendations: 'Recommendations',
    improvementPlan: 'Improvement Plan',
    intelligentPlan: '🚀 Intelligent Improvement Plan',
    advancedPlan: '🚀 Advanced Intelligent Improvement Plan',
    baseOnAssessment: 'Based on your ability assessment, AI has customized learning paths and goals for you',
    advancedLearning: 'Based on your advanced skill level, AI has customized architectural-level learning paths and professional goals for you',
    goals: ' goals',
    hours: ' hours',
    months: ' months',
    targetImprovement: 'Target improvement',
    architecturalProjects: '💼 Architectural Projects',
    nextStep: '🚀 Next Steps',
    personalizedPlan: 'Based on your ability assessment results, we can generate a personalized intelligent improvement plan for you',
    tip: '💡 Tip',
    tipDescription: 'If your skills have improved or learning preferences have changed, you can regenerate a more suitable learning plan on the plan page',
    dimensions: {
      programming: 'Programming',
      algorithm: 'Algorithm',
      project: 'Project',
      systemDesign: 'System Design',
      communication: 'Communication',
      programmingFull: 'Programming Full Stack',
      algorithmFull: 'Algorithm Full Stack',
      projectFull: 'Project Full Stack',
      systemDesignFull: 'System Design Full Stack',
      communicationFull: 'Communication Full Stack'
    }
  },
  
  goalSetting: {
    title: '🎯 Goal Setting',
    description: 'Set and manage your learning goals, analyze gaps with current abilities',
    newGoal: 'New Goal',
    refresh: 'Refresh',
    goalStats: 'Goal Statistics',
    totalGoals: 'Total Goals',
    activeGoals: 'Active',
    completedGoals: 'Completed',
    pausedGoals: 'Paused',
    inProgress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
    cancelled: 'Cancelled',
    unknown: 'Unknown',
    categories: {
      frontend: 'Frontend Development',
      backend: 'Backend Development',
      fullstack: 'Full-stack Development',
      automation: 'Test Automation',
      ai: 'Artificial Intelligence',
      mobile: 'Mobile Development',
      game: 'Game Development',
      data: 'Data Science',
      custom: 'Custom'
    },
    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert'
    }
  },
  
  dataInspector: {
    title: 'Data Inspector',
    operationGuide: '💡 Status Management Operation Guide',
    goalOperations: '🎯 Goal Operations: Click goal cards to expand operation buttons, support pause, complete, cancel, reactivate and other operations',
    pathOperations: '🛤️ Path Operations: Each path has corresponding status management buttons to flexibly control learning progress',
    smartSync: '🔄 Smart Sync: Goal status changes automatically sync related paths, maintaining data consistency',
    realtimeFeedback: '📊 Real-time Feedback: All operations show result messages and update data statistics',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this',
    learningGoal: 'learning goal',
    learningPath: 'learning path',
    courseUnit: 'course unit',
    cascadeDeleteWarning: 'Deleting goals will also delete related learning paths and course content.',
    dangerOperation: 'Dangerous Operation',
    attention: 'Attention',
    tipInfo: 'Tip',
    connected: 'Connected',
    autoUpgrading: 'Teaching capabilities auto-upgrading...',
    basedOnResume: 'Intelligently generated based on your resume',
    personalizedCustomized: 'Personalized, customized learning',
    copiedToClipboard: 'Copied to clipboard'
  },
  
  aiAssistant: {
    title: 'WuYu AI Assistant',
    questionMode: '💬 Q&A',
    agentMode: '🤖 Agent',
    assistantSwitch: 'Assistant Switch',
    smartSearch: '✨Smart Search🔍',
    hello: 'Hello!',
    introduction: 'Hello! I\'m WuYu, your dedicated AI learning companion. Select any text on the page, and I can help you explain and analyze it.',
    howToActivate: 'How to activate me:',
    step1: 'Create or login to Profile',
    step2: 'Configure AI API Key in settings',
    step3: 'I\'ll turn colorful and serve you!',
    searchAnything: 'Search anything',
    keywordLearning: 'Keyword learning',
    multiChat: 'Multi-chat management',
    learningProgress: 'Learning progress tracking'
  },
  
  status: {
    active: 'Active',
    completed: 'Completed',
    paused: 'Paused', 
    cancelled: 'Cancelled',
    frozen: 'Frozen',
    archived: 'Archived',
    draft: 'Draft',
    unknown: 'Unknown'
  },
  
  messages: {
    deleteConfirm: 'Confirm Delete',
    deleteSuccess: 'Delete Successful',
    saveSuccess: 'Save Successful',
    updateSuccess: 'Update Successful',
    operationSuccess: 'Operation Successful',
    operationFailed: 'Operation Failed',
    networkError: 'Network Error',
    invalidInput: 'Invalid Input',
    accessDenied: 'Access Denied',
    fileUploadSuccess: 'File Upload Successful',
    fileUploadFailed: 'File Upload Failed'
  },
  
  forms: {
    required: 'Required',
    optional: 'Optional',
    placeholder: 'Please enter',
    selectOption: 'Please select',
    enterText: 'Enter text',
    chooseFile: 'Choose file',
    submit: 'Submit',
    reset: 'Reset',
    validate: 'Validate'
  }
}

// 翻译数据
const translations = {
  zh: zhTranslations,
  en: enTranslations
}

// 翻译函数
export const t = (key: string, lang?: Language): string => {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split('.')
  let value: any = translations[currentLang]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // 如果找不到翻译，尝试从中文版本获取
      if (currentLang !== 'zh') {
        let fallback: any = translations.zh
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk]
          } else {
            return key // 都找不到就返回key
          }
        }
        return fallback
      }
      return key // 找不到翻译就返回key
    }
  }
  
  return typeof value === 'string' ? value : key
}

// 语言切换Hook
export const useLanguage = () => {
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage())
  
  const switchLanguage = (lang: Language) => {
    setLanguage(lang)
    setCurrentLang(lang)
    // 触发页面重新渲染
    window.location.reload()
  }
  
  const translate = (key: string) => t(key, currentLang)
  
  return {
    currentLanguage: currentLang,
    switchLanguage,
    t: translate
  }
}

// 初始化i18n
export const initI18n = () => {
  const lang = getCurrentLanguage()
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  updatePageTitle(lang)
} 