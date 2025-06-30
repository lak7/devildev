import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Metadata } from 'next'
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react'

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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div>

      {/* Additional corner accents */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-red-400 transition-colors duration-300 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
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
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700/50 ring-1 ring-white/10">
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
                  <article className="bg-gray-900/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:scale-[1.02] h-full flex flex-col ring-1 ring-white/10">
                    {/* Cover Image */}
                    {devlog.coverImage ? (
                      <div className="relative h-48 overflow-hidden rounded-t-3xl">
                        <img
                          src={devlog.coverImage}
                          alt={devlog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-red-600/20 to-gray-800/20 flex items-center justify-center rounded-t-3xl">
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
                              className="px-3 py-1 text-xs bg-gray-800/70 text-gray-300 rounded-full border border-gray-700/50"
                            >
                              {category}
                            </span>
                          ))}
                          {devlog.categories.length > 2 && (
                            <span className="px-3 py-1 text-xs bg-gray-800/70 text-gray-300 rounded-full border border-gray-700/50">
                              +{devlog.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold mb-3 group-hover:text-red-400 transition-colors line-clamp-2">
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
                              className="px-2 py-1 text-xs bg-red-900/30 text-red-300 rounded-full border border-red-700/30 flex items-center gap-1"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
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
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(devlog.publishedDate)}
                          </span>
                          {devlog.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {devlog.readingTime} min
                            </span>
                          )}
                        </div>
                        <div className="text-red-400 group-hover:text-red-300 transition-colors">
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

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
    </div>
  )
}

export default DevlogsPage
