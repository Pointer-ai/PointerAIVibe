import React, { useState } from 'react'
import { 
  RuntimeProvider,
  IntegratedCodeRunner,
  PythonRunner,
  JavaScriptRunner,
  CppRunner,
  CompactCodeRunner,
  CodeDisplay 
} from '../index'
import { DeleteConfirmDialog, useToast } from '../../../components/common'

/**
 * 场景1：学习模块中的完整代码练习
 * 特点：自动初始化、完整的编辑器和输出面板
 */
export const LearningModuleExample: React.FC = () => {
  const handleCodeChange = (code: string) => {
    console.log('代码变更:', code)
  }

  const handleRunComplete = (execution: any) => {
    console.log('执行完成:', execution)
  }

  return (
    <RuntimeProvider 
      config={{
        preloadLanguages: ['javascript', 'python'], // 预加载常用语言
        autoCleanup: true
      }}
    >
      <div className="learning-module p-6">
        <h2 className="text-2xl font-bold mb-4">Python 基础练习</h2>
        
        <PythonRunner
          initialCode={`# 练习：计算斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 计算前10个斐波那契数
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`}
          onCodeChange={handleCodeChange}
          onRunComplete={handleRunComplete}
          height="400px"
        />
      </div>
    </RuntimeProvider>
  )
}

/**
 * 场景2：课程内容中的代码演示
 * 特点：只读模式、隐藏运行按钮、代码展示
 */
export const CourseContentExample: React.FC = () => {
  return (
    <RuntimeProvider>
      <div className="course-content p-6">
        <h3 className="text-lg font-semibold mb-3">示例：JavaScript 闭包</h3>
        
        <CodeDisplay
          language="javascript"
          initialCode={`// 闭包示例
function createCounter() {
    let count = 0;
    
    return function() {
        count++;
        return count;
    };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`}
          theme="light"
        />
        
        <p className="mt-4 text-gray-600">
          这个例子展示了如何使用闭包来创建私有变量。
        </p>
      </div>
    </RuntimeProvider>
  )
}

/**
 * 场景3：快速代码测试工具
 * 特点：紧凑布局、多语言切换
 */
export const QuickTestToolExample: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = React.useState<'python' | 'javascript' | 'cpp'>('javascript')

  return (
    <RuntimeProvider config={{ preloadLanguages: ['javascript'] }}>
      <div className="quick-test-tool p-4 border rounded-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">选择语言:</label>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            className="border rounded px-3 py-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        
        <CompactCodeRunner
          language={selectedLanguage}
          initialCode={getDefaultCode(selectedLanguage)}
          runButtonText="快速运行"
        />
      </div>
    </RuntimeProvider>
  )
}

/**
 * 场景4：编程挑战/题目练习
 * 特点：带有验证逻辑、自定义回调
 */
export const CodingChallengeExample: React.FC = () => {
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null)

  const validateSolution = async (code: string): Promise<boolean> => {
    // 运行前验证
    console.log('验证解决方案...')
    return true // 允许运行
  }

  const checkAnswer = (execution: any) => {
    // 检查答案是否正确
    if (execution.status === 'success') {
      // 这里可以添加更复杂的验证逻辑
      const isValid = execution.output.includes('Hello, World!')
      setIsCorrect(isValid)
    }
  }

  return (
    <RuntimeProvider>
      <div className="coding-challenge p-6 border rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-bold">编程挑战</h3>
          <p className="text-gray-600">编写一个程序，输出 "Hello, World!"</p>
        </div>

        {isCorrect !== null && (
          <div className={`p-3 rounded mb-4 ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isCorrect ? '✅ 答案正确！' : '❌ 答案不正确，请重试'}
          </div>
        )}

        <PythonRunner
          initialCode="# 在这里编写你的代码\n"
          onBeforeRun={validateSolution}
          onRunComplete={checkAnswer}
          runButtonText="提交答案"
        />
      </div>
    </RuntimeProvider>
  )
}

/**
 * 场景5：多语言对比展示
 * 特点：并排显示不同语言的实现
 */
export const MultiLanguageComparisonExample: React.FC = () => {
  return (
    <RuntimeProvider config={{ preloadLanguages: ['javascript', 'python', 'cpp'] }}>
      <div className="multi-language-comparison p-6">
        <h3 className="text-xl font-bold mb-4">同一算法的多语言实现</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-2">JavaScript 实现</h4>
            <JavaScriptRunner
              initialCode={`function quickSort(arr) {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];
    
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    
    return [...quickSort(left), pivot, ...quickSort(right)];
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('原数组:', numbers);
console.log('排序后:', quickSort(numbers));`}
              height="300px"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Python 实现</h4>
            <PythonRunner
              initialCode={`def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[-1]
    left = [x for x in arr[:-1] if x < pivot]
    right = [x for x in arr[:-1] if x >= pivot]
    
    return quick_sort(left) + [pivot] + quick_sort(right)

numbers = [64, 34, 25, 12, 22, 11, 90]
print('原数组:', numbers)
print('排序后:', quick_sort(numbers))`}
              height="300px"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">C++ 实现</h4>
            <CppRunner
              initialCode={`#include <iostream>
#include <vector>
using namespace std;

vector<int> quickSort(vector<int> arr) {
    if (arr.size() <= 1) return arr;
    
    int pivot = arr.back();
    vector<int> left, right;
    
    for (int i = 0; i < arr.size() - 1; i++) {
        if (arr[i] < pivot) {
            left.push_back(arr[i]);
        } else {
            right.push_back(arr[i]);
        }
    }
    
    vector<int> sortedLeft = quickSort(left);
    vector<int> sortedRight = quickSort(right);
    
    sortedLeft.push_back(pivot);
    sortedLeft.insert(sortedLeft.end(), sortedRight.begin(), sortedRight.end());
    
    return sortedLeft;
}

int main() {
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    
    cout << "原数组: ";
    for (int num : numbers) cout << num << " ";
    cout << endl;
    
    vector<int> sorted = quickSort(numbers);
    cout << "排序后: ";
    for (int num : sorted) cout << num << " ";
    cout << endl;
    
    return 0;
}`}
              height="300px"
            />
          </div>
        </div>
      </div>
    </RuntimeProvider>
  )
}

/**
 * 场景6：自定义配置和高级用法
 */
export const AdvancedUsageExample: React.FC = () => {
  const [showRunConfirm, setShowRunConfirm] = useState(false)
  const [pendingCode, setPendingCode] = useState('')
  const [runCallback, setRunCallback] = useState<((value: boolean) => void) | null>(null)
  const { ToastContainer } = useToast()

  const handleBeforeRun = async (code: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingCode(code)
      setRunCallback(() => resolve)
      setShowRunConfirm(true)
    })
  }

  const confirmRun = () => {
    setShowRunConfirm(false)
    if (runCallback) {
      runCallback(true)
      setRunCallback(null)
    }
  }

  const cancelRun = () => {
    setShowRunConfirm(false)
    if (runCallback) {
      runCallback(false)
      setRunCallback(null)
    }
  }

  return (
    <RuntimeProvider 
      config={{
        preloadLanguages: ['python'],
        autoCleanup: false, // 手动管理清理
        statusUpdateInterval: 500 // 更频繁的状态更新
      }}
    >
      <div className="advanced-usage p-6">
        <h3 className="text-xl font-bold mb-4">高级配置示例</h3>
        
        <IntegratedCodeRunner
          language="python"
          initialCode="import time\n\n# 长时间运行的代码示例\nfor i in range(5):\n    print(f'步骤 {i+1}')\n    time.sleep(1)"
          theme="dark"
          showLanguageLabel={true}
          showRunButton={true}
          showOutput={true}
          autoInitialize={true}
          runButtonText="执行长时间任务"
          onCodeChange={(code) => console.log('代码变更:', code.length, '字符')}
          onBeforeRun={handleBeforeRun}
          onRunComplete={(execution) => {
            console.log('执行完成，用时:', execution.executionTime, 'ms')
          }}
          onError={(error) => {
            console.error('运行出错:', error.message)
          }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4"
        />

        {/* Run Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={showRunConfirm}
          title="确认执行代码"
          message="这段代码可能需要几秒钟运行，确定继续？"
          itemType="general"
          dangerLevel="low"
          onConfirm={confirmRun}
          onCancel={cancelRun}
        />

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </RuntimeProvider>
  )
}

// 辅助函数
function getDefaultCode(language: string): string {
  switch (language) {
    case 'javascript':
      return 'console.log("Hello, JavaScript!");'
    case 'python':
      return 'print("Hello, Python!")'
    case 'cpp':
      return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}'
    default:
      return ''
  }
} 