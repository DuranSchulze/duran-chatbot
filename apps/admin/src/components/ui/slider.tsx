import type { InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Slider({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary",
        className
      )}
      {...props}
    />
  )
}
