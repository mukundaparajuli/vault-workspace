"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import useVault from "@/hooks/use-vault"
import { cn, toHref, toSlug } from "@/lib/core/utils"
import { ChevronLeft, ChevronRight, Folder, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { FileIcon } from "./file-icon"

type Crumb = { name: string; slugPath: string[] }

const MAX_VISIBLE = 3

/**
 * Top bar of the workspace pane: sidebar toggle, history, breadcrumb trail
 * built from real file names, and a slot for view-specific actions.
 */
const WorkspaceHeader = ({
  names,
  kind,
  actions,
  className,
}: {
  /** Real names of each path segment, root excluded. */
  names: string[]
  kind: "file" | "folder"
  actions?: ReactNode
  className?: string
}) => {
  const router = useRouter()
  const { vaultName } = useVault()

  const crumbs: Crumb[] = names.map((name, index) => ({
    name,
    slugPath: names.slice(0, index + 1).map(toSlug),
  }))

  const collapsed = crumbs.length > MAX_VISIBLE ? crumbs.slice(0, crumbs.length - (MAX_VISIBLE - 1)) : []
  const visible = crumbs.length > MAX_VISIBLE ? crumbs.slice(-(MAX_VISIBLE - 1)) : crumbs

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-3",
        className
      )}
    >
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="hidden items-center sm:flex">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="inline-flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Go forward"
          onClick={() => router.forward()}
          className="inline-flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <span aria-hidden className="mx-0.5 hidden h-4 w-px bg-border sm:block" />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-0.5 text-[13px]">
          <li className="shrink-0">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={cn(
                "rounded-md px-1.5 py-1 transition-colors hover:bg-accent hover:text-foreground",
                crumbs.length === 0 ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {vaultName}
            </button>
          </li>

          {collapsed.length > 0 ? (
            <>
              <Separator />
              <li className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Show hidden path"
                      className="inline-flex h-6 items-center rounded-md px-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {collapsed.map((crumb) => (
                      <DropdownMenuItem key={crumb.slugPath.join("/")} onSelect={() => router.push(toHref(crumb.slugPath))}>
                        <Folder />
                        {crumb.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </>
          ) : null}

          {visible.map((crumb, index) => {
            const isLast = index === visible.length - 1

            return (
              <li key={crumb.slugPath.join("/")} className={cn("flex min-w-0 items-center gap-0.5", !isLast && "shrink")}>
                <Separator />
                {isLast ? (
                  <span
                    aria-current="page"
                    className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 font-medium text-foreground"
                  >
                    <FileIcon name={crumb.name} kind={kind} className="size-3.5" />
                    <span className="truncate">{crumb.name}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(toHref(crumb.slugPath))}
                    className="max-w-[10rem] truncate rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {crumb.name}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </header>
  )
}

const Separator = () => (
  <span aria-hidden className="shrink-0 text-[13px] text-subtle-foreground/70">
    /
  </span>
)

export default WorkspaceHeader
