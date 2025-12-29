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
} from '@mui/material'
import { Save, Share, Delete, EmojiEmotions } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor'
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

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments()
    }
  }, [status, fetchDocuments])

  // Fetch current document
  const fetchDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentDoc(data)
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    }
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
        setCurrentDoc(newDoc)
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
        setCurrentDoc(null)
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!currentDoc) return

    const timeoutId = setTimeout(() => {
      handleSaveDocument()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentDoc?.title, currentDoc?.content, currentDoc?.icon])

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
      <Sidebar
        documents={documents}
        currentDocId={currentDoc?.id}
        onDocumentSelect={fetchDocument}
        onCreateDocument={handleCreateDocument}
        onRefresh={fetchDocuments}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          overflow: 'auto',
          bgcolor: 'background.default',
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
                  onChange={(e) =>
                    setCurrentDoc({ ...currentDoc, title: e.target.value })
                  }
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
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
                <IconButton onClick={handleDeleteDocument} color="error">
                  <Delete />
                </IconButton>
              </Stack>

              {/* Editor */}
              <Editor
                content={currentDoc.content}
                onChange={(content) =>
                  setCurrentDoc({ ...currentDoc, content })
                }
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
            <Typography variant="h5" color="text.secondary" gutterBottom>
              ドキュメントを選択してください
            </Typography>
            <Typography variant="body2" color="text.secondary">
              または、新規ドキュメントを作成してください
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
