'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  ExpandMore,
  ChevronRight,
  Add,
  Description,
  Settings,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const DRAWER_WIDTH = 280

interface Document {
  id: string
  title: string
  icon?: string | null
  children?: Document[]
}

interface SidebarProps {
  documents: Document[]
  currentDocId?: string
  onDocumentSelect: (docId: string) => void
  onCreateDocument: (parentId?: string) => void
  onRefresh: () => void
  open: boolean
  onClose: () => void
}

function DocumentTreeItem({
  document,
  level = 0,
  currentDocId,
  onSelect,
  onCreate,
}: {
  document: Document
  level?: number
  currentDocId?: string
  onSelect: (docId: string) => void
  onCreate: (parentId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = document.children && document.children.length > 0

  return (
    <>
      <ListItem
        disablePadding
        sx={{ pl: level * 2 }}
        secondaryAction={
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onCreate(document.id)
            }}
          >
            <Add fontSize="small" />
          </IconButton>
        }
      >
        <ListItemButton
          selected={currentDocId === document.id}
          onClick={() => onSelect(document.id)}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(!open)
              }}
            >
              {open ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}
          <ListItemIcon sx={{ minWidth: 36 }}>
            {document.icon ? (
              <Typography>{document.icon}</Typography>
            ) : (
              <Description fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={document.title || 'Untitled'}
            primaryTypographyProps={{
              noWrap: true,
              fontSize: '0.875rem',
            }}
          />
        </ListItemButton>
      </ListItem>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {document.children!.map((child) => (
              <DocumentTreeItem
                key={child.id}
                document={child}
                level={level + 1}
                currentDocId={currentDocId}
                onSelect={onSelect}
                onCreate={onCreate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

export function Sidebar({
  documents,
  currentDocId,
  onDocumentSelect,
  onCreateDocument,
  onRefresh,
  open,
  onClose,
}: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleDocumentSelect = (docId: string) => {
    onDocumentSelect(docId)
    if (isMobile) {
      onClose()
    }
  }

  const drawerContent = (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          SettlerNote
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
          onClick={handleUserMenuOpen}
        >
          <Avatar
            src={session?.user?.image || undefined}
            alt={session?.user?.name || ''}
            sx={{ width: 32, height: 32 }}
          />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap>
              {session?.user?.name}
            </Typography>
          </Box>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
        >
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>ログアウト</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <Divider />

      {/* New Document Button */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => onCreateDocument()}
        >
          新規ドキュメント
        </Button>
      </Box>

      {/* Document Tree */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {documents.map((doc) => (
            <DocumentTreeItem
              key={doc.id}
              document={doc}
              currentDocId={currentDocId}
              onSelect={handleDocumentSelect}
              onCreate={onCreateDocument}
            />
          ))}
        </List>
      </Box>

      <Divider />

      {/* Settings Button */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Settings />}
          onClick={() => router.push('/settings')}
        >
          ユーザー設定
        </Button>
      </Box>
    </>
  )

  return (
    <>
      {/* Mobile: Temporary Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop: Permanent Drawer */
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  )
}
