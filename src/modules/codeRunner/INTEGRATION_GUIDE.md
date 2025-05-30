# CodeRunner 集成指南

## 概述

CodeRunner 模块现在提供了一套完整的集成解决方案，让你可以在任何学习模块中快速集成代码编辑、运行和输出功能。通过统一的运行时管理系统，你无需担心编译器初始化的复杂性。

## 🎯 解决的问题

### 1. 编译器初始化管理
- **问题**: 不同场景下语言编译器的初始化会不一样，管理复杂
- **解决方案**: 使用 `RuntimeProvider` 统一管理所有语言的运行时状态
- **特性**: 
  - 自动缓存初始化状态
  - 支持预加载配置
  - Lazy loading 按需初始化
  - 内存自动清理

### 2. 组件复用困难
- **问题**: 原来需要分别使用编辑器、输出面板等多个组件
- **解决方案**: 提供 `IntegratedCodeRunner` 一体化组件
- **特性**:
  - 编辑器 + 运行按钮 + 输出面板一体化
  - 高度可配置，支持各种使用场景
  - 丰富的回调和事件处理

## 🚀 快速开始

### 基础使用（3步集成）

```tsx
import { RuntimeProvider, PythonRunner } from '@/modules/codeRunner'

function MyLearningModule() {
  return (
    <RuntimeProvider>
      <PythonRunner
        initialCode="print('Hello, World!')"
        onRunComplete={(result) => console.log('运行完成:', result)}
      />
    </RuntimeProvider>
  )
}
```

### 高级配置

```tsx
import { RuntimeProvider, IntegratedCodeRunner } from '@/modules/codeRunner'

function AdvancedModule() {
  return (
    <RuntimeProvider config={{
      preloadLanguages: ['javascript', 'python'], // 预加载语言
      autoCleanup: true, // 自动清理
      statusUpdateInterval: 1000 // 状态更新间隔
    }}>
      <IntegratedCodeRunner
        language="python"
        initialCode="# 编写你的代码"
        theme="dark"
        height="400px"
        showLanguageLabel={true}
        showRunButton={true}
        showOutput={true}
        autoInitialize={true}
        runButtonText="提交答案"
        onCodeChange={(code) => saveProgress(code)}
        onBeforeRun={async (code) => validateCode(code)}
        onRunComplete={(result) => checkAnswer(result)}
        onError={(error) => handleError(error)}
      />
    </RuntimeProvider>
  )
}
```

## 📦 组件类型

### 1. 预设语言组件（最简单）

```tsx
// Python 运行器
<PythonRunner initialCode="print('hello')" />

// JavaScript 运行器  
<JavaScriptRunner initialCode="console.log('hello')" />

// C++ 运行器
<CppRunner initialCode="#include <iostream>" />
```

### 2. 特殊场景组件

```tsx
// 紧凑版（无输出面板）
<CompactCodeRunner 
  language="javascript" 
  initialCode="console.log('test')" 
/>

// 只读展示版
<CodeDisplay 
  language="python" 
  initialCode="print('demo')" 
/>
```

### 3. 完全自定义组件

```tsx
<IntegratedCodeRunner
  language="python"
  initialCode="# 你的代码"
  // 所有配置项...
/>
```

## 🔧 不同场景的配置策略

### 场景1: 学习模块练习

```tsx
<RuntimeProvider config={{ 
  preloadLanguages: ['javascript', 'python'], // 预加载常用语言
  autoCleanup: true 
}}>
  <PythonRunner
    initialCode="# 练习：实现斐波那契数列"
    height="400px"
    onRunComplete={(result) => {
      // 记录学习进度
      trackProgress(result)
    }}
  />
</RuntimeProvider>
```

### 场景2: 课程内容展示

```tsx
<RuntimeProvider>
  <CodeDisplay
    language="javascript"
    initialCode={demoCode}
    theme="light"
  />
</RuntimeProvider>
```

### 场景3: 编程挑战验证

```tsx
<RuntimeProvider>
  <PythonRunner
    initialCode="# 实现你的解决方案"
    onBeforeRun={async (code) => {
      return await validateSubmission(code)
    }}
    onRunComplete={(result) => {
      const isCorrect = checkAnswer(result.output)
      showResult(isCorrect)
    }}
    runButtonText="提交答案"
  />
</RuntimeProvider>
```

### 场景4: 多语言对比

```tsx
<RuntimeProvider config={{ 
  preloadLanguages: ['javascript', 'python', 'cpp'] 
}}>
  <div className="grid grid-cols-3 gap-4">
    <JavaScriptRunner initialCode={jsCode} height="300px" />
    <PythonRunner initialCode={pyCode} height="300px" />
    <CppRunner initialCode={cppCode} height="300px" />
  </div>
</RuntimeProvider>
```

### 场景5: 快速测试工具

```tsx
function QuickTester() {
  const [language, setLanguage] = useState('javascript')
  
  return (
    <RuntimeProvider config={{ preloadLanguages: ['javascript'] }}>
      <select onChange={(e) => setLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
      </select>
      
      <CompactCodeRunner
        language={language}
        initialCode={getDefaultCode(language)}
        runButtonText="快速运行"
      />
    </RuntimeProvider>
  )
}
```

## ⚙️ 运行时管理策略

### 预加载策略

```tsx
// 策略1: 按需预加载（推荐）
<RuntimeProvider config={{ 
  preloadLanguages: ['javascript'] // 只预加载最常用的
}}>

// 策略2: 全部预加载（适合多语言模块）
<RuntimeProvider config={{ 
  preloadLanguages: ['javascript', 'python', 'cpp']
}}>

// 策略3: 不预加载（适合单一语言模块）
<RuntimeProvider config={{ 
  preloadLanguages: [] // Lazy loading
}}>
```

### 内存管理策略

```tsx
// 自动清理（推荐）
<RuntimeProvider config={{ 
  autoCleanup: true // 组件卸载时自动清理
}}>

// 手动清理（适合需要保持状态的场景）
<RuntimeProvider config={{ 
  autoCleanup: false
}}>
  {/* 需要手动调用 cleanup() */}
</RuntimeProvider>
```

## 🎛️ 完整配置参考

### RuntimeProvider 配置

```tsx
interface RuntimeProviderConfig {
  // 预加载哪些语言运行时
  preloadLanguages?: ('python' | 'cpp' | 'javascript')[]
  
  // 是否自动清理不活跃的运行时
  autoCleanup?: boolean
  
  // 状态更新间隔（毫秒）
  statusUpdateInterval?: number
}
```

### IntegratedCodeRunner 配置

```tsx
interface IntegratedCodeRunnerProps {
  // 必需配置
  language: 'python' | 'cpp' | 'javascript'
  
  // 代码配置
  initialCode?: string
  onCodeChange?: (code: string) => void
  
  // 外观配置
  theme?: 'light' | 'dark'
  height?: string
  showLanguageLabel?: boolean
  showRunButton?: boolean
  showOutput?: boolean
  
  // 运行配置
  readOnly?: boolean
  disabled?: boolean
  autoInitialize?: boolean
  runButtonText?: string
  
  // 事件回调
  onBeforeRun?: (code: string) => boolean | Promise<boolean>
  onRunComplete?: (execution: CodeExecution) => void
  onError?: (error: Error) => void
  
  // 样式配置
  className?: string
}
```

## 🔄 生命周期和状态管理

### 组件生命周期

```
1. RuntimeProvider 初始化
   ↓
2. 预加载配置的语言运行时
   ↓
3. IntegratedCodeRunner 挂载
   ↓
4. 自动初始化目标语言（如果配置）
   ↓
5. 用户交互（编辑/运行代码）
   ↓
6. 组件卸载时清理资源（如果配置）
```

### 状态管理

```tsx
// 使用 hooks 访问状态
function MyComponent() {
  const { state, actions } = useRuntime()
  const { isRunning, lastExecution } = useCodeExecution()
  const { status, execute } = useLanguageRuntime('python')
  
  return (
    <div>
      状态: {status?.isReady ? '就绪' : '未就绪'}
      {isRunning && <div>运行中...</div>}
    </div>
  )
}
```

## 🧪 测试和调试

### 开发模式下的调试

```tsx
<RuntimeProvider config={{
  statusUpdateInterval: 500, // 更频繁的状态更新
}}>
  <IntegratedCodeRunner
    language="python"
    onCodeChange={(code) => console.log('代码:', code)}
    onBeforeRun={(code) => {
      console.log('准备运行:', code)
      return true
    }}
    onRunComplete={(result) => console.log('结果:', result)}
    onError={(error) => console.error('错误:', error)}
  />
</RuntimeProvider>
```

### 单元测试

```tsx
import { render } from '@testing-library/react'
import { RuntimeProvider, PythonRunner } from '@/modules/codeRunner'

test('Python runner works', () => {
  render(
    <RuntimeProvider config={{ preloadLanguages: [] }}>
      <PythonRunner initialCode="print('test')" />
    </RuntimeProvider>
  )
  // 测试逻辑...
})
```

## 🔍 常见问题解决

### Q: 如何在多个模块间共享运行时状态？
A: 在应用的顶层提供 `RuntimeProvider`，所有子模块都会共享同一个运行时状态。

### Q: 如何优化性能？
A: 使用预加载策略，在应用启动时预加载常用语言运行时。

### Q: 如何处理运行时初始化失败？
A: 使用 `onError` 回调处理错误，并提供重试机制。

### Q: 如何自定义代码验证逻辑？
A: 使用 `onBeforeRun` 回调进行运行前验证。

## 🎨 样式自定义

```tsx
<IntegratedCodeRunner
  className="my-custom-runner"
  // 其他配置...
/>
```

```css
.my-custom-runner {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.my-custom-runner .monaco-editor {
  /* 自定义编辑器样式 */
}
```

## 📈 性能优化建议

1. **合理使用预加载**: 只预加载确实需要的语言
2. **启用自动清理**: 避免内存泄漏
3. **按需初始化**: 对于不常用的语言使用 lazy loading
4. **缓存配置**: 运行时状态会自动缓存，避免重复初始化

---

通过这个集成解决方案，你可以在任何学习模块中轻松集成完整的代码运行功能，而无需担心底层的复杂性管理。🚀 