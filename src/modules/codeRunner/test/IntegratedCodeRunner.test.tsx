import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  IntegratedCodeRunner, 
  PythonRunner, 
  JavaScriptRunner, 
  CppRunner,
  CompactCodeRunner,
  CodeDisplay,
  RuntimeProvider 
} from '../index'

// Mock Monaco Editor
const mockEditor = {
  addCommand: vi.fn(),
  updateOptions: vi.fn(),
  setValue: vi.fn(),
  getValue: vi.fn(() => 'test code'),
  getModel: vi.fn(() => ({
    onDidChangeContent: vi.fn()
  }))
}

const mockMonaco = {
  KeyMod: { CtrlCmd: 1 },
  KeyCode: { Enter: 13 },
  languages: {
    setLanguageConfiguration: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    CompletionItemKind: {
      Function: 1, Keyword: 2, Variable: 3, Module: 4, Snippet: 5
    },
    CompletionItemInsertTextRule: { InsertAsSnippet: 1 }
  }
}

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onMount, onChange, loading }) => {
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0)
    }
    return (
      <div data-testid="monaco-editor">
        {loading || 'Monaco Editor'}
        <button
          data-testid="mock-editor-change"
          onClick={() => onChange?.('changed code')}
        >
          Trigger Change
        </button>
      </div>
    )
  })
}))

// Mock global monaco
Object.defineProperty(window, 'monaco', {
  value: mockMonaco,
  writable: true
})

// Mock service functions
const mockGetRuntimeStatus = vi.fn(() => ({
  python: { isLoading: false, isReady: true, version: '3.9' },
  cpp: { isLoading: false, isReady: false },
  javascript: { isLoading: false, isReady: true, version: 'ES2022' }
}))

const mockRunCode = vi.fn(() => Promise.resolve({
  id: 'test-exec-1',
  code: 'test code',
  language: 'javascript',
  timestamp: new Date().toISOString(),
  status: 'success',
  output: 'test output',
  executionTime: 100
}))

vi.mock('../service', () => ({
  getRuntimeStatus: mockGetRuntimeStatus,
  initRuntime: vi.fn(() => Promise.resolve()),
  runCode: mockRunCode,
  getLanguageExecutionHistory: vi.fn(() => []),
  cleanup: vi.fn(),
  preloadRuntime: vi.fn(() => Promise.resolve())
}))

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RuntimeProvider config={{ preloadLanguages: [] }}>
    {children}
  </RuntimeProvider>
)

describe('IntegratedCodeRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 mock 状态
    mockGetRuntimeStatus.mockReturnValue({
      python: { isLoading: false, isReady: true, version: '3.9' },
      cpp: { isLoading: false, isReady: false },
      javascript: { isLoading: false, isReady: true, version: 'ES2022' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该渲染完整的集成组件', () => {
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('Hello');"
        />
      </TestWrapper>
    )

    expect(screen.getByText('🚀')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('运行 JavaScript')).toBeInTheDocument()
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('应该支持自定义配置', () => {
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="python"
          initialCode="print('test')"
          theme="light"
          showLanguageLabel={false}
          showRunButton={false}
          showOutput={false}
          runButtonText="自定义运行"
        />
      </TestWrapper>
    )

    expect(screen.queryByText('🐍')).not.toBeInTheDocument()
    expect(screen.queryByText('运行')).not.toBeInTheDocument()
    expect(screen.queryByText('输出结果')).not.toBeInTheDocument()
  })

  it('应该处理代码变更回调', async () => {
    const mockOnChange = vi.fn()
    
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          onCodeChange={mockOnChange}
        />
      </TestWrapper>
    )

    fireEvent.click(screen.getByTestId('mock-editor-change'))
    expect(mockOnChange).toHaveBeenCalledWith('changed code')
  })

  it('应该处理运行按钮点击', async () => {
    const mockOnRunComplete = vi.fn()
    
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
          onRunComplete={mockOnRunComplete}
        />
      </TestWrapper>
    )

    const runButton = screen.getByText('运行 JavaScript')
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(mockOnRunComplete).toHaveBeenCalled()
    })
  })

  it('应该显示运行时状态', () => {
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
        />
      </TestWrapper>
    )

    // 应该显示就绪状态指示器
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('(ES2022)')).toBeInTheDocument()
  })

  it('应该支持运行前验证', async () => {
    const mockBeforeRun = vi.fn(() => Promise.resolve(false)) // 阻止运行
    
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
          onBeforeRun={mockBeforeRun}
        />
      </TestWrapper>
    )

    const runButton = screen.getByText('运行 JavaScript')
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(mockBeforeRun).toHaveBeenCalledWith("console.log('test')")
    })
  })
})

describe('预设语言组件', () => {
  it('PythonRunner 应该正确设置语言', () => {
    render(
      <TestWrapper>
        <PythonRunner initialCode="print('hello')" />
      </TestWrapper>
    )

    expect(screen.getByText('🐍')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('JavaScriptRunner 应该正确设置语言', () => {
    render(
      <TestWrapper>
        <JavaScriptRunner initialCode="console.log('hello')" />
      </TestWrapper>
    )

    expect(screen.getByText('🚀')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
  })

  it('CppRunner 应该正确设置语言', () => {
    render(
      <TestWrapper>
        <CppRunner initialCode="#include <iostream>" />
      </TestWrapper>
    )

    expect(screen.getByText('⚡')).toBeInTheDocument()
    expect(screen.getByText('C++')).toBeInTheDocument()
  })
})

describe('特殊配置组件', () => {
  it('CompactCodeRunner 应该隐藏语言标签和输出', () => {
    render(
      <TestWrapper>
        <CompactCodeRunner
          language="javascript"
          initialCode="console.log('test')"
        />
      </TestWrapper>
    )

    expect(screen.queryByText('🚀')).not.toBeInTheDocument()
    expect(screen.queryByText('输出结果')).not.toBeInTheDocument()
    expect(screen.getByText('运行 JavaScript')).toBeInTheDocument()
  })

  it('CodeDisplay 应该是只读模式', () => {
    render(
      <TestWrapper>
        <CodeDisplay
          language="python"
          initialCode="print('hello')"
        />
      </TestWrapper>
    )

    expect(screen.queryByText('运行')).not.toBeInTheDocument()
    expect(screen.queryByText('输出结果')).not.toBeInTheDocument()
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })
})

describe('RuntimeProvider', () => {
  it('应该支持预加载配置', () => {
    render(
      <RuntimeProvider config={{ preloadLanguages: ['javascript', 'python'] }}>
        <div data-testid="test-content">Test Content</div>
      </RuntimeProvider>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('应该支持自定义状态更新间隔', () => {
    render(
      <RuntimeProvider config={{ statusUpdateInterval: 500 }}>
        <div data-testid="test-content">Test Content</div>
      </RuntimeProvider>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })
})

describe('错误处理', () => {
  it('应该处理运行时错误', () => {
    // Mock 运行时错误状态
    mockGetRuntimeStatus.mockReturnValue({
      javascript: { isLoading: false, isReady: false, error: 'Runtime error' }
    })

    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
        />
      </TestWrapper>
    )

    expect(screen.getByText('运行时错误：Runtime error')).toBeInTheDocument()
    expect(screen.getByText('重试初始化')).toBeInTheDocument()
  })

  it('应该处理加载状态', () => {
    mockGetRuntimeStatus.mockReturnValue({
      python: { isLoading: true, isReady: false }
    })

    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="python"
          initialCode="print('test')"
        />
      </TestWrapper>
    )

    expect(screen.getByText('正在初始化 Python 运行环境...')).toBeInTheDocument()
    expect(screen.getByText('初始化中...')).toBeInTheDocument()
  })

  it('应该处理错误回调', async () => {
    const mockOnError = vi.fn()
    mockRunCode.mockRejectedValue(new Error('Execution failed'))

    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
          onError={mockOnError}
        />
      </TestWrapper>
    )

    const runButton = screen.getByText('运行 JavaScript')
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})

describe('按钮状态', () => {
  it('应该在禁用状态下显示正确文本', () => {
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
          disabled={true}
        />
      </TestWrapper>
    )

    expect(screen.getByText('已禁用')).toBeInTheDocument()
  })

  it('应该在代码为空时禁用运行', () => {
    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode=""
        />
      </TestWrapper>
    )

    expect(screen.getByText('请输入代码')).toBeInTheDocument()
  })

  it('应该在运行时未就绪时禁用', () => {
    mockGetRuntimeStatus.mockReturnValue({
      javascript: { isLoading: false, isReady: false }
    })

    render(
      <TestWrapper>
        <IntegratedCodeRunner
          language="javascript"
          initialCode="console.log('test')"
        />
      </TestWrapper>
    )

    expect(screen.getByText('未就绪')).toBeInTheDocument()
  })
}) 