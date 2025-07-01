"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3 } from 'lucide-react';

const DevPage = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    // Handle form submission here
    console.log('Search:', inputMessage);
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center bottom-16 min-h-screen px-4">
        {/* Logo */}
        <div className="mb-0 transform hover:scale-105 transition-transform duration-300">
          <Image
            src="/devildev-logo.png"
            alt="DevilDev Logo"
            width={400}
            height={120}
            className="w-auto h-24 md:h-32 lg:h-56 drop-shadow-2xl"
            priority
          />
        </div>

        {/* Subtitle */}
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
               />
             </div>
             
             {/* Button section */}
             <div className="bg-white/5 border-x border-b border-gray-600/100 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
               <button 
                 type="submit" 
                 className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                 disabled={!inputMessage.trim()}
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
};

export default DevPage;