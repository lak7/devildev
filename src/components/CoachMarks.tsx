"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface CoachMarkProps {
  isVisible: boolean
  targetElement?: HTMLElement | null
  title: string
  message: string
  position?: "top" | "bottom" | "left" | "right"
  onNext?: () => void
  onSkip?: () => void
  onClose?: () => void
  nextLabel?: string
  showSkip?: boolean
}

export function CoachMark({
  isVisible,
  targetElement,
  title,
  message,
  position = "bottom",
  onNext,
  onSkip,
  onClose,
  nextLabel = "Next",
  showSkip = true,
}: CoachMarkProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!targetElement || !isVisible) return

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset

      let x = 0
      let y = 0
      let arrowX = 0
      let arrowY = 0

      switch (position) {
        case "top":
          x = rect.left + scrollX + rect.width / 2
          y = rect.top + scrollY - 16
          arrowX = 0
          arrowY = 0
          break
        case "bottom":
          x = rect.left + scrollX + rect.width / 2
          y = rect.bottom + scrollY + 16
          arrowX = 0
          arrowY = 0
          break
        case "left":
          x = rect.left + scrollX - 16
          y = rect.top + scrollY + rect.height / 2
          arrowX = 0
          arrowY = 0
          break
        case "right":
          x = rect.right + scrollX + 16
          y = rect.top + scrollY + rect.height / 2
          arrowX = 0
          arrowY = 0
          break
      }

      setCoords({ x, y })
      setArrowPosition({ x: arrowX, y: arrowY })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition)
    }
  }, [targetElement, position, isVisible])

  if (!isVisible) return null

  const getTransformOrigin = () => {
    switch (position) {
      case "top":
        return "bottom center"
      case "bottom":
        return "top center"
      case "left":
        return "right center"
      case "right":
        return "left center"
      default:
        return "center"
    }
  }

  const getTransform = () => {
    switch (position) {
      case "top":
        return "translate(-50%, -100%)"
      case "bottom":
        return "translate(-50%, 0%)"
      case "left":
        return "translate(-100%, -50%)"
      case "right":
        return "translate(0%, -50%)"
      default:
        return "translate(-50%, 0%)"
    }
  }

  const getArrowClasses = () => {
    const base = "absolute w-3 h-3 bg-white border border-gray-200 rotate-45"
    switch (position) {
      case "top":
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0`
      case "bottom":
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0`
      case "left":
        return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-r-0 border-b-0`
      case "right":
        return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-l-0 border-t-0`
      default:
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0`
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Spotlight effect on target */}
      {targetElement && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-300"
          style={{
            left: targetElement.getBoundingClientRect().left - 8,
            top: targetElement.getBoundingClientRect().top - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: "0 0 0 4px rgba(200, 0, 0, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
          }}
        />
      )}

      {/* Coach Mark Tooltip */}
      <div
        className="fixed z-50 transition-all duration-300 ease-out"
        style={{
          left: coords.x,
          top: coords.y,
          transform: getTransform(),
          transformOrigin: getTransformOrigin(),
          animation: isVisible ? "coachMarkIn 0.3s ease-out" : undefined,
        }}
      >
        <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm min-w-[280px]">
          {/* Arrow */}
          <div className={getArrowClasses()} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {showSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 font-medium"
              >
                Skip tour
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              {onNext && (
                <Button size="sm" onClick={onNext} className="text-sm bg-red-500 hover:bg-red-700">
                  {nextLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes coachMarkIn {
          0% {
            opacity: 0;
            transform: ${getTransform()} scale(0.8);
          }
          100% {
            opacity: 1;
            transform: ${getTransform()} scale(1);
          }
        }
      `}</style>
    </>
  )
}
