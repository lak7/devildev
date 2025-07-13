"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3, Maximize, X } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startOrNot, firstBot } from '../../../actions/agentsFlow';
import { generateArchitecture } from '../../../actions/architecture';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

const DevPage = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'phases'>('architecture');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [architectureData, setArchitectureData] = useState<any>(null);
  const [isArchitectureLoading, setIsArchitectureLoading] = useState(false);
  const [architectureGenerated, setArchitectureGenerated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // 30% default
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startLeftWidth, setStartLeftWidth] = useState(30);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Handle panel resizing
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const newLeftWidth = (newX / containerWidth) * 100;
        
        // Constrain between 20% and 80%
        const constrainedWidth = Math.min(80, Math.max(20, newLeftWidth));
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

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartLeftWidth(leftPanelWidth);
  };

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const generatedParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to generate architecture
  const genArchitecture = async (requirement: string, conversationHistory: any[] = []) => {
    if (architectureGenerated) return; // Don't regenerate if already done
    
    setIsArchitectureLoading(true);
    
    try {
      const architectureResult = await generateArchitecture(requirement, conversationHistory);
      
      // Parse the JSON result if it's a string
      const parsedArchitecture = typeof architectureResult === 'string' 
        ? JSON.parse(architectureResult) 
        : architectureResult;
      
      setArchitectureData(parsedArchitecture);
      // setArchitectureGenerated(true);
    } catch (error) {
      console.error('Error generating architecture:', error);
    } finally {
      setIsArchitectureLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message and switch to chat mode
    setMessages(prev => [...prev, userMessage]);
    setIsChatMode(true);
    setIsLoading(true);
    
    const currentInput = inputMessage;
    setInputMessage('');
    setTextareaHeight('60px');

    const isStart = await startOrNot(currentInput, messages);
    const isTrue = isStart.toLowerCase() === "true";
    // alert(isTrue);

    // Generate architecture on first message
    if (isTrue) {
      genArchitecture(currentInput, messages);
    }
    // alert(isStart.toLowerCase());
    // alert(isTrue);

    try {
      // Use firstBot function directly instead of API call
      const assistantResponse = await firstBot(currentInput, isTrue, messages);

      // Create assistant message with the response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calling firstBot:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

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

  // Initial centered layout
  if (!isChatMode) {
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

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 bottom-12">
          <div className="mb-0 transform hover:scale-105 transition-transform duration-300 flex justify-center">
            <Image
              src="/devildev-logo.png"
              alt="DevilDev Logo"
              width={400}
              height={120}
              className="w-auto h-24 md:h-32 lg:h-56 drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-light mb-12 text-center">
            From Idea to Architecture—Instinctively
          </h1>

          {/* Search Input */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-white/5 border-t border-x border-gray-600/100 backdrop-blur-sm overflow-hidden rounded-t-2xl">
                <textarea
                  placeholder="What you want to build?"
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
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

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
    );
  }

  // Fullscreen Architecture view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
        {/* Close button in top left */}
        <div className="absolute top-4 left-4 z-60">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/40 rounded-lg transition-colors group"
          >
            <X className="h-5 w-5 text-gray-300 group-hover:text-white" />
          </button>
        </div>

        {/* Fullscreen Architecture */}
        <div className="flex-1 p-8 pt-16 overflow-hidden">
          <div className="h-full">
            <Architecture 
              architectureData={architectureData} 
              isLoading={isArchitectureLoading}
              isFullscreen={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Chat mode layout
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Thin Navbar */}
      <nav className="h-12 bg-black flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Image
            src="/old.png"
            alt="DevilDev Logo"
            width={30}
            height={30}
            className="w-full h-full"
          />
        </div>
        <div className="flex items-center">
          <Avatar className="size-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </nav>

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 flex gap-0 p-4 min-h-0 relative">
        {/* Left Chat Panel - Resizable */}
        <div 
          className="bg-gray-900/30 border border-gray-600/30 rounded-l-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex items-center px-4 py-3 rounded-tl-xl border-b border-gray-600/30">
            <div className="flex space-x-1">
              <button
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 text-white bg-gray-700/50`}
              >
                Chat
              </button>
            </div>
          </div>
          
          {/* Chat Messages with separate scroll and custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-start'}`}>
                {message.type === 'assistant' && (
                  <div className="mr-3 flex-shrink-0">
                    <Image
                      src="/old.png"
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
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-2 py-1 ${
                  message.type === 'user' 
                    ? ' text-white' 
                    : ' text-white'
                }`}>
                  {message.type === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-red-400">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-red-300">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-red-200">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 text-gray-200">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 text-gray-200">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 text-gray-200">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          code: ({ children, className, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const inline = props.inline;
                            return !inline ? (
                              <pre className="bg-gray-900 rounded-lg p-3 mb-2 overflow-x-auto">
                                <code className={className}>{children}</code>
                              </pre>
                            ) : (
                              <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>
                            );
                          },
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-300">{children}</blockquote>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-gray-600/40 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-0 px-3 pb-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-white/5 border-t border-x border-gray-600/100 backdrop-blur-sm overflow-hidden rounded-t-2xl">
                <textarea
                  placeholder="Continue the conversation..."
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
                  <BarChart3 className="h-4 w-4" />
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
          {/* Invisible wider hit area for easier grabbing */}
          <div className="absolute inset-0 -left-2 -right-2 w-5"></div>
          
          {/* Visual indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Right Panel with Tabs - Resizable */}
        <div 
          className="bg-gray-900/30 border border-gray-600/30 rounded-r-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Clean Tab Headers - Like in screenshot */}
          <div className="flex items-center justify-between px-4 py-3 rounded-tr-xl border-b border-gray-600/30">
            <div className="flex space-x-1"> 
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
                onClick={() => setActiveTab('phases')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'phases'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Phases
              </button>
            </div>
            
            {/* Fullscreen button - only show for architecture tab */}
            {activeTab === 'architecture' && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                title="Fullscreen Architecture"
              >
                <Maximize className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'architecture' ? (
              <Architecture 
                architectureData={architectureData} 
                isLoading={isArchitectureLoading} 
              />
            ) : (
              <div className="p-6 text-gray-300">
                <h3 className="text-lg font-semibold mb-4">Development Phases</h3>
                <p className="text-sm">Phase breakdown and timeline will be displayed here.</p>
              </div>
            )}
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

export default DevPage;

