import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/documents - Get all documents for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    // Get all documents (visible to all logged-in users)
    const documents = await prisma.document.findMany({
      where: {
        AND: [
          {
            isArchived: false,
          },
          parentId === null
            ? { parentId: null }
            : parentId
            ? { parentId }
            : {},
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
          },
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, icon, parentId, content } = body

    // Get the maximum position for siblings
    const maxPosition = await prisma.document.findFirst({
      where: {
        parentId: parentId || null,
        ownerId: user.id,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    })

    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled',
        icon,
        content,
        parentId: parentId || null,
        ownerId: user.id,
        position: (maxPosition?.position || 0) + 1,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
