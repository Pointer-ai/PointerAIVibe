# 课程内容生成与学习系统

这是一个完整的课程内容生成和学习管理系统，支持AI生成个性化学习内容，并提供优质的学习体验。

## 功能特性

### 📚 内容生成功能
- **目标选择**: 从活跃的学习目标中选择
- **路径选择**: 选择与目标关联的学习路径
- **节点选择**: 选择路径中的具体学习节点
- **智能生成**: 为每个节点生成4-5个学习内容模块
- **多语言支持**: 主要支持JavaScript和Python代码示例
- **Markdown格式**: 所有内容使用Markdown格式，便于阅读和维护

### 🎓 学习功能
- **Markdown可视化**: 增强的Markdown渲染，支持代码高亮、样式美化
- **学习记录管理**: 自动追踪学习进度、时间统计
- **状态标注**: 可以标记内容为"理解了"、"有困惑"、"需复习"
- **交互式学习**: 支持文本高亮、笔记记录、进度跟踪
- **分段学习**: 分为阅读、练习、总结三个阶段

## 组件架构

```
CourseContentPage (统一入口)
├── CourseContentGenerator (内容生成器)
│   ├── 目标选择
│   ├── 路径选择  
│   ├── 节点选择
│   ├── 生成配置
│   └── 内容预览
└── CourseContentViewer (学习查看器)
    ├── 课程列表
    ├── 学习界面
    ├── 进度管理
    └── 笔记系统
```

## 使用方法

### 1. 生成课程内容

```typescript
import { CourseContentPage } from './modules/courseContent'

// 在你的应用中使用
<CourseContentPage />
```

**生成流程：**
1. 选择一个活跃的学习目标
2. 从目标关联的路径中选择一个
3. 选择路径中的一个节点
4. 配置生成参数（内容数量、编程语言、阅读时长）
5. 生成并预览内容
6. 保存到系统中

### 2. 开始学习

切换到"开始学习"标签页：
1. 浏览可用的课程内容
2. 点击课程卡片开始学习
3. 按照阅读→练习→总结的顺序学习
4. 使用学习工具（高亮、笔记、状态标记）
5. 完成每个部分并追踪进度

## 配置选项

### 内容生成配置

```typescript
interface ContentGenerationRequest {
  goalId: string           // 学习目标ID
  pathId: string          // 学习路径ID
  nodeId: string          // 路径节点ID
  contentCount: number    // 内容数量 (推荐4-5个)
  language: 'javascript' | 'python'  // 编程语言
  estimatedReadingTime: number        // 预计阅读时长(分钟)
}
```

### 学习内容类型

- **theory**: 理论基础内容
- **example**: 示例和演示
- **exercise**: 练习题目
- **project**: 实践项目

## API接口

### 核心数据操作

```typescript
// 创建课程单元
createCourseUnit(unit: Omit<CourseUnit, 'id'>): CourseUnit

// 获取课程单元
getCourseUnits(): CourseUnit[]

// 更新学习进度
updateCourseUnit(id: string, updates: Partial<CourseUnit>): CourseUnit | null

// 添加事件记录
addCoreEvent(event: any): void
```

### 学习进度管理

```typescript
// 开始学习
startLearning(unit: CourseUnit): void

// 完成学习部分
completeCurrentSection(): void

// 标记内容状态
markContentStatus(status: 'understood' | 'confused' | 'needs_review'): void
```

## 高级功能

### 1. 增强的Markdown渲染

```typescript
import { MarkdownRenderer } from './components/MarkdownRenderer'

<MarkdownRenderer
  content={markdownContent}
  onHighlight={handleHighlight}
  highlights={userHighlights}
  onProgressUpdate={handleProgressUpdate}
/>
```

**特性：**
- 语法高亮的代码块
- 一键复制代码
- 文本选择高亮
- 阅读进度追踪
- 美化的样式

### 2. 学习统计

- 自动计时学习时间
- 追踪阅读进度百分比
- 记录完成状态
- 生成学习报告

### 3. 个性化功能

- 保存用户笔记
- 高亮重要内容
- 标记学习状态
- 推荐相关内容

## 数据结构

### CourseUnit 结构

```typescript
interface CourseUnit {
  id: string
  nodeId: string
  title: string
  description: string
  type: 'theory' | 'example' | 'exercise' | 'project' | 'quiz'
  content: {
    reading?: {
      markdown: string
      estimatedTime: number
      keyPoints: string[]
    }
    // ... 其他内容类型
  }
  progress: {
    status: 'not_started' | 'reading' | 'practicing' | 'summarizing' | 'completed'
    sections: {
      reading: { completed: boolean; timeSpent: number }
      practice: { completed: boolean; timeSpent: number }
      summary: { completed: boolean; timeSpent: number }
    }
    overallProgress: number
  }
  metadata: {
    difficulty: number
    estimatedTime: number
    keywords: string[]
    learningObjectives: string[]
    prerequisites: string[]
  }
}
```

## 最佳实践

### 1. 内容生成
- 选择明确的学习目标
- 确保路径和节点的逻辑性
- 控制内容数量在4-5个之间
- 设置合理的阅读时长（10-15分钟）

### 2. 学习体验
- 按顺序完成各个部分
- 积极使用高亮和笔记功能
- 及时标记理解状态
- 定期回顾已学内容

### 3. 进度管理
- 保持学习连续性
- 关注时间统计数据
- 完成自我评估
- 记录学习心得

## 扩展性

### 添加新的内容类型

```typescript
// 在types.ts中扩展
type ContentType = 'theory' | 'example' | 'exercise' | 'project' | 'quiz' | 'your_new_type'
```

### 自定义Markdown渲染

```typescript
// 扩展MarkdownRenderer组件
const customRenderers = {
  // 添加自定义渲染逻辑
}
```

### 集成外部AI服务

```typescript
// 在CourseContentService中添加
async generateWithExternalAI(prompt: string): Promise<string> {
  // 调用外部AI API
}
```

## 故障排除

### 常见问题

1. **内容生成失败**
   - 检查选择的目标、路径、节点是否有效
   - 确认AI服务可用性
   - 查看控制台错误日志

2. **学习进度未保存**
   - 确认localStorage权限
   - 检查数据同步状态
   - 验证事件记录功能

3. **Markdown渲染异常**
   - 检查内容格式是否正确
   - 确认代码块语法
   - 验证特殊字符转义

### 性能优化

- 使用虚拟滚动处理大量内容
- 延迟加载非关键资源
- 缓存已生成的内容
- 优化Markdown渲染性能

## 更新日志

### v1.0.0
- ✅ 基础内容生成功能
- ✅ 学习界面和进度管理
- ✅ Markdown渲染和高亮
- ✅ 时间追踪和统计
- ✅ 笔记和状态管理

### 计划功能
- 🔄 AI内容质量评估
- 🔄 协作学习功能
- 🔄 移动端适配
- 🔄 离线学习支持 