"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Code2, Monitor, Zap, Terminal } from "lucide-react"

interface FormData {
  name: string
  age: string
  username: string
  codingKnowledge: string
  preferredIDE: string
}

export default function MinimalistForm() {
  const [currentPhase, setCurrentPhase] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    username: "",
    codingKnowledge: "",
    preferredIDE: "",
  })

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentPhase) {
      case 1:
        return formData.name.trim() !== "" && formData.age.trim() !== "" && formData.username.trim() !== ""
      case 2:
        return formData.codingKnowledge !== ""
      case 3:
        return formData.preferredIDE !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && currentPhase < 3) {
      setCurrentPhase((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentPhase > 1) {
      setCurrentPhase((prev) => prev - 1)
    }
  }



  const codingLevels = [
    { value: "no-knowledge", label: "No Knowledge" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ]

  const ides = [
    { value: "cursor", label: "Cursor", icon: Zap },
    { value: "vscode", label: "VS Code", icon: Code2 },
    { value: "windsurf", label: "Windsurf", icon: Terminal },
    { value: "claude-code", label: "Claude Code", icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">


      <div className="w-full max-w-md px-6">
        {/* Logo/Brand Section */}
        <div className="text-center mb-11">
          <div className="mb-6">
            <div className="w-44 h-44 mx-auto mb-4">
              <img src="/finaldev.png" alt="DevilDev Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          {/* <h1 className="text-2xl font-light text-white mb-2">Please Complete Your Profile</h1> */}
        </div>

        {/* Phase Indicator */}
        <div className="text-center mb-12">
          <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3].map((phase) => (
              <div
                key={phase}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  phase === currentPhase ? "bg-red-500" : phase < currentPhase ? "bg-red-500/50" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <p className="text-gray-500 text-xs">
            {currentPhase === 1 && "Personal Information"}
            {currentPhase === 2 && "Coding Knowledge"}
            {currentPhase === 3 && "Development Environment"}
          </p>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Phase 1: Personal Information */}
          {currentPhase === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="bg-black border-gray-800 text-white placeholder-gray-500 h-12 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => updateFormData("age", e.target.value)}
                    className="bg-black border-gray-800 text-white placeholder-gray-500 h-12 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => updateFormData("username", e.target.value)}
                    className="bg-black border-gray-800 text-white placeholder-gray-500 h-12 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Coding Knowledge */}
          {currentPhase === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="text-center mb-8">
                <p className="text-gray-400 text-sm">What's your coding experience?</p>
              </div>

              <div className="flex  gap-3 justify-center">
                {codingLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateFormData("codingKnowledge", level.value)}
                    className={`flex-1 min-w-[120px] max-w-[140px] aspect-square p-4 rounded-xl border transition-all duration-200 flex items-center justify-center text-center ${
                      formData.codingKnowledge === level.value
                        ? "border-red-500/50 bg-red-500/5 text-white"
                        : "border-gray-800 bg-black text-gray-400 hover:border-gray-700 hover:text-gray-300"
                    }`}
                  >
                    <span className="font-light text-sm">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase 3: Preferred IDE */}
          {currentPhase === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="text-center mb-8">
                <p className="text-gray-400 text-sm">Choose your development environment</p>
              </div>

              <div className="flex  gap-3 justify-center">
                {ides.map((ide) => {
                  const IconComponent = ide.icon
                  return (
                    <button
                      key={ide.value}
                      onClick={() => updateFormData("preferredIDE", ide.value)}
                      className={`flex-1 min-w-[120px] max-w-[140px] aspect-square p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                        formData.preferredIDE === ide.value
                          ? "border-red-500/50 bg-red-500/5 text-white"
                          : "border-gray-800 bg-black text-gray-400 hover:border-gray-700 hover:text-gray-300"
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="font-light text-xs">{ide.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-8">
            {currentPhase > 1 ? (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-12 px-6 rounded-xl font-light"
              >
                Previous
              </Button>
            ) : (
              <div></div>
            )}

            {currentPhase < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-red-500 hover:bg-red-600 text-white h-12 px-8 rounded-xl font-light transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-red-500 hover:bg-red-600 text-white h-12 px-8 rounded-xl font-light transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-De-r from-transparent via-red-500 to-transparent"/>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div>

        {/* Corner accents */}
        <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
        <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
        <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
        <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
    </div>
  )
}
