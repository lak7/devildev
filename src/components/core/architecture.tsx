"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Monitor, Server, Database, Shield, Move, RotateCcw, Activity, ArrowRight,
  Globe, Cpu, Cloud, Lock, Users, Code, Search, Mail, Bell, Settings,
  FileText, Image, Music, Video, Download, Upload, Smartphone, Tablet,
  Laptop, HardDrive, Wifi, Bluetooth, Headphones, Camera,
  Speaker, Battery, Zap, BarChart, PieChart, TrendingUp, TrendingDown,
  DollarSign, CreditCard, ShoppingCart, Package, Truck, MapPin, Calendar,
  Clock, Timer, Play, Pause, SkipBack, SkipForward, Volume,
  VolumeX, Repeat, Shuffle, Heart, Star, Bookmark, Flag, Tag, Filter,
  Grid, List, Eye, EyeOff, Edit, Trash, Plus, Minus, X, Check,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  ArrowLeft, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight,
  RefreshCw, Maximize, Minimize, Copy, Scissors, Clipboard, Link,
  ExternalLink, Home, User, MessageSquare, MessageCircle, Send, Phone,
  Mic, MicOff, VideoOff, Volume2, MoreHorizontal, MoreVertical,
  ZoomIn, ZoomOut, Hand, MousePointer,
  Cross
} from "lucide-react"

interface Position {
  x: number
  y: number
}

interface ViewportTransform {
  x: number
  y: number
  scale: number
}

interface DataFlowItem {
  type: "sends" | "receives"
  items: string[]
  color: string
}

interface ComponentData {
  id: string
  title: string
  icon: any
  color: string
  borderColor: string
  technologies: Record<string, string>
  connections: string[]
  position: Position
  dataFlow: {
    sends: string[]
    receives: string[]
  }
}

interface ArchitectureProps {
  architectureData?: {
    components: ComponentData[]
    connectionLabels: Record<string, string>
  }
  isLoading?: boolean
  isFullscreen?: boolean
}

// Icon mapping for dynamic icon resolution
const iconMap: Record<string, any> = {
  Monitor, Server, Database, Shield, Move, RotateCcw, Activity, ArrowRight,
  Globe, Cpu, Cloud, Lock, Users, Code, Search, Mail, Bell, Settings,
  FileText, Image, Music, Video, Download, Upload, Smartphone, Tablet,
  Laptop, HardDrive, Wifi, Bluetooth, Headphones, Camera,
  Speaker, Battery, Zap, BarChart, PieChart, TrendingUp, TrendingDown,
  DollarSign, CreditCard, ShoppingCart, Package, Truck, MapPin, Calendar,
  Clock, Timer, Play, Pause, SkipBack, SkipForward, Volume,
  VolumeX, Repeat, Shuffle, Heart, Star, Bookmark, Flag, Tag, Filter,
  Grid, List, Eye, EyeOff, Edit, Trash, Plus, Minus, X, Check,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  ArrowLeft, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight,
  RefreshCw, Maximize, Minimize, Copy, Scissors, Clipboard, Link,
  ExternalLink, Home, User, MessageSquare, MessageCircle, Send, Phone,
  Mic, MicOff, VideoOff, Volume2, MoreHorizontal, MoreVertical,
  ZoomIn, ZoomOut, Hand, MousePointer,
  // Add aliases for common variations
  Microphone: Mic,
  Sort: Filter // Using Filter as Sort alias since Sort icon doesn't exist in lucide-react
}

// Helper function to get icon component from string
const getIconComponent = (iconName: string | any) => {
  if (typeof iconName === 'string') {
    // Handle case-insensitive icon names
    const normalizedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1).toLowerCase();
    return iconMap[normalizedIconName] || iconMap[iconName] || Monitor; // fallback to Monitor icon
  }
  if (typeof iconName === 'function' || (iconName && typeof iconName === 'object')) {
    return iconName; // assume it's already a component
  }
  return Monitor; // safe fallback
}

// Better positioned components for graph layout
const initialComponents: ComponentData[] = [
  {
    id: "frontend",
    title: "Frontend",
    icon: Monitor,
    color: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-500/30",
    technologies: {
      framework: "Next.js 15",
      language: "TypeScript",
      styling: "Tailwind CSS",
    },
    connections: ["backend"],
    position: { x: 100, y: 100 },
    dataFlow: {
      sends: ["User Requests", "Form Data", "Auth Tokens", "UI Events"],
      receives: ["API Responses", "User Data", "Auth Status", "Real-time Updates"],
    },
  },
  {
    id: "backend",
    title: "Backend",
    icon: Server,
    color: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/30",
    technologies: {
      runtime: "Node.js",
      framework: "Next.js API",
      language: "TypeScript",
    },
    connections: ["database", "authentication"],
    position: { x: 500, y: 100 },
    dataFlow: {
      sends: ["API Responses", "Database Queries", "Auth Requests", "Processed Data"],
      receives: ["HTTP Requests", "Database Results", "Auth Tokens", "User Input"],
    },
  },
  {
    id: "database",
    title: "Database",
    icon: Database,
    color: "from-purple-500 to-violet-500",
    borderColor: "border-purple-500/30",
    technologies: {
      primary: "PostgreSQL",
      cache: "Redis",
      orm: "Prisma",
    },
    connections: [],
    position: { x: 800, y: 100 },
    dataFlow: {
      sends: ["Query Results", "User Records", "Session Data", "Cached Data"],
      receives: ["SQL Queries", "Data Writes", "Cache Requests", "Transactions"],
    },
  },
  {
    id: "authentication",
    title: "Authentication",
    icon: Shield,
    color: "from-red-500 to-pink-500",
    borderColor: "border-red-500/30",
    technologies: {
      provider: "NextAuth.js",
      tokens: "JWT",
      oauth: "OAuth 2.0",
    },
    connections: ["frontend"],
    position: { x: 300, y: 350 },
    dataFlow: {
      sends: ["Auth Tokens", "User Sessions", "Login Status", "Permissions"],
      receives: ["Login Requests", "Token Validation", "User Credentials", "Logout Events"],
    },
  },
]

export default function Architecture({ architectureData, isLoading = false, isFullscreen = false }: ArchitectureProps) {
  const [components, setComponents] = useState<ComponentData[]>(() => {
    // Process icons when initializing state
    const initialData = architectureData?.components || initialComponents;
    return initialData.map(comp => ({
      ...comp,
      icon: getIconComponent(comp.icon)
    }));
  })
  const [connectionLabels, setConnectionLabels] = useState<Record<string, string>>(
    architectureData?.connectionLabels || {
      "frontend-backend": "HTTP/API",
      "backend-database": "SQL/ORM",
      "backend-authentication": "Session",
      "authentication-frontend": "Auth Flow",
    }
  )
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [showDataFlow, setShowDataFlow] = useState(true)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [animationKey, setAnimationKey] = useState(0)
  
  // Canvas transform state
  const [transform, setTransform] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Component dimensions
  const COMPONENT_WIDTH = 280
  const COMPONENT_HEIGHT = 210
  const MIN_SCALE = 0.1
  const MAX_SCALE = 3

  // Update components when architectureData changes
  useEffect(() => {
    if (architectureData?.components) {
      // Process icons to convert string names to components
      const processedComponents = architectureData.components.map(comp => ({
        ...comp,
        icon: getIconComponent(comp.icon)
      }))
      setComponents(processedComponents)
    }
    if (architectureData?.connectionLabels) {
      setConnectionLabels(architectureData.connectionLabels)
    }
  }, [architectureData])

  // Trigger animation restart when selection changes
  useEffect(() => {
    if (selectedComponent) {
      setAnimationKey((prev) => prev + 1)
    }
  }, [selectedComponent])

  // Keyboard event handlers for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        setIsPanning(false)
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpacePressed])

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: screenX, y: screenY }
    
    return {
      x: (screenX - rect.left - transform.x) / transform.scale,
      y: (screenY - rect.top - transform.y) / transform.scale
    }
  }, [transform])

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * transform.scale + transform.x,
      y: canvasY * transform.scale + transform.y
    }
  }, [transform])

  // Zoom functions
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, MAX_SCALE)
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, MIN_SCALE)
    }))
  }, [])

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const fitToView = useCallback(() => {
    if (!containerRef.current || components.length === 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const padding = 50

    // Calculate bounding box of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    components.forEach(comp => {
      minX = Math.min(minX, comp.position.x)
      minY = Math.min(minY, comp.position.y)
      maxX = Math.max(maxX, comp.position.x + COMPONENT_WIDTH)
      maxY = Math.max(maxY, comp.position.y + COMPONENT_HEIGHT)
    })

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const scaleX = (rect.width - padding * 2) / contentWidth
    const scaleY = (rect.height - padding * 2) / contentHeight
    const scale = Math.min(scaleX, scaleY, MAX_SCALE)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const viewCenterX = rect.width / 2
    const viewCenterY = rect.height / 2

    setTransform({
      scale,
      x: viewCenterX - centerX * scale,
      y: viewCenterY - centerY * scale
    })
  }, [components])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale * scaleFactor))
    
    if (newScale !== transform.scale) {
      const scaleRatio = newScale / transform.scale
      setTransform(prev => ({
        scale: newScale,
        x: mouseX - (mouseX - prev.x) * scaleRatio,
        y: mouseY - (mouseY - prev.y) * scaleRatio
      }))
    }
  }, [transform.scale])

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas itself, not on components
    if (e.target === e.currentTarget || e.target === canvasRef.current) {
      setSelectedComponent(null)
    }
  }, [])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSpacePressed) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing'
      }
    }
  }, [isSpacePressed, transform])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && isSpacePressed) {
      e.preventDefault()
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }))
    }
  }, [isPanning, isSpacePressed, panStart])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    if (isSpacePressed && containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }, [isSpacePressed])

  const handleComponentClick = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.stopPropagation()
      if (!isDragging && !isPanning) {
        setSelectedComponent((prev) => (prev === componentId ? null : componentId))
      }
    },
    [isDragging, isPanning],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      if (isSpacePressed) return // Don't drag components when space is pressed
      
      e.preventDefault()
      e.stopPropagation()

      const component = components.find((c) => c.id === componentId)
      if (!component) return

      const canvasPos = screenToCanvas(e.clientX, e.clientY)

      setIsDragging(componentId)
      setDragOffset({
        x: canvasPos.x - component.position.x,
        y: canvasPos.y - component.position.y,
      })
    },
    [components, screenToCanvas, isSpacePressed],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      e.preventDefault()

      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      const newX = Math.max(0, canvasPos.x - dragOffset.x)
      const newY = Math.max(0, canvasPos.y - dragOffset.y)

      setComponents((prev) =>
        prev.map((comp) => (comp.id === isDragging ? { ...comp, position: { x: newX, y: newY } } : comp)),
      )
    },
    [isDragging, dragOffset, screenToCanvas],
  )

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false })
      document.addEventListener("mouseup", handleMouseUp, { passive: false })
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const resetPositions = () => {
    setComponents(initialComponents)
    setSelectedComponent(null)
  }

  // Calculate connection points on component edges with orthogonal routing
  const getConnectionPoints = (fromId: string, toId: string) => {
    const fromComp = components.find((c) => c.id === fromId)
    const toComp = components.find((c) => c.id === toId)
    if (!fromComp || !toComp) return null

    const fromRect = {
      left: fromComp.position.x,
      right: fromComp.position.x + COMPONENT_WIDTH,
      top: fromComp.position.y,
      bottom: fromComp.position.y + COMPONENT_HEIGHT,
      centerX: fromComp.position.x + COMPONENT_WIDTH / 2,
      centerY: fromComp.position.y + COMPONENT_HEIGHT / 2,
    }

    const toRect = {
      left: toComp.position.x,
      right: toComp.position.x + COMPONENT_WIDTH,
      top: toComp.position.y,
      bottom: toComp.position.y + COMPONENT_HEIGHT,
      centerX: toComp.position.x + COMPONENT_WIDTH / 2,
      centerY: toComp.position.y + COMPONENT_HEIGHT / 2,
    }

    // Calculate the direction vector
    const dx = toRect.centerX - fromRect.centerX
    const dy = toRect.centerY - fromRect.centerY

    let fromPoint: Position
    let toPoint: Position
    let waypoints: Position[] = []

    // Determine connection type and create orthogonal path
    if (Math.abs(dx) > Math.abs(dy)) {
      // Primarily horizontal connection
      if (dx > 0) {
        // Left to right
        fromPoint = { x: fromRect.right, y: fromRect.centerY }
        toPoint = { x: toRect.left, y: toRect.centerY }
        
        // Add waypoint if components are not horizontally aligned
        if (Math.abs(dy) > 20) {
          const midX = fromRect.right + (toRect.left - fromRect.right) / 2
          waypoints = [
            { x: midX, y: fromRect.centerY },
            { x: midX, y: toRect.centerY }
          ]
        }
      } else {
        // Right to left
        fromPoint = { x: fromRect.left, y: fromRect.centerY }
        toPoint = { x: toRect.right, y: toRect.centerY }
        
        if (Math.abs(dy) > 20) {
          const midX = fromRect.left + (toRect.right - fromRect.left) / 2
          waypoints = [
            { x: midX, y: fromRect.centerY },
            { x: midX, y: toRect.centerY }
          ]
        }
      }
    } else {
      // Primarily vertical connection
      if (dy > 0) {
        // Top to bottom
        fromPoint = { x: fromRect.centerX, y: fromRect.bottom }
        toPoint = { x: toRect.centerX, y: toRect.top }
        
        // Add waypoint if components are not vertically aligned
        if (Math.abs(dx) > 20) {
          const midY = fromRect.bottom + (toRect.top - fromRect.bottom) / 2
          waypoints = [
            { x: fromRect.centerX, y: midY },
            { x: toRect.centerX, y: midY }
          ]
        }
      } else {
        // Bottom to top
        fromPoint = { x: fromRect.centerX, y: fromRect.top }
        toPoint = { x: toRect.centerX, y: toRect.bottom }
        
        if (Math.abs(dx) > 20) {
          const midY = fromRect.top + (toRect.bottom - fromRect.top) / 2
          waypoints = [
            { x: fromRect.centerX, y: midY },
            { x: toRect.centerX, y: midY }
          ]
        }
      }
    }

    return { fromPoint, toPoint, waypoints }
  }

  // Generate SVG path for orthogonal connections
  const generateOrthogonalPath = (fromPoint: Position, toPoint: Position, waypoints: Position[]) => {
    if (waypoints.length === 0) {
      // Direct line
      return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`
    } else {
      // Orthogonal path with waypoints
      let path = `M ${fromPoint.x} ${fromPoint.y}`
      waypoints.forEach(point => {
        path += ` L ${point.x} ${point.y}`
      })
      path += ` L ${toPoint.x} ${toPoint.y}`
      return path
    }
  }

  const getConnectionKey = (from: string, to: string) => {
    return [from, to].sort().join("-")
  }

  const isConnectionActive = (fromId: string, toId: string) => {
    if (!selectedComponent) return false
    return selectedComponent === fromId || selectedComponent === toId
  }

  const getConnectionDirection = (fromId: string, toId: string) => {
    if (!selectedComponent) return null

    const selectedComp = components.find((c) => c.id === selectedComponent)
    if (!selectedComp) return null

    // Check if this is an outgoing connection (selected component sends data)
    if (selectedComponent === fromId && selectedComp.connections.includes(toId)) {
      return "outgoing"
    }

    // Check if this is an incoming connection (selected component receives data)
    if (selectedComponent === toId && selectedComp.connections.includes(fromId)) {
      return "incoming"
    }

    return null
  }

  const isComponentHighlighted = (componentId: string) => {
    if (!selectedComponent) return false
    if (selectedComponent === componentId) return true

    const selectedComp = components.find((c) => c.id === selectedComponent)
    return selectedComp?.connections.includes(componentId) || false
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-full bg-black text-white p-4 overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
    <div className="min-h-full bg-black text-white overflow-hidden relative">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 flex items-center gap-2">
          <Button
            onClick={zoomOut}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="px-2 text-xs text-gray-400 min-w-[50px] text-center">
            {Math.round(transform.scale * 100)}%
          </div>
          
          <Button
            onClick={zoomIn}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-700 mx-1" />
          
          <Button
            onClick={fitToView}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Fit
          </Button>
          
          <Button
            onClick={resetView}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Canvas Instructions */}
      <div className={`absolute top-4 right-4 z-50 ${showInstructions ? 'block' : 'hidden'}`}>
  <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 relative">
    <button onClick={() => setShowInstructions(false)} className="absolute -top-2 -right-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full p-1 transition-colors">
      <Cross className="w-3 h-3 text-red-400 rotate-45 hover:text-red-500" />
    </button>
    <div className="text-xs text-gray-400 space-y-1">
      <div className="flex items-center gap-2">
        <Hand className="w-3 h-3" />
        <span>Space + Drag to pan</span>
      </div>
      <div className="flex items-center gap-2">
        <MousePointer className="w-3 h-3" />
        <span>Scroll to zoom</span>
      </div>
    </div>
  </div>
</div>

      {/* Status Panel */}
      {selectedComponent && (
        <div className="absolute bottom-4 left-4 z-50">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-cyan-300">
                {components.find(c => c.id === selectedComponent)?.title} Selected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Canvas */}
      <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden select-none"
          style={{ 
            height: isFullscreen ? "100vh" : "calc(100vh - 170px)",
            cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default'
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
                    {/* Canvas Content with Transform */}
          <div
            ref={canvasRef}
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${40 / transform.scale}px ${40 / transform.scale}px`,
              }}
            />

          {/* Connection Lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              {/* Standard Arrow */}
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                className="fill-gray-500"
              >
                <polygon points="0 0, 10 3.5, 0 7" />
              </marker>

              {/* Animated Outgoing Arrow (Cyan) */}
              <marker
                id="arrowhead-outgoing"
                markerWidth="12"
                markerHeight="9"
                refX="11"
                refY="4.5"
                orient="auto"
                className="fill-cyan-400"
              >
                <polygon points="0 0, 12 4.5, 0 9" />
              </marker>

              {/* Animated Incoming Arrow (Green) */}
              <marker
                id="arrowhead-incoming"
                markerWidth="12"
                markerHeight="9"
                refX="11"
                refY="4.5"
                orient="auto"
                className="fill-emerald-400"
              >
                <polygon points="0 0, 12 4.5, 0 9" />
              </marker>

              {/* Glow Filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {components.map((component) =>
              component.connections.map((targetId) => {
                const connectionPoints = getConnectionPoints(component.id, targetId)
                if (!connectionPoints) return null

                const { fromPoint, toPoint, waypoints } = connectionPoints
                const connectionKey = getConnectionKey(component.id, targetId)
                const isActive = isConnectionActive(component.id, targetId)
                const direction = getConnectionDirection(component.id, targetId)

                let strokeColor = "#6b7280"
                let strokeWidth = "2"
                let markerEnd = "url(#arrowhead)"
                let filter = ""
                let dashArray = "none"

                if (isActive && direction) {
                  strokeWidth = "3"
                  filter = "url(#glow)"

                  if (direction === "outgoing") {
                    strokeColor = "#06b6d4" // cyan
                    markerEnd = "url(#arrowhead-outgoing)"
                    dashArray = "8,4"
                  } else if (direction === "incoming") {
                    strokeColor = "#10b981" // emerald
                    markerEnd = "url(#arrowhead-incoming)"
                    dashArray = "8,4"
                  }
                }

                // Calculate midpoint for label
                const midX = (fromPoint.x + toPoint.x) / 2
                const midY = (fromPoint.y + toPoint.y) / 2

                return (
                                      <g key={`${component.id}-${targetId}-${animationKey}`}>
                      {/* Main connection path */}
                      <path
                        d={generateOrthogonalPath(fromPoint, toPoint, waypoints)}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-all duration-300 ${filter}`}
                        markerEnd={markerEnd}
                        style={{
                          animation: isActive && direction ? "dash-flow 2s linear infinite" : "none",
                        }}
                      />

                      {/* Connection dots */}
                      <circle
                        cx={fromPoint.x}
                        cy={fromPoint.y}
                        r="3"
                        fill={isActive ? strokeColor : "#4b5563"}
                        className="transition-all duration-300"
                      />
                      
                      {/* Corner dots for waypoints */}
                      {waypoints.map((waypoint, index) => (
                        <circle
                          key={index}
                          cx={waypoint.x}
                          cy={waypoint.y}
                          r="2"
                          fill={isActive ? strokeColor : "#6b7280"}
                          className="transition-all duration-300"
                        />
                      ))}

                      {/* Connection Label - positioned at the middle waypoint or midpoint */}
                      {isActive && connectionLabels[connectionKey] && (
                        <g>
                          {(() => {
                            // Calculate label position
                            const labelX = waypoints.length > 0 
                              ? waypoints[Math.floor(waypoints.length / 2)].x 
                              : (fromPoint.x + toPoint.x) / 2
                            const labelY = waypoints.length > 0 
                              ? waypoints[Math.floor(waypoints.length / 2)].y 
                              : (fromPoint.y + toPoint.y) / 2
                            
                            return (
                              <>
                                <rect
                                  x={labelX - 35}
                                  y={labelY - 10}
                                  width="70"
                                  height="20"
                                  rx="10"
                                  fill="rgba(0,0,0,0.9)"
                                  stroke={direction === "outgoing" ? "#06b6d4" : "#10b981"}
                                  strokeWidth="1"
                                />
                                <text
                                  x={labelX}
                                  y={labelY + 4}
                                  textAnchor="middle"
                                  className={`text-xs font-medium pointer-events-none ${
                                    direction === "outgoing" ? "fill-cyan-400" : "fill-emerald-400"
                                  }`}
                                >
                                  {connectionLabels[connectionKey]}
                                </text>
                              </>
                            )
                          })()}
                        </g>
                      )}
                    </g>
                )
              }),
            )}
          </svg>

          {/* Draggable Components */}
          {components.map((component) => {
            const IconComponent = getIconComponent(component.icon)
            const isSelected = selectedComponent === component.id
            const isHighlighted = isComponentHighlighted(component.id)
            const isDraggingThis = isDragging === component.id

            return (
              <Card
                key={component.id}
                className={`absolute bg-gray-900/95 border transition-all duration-300 select-none z-20  ${
                  component.borderColor
                } ${
                  isSelected
                    ? "border-opacity-100 scale-105 shadow-2xl ring-2 ring-cyan-500/50"
                    : isHighlighted
                      ? "border-opacity-80 scale-102 shadow-xl"
                      : "border-opacity-30 hover:border-opacity-60"
                } ${isDraggingThis ? "shadow-cyan-500/50 cursor-grabbing" : "cursor-grab"}`}
                style={{
                  left: `${component.position.x}px`,
                  top: `${component.position.y}px`,
                  width: `${COMPONENT_WIDTH}px`,
                  height: `${COMPONENT_HEIGHT}px`,
                  transform: isDraggingThis ? "scale(1.02)" : "scale(1)",
                  transition: isDraggingThis ? "none" : "all 0.3s ease",
                }}
                onMouseDown={(e) => handleMouseDown(e, component.id)}
                onClick={(e) => handleComponentClick(e, component.id)}
                onMouseEnter={() => !isDragging && setHoveredComponent(component.id)}
                onMouseLeave={() => !isDragging && setHoveredComponent(null)}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${component.color} opacity-0 transition-opacity duration-300 rounded-lg ${
                    isSelected ? "opacity-15" : isHighlighted ? "opacity-8" : "hover:opacity-5"
                  }`}
                />

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg animate-pulse" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${component.color} flex items-center justify-center shadow-lg transition-transform duration-300 ${
                        isSelected ? "scale-125" : isHighlighted ? "scale-110" : ""
                      }`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-gray-500" />
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>

                  <CardTitle
                    className={`text-lg font-bold transition-colors duration-300 ${
                      isSelected ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {component.title}
                    {isSelected && <span className="text-xs text-cyan-400 ml-2">ACTIVE</span>}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 space-y-2">
                  {/* Tech Stack */}
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(component.technologies).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 capitalize">{key}:</span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0 transition-colors duration-300 ${
                            isSelected
                              ? "bg-cyan-900/40 border-cyan-500/50 text-cyan-300"
                              : "bg-gray-800/40 border-gray-700/50 text-gray-300"
                          }`}
                        >
                          {value}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${component.color} ${
                          isSelected ? "animate-ping" : "animate-pulse"
                        }`}
                      />
                      <span className="text-xs text-gray-400">
                        {isSelected ? "Selected" : "Ready"}
                      </span>
                    </div>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isSelected ? "text-cyan-400" : "text-gray-400"
                      }`}
                    >
                      {component.connections.length} connection{component.connections.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes dash-flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 24px;
          }
        }
      `}</style>
    </div>
  )
}
