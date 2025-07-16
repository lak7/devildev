import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDevlog, getDevlogsSlugs } from '../../../../actions/devlog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react'
import 'highlight.js/styles/github-dark.css'
import { cache } from 'react'


interface DevlogPageProps {
  params: Promise<{ slug: string }>
}

const getCachedDevlog = cache(getDevlog)

// Generate static params for all devlog slugs
export async function generateStaticParams() {
  const allSlugs = await getDevlogsSlugs()
  
  return allSlugs.map((slug) => ({
    slug,
  }))
}

// Generate metadata for SEO and Open Graph
export async function generateMetadata({ params }: DevlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const devlog = await getCachedDevlog(slug)

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
  const { slug } = await params
  const devlog = await getCachedDevlog(slug)
  
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/devlogs"
            className="inline-flex items-center text-gray-400 hover:text-red-400 transition-colors duration-300 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to DevLogs
          </Link>
        </div>

        {/* Header Section */}
        <header className="mb-8">
          {/* Categories */}
          {devlog.categories && devlog.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {devlog.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-800/70 text-gray-300 rounded-full border border-gray-700/50 backdrop-blur-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
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
            <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-700/50">
              <Calendar className="h-4 w-4" />
              <span>Published: {formatDate(devlog.publishedDate)}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-700/50">
              <Calendar className="h-4 w-4" />
              <span>Updated: {formatDate(devlog.updatedDate)}</span>
            </div>
            {devlog.readingTime && (
              <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-700/50">
                <Clock className="h-4 w-4" />
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
                  className="px-3 py-1 text-sm bg-red-900/30 text-red-300 rounded-full border border-red-700/50 backdrop-blur-sm flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
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
              className="w-full h-64 md:h-96 object-cover rounded-3xl shadow-2xl ring-1 ring-white/10"
            />
          </div>
        )}

        {/* Content Section */}
        <article className="max-w-none bg-gray-900/20 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 ring-1 ring-white/10">
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
                    className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors duration-200"
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
                  <pre className="bg-gray-900/70 border border-gray-700/50 rounded-2xl p-6 overflow-x-auto text-sm leading-relaxed backdrop-blur-sm">
                    {children}
                  </pre>
                </div>
              ),
              // Inline code
              code: ({ children, className }) => {
                const isInline = !className
                if (isInline) {
                  return (
                    <code className="bg-gray-800/70 text-red-400 px-2 py-1 rounded-lg text-base font-mono border border-gray-700/50">
                      {children}
                    </code>
                  )
                }
                return <code className={className}>{children}</code>
              },
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-red-500 bg-gray-900/40 pl-6 pr-4 py-4 my-8 italic text-gray-300 text-lg rounded-r-2xl backdrop-blur-sm">
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
                <div className="overflow-x-auto my-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                  <table className="min-w-full">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-800/70">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-gray-700/50">
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
                <tr className="hover:bg-gray-800/30 transition-colors duration-150">
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
                <hr className="border-gray-700/50 my-12 border-t-2" />
              ),
              // Images
              img: ({ src, alt }) => (
                <div className="my-8">
                  <img 
                    src={src} 
                    alt={alt} 
                    className="rounded-2xl shadow-2xl max-w-full h-auto mx-auto ring-1 ring-white/10"
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
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
    </div>
  )
}

export default DevlogPage
