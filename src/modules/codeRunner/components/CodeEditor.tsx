import React, { useRef, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  language?: 'python' | 'cpp' | 'javascript'
  theme?: 'light' | 'dark'
  readOnly?: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onRun,
  language = 'python',
  theme = 'dark',
  readOnly = false
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Monaco语言映射
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'python': return 'python'
      case 'cpp': return 'cpp'
      case 'javascript': return 'javascript'
      default: return 'python'
    }
  }

  // Monaco主题映射
  const getMonacoTheme = (themeType: string) => {
    return themeType === 'dark' ? 'vs-dark' : 'vs'
  }

  // 编辑器初始化完成
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    setIsEditorReady(true)

    // 将编辑器实例暴露到DOM元素上，供TextSelector使用
    const editorContainer = editor.getDomNode()?.closest('.monaco-editor')
    if (editorContainer) {
      ;(editorContainer as any)._monacoEditor = editor
      
      // 为了确保TextSelector能够检测到，也设置到编辑器DOM节点本身
      const editorDomNode = editor.getDomNode()
      if (editorDomNode) {
        ;(editorDomNode as any)._monacoEditor = editor
      }
    }

    // 监听编辑器选择变化，触发自定义事件供TextSelector使用
    editor.onDidChangeCursorSelection(() => {
      // 触发自定义事件，通知TextSelector检查选择
      const event = new CustomEvent('monaco-selection-change', {
        detail: { editor, selection: editor.getSelection() }
      })
      document.dispatchEvent(event)
    })

    // 添加运行代码快捷键 (Ctrl/Cmd + Enter)
    editor.addCommand(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.Enter,
      () => {
        onRun?.()
      }
    )

    // 设置编辑器选项
    editor.updateOptions({
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
      lineNumbers: 'on',
      readOnly
    })
  }

  // 配置语言特性
  useEffect(() => {
    if (!isEditorReady) return

    const setupLanguageFeatures = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monaco = (window as any).monaco
      if (!monaco) return

      if (language === 'python') {
        // Python 语言配置
        monaco.languages.setLanguageConfiguration('python', {
          comments: {
            lineComment: '#',
            blockComment: ['"""', '"""']
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ],
          indentationRules: {
            increaseIndentPattern: /^\s*[\w\s]*(:)\s*$/,
            decreaseIndentPattern: /^\s*(return|break|continue|pass|raise)\b.*$/
          }
        })

        // Python 补全提供器
        monaco.languages.registerCompletionItemProvider('python', {
          provideCompletionItems: () => {
            return {
              suggestions: [
                {
                  label: 'print',
                  kind: monaco.languages.CompletionItemKind.Function,
                  insertText: 'print($1)',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Print values to stdout'
                },
                {
                  label: 'def',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'def ${1:function_name}(${2:params}):\n    ${3:pass}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Define a function'
                },
                {
                  label: 'for',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'For loop'
                },
                {
                  label: 'if',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'if ${1:condition}:\n    ${2:pass}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'If statement'
                },
                {
                  label: 'while',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'while ${1:condition}:\n    ${2:pass}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'While loop'
                },
                {
                  label: 'class',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, params}):\n        ${3:pass}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Define a class'
                }
              ]
            }
          }
        })
      }

      if (language === 'cpp') {
        // C++ 语言配置
        monaco.languages.setLanguageConfiguration('cpp', {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ]
        })

        // C++ 补全提供器
        monaco.languages.registerCompletionItemProvider('cpp', {
          provideCompletionItems: () => {
            return {
              suggestions: [
                {
                  label: 'iostream',
                  kind: monaco.languages.CompletionItemKind.Module,
                  insertText: '#include <iostream>',
                  documentation: 'Standard input/output stream'
                },
                {
                  label: 'main',
                  kind: monaco.languages.CompletionItemKind.Function,
                  insertText: 'int main() {\n    ${1:// code here}\n    return 0;\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Main function'
                },
                {
                  label: 'cout',
                  kind: monaco.languages.CompletionItemKind.Variable,
                  insertText: 'std::cout << ${1:value} << std::endl;',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Output to console'
                },
                {
                  label: 'for',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n    ${4:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'For loop'
                }
              ]
            }
          }
        })
      }

      if (language === 'javascript') {
        // JavaScript 补全提供器
        monaco.languages.registerCompletionItemProvider('javascript', {
          provideCompletionItems: () => {
            return {
              suggestions: [
                {
                  label: 'console.log',
                  kind: monaco.languages.CompletionItemKind.Function,
                  insertText: 'console.log(${1:value});',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Log to console'
                },
                {
                  label: 'function',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'function ${1:functionName}(${2:params}) {\n    ${3:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Function declaration'
                },
                {
                  label: 'arrow function',
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertText: 'const ${1:functionName} = (${2:params}) => {\n    ${3:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Arrow function'
                }
              ]
            }
          }
        })
      }
    }

    setupLanguageFeatures()
  }, [language, isEditorReady])

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
        {language.toUpperCase()}
      </div>
      
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <Editor
          height="400px"
          language={getMonacoLanguage(language)}
          value={value}
          theme={getMonacoTheme(theme)}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            lineHeight: 22,
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: true,
            folding: true,
            lineNumbers: 'on',
            readOnly,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: true,
            parameterHints: { enabled: true },
            hover: { enabled: true }
          }}
          loading={
            <div className="flex items-center justify-center h-96 bg-gray-900 text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              正在加载编辑器...
            </div>
          }
        />
      </div>
      
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500">
          提示：支持语法高亮和智能补全，按 Ctrl/Cmd + Enter 运行代码
        </div>
      )}
    </div>
  )
} 