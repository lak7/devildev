"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, SendHorizonal, Maximize, X, Menu, MessageCircle, Loader2, Github } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startOrNot, firstBot } from '../../actions/agentsFlow';
import { generateArchitecture, generateArchitectureWithToolCalling } from '../../actions/architecture'; 
import { getUserChats } from '../../actions/chat';
import { getGitHubStatus, disconnectGitHub, initiateGitHubConnection } from '../../actions/github';
import FileExplorer from '@/components/core/ContextDocs';
import Noise from '@/components/Noise/Noise';
import { SignOutButton, UserProfile, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FuturisticButton } from '@/components/ui/GlowButton01';
// import { MatrixGlitchButton } from '@/components/ui/GlowButton02';
import { GlowButton } from '@/components/ui/GlowButton05';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import HomeNav from '@/components/core/HomeNav';



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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}


export default function Page() {
  const [inputMessage, setInputMessage] = useState('');
  const [isDevSidebarHovered, setIsDevSidebarHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect when scrolling is active to reduce animation complexity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Set a new timeout
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300); // Wait 300ms after scroll stops
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

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
          // alert('Failed to disconnect GitHub. Please try again.');
        }
      } catch (error) {
        console.error('Error disconnecting GitHub:', error);
        // alert('Failed to disconnect GitHub. Please try again.');
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
          // alert('Failed to connect GitHub. Please try again.');
          setGithubLoading(false);
        }
      } catch (error) {
        console.error('Error connecting GitHub:', error);
        // alert('Failed to connect GitHub. Please try again.');
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
      // alert('GitHub successfully connected!');
    }
    
    if (isSignedIn && isLoaded) {
      fetchUserChats();
      // fetchGithubStatus();
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
    <div className="h-dvh bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,0,0,0.15), transparent 40%)`,
        }}
      />

        {/* Navbar */}
        <div className="hidden lg:block">
          <HomeNav currentPage="Home"/>
        </div>
        {/* Mobile/Tablet Navbar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 bg-black/50 backdrop-blur-md border-b border-red-500/30">
          <div className="h-full flex items-center justify-between px-4 md:px-6">
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <button
                  aria-label="Open menu"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-white/5 active:scale-95 transition"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                    title="Go to Home"
                  >
                    <Image
                    src="/bold01.png"
                    alt="DevilDev Logo"
                    width={15000}
                    height={4000}
                    className="h-full w-11 "
                    priority
                  />
                  </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                  title="Go to Home"
                >
                  <Image
                    src="/bold01.png"
                    alt="DevilDev Logo"
                    width={15000}
                    height={4000}
                    className="h-full w-11 "
                    priority
                  />
                </button>
              </div>
            )}
            {isSignedIn ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="rounded-full focus:outline-none">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.imageUrl || ''} alt={user?.fullName || 'User'} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48">
                  <div className="text-sm px-2 py-1">{user?.fullName || user?.username || 'User'}</div>
                  <div className="border-t my-2 border-white/10" />
                  <SignOutButton>
                    <button className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded">Sign out</button>
                  </SignOutButton>
                </PopoverContent>
              </Popover>
            ) : (
              <button
                onClick={() => router.push('/sign-in')}
                className="px-3 py-1.5 rounded-md border border-white/20 hover:bg-white/5 text-sm"
                aria-label="Login"
              >
                Login
              </button>
            )}
          </div>
        </div>
        {/* Spacer for mobile navbar height */}
        <div className="lg:hidden h-16" />

      {/* GRID  */}
      <div className="">
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

            {/* Left side flickering grid with gradient fades */}
            <div className="hidden sm:block absolute left-0 top-20 h-[500px] sm:h-[600px] md:h-[800px] w-1/4 sm:w-1/3  overflow-hidden">
                {/* Horizontal fade from left to right */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black z-10" />

                {/* Vertical fade from top */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-backgblackround/90 to-transparent z-10" />

                {/* Vertical fade to bottom */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />

                {mounted && (
                  <FlickeringGrid
                  className="h-full w-full"
                  squareSize={tablet ? 2 : 2.5}
                  gridGap={tablet ? 2 : 2.5}
                  color="#ff0000"
                  maxOpacity={tablet ? 0.2 : 0.4}
                  flickerChance={isScrolling ? 0.005 : (tablet ? 0.015 : 0.03)}
                />
                )}
              </div>

              {/* Right side flickering grid with gradient fades */}
              <div className="hidden sm:block absolute right-0 top-20 h-[500px] sm:h-[600px] md:h-[800px] w-1/4 sm:w-1/3  overflow-hidden">
                {/* Horizontal fade from right to left */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black z-10" />

                {/* Vertical fade from top */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-backgblackround/90 to-transparent z-10" />

                {/* Vertical fade to bottom */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />

                {mounted && (
                  <FlickeringGrid
                  className="h-full w-full"
                  squareSize={tablet ? 2 : 2.5}
                  gridGap={tablet ? 2 : 2.5}
                  color="#ff0000"
                  maxOpacity={tablet ? 0.2 : 0.4}
                  flickerChance={isScrolling ? 0.005 : (tablet ? 0.015 : 0.03)}
                />
                )}
              </div>
      </div>

      

  

      {/* Hover trigger area - invisible but extends to far left */}
      {isSignedIn && (
        <div 
          className="hidden lg:block fixed top-16 left-0 w-4 h-[calc(100vh-4rem)] z-30"
          onMouseEnter={() => setIsDevSidebarHovered(true)}
        />
      )}

      {/* Hover-expandable Sidebar for signed in users */}
      {isSignedIn && (
        <div 
          className={`hidden lg:block fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black/30 backdrop-blur-md border-r border-red-500/50 transition-all duration-300 ease-in-out z-20 group ${
            isDevSidebarHovered ? 'w-72' : 'w-0'
          } overflow-hidden`}
          onMouseLeave={() => setIsDevSidebarHovered(false)}
        >
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full pt-8 pb-3">

            {/* Chats section */}
            <div className="flex-1 px-2">
              <div className="flex items-center space-x-4 px-3 py-2  mb-3">
                <MessageCircle className="h-5 w-5 text-red-400/70 flex-shrink-0" />
                <span className={`text-sm font-medium text-red-400/90 whitespace-nowrap transition-all duration-300 ${
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Chats
                </span>
              </div>
              <div className={`space-y-1 transition-all duration-300 ${
                isDevSidebarHovered ? 'opacity-100' : 'opacity-0'
              } max-h-96 overflow-y-auto custom-scrollbar`}>
                {chatsLoading ? (
                  <div className="flex items-center justify-center px-6 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400/60" />
                  </div>
                ) : userChats.length > 0 ? (
                  userChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => router.push(`/dev/${chat.id}`)} 
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-all duration-200 group/chat text-gray-300 hover:text-white hover:bg-black/30 hover:border-red-500/20 border-transparent`}
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
          </div>

          {/* Thin accent line on the right */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-red-500/40 to-transparent"></div>
        </div>
      )}

      {/* Mobile/Tablet Sidebar Drawer */}
      {isSignedIn && (
        <>
          {/* Overlay */}
          <div
            className={`lg:hidden fixed inset-0 z-40 transition-opacity ${
              isMobileSidebarOpen ? 'bg-black/60 backdrop-blur-[2px] opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div
            className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-black/90 border-r border-red-500/40 z-50 transition-transform duration-300 ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Image src="/favicon.jpg" alt="DevilDev" width={24} height={24} />
                <span className="font-semibold">Menu</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => { router.push('/project'); setIsMobileSidebarOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
              >
                Projects
              </button>
              <button
                onClick={() => { router.push('/contact'); setIsMobileSidebarOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5"
              >
                Contact
              </button>
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wider text-red-400/80 px-3 mb-2">Chats</div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                  {chatsLoading ? (
                    <div className="flex items-center justify-center px-6 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-red-400/60" />
                    </div>
                  ) : userChats.length > 0 ? (
                    userChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => { router.push(`/dev/${chat.id}`); setIsMobileSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-md border transition-all duration-200 group/chat text-gray-300 hover:text-white hover:bg-black/30 hover:border-red-500/20 border-transparent`}
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
                    <div className="px-3 py-2 text-gray-500 text-xs italic">No recent chats</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex h-full w-full justify-center items-center">
        {/* Main content */}
        <div className={`relative z-10 flex flex-col items-center justify-center mb-28 px-2 transition-all duration-300 ${
          isSignedIn ? 'md:ml-0' : ''
        } ${isSignedIn && isMobileSidebarOpen ? 'blur-sm md:blur-none' : ''}`}>


          <h1 className="text-xl md:text-2xl lg:text-5xl font-black mb-12 text-center relative">
            
            <span className=" font-extrabold text-4xl md:text-6xl lg:text-7xl">10x your vibe coding <br></br> with the </span>
 
             <span className="bg-gradient-to-r from-red-300 via-red-500 to-red-600 bg-clip-text text-transparent text-4xl md:text-6xl lg:text-7xl">
                  DevilDev
                </span>
            {/* Enhanced glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-500/20 to-red-600/20 blur-3xl -z-10 scale-110"></div>
            {/* Additional floating glow elements */}
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-red-500/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </h1>

          {/* Search Input */}
          <div className={`w-full sm:w-[600px] md:w-[800px] lg:w-[1200px] xl:w-[750px] transition-all duration-300 ${
            isSignedIn && isMobileSidebarOpen ? 'px-4' : ''
          }`}>
            <form onSubmit={handleFirstMessage} className="relative">
              <div className="bg-white/5 border-t border-x border-gray-600/100 backdrop-blur-sm overflow-hidden rounded-t-2xl">
                <textarea
                  placeholder="Start build something from scratch..."
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

                  <div className="flex flex-col justify-center items-center w-full h-full mt-5">
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-1 h-px bg-zinc-500/50"></div>
                      <span className="px-4 text-zinc-400 text-sm font-medium">OR</span>
                      <div className="flex-1 h-px bg-zinc-500/50"></div>
                    </div>
                  <div className="flex w-full h-full justify-center items-center mt-5"> 

              
<GlowButton variant="red" size="md" onClick={() => router.push('/new')}>
  <Github className="w-5 h-5" />
  Import Existing Project From GitHub
</GlowButton>
  </div>
                  </div>

           
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 z-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"/>



      
    </div>
  );
}


