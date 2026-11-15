import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/core/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.12),0_1px_2px_0_oklch(0_0_0/0.12)] hover:bg-primary/88",
        brand:
          "bg-brand text-brand-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.18),0_1px_2px_0_oklch(0_0_0/0.12)] hover:bg-brand/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/25",
        outline:
          "border bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 gap-1 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-xl px-5 text-sm",
        icon: "size-8",
        "icon-sm": "size-7 rounded-md",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
