"use client"

import CommandPalette from "@/components/ui/command-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import React from "react"
import { AppSidebar } from "./app-sidebar"
import CreateModuleDialog from "./create-module-dialog"

/** App shell: inset sidebar + elevated content pane, plus global dialogs. */
const LeftSidebar = ({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) => (
  <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
    <AppSidebar />
    <SidebarInset className="min-w-0 overflow-hidden md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:shadow-md md:peer-data-[variant=inset]:h-[calc(100svh-1rem)]">
      {children}
    </SidebarInset>
    <CommandPalette />
    <CreateModuleDialog />
  </SidebarProvider>
)

export default LeftSidebar
