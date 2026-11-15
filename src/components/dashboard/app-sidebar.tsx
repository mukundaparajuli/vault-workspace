"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shortcut } from "@/components/ui/kbd"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import useVault from "@/hooks/use-vault"
import { moduleType, openCommandPalette, openCreateDialog } from "@/lib/core/constants"
import { cn, sanitizePath, toHref, toSlug } from "@/lib/core/utils"
import type { VaultItem } from "@/lib/vaults/get-folder-structure"
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FilePlus2,
  FolderOpen,
  FolderPlus,
  House,
  ListFilter,
  LogOut,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { FileIcon } from "./file-icon"
import NodeActions from "./node-actions"
import ThemeSwitcher from "./theme-switcher"

const filterTree = (items: VaultItem[], query: string): VaultItem[] => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return items

  return items.reduce<VaultItem[]>((result, item) => {
    const isMatch = item.name.toLowerCase().includes(normalizedQuery)

    if (item.kind === "folder") {
      const matchingChildren = filterTree(item.children || [], normalizedQuery)
      if (isMatch || matchingChildren.length > 0) {
        result.push({ ...item, children: isMatch ? item.children : matchingChildren })
      }
      return result
    }

    if (isMatch) result.push(item)
    return result
  }, [])
}

const countFiles = (items: VaultItem[]): number =>
  items.reduce((total, item) => total + (item.kind === "file" ? 1 : countFiles(item.children ?? [])), 0)

const keyOf = (item: VaultItem) => item.path.map(toSlug).join("/")

const IconAction = ({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="inline-flex size-6 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground [&_svg]:size-3.5"
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
)

export function AppSidebar() {
  const { vault, vaultName, status, tree, isTreeLoading, refreshStructure, chooseVault, clearVault } = useVault()
  const router = useRouter()
  const params = useParams()
  const { isMobile, setOpenMobile } = useSidebar()
  const currentPath = useMemo(
    () => sanitizePath((params.path as string[] | undefined) || []),
    [params.path]
  )

  const [query, setQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // Reveal the active item by expanding all of its ancestors.
  useEffect(() => {
    if (currentPath.length < 2) return
    setExpanded((previous) => {
      const next = new Set(previous)
      for (let index = 1; index < currentPath.length; index += 1) {
        next.add(currentPath.slice(0, index).join("/"))
      }
      return next.size === previous.size ? previous : next
    })
  }, [currentPath])

  const toggle = useCallback((key: string, force?: boolean) => {
    setExpanded((previous) => {
      const next = new Set(previous)
      const shouldOpen = force ?? !next.has(key)
      if (shouldOpen) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const navigate = useCallback(
    (slugPath: string[]) => {
      router.push(toHref(slugPath))
      if (isMobile) setOpenMobile(false)
    },
    [router, isMobile, setOpenMobile]
  )

  const filtered = useMemo(() => filterTree(tree ?? [], query), [tree, query])
  const fileCount = useMemo(() => countFiles(tree ?? []), [tree])
  const isAtRoot = currentPath.length === 0

  return (
    <Sidebar variant="inset" className="p-0">
      <SidebarHeader className="gap-1 px-2.5 pt-3 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">
                {vaultName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {vault ? vaultName : "No vault"}
                </p>
                <p className="truncate text-[11px] text-subtle-foreground">
                  {vault ? `${fileCount} files · local` : "Vault Workspace"}
                </p>
              </div>
              <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel>Vault</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => void chooseVault().then((handle) => handle && router.push("/dashboard"))}>
              <FolderOpen />
              {vault ? "Open another folder…" : "Open folder…"}
            </DropdownMenuItem>
            {vault ? (
              <>
                <DropdownMenuItem onSelect={refreshStructure}>
                  <RefreshCw />
                  Reload from disk
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => void clearVault().then(() => router.push("/dashboard"))}
                >
                  <LogOut />
                  Disconnect vault
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={openCommandPalette}
          className="mt-1.5 flex h-8 w-full items-center gap-2 rounded-lg border bg-background px-2.5 text-[13px] text-subtle-foreground shadow-xs transition-colors hover:border-foreground/15 hover:text-muted-foreground"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search</span>
          <Shortcut keys={["mod", "K"]} />
        </button>

        <nav className="mt-1.5 grid gap-px">
          <button
            type="button"
            onClick={() => navigate([])}
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] transition-colors hover:bg-sidebar-accent hover:text-foreground",
              isAtRoot ? "bg-sidebar-accent font-medium text-foreground" : "text-sidebar-foreground"
            )}
          >
            <House className="size-4 text-muted-foreground" />
            Home
          </button>
          {vault ? (
            <button
              type="button"
              onClick={() => openCreateDialog({ targetSlugPath: [], targetName: vaultName, type: moduleType.FILE })}
              className="flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <FilePlus2 className="size-4 text-muted-foreground" />
              New note
            </button>
          ) : null}
        </nav>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2.5 pt-2">
        <div className="group/files flex h-7 items-center justify-between pl-2">
          <span className="text-[11px] font-medium text-subtle-foreground">Files</span>
          {vault ? (
            <div className="flex items-center opacity-100 transition-opacity md:opacity-0 md:group-hover/files:opacity-100 md:has-[:focus-visible]:opacity-100">
              <IconAction label="Filter" onClick={() => setFilterOpen((open) => !open)}>
                <ListFilter />
              </IconAction>
              <IconAction
                label="New folder"
                onClick={() => openCreateDialog({ targetSlugPath: [], targetName: vaultName, type: moduleType.FOLDER })}
              >
                <FolderPlus />
              </IconAction>
              <IconAction label="Collapse all" onClick={() => setExpanded(new Set())}>
                <ChevronsDownUp />
              </IconAction>
              <IconAction label="Reload" onClick={refreshStructure}>
                <RefreshCw className={cn(isTreeLoading && "animate-spin")} />
              </IconAction>
            </div>
          ) : null}
        </div>

        {filterOpen || query ? (
          <div className="relative mb-1.5 mt-0.5 animate-fade-up">
            <ListFilter className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("")
                  setFilterOpen(false)
                }
              }}
              placeholder="Filter by name"
              className="h-7.5 w-full rounded-md border bg-background pr-7 pl-7.5 text-[13px] outline-none placeholder:text-subtle-foreground focus:border-brand/50 focus:ring-[3px] focus:ring-brand/15"
            />
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => {
                setQuery("")
                setFilterOpen(false)
              }}
              className="absolute top-1/2 right-1 inline-flex size-5.5 -translate-y-1/2 items-center justify-center rounded text-subtle-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-3">
          {status === "loading" || (isTreeLoading && !tree) ? (
            <div className="space-y-1 px-1 pt-1">
              {[72, 56, 64, 48, 80, 52, 60].map((width, index) => (
                <div key={index} className="flex h-7 items-center gap-2 px-1.5">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 rounded" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          ) : !vault ? (
            <p className="px-2 py-2 text-[13px] leading-5 text-subtle-foreground">
              Open a folder to see its files here.
            </p>
          ) : filtered.length > 0 ? (
            <ul role="tree" aria-label="Vault files" className="grid gap-px">
              {filtered.map((item) => (
                <TreeNode
                  key={keyOf(item)}
                  item={item}
                  depth={0}
                  currentPath={currentPath}
                  expanded={expanded}
                  forceOpen={Boolean(query)}
                  onToggle={toggle}
                  onNavigate={navigate}
                />
              ))}
            </ul>
          ) : (
            <div className="px-2 py-2 text-[13px] leading-5 text-subtle-foreground">
              {query ? (
                <>No matches for &ldquo;{query}&rdquo;.</>
              ) : (
                <>
                  This vault is empty.{" "}
                  <button
                    type="button"
                    className="font-medium text-brand hover:underline"
                    onClick={() => openCreateDialog({ targetSlugPath: [], targetName: vaultName, type: moduleType.FILE })}
                  >
                    Create a note
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="flex-row items-center justify-between border-t border-sidebar-border px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-subtle-foreground">
          <span className={cn("size-1.5 rounded-full", vault ? "bg-success" : "bg-subtle-foreground/50")} />
          {vault ? "Saved to disk" : "Not connected"}
        </div>
        <ThemeSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}

type TreeNodeProps = {
  item: VaultItem
  depth: number
  currentPath: string[]
  expanded: Set<string>
  forceOpen: boolean
  onToggle: (key: string, force?: boolean) => void
  onNavigate: (slugPath: string[]) => void
}

const TreeNode = ({ item, depth, currentPath, expanded, forceOpen, onToggle, onNavigate }: TreeNodeProps) => {
  const isFolder = item.kind === "folder"
  const slugPath = useMemo(() => item.path.map(toSlug), [item.path])
  const key = slugPath.join("/")
  const isOpen = isFolder && (forceOpen || expanded.has(key))
  const isActive = key === currentPath.join("/")
  const children = item.children ?? []
  const label = isFolder ? item.name : item.name.replace(/\.(md|markdown)$/i, "")

  return (
    <li role="treeitem" aria-expanded={isFolder ? isOpen : undefined} aria-selected={isActive}>
      <NodeActions
        item={item}
        menuButtonClassName="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
      >
        {(menuButton) => (
          <div
            className={cn(
              "group/row relative flex h-7 items-center gap-1 rounded-md pr-1 text-[13px] transition-colors",
              isActive
                ? "bg-sidebar-accent font-medium text-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
            )}
            style={{ paddingLeft: depth * 12 + 4 }}
          >
            {isFolder ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={isOpen ? "Collapse folder" : "Expand folder"}
                onClick={() => onToggle(key)}
                className="inline-flex size-5 shrink-0 items-center justify-center rounded text-subtle-foreground hover:text-foreground"
              >
                <ChevronRight className={cn("size-3.5 transition-transform duration-150", isOpen && "rotate-90")} />
              </button>
            ) : (
              <span className="size-5 shrink-0" />
            )}

            <button
              type="button"
              title={item.name}
              onClick={() => {
                if (isFolder) onToggle(key, true)
                onNavigate(slugPath)
              }}
              onKeyDown={(event) => {
                if (!isFolder) return
                if (event.key === "ArrowRight") onToggle(key, true)
                if (event.key === "ArrowLeft") onToggle(key, false)
              }}
              className="flex h-full min-w-0 flex-1 items-center gap-1.5 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileIcon name={item.name} kind={item.kind} open={isOpen} className="size-3.5" />
              <span className="truncate">{label}</span>
            </button>

            {menuButton}
          </div>
        )}
      </NodeActions>

      {isOpen && children.length > 0 ? (
        <ul role="group" className="relative grid gap-px pt-px">
          <span
            aria-hidden
            className="absolute top-0 bottom-1 w-px bg-sidebar-border"
            style={{ left: depth * 12 + 13 }}
          />
          {children.map((child) => (
            <TreeNode
              key={keyOf(child)}
              item={child}
              depth={depth + 1}
              currentPath={currentPath}
              expanded={expanded}
              forceOpen={forceOpen}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
