'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  CircularProgress,
  Typography,
  TextField
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ImageIcon from '@mui/icons-material/Image'

interface ImagePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelectImage: (url: string) => void
}

interface MediaImage {
  name: string
  url: string
}

export default function ImagePickerDialog({ open, onClose, onSelectImage }: ImagePickerDialogProps) {
  const [tab, setTab] = useState(0)
  const [images, setImages] = useState<MediaImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  // 既存画像を取得
  useEffect(() => {
    if (open && tab === 0) {
      fetchImages()
    }
  }, [open, tab])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/media')
      const data = await response.json()
      setImages(data.images || [])
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        onSelectImage(data.url)
        handleClose()
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      onSelectImage(imageUrl)
      handleClose()
    }
  }

  const handleClose = () => {
    setTab(0)
    setSelectedFile(null)
    setImageUrl('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>画像を挿入</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="既存の画像" icon={<ImageIcon />} iconPosition="start" />
          <Tab label="アップロード" icon={<CloudUploadIcon />} iconPosition="start" />
          <Tab label="URLから挿入" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {/* タブ0: 既存の画像 */}
          {tab === 0 && (
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : images.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  画像がありません
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 1
                  }}
                >
                  {images.map((image) => (
                    <Card key={image.name}>
                      <CardActionArea
                        onClick={() => {
                          onSelectImage(image.url)
                          handleClose()
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            paddingTop: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            bgcolor: '#f5f5f5'
                          }}
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* タブ1: アップロード */}
          {tab === 1 && (
            <Box sx={{ py: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload-input"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="image-upload-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 2 }}
                >
                  ファイルを選択
                </Button>
              </label>
              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    選択されたファイル: {selectedFile.name}
                  </Typography>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="preview"
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* タブ2: URLから挿入 */}
          {tab === 2 && (
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="画像URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        {tab === 1 && (
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            variant="contained"
          >
            {uploading ? <CircularProgress size={24} /> : 'アップロード'}
          </Button>
        )}
        {tab === 2 && (
          <Button
            onClick={handleImageUrlSubmit}
            disabled={!imageUrl}
            variant="contained"
          >
            挿入
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
