"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useVault from "@/hooks/use-vault"
import {
  moduleType,
  OPEN_CREATE_MODULE_DIALOG_EVENT,
  type CreateModuleEventDetail,
  type ModuleType,
} from "@/lib/core/constants"
import { formatBytes } from "@/lib/core/file-kind"
import { cn, decodePathSegment, toHref, toSlug } from "@/lib/core/utils"
import createFile from "@/lib/vaults/create-file"
import createFolder from "@/lib/vaults/create-folder"
import { listDirectory, resolvePath } from "@/lib/vaults/get-folder-structure"
import { uploadFiles } from "@/lib/vaults/upload-file"
import { FilePlus2, Folder, FolderPlus, Loader2, Upload, UploadCloud, X } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const TABS: Array<{ id: ModuleType; label: string; icon: typeof FilePlus2 }> = [
  { id: moduleType.FILE, label: "Note", icon: FilePlus2 },
  { id: moduleType.FOLDER, label: "Folder", icon: FolderPlus },
  { id: moduleType.UPLOAD, label: "Upload", icon: Upload },
]

const INVALID_NAME = /[\\/:*?"<>|]/

const CreateModuleDialog = () => {
  const { vault, vaultName, refreshStructure } = useVault()
  const router = useRouter()
  const params = useParams()
  const routePath = (params.path as string[] | undefined) ?? []

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ModuleType>(moduleType.FILE)
  const [target, setTarget] = useState<{ slugPath?: string[]; name?: string }>({})
  const [name, setName] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const openDialog = (event: Event) => {
      const detail = (event as CustomEvent<CreateModuleEventDetail>).detail ?? {}
      setType(detail.type ?? moduleType.FILE)
      setTarget({ slugPath: detail.targetSlugPath, name: detail.targetName })
      setName("")
      setFiles([])
      setError(null)
      setOpen(true)
    }

    window.addEventListener(OPEN_CREATE_MODULE_DIALOG_EVENT, openDialog)
    return () => window.removeEventListener(OPEN_CREATE_MODULE_DIALOG_EVENT, openDialog)
  }, [])

  /** Folder to create in: explicit target, else the current folder (or the open file's folder). */
  const resolveTargetDir = async () => {
    if (!vault) throw new Error("Open a vault first.")

    const node = await resolvePath(vault, target.slugPath ?? routePath.map(decodePathSegment))
    if (!node) throw new Error("That folder is no longer available.")

    return node.kind === "folder"
      ? { dir: node.handle as FileSystemDirectoryHandle, names: node.path }
      : { dir: node.parent, names: node.path.slice(0, -1) }
  }

  const submit = async () => {
    setError(null)

    const trimmed = name.trim()
    if (type !== moduleType.UPLOAD) {
      if (!trimmed) return setError("Give it a name.")
      if (INVALID_NAME.test(trimmed)) return setError('Names can\'t contain \\ / : * ? " < > |')
    } else if (files.length === 0) {
      return setError("Choose at least one file.")
    }

    setBusy(true)

    try {
      const { dir, names } = await resolveTargetDir()

      if (type === moduleType.UPLOAD) {
        const written = await uploadFiles(dir, files)
        refreshStructure()
        toast.success(`Uploaded ${written.length} file${written.length === 1 ? "" : "s"}`)
        setOpen(false)
        return
      }

      const existing = await listDirectory(dir)

      if (type === moduleType.FILE) {
        const stem = trimmed.replace(/\.md$/i, "")
        const fileName = `${stem}.md`
        if (existing.some((item) => item.name.toLowerCase() === fileName.toLowerCase())) {
          throw new Error("A note with that name already exists here.")
        }
        await createFile(dir, stem, ".md", `# ${stem}\n\n`)
        refreshStructure()
        setOpen(false)
        router.push(toHref([...names, fileName].map(toSlug)))
        return
      }

      if (existing.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("Something with that name already exists here.")
      }
      await createFolder(dir, trimmed)
      refreshStructure()
      toast.success(`Created ${trimmed}`)
      setOpen(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((previous) => {
      const seen = new Set(previous.map((file) => file.name))
      return [...previous, ...Array.from(list).filter((file) => !seen.has(file.name))]
    })
    setError(null)
  }

  const locationName = target.name ?? (routePath.length ? undefined : vaultName)

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[26rem]">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle>Create</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-[13px]">
            <Folder className="size-3.5" />
            {locationName ? (
              <>
                in <span className="font-medium text-foreground">{locationName}</span>
              </>
            ) : (
              "in the current folder"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5">
          <div role="tablist" className="grid grid-cols-3 rounded-lg bg-muted p-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={type === id}
                onClick={() => {
                  setType(id)
                  setError(null)
                }}
                className={cn(
                  "inline-flex h-7.5 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                  type === id && "bg-background text-foreground shadow-sm"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="space-y-2 px-5 pt-4 pb-5">
            {type === moduleType.UPLOAD ? (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files)
                    event.target.value = ""
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    addFiles(event.dataTransfer.files)
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors hover:border-foreground/25 hover:bg-accent/50",
                    dragging && "border-brand bg-brand-soft"
                  )}
                >
                  <UploadCloud className={cn("size-6 text-subtle-foreground", dragging && "text-brand")} />
                  <span className="text-[13px] font-medium">Drop files or click to browse</span>
                  <span className="text-[12px] text-subtle-foreground">Copies are written into the folder</span>
                </button>

                {files.length > 0 ? (
                  <ul className="max-h-36 divide-y overflow-y-auto rounded-lg border">
                    {files.map((file) => (
                      <li key={file.name} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="shrink-0 text-[12px] tabular-nums text-subtle-foreground">
                          {formatBytes(file.size)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => setFiles((previous) => previous.filter((item) => item !== file))}
                          className="inline-flex size-5 items-center justify-center rounded text-subtle-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>
                <Label htmlFor="create-name" className="text-[13px]">
                  {type === moduleType.FILE ? "Note title" : "Folder name"}
                </Label>
                <div className="relative">
                  <Input
                    id="create-name"
                    autoFocus
                    autoComplete="off"
                    value={name}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (error) setError(null)
                    }}
                    placeholder={type === moduleType.FILE ? "Weekly review" : "Projects"}
                    className={cn(type === moduleType.FILE && "pr-11")}
                  />
                  {type === moduleType.FILE ? (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[12px] text-subtle-foreground">
                      .md
                    </span>
                  ) : null}
                </div>
              </>
            )}

            {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="border-t bg-muted/40 px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {type === moduleType.UPLOAD
                ? `Upload${files.length ? ` ${files.length}` : ""}`
                : type === moduleType.FILE
                  ? "Create note"
                  : "Create folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateModuleDialog
