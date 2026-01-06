"use client"

import { useState, useEffect } from "react"
import { X, Github, Star } from "lucide-react"
import Image from "next/image"

interface OpenSourceDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function OpenSourceDialog({ isOpen, onClose }: OpenSourceDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setVisible(false)
    onClose()
  }

  if (!mounted || !visible) return null

  return (
    <>
      {/* Backdrop and Dialog Container */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      >
        {/* Dialog Content - stops propagation so clicks inside don't close */}
        <div 
          className="relative w-full max-w-md bg-gradient-to-br from-red-950/40 via-black to-black border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent opacity-0 animate-pulse" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 cursor-pointer right-4 z-50 p-2 hover:bg-white/10 rounded-full transition duration-200"
            aria-label="Close"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8 space-y-6">
            <div className="flex justify-center mb-2">
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-red-500/50">
                <Image
                  src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWMyeHJ2Z2lxaDd3Z2RoenQ3b3N6Z2w1M2xmeGoxMmh5ZXNpcnllbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3UkqVq3F50bVCi9URl/giphy.gif"
                  alt="Cute celebration cat"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Header with icon */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center">
                DevilDev is Now
                <br />
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Open Source!
                </span>
              </h2>
            </div>


            {/* Features */}
            <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex gap-3 items-start">
                <span className="text-red-400 font-bold">✨</span>
                <span className="text-white/70 text-sm">Contribute and shape the product</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-red-400 font-bold">🔓</span>
                <span className="text-white/70 text-sm">Full source code access</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-red-400 font-bold">🤝</span>
                <span className="text-white/70 text-sm">Join a thriving developer community</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => {
                  window.open("https://github.com/lak7/devildev", "_blank")
                }}
                className="w-full bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 group"
              >
                <Github size={20} className="fill-current" />
                <span>Star Now on GitHub ⭐</span>
              </button>
            </div>

            
          </div>
        </div>
      </div>
    </>
  )
}
