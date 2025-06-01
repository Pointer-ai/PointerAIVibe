# CodeRunner 模块 - Refactor 版本

## 概述
CodeRunner 模块已完整迁移到 refactor 系统中，提供了一个功能丰富的多语言代码运行环境，集成了 Monaco Editor（VS Code 编辑器内核），支持 Python、C++、JavaScript 三种编程语言的代码编辑、语法高亮、智能补全和在线执行。

## 迁移状态 ✅

### 已完成的迁移
- ✅ **类型定义** - 完整的 TypeScript 类型系统
- ✅ **服务层** - 统一的代码运行环境管理
- ✅ **Worker 文件** - Python、C++、JavaScript 运行时
- ✅ **Context 系统** - Runtime Context 状态管理
- ✅ **核心组件** - CodeEditor、OutputPanel、IntegratedCodeRunner
- ✅ **UI 适配** - 适配 refactor 系统的设计风格
- ✅ **向后兼容** - 原有导入路径继续有效

### 架构优化
- **统一风格** - 适配 refactor 系统的 UI 组件风格
- **类型安全** - 完整的 TypeScript 类型定义
- **模块化** - 清晰的组件和服务分离
- **可扩展** - 支持新语言和功能的扩展

## 主要特性

### 🎨 语法高亮
- **Python**: 支持 Python 语法高亮，包括关键字、字符串、注释等
- **C++**: 支持 C++ 语法高亮，包括预处理器、STL 库等
- **JavaScript**: 支持 ES6+ 语法高亮，包括箭头函数、模板字符串等

### 🧠 智能补全
- **Python**: 提供常用函数和语句的智能补全
- **C++**: 提供 C++ 基础补全
- **JavaScript**: 提供 JavaScript 常用补全

### ⚡ 编辑器特性
- **快捷键支持**: `Ctrl/Cmd + Enter` 快速运行代码
- **自动括号匹配**: 自动配对各种括号和引号
- **智能缩进**: 语言特定的缩进规则
- **代码折叠**: 支持函数和类的代码折叠
- **主题支持**: 暗色/亮色主题切换

### 🎯 用户体验
- **实时反馈**: 代码更改即时响应
- **加载状态**: 优雅的加载动画
- **错误提示**: 清晰的错误信息显示
- **执行历史**: 保存最近的代码执行记录

## 使用方式

### 在 Refactor 系统中使用
```tsx
import { 
  IntegratedCodeRunner,
  PythonRunner,
  RuntimeProvider 
} from '../../refactor/components/features/CodeRunner'

// 使用 Runtime Provider 包装应用
<RuntimeProvider>
  <PythonRunner 
    initialCode="print('Hello, World!')"
    height="400px"
    theme="dark"
  />
</RuntimeProvider>
```

### 在原有系统中使用（向后兼容）
```tsx
import { 
  IntegratedCodeRunner,
  PythonRunner,
  RuntimeProvider 
} from '../modules/codeRunner'

// 原有的导入路径继续有效，自动重定向到 refactor 系统
<RuntimeProvider>
  <PythonRunner initialCode="print('Hello, World!')" />
</RuntimeProvider>
```

## 组件 API

### IntegratedCodeRunner
```tsx
interface IntegratedCodeRunnerProps {
  language: 'python' | 'cpp' | 'javascript'
  initialCode?: string
  height?: string
  theme?: 'light' | 'dark'
  showExamples?: boolean
  readOnly?: boolean
  onCodeChange?: (code: string) => void
  onExecutionResult?: (result: CodeExecution) => void
  className?: string
}
```

### 预配置组件
- `PythonRunner` - Python 代码运行器
- `JavaScriptRunner` - JavaScript 代码运行器
- `CppRunner` - C++ 代码运行器
- `CompactCodeRunner` - 紧凑版运行器
- `CodeDisplay` - 只读代码展示器

## 技术实现

### Monaco Editor 集成
- 完整的 VS Code 编辑器体验
- 语言特定的配置和补全
- 自定义主题和快捷键

### Runtime 管理
- Lazy loading 运行时初始化
- 多语言 Worker 管理
- 智能缓存和错误恢复

### 状态管理
- React Context 统一状态管理
- 执行历史记录
- 运行时状态监控

## 性能优化

### Lazy Loading
- 编辑器按需加载
- Language workers 懒加载
- 运行时环境缓存

### 内存管理
- 组件卸载时自动清理
- Workers 生命周期管理
- 执行历史限制

## 兼容性

### 向后兼容
- ✅ 原有导入路径继续有效
- ✅ 原有 API 接口保持不变
- ✅ 原有功能全部保留

### 浏览器支持
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

## 文件结构
```
src/refactor/components/features/CodeRunner/
├── types.ts                    # 类型定义
├── service.ts                  # 服务层
├── pyodideWorker.ts           # Python 运行时
├── emscriptenWorker.ts        # C++ 运行时
├── javascriptWorker.ts        # JavaScript 运行时
├── context/
│   └── RuntimeContext.tsx    # Runtime Context
├── components/
│   ├── CodeEditor.tsx         # 代码编辑器
│   ├── OutputPanel.tsx        # 输出面板
│   └── IntegratedCodeRunner.tsx # 集成运行器
└── index.ts                   # 统一导出
```

## 迁移完成 🎉

CodeRunner 模块已成功迁移到 refactor 系统，具备：
- ✅ 完整的功能保留
- ✅ 优化的架构设计
- ✅ 统一的 UI 风格
- ✅ 100% 向后兼容
- ✅ 生产就绪状态

原有系统可以无缝使用新的 CodeRunner 模块，无需修改任何代码。 