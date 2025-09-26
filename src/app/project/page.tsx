"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectSkeletonGrid } from "@/components/ui/project-skeleton"
import { GlowButton } from "@/components/ui/GlowButton05"
import {
  MoreHorizontal,
  RotateCcw,
  Github,
  GitBranch,
  Triangle,
  Zap,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  BarChart3,
  Eye,
  BrainCircuit,
  MessageSquare,
  Menu,
  Plus,
  Users,
  MessageCircle,
  Clock,
  Folder,
  Upload,
  Loader2,
  X,
} from "lucide-react"
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from "react"
import { submitFeedback } from "../../../actions/feedback"
import Nav from "@/components/core/Nav"
import GithubOAuthDeprecatedNotice from "@/components/GithubOAuthDeprecatedNotice"

interface Project {
  id: string;
  name: string;
  framework: string | null;
  createdAt: Date;
  repoFullName: string | null;
  defaultBranch: string | null;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser();
  const [isDevSidebarHovered, setIsDevSidebarHovered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SWR fetcher function using API route
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  };

  // Use SWR for caching and revalidation
  const { data: projects = null, error, isLoading } = useSWR(
    isSignedIn ? '/api/projects/getUserProjects' : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window gains focus
      revalidateOnReconnect: true, // Refetch when reconnecting to the internet
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      errorRetryCount: 3, // Retry on error 3 times
      errorRetryInterval: 1000, // Wait 1 second between retries
    }
  );

  // Function to handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);
    
    try {
      const result = await submitFeedback("project", feedbackText);
      
      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Thank you for your feedback! We appreciate your input.'
        });
        setFeedbackText(''); 
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setFeedbackMessage(null);
        }, 2000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'Failed to submit feedback. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      setIsInitialLoading(false);
    }
  }, [isLoaded, isSignedIn, isLoading]);

  const getProjectIcon = (framework: string | null) => {
    if (!framework) {
      return (
        <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-md flex items-center justify-center">
          <div className="text-white font-bold text-xs">{"</>"}</div>
        </div>
      );
    }
    
    switch (framework.toLowerCase()) {
      case 'react':
        return <Image src="/react.png" alt="React" width={24} height={24} className="rounded-md" />;
      default:
        return <Image src="/nextjs.png" alt="Next.js" width={24} height={24} className="rounded-md" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const projectDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - projectDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  // if(isInitialLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400"></div>
  //     </div>
  //   )
  // }


  return (
    <div className="min-h-screen bg-black text-white">
      
      <Nav setIsFeedbackOpen={setIsFeedbackOpen} isMCP={true} isProject={false} />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 w-full flex justify-between items-center ">
                <div className="">
                <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                <p className="text-gray-400 text-sm">Manage and explore your imported repositories</p>
                </div>
               
               {projects && projects.length > 0 && (
                <button onClick={() => router.push('/new')} className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:bg-gray-300 hover:cursor-pointer">
                <div className="flex justify-center font-medium items-center gap-2.5">
                Add New...
                <ChevronDown className="w-5 h-5" />
                </div>
                 
                </button>
               )}
                
              </div>
              
              {error ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-red-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Triangle className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Failed to load projects</h3>
                  <p className="text-gray-400 text-sm mb-6">Please try refreshing the page</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : isInitialLoading || isLoading || !projects ? (
                <ProjectSkeletonGrid />
              ) : projects && projects.length === 0 ? (
                <div className="flex w-full h-full justify-center items-center">
                  {/* Right Section - Projects */}
                  <div className="w-full max-w-2xl">
                    <div className="text-center">
                      <div className="relative mx-auto mb-6">
                        <div className="relative inline-block">
                          {/* Circular glow layers */}
                          <div
                            className="absolute inset-0 rounded-full blur-sm opacity-35 bg-gradient-to-r from-white to-gray-100"
                            style={{
                              transform: "scale(1.03)",
                              filter: "blur(8px)",
                              animation: "float-glow 6s ease-in-out infinite",
                            }}
                          />
                          <div
                            className="absolute inset-0 rounded-full blur-xs opacity-24 bg-gradient-to-r from-white to-gray-100"
                            style={{
                              transform: "scale(1.015)",
                              filter: "blur(4px)",
                              animation: "float-glow-secondary 7s ease-in-out infinite reverse",
                            }}
                          />
                          <div
                            className="absolute inset-0 rounded-full blur-md opacity-18 bg-gradient-to-r from-white to-gray-100"
                            style={{
                              transform: "scale(1.05)",
                              filter: "blur(12px)",
                              animation: "float-glow-tertiary 8s ease-in-out infinite",
                            }}
                          />

                          {/* Button */}
                          <button
                            onClick={() => router.push('/new')}
                            className="group relative z-10 w-24 h-24 rounded-full border-2 border-gray-300 bg-black text-white font-medium transition-all duration-300 ease-out backdrop-blur-sm cursor-pointer hover:border-gray-100 hover:scale-105 flex items-center justify-center overflow-hidden "
                          >
                            {/* Continuous shiny animation overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine rounded-full"></div>
                            <Upload className="h-12 w-12 text-gray-300 group-hover:text-white transition-colors duration-300 relative z-10" />
                          </button>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Import any React or Next.js Project</h2>
                      <p className="text-gray-400 text-sm mb-8">Start with one of our analysis types or import something new.</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-sm font-medium">Import Project</p>
                              <p className="text-gray-400 text-xs">Add a repo from your git provider</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-sm font-medium text-left">Get Your Architecture</p>
                              <p className="text-gray-400 text-xs">Instant codebase structure analysis</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                              <Eye className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-sm font-medium">Detailed Project Analysis</p>
                              <p className="text-gray-400 text-xs">Deep dive into your codebase</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                              <Zap className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-sm font-medium">Get Prompts for Big Changes</p>
                              <p className="text-gray-400 text-xs">AI-powered architectural suggestions</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-gray-500 text-xs mt-1">Jumpstart architecture analysis, code reviews, and more.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects && projects.map((project: Project) => (
                    <Card
                      key={project.id}
                      className="group bg-zinc-950 border border-gray-600 hover:border-gray-400 transition-all duration-200 cursor-pointer overflow-hidden rounded-s-sm rounded-l-sm rounded-b-sm rounded-t-sm"
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      <div className="p-4"> 
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            {getProjectIcon(project.framework)}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-200 text-sm truncate">{project.name}</h3>
                              <p className="text-xs text-gray-400">{project.framework || 'Unknown'}</p>
                            </div> 
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                        </div>

                        {/* Repository info */}
                        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                          <Github className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{project.repoFullName || 'No repository'}</span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                          {project.defaultBranch && (
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span className="text-gray-400">{project.defaultBranch}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Send Feedback</h3>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience, report bugs, or suggest features..."
                className="w-full bg-black border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none h-32"
                maxLength={1000}
                disabled={isSubmittingFeedback}
              />
              
              {/* Success/Error Message */}
              {feedbackMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-green-900/50 border border-green-600/50 text-green-300' 
                    : 'bg-red-900/50 border border-red-600/50 text-red-300'
                }`}>
                  {feedbackMessage.text}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setFeedbackMessage(null);
                    setFeedbackText('');
                  }}
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmittingFeedback && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{isSubmittingFeedback ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GithubOAuthDeprecatedNotice />
    </div>
  )
}
