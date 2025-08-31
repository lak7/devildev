import { Skeleton } from "./skeleton"
import { Card } from "./card"

export function ProjectSkeleton() {
  return (
    <Card className="bg-zinc-950 border border-gray-500/30 overflow-hidden rounded-s-sm rounded-l-sm rounded-b-sm rounded-t-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-6 h-6 rounded-md" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="w-4 h-4 rounded" />
        </div>

        {/* Repository info */}
        <div className="flex items-center gap-1.5 mb-3">
          <Skeleton className="w-3 h-3 rounded" />
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-3 h-3 rounded" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ProjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <ProjectSkeleton key={index} />
      ))}
    </div>
  )
}

export function ProjectPageSkeleton() {
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Navbar Skeleton */}
      <nav className="h-16 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/10 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-10 h-10 rounded-lg bg-zinc-900" />
          <div className="flex items-center space-x-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-zinc-900" />
            <Skeleton className="w-20 h-6 rounded bg-zinc-900" />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Skeleton className="w-32 h-10 rounded-lg bg-zinc-900" />
          <Skeleton className="w-9 h-9 rounded-full bg-zinc-900" />
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-1 p-4 min-h-0 relative pb-0 md:pb-4 h-full">
        {/* Left Chat Panel - 30% width */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col min-h-0 w-[30%] shadow-2xl">
          {/* Chat Header */}
          <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-zinc-800 bg-zinc-950/50">
            <Skeleton className="w-24 h-8 rounded-md bg-zinc-900" />
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gradient-to-b from-zinc-950 to-zinc-900/20">
            {/* Message skeletons */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col items-start animate-pulse">
                <div className="flex w-full">
                  <Skeleton className="w-8 h-8 rounded-full mr-3 flex-shrink-0 bg-zinc-900 ring-2 ring-zinc-800" />
                  <div className="flex-1">
                    <Skeleton className={`h-16 rounded-2xl bg-zinc-900/80 ${index % 2 === 0 ? 'w-48' : 'w-56'}`} />
                    {index % 3 === 0 && (
                      <Skeleton className="w-32 h-8 rounded-lg mt-2 bg-zinc-900/60" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 flex-shrink-0 bg-zinc-950/80 border-t border-zinc-800/30">
            <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-2xl p-3 shadow-inner">
              <Skeleton className="w-full h-12 rounded-lg bg-zinc-800/80" />
            </div>
          </div>
        </div>

        {/* Right Panel - 70% width */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col min-h-0 w-[70%] shadow-2xl">
          {/* Tab Headers */}
          <div className="flex items-center justify-between px-4 py-3 rounded-t-xl border-b border-zinc-800 bg-zinc-950/50">
            <div className="flex space-x-1">
              <Skeleton className="w-24 h-8 rounded-md bg-zinc-900" />
              <Skeleton className="w-28 h-8 rounded-md bg-zinc-900" />
            </div>
            <Skeleton className="w-8 h-8 rounded-md bg-zinc-900" />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden min-h-0 p-4 bg-gradient-to-br from-zinc-950 via-zinc-900/20 to-zinc-950">
            <div className="h-full w-full">
              {/* Architecture/Docs content skeleton */}
              <div className="grid grid-cols-2 gap-6 h-full">
                <div className="space-y-6">
                  <Skeleton className="w-full h-32 rounded-xl bg-zinc-900/80 shadow-lg" />
                  <Skeleton className="w-full h-24 rounded-xl bg-zinc-900/80 shadow-lg" />
                  <Skeleton className="w-full h-20 rounded-xl bg-zinc-900/80 shadow-lg" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="w-full h-28 rounded-xl bg-zinc-900/80 shadow-lg" />
                  <Skeleton className="w-full h-36 rounded-xl bg-zinc-900/80 shadow-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="w-full h-16 rounded-lg bg-zinc-900/60" />
                    <Skeleton className="w-full h-16 rounded-lg bg-zinc-900/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProjectPageSkeletonGrid() {
  return (
    <ProjectPageSkeleton/>
  )
}
