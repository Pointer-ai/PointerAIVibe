/**
 * 代码运行模块类型定义
 */

export interface CodeExecution {
  id: string
  code: string
  language: 'python' | 'javascript' // 未来可扩展
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
  language: 'python' | 'javascript'
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface PyodideStatus {
  isLoading: boolean
  isReady: boolean
  error?: string
  version?: string
}

export interface WorkerMessage {
  type: 'init' | 'ready' | 'run' | 'result' | 'error' | 'output'
  payload?: any
  result?: string
  error?: string
}

// 预置的代码示例
export const CODE_EXAMPLES: CodeSnippet[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: '经典的第一个程序',
    code: 'print("Hello, World!")',
    language: 'python',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'variables',
    title: '变量和数据类型',
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
    id: 'list-operations',
    title: '列表操作',
    description: '学习 Python 列表的基本操作',
    code: `# 创建列表
fruits = ["苹果", "香蕉", "橙子"]
print("原始列表:", fruits)

# 添加元素
fruits.append("葡萄")
print("添加后:", fruits)

# 访问元素
print("第一个水果:", fruits[0])
print("最后一个水果:", fruits[-1])

# 列表长度
print("\\n所有水果:")
for fruit in fruits:
    print(f"- {fruit}")`,
    language: 'python',
    category: '数据结构',
    difficulty: 'beginner'
  },
  {
    id: 'fibonacci',
    title: '斐波那契数列',
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
print("前 10 个斐波那契数:", result)

# 计算第 n 个斐波那契数
def nth_fibonacci(n):
    if n <= 1:
        return n
    return nth_fibonacci(n-1) + nth_fibonacci(n-2)

print("\\n第 7 个斐波那契数:", nth_fibonacci(7))`,
    language: 'python',
    category: '算法',
    difficulty: 'intermediate'
  },
  {
    id: 'data-analysis',
    title: '简单数据分析',
    description: '使用 Python 进行基础数据分析',
    code: `# 学生成绩数据
scores = [85, 92, 78, 95, 88, 76, 90, 82, 87, 91]

# 计算平均分
average = sum(scores) / len(scores)
print(f"平均分: {average:.2f}")

# 找出最高分和最低分
max_score = max(scores)
min_score = min(scores)
print(f"最高分: {max_score}")
print(f"最低分: {min_score}")

# 统计各分数段
excellent = [s for s in scores if s >= 90]
good = [s for s in scores if 80 <= s < 90]
fair = [s for s in scores if 70 <= s < 80]

print(f"\\n成绩分布:")
print(f"优秀 (≥90): {len(excellent)} 人")
print(f"良好 (80-89): {len(good)} 人")
print(f"及格 (70-79): {len(fair)} 人")

# 排序
sorted_scores = sorted(scores, reverse=True)
print(f"\\n成绩排名: {sorted_scores}")`,
    language: 'python',
    category: '数据处理',
    difficulty: 'intermediate'
  }
] 