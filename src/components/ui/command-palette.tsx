"use client"

import { FileIcon } from "@/components/dashboard/file-icon"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd, Shortcut } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import useVault from "@/hooks/use-vault"
import { moduleType, OPEN_COMMAND_PALETTE_EVENT, openCreateDialog } from "@/lib/core/constants"
import { useRecent } from "@/lib/core/recent"
import { toHref, toSlug } from "@/lib/core/utils"
import { flattenTree } from "@/lib/vaults/tree"
import {
  FilePlus2,
  FolderOpen,
  FolderPlus,
  House,
  LogOut,
  Monitor,
  Moon,
  PanelLeft,
  RefreshCw,
  Sun,
  Upload,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const MAX_RESULTS_WITHOUT_QUERY = 8

const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const { setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const { vault, vaultName, tree, chooseVault, clearVault, refreshStructure } = useVault()
  const recent = useRecent(vault?.name)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && (key === "k" || key === "p") && !event.shiftKey) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    const onOpen = () => setOpen(true)

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const nodes = useMemo(() => flattenTree(tree ?? []), [tree])

  const run = (action: () => void | Promise<unknown>) => {
    setOpen(false)
    void action()
  }

  const go = (slugPath: string[]) => run(() => router.push(toHref(slugPath)))

  const showFiles = query.trim().length > 0
  const recentKeys = new Set(recent.map((entry) => entry.slugPath.join("/")))

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search files and run commands"
      commandProps={{ loop: true }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={vault ? `Search ${vaultName}…` : "Type a command…"}
        trailing={<Kbd>Esc</Kbd>}
      />
      <CommandList>
        <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>

        {!showFiles && recent.length > 0 ? (
          <CommandGroup heading="Recent">
            {recent.slice(0, MAX_RESULTS_WITHOUT_QUERY).map((entry) => {
              const name = entry.names[entry.names.length - 1] ?? ""
              return (
                <CommandItem
                  key={`recent-${entry.slugPath.join("/")}`}
                  value={`recent ${entry.names.join("/")}`}
                  onSelect={() => go(entry.slugPath)}
                >
                  <FileIcon name={name} kind="file" />
                  <span className="truncate">{name.replace(/\.md$/i, "")}</span>
                  <span className="ml-auto truncate pl-3 text-[12px] text-subtle-foreground">
                    {entry.names.slice(0, -1).join(" / ")}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ) : null}

        {showFiles && nodes.length > 0 ? (
          <CommandGroup heading="Files">
            {nodes.map((node) => {
              const slugPath = node.path.map(toSlug)
              const key = slugPath.join("/")
              return (
                <CommandItem
                  key={`node-${key}`}
                  value={`${node.path.join("/")}${recentKeys.has(key) ? " recent" : ""}`}
                  keywords={[node.name]}
                  onSelect={() => go(slugPath)}
                >
                  <FileIcon name={node.name} kind={node.kind} />
                  <span className="truncate">
                    {node.kind === "file" ? node.name.replace(/\.md$/i, "") : node.name}
                  </span>
                  <span className="ml-auto truncate pl-3 text-[12px] text-subtle-foreground">
                    {node.path.slice(0, -1).join(" / ")}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ) : null}

        {vault ? (
          <CommandGroup heading="Create">
            <CommandItem value="new note create file" onSelect={() => run(() => openCreateDialog({ type: moduleType.FILE }))}>
              <FilePlus2 />
              New note
            </CommandItem>
            <CommandItem value="new folder create directory" onSelect={() => run(() => openCreateDialog({ type: moduleType.FOLDER }))}>
              <FolderPlus />
              New folder
            </CommandItem>
            <CommandItem value="upload files import" onSelect={() => run(() => openCreateDialog({ type: moduleType.UPLOAD }))}>
              <Upload />
              Upload files
            </CommandItem>
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Navigate">
          <CommandItem value="go home vault root" onSelect={() => go([])}>
            <House />
            Go to home
          </CommandItem>
          <CommandItem value="toggle sidebar" onSelect={() => run(toggleSidebar)}>
            <PanelLeft />
            Toggle sidebar
            <CommandShortcut>
              <Shortcut keys={["mod", "B"]} />
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Appearance">
          <CommandItem value="theme light mode" onSelect={() => run(() => setTheme("light"))}>
            <Sun />
            Light theme
          </CommandItem>
          <CommandItem value="theme dark mode" onSelect={() => run(() => setTheme("dark"))}>
            <Moon />
            Dark theme
          </CommandItem>
          <CommandItem value="theme system auto" onSelect={() => run(() => setTheme("system"))}>
            <Monitor />
            System theme
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Vault">
          <CommandItem
            value="open folder change vault switch"
            onSelect={() => run(async () => (await chooseVault()) && router.push("/dashboard"))}
          >
            <FolderOpen />
            {vault ? "Open another folder…" : "Open folder…"}
          </CommandItem>
          {vault ? (
            <>
              <CommandItem value="reload refresh vault from disk" onSelect={() => run(refreshStructure)}>
                <RefreshCw />
                Reload from disk
              </CommandItem>
              <CommandItem
                value="disconnect vault close clear"
                onSelect={() => run(async () => {
                  await clearVault()
                  router.push("/dashboard")
                })}
              >
                <LogOut />
                Disconnect vault
              </CommandItem>
            </>
          ) : null}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center gap-4 border-t bg-muted/40 px-4 py-2 text-[11.5px] text-subtle-foreground">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          open
        </span>
        <span className="ml-auto hidden sm:block">{nodes.length.toLocaleString()} items indexed</span>
      </div>
    </CommandDialog>
  )
}

export default CommandPalette
