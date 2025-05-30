# 随意搜功能测试指南

## 最新修复内容 (2025-05-30 v2)

### 关键问题解决
- ✅ 修复了会话ID不匹配的问题（新创建会话ID与组件状态中的ID不一致）
- ✅ 重新设计了会话状态管理逻辑，分离初始化和查询处理
- ✅ 增强了状态同步机制，确保新会话正确添加到组件状态
- ✅ 添加了会话存在性检查和自动修复机制

### 核心修复
1. **分离关注点**: 将会话初始化和查询处理分为两个独立的useEffect
2. **状态同步**: 使用setState回调确保新会话正确添加到sessions列表
3. **双重检查**: 在发送消息前再次验证会话是否存在，不存在则自动添加
4. **详细日志**: 添加完整的状态跟踪日志，便于调试

## 预期日志序列（最新）
```
[TextSelector] Query triggered for: 计算机科学的一个分
[GlobalAIAssistant] handleTextQuery called
[GlobalAIAssistant] Text query set: "计算机科学的一个分..."
[AIAssistant] New chat session created: [sessionId] keyword 计算机科学的一个分
[MultiTabChat] Created new session: [sessionId] for keyword: 计算机科学的一个分
[MultiTabChat] Updated sessions list, new length: [number]
[MultiTabChat] About to call handleSendMessage with sessionId: [sessionId]
[MultiTabChat] Current sessions when sending: [{id: [sessionId], title: "计算机科学的一个分"}]
[MultiTabChat] handleSendMessage: looking for session: [sessionId] in [number] sessions
[MultiTabChat] Available sessions: [{id: [sessionId], title: "计算机科学的一个分"}]
[MultiTabChat] handleSendMessage: starting with message: 请帮我解释或分析这段文字："计算机科学的一个分"
[MultiTabChat] Calling getAIResponse with message: 请帮我解释或分析这段文字："计算机科学的一个分"
[AIAssistant] Starting API call with config: {...}
[MultiTabChat] AI response received, length: [length]
[MultiTabChat] Message exchange completed successfully
```

## 修复的具体问题

### 问题描述
之前的日志显示：
- 创建的会话ID：`1748626329541prmdju7ea`  
- 组件中的会话ID：`['1748626301650yi4auvqbt']` ❌

### 解决方案
1. **分离初始化逻辑**: 会话列表初始化只在组件首次渲染时执行
2. **独立查询处理**: 新查询处理有自己的useEffect，专门处理props变化
3. **状态回调检查**: 使用setSessions回调函数确保状态更新的同步性
4. **兜底机制**: 发送消息前检查会话是否存在，不存在则自动添加

### 代码关键点
```typescript
// 分离的状态管理
useEffect(() => {
  // 只处理初始会话加载
}, [sessions.length])

useEffect(() => {
  // 专门处理新查询
  setSessions(prev => {
    const updatedSessions = [newSession, ...prev]
    return updatedSessions
  })
  
  // 双重检查机制
  setSessions(currentSessions => {
    const sessionExists = currentSessions.some(s => s.id === newSession.id)
    if (!sessionExists) {
      return [newSession, ...currentSessions]
    }
    return currentSessions
  })
}, [initialMessage, initialKeyword])
```

## 测试步骤

现在测试时应该观察到：
1. ✅ 会话ID在整个流程中保持一致
2. ✅ "Available sessions"包含正确的新创建会话
3. ✅ 消息能够成功发送和接收
4. ✅ 无"target session not found"错误

## 访问测试页面

开发服务器: http://localhost:5175/PointerAIVibe/
测试页面路径: Dashboard -> 测试随意搜（仅开发环境显示）

请再次测试随意搜功能，现在应该能够正确完成整个对话流程！ 