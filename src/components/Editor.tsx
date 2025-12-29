'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Box, Paper } from '@mui/material'
import { useEffect } from 'react'

interface EditorProps {
  content?: any
  onChange?: (content: any) => void
  placeholder?: string
  editable?: boolean
}

export function Editor({
  content,
  onChange,
  placeholder = 'ここに入力してください...',
  editable = true
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON())
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && content && editor.getJSON() !== content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        minHeight: '400px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <EditorContent editor={editor} />
    </Paper>
  )
}
