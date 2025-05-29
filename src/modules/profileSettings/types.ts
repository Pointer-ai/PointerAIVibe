/**
 * Profile 设置模块类型定义
 */

export type AIModel = 'openai' | 'claude' | 'qwen'

export interface APIConfig {
  model: AIModel
  key: string
}

export interface ActivityRecord {
  id: string
  type: 'assessment' | 'goal_set' | 'course_view' | 'code_run' | 'profile_update'
  action: string
  timestamp: string
  details?: Record<string, any>
}

export interface ProfileSettings {
  apiConfig: APIConfig
  preferences: {
    theme?: 'light' | 'dark'
    language?: 'zh' | 'en'
    notificationEnabled?: boolean
  }
  activityHistory: ActivityRecord[]
}

export const AI_MODEL_INFO = {
  openai: {
    name: 'OpenAI GPT',
    description: '强大的通用语言模型',
    keyHint: 'sk-...',
    apiUrl: 'https://api.openai.com',
    models: ['gpt-4', 'gpt-3.5-turbo']
  },
  claude: {
    name: 'Claude',
    description: 'Anthropic 的安全对话 AI',
    keyHint: 'sk-ant-...',
    apiUrl: 'https://api.anthropic.com',
    models: ['claude-3-opus', 'claude-3-sonnet']
  },
  qwen: {
    name: '通义千问',
    description: '阿里云的中文优化模型',
    keyHint: 'sk-...',
    apiUrl: 'https://dashscope.aliyuncs.com',
    models: ['qwen-max', 'qwen-plus']
  }
}

export const ACTIVITY_TYPE_LABELS = {
  assessment: '能力评估',
  goal_set: '目标设定',
  course_view: '课程学习',
  code_run: '代码运行',
  profile_update: '资料更新'
} 