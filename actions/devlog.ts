"use server"

import { db } from '@/lib/db'

interface Devlog {
  id: string
  title: string
  slug: string
  content: string
  coverImage: string | null
  publishedDate: string
  updatedDate: string
  tags: string[]
  categories: string[]
  readingTime: number | null
  excerpt: string | null
  seoTitleTag: string | null
  seoMetaDescription: string | null
  seoCanonicalUrl: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  twitterCard: string | null
  twitterTitle: string | null
  twitterDescription: string | null
  twitterImage: string | null
  createdAt: string
  updatedAt: string
}

export async function getDevlog(slug: string): Promise<Devlog | null> {
  try {
    const decodedSlug = decodeURIComponent(slug)
    
    const devlog = await db.devlogs.findFirst({
      where: {
        slug: decodedSlug
      }
    })

    if (!devlog) {
      return null
    }

    // Convert dates to strings for serialization
    return {
      ...devlog,
      publishedDate: devlog.publishedDate.toISOString(),
      updatedDate: devlog.updatedDate.toISOString(),
      createdAt: devlog.createdAt.toISOString(),
      updatedAt: devlog.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error('Error fetching devlog:', error)
    return null
  }
}