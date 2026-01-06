'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

interface Document {
  id: string
  title: string
  icon?: string | null
  children?: Document[]
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: '名前を入力してください' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (response.ok) {
        // セッションを更新
        await update()
        setMessage({ type: 'success', text: '名前を更新しました' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || '更新に失敗しました' })
      }
    } catch (error) {
      console.error('Failed to update name:', error)
      setMessage({ type: 'error', text: '更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        documents={documents}
        onDocumentSelect={(docId) => router.push(`/documents?id=${docId}`)}
        onCreateDocument={() => router.push('/documents')}
        onRefresh={fetchDocuments}
        open={true}
        onClose={() => {}}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom>
            ユーザー設定
          </Typography>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              プロフィール
            </Typography>

            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <TextField
              fullWidth
              label="名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="メールアドレス"
              value={session?.user?.email || ''}
              margin="normal"
              disabled
              helperText="メールアドレスは変更できません"
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '保存'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}
