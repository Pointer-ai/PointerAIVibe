# CoreData 模块

该模块是整个学习系统的数据中枢，负责统一管理用户的核心数据，包括能力档案、学习目标、路径规划、课程内容等，并提供AI Agent工具调用系统。

## 🏗️ 架构设计

### 数据流向
```
abilityAssess → CoreData ← goalSetting
                 ↓ ↑
               pathPlan
                 ↓ ↑
              courseContent
                 ↓ ↑
               AI Agent
```

### 核心组件
- **数据存储层**：统一的Profile级别数据存储
- **服务层**：提供CRUD操作和业务逻辑
- **AI Agent系统**：支持工具调用的智能代理
- **事件系统**：记录用户行为和学习轨迹

## 📊 数据结构

### 核心数据类型
```typescript
interface CoreData {
  events: CoreDataEvent[]              // 事件时间线
  abilityProfile?: AbilityProfile      // 能力档案
  goals: LearningGoal[]               // 学习目标
  paths: LearningPath[]               // 学习路径  
  courseUnits: CourseUnit[]           // 课程内容
  agentActions: AgentAction[]         // AI操作记录
  metadata: {                         // 元数据
    version: string
    lastUpdated: string
    totalStudyTime: number
    streakDays: number
  }
}
```

### 学习目标 (LearningGoal)
- **category**: frontend | backend | fullstack | automation | ai | mobile | game | data | custom
- **targetLevel**: beginner | intermediate | advanced | expert
- **status**: active | completed | paused | cancelled

### 学习路径 (LearningPath)
- **nodes**: 学习节点数组，支持依赖关系
- **dependencies**: 节点间的前置依赖
- **milestones**: 里程碑和奖励机制

### 课程单元 (CourseUnit)
- **type**: theory | example | exercise | project | quiz
- **content**: 支持Markdown、代码、测验等多种内容格式
- **metadata**: 难度、时长、关键词、学习目标

## 🤖 AI Agent 系统

### 可用工具
1. **目标管理**
   - `create_learning_goal`: 创建学习目标
   - `update_learning_goal`: 更新目标状态

2. **路径规划**
   - `create_learning_path`: 生成学习路径
   - `update_learning_path`: 优化路径结构
   - `generate_path_nodes`: 智能生成路径节点

3. **内容生成**
   - `create_course_unit`: 创建课程单元
   - `update_course_unit`: 更新课程内容

4. **分析工具**
   - `analyze_user_ability`: 分析用户能力
   - `calculate_skill_gap`: 计算技能差距
   - `get_learning_context`: 获取学习上下文

### 使用示例
```typescript
import { agentToolExecutor } from '../coreData'

// 分析技能差距
const skillGap = await agentToolExecutor.executeTool('calculate_skill_gap', {
  goalId: 'goal_123'
})

// 生成学习路径
const path = await agentToolExecutor.executeTool('create_learning_path', {
  goalId: 'goal_123',
  title: '前端开发入门',
  description: '零基础到入门的前端学习路径',
  nodes: [...],
  dependencies: [...],
  milestones: [...]
})
```

## 🔧 API 接口

### 事件管理
```typescript
// 添加事件
addCoreEvent({ type: 'goal_created', details: { goalId, title } })

// 获取事件
getEventsByType('goal_created')
```

### 能力档案
```typescript
// 更新能力档案
updateAbilityProfile(abilityProfile)

// 获取能力档案
const profile = getAbilityProfile()
```

### 学习目标
```typescript
// 创建目标
const goal = createLearningGoal({
  title: '成为前端开发者',
  category: 'frontend',
  targetLevel: 'intermediate',
  // ...
})

// 获取活跃目标
const activeGoals = getActiveLearningGoals()
```

### 学习路径
```typescript
// 创建路径
const path = createLearningPath({
  goalId: 'goal_123',
  title: '前端学习路径',
  nodes: [...],
  // ...
})

// 按目标获取路径
const paths = getLearningPathsByGoal('goal_123')
```

### 课程内容
```typescript
// 创建课程单元
const unit = createCourseUnit({
  nodeId: 'node_456',
  title: 'HTML基础',
  type: 'theory',
  content: { markdown: '...' },
  // ...
})

// 按节点获取课程
const units = getCourseUnitsByNode('node_456')
```

## 📈 学习统计

### 统计数据
- **totalStudyTime**: 总学习时间（分钟）
- **streakDays**: 连续学习天数
- **completedGoals**: 完成的目标数量
- **activePaths**: 活跃的学习路径

### 更新方法
```typescript
// 更新学习时间
updateStudyTime(60) // 增加60分钟

// 更新连续天数
updateStreakDays(7)
```

## 🔄 数据迁移

### 版本控制
- 当前版本：`1.0.0`
- 支持向后兼容的数据格式升级
- 自动初始化默认数据结构

### 清理功能
```typescript
// 清空所有数据（慎用）
clearCoreData()
```

## 🧪 测试策略

### 单元测试覆盖
- ✅ 数据CRUD操作
- ✅ 事件记录系统
- ✅ AI工具执行器
- ✅ 数据验证逻辑

### 集成测试
- 模块间数据流
- AI Agent工具调用
- 存储持久化

## 📝 开发指南

### 添加新的数据类型
1. 在 `types.ts` 中定义接口
2. 在 `service.ts` 中添加CRUD方法
3. 更新 `CoreData` 接口
4. 添加相应的事件类型

### 添加新的AI工具
1. 在 `agentTools.ts` 的 `AGENT_TOOLS` 中定义工具
2. 在 `AgentToolExecutor` 中实现执行逻辑
3. 添加必要的类型定义
4. 编写单元测试

### 最佳实践
- 所有数据操作都通过CoreData服务层
- 重要操作自动记录事件
- 使用TypeScript严格类型检查
- 保持API设计的一致性

## 🚀 后续规划

### v1.1.0
- [ ] 数据导入/导出功能
- [ ] 学习数据可视化
- [ ] 更多AI分析工具

### v1.2.0  
- [ ] 云端数据同步
- [ ] 协作学习功能
- [ ] 学习推荐算法

---

> 💡 **提示**: CoreData是整个系统的核心，修改时请谨慎考虑对其他模块的影响。
