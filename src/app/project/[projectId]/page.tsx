"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation";
import { Search, FileText, Globe, BarChart3, Maximize, X, Menu, MessageCircle, Users, Phone, Plus, Loader2, MessageSquare, Send, BrainCircuit, Code, Database, Server, Copy, Check, FolderKanban, ChevronDown, ChevronRight, Folder, FolderOpen, File } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProject, saveProjectArchitecture, updateProjectComponentPositions, ProjectMessage, addMessageToProject, projectChatBot, generatePrompt, initialDocsGeneration, createProjectContextDocs, generateProjectPlan, generateNthPhase, updateProjectContextDocs, getProjectContextDocs, createProjectChat, getProjectChats, getProjectChat, addMessageToProjectChat } from "../../../../actions/project";
import { SignOutButton, useUser } from '@clerk/nextjs';
import { triggerReverseArchitectureGeneration, checkProjectArchitectureByGenerationId, checkPendingArchitectureUpdate, triggerPendingArchitectureRegeneration } from '../../../../actions/reverse-architecture';
import { Json } from 'langchain/tools';
import RevArchitecture from '@/components/core/revArchitecture';
import ProjectContextDocs from '@/components/core/ProjectContextDocs';
import { ProjectPageSkeleton } from '@/components/ui/project-skeleton';
import { generateWebSearchDocs, saveProjectSummarizedContext, saveProjectWebSearchDocs, summarizeProjectDocsContext } from '../../../../actions/projectDocs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { submitFeedback } from '../../../../actions/feedback';
import { maxChatCharactersLimitFree, maxChatCharactersLimitPro, maxFreeChats, maxNumberOfProjectChatsFree, maxNumberOfProjectChatsPro } from '../../../../Limits';
import useUserSubscription from '@/hooks/useSubscription';
import PricingDialog from '@/components/PricingDialog';

interface ProjectChat {
  id: bigint;
  title: string;
  projectId: string;
  messages: any[]; // JsonValue[] from database, cast to ProjectMessage[] when needed
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  name: string;
  framework: string;
  createdAt: Date;
  updatedAt: Date;
  ProjectArchitecture: any;
  userId: string;
  ProjectChat: any[]; // Raw data from database
}

interface ProjectArchitectureVersion {
  architecture: any;
  componentPositions: Record<string, { x: number; y: number }>;
  projectStructure?: any;
  metadata: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

const ProjectPage = () => {
    const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  // Get current search params for chat ID
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlChatId = searchParams.get('c');
  
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
  const [leftActiveTab, setLeftActiveTab] = useState<'chat' | 'structure'>('chat');
  const [repoTree, setRepoTree] = useState<any>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedComponentOwnership, setSelectedComponentOwnership] = useState<{
    primaryImplementation?: { directories: string[]; files: string[] };
    supportingRelated?: { directories: string[]; files: string[] };
    sharedDependencies?: { directories: string[]; files: string[] };
  } | null>(null);
  const [selectedComponentTitle, setSelectedComponentTitle] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [projectChats, setProjectChats] = useState<ProjectChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isArchitectureGenerating, setIsArchitectureGenerating] = useState(false);
  const [architectureData, setArchitectureData] = useState<any>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [allArchitectures, setAllArchitectures] = useState<ProjectArchitectureVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);

  // Pending architecture update state (for free users)
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
  const [pendingUpdateInfo, setPendingUpdateInfo] = useState<{
    timestamp: Date | null;
    commitMessage: string | null;
    remainingRegenerations: number;
    limitReached: boolean;
    latestCommitHash: string | null;
    lastGeneratedCommitHash: string | null;
  } | null>(null);
  const [isRegeneratingFromPending, setIsRegeneratingFromPending] = useState(false);
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);
  const [isDocsGenerating, setIsDocsGenerating] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedProjectDocsId, setSelectedProjectDocsId] = useState<string | undefined>(undefined);
  const [selectedDocsName, setSelectedDocsName] = useState<string | undefined>(undefined);
  const [projectPlan, setProjectPlan] = useState<string>("Not Generated");
  const [projectPhases, setProjectPhases] = useState<string[]>(["Not Generated 1", "Not Generated 2"]); 
  const [isCharacterLimitReached, setIsCharacterLimitReached] = useState(false);
  const [isPromptLimitReached, setIsPromptLimitReached] = useState(false);
  const [showMaxChatsDialog, setShowMaxChatsDialog] = useState(false);
  const [showCharacterLimitDialog, setShowCharacterLimitDialog] = useState(false);
  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  // Mobile-only: which panel is open fullscreen
  const [mobileActivePanel, setMobileActivePanel] = useState<'architecture' | 'docs' | null>(null);
  
  // Fullscreen architecture state
  const [isArchitectureFullscreen, setIsArchitectureFullscreen] = useState(false);
  
  // Copy state for prompts
  const [copiedPrompts, setCopiedPrompts] = useState<Record<string, boolean>>({});

  const { isLoaded, isSignedIn, user } = useUser();

  // Auto-scroll ref for messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to store the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

      // Feedback dialog state
      const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
      const [isThisFirstGeneration, setIsThisFirstGeneration] = useState(false);
      const [feedbackText, setFeedbackText] = useState('');
      const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
      const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
      const { userSubscription, isLoadingUserSubscription, isErrorUserSubscription } = useUserSubscription();
      const [MAX_CHATS, setMAX_CHATS] = useState(0);
      const [MAX_CHARACTERS, setMAX_CHARACTERS] = useState(0);
 
      // Function to handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);
    
    try {
      const result = await submitFeedback("project/" + projectId, feedbackText);
      
      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Thank you for your feedback! We appreciate your input.'
        });
        setFeedbackText(''); 
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setFeedbackMessage(null);
        }, 2000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'Failed to submit feedback. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Helper function to convert number to Roman numerals
  const toRomanNumeral = (num: number): string => {
    const romanNumerals: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  };

  // Toggle folder expansion in tree view
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "h-4 w-4 flex-shrink-0";

    switch (ext) {
      case 'ts':
      case 'tsx':
        return <span className={`${iconClass} text-blue-400`}>TS</span>;
      case 'js':
      case 'jsx':
        return <span className={`${iconClass} text-yellow-400`}>JS</span>;
      case 'json':
        return <span className={`${iconClass} text-yellow-600`}>{'{}'}</span>;
      case 'md':
        return <span className={`${iconClass} text-gray-400`}>M↓</span>;
      case 'css':
      case 'scss':
        return <span className={`${iconClass} text-pink-400`}>#</span>;
      case 'html':
        return <span className={`${iconClass} text-orange-400`}>{'<>'}</span>;
      case 'prisma':
        return <span className={`${iconClass} text-teal-400`}>◆</span>;
      case 'env':
        return <span className={`${iconClass} text-green-400`}>⚙</span>;
      case 'yml':
      case 'yaml':
        return <span className={`${iconClass} text-red-400`}>Y</span>;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: any, path: string = '', depth: number = 0): React.ReactNode => {
    if (!node) return null;

    const items: React.ReactNode[] = [];

    // Helper to get highlight styles
    const getHighlightStyles = (itemPath: string) => {
      const highlight = getPathHighlightColor(itemPath);
      switch (highlight) {
        case 'primary':
          return {
            bg: 'bg-green-500/20 border-l-2 border-green-500',
            text: 'text-green-300',
            icon: 'text-green-400'
          };
        case 'supporting':
          return {
            bg: 'bg-blue-500/20 border-l-2 border-blue-500',
            text: 'text-blue-300',
            icon: 'text-blue-400'
          };
        case 'shared':
          return {
            bg: 'bg-yellow-500/20 border-l-2 border-yellow-500',
            text: 'text-yellow-300',
            icon: 'text-yellow-400'
          };
        default:
          return { bg: '', text: '', icon: '' };
      }
    };

    // Render directories first
    if (node.d) {
      const sortedDirs = Object.keys(node.d).sort((a, b) => a.localeCompare(b));
      for (const dirName of sortedDirs) {
        const dirPath = path ? `${path}/${dirName}` : dirName;
        const isExpanded = expandedFolders.has(dirPath);
        const highlightStyles = getHighlightStyles(dirPath);
        const isHighlighted = !!highlightStyles.bg;

        items.push(
          <div key={dirPath}>
            <button
              onClick={() => toggleFolder(dirPath)}
              className={`flex items-center w-full py-1 px-2 rounded text-left group transition-colors ${
                isHighlighted ? highlightStyles.bg : 'hover:bg-gray-800/50'
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <ChevronRight
                className={`h-3 w-3 mr-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${
                  isHighlighted ? highlightStyles.icon : 'text-gray-500'
                }`}
              />
              {isExpanded ? (
                <FolderOpen className={`h-4 w-4 mr-2 flex-shrink-0 ${isHighlighted ? highlightStyles.icon : 'text-yellow-500'}`} />
              ) : (
                <Folder className={`h-4 w-4 mr-2 flex-shrink-0 ${isHighlighted ? highlightStyles.icon : 'text-yellow-600'}`} />
              )}
              <span className={`text-sm truncate ${
                isHighlighted ? highlightStyles.text : 'text-gray-300 group-hover:text-white'
              }`}>{dirName}</span>
            </button>
            {isExpanded && renderTreeNode(node.d[dirName], dirPath, depth + 1)}
          </div>
        );
      }
    }

    // Then render files
    if (node.f) {
      const sortedFiles = [...node.f].sort((a: string, b: string) => a.localeCompare(b));
      for (const fileName of sortedFiles) {
        const filePath = path ? `${path}/${fileName}` : fileName;
        const highlightStyles = getHighlightStyles(filePath);
        const isHighlighted = !!highlightStyles.bg;

        items.push(
          <div
            key={filePath}
            className={`flex items-center py-1 px-2 rounded cursor-default group transition-colors ${
              isHighlighted ? highlightStyles.bg : 'hover:bg-gray-800/50'
            }`}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
            title={filePath}
          >
            {getFileIcon(fileName)}
            <span className={`text-sm ml-2 truncate ${
              isHighlighted ? highlightStyles.text : 'text-gray-400 group-hover:text-gray-200'
            }`}>{fileName}</span>
          </div>
        );
      }
    }

    return <>{items}</>;
  };

  // Handle version change
  const handleVersionChange = (versionIndex: number) => {
    if (versionIndex >= 0 && versionIndex < allArchitectures.length) {
      const selectedVersion = allArchitectures[versionIndex];
      setSelectedVersionIndex(versionIndex);
      setArchitectureData(selectedVersion.architecture);
      setCustomPositions(selectedVersion.componentPositions || {});
      // Also update the project structure/repo tree for the selected version
      setRepoTree(selectedVersion.projectStructure || null);
      // Clear any selected component ownership since we're switching versions
      setSelectedComponentOwnership(null);
      setSelectedComponentTitle(null);
      setIsVersionDropdownOpen(false);
    }
  };

  // Handle architecture component selection for code ownership highlighting
  const handleArchitectureComponentSelect = (component: any, codeOwnership: any) => {
    if (component && codeOwnership) {
      setSelectedComponentOwnership(codeOwnership);
      setSelectedComponentTitle(component.title);

      // Auto-switch to Project Structure tab to show the highlighting
      setLeftActiveTab('structure');

      // Auto-expand folders that contain highlighted paths
      const foldersToExpand = new Set<string>();

      const addFoldersForPaths = (paths: string[] | undefined) => {
        if (!paths) return;
        paths.forEach(path => {
          const parts = path.split('/');
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            foldersToExpand.add(currentPath);
          }
        });
      };

      // Add folders for all ownership paths
      addFoldersForPaths(codeOwnership.primaryImplementation?.directories);
      addFoldersForPaths(codeOwnership.primaryImplementation?.files);
      addFoldersForPaths(codeOwnership.supportingRelated?.directories);
      addFoldersForPaths(codeOwnership.supportingRelated?.files);
      addFoldersForPaths(codeOwnership.sharedDependencies?.directories);
      addFoldersForPaths(codeOwnership.sharedDependencies?.files);

      setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]));
    } else {
      setSelectedComponentOwnership(null);
      setSelectedComponentTitle(null);
    }
  };

  // Get highlight color for a path based on code ownership
  const getPathHighlightColor = (path: string): 'primary' | 'supporting' | 'shared' | null => {
    if (!selectedComponentOwnership) return null;

    // Check primary implementation (green)
    if (selectedComponentOwnership.primaryImplementation) {
      const { directories, files } = selectedComponentOwnership.primaryImplementation;
      if (directories?.some(dir => path === dir || path.startsWith(dir + '/'))) return 'primary';
      if (files?.some(file => path === file)) return 'primary';
    }

    // Check supporting related (blue)
    if (selectedComponentOwnership.supportingRelated) {
      const { directories, files } = selectedComponentOwnership.supportingRelated;
      if (directories?.some(dir => path === dir || path.startsWith(dir + '/'))) return 'supporting';
      if (files?.some(file => path === file)) return 'supporting';
    }

    // Check shared dependencies (yellow)
    if (selectedComponentOwnership.sharedDependencies) {
      const { directories, files } = selectedComponentOwnership.sharedDependencies;
      if (directories?.some(dir => path === dir || path.startsWith(dir + '/'))) return 'shared';
      if (files?.some(file => path === file)) return 'shared';
    }

    return null;
  };

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

  // Function to poll for project architecture completion
  const pollForProjectArchitecture = async () => {
    const maxAttempts = 120; // Poll for up to 10 minutes total
    let attempts = 0;
    const initialPhaseDuration = 4 * 60 * 1000; // 4 minutes in milliseconds
    const initialPollInterval = 15 * 1000; // 15 seconds for first 4 minutes
    const finalPollInterval = 5 * 1000; // 5 seconds after 4 minutes
    const startTime = Date.now();

    const poll = async () => {
      try {
        attempts++;
        const elapsedTime = Date.now() - startTime;
        const isInitialPhase = elapsedTime < initialPhaseDuration;
        const currentInterval = isInitialPhase ? initialPollInterval : finalPollInterval;
         
        const result = await checkProjectArchitectureByGenerationId(projectId);
        
        if (result.success && result.exists && result.architecture) {
          
          // Reload the page to show the generated architecture
          window.location.reload();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.error("Polling timeout: Architecture not found after maximum attempts");
          setIsArchitectureGenerating(false);
          alert("Architecture generation took longer than expected. Please refresh the page.");
          return;
        }
        
        // Continue polling with appropriate interval
        setTimeout(poll, currentInterval);
        
      } catch (error) {
        console.error("Error polling for project architecture:", error);
        setIsArchitectureGenerating(false);
      }
    };

    // Start polling
    poll();
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMAX_CHATS(userSubscription ? maxNumberOfProjectChatsPro : maxNumberOfProjectChatsFree);
    setMAX_CHARACTERS(userSubscription ? maxChatCharactersLimitPro : maxChatCharactersLimitFree);
  }, [userSubscription]);

  // Check for pending architecture updates (for free users)
  useEffect(() => {
    const checkPending = async () => {
      if (!projectId || isArchitectureGenerating) return;

      const result = await checkPendingArchitectureUpdate(projectId);
      if (result.success && result.needsUpdate) {
        setHasPendingUpdate(true);
        setPendingUpdateInfo({
          timestamp: result.pendingTimestamp ? new Date(result.pendingTimestamp) : null,
          commitMessage: result.commitMessage || null,
          remainingRegenerations: result.remainingRegenerations ?? 0,
          limitReached: result.limitReached ?? false,
          latestCommitHash: result.latestCommitHash || null,
          lastGeneratedCommitHash: result.lastGeneratedCommitHash || null,
        });
      } else {
        setHasPendingUpdate(false);
        setPendingUpdateInfo(null);
      }
    };

    checkPending();
  }, [projectId, isArchitectureGenerating]);

  // Handle manual regeneration from pending update
  const handleRegenerateFromPending = async () => {
    if (isRegeneratingFromPending || isArchitectureGenerating) return;

    setIsRegeneratingFromPending(true);
    setIsArchitectureGenerating(true);

    try {
      const result = await triggerPendingArchitectureRegeneration(projectId);

      if (result.success) {
        setHasPendingUpdate(false);
        setPendingUpdateInfo(null);
        pollForProjectArchitecture();
      } else {
        alert(result.error || 'Failed to start regeneration');
        setIsArchitectureGenerating(false);
      }
    } catch (error) {
      console.error('Error triggering regeneration:', error);
      setIsArchitectureGenerating(false);
    } finally {
      setIsRegeneratingFromPending(false);
    }
  };

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
 
  // Helper function to calculate total characters in messages
  const calculateTotalCharacters = (messagesArray: ProjectMessage[]) => {
    if (!messagesArray || !Array.isArray(messagesArray)) {
      return 0;
    }
    return messagesArray.reduce((total, message) => {
      return total + ((message as any)?.content?.length || 0);
    }, 0);
  };

  // Handle chat switching
  const handleChatSwitch = (chatId: string) => {
    if (chatId === activeChatId) return;

    // Optimistic UI: switch immediately using local state
    setActiveChatId(chatId);
    const localChat = projectChats.find(c => c.id.toString() === chatId);
    const localMessages = (localChat?.messages as unknown as ProjectMessage[]) || [];
    const loadedLocalMessages = localMessages.map(msg => ({
      ...msg,
      id: (msg as any).id || generateMessageId()
    }));
    setMessages(loadedLocalMessages);

    // Update URL immediately
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('c', chatId);
    window.history.replaceState({}, '', newUrl.toString());

    // Refresh from server in background and reconcile if still on same chat
    (async () => {
      try {
        const chatResult = await getProjectChat(projectId, chatId);
        if (chatResult.success && chatResult.projectChat) {
          if (chatId === (new URL(window.location.href)).searchParams.get('c')) {
            const chatMessages = chatResult.projectChat.messages as unknown as ProjectMessage[];
            const loadedMessages = chatMessages.map(msg => ({
              ...msg,
              id: (msg as any).id || generateMessageId()
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Error refreshing chat:', error);
      }
    })();
  };

  // Handle creating new chat
  const handleCreateNewChat = async () => {

    if(isChatLoading || isPromptGenerating || isDocsGenerating || isArchitectureGenerating || messages.length === 0 || isLoadingUserSubscription) return;
    if (projectChats.length >= MAX_CHATS) {
      setShowMaxChatsDialog(true);
      return;
    }

    // Optimistic UI: add a temporary chat and switch immediately
    const tempId = `temp-${Date.now()}`;
    setIsCreatingChat(true);

    const tempChat: any = {
      id: tempId,
      title: 'New Chat',
      projectId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjectChats(prev => [tempChat as unknown as ProjectChat, ...prev]);
    setActiveChatId(tempId);
    setMessages([]);

    // Update URL immediately
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('c', tempId);
    window.history.replaceState({}, '', newUrl.toString());

    // Create on server in background and reconcile
    try {
      const createResult = await createProjectChat(projectId, 'New Chat');
      if (createResult.success) {
        const newChat = createResult.projectChat!;
        const realId = newChat.id.toString();
        const newChatFormatted = {
          ...newChat,
          id: newChat.id,
          messages: newChat.messages || []
        } as ProjectChat;

        setProjectChats(prev => {
          const withoutTemp = prev.filter(c => c.id.toString() !== tempId);
          return [newChatFormatted, ...withoutTemp];
        });

        // If user is still on temp chat, switch to real one transparently
        if ((new URL(window.location.href)).searchParams.get('c') === tempId) {
          setActiveChatId(realId);
          setMessages([]);
          const url = new URL(window.location.href);
          url.searchParams.set('c', realId);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        // On failure, remove temp chat
        setProjectChats(prev => prev.filter(c => c.id.toString() !== tempId));
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setProjectChats(prev => prev.filter(c => c.id.toString() !== tempId));
    } finally {
      setIsCreatingChat(false);
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
            loadArchitecture(projectData);
            
            // Load project chats
            if (projectData.ProjectChat && Array.isArray(projectData.ProjectChat)) {
              const chats = projectData.ProjectChat.map(chat => ({
                ...chat,
                id: chat.id,
                messages: chat.messages || [] // Ensure messages is always an array
              })) as ProjectChat[];
              
              // Sort chats by createdAt in descending order (latest first)
              const sortedChats = chats.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              setProjectChats(sortedChats);
              
              // Determine which chat to load
              let targetChatId: string | null = null;
              
              if (urlChatId) {
                // Check if the URL chat ID exists
                const chatExists = sortedChats.find(chat => chat.id.toString() === urlChatId);
                if (chatExists) {
                  targetChatId = urlChatId;
                }
              }
              // If no valid URL chat ID, use the latest chat or create one
              if (!targetChatId) {
                if (sortedChats.length > 0) {
                  targetChatId = sortedChats[0].id.toString(); // Latest chat (first in sorted array)
                } else {
                  // Create first chat if none exist
                  const createResult = await createProjectChat(projectId);
                  if (createResult.success) {
                    const newChat = createResult.projectChat!;
                    const newChatFormatted = {
                      ...newChat,
                      id: newChat.id,
                      messages: newChat.messages || []
                    } as ProjectChat;
                    setProjectChats([newChatFormatted]);
                    targetChatId = newChat.id.toString();
                  }
                }
              }
                              // Set active chat and load its messages
              if (targetChatId) {
                setActiveChatId(targetChatId);
                const activeChat = sortedChats.find(chat => chat.id.toString() === targetChatId) || 
                                  (await getProjectChat(projectId, targetChatId)).projectChat;
                if (activeChat && activeChat.messages && Array.isArray(activeChat.messages)) {
                  const loadedMessages = (activeChat.messages as unknown as ProjectMessage[]).map((msg, index) => ({
                    ...msg,
                    id: msg.id || generateMessageId() // Ensure every message has an ID
                  }));
                  setMessages(loadedMessages);
                }
                // Update URL if needed
                if (urlChatId !== targetChatId) {
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.set('c', targetChatId);
                  window.history.replaceState({}, '', newUrl.toString());
                }
              }
            } else {
              // No chats exist, create the first one
              const createResult = await createProjectChat(projectId);
              if (createResult.success) {
                const newChat = createResult.projectChat!;
                const newChatFormatted = {
                  ...newChat,
                  id: newChat.id,
                  messages: newChat.messages || []
                } as ProjectChat;
                setProjectChats([newChatFormatted]);
                setActiveChatId(newChat.id.toString());
                setMessages([]);
                
                // Update URL
                window.location.reload();
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('c', newChat.id.toString());
                window.history.replaceState({}, '', newUrl.toString());
              }
            }
            if(isThisFirstGeneration){
              window.location.reload();
            }
            setIsLoading(false);
            
          }
        } catch (error) {
          console.error('Error loading project:', error);
        } finally { 
          setIsLoading(false);
        }
      };

      const loadArchitecture = async (theProjectData: any) => {
        if(theProjectData?.ProjectArchitecture && theProjectData.ProjectArchitecture.length > 0){
                  // Process architectures already fetched by getProject
                  // They come ordered desc (latest first), so reverse for UI (oldest = Version I)
                  const architectures = theProjectData.ProjectArchitecture.slice().reverse().map((arch: any) => ({
                    architecture: {
                      components: arch.components,
                      connectionLabels: arch.connectionLabels,
                      componentPositions: arch.componentPositions,
                      architectureRationale: arch.architectureRationale,
                      detailedAnalysis: arch.detailedAnalysis,
                    },
                    componentPositions: arch.componentPositions || {},
                    projectStructure: arch.projectStructure || null,
                    metadata: {
                      id: arch.id,
                      createdAt: arch.createdAt,
                      updatedAt: arch.updatedAt,
                    },
                  }));

                  setAllArchitectures(architectures);

                  // Set the latest architecture as default (last in array after reverse)
                  const latestIndex = architectures.length - 1;
                  setSelectedVersionIndex(latestIndex);
                  setArchitectureData(architectures[latestIndex].architecture);
                  setCustomPositions(architectures[latestIndex].componentPositions || {});
                  // Set repo tree from latest architecture
                  if (architectures[latestIndex].projectStructure) {
                    setRepoTree(architectures[latestIndex].projectStructure);
                  }
                  setIsArchitectureGenerating(false);
            
              }else{
                setIsArchitectureGenerating(true);
                setIsThisFirstGeneration(true);
                
                // Trigger Inngest background job for architecture generation
                if (user?.id) {
                  const result = await triggerReverseArchitectureGeneration({
                    projectId,
                    activeChatId: activeChatId,
                    userId: user.id,
                  });

                  if (result.success) {
                    // Start polling for the architecture
                    pollForProjectArchitecture();
                  } else {
                    console.error('Failed to trigger architecture generation:', result.error);
                    setIsArchitectureGenerating(false);
                    alert("Failed to start architecture generation. Please refresh and try again.");
                  }
                } else {
                  console.error('User ID not available');
                  setIsArchitectureGenerating(false);
                  alert("User authentication error. Please sign in again.");
                }
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

  // Monitor character limit
  useEffect(() => {
    const totalCharacters = calculateTotalCharacters(messages);
    const existingPromptCount = messages.filter(m => m.type === 'assistant' && (m as any).prompt).length;
    setIsCharacterLimitReached(totalCharacters >= MAX_CHARACTERS);
    setIsPromptLimitReached(existingPromptCount >= 3);
  }, [messages]);


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
    if (!inputMessage.trim() || isChatLoading || isCreatingChat || !activeChatId) return;
    if (isCharacterLimitReached || isPromptLimitReached) {
      setShowCharacterLimitDialog(true);
      return;
    } 

    

    
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
      const saveResult = await addMessageToProjectChat(projectId, activeChatId, userMessage);
      
      // Update chat title in local state if this is the first user message
      if (saveResult.success && messages.length === 0) {
        const title = currentInput.length > 20 
          ? currentInput.substring(0, 20) + '...' 
          : currentInput;
        
        setProjectChats(prevChats => 
          prevChats.map(chat => 
            chat.id.toString() === activeChatId 
              ? { ...chat, title: title }
              : chat
          )
        );
      } 

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

      if(parsedResponse.prompt && parsedResponse.wannaStart && (parsedResponse.difficulty === "easy" || parsedResponse.difficulty === "medium")){
        // Count existing prompts already generated in this chat
        setIsPromptGenerating(true); 
          
          const  prompt = await generatePrompt(inputMessage.trim(), project.framework, messages, project.detailedAnalysis);
 
          
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
        setIsDocsGenerating(true);   
         // Here Docs generation logic 
         const projectSummarizedContext = await summarizeProjectDocsContext(inputMessage.trim(), project.framework, messages, project.detailedAnalysis);
         const parsedprojectSummarizedContext = typeof projectSummarizedContext === 'string' 
          ? JSON.parse(projectSummarizedContext) 
          : projectSummarizedContext;

         try {
           // Create project context docs in database with BigChanges content
           const bigChangesContent = `# Development Agent Workflow\n\n## Primary Directive\nYou are a development agent implementing a project based on established documentation. Your goal is to build a cohesive, well-documented, and maintainable software product. **ALWAYS** consult documentation before taking any action and maintain strict consistency with project standards.\n\n[This is a truncated version of the BigChanges content for ${parsedprojectSummarizedContext.nameDocs}]`;
              
           const projectContextDocsResult = await createProjectContextDocs(
             activeChatId,  
             parsedprojectSummarizedContext.nameDocs,
             parsedprojectSummarizedContext.exactRequirement,
             bigChangesContent,
             undefined, // human review 
             undefined, // plan
             undefined, // phases  
             parsedprojectSummarizedContext.phaseCount
           );
           
           if (projectContextDocsResult.success) {
             // Update the assistant message with projectDocsId
             const updatedAssistantMessage: ProjectMessage = {
               ...assistantMessage,
               projectDocsId: projectContextDocsResult.projectContextDocs.id,
               docsName: parsedprojectSummarizedContext.nameDocs
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
            console.error('Error creating project context docs:', projectContextDocsResult.error);
            return;
           }

 
           //Here generate plan  
           const plan = await generateProjectPlan(project.framework, parsedprojectSummarizedContext.phaseCount, project.detailedAnalysis, parsedprojectSummarizedContext.exactRequirement);

           setProjectPlan(plan.toString()); 

           let projectPhases: string[] = [];
           
           for(let i = 0; i< parsedprojectSummarizedContext.phaseCount; i++){
            const nthPhase = await generateNthPhase(JSON.stringify(plan), project.framework, parsedprojectSummarizedContext.exactRequirement, String(i+1));

            projectPhases.push(nthPhase.toString());
           }
           setProjectPhases(projectPhases);
           setIsDocsGenerating(false);
           const updateDocsRes = await updateProjectContextDocs(projectContextDocsResult.projectContextDocs.id, projectPlan, projectPhases);
           
         } catch (error) {
           console.error('Error creating project context docs:', error);
         }
         setIsDocsGenerating(false);
         
      }
      
      // Save assistant message to database
      await addMessageToProjectChat(projectId, activeChatId, assistantMessage);
      
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
              <p className="text-sm text-zinc-400 mb-4">DevilDev is analyzing your requirements and crafting the perfect architecture</p>
              
              <div className="bg-zinc-900/30 border border-zinc-700/50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-zinc-300">Please Note: It may take up to 5-7 minutes</span>
                </div>
                <p className="text-xs text-zinc-400">You can close this tab, generation will continue in the background</p>
              </div>
            </div>
          </div>
        </div>
      )
  }

  if (isLoading) {
    return <ProjectPageSkeleton />;
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

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Enhanced Navbar */}
      <nav className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-6 flex-shrink-0 relative">
        {/* Left side - Burger menu and Logo */}
        <div className="flex z-20 justify-center items-center space-x-4">
          <button 
            onClick={() => setIsSidebarHovered(!isSidebarHovered)}
            className={`p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200`}
            title="Open sidebar"
          > 
            <Menu className={`h-6 w-6 text-gray-400 hover:text-white transition-colors`} />
          </button>
        
          <button
                onClick={() => router.push('/')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                title="Go to Home"
              >
                <Image
                src="/text01.png"
                alt="DevilDev Logo"
                width={15000}
                height={4000}
                className="h-full w-32 "
                priority
              />
          </button>
        </div> 

        {/* Center - Project Info */}
        <div className="flex z-10 absolute w-full justify-center items-center">
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
          {project.framework === "react" ? <Image src="/react.png" alt="Project" width={25} height={25} /> : <Image src="/nextjs.png" alt="Project" width={25} height={25} />}
            <span className="text-sm font-medium">{project.name}</span>
          </div>
        </div>
        </div>

        {/* Right side - Actions and User avatar */}
        <div className="flex z-20 items-center space-x-3">
        <button
            onClick={() => window.open('/connect-mcp', '_blank')}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white/69 hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Connect MCP"
          >
            <BrainCircuit className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Connect MCP
            </span>
          </button>
          {/* Feedback button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white/69 hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Feedback
            </span>
          </button>
         

          <div className="flex items-center">
          <Popover>
           <PopoverTrigger asChild>
             <button className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 cursor-pointer focus:ring-gray-500/50">
               <Avatar className="size-9 ring-2 ring-gray-600/30 hover:ring-gray-500/50 transition-all duration-200">
                 <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                 <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                   {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                 </AvatarFallback>
               </Avatar>
             </button>
           </PopoverTrigger>
           <PopoverContent align="end" className="w-64 p-3 mt-2 bg-black border border-gray-700 text-white">
             <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
               <Avatar className="size-10">
                 <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                 <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                   {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                 </AvatarFallback>
               </Avatar>
               <div className="min-w-0">
                 <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
                 <p className="text-xs text-gray-400 truncate">{user?.emailAddresses?.[0]?.emailAddress || ""}</p>
               </div>
             </div>
             <div className="pt-3">
               <a href="/settings" className="block w-full mb-2">
                 <span className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-200 text-white rounded-md hover:bg-zinc-700 transition-colors inline-block text-center">
                   Settings
                 </span>
               </a>
               <SignOutButton>
                 <button className="w-full px-3 py-2 text-sm bg-white text-black rounded-md hover:bg-gray-200 transition-colors">
                   Sign out
                 </button>
               </SignOutButton>
             </div>
           </PopoverContent>
         </Popover>
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
                onClick={handleCreateNewChat}
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item w-full"
                title="New Chat"
                disabled={isChatLoading || isPromptGenerating || isDocsGenerating || isArchitectureGenerating}
              >
                <Plus className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  New Chat
                </span>
              </button>
              <a
                href="/project"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="All Projects"
              >
                <FolderKanban className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  All Projects
                </span>
              </a>
            </div>

            {/* Project Chats Section */}
            <div className="px-2 mt-6 flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all duration-300 ${
                  isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}>
                  Project Chats
                </span>
                


              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-96 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                {projectChats.map((chat) => (
                  <button
                    key={chat.id.toString()}
                    onClick={() => handleChatSwitch(chat.id.toString())}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-left w-full transition-all duration-200 group/chat ${
                      activeChatId === chat.id.toString()
                        ? 'bg-red-500/20 text-white border border-red-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent'
                    }`}
                    title={chat.title}
                    disabled={isChatLoading || isPromptGenerating || isDocsGenerating || isArchitectureGenerating}
                  >
                    <MessageCircle className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                      activeChatId === chat.id.toString() ? 'text-red-400' : 'text-gray-400 group-hover/chat:text-red-400'
                    } group-hover/chat:scale-105`} />
                    <span className={`text-sm truncate transition-all duration-300 ${
                      isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}>
                      {chat.title}
                    </span>
                  </button>
                ))}
              </div>
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
      {isMobile ? (
        <div className="flex-1 p-4 min-h-0 relative pb-4 h-full">
          {/* Mobile: Chat takes ~75% height and full width */}
          <div className="bg-black border border-gray-800 rounded-xl flex flex-col overflow-hidden h-full" style={{ height: '85vh' }}>
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
                    <div className="flex justify-start items-center space-x-3 ml-12 h-12 my-2 relative">
                      <button 
                        onClick={() => {
                          setSelectedProjectDocsId(message.projectDocsId);
                          setSelectedDocsName(message.docsName);
                          setMobileActivePanel('docs');
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
                    className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[60px] max-h-[180px]"
                    rows={2}
                    style={{ height: textareaHeight }}
                    maxLength={5000}
                    disabled={isChatLoading || isCreatingChat}
                  />
                </div>
                <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
                  <button 
                    type="submit" 
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={!inputMessage.trim() || isChatLoading || isCreatingChat}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Mobile bottom bar for Architecture and Pacts */}
          <div className="fixed bottom-4 left-4 right-4 z-30 flex gap-3">
            <button
              onClick={() => setMobileActivePanel('architecture')}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-600 bg-black/60 text-white hover:bg-gray-900"
            >
              Architecture
            </button>
            <button
              onClick={() => setMobileActivePanel('docs')}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-600 bg-black/60 text-white hover:bg-gray-900"
            >
              Pacts
            </button>
          </div>

          {/* Mobile fullscreen overlay for selected panel */}
          {mobileActivePanel && (
            <div className="fixed inset-0 z-40 bg-black">
              <div className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-4">
                <div className="text-white font-semibold text-base">
                  {mobileActivePanel === 'architecture' ? 'Architecture' : 'Pacts'}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Version Dropdown for mobile */}
                  {mobileActivePanel === 'architecture' && allArchitectures.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-gray-700/50"
                        title="Select Architecture Version"
                      >
                        <span className="font-medium">V{toRomanNumeral(selectedVersionIndex + 1)}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {isVersionDropdownOpen && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setIsVersionDropdownOpen(false)}
                          />
                          
                          {/* Dropdown content */}
                          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                            <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                              {allArchitectures.map((arch, index) => (
                                <button
                                  key={arch.metadata.id}
                                  onClick={() => handleVersionChange(index)}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                    index === selectedVersionIndex
                                      ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>Version {toRomanNumeral(index + 1)}</span>
                                    {index === allArchitectures.length - 1 && (
                                      <span className="text-xs text-gray-400">Latest</span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setMobileActivePanel(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="h-[calc(100vh-4rem)] overflow-hidden">
                {mobileActivePanel === 'architecture' ? (
                  <RevArchitecture
                    key={`mobile-arch-${selectedVersionIndex}`}
                    architectureData={architectureData}
                    isFullscreen={true}
                    customPositions={customPositions}
                    onPositionsChange={handlePositionsChange}
                    onComponentSelect={handleArchitectureComponentSelect}
                  />
                ) : (
                  <ProjectContextDocs
                    key={activeChatId || 'no-chat-mobile'}
                    projectId={projectId}
                    projectChatId={activeChatId}
                    projectDocsId={selectedProjectDocsId}
                    docsName={selectedDocsName}
                    projectPlan={projectPlan}
                    projectPhases={projectPhases}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
      <div ref={containerRef} className="flex-1 flex gap-1 p-4 min-h-0 relative pb-0 md:pb-4 h-full">
        {/* Left Chat Panel - Resizable */}
        <div
          className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-800">
            <div className="flex space-x-1">
              <button
                onClick={() => setLeftActiveTab('chat')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  leftActiveTab === 'chat'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Project Chat
              </button>
              <button
                onClick={() => setLeftActiveTab('structure')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  leftActiveTab === 'structure'
                    ? 'text-white bg-gray-700/50'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Project Structure
              </button>
            </div>
          </div>

          {/* Project Structure Tab */}
          <div className={`flex-1 overflow-hidden min-h-0 flex flex-col ${leftActiveTab === 'structure' ? 'flex' : 'hidden'}`}>
            {/* Selected Component Header & Legend */}
            {selectedComponentOwnership && (
              <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Code ownership for:</span>
                  <button
                    onClick={() => {
                      setSelectedComponentOwnership(null);
                      setSelectedComponentTitle(null);
                    }}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-sm font-medium text-white truncate mb-2">{selectedComponentTitle}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-400">Primary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-blue-400">Supporting</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-yellow-400">Shared</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
              {repoTree ? (
                <div className="font-mono text-xs">
                  {/* Root project name */}
                  <div className="flex items-center py-1 px-2 mb-1">
                    <FolderOpen className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-white">{project?.name || 'Project'}</span>
                  </div>
                  <div className="border-l border-gray-700/50 ml-3">
                    {renderTreeNode(repoTree)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Folder className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">Project structure not available</p>
                  <p className="text-xs mt-1 text-gray-600">Structure is generated with architecture</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages Tab */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 ${leftActiveTab === 'chat' ? 'block' : 'hidden'}`}>


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

          {/* Input Area - Only show for chat tab */}
          {leftActiveTab === 'chat' && (
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
                    disabled={isChatLoading || isCreatingChat || isCharacterLimitReached || isPromptLimitReached}
                  />
                </div>

                {/* Button section */}
                <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
                  <button
                    type="submit"
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={!inputMessage.trim() || isChatLoading || isCreatingChat || isCharacterLimitReached || isPromptLimitReached}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
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
                Pacts
              </button>
            </div>
            
            {/* Version dropdown and Fullscreen button - only show for architecture tab */}
            {activeTab === 'architecture' && (
              <div className="flex items-center space-x-2">
                {/* Version Dropdown */}
                {allArchitectures.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-gray-700/50"
                      title="Select Architecture Version"
                    >
                      <span className="font-medium">Version {toRomanNumeral(selectedVersionIndex + 1)}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isVersionDropdownOpen && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setIsVersionDropdownOpen(false)}
                        />
                        
                        {/* Dropdown content */}
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                          <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                            {allArchitectures.map((arch, index) => (
                              <button
                                key={arch.metadata.id}
                                onClick={() => handleVersionChange(index)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  index === selectedVersionIndex
                                    ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>Version {toRomanNumeral(index + 1)}</span>
                                  {index === allArchitectures.length - 1 && (
                                    <span className="text-xs text-gray-400">Latest</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Fullscreen button */}
                <button
                  onClick={() => setIsArchitectureFullscreen(true)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                  title="Fullscreen Architecture View"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden min-h-0">

            {/* Architecture Tab */}
            <div className={`h-full flex flex-col ${activeTab === 'architecture' ? 'flex' : 'hidden'}`}>
              {/* Pending Update Banner - Only for free users with pending updates */}
              {hasPendingUpdate && !isArchitectureGenerating && (
                <div className={`border rounded-lg p-3 mx-3 mt-3 flex-shrink-0 ${
                  pendingUpdateInfo?.limitReached
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${
                        pendingUpdateInfo?.limitReached ? 'text-red-200' : 'text-amber-200'
                      }`}>
                        {pendingUpdateInfo?.limitReached
                          ? 'Regeneration Limit Reached'
                          : 'Architecture Update Available'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {pendingUpdateInfo?.limitReached ? (
                          'Upgrade to Pro for unlimited regenerations'
                        ) : (
                          <>
                            <span className="font-mono">
                              {pendingUpdateInfo?.lastGeneratedCommitHash?.slice(0, 7) || 'initial'}
                            </span>
                            <span className="mx-1">→</span>
                            <span className="font-mono text-amber-300">
                              {pendingUpdateInfo?.latestCommitHash?.slice(0, 7)}
                            </span>
                            <span className="ml-2 text-gray-500">
                              ({pendingUpdateInfo?.remainingRegenerations} left)
                            </span>
                          </>
                        )}
                      </p>
                      {!pendingUpdateInfo?.limitReached && pendingUpdateInfo?.commitMessage && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          &quot;{pendingUpdateInfo.commitMessage.slice(0, 50)}{pendingUpdateInfo.commitMessage.length > 50 ? '...' : ''}&quot;
                        </p>
                      )}
                    </div>
                    {pendingUpdateInfo?.limitReached ? (
                      <Button
                        onClick={() => router.push('/pricing')}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
                      >
                        Upgrade
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRegenerateFromPending}
                        disabled={isRegeneratingFromPending}
                        className="bg-amber-500 hover:bg-amber-600 text-black text-sm px-3 py-1"
                      >
                        {isRegeneratingFromPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex-1 min-h-0">
              <RevArchitecture
                key={`desktop-arch-${selectedVersionIndex}`}
                architectureData={architectureData}
                isFullscreen={false}
                customPositions={customPositions}
                onPositionsChange={handlePositionsChange}
                onComponentSelect={handleArchitectureComponentSelect}
              />
              </div>
            </div>

            {/* Pacts Tab */}
            <div className={`h-full ${activeTab === 'docs' ? 'block' : 'hidden'}`}>
              <ProjectContextDocs 
                key={activeChatId || 'no-chat'}
                projectId={projectId}
                projectChatId={activeChatId}
                projectDocsId={selectedProjectDocsId}
                docsName={selectedDocsName}
                projectPlan={projectPlan}
                projectPhases={projectPhases}
              />
            </div>
          </div>
        </div>
      </div>
      )}

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

            {/* Right side - Version dropdown and Close button */}
            <div className="flex items-center space-x-3">
              {/* Version Dropdown in fullscreen */}
              {allArchitectures.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-all duration-200 border border-gray-600/40"
                    title="Select Architecture Version"
                  >
                    <span className="font-medium">Version {toRomanNumeral(selectedVersionIndex + 1)}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isVersionDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsVersionDropdownOpen(false)}
                      />
                      
                      {/* Dropdown content */}
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                        <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                          {allArchitectures.map((arch, index) => (
                            <button
                              key={arch.metadata.id}
                              onClick={() => handleVersionChange(index)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                index === selectedVersionIndex
                                  ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Version {toRomanNumeral(index + 1)}</span>
                                {index === allArchitectures.length - 1 && (
                                  <span className="text-xs text-gray-400">Latest</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Close button */}
              <button
                onClick={() => setIsArchitectureFullscreen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                title="Exit Fullscreen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Architecture Content */}
          <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <RevArchitecture
              key={`fullscreen-arch-${selectedVersionIndex}`}
              architectureData={architectureData}
              isFullscreen={true}
              customPositions={customPositions}
              onPositionsChange={handlePositionsChange}
              onComponentSelect={handleArchitectureComponentSelect}
            />
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Send Feedback</h3>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience, report bugs, or suggest features..."
                className="w-full bg-black border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none h-32"
                maxLength={1000}
                disabled={isSubmittingFeedback}
              />
              
              {/* Success/Error Message */}
              {feedbackMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-green-900/50 border border-green-600/50 text-green-300' 
                    : 'bg-red-900/50 border border-red-600/50 text-red-300'
                }`}>
                  {feedbackMessage.text}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setFeedbackMessage(null);
                    setFeedbackText('');
                  }}
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmittingFeedback && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{isSubmittingFeedback ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
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
      {/* Max Chats Pricing Dialog */}
      <PricingDialog 
        open={showMaxChatsDialog} 
        onOpenChange={setShowMaxChatsDialog}
        description={`You've reached the maximum limit of ${MAX_CHATS} chats for this project. Upgrade to Pro to create more chats and unlock advanced features.`}
      />

      {/* Character Limit Pricing Dialog */}
      <PricingDialog 
        open={showCharacterLimitDialog} 
        onOpenChange={setShowCharacterLimitDialog}
        description="You've reached the maximum token limit for this chat. Upgrade to Pro to unlock extended token limits and continue your conversation."
      />
    </div>
  );
};

export default ProjectPage;