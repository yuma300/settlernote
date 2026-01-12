import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const mediaDir = join(process.cwd(), 'public', 'media')

    // ディレクトリが存在しない場合は空配列を返す
    try {
      const files = await readdir(mediaDir)
      const imageFiles = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/media/${file}`
        }))

      return NextResponse.json({ images: imageFiles })
    } catch (error) {
      // ディレクトリが存在しない場合
      return NextResponse.json({ images: [] })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
