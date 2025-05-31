// AI Assistant 相关类型定义

export interface AIAssistantState {
  isActive: boolean
  isOpen: boolean
  isAnimating: boolean
  hasKeywordsHighlighted: boolean
  isUserDisabled: boolean  // 用户是否主动禁用了助手
  currentSessionId?: string
  sessions: ChatSession[]
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  keyword?: string  // 如果是通过关键词触发的消息
  isLoading?: boolean
  // Agent 模式扩展字段
  toolsUsed?: string[]  // 使用的AI工具列表
  suggestions?: string[]  // AI建议列表
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  lastActivity: Date
  trigger?: 'manual' | 'keyword'  // 触发方式
  keyword?: string  // 触发的关键词（如果是关键词触发）
  isActive?: boolean  // 是否为当前活跃session
}

export interface LearningProgress {
  keywordQueries: Record<string, {
    count: number
    lastQueried: Date
    contexts: string[]
  }>
  chatSessions: ChatSession[]
  totalInteractions: number
  lastActivity: Date
}

export interface AssistantConfig {
  apiKey: string
  model: 'openai' | 'claude' | 'qwen'
  specificModel: string
  params: any
}

// 计算机专业关键词库
export const CS_KEYWORDS = [
  // 编程语言
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Vue', 'Angular',
  'Node.js', 'Express', 'Spring', 'Django', 'Flask', 'Laravel',
  
  // 数据结构与算法
  '数组', '链表', '栈', '队列', '树', '图', '哈希表', '二叉树', '排序', '搜索',
  '时间复杂度', '空间复杂度', '递归', '动态规划', '贪心算法',
  
  // 数据库
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', '索引', '事务', '主键', '外键',
  '数据库设计', '范式', 'NoSQL',
  
  // 网络与系统
  'HTTP', 'HTTPS', 'TCP', 'UDP', 'IP', 'DNS', 'CDN', 'API', 'RESTful', 'GraphQL',
  '负载均衡', '缓存', '分布式', '微服务', 'Docker', 'Kubernetes',
  
  // 前端技术
  'HTML', 'CSS', 'DOM', 'BOM', 'AJAX', 'WebSocket', 'PWA', 'SPA', 'SSR', 'CSR',
  'Webpack', 'Vite', 'Babel', 'TypeScript', 'Sass', 'Less',
  
  // 后端技术
  'MVC', 'MVP', 'MVVM', '中间件', 'ORM', 'JWT', 'OAuth', '鉴权', '认证',
  '服务器', '云计算', 'AWS', 'Azure', '阿里云',
  
  // 软件工程
  '敏捷开发', 'Scrum', '测试驱动开发', '单元测试', '集成测试', '版本控制', 'Git',
  'CI/CD', 'DevOps', '代码评审', '重构',
  
  // 人工智能
  '机器学习', '深度学习', '神经网络', 'AI', '自然语言处理', '计算机视觉',
  'TensorFlow', 'PyTorch', '模型训练', '特征工程',
  
  // 安全
  'XSS', 'CSRF', 'SQL注入', 'HTTPS', '加密', '哈希', '数字签名', '防火墙',
  
  // 其他
  '设计模式', '单例模式', '工厂模式', '观察者模式', '装饰器模式',
  '线程', '进程', '并发', '并行', '锁', '死锁'
] 