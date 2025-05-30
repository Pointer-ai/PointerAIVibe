# CoreData 模块

该模块负责维护与当前 Profile 关联的核心数据，包含学习与评估等事件时间线，便于后续生成个性化的学习路径与内容。

## 数据结构
```typescript
interface CoreDataEvent {
  id: string
  type: string
  timestamp: string
  details: Record<string, any>
}

interface CoreData {
  events: CoreDataEvent[]
}
```

## 主要方法
- `getCoreData()` 获取当前 Profile 的核心数据
- `addCoreEvent(event)` 新增事件记录
- `getEventsByType(type)` 按类型筛选事件
- `clearCoreData()` 清空所有记录
