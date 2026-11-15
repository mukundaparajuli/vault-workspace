"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import useVault from "@/hooks/use-vault"
import { pushRecent } from "@/lib/core/recent"
import { decodePathSegment, toSlug } from "@/lib/core/utils"
import { resolvePath } from "@/lib/vaults/get-folder-structure"
import { FileQuestion } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import DisplayFolders from "./display-folders"
import FileViewer from "./file-viewer"
import WelcomeScreen from "./welcome-screen"
import WorkspaceHeader from "./workspace-header"

type ViewState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "ready"
      kind: "folder" | "file"
      names: string[]
      handle: FileSystemFileHandle | FileSystemDirectoryHandle
    }

const VaultDisplay = () => {
  const { vault, vaultName, status, structureVersion } = useVault()
  const params = useParams()
  const router = useRouter()
  const rawPath = params.path as string[] | undefined
  // Stable key so resolving doesn't rerun on every render.
  const pathKey = (rawPath ?? []).join("/")
  const path = useMemo(() => (pathKey ? pathKey.split("/") : []), [pathKey])

  const [view, setView] = useState<ViewState>({ status: "loading" })

  useEffect(() => {
    let isMounted = true

    const resolveView = async () => {
      if (!vault) return

      try {
        const node = await resolvePath(vault, path.map(decodePathSegment))
        if (!isMounted) return

        if (!node) {
          setView({ status: "missing" })
          return
        }

        setView({ status: "ready", kind: node.kind, names: node.path, handle: node.handle })

        if (node.kind === "file") {
          pushRecent({ vault: vault.name, slugPath: node.path.map(toSlug), names: node.path })
        }
      } catch (error) {
        console.error("Failed to resolve path:", error)
        if (isMounted) setView({ status: "missing" })
      }
    }

    void resolveView()

    return () => {
      isMounted = false
    }
  }, [vault, path, structureVersion])

  if (status === "loading" || (status === "ready" && view.status === "loading")) {
    return <WorkspaceSkeleton />
  }

  if (status !== "ready" || !vault) {
    return <WelcomeScreen />
  }

  if (view.status === "missing") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center border-b px-3">
          <SidebarTrigger className="text-muted-foreground" />
        </div>
        <div className="flex flex-1 items-center justify-center bg-dots p-6">
          <div className="max-w-sm animate-fade-up text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
              <FileQuestion className="size-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold">Nothing here</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
              This item was moved, renamed, or deleted on disk.
            </p>
            <Button className="mt-5" variant="outline" onClick={() => router.push("/dashboard")}>
              Back to {vaultName}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (view.status !== "ready") return null

  if (view.kind === "folder") {
    return (
      <DisplayFolders
        key={view.names.join("/")}
        dirHandle={view.handle as FileSystemDirectoryHandle}
        names={view.names}
      />
    )
  }

  return (
    <FileViewer
      key={view.names.join("/")}
      fileHandle={view.handle as FileSystemFileHandle}
      names={view.names}
      header={(actions) => <WorkspaceHeader names={view.names} kind="file" actions={actions} />}
    />
  )
}

const WorkspaceSkeleton = () => (
  <div className="flex h-full flex-col">
    <div className="flex h-12 items-center gap-3 border-b px-3">
      <SidebarTrigger className="text-muted-foreground" />
      <Skeleton className="h-4 w-48 rounded" />
    </div>
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <Skeleton className="h-7 w-56 rounded-md" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
)

export default VaultDisplay
