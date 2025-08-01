"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3, Maximize, X, Menu, ChevronLeft, MessageCircle, Users, Phone, Info } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startOrNot, firstBot } from '../../../../actions/agentsFlow';
import { generateArchitecture, generateArchitectureWithToolCalling } from '../../../../actions/architecture'; 
import { getChat, addMessageToChat, updateChatMessages, createChatWithId, ChatMessage as ChatMessageType } from '../../../../actions/chat';
import { 
  saveArchitecture, 
  getArchitecture, 
  updateComponentPositionsDebounced,
  ArchitectureData,
  ComponentPosition 
} from '../../../../actions/architecturePersistence';
import {
  saveContextualDocs,
  getContextualDocs,
  batchUpdateDocs,
  ContextualDocsData
} from '../../../../actions/contextualDocsPersistence';
import FileExplorer from '@/components/core/ContextDocs';
import Noise from '@/components/Noise/Noise';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

// Using ChatMessage from actions/chat.ts
// export interface ChatMessage { 
//   id: string;
//   type: 'user' | 'assistant';
//   content: string;
//   timestamp: Date;
//   isStreaming?: boolean;
// }

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

const DevPage = () => {
  const params = useParams();
  const chatId = params?.devId as string;
  
  const [inputMessage, setInputMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [currentStartOrNot, setCurrentStartOrNot] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'context'>('architecture');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [architectureData, setArchitectureData] = useState<ArchitectureData | null>(null);
  const [isArchitectureLoading, setIsArchitectureLoading] = useState(false);
  const [architectureGenerated, setArchitectureGenerated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  // Contextual docs state
  const [contextualDocs, setContextualDocs] = useState<ContextualDocsData>({});
  const [docsGenerated, setDocsGenerated] = useState(false);
  
  // Individual doc states for backward compatibility with existing components
  const [projectRules, setProjectRules] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [prd, setPrd] = useState<string>("");
  const [phaseCount, setPhaseCount] = useState<any>();
  const [phases, setPhase] = useState<string[]>([]);
  const [projectStructure, setProjectStructure] = useState<string>("");
  const [uiUX, setUiUX] = useState<string>("");
  
  // New streaming state
  const [streamingUpdates, setStreamingUpdates] = useState<Array<{fileName: string, content: string, isComplete: boolean}>>([]);
  const [isStreamingDocs, setIsStreamingDocs] = useState(false);
  
  // Component position persistence
  const [componentPositions, setComponentPositions] = useState<Record<string, ComponentPosition>>({});
  
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // 30% default
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startLeftWidth, setStartLeftWidth] = useState(30);
  
  // Sidebar state - no longer needed as it's hover-based
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

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

  // Handle component position changes with persistence
  const handlePositionChange = async (positions: Record<string, ComponentPosition>) => {
    setComponentPositions(positions);
    
    // Save to database with debouncing
    if (chatId && architectureGenerated) {
      await updateComponentPositionsDebounced(chatId, positions);
    }
  };

  // Helper function to sync individual doc states with contextualDocs
  const syncIndividualStates = (docs: ContextualDocsData) => {
    if (docs.projectRules) setProjectRules(docs.projectRules);
    if (docs.plan) setPlan(docs.plan);
    if (docs.prd) setPrd(docs.prd);
    if (docs.phases) setPhase(docs.phases);
    if (docs.phaseCount) setPhaseCount(docs.phaseCount);
    if (docs.projectStructure) setProjectStructure(docs.projectStructure);
    if (docs.uiUX) setUiUX(docs.uiUX);
  };

  // Helper function to save contextual docs
  const saveDocsData = async (docsData: ContextualDocsData) => {
    if (!chatId) return;
    
    try {
      const result = await saveContextualDocs({
        chatId,
        docsData,
      });
      
      if (result.success) {
        setContextualDocs(docsData);
        syncIndividualStates(docsData);
        setDocsGenerated(true);
      } else {
        console.error('Failed to save contextual docs:', result.error);
      }
    } catch (error) {
      console.error('Error saving contextual docs:', error);
    }
  };

  // Load chat data and architecture when component mounts
  useEffect(() => {
    const loadChatAndArchitecture = async () => {
      // alert("Step 0")
      if (!chatId || !isSignedIn) return;
      
      
      try {
        // Check if this is a new chat from localStorage
        const isNewChat = localStorage.getItem('isNewChat');
        if(isNewChat){
          setIsNewChat(true);
        }
        const newChatId = localStorage.getItem('newChatId');
        const firstMessage = localStorage.getItem('firstMessage');
        
        if (isNewChat && firstMessage) {
          // This is a new chat - create it and process the first message
          console.log("Creating new chat with localStorage data");
          // alert("Step 2")

          // Set up initial state
          const userMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: 'user',
            content: firstMessage,
            timestamp: new Date().toISOString()
          };
          
          setMessages([userMessage]);

          processInitialMessage(firstMessage, [userMessage]);
          
          const createResult = await createChatWithId(chatId, firstMessage);
            if (!createResult.success) {
              console.error("Failed to create chat:", createResult.error);
              localStorage.removeItem('newChatId');
              localStorage.removeItem('firstMessage');
              router.push('/');
              return;
            }
            
            // Clear localStorage
            localStorage.removeItem('newChatId');
            localStorage.removeItem('firstMessage');
            localStorage.removeItem('isNewChat');
            
            
            
            // Process the initial message
            
          
        } else {
          // This is an existing chat - load from database
          const chatResult = await getChat(chatId);
          if (chatResult.success && chatResult.chat) {
            const chatMessages = chatResult.chat.messages as unknown as ChatMessageType[];
            setMessages(chatMessages);
            setIsChatMode(true);
            
            // Load architecture data if it exists
            const archResult = await getArchitecture(chatId);
            if (archResult.success && archResult.architecture) {
              setArchitectureData(archResult.architecture);
              setComponentPositions(archResult.componentPositions || {});
              setArchitectureGenerated(true);
            }

            // Load contextual docs data if it exists
            const docsResult = await getContextualDocs(chatId);
            if (docsResult.success && docsResult.contextualDocs) {
              setContextualDocs(docsResult.contextualDocs);
              syncIndividualStates(docsResult.contextualDocs);
              setDocsGenerated(true);
            }
          } else {
            console.error("Failed to load chat:", chatResult.error);
            // Clear any stale localStorage data
            localStorage.removeItem('newChatId');
            localStorage.removeItem('firstMessage');
            router.push('/');
          }
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        // Clear any stale localStorage data
        localStorage.removeItem('newChatId');
        localStorage.removeItem('firstMessage');
        router.push('/');
      } finally {
        setIsLoadingChat(false);
      }
    };

    loadChatAndArchitecture();
  }, [chatId, isSignedIn, router]);

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
      const architectureResult = await generateArchitectureWithToolCalling(requirement, conversationHistory, architectureData);
      
      // Clean the result to remove markdown code blocks if present
      let cleanedResult = architectureResult;
      if (typeof architectureResult === 'string') {
        // Remove markdown code blocks (```json...``` or ```...```)
        cleanedResult = architectureResult
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
      }
      
      // Parse the JSON result
      const parsedArchitecture = typeof cleanedResult === 'string' 
        ? JSON.parse(cleanedResult) 
        : cleanedResult; 
      
      setArchitectureData(parsedArchitecture);
      setArchitectureGenerated(true);
      
      // Save architecture to database
      if (chatId && parsedArchitecture) {
        const saveResult = await saveArchitecture({
          chatId,
          architectureData: parsedArchitecture,
          requirement,
          componentPositions: componentPositions,
        });
        
        if (!saveResult.success) {
          console.error('Failed to save architecture:', saveResult.error);
        }
      }
    } catch (error) {
      console.error('Error generating architecture:', error);
    } finally {
      setIsArchitectureLoading(false);
    }
  };

  // Process the initial message when loading a chat
  const processInitialMessage = async (initialMessage: string, currentMessages: ChatMessageType[]) => {

    setIsLoading(true); 
    
    try {
      const isStart = await startOrNot(initialMessage, [], null);
      let cleanedIsStart = isStart;
      if (typeof isStart === 'string') {
        cleanedIsStart = isStart
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
      }
      
      const parsedClassifier = typeof cleanedIsStart === 'string' 
        ? JSON.parse(cleanedIsStart) 
        : cleanedIsStart; 

      console.log("parsedClassifier: ", parsedClassifier)


      const isParsedTrue = parsedClassifier.canStart;
      setCurrentStartOrNot(parsedClassifier.canStart);
       
        const response = await firstBot(initialMessage, false, [], null, parsedClassifier.reason);
        
        const assistantMessage: ChatMessageType = {
          id: Date.now().toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        };

        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);
        if(isParsedTrue){
          await genArchitecture(initialMessage, currentMessages);
        }
        setIsLoading(false);
        
        // Save to database
        await updateChatMessages(chatId, updatedMessages);
    } catch (error) {
      console.error("Error processing initial message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message and switch to chat mode
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setIsChatMode(true);
    setIsLoading(true);
    
    const currentInput = inputMessage;
    setInputMessage('');
    setTextareaHeight('60px');

    // Save user message to database immediately
    try {
      await addMessageToChat(chatId, userMessage);
    } catch (error) {
      console.error('Error saving user message:', error);
    }
 
    const isStart = await startOrNot(currentInput, messages, architectureData);
     let cleanedIsStart = isStart;
      if (typeof isStart === 'string') {
        // Remove markdown code blocks (```json...``` or ```...```)
        cleanedIsStart = isStart
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
      }
      
      // Parse the JSON result
      const parsedClassifier = typeof cleanedIsStart === 'string' 
        ? JSON.parse(cleanedIsStart) 
        : cleanedIsStart;

      const isParsedTrue = parsedClassifier.canStart;

    const isTrue = isParsedTrue;
    setCurrentStartOrNot(parsedClassifier.canStart);
    console.log("This is the classifier: ", parsedClassifier);

    try {
      // Use firstBot function directly instead of API call
      const assistantResponse = await firstBot(currentInput, isTrue, messages, architectureData, parsedClassifier.reason);

      // Create assistant message with the response
      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessagesWithUser, assistantMessage];
      setMessages(finalMessages);
      setIsLoading(false);
      
      // Save assistant message to database
      try {
        await addMessageToChat(chatId, assistantMessage);
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
      
    } catch (error) {
      console.error('Error calling firstBot:', error);
      
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessagesWithUser, errorMessage];
      setMessages(finalMessages);
      
      // Save error message to database
      try {
        await addMessageToChat(chatId, errorMessage);
      } catch (error) {
        console.error('Error saving error message:', error);
      }
      
      setIsLoading(false);
    }

     // Generate architecture on first message
     if (isTrue) {
      genArchitecture(currentInput, messages);
    }
  };

  const handleGenerateDocs = async () => {
    setIsLoading(true);
    setActiveTab('context');
    setIsStreamingDocs(true);
    setStreamingUpdates([]);

    try {
      const response = await fetch('/api/generate-docs-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          architectureData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          // Add new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete messages from buffer
          const messages = buffer.split('\n\n');
          
          // Keep the last incomplete message in buffer
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (message.trim()) {
              const lines = message.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ') && line.length > 6) {
                  const jsonStr = line.slice(6).trim();
                  
                  try {
                    if (jsonStr) {
                      // Log for debugging
                      if (jsonStr.length > 1000) {
                        console.log(`Processing large JSON (${jsonStr.length} chars):`, jsonStr.substring(0, 100) + '...');
                      }
                      
                      const data = JSON.parse(jsonStr);
                      
                      if (data.type === 'update') {
                        // Handle streaming update
                        setStreamingUpdates(prev => {
                          const existingIndex = prev.findIndex(update => update.fileName === data.fileName);
                          const newUpdate = { 
                            fileName: data.fileName, 
                            content: data.content, 
                            isComplete: data.isComplete 
                          };
                          
                          if (existingIndex >= 0) {
                            const updated = [...prev];
                            updated[existingIndex] = newUpdate;
                            return updated;
                          } else {
                            return [...prev, newUpdate];
                          }
                        });
                      } else if (data.type === 'complete') {
                        // Handle completion
                        const result = data.result;
                        setPhaseCount(result.phaseCount);
                        setPhase(result.phases);
                        setPrd(result.prd);
                        setPlan(result.plan);
                        setProjectStructure(result.projectStructure);
                        setUiUX(result.uiUX);
                        setProjectRules(result.projectRules);
                        
                        // Save all docs to database
                        const docsData: ContextualDocsData = {
                          plan: result.plan,
                          prd: result.prd,
                          projectStructure: result.projectStructure,
                          uiUX: result.uiUX,
                          projectRules: result.projectRules,
                          phases: result.phases,
                          phaseCount: result.phaseCount,
                          isPlanComplete: !!result.plan,
                          isPrdComplete: !!result.prd,
                          isProjectStructureComplete: !!result.projectStructure,
                          isUiUXComplete: !!result.uiUX,
                          isProjectRulesComplete: !!result.projectRules,
                          arePhasesComplete: !!result.phases?.length,
                        };
                        
                        await saveDocsData(docsData);
                      } else if (data.type === 'error') {
                        console.error('Streaming error:', data.error);
                        throw new Error(data.error);
                      }
                    }
                  } catch (parseError) {
                    console.error('Error parsing streaming data:', parseError);
                    console.error('Problematic line:', line);
                    console.error('JSON string length:', jsonStr?.length || 0);
                    console.error('JSON preview:', jsonStr?.substring(0, 200) + '...');
                  }
                }
              }
            }
          }
        }
        
        // Process any remaining buffered data
        if (buffer.trim()) { 
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line.length > 6) {
              const jsonStr = line.slice(6).trim();
              
              try {
                if (jsonStr) {
                  // Log for debugging
                  if (jsonStr.length > 1000) {
                    console.log(`Processing remaining buffer JSON (${jsonStr.length} chars):`, jsonStr.substring(0, 100) + '...');
                  }
                  
                  const data = JSON.parse(jsonStr);
                  
                  if (data.type === 'complete') {
                    const result = data.result;
                    setPhaseCount(result.phaseCount);
                    setPhase(result.phases);
                    setPrd(result.prd);
                    setPlan(result.plan);
                    setProjectStructure(result.projectStructure);
                    setUiUX(result.uiUX);
                    setProjectRules(result.projectRules);
                    
                    // Save all docs to database
                    const docsData: ContextualDocsData = {
                      plan: result.plan,
                      prd: result.prd,
                      projectStructure: result.projectStructure,
                      uiUX: result.uiUX,
                      projectRules: result.projectRules,
                      phases: result.phases,
                      phaseCount: result.phaseCount,
                      isPlanComplete: !!result.plan,
                      isPrdComplete: !!result.prd,
                      isProjectStructureComplete: !!result.projectStructure,
                      isUiUXComplete: !!result.uiUX,
                      isProjectRulesComplete: !!result.projectRules,
                      arePhasesComplete: !!result.phases?.length,
                    };
                    
                    await saveDocsData(docsData);
                  } else if (data.type === 'error') {
                    console.error('Streaming error:', data.error);
                    throw new Error(data.error);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing remaining buffer data:', parseError);
                console.error('Buffer line:', line);
                console.error('Buffer JSON string length:', jsonStr?.length || 0);
                console.error('Buffer JSON preview:', jsonStr?.substring(0, 200) + '...');
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error generating docs:', error);
    } finally {
      setIsLoading(false);
      setIsStreamingDocs(false);
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
              architectureData={architectureData || undefined} 
              isLoading={isArchitectureLoading}
              isFullscreen={true}
              customPositions={componentPositions}
              onPositionsChange={handlePositionChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while chat is loading
  if (isLoadingChat) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4"></div>
          <p className="text-gray-400">Loading chat...</p>
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
            src="/favicon.jpg"
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
      <div ref={containerRef} className="flex-1 flex gap-0 p-5 min-h-0 relative">
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
              <div className="flex justify-start items-center space-x-3">
                <video 
                  src="/thedevil.mov" 
                  autoPlay 
                  loop 
                  muted 
                  className="w-8 h-8 rounded-full"
                  style={{ filter: 'brightness(0.69) contrast(1.2)' }}
                />
                <div className="text-white/69 text-sm flex items-center">
                  <span>is thinking</span>
                  <span className="">
                    <span 
                      style={{
                        animation: 'typing 2s infinite',
                        animationName: 'typing'
                      }}
                    >.</span>
                    <span 
                      style={{
                        animation: 'typing 2s infinite 0.3s',
                        animationName: 'typing'
                      }}
                    >.</span>
                    <span 
                      style={{
                        animation: 'typing 2s infinite 0.6s',
                        animationName: 'typing'
                      }}
                    >.</span>
                  </span>

                </div>
              </div>
            )}
            {currentStartOrNot && !isLoading && !isArchitectureLoading && (
               <div className="flex h-12 ml-12">
               <button 
                 onClick={handleGenerateDocs} 
                 className={`px-6 py-2 border rounded-lg font-bold cursor-pointer transition-colors duration-200 ${
                   isStreamingDocs 
                     ? "bg-yellow-600 border-yellow-600 text-white cursor-not-allowed" 
                     : docsGenerated
                       ? "bg-green-600 border-green-600 text-white cursor-not-allowed"
                       : "hover:bg-transparent border-white hover:text-white bg-white text-black"
                 }`}
                 disabled={isStreamingDocs || docsGenerated}
               >
                 {isStreamingDocs ? "Generating Docs..." : docsGenerated ? "Docs Generated ✓" : "Generate Docs→"}
               </button>
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
          {/* Clean Tab Headers */}
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
                onClick={() => setActiveTab('context')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'context'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Contextual Docs
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
            <div className={`h-full ${activeTab === 'architecture' ? 'block' : 'hidden'}`}>
              <Architecture 
                architectureData={architectureData || undefined} 
                isLoading={isArchitectureLoading}
                customPositions={componentPositions}
                onPositionsChange={handlePositionChange}
              />
            </div>
            
            <div className={`h-full ${activeTab === 'context' ? 'block' : 'hidden'}`}>
              <FileExplorer 
                projectRules={projectRules} 
                plan={plan} 
                phaseCount={phaseCount} 
                phases={phases} 
                prd={prd} 
                projectStructure={projectStructure} 
                uiUX={uiUX}
                streamingUpdates={streamingUpdates}
                isGenerating={isStreamingDocs}
              /> 
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"/>

      {/* Custom Scrollbar Styles & Animations */}
      <style jsx global>{`
        @keyframes typing {
          0%, 20% { opacity: 0; }
          25%, 75% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        
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

