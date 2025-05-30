# 🧘‍♂️ 悟语 AI Assistant - 全局AI学习助手

## 📋 功能概览

悟语是一个智能的浮动AI学习伙伴，帮助用户理解页面中的专业术语和任意文字内容。

### ✨ 主要功能

1. **🧘‍♂️ 智能激活状态**
   - 自动检测API配置状态
   - 灰色状态（无API或用户禁用）
   - 彩色活跃状态（已配置API）

2. **🔍 智能关键词识别**
   - 自动识别60+计算机专业术语
   - 黄色背景 + 虚线下划线高亮
   - 动态页面内容检测和重新高亮

3. **✨ 随意搜功能**
   - 选中页面任意文字（2-200字符）
   - 显示紫粉渐变的"随意搜"魔法按钮
   - 支持任意内容的AI解析查询
   - 智能位置定位和边界检测

4. **💬 多Tab聊天系统**
   - 支持同时进行多个对话
   - 最多保留10个聊天记录
   - 右侧边栏Tab管理界面
   - 点击关键词或随意搜自动创建新对话
   - 可拖拽聊天窗口

5. **🎯 智能标题生成**
   - 基于用户第一句话自动生成标题
   - 最多20个字符，超出自动截断
   - 关键词触发会话显示术语名称

6. **📊 学习进度追踪**
   - 记录关键词查询历史
   - 统计学习互动次数
   - 显示最常查询的术语
   - 提供个性化学习建议

### 🎯 用户交互流程

#### 激活流程
1. 用户创建Profile并配置API Key
2. 悟语图标从灰色变为彩色
3. 自动开启关键词识别和随意搜

#### 关键词学习
1. 页面自动识别计算机术语并高亮
2. 用户点击高亮关键词
3. 自动创建新的专题对话Tab
4. 悟语提供专业解释
5. 记录学习进度

#### 随意搜学习
1. 用户选中页面任意文字
2. 显示"✨随意搜🔍"魔法按钮
3. 点击按钮自动打开聊天窗口
4. 悟语解释或分析选中文字
5. 智能标题生成和会话管理

#### 多对话管理
- 新建对话：点击 + 按钮
- 切换对话：点击右侧Tab标签
- 删除对话：悬停Tab显示删除按钮
- 最多同时保留10个对话

## 🏗️ 技术实现

### 核心组件

1. **GlobalAIAssistant.tsx** - 主控制组件
   - 状态管理和事件协调
   - 拖拽功能实现
   - 关键词和文本查询处理

2. **MultiTabChat.tsx** - 多Tab聊天界面
   - 右侧边栏Tab管理和切换
   - 消息发送和接收
   - 会话持久化和标题更新

3. **KeywordHighlighter.tsx** - 关键词高亮器
   - DOM遍历和文本处理
   - 事件委托处理点击
   - 动态内容检测

4. **TextSelector.tsx** - 随意搜文本选择器
   - 文本选择事件监听
   - 魔法按钮位置计算
   - 智能边界检测

5. **LearningStats.tsx** - 学习统计展示
   - 进度数据可视化
   - 学习建议生成
   - 历史记录展示

### 服务层 (service.ts)

#### 学习进度管理
```typescript
// 获取学习进度数据
getLearningProgress(): LearningProgress

// 创建新的聊天会话
createChatSession(trigger: 'manual' | 'keyword', keyword?: string): ChatSession

// 更新会话标题（基于第一条用户消息）
updateSessionTitle(session: ChatSession, firstMessage: string): ChatSession

// 记录关键词查询
recordKeywordQuery(keyword: string, context?: string): void

// 获取学习统计
getLearningStats(): LearningStatsData
```

#### AI对话管理
```typescript
// 调用AI API获取回复
getAIResponse(message: string, context?: string): Promise<string>

// 保存聊天会话
saveChatSession(session: ChatSession): void

// 删除聊天会话
deleteChatSession(sessionId: string): void
```

### 数据结构

#### ChatSession - 聊天会话
```typescript
interface ChatSession {
  id: string
  title: string // 智能生成标题
  messages: ChatMessage[]
  createdAt: Date
  lastActivity: Date
  trigger?: 'manual' | 'keyword'  // 触发方式
  keyword?: string  // 触发的关键词
  isActive?: boolean
}
```

#### LearningProgress - 学习进度
```typescript
interface LearningProgress {
  keywordQueries: Record<string, {
    count: number
    lastQueried: Date
    contexts: string[]
  }>
  chatSessions: ChatSession[]
  totalInteractions: number
  lastActivity: Date
}
```

## 🎨 UI/UX设计

### 悟语助手图标状态
- **灰色状态**: 无API配置或用户禁用，显示打坐小僧人🧘‍♂️
- **绿色渐变**: 待机状态，可点击激活
- **蓝紫渐变**: 聊天窗口已打开
- **黄色脉冲**: 关键词识别激活中

### 聊天界面
- **现代化设计**: 圆角、阴影、渐变背景
- **可拖拽**: 标题栏拖拽移动位置
- **右侧Tab管理**: 垂直Tab栏，支持删除
- **状态指示**: 在线状态、加载动画

### 随意搜按钮
- **魔法渐变**: 紫粉色渐变背景
- **浮动定位**: 选中文字上方居中显示
- **动画效果**: fadeInUp动画和hover缩放
- **智能边界**: 自动调整位置避免超出屏幕

### 关键词高亮
- **视觉效果**: 黄色背景 + 虚线下划线
- **交互反馈**: 悬停抬升动画
- **点击提示**: Tooltip显示"点击查看AI解释"

## 📝 使用指南

### 开发者集成
```tsx
import { GlobalAIAssistant } from './components/AIAssistant'

// 在根组件中添加
function App() {
  return (
    <div>
      {/* 其他组件 */}
      <GlobalAIAssistant />
    </div>
  )
}
```

### 用户使用流程
1. **首次使用**: 创建Profile并配置API Key
2. **关键词学习**: 浏览页面，点击高亮词汇
3. **随意搜**: 选中任意文字，点击魔法按钮查询
4. **主动对话**: 点击悟语图标开始新对话
5. **查看进度**: 在设置中查看学习统计

## 🧪 测试覆盖

### 单元测试
- [x] 关键词识别功能
- [x] 文本选择监听
- [x] 聊天消息发送
- [x] 会话状态管理
- [x] 学习进度统计
- [x] 标题自动生成

### 集成测试
- [x] 关键词点击到对话创建流程
- [x] 随意搜到对话创建流程
- [x] 多Tab切换和管理
- [x] 拖拽功能
- [x] API调用错误处理

### 用户体验测试
- [x] 页面内容变化时重新高亮
- [x] 悟语状态自动检测
- [x] 聊天记录持久化
- [x] 移动端适配

## 🔧 配置说明

### API支持
- OpenAI (GPT-4o, GPT-3.5-turbo等)
- Claude (3.5 Sonnet, Opus等)
- 通义千问 (Qwen Max, Plus等)

### 存储结构
- Profile数据: `localStorage` 按Profile隔离
- 聊天记录: 自动保存，最多10个会话
- 学习进度: 累计统计，支持导出

## 🚀 性能优化

1. **懒加载**: 按需初始化AI模型
2. **事件委托**: 高效处理关键词点击
3. **节流防抖**: 避免频繁API调用
4. **内存管理**: 自动清理过期会话
5. **智能边界**: 按钮位置自动调整

## 🔮 未来计划

- [ ] 语音交互支持
- [ ] 个性化关键词库
- [ ] 学习路径推荐
- [ ] 多语言支持
- [ ] 移动端手势操作
- [ ] 快捷键支持（Alt+S唤醒随意搜）
- [ ] 悟语个性化设置