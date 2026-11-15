"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shortcut } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import useVault from "@/hooks/use-vault"
import { moduleType, openCommandPalette, openCreateDialog } from "@/lib/core/constants"
import { parseExcalidraw, type ExcalidrawScene } from "@/lib/core/excalidraw"
import { formatBytes, formatRelativeTime, getFileKind } from "@/lib/core/file-kind"
import { useRecent } from "@/lib/core/recent"
import { cn, toHref, toSlug } from "@/lib/core/utils"
import { listDirectory, type VaultItem } from "@/lib/vaults/get-folder-structure"
import { uploadFiles } from "@/lib/vaults/upload-file"
import {
  ArrowDownUp,
  ChevronDown,
  Clock3,
  FilePlus2,
  FolderPlus,
  LayoutGrid,
  List,
  Plus,
  Search,
  Upload,
  UploadCloud,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import ExcalidrawSvg from "./excalidraw/excalidraw-svg"
import { FileIcon, FileTile, getKindMeta } from "./file-icon"
import NodeActions from "./node-actions"
import WorkspaceHeader from "./workspace-header"

type Entry = VaultItem & {
  size?: number
  modified?: number
  childCount?: number
  thumbnail?: string
  excerpt?: string
  drawing?: ExcalidrawScene
}

type ViewMode = "grid" | "list"
type SortKey = "name" | "modified" | "size"

const MAX_PREVIEW_ENTRIES = 80
const MAX_THUMB_BYTES = 8 * 1024 * 1024

const usePersistentState = <T extends string>(key: string, fallback: T, allowed: readonly T[]) => {
  const [value, setValue] = useState<T>(fallback)

  useEffect(() => {
    const stored = window.localStorage.getItem(key) as T | null
    if (stored && allowed.includes(stored)) setValue(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T) => {
      setValue(next)
      window.localStorage.setItem(key, next)
    },
    [key]
  )

  return [value, update] as const
}

const stripMarkdown = (text: string) =>
  text
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/!\[\[[^\]]*\]\]/g, "") // Obsidian embeds
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, alias?: string) => alias ?? target)
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+\[[ xX]\]/gm, " ")
    .replace(/^#{1,6}\s+.*$/m, "") // drop the first heading, it usually repeats the title
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 5) return "Working late"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const DisplayFolders = ({
  dirHandle,
  names,
}: {
  dirHandle: FileSystemDirectoryHandle
  names: string[]
}) => {
  const { vaultName, structureVersion, refreshStructure } = useVault()
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = usePersistentState<ViewMode>("vault:view", "grid", ["grid", "list"])
  const [sort, setSort] = usePersistentState<SortKey>("vault:sort", "name", ["name", "modified", "size"])
  const [isDragging, setIsDragging] = useState(false)
  const dragDepth = useRef(0)
  const objectUrls = useRef<string[]>([])

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])

  const isRoot = names.length === 0
  const slugPath = useMemo(() => names.map(toSlug), [names])
  const folderName = isRoot ? vaultName : names[names.length - 1]

  useEffect(() => {
    let isMounted = true
    const createdUrls: string[] = []

    const load = async () => {
      try {
        const items = await listDirectory(dirHandle, names)

        // Paint names immediately, then enrich with metadata.
        if (isMounted) setEntries((previous) => previous ?? items)

        const enriched = await Promise.all(
          items.map(async (item, index): Promise<Entry> => {
            try {
              if (item.kind === "folder") {
                let childCount = 0
                const dir = item.handle as FileSystemDirectoryHandle & {
                  keys: () => AsyncIterableIterator<string>
                }
                for await (const _ of dir.keys()) childCount += 1 // eslint-disable-line @typescript-eslint/no-unused-vars
                return { ...item, childCount }
              }

              const file = await (item.handle as FileSystemFileHandle).getFile()
              const entry: Entry = { ...item, size: file.size, modified: file.lastModified }

              if (index < MAX_PREVIEW_ENTRIES) {
                const kind = getFileKind(item.name)
                if (kind === "image" && file.size < MAX_THUMB_BYTES) {
                  entry.thumbnail = URL.createObjectURL(file)
                  createdUrls.push(entry.thumbnail)
                } else if (kind === "excalidraw" && file.size < 2 * 1024 * 1024) {
                  entry.drawing = parseExcalidraw(await file.text()) ?? undefined
                } else if (kind === "markdown" && file.size < 256 * 1024) {
                  entry.excerpt = stripMarkdown(await file.text())
                }
              }

              return entry
            } catch {
              return item
            }
          })
        )

        if (!isMounted) {
          createdUrls.forEach((url) => URL.revokeObjectURL(url))
          return
        }

        // Swap thumbnails only once the new ones are in place to avoid flashes.
        const previousUrls = objectUrls.current
        objectUrls.current = createdUrls
        setEntries(enriched)
        setError(null)
        requestAnimationFrame(() => previousUrls.forEach((url) => URL.revokeObjectURL(url)))
      } catch (loadError) {
        console.error("Failed to list folder:", loadError)
        if (isMounted) setError("This folder couldn't be read. It may have been moved or deleted.")
      }
    }

    void load()

    return () => {
      isMounted = false
    }
    // `names` is re-created on every resolve; the handle + version identify the folder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirHandle, structureVersion])

  const sorted = useMemo(() => {
    if (!entries) return null
    const folders = entries.filter((entry) => entry.kind === "folder")
    const files = entries.filter((entry) => entry.kind === "file")

    const compare = (a: Entry, b: Entry) => {
      if (sort === "modified") return (b.modified ?? 0) - (a.modified ?? 0)
      if (sort === "size") return (b.size ?? 0) - (a.size ?? 0)
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    }

    return [...folders.sort(compare), ...files.sort(compare)]
  }, [entries, sort])

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files ?? [])
    if (files.length === 0) return

    const promise = uploadFiles(dirHandle, files).then((written) => {
      refreshStructure()
      return written
    })

    toast.promise(promise, {
      loading: `Uploading ${files.length} file${files.length === 1 ? "" : "s"}…`,
      success: (written) => `Added ${written.length} file${written.length === 1 ? "" : "s"} to ${folderName}`,
      error: "Upload failed",
    })
  }

  const isFileDrag = (event: DragEvent) => event.dataTransfer.types.includes("Files")

  const target = { targetSlugPath: slugPath, targetName: folderName }

  const actions = (
    <>
      <div className="hidden items-center rounded-lg border bg-background p-0.5 sm:inline-flex">
        {(
          [
            { id: "grid", label: "Grid view", icon: LayoutGrid },
            { id: "list", label: "List view", icon: List },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={view === id}
            title={label}
            onClick={() => setView(id)}
            className={cn(
              "inline-flex size-6.5 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:text-foreground",
              view === id && "bg-accent text-foreground shadow-xs"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Sort">
            <ArrowDownUp className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="modified">Last modified</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="default" className="gap-1 pr-2">
            <Plus />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => openCreateDialog({ ...target, type: moduleType.FILE })}>
            <FilePlus2 />
            Note
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openCreateDialog({ ...target, type: moduleType.FOLDER })}>
            <FolderPlus />
            Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openCreateDialog({ ...target, type: moduleType.UPLOAD })}>
            <Upload />
            Upload files
            <DropdownMenuShortcut>drop</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <div
      className="relative flex h-full flex-col"
      onDragEnter={(event) => {
        if (!isFileDrag(event)) return
        dragDepth.current += 1
        setIsDragging(true)
      }}
      onDragOver={(event) => {
        if (isFileDrag(event)) event.preventDefault()
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setIsDragging(false)
      }}
      onDrop={(event) => void handleDrop(event)}
    >
      <WorkspaceHeader names={names} kind="folder" actions={actions} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 pt-8 pb-16 md:px-8 md:pt-10">
          <div className="animate-fade-up">
            {isRoot ? (
              <>
                <p className="text-[13px] text-muted-foreground">{greeting()}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{folderName}</h1>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">{folderName}</h1>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {entries ? `${entries.length} item${entries.length === 1 ? "" : "s"}` : "Loading…"}
                </p>
              </>
            )}
          </div>

          {isRoot ? <HomeOverview target={target} /> : null}

          <section className="mt-8">
            {isRoot ? (
              <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">All files</h2>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                {error}
              </p>
            ) : !sorted ? (
              <EntriesSkeleton view={view} />
            ) : sorted.length === 0 ? (
              <EmptyFolder target={target} />
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] sm:gap-3">
                {sorted.map((entry, index) => (
                  <GridCard
                    key={entry.path.join("/")}
                    entry={entry}
                    index={index}
                    onOpen={() => router.push(toHref(entry.path.map(toSlug)))}
                  />
                ))}
              </div>
            ) : (
              <ListTable entries={sorted} onOpen={(entry) => router.push(toHref(entry.path.map(toSlug)))} />
            )}
          </section>
        </div>
      </div>

      {isDragging ? (
        <div className="pointer-events-none absolute inset-2 top-14 z-20 flex animate-in items-center justify-center rounded-2xl border-2 border-dashed border-brand/60 bg-brand-soft backdrop-blur-[1px] fade-in-0">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-popover px-6 py-5 text-center shadow-lg">
            <UploadCloud className="size-6 text-brand" />
            <p className="text-sm font-medium">Drop to upload</p>
            <p className="text-[12.5px] text-muted-foreground">Files will be copied into {folderName}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const HomeOverview = ({ target }: { target: { targetSlugPath: string[]; targetName: string } }) => {
  const { vault, vaultName } = useVault()
  const recent = useRecent(vault?.name)
  const router = useRouter()

  const quickActions = [
    { label: "New note", hint: "Start writing", icon: FilePlus2, onClick: () => openCreateDialog({ ...target, type: moduleType.FILE }) },
    { label: "New folder", hint: "Organize notes", icon: FolderPlus, onClick: () => openCreateDialog({ ...target, type: moduleType.FOLDER }) },
    { label: "Upload", hint: "Add files", icon: Upload, onClick: () => openCreateDialog({ ...target, type: moduleType.UPLOAD }) },
    { label: "Search", hint: <Shortcut keys={["mod", "K"]} />, icon: Search, onClick: openCommandPalette },
  ]

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {quickActions.map(({ label, hint, icon: Icon, onClick }, index) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            style={{ animationDelay: `${60 + index * 40}ms` }}
            className="group flex animate-fade-up flex-col items-start gap-6 rounded-xl border bg-card p-3.5 text-left shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-foreground/15 hover:shadow-md"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium">{label}</p>
              <div className="mt-0.5 text-[12px] text-subtle-foreground">{hint}</div>
            </div>
          </button>
        ))}
      </div>

      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <Clock3 className="size-3.5" />
            Recently opened
          </h2>
          <div className="grid gap-1 sm:grid-cols-2">
            {recent.slice(0, 6).map((entry) => {
              const name = entry.names[entry.names.length - 1] ?? ""
              const parent = entry.names.slice(0, -1).join(" / ")
              return (
                <button
                  key={entry.slugPath.join("/")}
                  type="button"
                  onClick={() => router.push(toHref(entry.slugPath))}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent"
                >
                  <FileIcon name={name} kind="file" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{name.replace(/\.md$/i, "")}</p>
                    <p className="truncate text-[12px] text-subtle-foreground">{parent || vaultName}</p>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-subtle-foreground">
                    {formatRelativeTime(entry.openedAt)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </>
  )
}

const metaLine = (entry: Entry) => {
  if (entry.kind === "folder") {
    return entry.childCount === undefined ? "Folder" : `${entry.childCount} item${entry.childCount === 1 ? "" : "s"}`
  }
  const parts = [getKindMeta(entry.name).label]
  if (entry.modified) parts.push(formatRelativeTime(entry.modified))
  return parts.join(" · ")
}

const displayName = (entry: Entry) =>
  entry.kind === "file" ? entry.name.replace(/\.(md|markdown)$/i, "") : entry.name

const GridCard = ({ entry, index, onOpen }: { entry: Entry; index: number; onOpen: () => void }) => (
  <NodeActions
    item={entry}
    menuButtonClassName="absolute top-2 right-2 bg-card/90 opacity-0 shadow-xs ring-1 ring-border backdrop-blur group-hover/card:opacity-100 focus-visible:opacity-100"
  >
    {(menuButton) => (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onOpen()
          }
        }}
        style={{ animationDelay: `${Math.min(index, 16) * 18}ms` }}
        className="group/card relative flex animate-fade-up flex-col overflow-hidden rounded-xl border bg-card text-left shadow-xs outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-foreground/15 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <div className="relative flex h-28 items-center justify-center overflow-hidden border-b bg-muted/60">
          {entry.drawing ? (
            <ExcalidrawSvg
              scene={entry.drawing}
              padding={8}
              className="size-full p-2.5 transition-transform duration-300 group-hover/card:scale-[1.03]"
            />
          ) : entry.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.thumbnail}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
            />
          ) : entry.excerpt ? (
            <p className="line-clamp-5 h-full w-full px-3.5 pt-3 text-[11px] leading-[1.55] text-muted-foreground [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
              {entry.excerpt}
            </p>
          ) : (
            <FileTile name={entry.name} kind={entry.kind} className="size-11 rounded-xl" />
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <FileIcon name={entry.name} kind={entry.kind} className="size-3.5" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium" title={entry.name}>
              {displayName(entry)}
            </p>
            <p className="truncate text-[11.5px] text-subtle-foreground">{metaLine(entry)}</p>
          </div>
        </div>
        {menuButton}
      </div>
    )}
  </NodeActions>
)

const ListTable = ({ entries, onOpen }: { entries: Entry[]; onOpen: (entry: Entry) => void }) => (
  <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
    <div className="grid grid-cols-[1fr_auto_1.75rem] items-center gap-4 border-b bg-muted/50 px-3.5 py-2 text-[11.5px] font-medium text-subtle-foreground sm:grid-cols-[1fr_7rem_6rem_1.75rem]">
      <span>Name</span>
      <span className="hidden sm:block">Modified</span>
      <span className="text-right">Size</span>
      <span />
    </div>
    <ul className="divide-y">
      {entries.map((entry) => (
        <li key={entry.path.join("/")}>
          <NodeActions item={entry} menuButtonClassName="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100">
            {(menuButton) => (
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onOpen(entry)
                }}
                className="group/row grid cursor-default grid-cols-[1fr_auto_1.75rem] items-center gap-4 px-3.5 py-2 text-[13px] outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent sm:grid-cols-[1fr_7rem_6rem_1.75rem]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <FileIcon name={entry.name} kind={entry.kind} />
                  <span className="truncate font-medium" title={entry.name}>
                    {displayName(entry)}
                  </span>
                </span>
                <span className="hidden text-[12.5px] text-muted-foreground sm:block">
                  {entry.modified ? formatRelativeTime(entry.modified) : "—"}
                </span>
                <span className="text-right text-[12.5px] tabular-nums text-muted-foreground">
                  {entry.kind === "folder"
                    ? entry.childCount !== undefined
                      ? `${entry.childCount} items`
                      : "—"
                    : entry.size !== undefined
                      ? formatBytes(entry.size)
                      : "—"}
                </span>
                {menuButton}
              </div>
            )}
          </NodeActions>
        </li>
      ))}
    </ul>
  </div>
)

const EmptyFolder = ({ target }: { target: { targetSlugPath: string[]; targetName: string } }) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed bg-dots px-6 py-14 text-center">
    <div className="flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
      <UploadCloud className="size-5 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-[15px] font-semibold">This folder is empty</h3>
    <p className="mt-1 max-w-xs text-[13px] leading-6 text-muted-foreground">
      Create a note, add a subfolder, or drag files here from your computer.
    </p>
    <div className="mt-5 flex gap-2">
      <Button onClick={() => openCreateDialog({ ...target, type: moduleType.FILE })}>
        <FilePlus2 />
        New note
      </Button>
      <Button variant="outline" onClick={() => openCreateDialog({ ...target, type: moduleType.UPLOAD })}>
        <Upload />
        Upload
      </Button>
    </div>
  </div>
)

const EntriesSkeleton = ({ view }: { view: ViewMode }) =>
  view === "grid" ? (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[10.5rem] rounded-xl" />
      ))}
    </div>
  ) : (
    <div className="space-y-1.5">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-9 rounded-lg" />
      ))}
    </div>
  )

export default DisplayFolders
