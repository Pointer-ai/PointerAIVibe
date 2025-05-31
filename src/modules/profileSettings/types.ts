/**
 * Profile 设置模块类型定义
 */

export type AIModel = 'openai' | 'claude' | 'qwen'

export interface ModelParams {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stopSequences?: string[]
  systemPrompt?: string
}

export interface APIConfig {
  model: AIModel
  key: string
  specificModel: string  // 具体的模型名称，如 gpt-4o, claude-3-5-sonnet 等
  params: ModelParams
}

export interface ActivityRecord {
  id: string
  type: 'assessment' | 'goal_set' | 'course_view' | 'code_run' | 'profile_update' | 'function_call' | 'ai_chat' | 'data_operation'
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
    name: 'OpenAI',
    description: '领先的大语言模型，功能强大',
    keyHint: 'sk-...',
    apiUrl: 'https://api.openai.com',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '最新多模态模型，支持图像和文本' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '轻量版多模态模型，速度更快' },
      { id: 'o1', name: 'OpenAI o1', description: '推理能力增强的模型' },
      { id: 'o1-mini', name: 'OpenAI o1 Mini', description: '轻量版推理模型' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能文本模型' },
      { id: 'gpt-4', name: 'GPT-4', description: '经典高质量模型' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '性价比优秀的快速模型' }
    ],
    supportedParams: ['temperature', 'maxTokens', 'topP', 'presencePenalty', 'frequencyPenalty', 'stopSequences']
  },
  claude: {
    name: 'Claude (Anthropic)',
    description: '安全可靠的对话AI，理解能力强',
    keyHint: 'sk-ant-...',
    apiUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (New)', description: '最新升级版，支持计算机使用' },
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', description: '平衡性能与速度的优秀模型' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速响应的轻量模型' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强推理能力的旗舰模型' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: '平衡的中等性能模型' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速经济的基础模型' }
    ],
    supportedParams: ['temperature', 'maxTokens', 'topP', 'topK', 'stopSequences', 'systemPrompt']
  },
  qwen: {
    name: '通义千问 (阿里)',
    description: '中文优化的大语言模型',
    keyHint: 'sk-...',
    apiUrl: 'https://dashscope.aliyuncs.com',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', description: '最强性能的旗舰模型' },
      { id: 'qwen-max-longcontext', name: 'Qwen Max (长上下文)', description: '支持长文本处理' },
      { id: 'qwen-plus', name: 'Qwen Plus', description: '平衡性能的标准模型' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速响应的经济模型' },
      { id: 'qwen-coder-plus', name: 'Qwen Coder Plus', description: '代码专用优化模型' },
      { id: 'qwen-math-plus', name: 'Qwen Math Plus', description: '数学推理专用模型' }
    ],
    supportedParams: ['temperature', 'maxTokens', 'topP', 'topK', 'presencePenalty', 'stopSequences']
  }
}

export const PARAM_DEFINITIONS = {
  temperature: {
    name: '创造性 (Temperature)',
    description: '控制输出的随机性，值越高越有创意',
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.7
  },
  maxTokens: {
    name: '最大令牌数 (Max Tokens)',
    description: '限制生成内容的长度',
    min: 1,
    max: 4096,
    step: 1,
    default: 1000
  },
  topP: {
    name: '核采样 (Top P)',
    description: '控制词汇选择的多样性',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.9
  },
  topK: {
    name: '候选词数量 (Top K)',
    description: '限制每步考虑的词汇数量',
    min: 1,
    max: 100,
    step: 1,
    default: 40
  },
  presencePenalty: {
    name: '存在惩罚 (Presence Penalty)',
    description: '减少重复主题的概率',
    min: -2,
    max: 2,
    step: 0.1,
    default: 0
  },
  frequencyPenalty: {
    name: '频率惩罚 (Frequency Penalty)',
    description: '减少重复词汇的概率',
    min: -2,
    max: 2,
    step: 0.1,
    default: 0
  }
}

export const ACTIVITY_TYPE_LABELS = {
  assessment: '能力评估',
  goal_set: '目标设定',
  course_view: '课程学习',
  code_run: '代码运行',
  profile_update: '资料更新',
  function_call: 'AI工具调用',
  ai_chat: 'AI对话',
  data_operation: '数据操作'
} 