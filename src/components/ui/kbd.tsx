"use client"

import * as React from "react"

import { cn } from "@/lib/core/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-[5px] border border-b-2 bg-background px-1 font-sans text-[11px] font-medium text-muted-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

/** Renders the platform's modifier key (⌘ on Apple, Ctrl elsewhere) after hydration. */
function ModKey(props: React.ComponentProps<"kbd">) {
  const [isApple, setIsApple] = React.useState(false)

  React.useEffect(() => {
    setIsApple(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent))
  }, [])

  return <Kbd {...props}>{isApple ? "⌘" : "Ctrl"}</Kbd>
}

function Shortcut({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key) => (key === "mod" ? <ModKey key={key} /> : <Kbd key={key}>{key}</Kbd>))}
    </span>
  )
}

export { Kbd, ModKey, Shortcut }
