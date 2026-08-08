import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Pixel-styled: square corners, chunky ink outline, hard offset shadow that
// the button presses into on tap. Sizes are touch-first (>=44px) because this
// app is phone-only. The press runs over 100ms rather than instantly: a tap can
// be shorter than a frame or two, and with no transition the state came and
// went too fast to read as feedback.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-[3px] border-foreground bg-clip-padding font-medium tracking-wide uppercase whitespace-nowrap shadow-[3px_3px_0_0_var(--foreground)] outline-none transition-[translate,scale,box-shadow,filter,background-color] duration-100 ease-out select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-active",
        outline: "bg-card text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        // Borderless variants have no shadow to press into, so they answer a
        // tap by shrinking instead.
        ghost:
          "border-transparent shadow-none hover:bg-muted active:translate-x-0 active:translate-y-0 active:scale-95",
        destructive: "bg-destructive text-white hover:opacity-90",
        link: "border-transparent bg-transparent text-primary underline-offset-4 shadow-none normal-case hover:underline active:translate-x-0 active:translate-y-0 active:scale-95",
      },
      size: {
        default: "h-11 gap-2 px-4 text-sm",
        xs: "h-8 gap-1 px-2 text-[11px]",
        sm: "h-9 gap-1.5 px-3 text-xs",
        lg: "h-12 gap-2 px-5 text-base",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
