'use client'

import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  type JSONContent,
} from 'novel'
import { defaultExtensions, suggestionItems } from './novel-extensions'
import { Paper, IconButton, Divider, Tooltip, Box, Typography, Card, CardActionArea, Stack, Button } from '@mui/material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS'
import CodeIcon from '@mui/icons-material/Code'
import { Description, FolderOpen, AddLink, DragIndicator, ArrowUpward, ArrowDownward, DragHandle } from '@mui/icons-material'
import { useState, useEffect, useRef } from 'react'
import ImagePickerDialog from './ImagePickerDialog'

interface Document {
  id: string
  title: string
  icon?: string | null
}

interface NovelEditorComponentProps {
  content?: any
  onChange?: (content: any) => void
  editable?: boolean
  children?: Document[]
  onChildClick?: (id: string) => void
}

export function NovelEditorComponent({
  content,
  onChange,
  editable = true,
  children,
  onChildClick,
}: NovelEditorComponentProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [currentBlockPos, setCurrentBlockPos] = useState<number | null>(null)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // 画像アップロード関数
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  // 画像選択ダイアログを開く関数をエディタに公開
  const openImagePicker = () => {
    setImagePickerOpen(true)
  }

  // 画像を挿入する関数
  const insertImage = (url: string) => {
    if (!editorInstance) return
    editorInstance.chain().focus().setImage({ src: url }).run()
  }

  // 画像を貼り付けた時の処理
  const handlePaste = async (e: ClipboardEvent) => {
    if (!editorInstance) return

    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()

        const file = item.getAsFile()
        if (!file) continue

        try {
          // 一時的なプレースホルダーを挿入
          editorInstance.chain().focus().setImage({ src: '' }).run()

          // 画像をアップロード
          const url = await uploadImage(file)

          // プレースホルダーを実際の画像URLに置き換え
          editorInstance.chain().focus().setImage({ src: url }).run()
        } catch (error) {
          console.error('Image upload failed:', error)
          alert('画像のアップロードに失敗しました')
        }
      }
    }
  }

  // ドラッグ&ドロップで画像を追加
  const handleDrop = async (e: DragEvent) => {
    if (!editorInstance) return

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.type.indexOf('image') !== -1) {
        e.preventDefault()
        e.stopPropagation()

        try {
          // 画像をアップロード
          const url = await uploadImage(file)

          // エディタに画像を挿入
          editorInstance.chain().focus().setImage({ src: url }).run()
        } catch (error) {
          console.error('Image upload failed:', error)
          alert('画像のアップロードに失敗しました')
        }
      }
    }
  }

  // 貼り付けイベントを監視
  useEffect(() => {
    const editorElement = editorRef.current
    if (!editorElement) return

    editorElement.addEventListener('paste', handlePaste as any)
    editorElement.addEventListener('drop', handleDrop as any)

    return () => {
      editorElement.removeEventListener('paste', handlePaste as any)
      editorElement.removeEventListener('drop', handleDrop as any)
    }
  }, [editorInstance])

  // 子ドキュメントへのリンクをエディターに挿入
  const insertChildLink = (child: Document) => {
    if (!editorInstance) return

    const linkText = `${child.icon || '📄'} ${child.title}`

    editorInstance
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        marks: [
          {
            type: 'link',
            attrs: {
              href: `#doc-${child.id}`,
              target: '_self',
              class: 'child-document-link',
            },
          },
          {
            type: 'bold',
          },
        ],
        text: linkText,
      })
      .insertContent(' ')
      .run()
  }

  // ブロックを上に移動
  const moveBlockUp = () => {
    if (!editorInstance || currentBlockPos === null) return

    const { state, view } = editorInstance
    const resolvedPos = state.doc.resolve(currentBlockPos)

    // 現在のノードの開始位置と終了位置を取得
    const nodeStart = currentBlockPos
    const node = resolvedPos.nodeAfter || resolvedPos.parent
    const nodeEnd = nodeStart + node.nodeSize

    // 親ノードでのインデックスを確認
    const parentDepth = resolvedPos.depth
    const indexInParent = resolvedPos.index(parentDepth)

    if (indexInParent === 0) {
      // すでに一番上なので移動できない
      return
    }

    // 上のノードを取得
    const parent = resolvedPos.node(parentDepth)
    const prevNode = parent.child(indexInParent - 1)
    const prevStart = nodeStart - prevNode.nodeSize
    const prevEnd = nodeStart

    // トランザクションでノードを入れ替え
    const tr = state.tr
    const currentNodeContent = state.doc.slice(nodeStart, nodeEnd)
    const prevNodeContent = state.doc.slice(prevStart, prevEnd)

    tr.delete(prevStart, nodeEnd)
    tr.insert(prevStart, currentNodeContent.content)
    tr.insert(prevStart + node.nodeSize, prevNodeContent.content)

    view.dispatch(tr)
  }

  // ブロックを下に移動
  const moveBlockDown = () => {
    if (!editorInstance || currentBlockPos === null) return

    const { state, view } = editorInstance
    const resolvedPos = state.doc.resolve(currentBlockPos)

    // 現在のノードの開始位置と終了位置を取得
    const nodeStart = currentBlockPos
    const node = resolvedPos.nodeAfter || resolvedPos.parent
    const nodeEnd = nodeStart + node.nodeSize

    // 親ノードでのインデックスを確認
    const parentDepth = resolvedPos.depth
    const indexInParent = resolvedPos.index(parentDepth)
    const parent = resolvedPos.node(parentDepth)

    if (indexInParent >= parent.childCount - 1) {
      // すでに一番下なので移動できない
      return
    }

    // 下のノードを取得
    const nextNode = parent.child(indexInParent + 1)
    const nextStart = nodeEnd
    const nextEnd = nextStart + nextNode.nodeSize

    // トランザクションでノードを入れ替え
    const tr = state.tr
    const currentNodeContent = state.doc.slice(nodeStart, nodeEnd)
    const nextNodeContent = state.doc.slice(nextStart, nextEnd)

    tr.delete(nodeStart, nextEnd)
    tr.insert(nodeStart, nextNodeContent.content)
    tr.insert(nodeStart + nextNode.nodeSize, currentNodeContent.content)

    view.dispatch(tr)
  }

  // ドラッグ開始時のハンドラー
  const handleDragStart = (e: React.DragEvent, child: Document) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(child))
  }

  // カーソル位置が変わったときにブロックメニューを更新
  useEffect(() => {
    if (!editorInstance || !editorRef.current) return

    const updateBlockMenu = () => {
      const { state, view } = editorInstance
      const { selection } = state

      // テキストが選択されている場合はメニューを非表示
      if (!selection.empty) {
        setBlockMenuPosition(null)
        setCurrentBlockPos(null)
        return
      }

      const { $from } = selection

      // カーソルがある位置のブロックノードを取得
      let depth = $from.depth
      let nodePos = $from.before(depth)
      let node = $from.node(depth)

      // ブロックレベルのノードを見つけるまで上に遡る
      while (depth > 0 && node.isInline) {
        depth--
        nodePos = $from.before(depth)
        node = $from.node(depth)
      }

      if (!node || node.type.name === 'doc') {
        setBlockMenuPosition(null)
        setCurrentBlockPos(null)
        return
      }

      // DOMノードを取得してメニュー位置を計算
      try {
        const domNode = view.nodeDOM(nodePos) as HTMLElement
        if (!domNode) {
          setBlockMenuPosition(null)
          setCurrentBlockPos(null)
          return
        }

        const rect = domNode.getBoundingClientRect()
        const editorRect = editorRef.current!.getBoundingClientRect()

        setBlockMenuPosition({
          top: rect.top - editorRect.top + rect.height / 2 - 40,
          left: -60,
        })

        setCurrentBlockPos(nodePos)
      } catch (error) {
        console.error('Error getting DOM node:', error)
        setBlockMenuPosition(null)
        setCurrentBlockPos(null)
      }
    }

    // 初期表示
    updateBlockMenu()

    // selectionUpdateとupdateイベントを監視
    const handleUpdate = () => {
      updateBlockMenu()
    }

    editorInstance.on('selectionUpdate', handleUpdate)
    editorInstance.on('update', handleUpdate)

    return () => {
      editorInstance.off('selectionUpdate', handleUpdate)
      editorInstance.off('update', handleUpdate)
    }
  }, [editorInstance])

  // グローバルクリックハンドラーで子ドキュメントリンクを処理
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // リンク要素またはその親を探す
      let linkElement: HTMLElement | null = target
      while (linkElement && linkElement.tagName !== 'A') {
        linkElement = linkElement.parentElement
      }

      if (linkElement && linkElement.tagName === 'A') {
        const href = linkElement.getAttribute('href')
        if (href && href.startsWith('#doc-') && linkElement.classList.contains('child-document-link')) {
          e.preventDefault()
          e.stopPropagation()
          const docId = href.replace('#doc-', '')
          console.log('Navigating to document:', docId)
          onChildClick?.(docId)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [onChildClick])

  // 画像選択ダイアログを開くカスタムイベントリスナー
  useEffect(() => {
    const handleOpenImagePicker = () => {
      setImagePickerOpen(true)
    }

    window.addEventListener('openImagePicker', handleOpenImagePicker)
    return () => {
      window.removeEventListener('openImagePicker', handleOpenImagePicker)
    }
  }, [])

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        minHeight: '500px',
        backgroundColor: '#fff',
        borderRadius: 2,
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <Box
        ref={editorRef}
        sx={{ position: 'relative' }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const data = e.dataTransfer.getData('application/json')
          if (data) {
            try {
              const child = JSON.parse(data) as Document
              insertChildLink(child)
            } catch (error) {
              console.error('Failed to parse dropped data:', error)
            }
          }
        }}
      >
        {/* Block Move Menu */}
        {blockMenuPosition && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: blockMenuPosition.top,
              left: blockMenuPosition.left,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              p: 0.5,
              borderRadius: 1,
            }}
          >
            <Tooltip title="上に移動" placement="left" arrow>
              <IconButton
                size="small"
                onClick={moveBlockUp}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="下に移動" placement="left" arrow>
              <IconButton
                size="small"
                onClick={moveBlockDown}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider sx={{ my: 0.5 }} />
            <Tooltip title="ドラッグして移動" placement="left" arrow>
              <IconButton
                size="small"
                sx={{
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <DragHandle fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        )}
        <EditorRoot>
          <EditorContent
            extensions={defaultExtensions}
            initialContent={content}
            onUpdate={({ editor }) => {
              if (onChange) {
                onChange(editor.getJSON())
              }
            }}
            onCreate={({ editor }) => {
              setEditorInstance(editor)
            }}
            editable={editable}
            immediatelyRender={false}
            editorProps={{
              attributes: {
                class: 'prose prose-lg max-w-full focus:outline-none min-h-96 p-4',
              },
            }}
          >
          {/* Bubble Menu - 文字選択時に表示 */}
          <EditorBubble>
            <Paper
              elevation={8}
              sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                borderRadius: 1.5,
              }}
            >
              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
              >
                <Tooltip title="太字" arrow>
                  <IconButton size="small" color="primary">
                    <FormatBoldIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </EditorBubbleItem>

              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
              >
                <Tooltip title="斜体" arrow>
                  <IconButton size="small" color="primary">
                    <FormatItalicIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </EditorBubbleItem>

              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
              >
                <Tooltip title="下線" arrow>
                  <IconButton size="small" color="primary">
                    <FormatUnderlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </EditorBubbleItem>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
              >
                <Tooltip title="取り消し線" arrow>
                  <IconButton size="small" color="primary">
                    <StrikethroughSIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </EditorBubbleItem>

              <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleCode().run()}
              >
                <Tooltip title="コード" arrow>
                  <IconButton size="small" color="primary">
                    <CodeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </EditorBubbleItem>
            </Paper>
          </EditorBubble>

          {/* Slash Command Menu */}
          <EditorCommand>
            <Paper
              elevation={6}
              sx={{
                maxHeight: '320px',
                overflowY: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ p: 1 }}>
                <EditorCommandEmpty>
                  <Box sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    コマンドが見つかりません
                  </Box>
                </EditorCommandEmpty>
                <EditorCommandList>
                  {suggestionItems.map((item) => (
                    <EditorCommandItem
                      key={item.title}
                      value={item.title}
                      onCommand={(val) => item.command({ editor: val.editor, range: val.range })}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box sx={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ fontWeight: 600, color: 'text.primary' }}>{item.title}</Box>
                          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.description}</Box>
                        </Box>
                      </Box>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </Box>
            </Paper>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
      </Box>

      {/* Child Documents - エディタ内に表示 */}
      {children && children.length > 0 && (
        <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <FolderOpen sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              サブページ
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 2,
            }}
          >
            {children.map((child) => (
              <Card
                key={child.id}
                elevation={1}
                draggable
                onDragStart={(e) => handleDragStart(e, child)}
                sx={{
                  transition: 'all 0.2s',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  {/* ドラッグインジケーター */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'text.secondary',
                      opacity: 0.5,
                      zIndex: 1,
                    }}
                  >
                    <DragIndicator fontSize="small" />
                  </Box>

                  <CardActionArea
                    onClick={() => onChildClick?.(child.id)}
                    sx={{ p: 2, pb: 1 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {child.icon ? (
                        <Typography variant="h5">{child.icon}</Typography>
                      ) : (
                        <Description color="action" />
                      )}
                      <Typography
                        variant="body1"
                        fontWeight={500}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {child.title}
                      </Typography>
                    </Stack>
                  </CardActionArea>

                  {/* リンク挿入ボタン */}
                  <Box sx={{ px: 2, pb: 1.5 }}>
                    <Button
                      size="small"
                      startIcon={<AddLink />}
                      onClick={(e) => {
                        e.stopPropagation()
                        insertChildLink(child)
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: 'primary.main',
                      }}
                    >
                      本文にリンクを挿入
                    </Button>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* 画像選択ダイアログ */}
      <ImagePickerDialog
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelectImage={insertImage}
      />
    </Paper>
  )
}
