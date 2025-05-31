# 📚 Pointer.ai - AI驱动的个性化编程学习平台

> **零后端 · React 19 · AI Native · 多Profile管理**  
> 智能化编程教育平台，提供个性化学习路径和AI助手指导

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://pointer-ai.github.io/PointerAIVibe/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 项目愿景

Pointer.ai 致力于打造下一代AI驱动的编程教育平台。通过深度整合AI技术与教育场景，为每位学习者提供：

- 🧠 **智能能力评估** - AI分析简历/问卷，精准评估技能水平
- 🎯 **个性化目标设定** - 基于能力现状的智能目标推荐
- 🛤️ **定制学习路径** - AI生成的个性化学习计划
- 🤖 **智能学习助手** - 24/7在线AI导师，自然语言交互
- 📊 **可视化路径管理** - 直观的学习目标和路径管理界面
- 🔍 **数据透明化** - 完整的数据检查器，验证AI工具调用
- 💻 **多语言代码环境** - 支持Python、JavaScript、C++在线运行
- 👥 **多Profile管理** - 支持多用户档案，数据完全隔离

## 🚀 快速开始

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/pointer-ai/PointerAIVibe.git
cd PointerAIVibe

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 访问应用
open http://localhost:5173
```

### 体验完整功能

1. **创建用户档案** - 设置你的学习身份
2. **完成能力评估** - 上传简历或完成技能问卷
3. **体验AI助手** - 进入"AI智能对话"开始交互
4. **测试系统功能** - 在"AI系统演示"中体验所有AI工具
5. **🆕 管理学习路径** - 在"学习路径管理"中可视化管理目标和路径
6. **🆕 验证数据存储** - 在"数据检查器"中查看AI工具调用结果

## 🔧 核心功能模块

### 📊 智能能力评估系统
- **PDF简历解析** - 自动提取技能信息
- **多维度评估** - 5大维度30+细分技能
- **置信度标注** - 区分直接证据与推理结果
- **可视化报告** - 雷达图展示，支持导出

### 🤖 AI学习助手系统
- **自然语言交互** - 理解学习需求，智能响应
- **16个AI工具** - 涵盖目标设定到内容生成的完整流程
- **上下文感知** - 基于用户档案的个性化建议
- **实时状态跟踪** - 智能监控学习进度

### 🎯 学习路径管理系统 ⭐新功能
- **可视化界面** - 直观展示学习目标和路径关系
- **智能流程控制** - 重新设定目标时自动冻结旧路径
- **状态管理** - 支持目标暂停/恢复，路径激活/归档
- **进度跟踪** - 实时显示学习节点完成情况
- **批量操作** - 高效管理多个目标和路径

### 🔍 数据检查器 ⭐新功能
- **实时数据监控** - 查看localStorage中的完整数据
- **AI工具验证** - 确认工具调用是否真实生效
- **数据结构展示** - JSON格式展示所有学习数据
- **统计信息** - 目标、路径、课程单元数量统计
- **导出功能** - 一键复制数据到剪贴板

### 💻 代码运行环境
- **Monaco Editor** - VS Code级别的编程体验
- **多语言支持** - Python(Pyodide) + JavaScript + C++(Wandbox)
- **智能补全** - 语法高亮、代码片段、错误检测
- **一键运行** - 前端直接执行，无需服务器

### 👥 Profile管理系统
- **多用户支持** - 独立的学习档案和数据存储
- **密码保护** - 可选的档案加密功能
- **数据隔离** - 完全独立的学习数据和AI历史
- **无缝切换** - 一键切换不同学习身份

## 🎮 AI学习系统使用指南

### 🔍 AI系统演示
**位置**: Dashboard → "AI系统演示" 卡片

体验所有AI功能的测试界面：
- **🔥 AI智能对话 (真实LLM)** - ⭐ 使用真实大语言模型的完整对话体验，个性化学习指导
- AI对话交互测试
- 学习目标创建与分析  
- 个性化学习路径生成
- 系统状态分析
- 个性化内容推荐
- 系统综合状态检查
- **🆕 能力评估集成演示** - 测试能力评估数据与AI系统的完整集成
- **🆕 完整学习流程演示** - 一键体验从能力评估到课程生成的完整流程

### 🎯 学习路径管理 ⭐新功能
**位置**: Dashboard → "学习路径管理" 卡片

可视化的学习目标和路径管理界面：

#### 核心功能
- **📋 目标管理**: 创建、暂停、恢复、完成学习目标
- **🛤️ 路径管理**: 生成、激活、冻结、归档学习路径
- **📊 进度跟踪**: 实时显示学习节点完成状态
- **🔄 智能流程控制**: 自动化的状态转换和依赖管理

#### 使用流程
1. **创建目标**: 点击"➕ 新建目标"
2. **生成路径**: 选择目标后点击"🛤️ 生成路径"
3. **管理状态**: 使用操作按钮控制目标和路径状态
4. **查看进度**: 观察进度条和完成统计

#### 智能流程控制
- 🔒 **路径冻结**: 重新生成路径时，旧路径自动冻结
- ⚡ **状态同步**: 目标暂停时，相关路径同步暂停
- 🔄 **灵活切换**: 支持激活冻结路径或创建新路径

### 🔍 数据检查器 ⭐新功能
**位置**: Dashboard → "数据检查器" 卡片

验证AI工具调用和数据存储的调试界面：

#### 主要功能
- **📊 实时统计**: 显示目标、路径、课程单元数量
- **🗄️ 数据浏览**: 查看完整的JSON数据结构
- **🔄 即时刷新**: 验证AI工具调用后的数据变化
- **📋 数据导出**: 复制JSON数据到剪贴板

#### 验证方法
1. **执行AI操作**: 在AI系统演示中执行任意工具
2. **切换到检查器**: 查看数据是否真实更新
3. **对比数据**: 确认localStorage中的数据变化
4. **验证一致性**: 检查多个界面间的数据同步

### 💬 AI智能对话
**位置**: Dashboard → "AI智能对话" 卡片

与AI助手的自然语言交互：

```
# 示例对话
"我想学习前端开发"
"分析一下我的能力差距"
"为我制定一个学习计划"
"学习太快了，慢一点"
"这个概念太难理解了"
```

### 📊 能力评估系统集成

**重要更新**: AI学习系统现已完全集成能力评估模块

#### 完整工作流程：
1. **能力评估** → 上传简历或完成问卷，获得多维度技能分析
2. **AI系统识别** → 学习系统自动读取和分析能力数据
3. **个性化建议** → 基于能力水平提供定制化学习建议
4. **智能路径生成** → 根据技能差距生成个性化学习路径
5. **自适应内容** → 动态调整学习内容难度和节奏

#### 测试方法：
```bash
# 1. 完成能力评估
Dashboard → 能力评估 → 上传PDF/完成问卷

# 2. 测试集成效果
Dashboard → AI系统演示 → 能力评估集成

# 3. 体验完整流程
Dashboard → AI系统演示 → 完整学习流程

# 4. AI对话验证
Dashboard → AI智能对话 → "分析我的能力水平"

# 5. 验证数据存储
Dashboard → 数据检查器 → 查看能力评估数据

# 6. 可视化管理
Dashboard → 学习路径管理 → 查看基于能力的目标和路径
```

### 🛠️ AI工具系统

核心AI工具列表：
- `create_learning_goal` - 创建学习目标
- `analyze_user_ability` - **已增强** 分析用户能力，支持完整的能力评估数据
- `generate_learning_path` - 生成学习路径
- `create_course_content` - 创建课程内容
- `track_learning_progress` - 跟踪学习进度
- `adjust_learning_pace` - 调整学习节奏
- `handle_learning_difficulty` - 处理学习困难
- `recommend_study_schedule` - 推荐学习计划

## 📁 项目架构

```
src/
├── components/           # 通用UI组件
│   ├── AIAgent/         # AI助手组件
│   ├── LearningPathView.tsx # 🆕 学习路径管理界面
│   ├── DataInspector.tsx    # 🆕 数据检查器
│   ├── Dashboard.tsx    # 主控制台
│   └── Layout.tsx       # 布局组件
├── modules/             # 功能模块
│   ├── abilityAssess/   # 能力评估
│   ├── codeRunner/      # 代码运行器
│   ├── coreData/        # 核心数据层
│   │   ├── service.ts   # 数据服务
│   │   ├── agentTools.ts# AI工具系统
│   │   └── types.ts     # 类型定义
│   ├── goalSetting/     # 目标设定
│   ├── pathPlan/        # 路径规划
│   ├── courseContent/   # 课程内容
│   └── learningSystem.ts# 学习系统统一入口
├── utils/               # 工具函数
│   ├── profile.ts       # Profile管理
│   ├── storage.ts       # 本地存储
│   └── logger.ts        # 日志系统
└── demo/                # 演示组件
    └── AgentDemo.tsx    # AI系统演示
```

## 🔗 系统集成架构

### Profile ↔ AI系统数据流

```typescript
// Profile系统为AI提供用户上下文
Profile Data → CoreData Service → AI Agent Tools → 学习建议

// AI系统将学习数据保存到Profile
AI生成内容 → CoreData Service → Profile Storage → 持久化
```

### 核心数据结构

```typescript
interface ProfileData {
  // 能力评估数据
  abilityAssessment: AbilityAssessment
  
  // AI学习系统数据  
  coreData: {
    goals: LearningGoal[]        // 学习目标
    paths: LearningPath[]        // 学习路径
    courseUnits: CourseUnit[]    // 课程内容
    agentActions: AgentAction[]  // AI交互历史
    events: CoreDataEvent[]      // 学习事件
  }
  
  // 其他模块数据
  assessmentHistory: any[]       // 评估历史
  activities: ActivityRecord[]   // 活动记录
}
```

## 🔧 开发指南

### 本地开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（带热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5.0
- **样式方案**: Tailwind CSS
- **代码编辑**: Monaco Editor  
- **Python运行**: Pyodide (WebAssembly)
- **C++编译**: Wandbox API
- **状态管理**: 基于Profile的本地存储

### 开发规范

1. **代码风格**
   - TypeScript严格模式，禁用any类型
   - 函数式组件 + React Hooks
   - 单文件不超过300行

2. **模块设计**
   - 每个功能模块独立目录
   - 统一的service/types/view结构
   - 通过CoreData层统一数据管理

3. **数据流设计**
   - Profile → CoreData → AI Tools → 用户交互
   - 所有学习数据通过Profile系统持久化
   - AI交互历史完整记录

## 🎯 功能完成度

| 模块 | 状态 | 功能覆盖 | 备注 |
|------|------|----------|------|
| Profile管理 | ✅ 完成 | 100% | 多用户、密码保护、数据隔离 |
| 能力评估 | ✅ 完成 | 95% | PDF解析、AI评估、置信度标注 |
| AI学习助手 | ✅ 完成 | 90% | 16个AI工具、自然语言交互 |
| 学习路径管理 | ✅ 完成 | 95% | 🆕 可视化界面、流程控制 |
| 数据检查器 | ✅ 完成 | 100% | 🆕 实时监控、验证工具调用 |
| 代码运行器 | ✅ 完成 | 95% | 三语言支持、Monaco编辑器 |
| 目标设定 | ✅ 完成 | 85% | AI推荐、问卷调研 |
| 路径规划 | ✅ 完成 | 85% | 智能生成、进度跟踪 |
| 课程内容 | ✅ 完成 | 85% | AI生成、多媒体支持 |
| 全局AI助手 | ✅ 完成 | 90% | 关键词识别、随意搜功能 |

## 🔍 测试建议

### 完整功能测试流程

1. **基础设置**
   ```bash
   npm run dev
   # 创建新Profile或选择现有Profile
   # 在Profile设置中配置AI API Key（可选）
   ```

2. **能力评估测试**
   - 上传PDF简历或填写技能问卷
   - 观察AI评估结果和置信度标注
   - 查看雷达图和评估报告

3. **AI助手测试**
   - 进入"AI智能对话"
   - 尝试自然语言描述学习需求
   - 测试快速操作按钮
   - 观察AI工具调用过程

4. **系统演示测试**
   - 进入"AI系统演示" 
   - 依次测试所有功能模块
   - 检查数据保存和状态更新

5. **🆕 学习路径管理测试**
   - 进入"学习路径管理"
   - 创建学习目标并生成路径
   - 测试状态转换和流程控制
   - 验证进度跟踪功能

6. **🆕 数据验证测试**
   - 进入"数据检查器"
   - 执行AI工具调用后刷新数据
   - 验证localStorage中的数据变化
   - 检查数据结构完整性

7. **Profile切换测试**
   - 创建多个Profile
   - 切换Profile查看数据隔离
   - 测试密码保护功能

### 🔧 工具调用验证

**详细验证指南**: 参考 `TOOL_VERIFICATION_GUIDE.md`

**快速验证步骤**:
1. AI系统演示 → 创建目标 → 观察输出
2. 数据检查器 → 刷新 → 查看目标数据
3. 学习路径管理 → 验证界面显示
4. 确认三个界面数据一致

## 📈 路线图

### 即将修复 (Bug Fixes)
- [ ] 🔗 **目标与学习路径关联问题** - 修复目标和学习路径之间的数据关联逻辑
- [ ] ✅ **目标创建验证** - 添加目标创建时的必填字段验证，防止创建空目标
- [ ] 🎯 **学习路径自动关联** - 生成学习路径时自动建立与目标的正确关联关系

### 即将推出 (v2.0)
- [ ] 云端数据同步
- [ ] 学习数据可视化看板
- [ ] AI学习效果评估
- [ ] 社区学习分享功能

### 长期规划 (v3.0+)
- [ ] 多人协作学习
- [ ] 企业级学习管理
- [ ] 移动端应用
- [ ] 虚拟现实学习环境

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **Fork项目** 并创建feature分支
2. **提交改动** 前确保测试通过
3. **创建Pull Request** 详细描述改动内容
4. **代码审查** 通过后合并到主分支

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- **AI技术支持**: OpenAI GPT、Anthropic Claude、阿里通义千问
- **前端技术栈**: React、Vite、Tailwind CSS、Monaco Editor
- **运行时环境**: Pyodide、Wandbox API
- **开发工具**: TypeScript、ESLint、Prettier

---

**🔗 相关链接**
- [在线演示](https://pointer-ai.github.io/PointerAIVibe/)
- [项目仓库](https://github.com/pointer-ai/PointerAIVibe)  
- [问题反馈](https://github.com/pointer-ai/PointerAIVibe/issues)
- [功能建议](https://github.com/pointer-ai/PointerAIVibe/discussions)
- [工具验证指南](TOOL_VERIFICATION_GUIDE.md) 🆕

**Made with ❤️ by AI & Human Collaboration**