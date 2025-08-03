"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Search, FileText, HelpCircle, Image as ImageIcon, Globe, Paperclip, Mic, BarChart3, Maximize, X, Menu, ChevronLeft, MessageCircle, Users, Phone, Info, Plus, Loader2, MessageSquare, Send } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startOrNot, firstBot } from '../../../../actions/agentsFlow';
import { generateArchitecture, generateArchitectureWithToolCalling } from '../../../../actions/architecture'; 
import { getChat, addMessageToChat, updateChatMessages, createChatWithId, ChatMessage as ChatMessageType, getUserChats } from '../../../../actions/chat';
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

interface UserChat {
  id: string;
  title: string | null;
  updatedAt: Date;
  createdAt: Date;
}

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
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
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
  
  // New sidebar state for dev page
  const [isDevSidebarHovered, setIsDevSidebarHovered] = useState(false);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  
  // Feedback dialog state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  // How to dialog state
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  
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
              localStorage.removeItem('isNewChat');
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

  // Function to handle new chat creation
  const handleNewChat = () => {
    router.push('/');
  };

  // Function to handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      // Here you would typically send the feedback to your backend
      console.log('Feedback submitted:', feedbackText);
      
      // For now, just show success and close dialog
      setFeedbackText('');
      setIsFeedbackOpen(false);
      
      // You could add a toast notification here
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  // Fetch chats when user is signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchUserChats();
    }
  }, [isSignedIn, isLoaded]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to generate architecture
  const genArchitecture = async (requirement: string, conversationHistory: any[] = []) => {
    
    setIsArchitectureLoading(true);
    setDocsGenerated(false);
    
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
      setIsArchitectureLoading(false);
      
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
        setIsLoading(false);
        if(parsedClassifier.canStart){
          await genArchitecture(initialMessage, currentMessages);
        }
        
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
      if(parsedClassifier.canStart){
        genArchitecture(currentInput, messages);
      }
      
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

  };

  const handleGenerateDocs = async () => {
    setIsGeneratingDocs(true);
    // setIsLoading(true);
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
      setIsGeneratingDocs(false);
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


  // Chat mode layout
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Enhanced Navbar */}
      <nav className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-6 flex-shrink-0 relative">
        {/* Left side - Burger menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Burger menu indicator - hide when sidebar is open */}
          <button 
              onClick={() => setIsDevSidebarHovered(true)}
              className={`p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200`}
              title="Open sidebar"
            > 
              <Menu 
                className={`h-6 w-6 text-gray-400 hover:text-white transition-colors`}
              />
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

        {/* Right side - How to, Feedback button and User avatar */}
        <div className="flex items-center space-x-3">
          {/* How to button */}
          <button
            onClick={() => setIsHowToOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="How to use DevilDev"
          >
            <HelpCircle className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              How to
            </span>
          </button>

          {/* Feedback button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Feedback
            </span>
          </button>

          {/* User Avatar */}
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

      {/* Hover trigger area - invisible but extends to far left */}
      {isSignedIn && (
        <div 
          className="fixed top-16 left-0 w-4 h-[calc(100vh-4rem)] z-30"
          onMouseEnter={() => setIsDevSidebarHovered(true)}
        />
      )}

      {/* Hover-expandable Sidebar for signed in users */}
      {isSignedIn && (
        <div 
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black/30 backdrop-blur-md border-r border-red-500/20 transition-all duration-300 ease-in-out z-20 group ${
            isDevSidebarHovered ? 'w-72' : 'w-0'
          } overflow-hidden`}
          onMouseLeave={() => setIsDevSidebarHovered(false)}
        >
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full pt-8 pb-3">
            {/* Top navigation items */}
            <div className="px-2 space-y-2">
              <button
                onClick={handleNewChat}
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item w-full"
                title="New Chat"
              >
                <Plus className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  New Chat
                </span>
              </button>
              <a
                href="/about"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="About"
              >
                <Info className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  About
                </span>
              </a>
              <a
                href="/devlogs"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Community"
              >
                <Users className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
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
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Contact
                </span>
              </a>
            </div>

            {/* Elegant divider */}
            <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>

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
              } max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-red-500/20`}>
                {chatsLoading ? (
                  <div className="flex items-center justify-center px-6 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400/60" />
                  </div>
                ) : userChats.length > 0 ? (
                  userChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => router.push(`/dev/${chat.id}`)} 
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-all duration-200 group/chat ${
                        chat.id === chatId 
                          ? 'text-white bg-red-500/20 border-red-500/40' 
                          : 'text-gray-300 hover:text-white hover:bg-black/30 hover:border-red-500/20 border-transparent'
                      }`}
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
                  isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
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
              <div className="flex justify-start items-center space-x-3 animate-pulse">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full "
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
            {isGeneratingDocs && (
              <div className="flex justify-start items-center space-x-3 animate-pulse">
              <Image
                src="/favicon.jpg"
                alt="Assistant"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full "
              />
              <div className="text-white/69 text-sm flex items-center">
                <span>generating docs </span>
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
            {isArchitectureLoading && (
                <div className="flex justify-start items-center space-x-3 animate-pulse">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full "
                />
                <div className="text-white/69 text-sm flex items-center">
                  <span>{architectureData ? "updating" : "generating"} architecture</span>
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
            { !isLoading && !isArchitectureLoading && !isGeneratingDocs && architectureData && (
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
                  disabled={isLoading || isArchitectureLoading}
                />
              </div>
              
              {/* Button section */}
              <div className="bg-white/5 border-x border-b border-gray-600/100 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
                <button 
                  type="submit" 
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={!inputMessage.trim() || isLoading || isArchitectureLoading}
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

      {/* How to Dialog */}
      {isHowToOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-blue-500/30 rounded-2xl p-8 w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <HelpCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">How to Use DevilDev</h3>
                </div>
                <button
                  onClick={() => setIsHowToOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 text-gray-300">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Start a Conversation</h4>
                      <p className="text-gray-300">Describe your project idea, features you want to build, or ask technical questions. Be as detailed as possible for better results.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">View Architecture</h4>
                      <p className="text-gray-300">DevilDev will generate a visual architecture diagram showing how your components connect and interact.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Generate Documentation</h4>
                      <p className="text-gray-300">Click "Generate Docs" to create comprehensive project documentation, including PRD, project structure, and implementation phases.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">4</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Continue Conversation</h4>
                      <p className="text-gray-300">Ask follow-up questions, request modifications, or dive deeper into specific technical aspects of your project.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-blue-300 mb-2">💡 Pro Tips</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Be specific about your tech stack preferences</li>
                    <li>• Mention any constraints or requirements upfront</li>
                    <li>• Use the fullscreen mode for better architecture viewing</li>
                    <li>• Access your previous chats from the sidebar</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setIsHowToOpen(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improved Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-red-500/30 rounded-2xl p-8 w-full max-w-lg mx-auto shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Send Feedback</h3>
                </div>
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="feedback" className="block text-base font-medium text-gray-300 mb-3">
                    Your feedback helps us improve DevilDev 🚀
                  </label>
                  <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your experience, report bugs, suggest features, or tell us what you love about DevilDev..."
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none min-h-[140px] max-h-[240px] transition-all duration-200"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">We read every piece of feedback</span>
                    <span className="text-xs text-gray-500">{feedbackText.length}/1000</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsFeedbackOpen(false)}
                    className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackText.trim()}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Feedback</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

