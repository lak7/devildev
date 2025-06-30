import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Decode the slug parameter in case it's URL encoded
    const decodedSlug = decodeURIComponent(slug)
    
    // Find devlog by slug
    const devlog = await db.devlogs.findFirst({
      where: {
        slug: decodedSlug
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