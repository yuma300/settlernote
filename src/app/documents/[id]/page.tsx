'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Save, Share, Delete, EmojiEmotions, Toc, Menu as MenuIcon } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { NovelEditorComponent } from '@/components/NovelEditor'
import { TableOfContents } from '@/components/TableOfContents'
import EmojiPicker from 'emoji-picker-react'

interface Document {
  id: string
  title: string
  icon?: string | null
  content?: any
  children?: Document[]
  owner?: {
    id: string
    name?: string | null
    email?: string | null
  }
  permissions?: Array<{
    id: string
    role: string
    user: {
      id: string
      name?: string | null
      email?: string | null
    }
  }>
}

export default function DocumentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch documents list
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }, [])

  // Fetch current document based on URL parameter
  const fetchDocument = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentDoc(data)
        setIsInitialLoad(true)
        setHasUserEdited(false)
        setLastSaved(null)
      } else if (response.status === 404) {
        // Document not found, redirect to documents list
        router.push('/documents')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments()
      if (documentId) {
        fetchDocument(documentId)
      }
    }
  }, [status, documentId, fetchDocuments, fetchDocument])

  // Navigate to a different document
  const handleDocumentSelect = (docId: string) => {
    router.push(`/documents/${docId}`)
  }

  // Create new document
  const handleCreateDocument = async (parentId?: string) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          parentId,
        }),
      })

      if (response.ok) {
        const newDoc = await response.json()
        await fetchDocuments()
        // Navigate to the new document
        router.push(`/documents/${newDoc.id}`)
      }
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  // Update document
  const handleSaveDocument = async () => {
    if (!currentDoc) return

    setSaving(true)
    try {
      const response = await fetch(`/api/documents/${currentDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentDoc.title,
          icon: currentDoc.icon,
          content: currentDoc.content,
        }),
      })

      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Error saving document:', error)
    } finally {
      setSaving(false)
    }
  }

  // Delete document
  const handleDeleteDocument = async () => {
    if (!currentDoc) return

    if (!confirm('このドキュメントを削除してもよろしいですか?')) return

    try {
      const response = await fetch(`/api/documents/${currentDoc.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDocuments()
        // Navigate to documents list after deletion
        router.push('/documents')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!currentDoc) return

    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }

    if (!hasUserEdited) {
      return
    }

    setAutoSaving(true)
    const autoSaveTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/documents/${currentDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentDoc.title,
            icon: currentDoc.icon,
            content: currentDoc.content,
          }),
        })

        if (response.ok) {
          setLastSaved(new Date())
          await fetchDocuments()
          console.log('Auto-saved successfully')
        } else {
          console.error('Auto-save failed:', response.status)
        }
      } catch (error) {
        console.error('Auto-save error:', error)
      } finally {
        setAutoSaving(false)
      }
    }, 2000)

    return () => {
      clearTimeout(autoSaveTimer)
      setAutoSaving(false)
    }
  }, [currentDoc?.title, currentDoc?.content, currentDoc?.icon, currentDoc?.id, isInitialLoad, hasUserEdited, fetchDocuments])

  if (status === 'loading' || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setSidebarOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              SettlerNote
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Sidebar
        documents={documents}
        currentDocId={currentDoc?.id}
        onDocumentSelect={handleDocumentSelect}
        onCreateDocument={handleCreateDocument}
        onRefresh={fetchDocuments}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          overflow: 'auto',
          bgcolor: 'background.default',
          ...(isMobile && { mt: 7 }),
        }}
      >
        {currentDoc ? (
          <Container maxWidth="lg">
            <Paper sx={{ p: 4, minHeight: '80vh' }}>
              {/* Document Header */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    size="large"
                  >
                    {currentDoc.icon || <EmojiEmotions />}
                  </IconButton>
                  {showEmojiPicker && (
                    <Box sx={{ position: 'absolute', zIndex: 1000 }}>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setCurrentDoc({ ...currentDoc, icon: emojiData.emoji })
                          setHasUserEdited(true)
                          setShowEmojiPicker(false)
                        }}
                      />
                    </Box>
                  )}
                </Box>
                <TextField
                  fullWidth
                  variant="standard"
                  value={currentDoc.title}
                  onChange={(e) => {
                    setCurrentDoc({ ...currentDoc, title: e.target.value })
                    setHasUserEdited(true)
                  }}
                  placeholder="Untitled"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '2rem',
                      fontWeight: 600,
                    },
                  }}
                />
              </Stack>

              {/* Document Metadata */}
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <Chip
                  size="small"
                  label={`作成者: ${currentDoc.owner?.name || currentDoc.owner?.email}`}
                />
                {currentDoc.permissions && currentDoc.permissions.length > 0 && (
                  <Chip
                    size="small"
                    label={`共有: ${currentDoc.permissions.length}人`}
                  />
                )}
              </Stack>

              {/* Toolbar */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <IconButton
                  onClick={handleSaveDocument}
                  disabled={saving}
                  color="primary"
                >
                  {saving ? <CircularProgress size={24} /> : <Save />}
                </IconButton>
                <IconButton color="primary">
                  <Share />
                </IconButton>
                <IconButton
                  onClick={() => setShowToc(!showToc)}
                  color={showToc ? 'primary' : 'default'}
                  title="目次を表示/非表示"
                >
                  <Toc />
                </IconButton>
                <IconButton onClick={handleDeleteDocument} color="error">
                  <Delete />
                </IconButton>

                {/* Auto-save status */}
                <Box sx={{ ml: 'auto' }}>
                  {autoSaving ? (
                    <Chip
                      size="small"
                      label="保存中..."
                      color="default"
                      icon={<CircularProgress size={16} />}
                    />
                  ) : lastSaved ? (
                    <Chip
                      size="small"
                      label={`保存済み ${lastSaved.toLocaleTimeString()}`}
                      color="success"
                      variant="outlined"
                    />
                  ) : null}
                </Box>
              </Stack>

              {/* Table of Contents */}
              {showToc && currentDoc.content && (
                <Box sx={{ mb: 3 }}>
                  <TableOfContents content={currentDoc.content} />
                </Box>
              )}

              {/* Editor */}
              <NovelEditorComponent
                key={currentDoc.id}
                content={currentDoc.content}
                onChange={(content) => {
                  setCurrentDoc({ ...currentDoc, content })
                  setHasUserEdited(true)
                }}
                children={currentDoc.children}
                onChildClick={handleDocumentSelect}
              />
            </Paper>
          </Container>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ドキュメントを読み込み中...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
