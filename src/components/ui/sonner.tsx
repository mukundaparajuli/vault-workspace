"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = (props: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="bottom-right"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-lg !text-[13px] !gap-2.5 !py-3",
          description: "!text-muted-foreground !text-[12.5px]",
          actionButton: "!bg-primary !text-primary-foreground !rounded-md !text-xs",
          cancelButton: "!bg-muted !text-muted-foreground !rounded-md !text-xs",
          icon: "!size-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
