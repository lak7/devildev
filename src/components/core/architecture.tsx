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
  Mic, MicOff, VideoOff, Volume2, MoreHorizontal, MoreVertical
} from "lucide-react"

interface Position {
  x: number
  y: number
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
  Mic, MicOff, VideoOff, Volume2, MoreHorizontal, MoreVertical
}

// Helper function to get icon component from string
const getIconComponent = (iconName: string | any) => {
  if (typeof iconName === 'string') {
    return iconMap[iconName] || Monitor // fallback to Monitor icon
  }
  return iconName // assume it's already a component
}

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
    connections: ["backend", "authentication"],
    position: { x: 50, y: 50 },
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
    connections: ["frontend", "database", "authentication"],
    position: { x: 450, y: 50 },
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
    connections: ["backend"],
    position: { x: 450, y: 350 },
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
    connections: ["frontend", "backend"],
    position: { x: 50, y: 350 },
    dataFlow: {
      sends: ["Auth Tokens", "User Sessions", "Login Status", "Permissions"],
      receives: ["Login Requests", "Token Validation", "User Credentials", "Logout Events"],
    },
  },
]



export default function Architecture({ architectureData, isLoading = false, isFullscreen = false }: ArchitectureProps) {
  const [components, setComponents] = useState<ComponentData[]>(
    architectureData?.components || initialComponents
  )
  const [connectionLabels, setConnectionLabels] = useState<Record<string, string>>(
    architectureData?.connectionLabels || {
      "frontend-backend": "HTTP/API",
      "frontend-authentication": "Auth Flow",
      "backend-database": "SQL/ORM",
      "backend-authentication": "Session",
    }
  )
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [showDataFlow, setShowDataFlow] = useState(true)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [animationKey, setAnimationKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas itself, not on components
    if (e.target === e.currentTarget) {
      setSelectedComponent(null)
    }
  }, [])

  const handleComponentClick = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.stopPropagation()
      if (!isDragging) {
        setSelectedComponent((prev) => (prev === componentId ? null : componentId))
      }
    },
    [isDragging],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const component = components.find((c) => c.id === componentId)
      if (!component) return

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      setIsDragging(componentId)
      setDragOffset({
        x: e.clientX - (containerRect.left + component.position.x),
        y: e.clientY - (containerRect.top + component.position.y),
      })
    },
    [components],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      e.preventDefault()

      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = Math.max(0, Math.min(containerRect.width - 280, e.clientX - containerRect.left - dragOffset.x))
      const newY = Math.max(0, Math.min(containerRect.height - 200, e.clientY - containerRect.top - dragOffset.y))

      setComponents((prev) =>
        prev.map((comp) => (comp.id === isDragging ? { ...comp, position: { x: newX, y: newY } } : comp)),
      )
    },
    [isDragging, dragOffset],
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

  const getConnectionPath = (fromId: string, toId: string) => {
    const fromComp = components.find((c) => c.id === fromId)
    const toComp = components.find((c) => c.id === toId)
    if (!fromComp || !toComp) return ""

    const fromCenterX = fromComp.position.x + 140
    const fromCenterY = fromComp.position.y + 100
    const toCenterX = toComp.position.x + 140
    const toCenterY = toComp.position.y + 100

    const dx = toCenterX - fromCenterX
    const dy = toCenterY - fromCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return ""

    const unitX = dx / distance
    const unitY = dy / distance

    const offset = 120
    const fromX = fromCenterX + unitX * offset
    const fromY = fromCenterY + unitY * offset
    const toX = toCenterX - unitX * offset
    const toY = toCenterY - unitY * offset

    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    const controlOffset = 50

    return `M ${fromX} ${fromY} Q ${midX + controlOffset} ${midY - controlOffset} ${toX} ${toY}`
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
    <div className="min-h-full bg-black text-white p-4 overflow-hidden">
      {/* Interactive Canvas */}
      <div
          ref={containerRef}
          className="relative overflow-hidden cursor-pointer"
          style={{ 
            height: isFullscreen ? "calc(100vh - 120px)" : "600px", 
            minHeight: isFullscreen ? "calc(100vh - 120px)" : "600px" 
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
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
                className="fill-gray-400"
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
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Pulse Animation */}
              <filter id="pulse">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {components.map((component) =>
              component.connections.map((targetId) => {
                const connectionKey = getConnectionKey(component.id, targetId)
                const isActive = isConnectionActive(component.id, targetId)
                const direction = getConnectionDirection(component.id, targetId)

                let strokeColor = "#4b5563"
                let strokeWidth = "2"
                let markerEnd = "url(#arrowhead)"
                let filter = ""
                let dashArray = "none"
                let dashOffset = "0"

                if (isActive && direction) {
                  strokeWidth = "4"
                  filter = "url(#glow)"

                  if (direction === "outgoing") {
                    strokeColor = "#06b6d4" // cyan
                    markerEnd = "url(#arrowhead-outgoing)"
                    dashArray = "12,8"
                    dashOffset = "-20"
                  } else if (direction === "incoming") {
                    strokeColor = "#10b981" // emerald
                    markerEnd = "url(#arrowhead-incoming)"
                    dashArray = "8,12"
                    dashOffset = "20"
                  }
                }

                return (
                  <g key={`${component.id}-${targetId}-${animationKey}`}>
                    <path
                      d={getConnectionPath(component.id, targetId)}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      className={`transition-all duration-500 ${filter}`}
                      markerEnd={markerEnd}
                      style={{
                        animation: isActive && direction ? "dash-flow 2s linear infinite" : "none",
                      }}
                    />

                    {/* Connection Label */}
                    {isActive && connectionLabels[connectionKey] && (
                      <g>
                        <rect
                          x={
                            (components.find((c) => c.id === component.id)!.position.x +
                              140 +
                              components.find((c) => c.id === targetId)!.position.x +
                              140) /
                              2 -
                            30
                          }
                          y={
                            (components.find((c) => c.id === component.id)!.position.y +
                              100 +
                              components.find((c) => c.id === targetId)!.position.y +
                              100) /
                              2 -
                            20
                          }
                          width="60"
                          height="16"
                          rx="8"
                          fill="rgba(0,0,0,0.8)"
                          stroke={direction === "outgoing" ? "#06b6d4" : "#10b981"}
                          strokeWidth="1"
                        />
                        <text
                          x={
                            (components.find((c) => c.id === component.id)!.position.x +
                              140 +
                              components.find((c) => c.id === targetId)!.position.x +
                              140) /
                            2
                          }
                          y={
                            (components.find((c) => c.id === component.id)!.position.y +
                              100 +
                              components.find((c) => c.id === targetId)!.position.y +
                              100) /
                              2 -
                            12
                          }
                          textAnchor="middle"
                          className={`text-xs font-medium pointer-events-none ${
                            direction === "outgoing" ? "fill-cyan-400" : "fill-emerald-400"
                          }`}
                        >
                          {connectionLabels[connectionKey]}
                        </text>
                      </g>
                    )}
                  </g>
                )
              }),
            )}
          </svg>

          {/* Draggable Components */}
          {components.map((component) => {
            const IconComponent = component.icon
            const isSelected = selectedComponent === component.id
            const isHighlighted = isComponentHighlighted(component.id)
            const isDraggingThis = isDragging === component.id

            return (
              <Card
                key={component.id}
                className={`absolute bg-gray-900/90 border transition-all pb-56 duration-300 select-none z-20 ${
                  component.borderColor
                } ${
                  isSelected
                    ? "border-opacity-100 scale-110 shadow-2xl ring-2 ring-cyan-500/50"
                    : isHighlighted
                      ? "border-opacity-80 scale-105 shadow-xl"
                      : "border-opacity-30 hover:border-opacity-60"
                } ${isDraggingThis ? "shadow-cyan-500/50 cursor-grabbing" : "cursor-grab"}`}
                style={{
                  left: `${component.position.x}px`,
                  top: `${component.position.y}px`,
                  width: isFullscreen ? "320px" : "280px",
                  height: isFullscreen ? "240px" : "200px",
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
                    isSelected ? "opacity-20" : isHighlighted ? "opacity-10" : "hover:opacity-5"
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
                      {isHighlighted && !isSelected && (
                        <div className="flex items-center gap-1">
                          {component.connections.map((connId, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                                components.find((c) => c.id === connId)?.color
                              } animate-pulse`}
                            />
                          ))}
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
                    {isSelected && <span className="text-xs text-cyan-400 ml-2">SELECTED</span>}
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
                    </div>
                    {(isHighlighted || isSelected) && (
                      <span
                        className={`text-xs transition-colors duration-300 ${
                          isSelected ? "text-cyan-400" : "text-gray-400"
                        }`}
                      >
                        {component.connections.length} connection{component.connections.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

    
        </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes dash-flow {
          0% {
            stroke-dashoffset: 20px;
          }
          100% {
            stroke-dashoffset: -20px;
          }
        }
      `}</style>
    </div>
  )
}
