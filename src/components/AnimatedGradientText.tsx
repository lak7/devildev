import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
  href: string
}

export default function AnimatedGradientText({ children, className, href }: AnimatedGradientTextProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative mx-auto flex w-auto min-w-max flex-row items-center justify-center rounded-2xl bg-[#DC262630] px-6 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ff6b6b1f] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#ff6b6b3f]",
        className,
      )}
    >
      <div className="absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-[#7F1D1D]/50 via-[#DC2626]/50 to-[#7F1D1D]/50 bg-[length:var(--bg-size)_100%] p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]" />
      {children}
    </a>
  )
}