"use client"
import React, { useState, useEffect } from 'react'

// Types
interface ComponentData {
  id: string
  title: string
  subComponents: string[]
  position: { x: number; y: number }
  size: { width: number; height: number }
  connections: string[]
}

interface Connection {
  from: string
  to: string
  path: string
  id: string
}

// Architecture Data
const ARCHITECTURE_DATA: ComponentData[] = [
  {
    id: 'frontend',
    title: 'FRONTEND',
    subComponents: ['UI COMPONENTS', 'STATE MANAGEMENT'],
    position: { x: 50, y: 10 },
    size: { width: 280, height: 120 },
    connections: ['backend', 'auth']
  },
  {
    id: 'backend',
    title: 'BACKEND',
    subComponents: ['API', 'BUSINESS LOGIC', 'BACKGROUND JOBS'],
    position: { x: 10, y: 40 },
    size: { width: 200, height: 180 },
    connections: ['database', 'auth']
  },
  {
    id: 'auth',
    title: 'AUTH',
    subComponents: ['TOKEN SERVICE', 'USER MANAGEMENT'],
    position: { x: 75, y: 40 },
    size: { width: 180, height: 140 },
    connections: ['database']
  },
  {
    id: 'database',
    title: 'DATABASE',
    subComponents: ['DATA STORAGE', 'SCHEMA', 'QUERY'],
    position: { x: 50, y: 80 },
    size: { width: 200, height: 100 },
    connections: []
  }
]

const CONNECTIONS: Connection[] = [
  { from: 'frontend', to: 'backend', path: 'M 50 25 Q 30 35 25 50', id: 'frontend-backend' },
  { from: 'frontend', to: 'auth', path: 'M 50 25 Q 70 35 75 50', id: 'frontend-auth' },
  { from: 'backend', to: 'database', path: 'M 25 65 Q 35 75 50 85', id: 'backend-database' },
  { from: 'auth', to: 'database', path: 'M 75 65 Q 65 75 50 85', id: 'auth-database' },
  { from: 'backend', to: 'auth', path: 'M 40 50 L 60 50', id: 'backend-auth' }
]

// Component: Architecture Component
const ArchitectureComponent: React.FC<{
  data: ComponentData
  isHovered: boolean
  onHover: (id: string | null) => void
}> = ({ data, isHovered, onHover }) => {
  const style = {
    left: `${data.position.x}%`,
    top: `${data.position.y}%`,
    width: `${data.size.width}px`,
    height: `${data.size.height}px`,
    transform: 'translate(-50%, -50%)'
  }

  const glowClass = isHovered 
    ? "shadow-cyan-400/50 shadow-2xl border-cyan-300 scale-105" 
    : "border-cyan-500/70"

  return (
    <div 
      className={`absolute bg-black/80 border-2 rounded-2xl p-4 backdrop-blur-sm
        transition-all duration-300 cursor-pointer z-10 ${glowClass}`}
      style={style}
      onMouseEnter={() => onHover(data.id)}
      onMouseLeave={() => onHover(null)}
    >
      <ComponentHeader title={data.title} />
      <ComponentBody subComponents={data.subComponents} />
      {data.id === 'frontend' && <HTTPRequestsBadge />}
      {data.id === 'backend' && <BackendBadges />}
      {data.id === 'database' && <DatabaseVisualization />}
    </div>
  )
}

// Component: Header
const ComponentHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-cyan-400 text-lg font-light tracking-wide mb-3 text-center">
    {title}
  </h3>
)

// Component: Body
const ComponentBody: React.FC<{ subComponents: string[] }> = ({ subComponents }) => (
  <div className={`space-y-2 ${subComponents.length > 2 ? 'grid grid-cols-1' : 'flex space-x-3 space-y-0'}`}>
    {subComponents.map((component) => (
      <div 
        key={component}
        className="bg-slate-800/50 border border-cyan-600/30 rounded-lg p-2 text-center"
      >
        <div className="text-cyan-300 text-xs font-light">{component}</div>
      </div>
    ))}
  </div>
)

// Component: HTTP Requests Badge
const HTTPRequestsBadge: React.FC = () => (
  <div className="absolute -top-2 -right-2">
    <div className="bg-slate-700/50 border border-cyan-600/30 rounded p-2">
      <div className="text-cyan-300 text-xs leading-tight">HTTP<br/>REQUESTS</div>
    </div>
  </div>
)

// Component: Backend Badges
const BackendBadges: React.FC = () => (
  <>
    <div className="absolute -top-2 -right-2">
      <div className="bg-slate-700/50 border border-cyan-600/30 rounded p-2">
        <div className="text-cyan-300 text-xs leading-tight">BUSINESS<br/>LOGIC</div>
      </div>
    </div>
    <div className="absolute -bottom-2 -right-2">
      <div className="bg-slate-700/50 border border-cyan-600/30 rounded p-2">
        <div className="text-cyan-300 text-xs leading-tight">DATA ACCESS<br/>JOBS</div>
      </div>
    </div>
  </>
)

// Component: Database Visualization
const DatabaseVisualization: React.FC = () => (
  <div className="mt-3 flex justify-center">
    <div className="w-24 h-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 to-cyan-800/20 rounded-lg border border-cyan-500/50" />
    </div>
  </div>
)

// Component: Connection Lines
const ConnectionLines: React.FC<{ 
  connections: Connection[]
  isFlowing: boolean 
}> = ({ connections, isFlowing }) => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none z-0" 
    style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))' }}
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <defs>
      <Gradients />
    </defs>
    {connections.map((connection, index) => (
      <AnimatedPath 
        key={connection.id}
        path={connection.path}
        gradientId={`gradient${index + 1}`}
        isFlowing={isFlowing}
      />
    ))}
  </svg>
)

// Component: Animated Path
const AnimatedPath: React.FC<{
  path: string
  gradientId: string
  isFlowing: boolean
}> = ({ path, gradientId, isFlowing }) => (
  <path 
    d={path}
    stroke={`url(#${gradientId})`}
    strokeWidth="0.5"
    fill="none"
    className="transition-all duration-1000"
    strokeDasharray="2,2"
    strokeDashoffset={isFlowing ? "0" : "4"}
    style={{
      animation: isFlowing ? 'flow 2s linear infinite' : 'none'
    }}
  />
)

// Component: Gradients
const Gradients: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map(num => (
      <linearGradient key={num} id={`gradient${num}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4"/>
      </linearGradient>
    ))}
  </>
)

// Component: Circular Borders
const CircularBorders: React.FC = () => (
  <>
    <div className="absolute inset-8 border-2 border-cyan-500/30 rounded-full pointer-events-none animate-pulse" />
    <div className="absolute inset-16 border border-cyan-500/20 rounded-full pointer-events-none" />
  </>
)

// Component: Legend
const Legend: React.FC = () => (
  <div className="mt-12 text-center">
    <div className="inline-flex items-center space-x-6 text-cyan-400/60 text-sm">
      <LegendItem icon={<div className="w-3 h-0.5 bg-cyan-400" />} label="Data Flow" />
      <LegendDot />
      <LegendItem icon={<div className="w-2 h-2 border border-cyan-400 rounded-full" />} label="Interactive Components" />
      <LegendDot />
      <LegendItem icon={<div className="w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse" />} label="Live System" />
    </div>
  </div>
)

const LegendItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center space-x-2">
    {icon}
    <span>{label}</span>
  </div>
)

const LegendDot: React.FC = () => (
  <div className="w-1 h-1 bg-cyan-400/40 rounded-full" />
)

// Main Component
const ArchitecturePage: React.FC = () => {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [isFlowing, setIsFlowing] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlowing(prev => !prev)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white p-8 overflow-hidden">
      <style jsx>{`
        @keyframes flow {
          0% { stroke-dashoffset: 4; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Title */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-light tracking-[0.3em] mb-2 text-cyan-400">
            SOFTWARE
          </h1>
          <h2 className="text-5xl font-light tracking-[0.3em] text-cyan-400">
            ARCHITECTURE
          </h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-8" />
        </header>

        {/* Architecture Container */}
        <main className="relative w-full h-[600px]">
          {/* Components */}
          {ARCHITECTURE_DATA.map((component) => (
            <ArchitectureComponent
              key={component.id}
              data={component}
              isHovered={hoveredComponent === component.id}
              onHover={setHoveredComponent}
            />
          ))}

          {/* Connection Lines */}
          <ConnectionLines connections={CONNECTIONS} isFlowing={isFlowing} />

          {/* Circular Borders */}
          <CircularBorders />
        </main>

        {/* Legend */}
        <Legend />
      </div>
    </div>
  )
}

export default ArchitecturePage
