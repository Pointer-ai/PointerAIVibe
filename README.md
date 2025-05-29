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
| profileSettings | 🚧 开发中 | @ai | 70%  | API 配置、模型选择、活动记录 |
| abilityAssess | 🚧 开发中 | @ai | 80%  | 多维度能力评估系统 |
| goalSetting   | ⏳ 待开发 | @ai | 0%   | 解析目标，生成差距 |
| pathPlan      | ⏳ 待开发 | @ai | 0%   | 生成学习路径 |
| courseContent | ⏳ 待开发 | @ai | 0%   | 生成并展示课程 |
| codeRunner    | 🚧 开发中 | @ai | 0%   | Pyodide WASM 环境 |

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
- [ ] 用户偏好设置（主题/语言/通知）
- [ ] 活动数据统计图表
- [ ] API 使用量统计
- [ ] 配置导入/导出功能

### abilityAssess
- [x] 设计能力评估表单界面
- [x] 实现简历文本上传解析
- [x] 集成问卷评估流程
- [x] 调用 AI 分析能力并展示结果
- [x] 支持能力档案的编辑和更新
- [x] 实现多维度评价体系（编程基本功、算法能力、项目能力、系统设计、沟通协作）
- [x] 生成能力提升建议
- [x] 导出评估报告功能
- [x] 与 Dashboard 集成
- [x] 实现用户数据隔离（基于 Profile 系统）
- [ ] PDF 简历解析（需要额外库）
- [ ] 评估历史记录展示
- [ ] 能力对比分析功能
- [ ] 添加更多评估维度（如具体编程语言、框架熟练度）

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
- [ ] 完成 Pyodide 的完整集成
- [ ] 实现代码编辑器（Monaco/CodeMirror）
- [ ] 支持代码运行结果展示
- [ ] 添加常用 Python 包的预加载

## 8. 迭代工作流规定  🚦
以下规则确保 *README + TODO* 始终是单一真理源，便于 AI 与人工协同。

### 8.1 迭代节奏
1. **拉分支**：每次开发前从 `main` 派生 `feat/<module>-<task>`。  
2. **编写 Prompt**：把 **完整 README** + **待办任务块**（见 8.2）  
   一并发送给 Claude 4 Sonnet，要求：  
   - 仅修改目标模块目录；  
   - 更新测试；  
   - **必须** 同步 README 中状态表 & TODO。  
3. **本地验证**：运行 `pnpm dev && pnpm test`。全部通过后提交 PR。  
4. **CI 验收**：GitHub Actions 复跑 `pnpm test` 与 Playwright。通过即 Merge。  
5. **回到 1**：下一轮迭代再次以最新 `main` 为基线。

### 8.2 TODO 写法约定
- 每个模块在 README 下拥有独立二级标题：  
  ```md
  ### abilityAssess
  - [ ] 任务 1
  - [ ] 任务 2
  ```
- **AI 生成代码后** 必须：  
  1. 对已完成的任务改成 `[x]`；  
  2. 若拆出新子任务，直接在同块追加；  
  3. 调整状态表 `状态` 列：✅ / 🚧 / ⏳；  
  4. 如新文件单测覆盖率 ≥ 60%，更新 `覆盖率`。

### 8.3 Prompt 模板（复用）
```md
<README 最新全文>

【本轮任务】
目标模块：{{module}}
TODO 列表：
{{markdown_task_block}}

生成要求：
1. 仅修改 src/modules/{{module}}/** 与相关测试。
2. 每文件 ≤ 200 行、TS 无 any，保留中文注释。
3. 更新 README：状态表 + TODO 勾选 / 新增。
4. Vitest & Playwright 必须通过。
```

### 8.4 提交信息规范
- **feat**: 完成功能 `feat(abilityAssess): 支持上传 PDF 简历`
- **fix**: 修复缺陷 `fix(goalSetting): 修正模板下拉空值`
- **chore**: 构建/依赖 `chore: bump vite@5.3.1`
- **docs**: 文档更新 `docs(README): 更新测试覆盖率`

### 8.5 版本与里程碑
- 每合并 5 个 feature PR 打一个 `v0.x` Tag。  
- 当 README 的状态表首次全部 ✅ 时标记 `v1.0.0-alpha`。  
- 发布静态站到 `gh-pages` 分支，版本号映射路径 `/v1.0.0-alpha/`。

### 8.6 常见问题
| 症状 | 解决方案 |
|------|----------|
| AI 忘记更新 TODO | 在下一轮 Prompt 的「任务」里显式要求修补 README。 |
| 冲突频发 | 限制同时只开一个目标模块的 PR；其余分支等待合并。 |
| 上下文过长 | 如 README > 12k 行，把"测试日志/长列表"挪到 `docs/`，Prompt 里只留链接。 |

---

> 将本节保存后，下一轮开始即严格按 **8.3 Prompt 模板** 与 **8.1–8.2 规则** 执行。  
> 这样就能确保 **README / TODO / 代码 / 测试** 始终同步，  
> 且每次只需在 Cursor 中放入 *一个 README + 一个任务块*，  
> Claude 4 Sonnet 就能在小上下文里连续迭代，整个项目永不脱轨。 🚀

## 9. 技术架构

### 前端技术栈
- **框架**: React 19 (最新版本)
- **构建**: Vite 5 (快速的 HMR 和构建)
- **语言**: TypeScript 5 (类型安全)
- **样式**: TailwindCSS 3 (原子化 CSS)
- **测试**: Vitest (快速的单元测试)

### AI 集成
- 支持多种 AI 服务商：OpenAI、Claude、通义千问
- 用户自带 API Key，保护隐私
- 智能 Prompt 工程，生成高质量教育内容

### 代码执行
- Pyodide: Python 解释器运行在浏览器中
- Web Worker: 隔离的执行环境，不阻塞主线程
- 支持常用 Python 科学计算库

### 数据存储
- 纯 localStorage 方案，无需后端
- 支持多 Profile 管理，数据隔离
- 数据导出/导入功能（规划中）
- 离线可用，数据永不丢失

## 10. 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 开启 Pull Request

## 11. 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**联系方式**: [项目 Issue](https://github.com/your-repo/pointer-ai/issues)

**特别感谢**: 本项目由 Claude 4 Sonnet AI 助手协助开发，采用 Vibe Coding 开发范式 