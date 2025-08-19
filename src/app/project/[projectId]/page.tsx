"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation";
import { Search, FileText, Globe, BarChart3, Maximize, X, Menu, MessageCircle, Users, Phone, Plus, Loader2, MessageSquare, Send, BrainCircuit, Code, Database, Server, Copy, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProject, saveProjectArchitecture, updateProjectComponentPositions, ProjectMessage, addMessageToProject, projectChatBot, generatePrompt, initialDocsGeneration, createProjectContextDocs, generateProjectPlan, generateNthPhase, updateProjectContextDocs, getProjectContextDocs } from "../../../../actions/project";
import { useUser } from '@clerk/nextjs';
import { generateArchitecture } from '../../../../actions/reverse-architecture';
import { Json } from 'langchain/tools';
import RevArchitecture from '@/components/core/revArchitecture';
import ProjectContextDocs from '@/components/core/ProjectContextDocs';

interface Project {
  name: string;
  framework: string;
  createdAt: Date;
  updatedAt: Date;
  ProjectArchitecture: any;
  userId: string;
  messages: ProjectMessage[];
}

const ProjectPage = () => {
    const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  // Counter for unique message IDs
  const messageIdCounterRef = useRef(0);
  
  // Helper function to generate unique message IDs
  const generateMessageId = () => {
    messageIdCounterRef.current += 1;
    return `${Date.now()}-${messageIdCounterRef.current}`;
  };
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'architecture' | 'docs'>('architecture');
  const [inputMessage, setInputMessage] = useState('');
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isArchitectureGenerating, setIsArchitectureGenerating] = useState(false);
  const [architectureData, setArchitectureData] = useState<any>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);
  const [isDocsGenerating, setIsDocsGenerating] = useState(false);
  const [selectedProjectDocsId, setSelectedProjectDocsId] = useState<string | undefined>(undefined);
  const [selectedDocsName, setSelectedDocsName] = useState<string | undefined>(undefined);
  const [projectPlan, setProjectPlan] = useState<string>("Not Generated");
  const [projectPhases, setProjectPhases] = useState<string[]>(["Not Generated 1", "Not Generated 2"]); 
  
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  // Fullscreen architecture state
  const [isArchitectureFullscreen, setIsArchitectureFullscreen] = useState(false);
  
  // Copy state for prompts
  const [copiedPrompts, setCopiedPrompts] = useState<Record<string, boolean>>({});

  const { isLoaded, isSignedIn, user } = useUser();

  // Auto-scroll ref for messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to store the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handler for component position changes
  const handlePositionsChange = (positions: Record<string, { x: number; y: number }>) => {
    setCustomPositions(positions);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounced save to database (only save after user stops dragging for 500ms)
    debounceTimerRef.current = setTimeout(async () => {
      if (projectId) {
        try {
          await updateProjectComponentPositions(projectId, positions);
        } catch (error) {
          console.error('Failed to save positions:', error);
        }
      }
    }, 500);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Copy prompt function
  const copyPrompt = async (messageId: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompts(prev => ({ ...prev, [messageId]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedPrompts(prev => ({ ...prev, [messageId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

    useEffect(() => {
      
      // Only run when Clerk is fully loaded
      if (!isLoaded)return;
      
      setIsLoading(true);

      const loadProject = async () => {
        if (!projectId || !isSignedIn) {
          setIsLoading(false);
          return;
        }
        
        try {
          const projectData = await getProject(projectId);
     
          if (projectData && !('error' in projectData)) { 
            setProject(projectData);
            
            // Load existing messages from the project
            if (projectData.messages && Array.isArray(projectData.messages)) {
              const loadedMessages = (projectData.messages as unknown as ProjectMessage[]).map((msg, index) => ({
                ...msg,
                id: msg.id || generateMessageId() // Ensure every message has an ID
              }));
              setMessages(loadedMessages);
            }
            
            setIsLoading(false);

            loadArchitecture(projectData);
          }
        } catch (error) {
        } finally { 
          setIsLoading(false);
        }
      };

      const loadArchitecture = async (theProjectData: any) => {
        if(theProjectData?.ProjectArchitecture && theProjectData.ProjectArchitecture.length > 0){

                  // Load existing architecture
                  const existingArchitecture = theProjectData.ProjectArchitecture[0];
                  const architectureData = { 
                      components: existingArchitecture.components,
                      connectionLabels: existingArchitecture.connectionLabels,
                      componentPositions: existingArchitecture.componentPositions,
                      architectureRationale: existingArchitecture.architectureRationale,
                      detailedAnalysis: existingArchitecture.detailedAnalysis
                  };
                  setArchitectureData(architectureData);
                  // Load custom positions from the database
                  setCustomPositions(existingArchitecture.componentPositions || {});
                  setIsArchitectureGenerating(false);
                  // HERE IMPLEMENT THE PROJECT CONTEXT DOCS
                  // alert("Project Context Docs Implement Here")
                  const projectContextDocs = await getProjectContextDocs(projectId);
                  
                  // Check if the result is an error
                  if ('error' in projectContextDocs) {
                    // alert("Error getting project context docs")
                    console.error('Error getting project context docs:', projectContextDocs.error);
                    // Set default values or handle the error appropriately
                    setProjectPlan("Not Generated");
                    setProjectPhases(["Not Generated 1", "Not Generated 2"]);
                  } else {
                    // alert("Project Context Docs Found")
                    // Success case - access the properties safely
                    setProjectPlan(projectContextDocs.plan || "Not Generated");
                    setProjectPhases(projectContextDocs.phases as string[] || ["Not Generated 1", "Not Generated 2"]);
                  }
                  // alert("ok")
              }else{
                setIsArchitectureGenerating(true);
                  const {architecture: architectureResult, detailedAnalysis: detailedAnalysis} = await generateArchitecture(projectId);
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
                  parsedArchitecture.detailedAnalysis = detailedAnalysis;
                  setArchitectureData(parsedArchitecture);
                  console.log(parsedArchitecture); 

                  const architectureRationaleParagraphs = parsedArchitecture.architectureRationale.split(/\n\s*\n/);
                  // Get first and last paragraphs
                  const firstParagraph = architectureRationaleParagraphs[0].trim();
                  const lastParagraph = architectureRationaleParagraphs[architectureRationaleParagraphs.length - 1].trim();

                  const initialMessage = firstParagraph + "\n\n" + lastParagraph;

                  
                  // Save the architecture to the database
                  if (parsedArchitecture && parsedArchitecture.components && parsedArchitecture.architectureRationale) {
                      const saveResult = await saveProjectArchitecture(
                          projectId,
                          parsedArchitecture.architectureRationale,
                          parsedArchitecture.components,
                          parsedArchitecture.connectionLabels || {},
                          parsedArchitecture.componentPositions || {},
                          initialMessage
                      ); 
                      
                      if (saveResult.error) {
                          console.error("Failed to save architecture:", saveResult.error);
                      } else {
                          console.log("Architecture saved successfully:", saveResult.architecture);
                          
                          // Add the initial message to local state
                          const assistantMessage: ProjectMessage = {
                              id: generateMessageId(),
                              type: 'assistant',
                              content: initialMessage,
                              timestamp: new Date().toISOString()
                          };
                          setMessages([assistantMessage]);
                      }
                  }
                  
                  // Initialize custom positions for newly generated architecture
                  setCustomPositions(parsedArchitecture.componentPositions || {});
                  
                  setIsArchitectureGenerating(false);
              }
          }

      loadProject();
      
        
  }, [projectId, isSignedIn, isLoaded]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    
    const userMessage: ProjectMessage = {
      id: generateMessageId(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to local state immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    const currentInput = inputMessage;
    setInputMessage('');
    setTextareaHeight('60px');
    setIsChatLoading(true);

    try {
      // Save user message to database
      await addMessageToProject(projectId, userMessage);

      // alert(currentInput.trim())
      
      // TODO: Add AI response handling here when implementing chat functionality
      // here
      const chatbotResponse = await projectChatBot(currentInput.trim() ,project.framework, messages, architectureData, project.detailedAnalysis);
      let cleanedResponse = chatbotResponse;
      if (typeof cleanedResponse === 'string') {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '') 
          .replace(/\s*```\s*$/, '')
          .trim();
      }
      
      const parsedResponse = typeof cleanedResponse === 'string' 
        ? JSON.parse(cleanedResponse) 
        : cleanedResponse; 

        console.log("This is reponse butch: ", parsedResponse);
 
        
      // For now, just add a simple response
      const assistantMessage: ProjectMessage = {
        id: generateMessageId(), 
        type: 'assistant',
        content: parsedResponse.response,
        timestamp: new Date().toISOString()
      };

      // Add assistant message to local state
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsChatLoading(false);

      // alert(parsedResponse.docs)
      // alert(parsedResponse.wannaStart)
 

      
      if(parsedResponse.prompt && parsedResponse.wannaStart && (parsedResponse.difficulty === "easy" || parsedResponse.difficulty === "medium")){
        alert("Starting to generate prompt")
        setIsPromptGenerating(true);
        //here
        const  prompt = await generatePrompt(inputMessage.trim(), project.framework, messages, project.detailedAnalysis);
        console.log("This is prompt: ", prompt);
        
        // Only update the assistant message if prompt is a string
        if (typeof prompt === 'string') {
          // Update the assistant message with the generated prompt
          const updatedAssistantMessage: ProjectMessage = {
            ...assistantMessage,
            prompt: prompt
          };
          
          // Update the message in local state
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessage.id ? updatedAssistantMessage : msg
            )
          );
          
          // Update the assistant message variable for database save
          Object.assign(assistantMessage, updatedAssistantMessage);
          setIsPromptGenerating(false);
        }
      }else if(parsedResponse.docs && parsedResponse.wannaStart){
        alert("Starting to generate docs")
        setIsDocsGenerating(true);  
         // Here Docs generation logic
         const initialDocsRes = await initialDocsGeneration(inputMessage.trim(), project.framework, messages, project.detailedAnalysis);
         console.log("This is initial docs response: ", initialDocsRes);
         const parsedInitialDocsRes = typeof initialDocsRes === 'string' 
          ? JSON.parse(initialDocsRes) 
          : initialDocsRes;
         console.log("This is parsed docs: ", parsedInitialDocsRes);
         
         try {
           // Create project context docs in database with BigChanges content
           const bigChangesContent = `# Development Agent Workflow\n\n## Primary Directive\nYou are a development agent implementing a project based on established documentation. Your goal is to build a cohesive, well-documented, and maintainable software product. **ALWAYS** consult documentation before taking any action and maintain strict consistency with project standards.\n\n[This is a truncated version of the BigChanges content for ${parsedInitialDocsRes.nameDocs}]`;
           
           const projectContextDocsResult = await createProjectContextDocs(
             projectId, 
             parsedInitialDocsRes.nameDocs,
             bigChangesContent,
             undefined, // human review 
             undefined, // plan
             undefined, // phases  
             parsedInitialDocsRes.phaseCount
           );
           
           if (projectContextDocsResult.success) {
             // Update the assistant message with projectDocsId
             const updatedAssistantMessage: ProjectMessage = {
               ...assistantMessage,
               projectDocsId: projectContextDocsResult.projectContextDocs.id,
               docsName: parsedInitialDocsRes.nameDocs
             };
             
             // Update the message in local state
             setMessages(prevMessages => 
               prevMessages.map(msg => 
                 msg.id === assistantMessage.id ? updatedAssistantMessage : msg
               )
             );
             
             // Update the assistant message variable for database save
             Object.assign(assistantMessage, updatedAssistantMessage);
           }

           if(!projectContextDocsResult.projectContextDocs){
            alert("no project context docs");
            console.error('Error creating project context docs:', projectContextDocsResult.error);
            return;
           }

           alert("Starting to generate plan")

           //Here generate plan  
           const plan = await generateProjectPlan(project.framework, parsedInitialDocsRes.phaseCount, project.detailedAnalysis, parsedInitialDocsRes.requirement);
           console.log("This is plan: ", plan); 
           alert("Plan generated")
           setProjectPlan(plan.toString()); 

           alert("Starting to generate phases")
           let projectPhases: string[] = [];
           
           for(let i = 0; i< parsedInitialDocsRes.phaseCount; i++){
            alert(i)
            const nthPhase = await generateNthPhase(JSON.stringify(plan), project.framework, project.detailedAnalysis, parsedInitialDocsRes.requirement, i.toString());
            console.log("This is nth phase: ", nthPhase);
            projectPhases.push(nthPhase.toString());
           }
           setProjectPhases(projectPhases);
           alert("Phases generated")
           setIsDocsGenerating(false);
           const updateDocsRes = await updateProjectContextDocs(projectContextDocsResult.projectContextDocs.id, projectPlan, projectPhases);
           alert("Yeahh")
           
         } catch (error) {
           console.error('Error creating project context docs:', error);
         }
         setIsDocsGenerating(false);
         
      }
      
      // Save assistant message to database
      await addMessageToProject(projectId, assistantMessage);
      
    } catch (error) {
      console.error('Error handling message:', error);
      
      // Add error message to local state
      const errorMessage: ProjectMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!project?.name) {
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
          {project.framework === "react" ? <Image src="/react.png" alt="Project" width={25} height={25} /> : <Image src="/nextjs.png" alt="Project" width={25} height={25} />}
            <span className="text-sm font-medium">{project.name}</span>
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


            {/* Display actual messages from database */}
            {messages.map((message, index) => (
              <div key={message.id || `fallback-${index}`} className={`flex flex-col ${message.type === 'user' ? 'items-start' : 'items-start'}`}>
                <div className="flex w-full">
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
                
                {/* Project Docs button - only show for assistant messages with projectDocsId */}
                {message.type === 'assistant' && message.projectDocsId && (
                  <div className="flex justify-start items-center space-x-3 ml-12 h-12  my-2 relative">
                    <button 
                      onClick={() => {
                        setSelectedProjectDocsId(message.projectDocsId);
                        setSelectedDocsName(message.docsName);
                        setActiveTab('docs');
                      }}
                      className="px-6 py-2 border rounded-lg font-bold cursor-pointer transition-colors duration-200 relative hover:bg-transparent border-white hover:text-white bg-white text-black"
                    >
                      <span>View Docs</span>
                    </button>
                  </div>
                )}
                
                {/* Prompt box - only show for assistant messages with prompt */}
                {message.type === 'assistant' && message.prompt && (
                  <div className="w-full mt-3 ">
                    <div className="border border-gray-600 rounded-lg bg-gray-900/30 relative">
                      {/* Copy button */}
                      <button
                        onClick={() => copyPrompt(message.id, message.prompt!)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200 z-10"
                        title="Copy prompt"
                      >
                        {copiedPrompts[message.id] ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Prompt content with scrollbar */}
                      <div className="p-3 pr-12 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono break-words">
                          {message.prompt}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
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

{isPromptGenerating && (
              <div className="flex justify-start items-center space-x-3 animate-pulse">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-white/69 text-sm flex items-center">
                  <span>generating prompt</span>
                  <span className="ml-1">...</span>
                </div>
              </div>
            )}

{isDocsGenerating && (
              <div className="flex justify-start items-center space-x-3 animate-pulse">
                <Image
                  src="/favicon.jpg"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-white/69 text-sm flex items-center">
                  <span>generating docs</span>
                  <span className="ml-1">...</span>
                </div>
              </div>
            )}
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
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
              {/* <button
              
              */}
              
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
            
            {/* Fullscreen button - only show for architecture tab */}
            {activeTab === 'architecture' && (
              <button
                onClick={() => setIsArchitectureFullscreen(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                title="Fullscreen Architecture View"
              >
                <Maximize className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            
            {/* Architecture Tab */}
            <div className={`h-full ${activeTab === 'architecture' ? 'block' : 'hidden'}`}>
              <RevArchitecture 
                architectureData={architectureData} 
                isFullscreen={false}
                customPositions={customPositions}
                onPositionsChange={handlePositionsChange}
              />
            </div>
            
            {/* Documentation Tab */}
            <div className={`h-full ${activeTab === 'docs' ? 'block' : 'hidden'}`}>
              <ProjectContextDocs 
                projectDocsId={selectedProjectDocsId}
                docsName={selectedDocsName}
                projectPlan={projectPlan}
                projectPhases={projectPhases}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Architecture Modal */}
      {isArchitectureFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Fullscreen Header */}
          <div className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-6 flex-shrink-0">
            {/* Left side - Project Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
                <div className="relative">
                  <Image
                    src="/favicon.jpg"
                    alt="DevilDev Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-lg">
                    {project.name}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-400 text-sm">Architecture</span>
                </div>
              </div>
            </div>

            {/* Right side - Close button */}
            <button
              onClick={() => setIsArchitectureFullscreen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              title="Exit Fullscreen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Fullscreen Architecture Content */}
          <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <RevArchitecture 
              architectureData={architectureData} 
              isFullscreen={true}
              customPositions={customPositions}
              onPositionsChange={handlePositionsChange}
            />
          </div>
        </div>
      )}

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