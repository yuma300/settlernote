'use client'

import { signIn } from 'next-auth/react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
} from '@mui/material'
import { Google } from '@mui/icons-material'

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/documents' })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            SettlerNote
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Notionライクなドキュメント管理システム
          </Typography>

          <Stack spacing={2} sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Google />}
              onClick={handleGoogleSignIn}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Googleでログイン
            </Button>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, textAlign: 'center' }}
          >
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
