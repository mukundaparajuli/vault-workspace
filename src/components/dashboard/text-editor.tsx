"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/core/utils"
import CodeMirror from "@uiw/react-codemirror"
import {
  BookOpen,
  Check,
  Columns2,
  Copy,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PenLine,
  TriangleAlert,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { buildExtensions } from "./editor-extensions"
import MarkdownPreview, { headingId } from "./markdown-preview"

type EditorMode = "write" | "split" | "read"
type SaveState = "saved" | "dirty" | "saving" | "error"

const MODES: Array<{ id: EditorMode; label: string; icon: typeof PenLine }> = [
  { id: "write", label: "Write", icon: PenLine },
  { id: "split", label: "Split", icon: Columns2 },
  { id: "read", label: "Read", icon: BookOpen },
]

const MODE_KEY = "vault:editor-mode"
const AUTOSAVE_DELAY = 700

export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const TextEditor = ({
  fileHandle,
  fileName,
  dirNames,
  isMarkdown,
  header,
}: {
  fileHandle: FileSystemFileHandle
  fileName: string
  dirNames: string[]
  isMarkdown: boolean
  header: (actions: ReactNode) => ReactNode
}) => {
  const [content, setContent] = useState<string | null>(null)
  const [savedContent, setSavedContent] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [mode, setMode] = useState<EditorMode>("write")
  const [focusMode, setFocusMode] = useState(false)
  const lastModified = useRef(0)
  const savingRef = useRef(false)

  const extensions = useMemo(() => buildExtensions(fileName, isMarkdown), [fileName, isMarkdown])
  const hasChanges = content !== null && content !== savedContent
  const effectiveMode: EditorMode = isMarkdown ? mode : "write"

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY)
    if (stored === "write" || stored === "split" || stored === "read") setMode(stored)
  }, [])

  const changeMode = (next: EditorMode) => {
    setMode(next)
    window.localStorage.setItem(MODE_KEY, next)
  }

  // Initial load
  useEffect(() => {
    let isMounted = true

    fileHandle
      .getFile()
      .then(async (file) => {
        const text = await file.text()
        if (!isMounted) return
        lastModified.current = file.lastModified
        setContent(text)
        setSavedContent(text)
      })
      .catch((error) => {
        console.error("Failed to load file:", error)
        if (isMounted) {
          setContent("")
          setSaveState("error")
        }
      })

    return () => {
      isMounted = false
    }
  }, [fileHandle])

  const save = useCallback(async () => {
    if (content === null || savingRef.current || content === savedContent) return

    savingRef.current = true
    setSaveState("saving")
    const snapshot = content

    try {
      const writable = await fileHandle.createWritable()
      await writable.write(snapshot)
      await writable.close()
      const file = await fileHandle.getFile()
      lastModified.current = file.lastModified
      setSavedContent(snapshot)
      setSaveState("saved")
    } catch (error) {
      console.error("Failed to save file:", error)
      setSaveState("error")
      toast.error("Couldn't save changes", { description: "Check that the vault folder is still available." })
    } finally {
      savingRef.current = false
    }
  }, [content, savedContent, fileHandle])

  // Autosave after a short pause in typing.
  useEffect(() => {
    if (!hasChanges) return
    setSaveState((state) => (state === "saving" ? state : "dirty"))
    const timeout = setTimeout(() => void save(), AUTOSAVE_DELAY)
    return () => clearTimeout(timeout)
  }, [content, hasChanges, save])

  // Pick up edits made outside the app (another editor, git pull…).
  useEffect(() => {
    const checkExternal = async () => {
      try {
        const file = await fileHandle.getFile()
        if (file.lastModified <= lastModified.current) return
        if (hasChanges) {
          toast.warning(`${fileName} changed on disk`, {
            description: "Your unsaved edits were kept. Saving will overwrite the disk version.",
          })
          lastModified.current = file.lastModified
          return
        }
        const text = await file.text()
        lastModified.current = file.lastModified
        setContent(text)
        setSavedContent(text)
      } catch {
        /* File may have been removed; the tree refresh will handle it. */
      }
    }

    window.addEventListener("focus", checkExternal)
    return () => window.removeEventListener("focus", checkExternal)
  }, [fileHandle, fileName, hasChanges])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault()
        void save()
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault()
        setFocusMode((value) => !value)
      }
      if (isMarkdown && mod && event.key.toLowerCase() === "e") {
        event.preventDefault()
        changeMode(mode === "read" ? "write" : "read")
      }
      if (event.key === "Escape" && focusMode) setFocusMode(false)
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [save, hasChanges, focusMode, isMarkdown, mode])

  // Flush pending edits when navigating away.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => () => void saveRef.current(), [])

  const stats = useMemo(() => {
    const text = content ?? ""
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    return {
      words,
      chars: text.length,
      lines: text.split("\n").length,
      minutes: Math.max(1, Math.round(words / 230)),
    }
  }, [content])

  const outline = useMemo(() => {
    if (!isMarkdown || !content) return []
    const items: Array<{ level: number; text: string; id: string }> = []
    let inFence = false
    for (const line of content.split("\n")) {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
      if (inFence) continue
      const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
      if (match) {
        const text = match[2].replace(/[*_`~]/g, "")
        items.push({ level: match[1].length, text, id: headingId(text) })
      }
    }
    return items
  }, [content, isMarkdown])

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(content ?? "")
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Couldn't access the clipboard")
    }
  }

  const actions = (
    <>
      <SaveIndicator state={hasChanges && saveState === "saved" ? "dirty" : saveState} onRetry={() => void save()} />

      {isMarkdown ? (
        <div className="inline-flex items-center rounded-lg border bg-background p-0.5" role="radiogroup" aria-label="Editor mode">
          {MODES.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  aria-label={label}
                  onClick={() => changeMode(id)}
                  className={cn(
                    "inline-flex h-6.5 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium text-subtle-foreground transition-colors hover:text-foreground",
                    mode === id && "bg-accent text-foreground shadow-xs",
                    id === "split" && "hidden lg:inline-flex"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="xl:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setFocusMode(true)}>
            <Maximize2 />
            Focus mode
            <DropdownMenuShortcut>⇧⌘F</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void copyAll()}>
            <Copy />
            Copy contents
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => downloadBlob(new Blob([content ?? ""], { type: "text/plain;charset=utf-8" }), fileName)}
          >
            <Download />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  const editor = (
    <CodeMirror
      value={content ?? ""}
      height="100%"
      theme="none"
      extensions={extensions}
      onChange={(value) => setContent(value)}
      autoFocus={effectiveMode === "write"}
      onCreateEditor={(view) => {
        // Fresh notes only hold a title: drop the caret below it, ready to type.
        const doc = view.state.doc
        if (doc.lines <= 3 && effectiveMode === "write") {
          view.dispatch({ selection: { anchor: doc.length } })
          view.focus()
        }
      }}
      basicSetup={{
        lineNumbers: !isMarkdown,
        foldGutter: !isMarkdown,
        highlightActiveLine: !isMarkdown,
        highlightActiveLineGutter: !isMarkdown,
        autocompletion: false,
        searchKeymap: true,
      }}
      className={cn("h-full", isMarkdown ? "cm-prose" : "cm-code")}
    />
  )

  const preview = (
    <div className="h-full overflow-y-auto">
      <div className="flex justify-center gap-10 px-6 pt-10 pb-[30vh] md:px-10">
        <article className="vault-prose prose w-full min-w-0">
          {content?.trim() ? (
            <MarkdownPreview content={content} dirNames={dirNames} />
          ) : (
            <p className="text-muted-foreground italic">This note is empty.</p>
          )}
        </article>
        {effectiveMode === "read" && outline.length > 1 ? <Outline items={outline} /> : null}
      </div>
    </div>
  )

  const body =
    content === null ? (
      <div className="mx-auto w-full max-w-[46rem] space-y-3 px-7 pt-10">
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
    ) : effectiveMode === "read" ? (
      preview
    ) : effectiveMode === "split" ? (
      <div className="grid h-full grid-cols-2 divide-x">
        <div className="min-h-0 overflow-hidden">{editor}</div>
        <div className="min-h-0 overflow-hidden bg-card/50">{preview}</div>
      </div>
    ) : (
      editor
    )

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background",
        focusMode && "fixed inset-0 z-50 animate-in fade-in-0 duration-200"
      )}
    >
      {focusMode ? (
        <div className="group/focus absolute top-0 right-0 z-10 flex items-center gap-2 p-3">
          <SaveIndicator state={hasChanges && saveState === "saved" ? "dirty" : saveState} onRetry={() => void save()} />
          <Button variant="ghost" size="sm" onClick={() => setFocusMode(false)}>
            <Minimize2 className="size-3.5" />
            Exit focus
            <kbd className="ml-1 font-sans text-[11px] text-subtle-foreground">Esc</kbd>
          </Button>
        </div>
      ) : (
        header(actions)
      )}

      <div className="min-h-0 flex-1 overflow-hidden">{body}</div>

      {!focusMode ? (
        <footer className="flex h-7 shrink-0 items-center justify-end gap-3 border-t px-3 text-[11.5px] tabular-nums text-subtle-foreground">
          {isMarkdown ? (
            <>
              <span>{stats.words.toLocaleString()} words</span>
              <span>{stats.chars.toLocaleString()} characters</span>
              <span className="hidden sm:inline">{stats.minutes} min read</span>
            </>
          ) : (
            <>
              <span>{stats.lines.toLocaleString()} lines</span>
              <span>{stats.chars.toLocaleString()} characters</span>
            </>
          )}
        </footer>
      ) : null}
    </div>
  )
}

const SaveIndicator = ({ state, onRetry }: { state: SaveState; onRetry: () => void }) => {
  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-destructive hover:bg-destructive/10"
      >
        <TriangleAlert className="size-3.5" />
        Retry save
      </button>
    )
  }

  return (
    <span
      aria-live="polite"
      className="hidden items-center gap-1.5 px-1 text-[12px] text-subtle-foreground md:inline-flex"
    >
      {state === "saving" ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          Saving
        </>
      ) : state === "dirty" ? (
        <>
          <span className="size-1.5 rounded-full bg-warning" />
          Edited
        </>
      ) : (
        <>
          <Check className="size-3.5 text-success" />
          Saved
        </>
      )}
    </span>
  )
}

const Outline = ({ items }: { items: Array<{ level: number; text: string; id: string }> }) => (
  <nav aria-label="Outline" className="sticky top-10 hidden h-fit max-h-[70vh] w-52 shrink-0 overflow-y-auto xl:block">
    <p className="mb-2 text-[11px] font-medium text-subtle-foreground">On this page</p>
    <ul className="space-y-0.5 border-l">
      {items.map((item, index) => (
        <li key={`${item.id}-${index}`}>
          <a
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault()
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="-ml-px block truncate border-l border-transparent py-1 text-[12.5px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            style={{ paddingLeft: 10 + (item.level - 1) * 10 }}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)

export default TextEditor
