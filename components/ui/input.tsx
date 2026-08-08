import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Pixel-styled to match the buttons. text-base (16px) is deliberate:
        // iOS Safari zooms the page when a focused input is under 16px.
        "h-11 w-full min-w-0 border-[3px] border-foreground bg-card px-3 py-1 text-base shadow-[3px_3px_0_0_var(--foreground)] transition-none outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[3px_3px_0_0_var(--ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[3px_3px_0_0_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
