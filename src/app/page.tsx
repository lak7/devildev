"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3, SendHorizonal, Maximize, X, Menu, ChevronLeft, MessageCircle, Users, Phone, Info, Loader2, Github } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startOrNot, firstBot } from '../../actions/agentsFlow';
import { generateArchitecture, generateArchitectureWithToolCalling } from '../../actions/architecture'; 
import { getUserChats } from '../../actions/chat';
import { getGitHubStatus, disconnectGitHub, initiateGitHubConnection } from '../../actions/github';
import FileExplorer from '@/components/core/ContextDocs';
import Noise from '@/components/Noise/Noise';
import { UserProfile, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';



interface UserChat {
  id: string;
  title: string | null;
  updatedAt: Date;
  createdAt: Date;
}

interface GitHubStatus {
  isConnected: boolean;
  githubUsername?: string;
  githubAvatarUrl?: string;
  connectedAt?: Date;
}


export default function Page() {
  const [inputMessage, setInputMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');
  // const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ isConnected: false });
  const [githubLoading, setGithubLoading] = useState(false);
  

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Function to fetch user's chats
  const fetchUserChats = async () => {
    if (!isSignedIn) return;
    
    setChatsLoading(true);
    try {
      const result = await getUserChats(10); // Get last 10 chats
      if (result.success && result.chats) {
        setUserChats(result.chats);
      } else {
        console.error('Failed to fetch chats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  // Function to fetch GitHub status
  const fetchGithubStatus = async () => {
    if (!isSignedIn) return;
    
    try {
      const result = await getGitHubStatus();
      if (result.success && result.data) {
        setGithubStatus(result.data);
      } else {
        console.error('Failed to fetch GitHub status:', result.error);
        // Set default status if fetch fails
        setGithubStatus({ isConnected: false });
      }
    } catch (error) {
      console.error('Error fetching GitHub status:', error);
      // Set default status if there's an exception
      setGithubStatus({ isConnected: false });
    }
  };

  // Function to handle GitHub connection
  const handleGithubConnect = async () => {
    if (githubStatus.isConnected) {
      // If already connected, show option to disconnect
      const confirmed = window.confirm('Are you sure you want to disconnect your GitHub account?');
      if (!confirmed) return;
      
      setGithubLoading(true);
      try {
        const result = await disconnectGitHub();
        if (result.success) {
          setGithubStatus({ isConnected: false });
        } else {
          console.error('Failed to disconnect GitHub:', result.error);
          alert('Failed to disconnect GitHub. Please try again.');
        }
      } catch (error) {
        console.error('Error disconnecting GitHub:', error);
        alert('Failed to disconnect GitHub. Please try again.');
      } finally {
        setGithubLoading(false);
      }
    } else {
      // Initiate GitHub connection
      setGithubLoading(true);
      try {
        const result = await initiateGitHubConnection();
        if (result.success && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          console.error('Failed to initiate GitHub connection:', result.error);
          alert('Failed to connect GitHub. Please try again.');
          setGithubLoading(false);
        }
      } catch (error) {
        console.error('Error connecting GitHub:', error);
        alert('Failed to connect GitHub. Please try again.');
        setGithubLoading(false);
      }
    }
  };

  // Fetch chats and GitHub status when user is signed in
  useEffect(() => {
    const firstMessage = localStorage.getItem('firstMessage');
    if (firstMessage) {
      setInputMessage(firstMessage);
      localStorage.removeItem('firstMessage');
    }
    
    // Check for GitHub connection success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_connected') === 'true') {
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Show success message
      alert('GitHub successfully connected!');
    }
    
    if (isSignedIn && isLoaded) {
      fetchUserChats();
      fetchGithubStatus();
    }
  }, [isSignedIn, isLoaded]);


  const handleFirstMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (isSignedIn) {
      setIsLoading(true);
      try {
        // Generate UUID for new chat
        const chatId = crypto.randomUUID();
        
        // Store chat data in localStorage
        localStorage.setItem('isNewChat', "true");
        localStorage.setItem('newChatId', chatId);
        localStorage.setItem('firstMessage', inputMessage.trim());
        
        // Immediately redirect to dev page
        router.push(`/dev/${chatId}`);
      } catch (error) {
        console.error("Error preparing new chat:", error);
        setIsLoading(false); 
      }
    } else {
      localStorage.setItem('firstMessage', inputMessage.trim());
      router.push('/sign-in');
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
     
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 180; // Maximum height in pixels (about 7-8 lines)
    
    if (scrollHeight <= maxHeight) {
      textarea.style.height = scrollHeight + 'px';
      setTextareaHeight(scrollHeight + 'px');
    } else {
      textarea.style.height = maxHeight + 'px';
      setTextareaHeight(maxHeight + 'px');
    }
  };


  if(!isLoaded){
    return <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  }


  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,0,0,0.15), transparent 40%)`,
        }}
      />

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

      {/* Mobile burger menu button */}
      {isSignedIn && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="fixed top-4 left-4 z-30 md:hidden bg-black/50 backdrop-blur-md border border-red-500/20 rounded-lg p-2 text-white hover:bg-black/70 transition-all duration-200"
        >
          {isMobileSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Mobile overlay */}
      {isSignedIn && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Hover-expandable Sidebar for signed in users */}
      {isSignedIn && (
        <div 
          className={`fixed top-0 left-0 h-full bg-black/30 backdrop-blur-md border-r border-red-500/20 transition-all duration-300 ease-in-out z-20 group overflow-hidden
            md:hover:w-72 md:${isSidebarHovered ? 'w-72' : 'w-16'}
            ${isMobileSidebarOpen ? 'w-72' : 'w-0 md:w-16'}
          `}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full pt-8 pb-6">
            {/* Top navigation items */}
            <div className="px-2 space-y-2">
              
              <button
                onClick={handleGithubConnect}
                disabled={githubLoading}
                className={`flex items-center space-x-4 px-3 py-3 rounded-lg transition-all duration-200 group/item w-full text-left border ${
                  githubStatus.isConnected 
                    ? 'text-green-300 hover:text-green-200 hover:bg-green-900/20 hover:border-green-500/30 border-green-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border-transparent'
                } ${githubLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={githubStatus.isConnected ? `Connected as ${githubStatus.githubUsername}` : "Connect Github"}
              >
                {githubLoading ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-red-400" />
                ) : (
                  <Github className={`h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 ${
                    githubStatus.isConnected ? 'text-green-400' : 'text-red-400'
                  }`} />
                )}
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  {githubStatus.isConnected ? `Connected: ${githubStatus.githubUsername}` : 'Connect Github'}
                </span>
              </button>
          
              <a
                href="/community"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Community"
              >
                <Users className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Community
                </span>
              </a>
              <a
                href="/contact"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Contact"
              >
                <Phone className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Contact
                </span>
              </a>
            </div>

            {/* Elegant divider */}
            <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>

            {/* Chats section */}
            <div className="flex-1 px-2">
              <div className="flex items-center space-x-4 px-3 py-3 mb-3">
                <MessageCircle className="h-5 w-5 text-red-400/70 flex-shrink-0" />
                <span className={`text-sm font-medium text-red-400/90 whitespace-nowrap transition-all duration-300 ${
                  (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Chats
                </span>
              </div>
              <div className={`space-y-1 transition-all duration-300 ${
                (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100' : 'opacity-0'
              } max-h-96 overflow-y-auto chat-scrollbar`}>
                {chatsLoading ? (
                  <div className="flex items-center justify-center px-6 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400/60" />
                  </div>
                ) : userChats.length > 0 ? (
                  userChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => router.push(`/dev/${chat.id}`)} 
                      className="w-full text-left px-3 py-2.5 rounded-md text-gray-300 hover:text-white hover:bg-black/30 hover:border-red-500/20 border border-transparent transition-all duration-200 group/chat"
                      title={chat.title || 'Untitled Chat'}
                    >
                      <div className="truncate text-sm font-medium">
                        {chat.title || 'Untitled Chat'}
                      </div>
                      <div className="text-xs text-gray-500 group-hover/chat:text-gray-400 truncate mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-xs italic">
                    No recent chats
                  </div>
                )}
              </div>
            </div>

            {/* User avatar at bottom with enhanced design */}
            <div className="px-2 mt-auto">
              <div className="flex items-center space-x-3 px-3 py-3 rounded-lg backdrop-blur-sm bg-black/20">
                <Avatar className="size-8 ring-2 ring-white">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${
                  (isSidebarHovered || isMobileSidebarOpen) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
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

          {/* Thin accent line on the right */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-red-500/40 to-transparent"></div>
        </div>
      )}

      <div className="flex h-full w-full justify-center items-center">
        {isSignedIn && (
          <div className="h-dvh min-w-16 bg-black visible:none left-0 hidden md:block"/>
        )}
        {/* Main content */}
        <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-2 bottom-12 transition-all duration-300 ${
          isSignedIn ? 'md:ml-0' : ''
        } ${isSignedIn && isMobileSidebarOpen ? 'blur-sm md:blur-none' : ''}`}>
          <div className="mb-0  flex justify-center">
            <Image
              src="/finaldev.png"
              alt="DevilDev Logo" 
              width={400}
              height={120}
              className="w-auto h-32 md:h-32 lg:h-56 drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-light mb-12 text-center">
            From Idea to Architecture—Instinctively
          </h1>

          {/* Search Input */}
          <div className={`w-full sm:w-[600px] md:w-[800px] lg:w-[1200px] xl:w-[750px] transition-all duration-300 ${
            isSignedIn && isMobileSidebarOpen ? 'px-4' : ''
          }`}>
            <form onSubmit={handleFirstMessage} className="relative">
              <div className="bg-white/5 border-t border-x border-gray-600/100 backdrop-blur-sm overflow-hidden rounded-t-2xl">
                <textarea
                  placeholder="What you want to build?"
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFirstMessage(e);
                    }
                  }}
                  className=" bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm md:text-base focus:outline-none resize-none overflow-y-auto min-h-[69px] max-h-[180px] w-full"
                  rows={2}
                  style={{ height: textareaHeight }}
                  maxLength={69000}
                  disabled={isLoading}
                />
              </div>
              
              {/* Button section */}
              <div className="bg-white/5 border-x border-b border-gray-600/100 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
                <button 
                  type="submit" 
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <SendHorizonal className="h-4 w-4" /> 
                </button>
              </div>
            </form>
          </div>
          {!isSignedIn && (
            <div className="flex w-full h-full justify-center items-center mt-12">
             <a href="/contact" target="_blank" rel="noopener noreferrer" className="text-white/69 hover:text-white transition-colors cursor-pointer">Contact</a>
             <div className="w-px h-6 bg-gray-400 mx-5" />
             <a href="/community" target="_blank" rel="noopener noreferrer" className="text-white/69 hover:text-white transition-colors cursor-pointer">Community</a>
             
   
             {/* <span className="text-red-500">Hello</span>
             <h1>Hello</h1> */}
             </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"/>

      {!isSignedIn && (
<div className="">
{/* Corner decorations */}
<div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
</div>
      )}

      
    </div>
  );
}