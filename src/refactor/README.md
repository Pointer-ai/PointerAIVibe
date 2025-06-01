# 🏗️ 重构系统架构

## 📁 文件结构设计

```
src/refactor/
├── components/           # 重构后的UI组件层
│   ├── ui/              # 基础UI组件
│   │   ├── Button/      # 通用按钮组件
│   │   ├── Modal/       # 模态框组件
│   │   ├── Form/        # 表单组件
│   │   ├── Card/        # 卡片组件
│   │   └── Progress/    # 进度条组件
│   ├── features/        # 功能组件
│   │   ├── GoalManagement/     # 目标管理
│   │   │   ├── GoalForm.tsx
│   │   │   ├── GoalList.tsx
│   │   │   └── GoalCard.tsx
│   │   ├── PathPlanning/       # 路径规划
│   │   │   ├── PathView.tsx
│   │   │   ├── PathNode.tsx
│   │   │   └── PathProgress.tsx
│   │   ├── Assessment/         # 能力评估
│   │   │   ├── AssessmentForm.tsx
│   │   │   ├── AssessmentResult.tsx
│   │   │   └── SkillRadar.tsx
│   │   └── Dashboard/          # 仪表板
│   │       ├── SystemStatus.tsx
│   │       ├── ProgressChart.tsx
│   │       └── QuickActions.tsx
│   └── layouts/         # 布局组件
│       ├── MainLayout.tsx
│       ├── FeatureLayout.tsx
│       └── ModalLayout.tsx
├── pages/               # 页面组件
│   ├── Dashboard.tsx    # 重构系统主仪表板
│   ├── GoalManagement.tsx
│   ├── PathPlanning.tsx
│   ├── Assessment.tsx
│   └── SystemIntegration.tsx
├── services/            # 业务服务层
│   ├── goalService.ts   # 目标管理服务
│   ├── pathService.ts   # 路径管理服务
│   ├── assessmentService.ts # 评估服务
│   ├── systemService.ts # 系统集成服务
│   └── apiService.ts    # API统一服务
├── types/               # 类型定义
│   ├── goal.ts
│   ├── path.ts
│   ├── assessment.ts
│   └── system.ts
├── hooks/               # 自定义Hooks
│   ├── useGoalManagement.ts
│   ├── usePathPlanning.ts
│   ├── useAssessment.ts
│   └── useSystemIntegration.ts
├── utils/               # 工具函数
│   ├── validation.ts
│   ├── formatters.ts
│   └── helpers.ts
└── constants/           # 常量定义
    ├── routes.ts
    ├── config.ts
    └── messages.ts
```

## 🎯 架构原则

### 1. 清晰的分层架构
```
Pages (页面层) 
    ↓
Features (功能组件层)
    ↓  
Services (业务服务层)
    ↓
API Layer (API层)
    ↓
Core Data (数据层)
```

### 2. 数据流向
- **单向数据流**: Pages → Features → Services → API → CoreData
- **状态管理**: 使用React Hooks进行状态管理
- **数据共享**: 与原系统共享CoreData，确保数据一致性

### 3. 组件设计
- **原子化设计**: ui/ 目录下的基础组件高度可复用
- **功能导向**: features/ 目录下按业务功能组织
- **布局分离**: layouts/ 目录统一管理布局逻辑

### 4. 服务层设计
- **业务隔离**: 每个服务专注单一业务域
- **API统一**: 通过apiService统一管理API调用
- **错误处理**: 统一的错误处理和回退机制

## 🔗 与原系统的集成

### 数据层集成
- **共享CoreData**: 使用相同的数据存储和访问接口
- **Profile隔离**: 支持多Profile数据完全隔离
- **实时同步**: 数据变更实时同步到原系统

### UI层隔离
- **独立路由**: 重构系统有独立的页面路由
- **组件复用**: 可选择性复用原系统的基础组件
- **样式一致**: 保持与原系统一致的设计风格

### 渐进式迁移
- **模块化迁移**: 按功能模块逐步迁移
- **兼容性保证**: 确保迁移过程中系统稳定运行
- **回滚支持**: 支持快速回滚到原系统

## 🚀 开发指南

### 1. 组件开发
```typescript
// 使用TypeScript进行类型安全开发
// 每个组件都有明确的Props接口定义
// 使用自定义Hooks管理状态和副作用
```

### 2. 服务开发
```typescript
// 统一的服务接口设计
// 完整的错误处理和日志记录
// 支持异步操作和数据缓存
```

### 3. 测试策略
- **单元测试**: 对核心业务逻辑进行单元测试
- **集成测试**: 验证重构系统与原系统的数据同步
- **E2E测试**: 端到端功能测试确保用户体验

### 4. 性能优化
- **代码分割**: 按路由和功能进行代码分割
- **懒加载**: 非关键组件使用懒加载
- **缓存策略**: 合理使用缓存减少重复请求

## 📋 开发计划

### Phase 1: 基础架构 (当前阶段)
- [x] 创建文件结构
- [x] 设置基础组件
- [x] 配置路由和导航
- [ ] 完成基础UI组件库

### Phase 2: 核心功能迁移
- [ ] 目标管理功能迁移
- [ ] 路径规划功能迁移  
- [ ] 能力评估功能迁移
- [ ] 数据同步验证

### Phase 3: 高级功能
- [ ] 系统集成测试
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 文档完善

### Phase 4: 生产就绪
- [ ] 全面测试
- [ ] 部署配置
- [ ] 监控和日志
- [ ] 用户培训

## 🔧 使用指南

### 开发环境启动
```bash
# 启动开发服务器（与主系统共享）
pnpm dev

# 访问重构系统
# 主Dashboard → "🏗️ 重构系统测试" 卡片
```

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier配置
- 编写有意义的commit message
- 为新功能添加相应的测试 