"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "rainbow" | "red" | "white"
  size?: "sm" | "md" | "lg"
}

export function GlowButton({ children, className, variant = "blue", size = "md", ...props }: GlowButtonProps) {
  const variants = {
    blue: "bg-black border-blue-500/30 text-white shadow-[0_0_12px_rgba(59,130,246,0.35),0_0_24px_rgba(59,130,246,0.18)] hover:shadow-[0_0_16px_rgba(59,130,246,0.48),0_0_32px_rgba(59,130,246,0.24)]",
    purple:
      "bg-black border-purple-500/30 text-white shadow-[0_0_12px_rgba(147,51,234,0.35),0_0_24px_rgba(147,51,234,0.18)] hover:shadow-[0_0_16px_rgba(147,51,234,0.48),0_0_32px_rgba(147,51,234,0.24)]",
    green:
      "bg-black border-green-500/30 text-white shadow-[0_0_12px_rgba(34,197,94,0.35),0_0_24px_rgba(34,197,94,0.18)] hover:shadow-[0_0_16px_rgba(34,197,94,0.48),0_0_32px_rgba(34,197,94,0.24)]",
    orange:
      "bg-black border-orange-500/30 text-white shadow-[0_0_12px_rgba(249,115,22,0.35),0_0_24px_rgba(249,115,22,0.18)] hover:shadow-[0_0_16px_rgba(249,115,22,0.48),0_0_32px_rgba(249,115,22,0.24)]",
    pink: "bg-black border-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.35),0_0_24px_rgba(236,72,153,0.18)] hover:shadow-[0_0_16px_rgba(236,72,153,0.48),0_0_32px_rgba(236,72,153,0.24)]",
    cyan: "bg-black border-cyan-500/30 text-white shadow-[0_0_12px_rgba(6,182,212,0.35),0_0_24px_rgba(6,182,212,0.18)] hover:shadow-[0_0_16px_rgba(6,182,212,0.48),0_0_32px_rgba(6,182,212,0.24)]",
    rainbow:
      "bg-black border-purple-500/30 text-white shadow-[0_0_12px_rgba(147,51,234,0.24),0_0_24px_rgba(59,130,246,0.18),0_0_36px_rgba(236,72,153,0.12)] hover:shadow-[0_0_16px_rgba(147,51,234,0.36),0_0_32px_rgba(59,130,246,0.24),0_0_48px_rgba(236,72,153,0.18)]",
    red: "bg-black border-red-500/30 text-white shadow-[0_0_12px_rgba(220,38,38,0.35),0_0_24px_rgba(220,38,38,0.18)] hover:shadow-[0_0_16px_rgba(220,38,38,0.48),0_0_32px_rgba(220,38,38,0.24)]",
    white: "bg-white border-gray-300/30 rounded-full text-black shadow-[0_0_12px_rgba(255,255,255,0.35),0_0_24px_rgba(255,255,255,0.18)] hover:shadow-[0_0_16px_rgba(255,255,255,0.48),0_0_32px_rgba(255,255,255,0.24)]",
  }

  const gradients = {
    blue: "from-blue-500 to-cyan-400",
    purple: "from-purple-500 to-pink-500",
    green: "from-green-500 to-emerald-400",
    orange: "from-orange-500 to-red-500",
    pink: "from-pink-500 to-rose-400",
    cyan: "from-cyan-500 to-blue-400",
    rainbow: "from-purple-500 via-blue-500 to-pink-500",
    red: "from-red-600 to-red-600",
    white: "from-white to-gray-100",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <div className="relative inline-block">
      <div
        className={cn("absolute inset-0 rounded-lg blur-sm opacity-35", `bg-gradient-to-r ${gradients[variant]}`)}
        style={{
          transform: "scale(1.03)",
          filter: "blur(8px)",
          animation: "float-glow 6s ease-in-out infinite",
        }}
      />

      <div
        className={cn("absolute inset-0 rounded-lg blur-xs opacity-24", `bg-gradient-to-r ${gradients[variant]}`)}
        style={{
          transform: "scale(1.015)",
          filter: "blur(4px)",
          animation: "float-glow-secondary 7s ease-in-out infinite reverse",
        }}
      />

      <div
        className={cn("absolute inset-0 rounded-lg blur-md opacity-18", `bg-gradient-to-r ${gradients[variant]}`)}
        style={{
          transform: "scale(1.05)",
          filter: "blur(12px)",
          animation: "float-glow-tertiary 8s ease-in-out infinite",
        }}
      />

      {/* Button */}
      <button
        className={cn(
          "relative z-10 rounded-lg border font-medium transition-all duration-300 ease-out",
          "backdrop-blur-sm",
          "cursor-pointer",
          variants[variant],
          sizes[size],
          "transform hover:translate-y-[-1px] active:translate-y-[0px]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">{children}</div>
      </button>

      <style jsx>{`
        @keyframes float-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1.03) translateX(0px) translateY(0px) rotate(0deg);
          }
          20% {
            opacity: 0.42;
            transform: scale(1.035) translateX(2px) translateY(-1px) rotate(0.5deg);
          }
          40% {
            opacity: 0.36;
            transform: scale(1.04) translateX(1px) translateY(-2px) rotate(-0.3deg);
          }
          60% {
            opacity: 0.42;
            transform: scale(1.035) translateX(-1px) translateY(-1px) rotate(0.2deg);
          }
          80% {
            opacity: 0.36;
            transform: scale(1.04) translateX(-2px) translateY(0px) rotate(-0.4deg);
          }
        }
        
        @keyframes float-glow-secondary {
          0%, 100% {
            opacity: 0.18;
            transform: scale(1.015) translateX(0px) translateY(0px) rotate(0deg);
          }
          25% {
            opacity: 0.3;
            transform: scale(1.02) translateX(-1px) translateY(1px) rotate(-0.2deg);
          }
          50% {
            opacity: 0.24;
            transform: scale(1.025) translateX(1px) translateY(-1px) rotate(0.3deg);
          }
          75% {
            opacity: 0.3;
            transform: scale(1.02) translateX(0px) translateY(1px) rotate(-0.1deg);
          }
        }
        
        @keyframes float-glow-tertiary {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1.05) translateX(0px) translateY(0px) rotate(0deg);
          }
          30% {
            opacity: 0.22;
            transform: scale(1.055) translateX(1px) translateY(-1px) rotate(0.4deg);
          }
          70% {
            opacity: 0.18;
            transform: scale(1.06) translateX(-1px) translateY(1px) rotate(-0.3deg);
          }
        }
      `}</style>
    </div>
  )
}
