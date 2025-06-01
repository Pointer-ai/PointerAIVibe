/*
 * Pointer.ai - AI驱动的个性化编程学习平台
 * Copyright (C) 2024 Pointer.ai
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 课程内容样例数据

import { CourseContent } from '../types/courseContent'

/**
 * 样例课程内容：Python变量和数据类型
 */
export const pythonVariablesContent: CourseContent = {
  id: 'content_python_variables_001',
  nodeId: 'node_python_basics_001',
  title: 'Python变量和数据类型',
  description: '学习Python中变量的声明、赋值以及基本数据类型的使用',
  order: 1,
  
  explanation: {
    id: 'exp_python_variables_001',
    title: '变量和数据类型详解',
    content: {
      markdown: `# Python变量和数据类型

## 什么是变量？

变量是程序中用来存储数据值的标识符。在Python中，变量不需要显式声明类型，Python会根据赋给变量的值自动确定其类型。

### 变量的命名规则

1. 变量名只能包含字母、数字和下划线
2. 变量名不能以数字开头
3. 变量名不能是Python的关键字
4. 变量名区分大小写

## Python的基本数据类型

### 1. 整数（int）
整数是没有小数部分的数字。

### 2. 浮点数（float）
浮点数包含小数部分的数字。

### 3. 字符串（str）
字符串是由字符组成的序列，用引号括起来。

### 4. 布尔值（bool）
布尔值只有两个值：True 和 False。

## 变量赋值

在Python中，使用等号（=）进行变量赋值：

\`\`\`python
variable_name = value
\`\`\`

## 类型检查

可以使用 \`type()\` 函数来检查变量的类型：

\`\`\`python
print(type(variable_name))
\`\`\``,
      
      codeExamples: [
        {
          id: 'example_001',
          title: '变量声明和赋值',
          description: '演示如何声明变量并赋值',
          language: 'python',
          code: `# 整数变量
age = 25
student_count = 100

# 浮点数变量
height = 1.75
price = 19.99

# 字符串变量
name = "张三"
message = '欢迎学习Python!'

# 布尔值变量
is_student = True
has_discount = False

# 打印变量值和类型
print(f"姓名: {name}, 类型: {type(name)}")
print(f"年龄: {age}, 类型: {type(age)}")
print(f"身高: {height}, 类型: {type(height)}")
print(f"是否为学生: {is_student}, 类型: {type(is_student)}")`,
          output: `姓名: 张三, 类型: <class 'str'>
年龄: 25, 类型: <class 'int'>
身高: 1.75, 类型: <class 'float'>
是否为学生: True, 类型: <class 'bool'>`,
          explanation: '这个例子展示了Python中四种基本数据类型的变量声明和使用。注意Python会自动推断变量类型。',
          concepts: ['变量赋值', '数据类型', 'type函数', 'f-string格式化']
        },
        {
          id: 'example_002',
          title: '变量重新赋值',
          description: '演示Python变量的动态类型特性',
          language: 'python',
          code: `# Python变量可以重新赋值为不同类型的值
data = 42          # 开始是整数
print(f"data = {data}, 类型: {type(data)}")

data = "Hello"     # 重新赋值为字符串
print(f"data = {data}, 类型: {type(data)}")

data = 3.14        # 重新赋值为浮点数
print(f"data = {data}, 类型: {type(data)}")

data = [1, 2, 3]   # 重新赋值为列表
print(f"data = {data}, 类型: {type(data)}")`,
          output: `data = 42, 类型: <class 'int'>
data = Hello, 类型: <class 'str'>
data = 3.14, 类型: <class 'float'>
data = [1, 2, 3], 类型: <class 'list'>`,
          explanation: '这展示了Python的动态类型特性：同一个变量可以在运行时被赋予不同类型的值。',
          concepts: ['动态类型', '变量重新赋值', '类型推断']
        }
      ]
    },
    
    learningObjectives: [
      '理解什么是变量以及变量的作用',
      '掌握Python变量的命名规则',
      '了解Python的四种基本数据类型',
      '学会使用type()函数检查变量类型',
      '理解Python的动态类型特性'
    ],
    
    prerequisites: [
      '了解什么是编程',
      '熟悉Python开发环境'
    ],
    
    keyConcepts: [
      {
        term: '变量',
        definition: '用来存储数据值的标识符，在程序中可以被引用和修改',
        examples: ['age = 25', 'name = "张三"']
      },
      {
        term: '数据类型',
        definition: '定义了数据的种类和可以对数据执行的操作',
        examples: ['int（整数）', 'str（字符串）', 'float（浮点数）', 'bool（布尔值）']
      },
      {
        term: '动态类型',
        definition: '变量的类型在运行时确定，可以在程序执行过程中改变',
        examples: ['x = 1', 'x = "hello"  # 同一变量不同类型']
      }
    ]
  },
  
  practice: {
    id: 'practice_python_variables_001',
    title: '变量和数据类型练习',
    exercises: [
      {
        id: 'exercise_001',
        type: 'coding',
        title: '变量声明和类型检查',
        description: '创建不同类型的变量并打印它们的类型',
        difficulty: 1,
        estimatedTime: 5,
        points: 10,
        content: {
          type: 'coding',
          language: 'python',
          problemStatement: `请完成以下任务：

1. 创建一个整数变量 \`student_id\`，值为 12345
2. 创建一个字符串变量 \`student_name\`，值为你的名字
3. 创建一个浮点数变量 \`gpa\`，值为 3.85
4. 创建一个布尔值变量 \`is_graduated\`，值为 False
5. 使用 print() 和 type() 函数打印每个变量的值和类型

输出格式：
student_id: 12345, type: <class 'int'>
student_name: 你的名字, type: <class 'str'>
...以此类推`,
          starterCode: `# 在这里创建变量
student_id = 
student_name = 
gpa = 
is_graduated = 

# 在这里打印变量的值和类型
`,
          testCases: [
            {
              id: 'test_001',
              input: {},
              expectedOutput: {
                variables: {
                  student_id: { value: 12345, type: 'int' },
                  student_name: { type: 'str' },
                  gpa: { value: 3.85, type: 'float' },
                  is_graduated: { value: false, type: 'bool' }
                }
              },
              description: '检查变量是否正确创建'
            }
          ],
          template: {
            imports: [],
            functions: [],
            constraints: [
              '必须使用指定的变量名',
              '必须使用指定的数据类型',
              '必须打印变量的值和类型'
            ]
          },
          evaluation: {
            autoGrading: true,
            criteria: [
              '变量名正确',
              '数据类型正确',
              '变量值正确',
              '输出格式正确'
            ]
          }
        },
        hints: [
          '使用 = 号进行变量赋值',
          '字符串需要用引号括起来',
          '使用 f-string 或 format() 进行字符串格式化',
          'type() 函数可以获取变量的类型'
        ],
        solution: {
          code: `# 创建变量
student_id = 12345
student_name = "张三"  # 替换为你的名字
gpa = 3.85
is_graduated = False

# 打印变量的值和类型
print(f"student_id: {student_id}, type: {type(student_id)}")
print(f"student_name: {student_name}, type: {type(student_name)}")
print(f"gpa: {gpa}, type: {type(gpa)}")
print(f"is_graduated: {is_graduated}, type: {type(is_graduated)}")`,
          explanation: '这个解决方案展示了如何正确创建不同类型的变量，并使用f-string格式化输出变量的值和类型。',
          approach: '1. 按要求创建四个不同类型的变量 2. 使用f-string和type()函数格式化输出'
        },
        explanation: '这个练习帮助你熟悉Python变量的创建和类型检查，这是Python编程的基础技能。'
      },
      {
        id: 'exercise_002',
        type: 'quiz',
        title: '数据类型选择题',
        description: '测试对Python数据类型的理解',
        difficulty: 2,
        estimatedTime: 3,
        points: 5,
        content: {
          type: 'quiz',
          question: '以下哪个变量声明是正确的Python语法？',
          options: [
            {
              id: 'A',
              text: 'int age = 25;',
              isCorrect: false
            },
            {
              id: 'B', 
              text: 'age: int = 25',
              isCorrect: false
            },
            {
              id: 'C',
              text: 'age = 25',
              isCorrect: true
            },
            {
              id: 'D',
              text: 'var age = 25',
              isCorrect: false
            }
          ],
          multipleChoice: false
        },
        hints: [
          'Python不需要显式声明变量类型',
          'Python不需要分号结束语句',
          'Python使用简单的赋值语法'
        ],
        solution: {
          explanation: '答案是C。Python使用简单的 variable_name = value 语法进行变量赋值，不需要声明类型。',
          approach: '回忆Python变量赋值的基本语法：变量名 = 值'
        },
        explanation: '这道题测试你对Python变量声明语法的理解。'
      }
    ],
    assessment: {
      passingScore: 70,
      attempts: 3,
      timeLimit: 15
    }
  },
  
  metadata: {
    estimatedReadingTime: 12,
    difficulty: 1,
    language: 'python',
    skills: ['变量声明', '数据类型', '类型检查'],
    concepts: ['变量', '整数', '浮点数', '字符串', '布尔值', '动态类型'],
    keywords: ['variable', 'int', 'float', 'str', 'bool', 'type'],
    learningOutcomes: [
      '能够正确声明和使用Python变量',
      '理解Python的基本数据类型',
      '掌握变量类型检查方法'
    ],
    learningStyles: ['visual', 'kinesthetic'],
    version: '1.0.0',
    author: 'Pointer.ai教学团队'
  },
  
  status: 'not_started',
  progress: {
    explanationCompleted: false,
    practiceCompleted: false,
    timeSpent: 0
  },
  
  createdAt: '2024-12-20T10:00:00Z',
  updatedAt: '2024-12-20T10:00:00Z'
}

/**
 * 样例课程内容：Python列表基础
 */
export const pythonListsContent: CourseContent = {
  id: 'content_python_lists_001', 
  nodeId: 'node_python_datastructures_001',
  title: 'Python列表基础',
  description: '学习Python列表的创建、访问、修改和常用操作',
  order: 1,
  
  explanation: {
    id: 'exp_python_lists_001',
    title: 'Python列表详解',
    content: {
      markdown: `# Python列表基础

## 什么是列表？

列表（List）是Python中最常用的数据结构之一，用来存储多个项目的有序集合。列表是可变的，意味着可以在创建后修改其内容。

## 列表的特点

1. **有序性**：列表中的元素有固定的顺序
2. **可变性**：可以修改列表中的元素
3. **允许重复**：列表可以包含重复的元素
4. **混合类型**：列表可以包含不同类型的元素

## 创建列表

### 空列表
\`\`\`python
empty_list = []
empty_list2 = list()
\`\`\`

### 包含元素的列表
\`\`\`python
numbers = [1, 2, 3, 4, 5]
fruits = ["苹果", "香蕉", "橙子"]
mixed = [1, "hello", 3.14, True]
\`\`\`

## 访问列表元素

使用索引（从0开始）访问列表元素：

\`\`\`python
fruits = ["苹果", "香蕉", "橙子"]
first_fruit = fruits[0]    # "苹果"
last_fruit = fruits[-1]    # "橙子" (负索引从末尾开始)
\`\`\`

## 列表切片

可以使用切片获取列表的一部分：

\`\`\`python
numbers = [0, 1, 2, 3, 4, 5]
slice1 = numbers[1:4]      # [1, 2, 3]
slice2 = numbers[:3]       # [0, 1, 2]
slice3 = numbers[3:]       # [3, 4, 5]
\`\`\``,
      
      codeExamples: [
        {
          id: 'example_list_001',
          title: '列表创建和基本操作',
          description: '演示列表的创建、访问和基本操作',
          language: 'python',
          code: `# 创建不同类型的列表
numbers = [1, 2, 3, 4, 5]
fruits = ["苹果", "香蕉", "橙子", "葡萄"]
mixed_list = [1, "hello", 3.14, True, [1, 2, 3]]

# 访问列表元素
print("第一个数字:", numbers[0])
print("最后一个水果:", fruits[-1])
print("混合列表的第二个元素:", mixed_list[1])

# 列表长度
print("数字列表长度:", len(numbers))
print("水果列表长度:", len(fruits))

# 检查元素是否在列表中
print("苹果在水果列表中吗?", "苹果" in fruits)
print("橘子在水果列表中吗?", "橘子" in fruits)`,
          output: `第一个数字: 1
最后一个水果: 葡萄
混合列表的第二个元素: hello
数字列表长度: 5
水果列表长度: 4
苹果在水果列表中吗? True
橘子在水果列表中吗? False`,
          explanation: '这个例子展示了列表的基本创建和访问操作，包括正索引、负索引、长度计算和成员检查。',
          concepts: ['列表创建', '索引访问', 'len函数', 'in操作符']
        },
        {
          id: 'example_list_002',
          title: '列表切片操作',
          description: '演示列表切片的各种用法',
          language: 'python',
          code: `# 创建一个数字列表
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 基本切片
print("前3个元素:", numbers[:3])
print("从索引3开始到结尾:", numbers[3:])
print("索引2到5（不包括5）:", numbers[2:5])

# 步长切片
print("每隔一个元素:", numbers[::2])
print("倒序:", numbers[::-1])
print("从索引1开始，每隔2个:", numbers[1::2])

# 负索引切片
print("最后3个元素:", numbers[-3:])
print("倒数第5个到倒数第2个:", numbers[-5:-1])`,
          output: `前3个元素: [0, 1, 2]
从索引3开始到结尾: [3, 4, 5, 6, 7, 8, 9]
索引2到5（不包括5）: [2, 3, 4]
每隔一个元素: [0, 2, 4, 6, 8]
倒序: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
从索引1开始，每隔2个: [1, 3, 5, 7, 9]
最后3个元素: [7, 8, 9]
倒数第5个到倒数第2个: [5, 6, 7, 8]`,
          explanation: '切片是Python列表的强大特性，语法为[start:stop:step]，可以灵活地获取列表的子集。',
          concepts: ['列表切片', '步长', '负索引', '切片语法']
        }
      ]
    },
    
    learningObjectives: [
      '理解什么是列表以及列表的特点',
      '掌握列表的创建方法',
      '学会使用索引访问列表元素',
      '掌握列表切片操作',
      '了解列表的基本方法和操作'
    ],
    
    prerequisites: [
      '掌握Python变量和基本数据类型',
      '了解索引的概念'
    ],
    
    keyConcepts: [
      {
        term: '列表',
        definition: '有序的、可变的、允许重复元素的数据集合',
        examples: ['[1, 2, 3]', '["a", "b", "c"]']
      },
      {
        term: '索引',
        definition: '用来访问列表中特定位置元素的数字，从0开始计数',
        examples: ['list[0]', 'list[-1]']
      },
      {
        term: '切片',
        definition: '获取列表子集的操作，语法为[start:stop:step]',
        examples: ['list[1:3]', 'list[::2]', 'list[::-1]']
      }
    ]
  },
  
  practice: {
    id: 'practice_python_lists_001',
    title: '列表操作练习',
    exercises: [
      {
        id: 'exercise_lists_001',
        type: 'coding',
        title: '列表创建和访问',
        description: '创建列表并执行基本的访问操作',
        difficulty: 2,
        estimatedTime: 8,
        points: 15,
        content: {
          type: 'coding',
          language: 'python',
          problemStatement: `请完成以下任务：

1. 创建一个名为 \`colors\` 的列表，包含5种颜色的名称
2. 打印列表的第一个和最后一个元素
3. 打印列表的长度
4. 创建一个名为 \`middle_colors\` 的列表，包含 \`colors\` 的中间3个元素（使用切片）
5. 检查 "红色" 是否在 \`colors\` 列表中，并打印结果

期望输出格式：
第一个颜色: xxx
最后一个颜色: xxx
颜色总数: 5
中间3个颜色: [xxx, xxx, xxx]
红色在列表中: True/False`,
          starterCode: `# 创建颜色列表
colors = 

# 打印第一个和最后一个元素


# 打印列表长度


# 创建中间3个元素的列表


# 检查"红色"是否在列表中

`,
          testCases: [
            {
              id: 'test_lists_001',
              input: {},
              expectedOutput: {
                colors_length: 5,
                middle_length: 3,
                has_operations: true
              },
              description: '检查列表操作是否正确'
            }
          ],
          template: {
            imports: [],
            functions: [],
            constraints: [
              '必须使用指定的变量名',
              '列表必须包含5个元素',
              '必须使用切片获取中间3个元素'
            ]
          },
          evaluation: {
            autoGrading: true,
            criteria: [
              '列表创建正确',
              '访问操作正确',
              '切片操作正确',
              '成员检查正确'
            ]
          }
        },
        hints: [
          '列表使用方括号[]创建',
          '负索引-1表示最后一个元素',
          '切片语法：list[start:end]',
          '使用in操作符检查成员'
        ],
        solution: {
          code: `# 创建颜色列表
colors = ["红色", "蓝色", "绿色", "黄色", "紫色"]

# 打印第一个和最后一个元素
print("第一个颜色:", colors[0])
print("最后一个颜色:", colors[-1])

# 打印列表长度
print("颜色总数:", len(colors))

# 创建中间3个元素的列表
middle_colors = colors[1:4]
print("中间3个颜色:", middle_colors)

# 检查"红色"是否在列表中
print("红色在列表中:", "红色" in colors)`,
          explanation: '这个解决方案展示了列表的基本操作：创建、索引访问、长度计算、切片和成员检查。',
          approach: '1. 创建包含5个颜色的列表 2. 使用索引访问首尾元素 3. 使用len()获取长度 4. 使用切片获取子列表 5. 使用in检查成员'
        },
        explanation: '这个练习涵盖了列表的核心操作，是掌握Python数据结构的重要基础。'
      }
    ],
    assessment: {
      passingScore: 80,
      attempts: 3,
      timeLimit: 20
    }
  },
  
  metadata: {
    estimatedReadingTime: 10,
    difficulty: 2,
    language: 'python',
    skills: ['列表操作', '索引访问', '切片操作'],
    concepts: ['列表', '索引', '切片', '成员检查', '列表方法'],
    keywords: ['list', 'index', 'slice', 'append', 'len'],
    learningOutcomes: [
      '能够创建和操作Python列表',
      '掌握列表索引和切片操作',
      '理解列表的特性和应用场景'
    ],
    learningStyles: ['visual', 'kinesthetic'],
    version: '1.0.0',
    author: 'Pointer.ai教学团队'
  },
  
  status: 'not_started',
  progress: {
    explanationCompleted: false,
    practiceCompleted: false,
    timeSpent: 0
  },
  
  createdAt: '2024-12-20T10:30:00Z',
  updatedAt: '2024-12-20T10:30:00Z'
}

/**
 * 所有样例课程内容
 */
export const sampleCourseContents: CourseContent[] = [
  pythonVariablesContent,
  pythonListsContent
]

/**
 * 根据节点ID获取课程内容
 */
export const getCourseContentsByNodeId = (nodeId: string): CourseContent[] => {
  return sampleCourseContents.filter(content => content.nodeId === nodeId)
}

/**
 * 根据ID获取课程内容
 */
export const getCourseContentById = (contentId: string): CourseContent | undefined => {
  return sampleCourseContents.find(content => content.id === contentId)
} 