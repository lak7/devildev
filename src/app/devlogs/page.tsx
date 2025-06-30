import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DevLogs - DevilDev',
  description: 'Browse all development logs and project updates from DevilDev',
  keywords: 'devlogs, development, programming, projects, updates',
  openGraph: {
    title: 'DevLogs - DevilDev',
    description: 'Browse all development logs and project updates from DevilDev',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLogs - DevilDev',
    description: 'Browse all development logs and project updates from DevilDev',
  },
}

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
  createdAt: string
  updatedAt: string
}

async function getAllDevlogs(): Promise<Devlog[]> {
  try {
    const devlogs = await db.devlogs.findMany({
      orderBy: {
        publishedDate: 'desc'
      }
    })

    // Convert dates to strings for serialization
    return devlogs.map(devlog => ({
      ...devlog,
      publishedDate: devlog.publishedDate.toISOString(),
      updatedDate: devlog.updatedDate.toISOString(),
      createdAt: devlog.createdAt.toISOString(),
      updatedAt: devlog.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching devlogs:', error)
    return []
  }
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const DevlogsPage = async () => {
  const devlogs = await getAllDevlogs()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            DevLogs
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to my development journey. Here you'll find insights, updates, and behind-the-scenes stories from my projects.
          </p>
        </header>

        {/* Content Section */}
        {devlogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-semibold mb-4">No DevLogs Yet</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Stay tuned! I'm working on some exciting content to share with you soon.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex justify-center mb-12">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-gray-800">
                <span className="text-gray-300">
                  {devlogs.length} {devlogs.length === 1 ? 'DevLog' : 'DevLogs'} Published
                </span>
              </div>
            </div>

            {/* DevLogs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {devlogs.map((devlog) => (
                <Link
                  key={devlog.id}
                  href={`/devlogs/${devlog.slug}`}
                  className="group block h-full"
                >
                  <article className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] h-full flex flex-col">
                    {/* Cover Image */}
                    {devlog.coverImage ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={devlog.coverImage}
                          alt={devlog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <div className="text-4xl">📄</div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Categories */}
                      {devlog.categories && devlog.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {devlog.categories.slice(0, 2).map((category, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-md"
                            >
                              {category}
                            </span>
                          ))}
                          {devlog.categories.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-md">
                              +{devlog.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {devlog.title}
                      </h2>

                      {/* Excerpt */}
                      <div className="flex-1 mb-4">
                        {devlog.excerpt ? (
                          <p className="text-gray-300 text-sm line-clamp-3">
                            {devlog.excerpt}
                          </p>
                        ) : (
                          <p className="text-gray-300 text-sm line-clamp-3">
                            {truncateText(devlog.content.replace(/[#*`]/g, ''), 120)}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {devlog.tags && devlog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {devlog.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-md border border-blue-700/30"
                            >
                              #{tag}
                            </span>
                          ))}
                          {devlog.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-400">
                              +{devlog.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                        <div className="flex items-center gap-4">
                          <span>📅 {formatDate(devlog.publishedDate)}</span>
                          {devlog.readingTime && (
                            <span>⏱️ {devlog.readingTime} min</span>
                          )}
                        </div>
                        <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                          Read more →
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DevlogsPage
