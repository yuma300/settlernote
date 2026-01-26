'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

interface Document {
  id: string
  title: string
  icon?: string | null
  children?: Document[]
}

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Navigate to a document
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
        currentDocId={undefined}
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
      </Box>
    </Box>
  )
}
