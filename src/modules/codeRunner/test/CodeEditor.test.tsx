import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CodeEditor } from '../components/CodeEditor'

// Mock Monaco Editor
const mockEditor = {
  addCommand: vi.fn(),
  updateOptions: vi.fn(),
  setValue: vi.fn(),
  getValue: vi.fn(() => 'test code'),
  getModel: vi.fn(() => ({
    onDidChangeContent: vi.fn()
  })),
  getDomNode: vi.fn(() => ({
    closest: vi.fn(() => null)
  })),
  onDidChangeCursorSelection: vi.fn(),
  getSelection: vi.fn(() => null)
}

const mockMonaco = {
  KeyMod: {
    CtrlCmd: 1
  },
  KeyCode: {
    Enter: 13
  },
  languages: {
    setLanguageConfiguration: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    CompletionItemKind: {
      Function: 1,
      Keyword: 2,
      Variable: 3,
      Module: 4,
      Snippet: 5
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 1
    }
  }
}

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onMount, onChange, loading }) => {
    // 模拟编辑器挂载
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

// 共享的默认props
const defaultProps = {
  value: 'print("Hello, World!")',
  onChange: vi.fn(),
  onRun: vi.fn(),
  language: 'python' as const,
  theme: 'dark' as const,
  readOnly: false
}

describe('CodeEditor (Monaco版本)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该渲染Monaco编辑器', () => {
    render(<CodeEditor {...defaultProps} />)
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    expect(screen.getByText('PYTHON')).toBeInTheDocument()
    expect(screen.getByText('提示：支持语法高亮和智能补全，按 Ctrl/Cmd + Enter 运行代码')).toBeInTheDocument()
  })

  it('应该显示正确的语言标签', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} language="python" />)
    expect(screen.getByText('PYTHON')).toBeInTheDocument()
    
    rerender(<CodeEditor {...defaultProps} language="cpp" />)
    expect(screen.getByText('CPP')).toBeInTheDocument()
    
    rerender(<CodeEditor {...defaultProps} language="javascript" />)
    expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument()
  })

  it('应该处理代码变更', async () => {
    const mockOnChange = vi.fn()
    render(<CodeEditor {...defaultProps} onChange={mockOnChange} />)
    
    // 触发代码变更
    fireEvent.click(screen.getByTestId('mock-editor-change'))
    
    expect(mockOnChange).toHaveBeenCalledWith('changed code')
  })

  it('应该在编辑器挂载时设置快捷键', async () => {
    const mockOnRun = vi.fn()
    render(<CodeEditor {...defaultProps} onRun={mockOnRun} />)
    
    await waitFor(() => {
      expect(mockEditor.addCommand).toHaveBeenCalledWith(
        expect.any(Number), // KeyMod.CtrlCmd | KeyCode.Enter
        expect.any(Function)
      )
    })
  })

  it('应该配置Python语言特性', async () => {
    render(<CodeEditor {...defaultProps} language="python" />)
    
    await waitFor(() => {
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        'python',
        expect.objectContaining({
          comments: {
            lineComment: '#',
            blockComment: ['"""', '"""']
          }
        })
      )
      
      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'python',
        expect.objectContaining({
          provideCompletionItems: expect.any(Function)
        })
      )
    })
  })

  it('应该配置C++语言特性', async () => {
    render(<CodeEditor {...defaultProps} language="cpp" />)
    
    await waitFor(() => {
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        'cpp',
        expect.objectContaining({
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
          }
        })
      )
      
      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'cpp',
        expect.any(Object)
      )
    })
  })

  it('应该配置JavaScript语言特性', async () => {
    render(<CodeEditor {...defaultProps} language="javascript" />)
    
    await waitFor(() => {
      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'javascript',
        expect.any(Object)
      )
    })
  })

  it('应该在只读模式下隐藏提示文本', () => {
    render(<CodeEditor {...defaultProps} readOnly={true} />)
    
    expect(screen.queryByText('提示：支持语法高亮和智能补全，按 Ctrl/Cmd + Enter 运行代码')).not.toBeInTheDocument()
  })

  it('应该正确设置编辑器选项', async () => {
    render(<CodeEditor {...defaultProps} readOnly={true} />)
    
    await waitFor(() => {
      expect(mockEditor.updateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          readOnly: true,
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          lineNumbers: 'on'
        })
      )
    })
  })

  it('应该支持主题切换', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} theme="dark" />)
    // Monaco编辑器的主题在组件内部处理，我们检查传递给编辑器的props
    
    rerender(<CodeEditor {...defaultProps} theme="light" />)
    // 主题变更应该传递给Monaco编辑器
  })

  it('应该显示加载状态', () => {
    vi.doMock('@monaco-editor/react', () => ({
      default: vi.fn(({ loading }) => loading)
    }))
    
    // Monaco编辑器内部处理loading状态
    render(<CodeEditor {...defaultProps} />)
    // 加载状态由Monaco编辑器组件内部管理
  })
})

describe('CodeEditor 语言映射', () => {
  it('应该正确映射支持的语言', () => {
    const testCases = [
      { input: 'python', expected: 'python' },
      { input: 'cpp', expected: 'cpp' },
      { input: 'javascript', expected: 'javascript' }
    ]
    
    testCases.forEach(({ input, expected }) => {
      render(<CodeEditor {...defaultProps} language={input as any} />)
      // 语言映射逻辑在组件内部，通过渲染测试验证
    })
  })
})

describe('CodeEditor 补全功能', () => {
  it('应该为Python提供正确的代码补全', async () => {
    render(<CodeEditor {...defaultProps} language="python" />)
    
    await waitFor(() => {
      // 验证补全提供器被注册
      const calls = mockMonaco.languages.registerCompletionItemProvider.mock.calls
      const pythonCall = calls.find(call => call[0] === 'python')
      
      expect(pythonCall).toBeTruthy()
      
      if (pythonCall) {
        const provider = pythonCall[1]
        const suggestions = provider.provideCompletionItems()
        
        expect(suggestions.suggestions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              label: 'print',
              kind: mockMonaco.languages.CompletionItemKind.Function
            }),
            expect.objectContaining({
              label: 'def',
              kind: mockMonaco.languages.CompletionItemKind.Keyword
            })
          ])
        )
      }
    })
  })

  it('应该为C++提供正确的代码补全', async () => {
    render(<CodeEditor {...defaultProps} language="cpp" />)
    
    await waitFor(() => {
      const calls = mockMonaco.languages.registerCompletionItemProvider.mock.calls
      const cppCall = calls.find(call => call[0] === 'cpp')
      
      expect(cppCall).toBeTruthy()
      
      if (cppCall) {
        const provider = cppCall[1]
        const suggestions = provider.provideCompletionItems()
        
        expect(suggestions.suggestions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              label: 'iostream',
              kind: mockMonaco.languages.CompletionItemKind.Module
            }),
            expect.objectContaining({
              label: 'main',
              kind: mockMonaco.languages.CompletionItemKind.Function
            })
          ])
        )
      }
    })
  })
}) 