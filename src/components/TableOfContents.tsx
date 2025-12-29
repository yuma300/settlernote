'use client'

import { Box, Typography, List, ListItem, ListItemButton } from '@mui/material'
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content?: any
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])

  useEffect(() => {
    if (!content) return

    const items: TocItem[] = []
    let headingCounter = 0

    const extractHeadings = (node: any) => {
      if (node.type === 'heading' && node.content) {
        headingCounter++
        const text = node.content
          .map((c: any) => c.text || '')
          .join('')

        // テキストからIDを生成
        const generatedId = `heading-${headingCounter}`

        items.push({
          id: generatedId,
          text,
          level: node.attrs?.level || 1,
        })
      }

      if (node.content) {
        node.content.forEach(extractHeadings)
      }
    }

    extractHeadings(content)
    setTocItems(items)
  }, [content])

  const scrollToHeading = (index: number) => {
    // エディタ内のすべての見出しを取得
    const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')

    if (headings[index]) {
      headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
      // スクロール後に少し上にオフセット
      setTimeout(() => {
        window.scrollBy({ top: -80, behavior: 'smooth' })
      }, 100)
    }
  }

  if (tocItems.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          📑 目次
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ドキュメントに見出しを追加すると、ここに目次が表示されます
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        📑 目次
      </Typography>
      <List dense>
        {tocItems.map((item, index) => (
          <ListItem
            key={item.id}
            disablePadding
            sx={{ pl: (item.level - 1) * 2 }}
          >
            <ListItemButton
              onClick={() => scrollToHeading(index)}
              sx={{
                py: 0.5,
                px: 1,
                borderRadius: 0.5,
                '&:hover': {
                  backgroundColor: 'primary.light',
                  '& .MuiTypography-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: item.level === 1 ? '0.95rem' : '0.85rem',
                  fontWeight: item.level === 1 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {item.text}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
