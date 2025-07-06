"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3 } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I'll help you build "${currentInput}". This is a simulated response. In a real implementation, this would connect to your AI service to generate a proper response with architecture suggestions, code examples, and implementation steps.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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

  // Chat mode layout
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Thin Navbar */}
      <nav className="h-12 bg-black flex items-center px-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Image
            src="/old.png"
            alt="DevilDev Logo"
            width={30}
            height={30}
            className="w-full h-full"
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Chat Panel - Bordered Container */}
        <div className="w-1/2 bg-gray-900/30 border border-gray-600/30 rounded-xl flex flex-col min-h-0">
        <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-600/30">
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
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-white/10 border border-gray-600/40 text-white' 
                    : 'text-white'
                }`}>
                  <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
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

        {/* Right Panel with Tabs - Bordered Container */}
        <div className="w-1/2 bg-gray-900/30 border border-gray-600/30 rounded-xl flex flex-col min-h-0">
          {/* Clean Tab Headers - Like in screenshot */}
          <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-600/30">
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
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            {activeTab === 'architecture' ? (
              <div className="text-gray-300">
                <h3 className="text-lg font-semibold mb-4">Architecture Overview</h3>
                <p className="text-sm">Architecture content will be displayed here based on the AI analysis.</p>
              </div>
            ) : (
              <div className="text-gray-300">
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
      `}</style>
    </div>
  );
};

export default DevPage;