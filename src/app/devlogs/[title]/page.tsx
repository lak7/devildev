import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'

interface DevlogPageProps {
  params: { title: string }
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

async function getDevlog(title: string): Promise<Devlog | null> {
  try {
    const decodedTitle = decodeURIComponent(title)
    
    const devlog = await db.devlogs.findFirst({
      where: {
        OR: [
          { title: decodedTitle },
          { slug: decodedTitle }
        ]
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

// Generate metadata for SEO and Open Graph
export async function generateMetadata({ params }: DevlogPageProps): Promise<Metadata> {
  const devlog = await getDevlog(params.title)

  if (!devlog) {
    return {
      title: 'Devlog Not Found',
      description: 'The requested devlog could not be found.',
    }
  }

  return {
    title: devlog.seoTitleTag || devlog.title,
    description: devlog.seoMetaDescription || devlog.excerpt || 'Read this devlog on DevilDev',
    keywords: devlog.tags.join(', '),
    alternates: {
      canonical: devlog.seoCanonicalUrl || undefined,
    },
    openGraph: {
      title: devlog.ogTitle || devlog.title,
      description: devlog.ogDescription || devlog.excerpt || 'Read this devlog on DevilDev',
      images: devlog.ogImage ? [
        {
          url: devlog.ogImage,
          width: 1200,
          height: 630,
          alt: devlog.title,
        },
      ] : undefined,
      type: 'article',
      publishedTime: devlog.publishedDate,
      modifiedTime: devlog.updatedDate,
      authors: ['DevilDev'],
    },
    twitter: {
      card: (devlog.twitterCard as 'summary_large_image') || 'summary_large_image',
      title: devlog.twitterTitle || devlog.title,
      description: devlog.twitterDescription || devlog.excerpt || 'Read this devlog on DevilDev',
      images: devlog.twitterImage ? [devlog.twitterImage] : undefined,
    },
  }
}

const DevlogPage = async ({ params }: DevlogPageProps) => {
  const devlog = await getDevlog(params.title)
  
  if (!devlog) {
    notFound()
  }
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-8">
          {/* Categories */}
          {devlog.categories && devlog.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {devlog.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {devlog.title}
          </h1>

          {/* Excerpt */}
          {devlog.excerpt && (
            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              {devlog.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>Published: {formatDate(devlog.publishedDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>Updated: {formatDate(devlog.updatedDate)}</span>
            </div>
            {devlog.readingTime && (
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span>{devlog.readingTime} min read</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {devlog.tags && devlog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {devlog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-blue-900/30 text-blue-300 rounded-full border border-blue-700/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {devlog.coverImage && (
          <div className="mb-8">
            <img
              src={devlog.coverImage}
              alt={devlog.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* Content Section */}
        <article className="max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              // Headers with proper hierarchy and spacing
              h1: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h1 id={id} className="text-4xl font-bold text-white mt-12 mb-6 first:mt-0 scroll-mt-8">
                    {children}
                  </h1>
                )
              },
              h2: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h2 id={id} className="text-3xl font-bold text-white mt-10 mb-5 first:mt-0 scroll-mt-8">
                    {children}
                  </h2>
                )
              },
              h3: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h3 id={id} className="text-2xl font-semibold text-white mt-8 mb-4 first:mt-0 scroll-mt-8">
                    {children}
                  </h3>
                )
              },
              h4: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h4 id={id} className="text-xl font-semibold text-white mt-6 mb-3 first:mt-0 scroll-mt-8">
                    {children}
                  </h4>
                )
              },
              h5: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h5 id={id} className="text-lg font-semibold text-white mt-5 mb-2 first:mt-0 scroll-mt-8">
                    {children}
                  </h5>
                )
              },
              h6: ({ children }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
                return (
                  <h6 id={id} className="text-base font-semibold text-white mt-4 mb-2 first:mt-0 scroll-mt-8">
                    {children}
                  </h6>
                )
              },
              // Paragraphs with proper spacing
              p: ({ children }) => (
                <p className="text-gray-200 text-lg leading-relaxed mb-6">
                  {children}
                </p>
              ),
              // Links with hover effects
              a: ({ children, href }) => {
                // Check if it's an internal anchor link (starts with #)
                const isInternalLink = href?.startsWith('#')
                
                return (
                  <a 
                    href={href} 
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors duration-200"
                    target={isInternalLink ? undefined : "_blank"}
                    rel={isInternalLink ? undefined : "noopener noreferrer"}
                  >
                    {children}
                  </a>
                )
              },
              // Code blocks with better styling
              pre: ({ children }) => (
                <div className="my-8">
                  <pre className="bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-x-auto text-sm leading-relaxed">
                    {children}
                  </pre>
                </div>
              ),
              // Inline code
              code: ({ children, className }) => {
                const isInline = !className
                if (isInline) {
                  return (
                    <code className="bg-gray-800/70 text-green-400 px-2 py-1 rounded-md text-base font-mono">
                      {children}
                    </code>
                  )
                }
                return <code className={className}>{children}</code>
              },
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 bg-gray-900/40 pl-6 pr-4 py-4 my-8 italic text-gray-300 text-lg rounded-r-lg">
                  {children}
                </blockquote>
              ),
              // Lists with proper spacing
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-gray-200 text-lg space-y-2 mb-6 pl-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-gray-200 text-lg space-y-2 mb-6 pl-4">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">
                  {children}
                </li>
              ),
              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-8 rounded-lg border border-gray-700">
                  <table className="min-w-full">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-800">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-gray-700">
                  {children}
                </tbody>
              ),
              th: ({ children }) => (
                <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-6 py-4 text-gray-200 text-base">
                  {children}
                </td>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-gray-800/50 transition-colors duration-150">
                  {children}
                </tr>
              ),
              // Strong and emphasis
              strong: ({ children }) => (
                <strong className="font-bold text-white">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-100">
                  {children}
                </em>
              ),
              // Horizontal rule
              hr: () => (
                <hr className="border-gray-700 my-12 border-t-2" />
              ),
              // Images
              img: ({ src, alt }) => (
                <div className="my-8">
                  <img 
                    src={src} 
                    alt={alt} 
                    className="rounded-lg shadow-2xl max-w-full h-auto mx-auto"
                  />
                  {alt && (
                    <p className="text-center text-gray-400 text-sm mt-2 italic">
                      {alt}
                    </p>
                  )}
                </div>
              ),
            }}
          >
            {devlog.content}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="text-center text-gray-400">
            <p>Article ID: {devlog.id}</p>
            <p>Slug: {devlog.slug}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DevlogPage
