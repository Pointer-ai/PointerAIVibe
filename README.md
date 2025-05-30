# 📚 Pointer.ai
> 零后端 · React 19 · Vite 5 · Pyodide · Tailwind  
> **由 AI & 人类协作开发** – 本 README 是唯一真理源。

## 1. 项目使命
打造一个纯前端的智能编程教育平台，通过 AI 驱动的个性化学习路径，帮助学习者从零基础到独立开发者的成长之旅。无需服务器，所有数据本地存储，支持离线学习。

演示地址：[https://pointer-ai.github.io/PointerAIVibe/](https://pointer-ai.github.io/PointerAIVibe/)

## 2. 功能模块概览
| 模块 | 状态 | 负责人 | 覆盖率 | 简述 |
|------|------|--------|-------|------|
| profile       | ✅ 已完成 | @ai | 100% | 多 Profile 管理，支持密码保护 |
| landingPage   | ✅ 已完成 | @ai | 100% | 苹果风格首页，展示产品特性 |
| dashboard     | ✅ 已完成 | @ai | 100% | 登录后主界面，功能模块入口 |
| profileSettings | ✅ 已完成 | @ai | 95%  | API 配置、模型选择、参数调节、活动记录 |
| abilityAssess | ✅ 已完成 | @ai | 95%  | PDF/文本简历分析、置信度评估、多维度能力评分 |
| goalSetting   | ⏳ 待开发 | @ai | 0%   | 解析目标，生成差距 |
| pathPlan      | ⏳ 待开发 | @ai | 0%   | 生成学习路径 |
| courseContent | ⏳ 待开发 | @ai | 0%   | 生成并展示课程 |
| codeRunner    | ✅ 已完成 | @ai | 95%  | Monaco Editor + Pyodide WASM 环境，语法高亮 + 智能补全 |

> 状态：✅ 已完成｜🚧 开发中｜⏳ 待开发

## 3. 快速开始
```bash
# 安装依赖
pnpm i

# 本地开发
pnpm dev      # 启动开发服务器 http://localhost:5173

# 构建部署
pnpm build    # 生成 dist/ 目录

# 运行测试
pnpm test     # Vitest 单元测试
pnpm test:ui  # 可视化测试界面
```

## 4. 开发规范
1. **代码规范**
   - 文件 ≤ 200 行；函数式组件 + TypeScript
   - 禁止使用 any 类型
   - 所有模块独立目录，便于小上下文 AI 迭代
   
2. **注释规范**
   - 注释写 **为什么**，不要写 **做什么**
   - 复杂逻辑必须有中文注释说明
   
3. **日志规范**
   - 统一使用 `logger.ts`：`log('[模块名] 消息')`
   - 错误使用 `error()`，警告使用 `warn()`
   
4. **存储规范**
   - 持久化统一使用 `storage.ts` API
   - 不直接操作 localStorage

## 5. 测试策略
| 层级 | 工具 | 覆盖目标 |
|------|------|----------|
| 单元   | Vitest + RTL     | 纯函数 / hooks / 组件渲染 |
| 集成   | Cypress Component| 模块交互、Pyodide 初始化 |
| 端到端 | Playwright       | 用户从评估到运行代码完整流程 |

## 6. 本地数据接口
```typescript
interface Profile {
  id: string
  name: string
  hasPassword: boolean
  passwordHash?: string
  createdAt: string
  lastLogin?: string
  avatar?: string
  data: Record<string, any>  // 该 profile 的所有数据
}

interface LocalState {
  profile: UserProfile | null     // 用户能力档案
  goal: string | null            // 学习目标
  path: LearningStep[]           // 学习路径
  lessons: Record<string, Lesson> // 课程内容
  apiConfig: {                   // AI 配置
    model: 'claude' | 'openai' | 'qwen'
    key: string
  }
}
```

## 7. 模块 TODO

### profile ✅
- [x] 设计 Profile 管理界面
- [x] 实现创建、选择、删除 Profile
- [x] 支持密码保护（可选）
- [x] localStorage 存储方案
- [x] Profile 切换功能

### landingPage ✅
- [x] 苹果风格设计
- [x] AI Native 标识展示
- [x] 产品特性介绍
- [x] 目标用户说明
- [x] CTA 按钮引导
- [x] 苹果风格 Profile 切换器（支持头像悬停缩放动画）
- [x] 登录状态下的 Profile 切换功能
- [x] 退出登录功能集成
- [x] 多 Profile 快速切换下拉菜单
- [x] 密码保护状态显示
- [x] 在线状态指示器
- [x] 点击外部关闭下拉菜单
- [x] 与 Dashboard 跳转集成
- [x] 密码保护 Profile 切换验证（弹窗输入密码）

### dashboard ✅
- [x] 登录后主界面
- [x] 功能模块展示
- [x] Profile 信息显示
- [x] 退出登录功能

### profileSettings
- [x] 个人信息展示和编辑（用户名、头像）
- [x] API Key 配置界面
- [x] AI 模型选择（OpenAI/Claude/通义千问）
- [x] API Key 格式验证
- [x] 活动历史记录展示
- [x] 活动记录筛选功能
- [x] 活动记录清除功能
- [x] 与 Dashboard 集成
- [x] 基于 Profile 的配置隔离
- [x] 修改密码功能（支持设置/修改/移除密码）
- [x] 支持最新 AI 模型（GPT-4o、Claude 3.5 Sonnet、Qwen Max 等）
- [x] 具体模型选择界面（支持多个版本）
- [x] 高级参数配置（temperature、maxTokens、topP、topK 等）
- [x] 参数预设模板（创意/平衡/精确模式）
- [x] 参数重置到默认值功能
- [x] 不同服务商的专用参数支持（如 Claude 的 systemPrompt）
- [x] 向后兼容性处理（自动升级旧配置格式）
- [ ] 用户偏好设置（主题/语言/通知）
- [ ] 活动数据统计图表
- [ ] API 使用量统计
- [ ] 配置导入/导出功能

### abilityAssess
- [x] 多维度能力评价体系设计（5大维度，30+细分技能）
- [x] 简历文本分析功能（支持粘贴文本或上传 txt 文件）
- [x] PDF 简历解析（支持上传 PDF 文件并自动提取文本）
- [x] 技能问卷评估功能
- [x] AI 智能评分（调用用户配置的 API Key 和模型）
- [x] 支持 OpenAI/Claude/通义千问 三种 AI 服务
- [x] 置信度评估系统（区分直接证据与推理得出的评分）
- [x] 视觉置信度指示器（虚线显示低置信度分数，带推理标记）
- [x] 能力评估结果展示（雷达图、分数详情）
- [x] 评估报告生成和导出（Markdown 格式）
- [x] 30天提升计划生成
- [x] 评估历史记录
- [x] 简历示例模板
- [x] 活动记录集成
- [ ] 批量评估功能
- [ ] 评估结果对比
- [ ] 技能认证集成

### goalSetting
- [ ] 创建目标输入界面
- [ ] 实现目标智能解析
- [ ] 生成当前能力与目标的差距分析
- [ ] 展示可视化的技能差距图表

### pathPlan
- [ ] 根据能力和目标生成个性化路径
- [ ] 实现学习进度跟踪
- [ ] 支持路径的动态调整
- [ ] 添加里程碑和成就系统

### courseContent
- [ ] 实现 AI 驱动的课程内容生成
- [ ] 支持 Markdown 渲染和代码高亮
- [ ] 集成交互式练习题
- [ ] 添加学习笔记功能

### codeRunner
- [x] 完成 Pyodide 的完整集成
- [x] 实现代码编辑器（支持 Tab 缩进、快捷键运行）
- [x] 支持代码运行结果展示
- [x] 实现执行历史记录
- [x] 支持实时输出显示
- [x] 错误处理和状态管理
- [x] 预置代码示例（5个不同难度）
- [x] 与 Dashboard 集成
- [x] 单元测试覆盖
- [x] **Monaco Editor 集成**：完整的 VS Code 编辑器体验
- [x] **语法高亮**：支持 Python、C++、JavaScript 语法高亮
- [x] **智能代码补全**：三种语言的智能提示和代码片段
- [x] **编辑器优化**：自动括号匹配、智能缩进、代码折叠
- [x] **快捷键支持**：Ctrl/Cmd + Enter 运行代码
- [x] **主题切换**：暗色/亮色主题支持
- [x] **性能优化**：Lazy loading、内存管理、缓存策略
- [x] **测试覆盖**：Monaco Editor 组件的完整单元测试
- [ ] 添加常用 Python 包的预加载（numpy、pandas 等）
- [ ] 支持代码保存和分享
- [ ] 添加更多代码示例
- [ ] 支持多文件编辑
- [ ] 代码格式化功能（Monaco Editor 内置支持）

## 8. 迭代工作流规定  🚦
以下规则确保 *README + TODO* 始终是单一真理源，便于 AI 与人工协同。

### 8.1 迭代节奏
1. **拉分支**：每次开发前从 `main`

## 11. 更新日志

### v0.6.0 (最新)
- 🎨 **Monaco Editor 集成**: 升级代码编辑器为 VS Code 内核，提供专业级编程体验
- ✨ **语法高亮完善**: 支持 Python、C++、JavaScript 完整语法高亮
- 🧠 **智能代码补全**: 三种语言的智能提示、代码片段和参数提示
- ⚡ **编辑器功能增强**: 自动括号匹配、智能缩进、代码折叠、行号显示
- 🎯 **快捷键优化**: Ctrl/Cmd + Enter 快速运行，完整的编辑器快捷键支持
- 🎨 **主题系统**: 支持暗色/亮色主题无缝切换
- 🚀 **性能优化**: Lazy loading、Worker 优化、内存管理改进
- 🧪 **测试覆盖**: 新增 14 个测试用例，确保编辑器功能稳定性
- 📚 **文档完善**: 详细的使用指南和技术文档

### v0.5.0
- 🔐 **密码验证切换**: 在首页 Profile 切换器中添加密码验证功能
- 💡 **智能切换逻辑**: 有密码保护的 Profile 弹出密码输入框，无密码保护的直接切换
- 🎨 **优雅交互设计**: 密码输入框支持显示/隐藏密码，错误提示友好
- ⚡ **即时验证**: 实时验证密码正确性，防止错误切换
- 🧪 **完整测试覆盖**: 新增 7 个测试用例，确保密码验证功能稳定性

### v0.4.0
- ✨ **苹果风格 Profile 切换器**: 新增首页登录后的 profile 切换功能
- 🎨 **头像悬停动画**: 实现苹果风格的头像缩放和阴影效果
- 🔄 **快速切换**: 支持在下拉菜单中快速切换不同 profile
- 🔐 **密码保护指示**: 显示受密码保护的 profile 状态
- 🟢 **在线状态**: 添加绿色在线状态指示器
- 🎯 **点击外部关闭**: 优化用户体验，点击外部自动关闭下拉菜单
- 🔧 **状态刷新修复**: 修复退出登录后页面状态不刷新的问题
- 🧪 **完整测试覆盖**: 新增 AppleProfileSwitcher 和 LandingPage 组件的全面单元测试

### v0.3.0
- ✨ **PDF 简历支持**: 新增 PDF 文件上传解析功能，使用 pdfjs-dist 库
- ✨ **置信度评估系统**: AI 评分现在包含置信度信息，区分直接证据与推理
- 🎨 **视觉置信度指示器**: 低置信度分数使用虚线显示，带推理标记
- 🔧 **类型系统增强**: 扩展 SkillScore 接口，支持向后兼容
- 📄 **评估报告优化**: 导出报告中标注推理得出的分数
- 🧪 **测试覆盖**: 维持 95% 测试覆盖率，确保功能稳定性