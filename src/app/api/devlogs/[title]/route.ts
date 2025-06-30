import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { title: string } }
) {
  try {
    const { title } = params
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title parameter is required' },
        { status: 400 }
      )
    }

    // Decode the title parameter in case it's URL encoded
    const decodedTitle = decodeURIComponent(title)
    
    // Find devlog by title or slug
    const devlog = await db.devlogs.findFirst({
      where: {
        OR: [
          { title: decodedTitle },
          { slug: decodedTitle }
        ]
      }
    })

    if (!devlog) {
      return NextResponse.json(
        { error: 'Devlog not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(devlog)
  } catch (error) {
    console.error('Error fetching devlog:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 