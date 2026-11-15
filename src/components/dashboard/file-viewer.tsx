"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatBytes, getFileKind, isTextKind } from "@/lib/core/file-kind"
import { cn } from "@/lib/core/utils"
import { Download, ExternalLink, FileQuestion, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import DrawingViewer from "./excalidraw/drawing-viewer"
import { FileTile, getKindMeta } from "./file-icon"
import TextEditor, { downloadBlob } from "./text-editor"

const MAX_EDITABLE_BYTES = 5 * 1024 * 1024

type MediaState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: File; url: string }

interface FileViewerProps {
  fileHandle: FileSystemFileHandle
  /** Real names from the vault root to this file, inclusive. */
  names: string[]
  header: (actions: ReactNode) => ReactNode
}

const FileViewer = ({ fileHandle, names, header }: FileViewerProps) => {
  const fileName = names[names.length - 1] ?? fileHandle.name
  const kind = getFileKind(fileName)
  const dirNamesKey = names.slice(0, -1).join("/")
  const dirNames = useMemo(() => (dirNamesKey ? dirNamesKey.split("/") : []), [dirNamesKey])
  const [size, setSize] = useState<number | null>(null)

  useEffect(() => {
    fileHandle.getFile().then((file) => setSize(file.size)).catch(() => setSize(null))
  }, [fileHandle])

  if (kind === "excalidraw") {
    return <DrawingViewer fileHandle={fileHandle} fileName={fileName} dirNames={dirNames} header={header} />
  }

  if (isTextKind(kind)) {
    if (size === null) {
      return (
        <div className="flex h-full flex-col">
          {header(null)}
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-subtle-foreground" />
          </div>
        </div>
      )
    }

    if (size <= MAX_EDITABLE_BYTES) {
      return (
        <TextEditor
          fileHandle={fileHandle}
          fileName={fileName}
          dirNames={dirNames}
          isMarkdown={kind === "markdown"}
          header={header}
        />
      )
    }
  }

  return <MediaViewer fileHandle={fileHandle} fileName={fileName} header={header} />
}

const MediaViewer = ({
  fileHandle,
  fileName,
  header,
}: {
  fileHandle: FileSystemFileHandle
  fileName: string
  header: (actions: ReactNode) => ReactNode
}) => {
  const [state, setState] = useState<MediaState>({ status: "loading" })
  const [zoomed, setZoomed] = useState(false)
  const kind = getFileKind(fileName)

  useEffect(() => {
    let url: string | null = null
    let isMounted = true

    fileHandle
      .getFile()
      .then((file) => {
        if (!isMounted) return
        url = URL.createObjectURL(file)
        setState({ status: "ready", file, url })
      })
      .catch((error) => {
        console.error("Failed to load file:", error)
        if (isMounted) setState({ status: "error" })
      })

    return () => {
      isMounted = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [fileHandle])

  const ready = state.status === "ready" ? state : null

  const actions = ready ? (
    <>
      <span className="hidden px-1 text-[12px] tabular-nums text-subtle-foreground md:inline">
        {formatBytes(ready.file.size)}
      </span>
      {kind === "image" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={zoomed ? "Fit to screen" : "Actual size"} onClick={() => setZoomed((value) => !value)}>
              {zoomed ? <ZoomOut /> : <ZoomIn />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{zoomed ? "Fit to screen" : "Actual size"}</TooltipContent>
        </Tooltip>
      ) : null}
      {kind === "image" || kind === "pdf" || kind === "video" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open in new tab" onClick={() => window.open(ready.url, "_blank", "noopener")}>
              <ExternalLink />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open in new tab</TooltipContent>
        </Tooltip>
      ) : null}
      <Button variant="outline" onClick={() => downloadBlob(ready.file, fileName)}>
        <Download />
        <span className="hidden sm:inline">Download</span>
      </Button>
    </>
  ) : null

  let body: ReactNode

  if (state.status === "loading") {
    body = (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-subtle-foreground" />
      </div>
    )
  } else if (state.status === "error") {
    body = <Unsupported fileName={fileName} message="This file couldn't be read from disk." />
  } else if (kind === "image") {
    body = (
      <div className={cn("h-full overflow-auto bg-dots", !zoomed && "flex items-center justify-center p-6 md:p-10")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.url}
          alt={fileName}
          onClick={() => setZoomed((value) => !value)}
          className={cn(
            "animate-fade-up rounded-lg border bg-card shadow-lg",
            zoomed ? "m-6 max-w-none cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain"
          )}
        />
      </div>
    )
  } else if (kind === "video") {
    body = (
      <div className="flex h-full items-center justify-center bg-black">
        <video controls src={state.url} className="max-h-full max-w-full" preload="metadata" />
      </div>
    )
  } else if (kind === "audio") {
    body = (
      <div className="flex h-full items-center justify-center bg-dots p-6">
        <div className="w-full max-w-md animate-fade-up rounded-2xl border bg-card p-5 shadow-md">
          <div className="flex items-center gap-3">
            <FileTile name={fileName} kind="file" className="size-11 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-[12px] text-subtle-foreground">{formatBytes(state.file.size)}</p>
            </div>
          </div>
          <audio controls src={state.url} className="mt-5 w-full" />
        </div>
      </div>
    )
  } else if (kind === "pdf") {
    body = <iframe src={state.url} title={fileName} className="size-full border-0 bg-muted" />
  } else {
    body = (
      <Unsupported
        fileName={fileName}
        message={
          isTextKind(kind)
            ? "This file is too large to edit here."
            : `${getKindMeta(fileName).label} files can't be previewed yet.`
        }
        action={
          <Button variant="outline" onClick={() => downloadBlob(state.file, fileName)}>
            <Download />
            Download
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      {header(actions)}
      <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
    </div>
  )
}

const Unsupported = ({ fileName, message, action }: { fileName: string; message: string; action?: ReactNode }) => (
  <div className="flex h-full items-center justify-center bg-dots p-6">
    <div className="max-w-sm animate-fade-up text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-card shadow-sm">
        <FileQuestion className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 truncate text-[15px] font-semibold">{fileName}</h2>
      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  </div>
)

export default FileViewer
