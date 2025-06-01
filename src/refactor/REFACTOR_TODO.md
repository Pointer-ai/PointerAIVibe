# 🏗️ 重构系统 TODO 列表

## 🎯 架构优化计划

### 📦 服务层简化 ⭐ 优先级高
**理念**: 既然所有重构组件都通过 `learningApi` 统一访问数据，大部分重构服务层可能是冗余的

#### 可以删除的服务:
- [ ] **refactorProfileService** - Profile操作可以通过 `learningApi` 完成
  - 当前使用场景: ProfileManagement 页面
  - 替代方案: 扩展 `learningApi` 添加 Profile 相关方法
  - 风险评估: 低 - 数据访问逻辑简单

- [ ] **refactorAIService** - AI操作可以通过 `learningApi` 完成  
  - 当前使用场景: Assessment 页面的AI状态检查
  - 替代方案: `learningApi` 已有 AI 相关方法
  - 风险评估: 中 - 需要确保AI配置管理正确

- [ ] **legacyDataService** - Legacy兼容可以集成到 `learningApi`
  - 当前使用场景: 数据格式转换和兼容性检查
  - 替代方案: 在 `learningApi` 内部处理Legacy兼容
  - 风险评估: 中 - 需要保证向后兼容性

#### 需要保留的服务:
- [x] **syncManager** - 保留，作为跨组件协调器
  - 原因: 处理Profile切换、状态同步等复杂协调逻辑
  - 价值: 防止竞态条件，统一同步操作

#### 架构目标:
```
当前架构:
重构组件 → learningApi → 原系统服务 → 数据层
重构组件 → refactorXXXService → 数据层 (冗余)

目标架构:
重构组件 → learningApi → 原系统服务 → 数据层
syncManager (协调器)
```

### 🔧 实施计划

#### 阶段1: 评估和准备
- [ ] 分析各服务的具体使用场景
- [ ] 确定 `learningApi` 需要扩展的接口
- [ ] 评估删除各服务的风险和影响

#### 阶段2: 扩展 learningApi
- [ ] 添加 Profile 管理相关方法到 `learningApi`
- [ ] 集成 AI 服务配置管理到 `learningApi`  
- [ ] 将 Legacy 兼容逻辑集成到 `learningApi`

#### 阶段3: 逐步迁移
- [ ] 修改 ProfileManagement 页面，移除对 `refactorProfileService` 的依赖
- [ ] 修改 Assessment 页面，移除对 `refactorAIService` 的依赖
- [ ] 修改相关诊断功能，移除对 `legacyDataService` 的直接依赖

#### 阶段4: 清理删除
- [ ] 删除 `src/refactor/services/profileService.ts`
- [ ] 删除 `src/refactor/services/aiService.ts` 
- [ ] 删除 `src/refactor/services/legacyDataService.ts`
- [ ] 更新 `src/refactor/index.ts` 导出

### 📊 预期收益

#### 代码简化:
- **删除代码行数**: 约 1500+ 行 (估算)
- **文件减少**: 3个服务文件
- **维护成本**: 降低约 40%

#### 架构改进:
- **单一数据访问点**: 所有数据操作都通过 `learningApi`
- **减少依赖复杂性**: 组件只需要依赖 `learningApi`
- **更清晰的数据流**: 单向数据流更加明确
- **降低测试复杂度**: 只需要 Mock `learningApi`

#### 风险控制:
- **向后兼容**: 确保原有功能不受影响
- **渐进式迁移**: 分阶段实施，可随时回滚
- **功能验证**: 每个阶段都进行完整测试

## 🚀 其他优化项目

### 🎨 UI/UX 改进
- [ ] 统一所有页面的加载状态显示
- [ ] 优化移动端响应式设计
- [ ] 添加暗色主题支持
- [ ] 优化无障碍访问支持

### 📱 功能完善
- [ ] 完成 PathPlanning 页面开发
- [ ] 完成 SystemIntegration 页面开发
- [ ] 添加数据导入/导出功能
- [ ] 实现离线缓存机制

### 🧪 测试覆盖
- [ ] 为 UI 组件添加单元测试
- [ ] 为 learningApi 添加集成测试
- [ ] 添加 E2E 测试覆盖主要用户流程
- [ ] 性能测试和优化

### 📚 文档完善
- [ ] 完善组件使用文档
- [ ] 添加开发指南文档
- [ ] 创建部署指南
- [ ] 编写API使用手册

## 📝 实施说明

### 开发原则:
1. **渐进式改进** - 分阶段实施，确保系统稳定
2. **向后兼容** - 保证原有功能不受影响  
3. **测试先行** - 每个改动都要有相应测试
4. **文档同步** - 及时更新相关文档

### 优先级说明:
- **⭐ 高优先级** - 架构核心改进，影响整体设计
- **🔧 中优先级** - 功能完善和体验改进  
- **📚 低优先级** - 文档和测试补充

### 完成标准:
- [ ] 所有测试通过
- [ ] 功能验证完成
- [ ] 文档更新完成
- [ ] 代码审查通过

---

**创建时间**: 2024年12月
**最后更新**: 2024年12月
**维护者**: 重构系统开发团队 