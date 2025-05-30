# CodeRunner 模块 - Monaco Editor 代码编辑器

## 概述
CodeRunner 模块提供了一个功能丰富的多语言代码运行环境，集成了 Monaco Editor（VS Code 编辑器内核），支持 Python、C++、JavaScript 三种编程语言的代码编辑、语法高亮、智能补全和在线执行。

## 主要特性

### 🎨 语法高亮
- **Python**: 支持 Python 语法高亮，包括关键字、字符串、注释等
- **C++**: 支持 C++ 语法高亮，包括预处理器、STL 库等
- **JavaScript**: 支持 ES6+ 语法高亮，包括箭头函数、模板字符串等

### 🧠 智能补全
- **Python**: 提供常用函数和语句的智能补全
  - `print()` - 输出函数
  - `def` - 函数定义
  - `for/while` - 循环语句
  - `if/else` - 条件语句
  - `class` - 类定义

- **C++**: 提供 C++ 基础补全
  - `#include <iostream>` - 标准输入输出
  - `int main()` - 主函数模板
  - `std::cout` - 输出语句
  - `for` - 循环语句模板

- **JavaScript**: 提供 JavaScript 常用补全
  - `console.log()` - 控制台输出
  - `function` - 函数声明
  - `arrow function` - 箭头函数模板

### ⚡ 编辑器特性
- **快捷键支持**: `Ctrl/Cmd + Enter` 快速运行代码
- **自动括号匹配**: 自动配对 `()`, `[]`, `{}`, `""`, `''`
- **智能缩进**: 4空格缩进，支持自动缩进
- **代码折叠**: 支持函数和类的代码折叠
- **行号显示**: 清晰的行号指示
- **词汇高亮**: 当前行高亮显示
- **平滑滚动**: 优化的滚动体验

### 🎯 用户体验
- **实时反馈**: 代码更改即时响应
- **主题支持**: 暗色/亮色主题切换
- **加载状态**: 优雅的加载动画
- **错误提示**: 清晰的错误信息显示
- **执行历史**: 保存最近的代码执行记录

## 技术实现

### Monaco Editor 集成
```typescript
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

// 编辑器配置
const editorOptions = {
  fontSize: 14,
  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  lineHeight: 22,
  tabSize: 4,
  insertSpaces: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  renderLineHighlight: 'line',
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  contextmenu: true,
  folding: true,
  lineNumbers: 'on'
}
```

### 语言配置
每种语言都有专门的配置：
- **注释风格**: 行注释和块注释
- **括号匹配**: 各种括号的自动配对
- **缩进规则**: 语言特定的缩进逻辑
- **补全提供器**: 自定义的代码补全建议

### Vite 配置优化
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/language/json/json.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
      'monaco-editor/esm/vs/language/typescript/ts.worker',
      'monaco-editor/esm/vs/editor/editor.worker'
    ]
  },
  worker: {
    format: 'es'
  }
})
```

## 使用示例

### 基础用法
```tsx
import { CodeEditor } from './components/CodeEditor'

function MyComponent() {
  const [code, setCode] = useState('print("Hello, World!")')
  
  return (
    <CodeEditor
      value={code}
      onChange={setCode}
      onRun={() => console.log('运行代码')}
      language="python"
      theme="dark"
    />
  )
}
```

### 只读模式
```tsx
<CodeEditor
  value={exampleCode}
  onChange={() => {}}
  language="javascript"
  readOnly={true}
/>
```

### 自定义主题
```tsx
<CodeEditor
  value={code}
  onChange={setCode}
  language="cpp"
  theme="light"  // 'light' | 'dark'
/>
```

## 性能优化

### Lazy Loading
- 编辑器按需加载，不影响页面初始渲染
- Language workers 懒加载，只在需要时加载对应语言的处理器

### 内存管理
- 组件卸载时自动清理编辑器实例
- Workers 生命周期管理，避免内存泄漏

### 缓存策略
- Monaco Editor 静态资源缓存
- 代码执行结果缓存

## 浏览器兼容性
- **Chrome/Edge**: 完全支持
- **Firefox**: 完全支持
- **Safari**: 完全支持（iOS Safari 需要 13+）

## 依赖项
```json
{
  "@monaco-editor/react": "^4.7.0",
  "monaco-editor": "^0.52.2"
}
```

## 常见问题

### Q: 编辑器加载缓慢？
A: 这是正常现象，Monaco Editor 首次加载需要下载较大的静态资源。后续访问会利用浏览器缓存。

### Q: 代码补全不工作？
A: 确保 Monaco Editor 已完全加载。补全功能在编辑器初始化完成后才可用。

### Q: 如何添加自定义代码补全？
A: 可以在 `setupLanguageFeatures` 函数中注册自定义的 `CompletionItemProvider`。

### Q: 支持更多语言吗？
A: 目前支持 Python、C++、JavaScript。可以通过扩展语言映射和配置来添加更多语言支持。

## 未来规划
- [ ] 支持更多编程语言（Go、Rust、Java）
- [ ] 代码格式化功能
- [ ] 多文件编辑支持
- [ ] 代码片段管理
- [ ] 实时协作编辑
- [ ] 插件系统 