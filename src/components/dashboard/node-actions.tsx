"use client"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import useVault from "@/hooks/use-vault"
import { moduleType, openCreateDialog } from "@/lib/core/constants"
import { getExtension } from "@/lib/core/file-kind"
import { removeRecent } from "@/lib/core/recent"
import { cn, sanitizePath, toHref, toSlug } from "@/lib/core/utils"
import { listDirectory, resolvePath, type VaultItem } from "@/lib/vaults/get-folder-structure"
import { deleteEntry, renameEntry } from "@/lib/vaults/manage"
import {
  ArrowUpRight,
  Copy,
  FilePlus2,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, type ComponentType, type ReactNode } from "react"
import { toast } from "sonner"

type MenuItemProps = {
  onSelect?: (event: Event) => void
  variant?: "default" | "destructive"
  children?: ReactNode
}

/**
 * Owns rename / delete dialogs and the handlers behind every node menu,
 * so the tree, folder list and grid share the same behaviour.
 */
export const useNodeActions = (item: VaultItem) => {
  const { vault, refreshStructure } = useVault()
  const router = useRouter()
  const params = useParams()
  const currentPath = sanitizePath((params.path as string[] | undefined) || [])

  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [value, setValue] = useState(item.name)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const itemSlugPath = (item.path ?? [item.name]).map(toSlug)
  const isFolder = item.kind === "folder"
  const kindLabel = isFolder ? "folder" : "file"

  const resolveParent = async () => {
    if (!vault) throw new Error("No vault is selected.")

    const parent = await resolvePath(vault, itemSlugPath.slice(0, -1))

    if (!parent || parent.kind !== "folder") {
      throw new Error("The containing folder could not be found.")
    }

    return parent.handle as FileSystemDirectoryHandle
  }

  const isCurrentOrInside = () =>
    currentPath.length >= itemSlugPath.length &&
    itemSlugPath.every((segment, index) => segment === currentPath[index])

  const handleRename = async () => {
    let nextName = value.trim()

    if (!nextName) {
      setError("Enter a name.")
      return
    }

    // Keep the original extension when the user removes it by accident.
    const originalExtension = getExtension(item.name)
    if (!isFolder && originalExtension && !getExtension(nextName)) {
      nextName = `${nextName}.${originalExtension}`
    }

    if (nextName === item.name) {
      setRenameOpen(false)
      return
    }

    if (/[\\/:*?"<>|]/.test(nextName)) {
      setError('Names can\'t contain \\ / : * ? " < > |')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const parent = await resolveParent()
      const entries = await listDirectory(parent)
      const isDuplicate = entries.some(
        (entry) => entry.name !== item.name && entry.name.toLowerCase() === nextName.toLowerCase()
      )

      if (isDuplicate) throw new Error("An item with that name already exists here.")

      await renameEntry(parent, item, nextName)
      if (vault) removeRecent(vault.name, itemSlugPath)
      refreshStructure()
      setRenameOpen(false)
      toast.success(`Renamed to ${nextName}`)

      if (isCurrentOrInside()) {
        const renamedSlugPath = [...itemSlugPath.slice(0, -1), toSlug(nextName)]
        const rest = currentPath.slice(itemSlugPath.length)
        router.replace(toHref([...renamedSlugPath, ...rest]))
      }
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Rename failed.")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setError(null)

    try {
      const parent = await resolveParent()
      const shouldNavigate = isCurrentOrInside()

      await deleteEntry(parent, item)
      if (vault) removeRecent(vault.name, itemSlugPath)
      refreshStructure()
      setDeleteOpen(false)
      toast.success(`Deleted ${item.name}`)

      if (shouldNavigate) {
        router.replace(toHref(itemSlugPath.slice(0, -1)))
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.")
    } finally {
      setBusy(false)
    }
  }

  const requestRename = () => {
    setValue(item.name)
    setError(null)
    setRenameOpen(true)
  }

  const requestDelete = () => {
    setError(null)
    setDeleteOpen(true)
  }

  const open = () => router.push(toHref(itemSlugPath))

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText((item.path ?? [item.name]).join("/"))
      toast.success("Path copied")
    } catch {
      toast.error("Couldn't access the clipboard")
    }
  }

  const createInside = (type: (typeof moduleType)[keyof typeof moduleType]) =>
    openCreateDialog({ targetSlugPath: itemSlugPath, targetName: item.name, type })

  /** Render the menu body with either dropdown or context-menu primitives. */
  const renderItems = (
    Item: ComponentType<MenuItemProps>,
    Separator: ComponentType<object>
  ) => (
    <>
      <Item onSelect={open}>
        <ArrowUpRight />
        Open
      </Item>
      {isFolder ? (
        <>
          <Separator />
          <Item onSelect={() => createInside(moduleType.FILE)}>
            <FilePlus2 />
            New note
          </Item>
          <Item onSelect={() => createInside(moduleType.FOLDER)}>
            <FolderPlus />
            New folder
          </Item>
          <Item onSelect={() => createInside(moduleType.UPLOAD)}>
            <Upload />
            Upload files
          </Item>
        </>
      ) : null}
      <Separator />
      <Item onSelect={() => void copyPath()}>
        <Copy />
        Copy path
      </Item>
      <Item onSelect={requestRename}>
        <Pencil />
        Rename
      </Item>
      <Separator />
      <Item variant="destructive" onSelect={requestDelete}>
        <Trash2 />
        Delete
      </Item>
    </>
  )

  const stem = isFolder ? value : value.replace(/\.[^.]+$/, "")

  const dialogs = (
    <>
      <Dialog open={renameOpen} onOpenChange={(next) => !busy && setRenameOpen(next)}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename {kindLabel}</DialogTitle>
            <DialogDescription>Choose a new name for &ldquo;{item.name}&rdquo;.</DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void handleRename()
            }}
          >
            <Input
              autoFocus
              value={value}
              aria-invalid={Boolean(error)}
              onFocus={(event) => event.currentTarget.setSelectionRange(0, stem.length)}
              onChange={(event) => {
                setValue(event.target.value)
                if (error) setError(null)
              }}
            />
            {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(next) => !busy && setDeleteOpen(next)}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-[18px]" />
            </div>
            <DialogTitle>Delete {kindLabel}?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{item.name}</span>
              {isFolder ? " and everything inside it" : ""} will be permanently removed from your
              disk. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  return { renderItems, dialogs, requestRename, requestDelete, open }
}

/**
 * Wraps a row with a right-click menu and hands it a "⋯" dropdown button to place
 * wherever the row wants it.
 */
export const NodeActions = ({
  item,
  children,
  menuButtonClassName,
}: {
  item: VaultItem
  children: (menuButton: ReactNode) => ReactNode
  menuButtonClassName?: string
}) => {
  const { renderItems, dialogs } = useNodeActions(item)

  const menuButton = (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${item.name}`}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground data-[state=open]:bg-foreground/[0.07] data-[state=open]:text-foreground data-[state=open]:opacity-100",
            menuButtonClassName
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48" onClick={(event) => event.stopPropagation()}>
        {renderItems(DropdownMenuItem, DropdownMenuSeparator)}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>{children(menuButton)}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuLabel>{item.name}</ContextMenuLabel>
          {renderItems(ContextMenuItem, ContextMenuSeparator)}
        </ContextMenuContent>
      </ContextMenu>
      {dialogs}
    </>
  )
}

export default NodeActions
