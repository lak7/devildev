// "use client"
// import type React from "react"
// import { CanvasRevealEffect } from "./canvas-reveal-effect"
// import { cn } from "@/lib/utils"

// interface MatrixGlitchButtonProps {
//   children: React.ReactNode
//   className?: string
//   onClick?: () => void
//   disabled?: boolean
// }

// export const MatrixGlitchButton: React.FC<MatrixGlitchButtonProps> = ({
//   children,
//   className,
//   onClick,
//   disabled = false,
// }) => {
//   return (
//     <div className="relative group">
//       {/* Matrix effect background - always visible */}
//       <div className="absolute -inset-4 rounded-xl overflow-hidden">
//         <CanvasRevealEffect
//           animationSpeed={0.6}
//           containerClassName="bg-black"
//           colors={[
//             [220, 28, 19], // Cyan
//             [234, 76, 70], // Blue
//             [240, 116, 112], // Light blue
//           ]}
//           dotSize={2}
//           opacities={[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
//           showGradient={false}
//         />
//       </div>

//       {/* Solid button */}
//       <button
//         onClick={onClick}
//         disabled={disabled}
//         className={cn(
//           "relative z-10 px-6 py-3 bg-black border border-cyan-500/30 rounded-lg",
//           "text-white font-medium text-sm",
//           "transition-all duration-300 ease-out",
//           "hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20",
//           "active:scale-95",
//           "disabled:opacity-50 disabled:cursor-not-allowed",
//           "backdrop-blur-sm",
//           className,
//         )}
//       >
//         <div className="relative z-20 flex items-center gap-2">{children}</div>

//         {/* Inner glow effect on hover */}
//         <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//       </button>
//     </div>
//   )
// }
