/**
 * 代码运行模块类型定义
 */

export interface CodeExecution {
  id: string
  code: string
  language: 'python' | 'cpp' | 'javascript' // 扩展支持 C++
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
  language: 'python' | 'cpp' | 'javascript' // 扩展支持 C++
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface PyodideStatus {
  isLoading: boolean
  isReady: boolean
  error?: string
  version?: string
}

// 扩展为通用的运行时状态
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
  language?: 'python' | 'cpp'
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
  },
  {
    id: 'cpp-hello-world',
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
    // 基本数据类型
    int age = 25;
    double height = 1.75;
    char grade = 'A';
    bool isStudent = true;
    std::string name = "张三";
    
    // 输出变量
    std::cout << "姓名: " << name << std::endl;
    std::cout << "年龄: " << age << std::endl;
    std::cout << "身高: " << height << "米" << std::endl;
    std::cout << "成绩等级: " << grade << std::endl;
    std::cout << "是学生吗: " << (isStudent ? "是" : "否") << std::endl;
    
    return 0;
}`,
    language: 'cpp',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'cpp-arrays',
    title: 'C++ 数组操作',
    description: '学习 C++ 数组和 vector 的使用',
    code: `#include <iostream>
#include <vector>
#include <string>

int main() {
    // 使用 vector (动态数组)
    std::vector<std::string> fruits = {"苹果", "香蕉", "橙子"};
    
    std::cout << "原始数组: ";
    for (const auto& fruit : fruits) {
        std::cout << fruit << " ";
    }
    std::cout << std::endl;
    
    // 添加元素
    fruits.push_back("葡萄");
    
    std::cout << "添加后: ";
    for (size_t i = 0; i < fruits.size(); i++) {
        std::cout << fruits[i] << " ";
    }
    std::cout << std::endl;
    
    // 访问元素
    std::cout << "第一个水果: " << fruits[0] << std::endl;
    std::cout << "最后一个水果: " << fruits.back() << std::endl;
    std::cout << "数组大小: " << fruits.size() << std::endl;
    
    return 0;
}`,
    language: 'cpp',
    category: '数据结构',
    difficulty: 'beginner'
  },
  {
    id: 'cpp-fibonacci',
    title: 'C++ 斐波那契数列',
    description: '使用 C++ 计算斐波那契数列',
    code: `#include <iostream>
#include <vector>

// 递归版本
int fibonacciRecursive(int n) {
    if (n <= 1) return n;
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

// 迭代版本 (更高效)
std::vector<int> fibonacciSequence(int count) {
    std::vector<int> fib;
    if (count <= 0) return fib;
    
    if (count >= 1) fib.push_back(0);
    if (count >= 2) fib.push_back(1);
    
    for (int i = 2; i < count; i++) {
        fib.push_back(fib[i-1] + fib[i-2]);
    }
    
    return fib;
}

int main() {
    // 生成前 10 个斐波那契数
    auto sequence = fibonacciSequence(10);
    
    std::cout << "前 10 个斐波那契数: ";
    for (int num : sequence) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // 计算第 7 个斐波那契数
    std::cout << "第 7 个斐波那契数: " << fibonacciRecursive(7) << std::endl;
    
    return 0;
}`,
    language: 'cpp',
    category: '算法',
    difficulty: 'intermediate'
  },
  {
    id: 'cpp-class-example',
    title: 'C++ 类和对象',
    description: '面向对象编程基础示例',
    code: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

class Student {
private:
    std::string name;
    std::vector<int> scores;

public:
    Student(const std::string& studentName) : name(studentName) {}
    
    void addScore(int score) {
        scores.push_back(score);
    }
    
    double getAverage() const {
        if (scores.empty()) return 0.0;
        int sum = 0;
        for (int score : scores) {
            sum += score;
        }
        return static_cast<double>(sum) / scores.size();
    }
    
    int getMaxScore() const {
        if (scores.empty()) return 0;
        return *std::max_element(scores.begin(), scores.end());
    }
    
    int getMinScore() const {
        if (scores.empty()) return 0;
        return *std::min_element(scores.begin(), scores.end());
    }
    
    void printInfo() const {
        std::cout << "学生姓名: " << name << std::endl;
        std::cout << "成绩: ";
        for (int score : scores) {
            std::cout << score << " ";
        }
        std::cout << std::endl;
        std::cout << "平均分: " << getAverage() << std::endl;
        std::cout << "最高分: " << getMaxScore() << std::endl;
        std::cout << "最低分: " << getMinScore() << std::endl;
    }
};

int main() {
    Student student("小明");
    
    // 添加成绩
    student.addScore(85);
    student.addScore(92);
    student.addScore(78);
    student.addScore(95);
    student.addScore(88);
    
    // 显示信息
    student.printInfo();
    
    return 0;
}`,
    language: 'cpp',
    category: '面向对象',
    difficulty: 'intermediate'
  },

  // JavaScript 示例
  {
    id: 'js-hello-world',
    title: 'JavaScript Hello World',
    description: 'JavaScript 入门程序',
    code: `console.log("Hello, World!");`,
    language: 'javascript',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'js-variables',
    title: 'JavaScript 变量和类型',
    description: '学习 JavaScript 的变量声明和数据类型',
    code: `// 变量声明
let name = "张三";
const age = 25;
var height = 1.75;

// 基本数据类型
let isStudent = true;
let score = 98.5;
let hobby = null;
let address; // undefined

// 输出变量
console.log("姓名:", name);
console.log("年龄:", age);
console.log("身高:", height + "米");
console.log("是学生吗:", isStudent);
console.log("成绩:", score);

// 类型检查
console.log("\\n数据类型:");
console.log("typeof name:", typeof name);
console.log("typeof age:", typeof age);
console.log("typeof isStudent:", typeof isStudent);`,
    language: 'javascript',
    category: '基础',
    difficulty: 'beginner'
  },
  {
    id: 'js-arrays',
    title: 'JavaScript 数组操作',
    description: '学习 JavaScript 数组的常用方法',
    code: `// 创建数组
let fruits = ["苹果", "香蕉", "橙子"];
console.log("原始数组:", fruits);

// 添加元素
fruits.push("葡萄");
fruits.unshift("草莓"); // 添加到开头
console.log("添加后:", fruits);

// 数组方法
console.log("第一个水果:", fruits[0]);
console.log("最后一个水果:", fruits[fruits.length - 1]);
console.log("数组长度:", fruits.length);

// 遍历数组
console.log("\\n所有水果:");
fruits.forEach((fruit, index) => {
    console.log(\`\${index + 1}. \${fruit}\`);
});

// 数组过滤和映射
let longNames = fruits.filter(fruit => fruit.length > 2);
console.log("\\n名字超过2个字的水果:", longNames);

let upperCases = fruits.map(fruit => fruit.toUpperCase());
console.log("大写水果名:", upperCases);`,
    language: 'javascript',
    category: '数据结构',
    difficulty: 'beginner'
  },
  {
    id: 'js-functions',
    title: 'JavaScript 函数和箭头函数',
    description: '学习 JavaScript 的函数定义和使用',
    code: `// 传统函数定义
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 箭头函数
const fibonacciIterative = (n) => {
    if (n <= 1) return n;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
};

// 生成斐波那契数列
const generateFibSequence = (count) => {
    const sequence = [];
    for (let i = 0; i < count; i++) {
        sequence.push(fibonacciIterative(i));
    }
    return sequence;
};

// 测试函数
console.log("前 10 个斐波那契数:");
console.log(generateFibSequence(10));

console.log("\\n第 7 个斐波那契数 (递归):", fibonacci(7));
console.log("第 7 个斐波那契数 (迭代):", fibonacciIterative(7));

// 高阶函数示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
const sum = numbers.reduce((acc, x) => acc + x, 0);

console.log("\\n原数组:", numbers);
console.log("翻倍后:", doubled);
console.log("求和:", sum);`,
    language: 'javascript',
    category: '函数',
    difficulty: 'intermediate'
  },
  {
    id: 'js-objects-classes',
    title: 'JavaScript 对象和类',
    description: '面向对象编程：对象、类和继承',
    code: `// ES6 类定义
class Student {
    constructor(name) {
        this.name = name;
        this.scores = [];
    }
    
    addScore(score) {
        this.scores.push(score);
    }
    
    getAverage() {
        if (this.scores.length === 0) return 0;
        const sum = this.scores.reduce((acc, score) => acc + score, 0);
        return sum / this.scores.length;
    }
    
    getMaxScore() {
        return this.scores.length > 0 ? Math.max(...this.scores) : 0;
    }
    
    getMinScore() {
        return this.scores.length > 0 ? Math.min(...this.scores) : 0;
    }
    
    printInfo() {
        console.log(\`学生姓名: \${this.name}\`);
        console.log(\`成绩: \${this.scores.join(', ')}\`);
        console.log(\`平均分: \${this.getAverage().toFixed(2)}\`);
        console.log(\`最高分: \${this.getMaxScore()}\`);
        console.log(\`最低分: \${this.getMinScore()}\`);
    }
}

// 创建学生对象
const student = new Student("小明");

// 添加成绩
[85, 92, 78, 95, 88].forEach(score => student.addScore(score));

// 显示信息
student.printInfo();

// 对象字面量示例
const course = {
    name: "JavaScript 编程",
    students: [student],
    teacher: "李老师",
    
    addStudent(student) {
        this.students.push(student);
    },
    
    getClassAverage() {
        const allScores = this.students.flatMap(s => s.scores);
        return allScores.reduce((acc, score) => acc + score, 0) / allScores.length;
    }
};

console.log(\`\\n课程: \${course.name}\`);
console.log(\`班级平均分: \${course.getClassAverage().toFixed(2)}\`);`,
    language: 'javascript',
    category: '面向对象',
    difficulty: 'intermediate'
  },
  {
    id: 'js-async-promises',
    title: 'JavaScript 异步编程',
    description: '学习 Promise、async/await 和异步操作',
    code: `// Promise 示例
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟异步数据获取
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (userId > 0) {
                resolve({
                    id: userId,
                    name: \`用户\${userId}\`,
                    email: \`user\${userId}@example.com\`
                });
            } else {
                reject(new Error('无效的用户ID'));
            }
        }, 1000);
    });
}

// 使用 async/await
async function getUserInfo(userId) {
    try {
        console.log('开始获取用户数据...');
        const user = await fetchUserData(userId);
        console.log('用户数据:', user);
        
        // 模拟再获取用户详细信息
        await delay(500);
        console.log(\`\${user.name} 的详细信息加载完成\`);
        
        return user;
    } catch (error) {
        console.error('获取用户数据失败:', error.message);
    }
}

// 并行处理多个异步操作
async function getAllUsers() {
    try {
        const userPromises = [1, 2, 3].map(id => fetchUserData(id));
        const users = await Promise.all(userPromises);
        
        console.log('\\n所有用户数据:');
        users.forEach(user => {
            console.log(\`- \${user.name} (\${user.email})\`);
        });
    } catch (error) {
        console.error('获取用户列表失败:', error.message);
    }
}

// 执行异步操作
console.log('=== 单个用户 ===');
getUserInfo(1);

setTimeout(() => {
    console.log('\\n=== 多个用户 ===');
    getAllUsers();
}, 2000);

console.log('这行会立即执行，不会等待异步操作');`,
    language: 'javascript',
    category: '异步编程',
    difficulty: 'advanced'
  }
] 