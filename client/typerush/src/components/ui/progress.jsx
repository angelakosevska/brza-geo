import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative bg-[var(--primary)]/20 rounded-full w-full h-2 overflow-hidden",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="flex-1 bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary)]/50 rounded-full w-full h-full transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
