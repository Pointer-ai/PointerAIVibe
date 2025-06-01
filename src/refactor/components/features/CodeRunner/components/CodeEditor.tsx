import React, { useRef, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { CodeEditorProps, SupportedLanguage } from '../types'

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onRun,
  language = 'python',
  theme = 'dark',
  readOnly = false,
  height = '400px',
  className = ''
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Monaco语言映射
  const getMonacoLanguage = (lang: SupportedLanguage) => {
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

    // 将编辑器实例暴露到DOM元素上，供外部使用
    const editorContainer = editor.getDomNode()?.closest('.monaco-editor')
    if (editorContainer) {
      ;(editorContainer as any)._monacoEditor = editor
      
      const editorDomNode = editor.getDomNode()
      if (editorDomNode) {
        ;(editorDomNode as any)._monacoEditor = editor
      }
    }

    // 监听编辑器选择变化
    editor.onDidChangeCursorSelection(() => {
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
          ],
          surroundingPairs: [
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
                  label: '#include <iostream>',
                  kind: monaco.languages.CompletionItemKind.Module,
                  insertText: '#include <iostream>',
                  documentation: 'Standard input/output stream'
                },
                {
                  label: 'main',
                  kind: monaco.languages.CompletionItemKind.Function,
                  insertText: 'int main() {\n    ${1:// code here}\n    return 0;\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Main function template'
                },
                {
                  label: 'cout',
                  kind: monaco.languages.CompletionItemKind.Variable,
                  insertText: 'std::cout << ${1:value} << std::endl;',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Console output'
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
                  insertText: 'function ${1:name}(${2:params}) {\n    ${3:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Function declaration'
                },
                {
                  label: 'arrow function',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: '(${1:params}) => {\n    ${2:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'Arrow function'
                },
                {
                  label: 'for',
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: 'for (${1:let i = 0}; ${2:i < length}; ${3:i++}) {\n    ${4:// code here}\n}',
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  documentation: 'For loop'
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
    <div className={`relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language.toUpperCase()}
            </span>
            {readOnly && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                只读
              </span>
            )}
          </div>
          {onRun && !readOnly && (
            <button
              onClick={onRun}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
            >
              运行 (Ctrl+Enter)
            </button>
          )}
        </div>
      </div>
      <div style={{ height }}>
        <Editor
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          language={getMonacoLanguage(language)}
          theme={getMonacoTheme(theme)}
          options={{
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
          }}
        />
      </div>
    </div>
  )
} 