"use client"

import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

interface FuturisticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "purple" | "green" | "orange" | "red" | "white"
  size?: "default" | "lg"
}

const FuturisticButton = forwardRef<HTMLButtonElement, FuturisticButtonProps>(
  ({ className, variant = "cyan", size = "default", children, ...props }, ref) => {
    const variants = {
      cyan: {
        text: "text-cyan-400",
        glow: "shadow-cyan-400",
        border: "border-cyan-400",
        hover: "hover:bg-cyan-400 hover:text-black hover:shadow-cyan-400",
        spans: "bg-cyan-400",
      },
      purple: {
        text: "text-purple-400",
        glow: "shadow-purple-400",
        border: "border-purple-400",
        hover: "hover:bg-purple-400 hover:text-black hover:shadow-purple-400",
        spans: "bg-purple-400",
      },
      green: {
        text: "text-green-400",
        glow: "shadow-green-400",
        border: "border-green-400",
        hover: "hover:bg-green-400 hover:text-black hover:shadow-green-400",
        spans: "bg-green-400",
      },
      orange: {
        text: "text-orange-400",
        glow: "shadow-orange-400",
        border: "border-orange-400",
        hover: "hover:bg-orange-400 hover:text-black hover:shadow-orange-400",
        spans: "bg-orange-400",
      },
      red: {
        text: "text-red-500",
        glow: "shadow-red-500",
        border: "border-red-500",
        hover: "hover:bg-red-500 hover:text-black hover:shadow-red-500",
        spans: "bg-red-500",
      },
      white: {
        text: "text-white",
        glow: "shadow-white",
        border: "border-white",
        hover: "hover:bg-white hover:text-black hover:shadow-white",
        spans: "bg-white",
      },
    }

    const sizes = {
      default: "px-8 py-4 text-sm",
      lg: "px-12 py-6 text-base",
    }

    const currentVariant = variants[variant]

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "relative inline-block font-bold uppercase tracking-[4px] transition-all duration-500 overflow-hidden border-2 bg-transparent",
          // Variant styles
          currentVariant.text,
          currentVariant.border,
          currentVariant.hover,
          // Size styles
          sizes[size],
          // Hover glow effect
          `hover:shadow-[0_0_5px_currentColor,0_0_25px_currentColor,0_0_50px_currentColor,0_0_200px_currentColor]`,
          className,
        )}
        {...props}
      >
        {/* Animated border spans */}
        <span
          className={cn(
            "absolute top-0 left-0 w-full h-0.5 animate-border-top",
            `bg-gradient-to-r from-transparent to-current`,
            currentVariant.spans,
          )}
        />

        <span
          className={cn(
            "absolute top-0 right-0 w-0.5 h-full animate-border-right",
            `bg-gradient-to-b from-transparent to-current`,
            currentVariant.spans,
          )}
        />

        <span
          className={cn(
            "absolute bottom-0 right-0 w-full h-0.5 animate-border-bottom",
            `bg-gradient-to-l from-transparent to-current`,
            currentVariant.spans,
          )}
        />

        <span
          className={cn(
            "absolute bottom-0 left-0 w-0.5 h-full animate-border-left",
            `bg-gradient-to-t from-transparent to-current`,
            currentVariant.spans,
          )}
        />

        {children}
      </button>
    )
  },
)

FuturisticButton.displayName = "FuturisticButton"

export { FuturisticButton }
