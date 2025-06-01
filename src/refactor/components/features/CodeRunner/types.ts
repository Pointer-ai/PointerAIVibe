/**
 * CodeRunner 功能模块类型定义
 * 统一的代码运行环境类型系统
 */

export interface CodeExecution {
  id: string
  code: string
  language: 'python' | 'cpp' | 'javascript'
  timestamp: string
  status: 'pending' | 'running' | 'success' | 'error'
  output?: string
  error?: string
  executionTime?: number // 毫秒
}

export interface CodeSnippet {
  id: string
  title: string
  description: string
  code: string
  language: 'python' | 'cpp' | 'javascript'
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface PyodideStatus {
  isLoading: boolean
  isReady: boolean
  error?: string
  version?: string
}

// 通用的运行时状态
export interface RuntimeStatus {
  python?: PyodideStatus
  cpp?: {
    isLoading: boolean
    isReady: boolean
    error?: string
    version?: string
  }
  javascript?: {
    isLoading: boolean
    isReady: boolean
    error?: string
    version?: string
  }
}

export interface WorkerMessage {
  type: 'init' | 'ready' | 'run' | 'result' | 'error' | 'output'
  language?: 'python' | 'cpp' | 'javascript'
  payload?: any
  result?: string
  error?: string
}

// 组件 Props 类型
export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'python' | 'cpp' | 'javascript'
  onRun?: () => void
  readOnly?: boolean
  theme?: 'light' | 'dark'
  height?: string
  className?: string
}

export interface OutputPanelProps {
  output: string
  isLoading: boolean
  hasError: boolean
  onClear?: () => void
  className?: string
}

export interface IntegratedCodeRunnerProps {
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

// 支持的语言类型
export type SupportedLanguage = 'python' | 'cpp' | 'javascript'

// 代码示例类型
export interface CodeExample {
  id: string
  title: string
  description: string
  code: string
  language: SupportedLanguage
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

// Runtime Context 类型
export interface RuntimeContextValue {
  runtimeStatus: RuntimeStatus
  executeCode: (code: string, language: SupportedLanguage) => Promise<CodeExecution>
  getExecutionHistory: (language?: SupportedLanguage) => CodeExecution[]
  clearHistory: (language?: SupportedLanguage) => void
  initRuntime: (language: SupportedLanguage) => Promise<void>
  cleanup: () => void
}

// 预置代码示例
export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'python-hello',
    title: 'Python Hello World',
    description: 'Python 入门程序',
    code: 'print("Hello, World!")',
    language: 'python',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'python-variables',
    title: 'Python 变量和数据类型',
    description: '学习 Python 的基本数据类型',
    code: `# 数字
age = 25
height = 1.75

# 字符串
name = "张三"
city = '北京'

# 布尔值
is_student = True

# 打印变量
print(f"姓名: {name}")
print(f"年龄: {age}")
print(f"身高: {height}米")
print(f"是学生吗: {is_student}")`,
    language: 'python',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'python-fibonacci',
    title: 'Python 斐波那契数列',
    description: '计算斐波那契数列',
    code: `def fibonacci(n):
    """生成前 n 个斐波那契数"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    
    return fib

# 生成前 10 个斐波那契数
result = fibonacci(10)
print("前 10 个斐波那契数:", result)`,
    language: 'python',
    category: '算法',
    difficulty: 'intermediate'
  },
  {
    id: 'cpp-hello',
    title: 'C++ Hello World',
    description: 'C++ 入门程序',
    code: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
    language: 'cpp',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'cpp-variables',
    title: 'C++ 变量和数据类型',
    description: '学习 C++ 的基本数据类型',
    code: `#include <iostream>
#include <string>

int main() {
    // 整数
    int age = 25;
    
    // 浮点数
    double height = 1.75;
    
    // 字符串
    std::string name = "张三";
    
    // 布尔值
    bool is_student = true;
    
    // 输出变量
    std::cout << "姓名: " << name << std::endl;
    std::cout << "年龄: " << age << std::endl;
    std::cout << "身高: " << height << "米" << std::endl;
    std::cout << "是学生吗: " << (is_student ? "是" : "否") << std::endl;
    
    return 0;
}`,
    language: 'cpp',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'js-hello',
    title: 'JavaScript Hello World',
    description: 'JavaScript 入门程序',
    code: 'console.log("Hello, World!");',
    language: 'javascript',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'js-variables',
    title: 'JavaScript 变量和数据类型',
    description: '学习 JavaScript 的基本数据类型',
    code: `// 变量声明
const age = 25;
let height = 1.75;
var name = "张三";

// 数据类型
const isStudent = true;
const scores = [85, 92, 78, 95];
const person = {
  name: "张三",
  age: 25,
  city: "北京"
};

// 输出变量
console.log("姓名:", name);
console.log("年龄:", age);
console.log("身高:", height + "米");
console.log("是学生吗:", isStudent);
console.log("成绩:", scores);
console.log("个人信息:", person);`,
    language: 'javascript',
    category: '基础',
    difficulty: 'beginner'
  }
]; 