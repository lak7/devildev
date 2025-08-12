"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation";
import { Search, FileText, Globe, BarChart3, Maximize, X, Menu, MessageCircle, Users, Phone, Plus, Loader2, MessageSquare, Send, BrainCircuit, Code, Database, Server } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProject } from "../../../../actions/project";
import { useUser } from '@clerk/nextjs';

interface Project {
  id: string;
  name: string;
  framework: string;
  createdAt: Date;
  updatedAt: Date;
  ProjectArchitecture: any;
}

const ProjectPage = () => {
    const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'docs'>('overview');
  const [inputMessage, setInputMessage] = useState('');
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isArchitectureGenerating, setIsArchitectureGenerating] = useState(false);
  
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser();

    useEffect(() => {
        const loadProject = async () => {
      if (!projectId || !isSignedIn) return;
      
      try {
        const projectData = await getProject(projectId);
        if (projectData) {
          setProject(projectData as Project);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally { 
        setIsLoading(false);
      }
    };

        loadProject();

        if(project?.ProjectArchitecture){
            setIsArchitectureGenerating(false);
        }else{
            setIsArchitectureGenerating(true);
        }
  }, [projectId, isSignedIn]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const newLeftWidth = (newX / containerWidth) * 100;
        
        // Constrain between 25% and 75%
        const constrainedWidth = Math.min(75, Math.max(25, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
     
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 180;
    
    if (scrollHeight <= maxHeight) {
      textarea.style.height = scrollHeight + 'px';
      setTextareaHeight(scrollHeight + 'px');
    } else {
      textarea.style.height = maxHeight + 'px';
      setTextareaHeight(maxHeight + 'px');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    
    // Mock message handling - not functional as requested
    console.log("Chat message:", inputMessage);
    setInputMessage('');
    setTextareaHeight('60px');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if(isArchitectureGenerating){
    return (
        <div className="h-dvh bg-black text-white p-4 overflow-hidden flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
             <div className="relative w-32 h-32">
  <video 
       src="/thethe.mp4" 
       autoPlay 
       loop 
       muted 
       className="elative w-full h-full object-cover rounded-full"
     />
  </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Generating Architecture...</h3>
              <p className="text-sm text-gray-400">DevilDev is analyzing your requirements and crafting the perfect architecture</p>
            </div>
          </div>
        </div>
      )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Enhanced Navbar */}
      <nav className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-6 flex-shrink-0 relative">
        {/* Left side - Burger menu and Logo */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarHovered(!isSidebarHovered)}
            className={`p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200`}
            title="Open sidebar"
          > 
            <Menu className={`h-6 w-6 text-gray-400 hover:text-white transition-colors`} />
          </button>
        
          <button 
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            title="Go to Home"
          >
            <div className="relative">
              <Image
                src="/favicon.jpg"
                alt="DevilDev Logo"
                width={36}
                height={36}
                className="rounded-lg transition-all duration-200"
              />
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block group-hover:text-red-400 transition-colors">
              DevilDev
            </span>
          </button>
        </div> 

        {/* Center - Project Info */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Code className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium">{project.name}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{project.framework}</span>
          </div>
        </div>

        {/* Right side - Actions and User avatar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.open('/connect-mcp', '_blank')}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Connect MCP"
          >
            <BrainCircuit className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Connect MCP
            </span>
          </button>

          <div className="flex items-center">
            <Avatar className="size-9 ring-2 ring-gray-600/30 hover:ring-gray-500/50 transition-all duration-200">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Hover trigger area */}
      {isSignedIn && (
        <div 
          className="fixed top-16 left-0 w-4 h-[calc(100vh-4rem)] z-30"
          onMouseEnter={() => setIsSidebarHovered(true)}
        />
      )}

      {/* Hover-expandable Sidebar */}
      {isSignedIn && (
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black/30 backdrop-blur-md border-r border-red-500/20 transition-all duration-300 ease-in-out z-20 group ${
            isSidebarHovered ? 'w-72' : 'w-0'
          } overflow-hidden`}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full pt-8 pb-3">
            {/* Navigation items */}
            <div className="px-2 space-y-2">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item w-full"
                title="New Project"
              >
                <Plus className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  New Project
                </span>
              </button>
              <a
                href="/devlogs"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Community"
              >
                <Users className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Community
                </span>
              </a>
            </div>

            {/* User avatar at bottom */}
            <div className="px-2 mt-auto">
              <div className="flex items-center space-x-3 px-3 py-3 rounded-lg backdrop-blur-sm bg-black/20">
                <Avatar className="size-8 ring-2 ring-white">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 flex gap-1 p-4 min-h-0 relative pb-0 md:pb-4 h-full">
        {/* Left Chat Panel - Resizable */}
        <div 
          className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-800">
            <div className="flex space-x-1">
              <button
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 text-white bg-gray-700/50`}
              >
                Project Chat
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
            {/* Welcome message */}
            <div className="flex justify-start">
              <div className="mr-3 flex-shrink-0">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
              <div className="max-w-[80%] rounded-2xl px-2 py-1 text-white">
                <p className="text-sm text-gray-300">
                  Welcome to your project workspace! Ask me anything about <span className="font-semibold text-white">{project.name}</span> built with <span className="font-semibold text-red-400">{project.framework}</span>.
                </p>
              </div>
            </div>

            {/* Display chat messages here */}
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-start'}`}>
                {message.type === 'assistant' && (
                  <div className="mr-3 flex-shrink-0">
                    <Image
                      src="/favicon.jpg"
                      alt="Assistant"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                )}
                {message.type === 'user' && (
                  <div className="mr-1 flex-shrink-0">
                    <Avatar className="size-8">
                      <AvatarImage src={user?.imageUrl} alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="max-w-[80%] rounded-2xl px-2 py-1 text-white">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isChatLoading && (
              <div className="flex justify-start items-center space-x-3 animate-pulse">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-white/69 text-sm flex items-center">
                  <span>thinking</span>
                  <span className="ml-1">...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-black border-t border-x border-gray-500 backdrop-blur-sm overflow-hidden rounded-t-2xl">
                <textarea
                  placeholder="Ask about your project..."
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm md:text-base focus:outline-none resize-none overflow-y-auto min-h-[60px] max-h-[180px]"
                  rows={2}
                  style={{ height: textareaHeight }}
                  maxLength={5000}
                  disabled={isChatLoading}
                />
              </div>
              
              {/* Button section */}
              <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
                <button 
                  type="submit" 
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={!inputMessage.trim() || isChatLoading}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className={`w-1 bg-transparent hover:bg-gray-500/50 cursor-col-resize transition-all duration-200 relative group ${
            isResizing ? 'bg-gray-500/70' : ''
          }`}
          onMouseDown={handleResizeStart}
        >
          <div className="absolute inset-0 -left-2 -right-2 w-5"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Right Panel with Tabs - Part 1 */}
        <div 
          className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Tab Headers */}
          <div className="flex items-center justify-between px-4 py-3 rounded-t-xl border-b border-gray-800">
            <div className="flex space-x-1"> 
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'architecture'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Architecture
              </button>
              
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'docs'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Documentation
              </button>
            </div>
            
            {/* Fullscreen button */}
            <button
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
              title="Fullscreen View"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            {/* Overview Tab */}
            <div className={`h-full ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
              <div className="space-y-6">
                {/* Project Header */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl">
                    <Code className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                        {project.framework}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Database className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Created</p>
                        <p className="text-white font-medium">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Server className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Last Updated</p>
                        <p className="text-white font-medium">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center space-x-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-200 group">
                      <FileText className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                      <div className="text-left">
                        <p className="text-white font-medium">Generate Documentation</p>
                        <p className="text-sm text-gray-400">Create comprehensive project docs</p>
                      </div>
                    </button>
                    
                    <button className="flex items-center space-x-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-200 group">
                      <BarChart3 className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                      <div className="text-left">
                        <p className="text-white font-medium">View Analytics</p>
                        <p className="text-sm text-gray-400">Track project metrics and performance</p>
                      </div>
                    </button>
                    
                    <button className="flex items-center space-x-3 p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-200 group">
                      <Globe className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                      <div className="text-left">
                        <p className="text-white font-medium">Deploy Project</p>
                        <p className="text-sm text-gray-400">Deploy to production environment</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Architecture Tab */}
            <div className={`h-full ${activeTab === 'architecture' ? 'block' : 'hidden'}`}>
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Architecture View</h3>
                    <p className="text-gray-400 max-w-md">
                      Project architecture visualization will be displayed here. Connect with the chat to generate your project's architecture diagram.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documentation Tab */}
            <div className={`h-full ${activeTab === 'docs' ? 'block' : 'hidden'}`}>
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Documentation</h3>
                    <p className="text-gray-400 max-w-md">
                      Project documentation, guides, and resources will be available here. Generate docs through the chat interface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
        
        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }
        
        /* Disable text selection during resize */
        ${isResizing ? '*{user-select: none !important;}' : ''}
      `}</style>
    </div>
  );
};

export default ProjectPage;