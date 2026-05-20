import * as React from "react"
import { cn } from "@/lib/utils"

const Highlight = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <mark
        ref={ref}
        className={cn("bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-medium px-1.5 py-0.5 rounded-sm", className)}
        {...props}
      />
    )
  }
)
Highlight.displayName = "Highlight"

export { Highlight }
