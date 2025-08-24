"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getProjects } from "../../../actions/project"
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

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
  const { isLoaded, isSignedIn, user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await getProjects();
        if (result && !('error' in result)) {
          // Sort projects by creation date (latest first)
          const sortedProjects = result.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setProjects(sortedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      fetchProjects();
    }
  }, [isSignedIn]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Navbar */}
      <nav className="h-14 bg-black/95 backdrop-blur-sm border-b border-gray-800/30 flex items-center justify-between px-6 flex-shrink-0 relative">
        {/* Left side - Burger menu and Logo */}
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 hover:bg-gray-800/30 rounded-lg transition-all duration-200"
            title="Open sidebar"
          > 
            <Menu className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
          </button>
          
          {/* Logo - clickable to home */}
          <button 
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            title="Go to Home"
          >
            <div className="relative">
              <Image
                src="/favicon.jpg"
                alt="DevilDev Logo"
                width={28}
                height={28}
                className="rounded-lg transition-all duration-200"
              />
            </div>
            <span className="text-white font-semibold text-base hidden sm:block group-hover:text-red-400 transition-colors">
              DevilDev
            </span>
          </button>
        </div> 

        {/* Right side - How to, Feedback button and User avatar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open('/connect-mcp', '_blank')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/50 hover:bg-gray-800/70 border border-gray-700/50 hover:border-gray-600/70 rounded-lg transition-all duration-200 group"
            title="Connect MCP"
          >
            <BrainCircuit className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors" />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors hidden sm:block">
              Connect MCP
            </span>
          </button>

          <button
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/50 hover:bg-gray-800/70 border border-gray-700/50 hover:border-gray-600/70 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors" />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors hidden sm:block">
              Feedback
            </span>
          </button>

          <Avatar className="size-8 ring-1 ring-gray-600/30 hover:ring-gray-500/50 transition-all duration-200">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          </Avatar>
        </div>
      </nav>

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
               
               
                <button className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200">
                <div className="flex justify-center items-center gap-2.5">
                Add New...
                <ChevronDown className="w-5 h-5" />
                </div>
                 
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Import your first repository to get started</p>
                  <Button 
                    onClick={() => router.push('/new')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Import Repository
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="group bg-gray-900/30 border border-white hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden"
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            {getProjectIcon(project.framework)}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-white text-sm truncate">{project.name}</h3>
                              <p className="text-xs text-white">{project.framework || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Repository info */}
                        <div className="flex items-center gap-1.5 mb-3 text-xs text-white">
                          <Github className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{project.repoFullName || 'No repository'}</span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-white">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                          {project.defaultBranch && (
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span className="text-white">{project.defaultBranch}</span>
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
    </div>
  )
}
