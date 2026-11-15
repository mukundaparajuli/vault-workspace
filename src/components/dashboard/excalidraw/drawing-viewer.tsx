"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { parseExcalidraw, type ExcalidrawScene } from "@/lib/core/excalidraw"
import { stripExtension } from "@/lib/core/file-kind"
import { Code2, Download, FileImage, Loader2, MoreHorizontal, PenTool } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import TextEditor, { downloadBlob } from "../text-editor"
import { loadExcalidraw } from "./load"

const ExcalidrawCanvas = dynamic(() => loadExcalidraw().then(() => import("./excalidraw-canvas")), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-dots">
      <Loader2 className="size-5 animate-spin text-subtle-foreground" />
    </div>
  ),
})

type State =
  | { status: "loading" }
  | { status: "ready"; scene: ExcalidrawScene; text: string }
  | { status: "invalid"; text: string }

const baseName = (fileName: string) => stripExtension(fileName.replace(/\.(md|json)$/i, ""))

const DrawingViewer = ({
  fileHandle,
  fileName,
  dirNames,
  header,
}: {
  fileHandle: FileSystemFileHandle
  fileName: string
  dirNames: string[]
  header: (actions: ReactNode) => ReactNode
}) => {
  const [state, setState] = useState<State>({ status: "loading" })
  const [showSource, setShowSource] = useState(false)
  const { resolvedTheme } = useTheme()
  const isMarkdown = /\.md$/i.test(fileName)

  useEffect(() => {
    if (showSource) return
    let cancelled = false

    // Re-read when returning from source view so edits there show up.
    fileHandle
      .getFile()
      .then((file) => file.text())
      .then((text) => {
        if (cancelled) return
        const scene = parseExcalidraw(text)
        setState(scene ? { status: "ready", scene, text } : { status: "invalid", text })
      })
      .catch(() => !cancelled && setState({ status: "invalid", text: "" }))

    return () => {
      cancelled = true
    }
  }, [fileHandle, showSource])

  const exportImage = async (type: "svg" | "png") => {
    if (state.status !== "ready") return
    try {
      const { exportToBlob, exportToSvg, restoreElements } = await loadExcalidraw()
      const options = {
        elements: restoreElements(state.scene.elements as never, null),
        appState: { ...(state.scene.appState ?? {}), exportBackground: true } as never,
        files: (state.scene.files ?? null) as never,
      }
      const blob =
        type === "svg"
          ? new Blob([(await exportToSvg(options)).outerHTML], { type: "image/svg+xml" })
          : await exportToBlob({ ...options, mimeType: "image/png", quality: 1 })
      downloadBlob(blob, `${baseName(fileName)}.${type}`)
    } catch (error) {
      console.error(error)
      toast.error("Export failed")
    }
  }

  const sourceToggle = isMarkdown ? (
    <Button variant="outline" onClick={() => setShowSource((value) => !value)}>
      {showSource ? <PenTool /> : <Code2 />}
      <span className="hidden sm:inline">{showSource ? "View drawing" : "View source"}</span>
    </Button>
  ) : null

  if (showSource) {
    return (
      <TextEditor
        fileHandle={fileHandle}
        fileName={fileName}
        dirNames={dirNames}
        isMarkdown
        header={(actions) => header(<>{sourceToggle}{actions}</>)}
      />
    )
  }

  const actions = (
    <>
      {sourceToggle}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions" disabled={state.status === "loading"}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={state.status !== "ready"} onSelect={() => void exportImage("png")}>
            <FileImage />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem disabled={state.status !== "ready"} onSelect={() => void exportImage("svg")}>
            <FileImage />
            Export as SVG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              void fileHandle.getFile().then((file) => downloadBlob(file, fileName))
            }
          >
            <Download />
            Download original
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <div className="flex h-full flex-col">
      {header(actions)}
      <div className="relative min-h-0 flex-1">
        {state.status === "loading" ? (
          <div className="flex size-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-subtle-foreground" />
          </div>
        ) : state.status === "invalid" ? (
          <div className="flex size-full items-center justify-center bg-dots p-6">
            <div className="max-w-sm animate-fade-up text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-card shadow-sm">
                <PenTool className="size-5 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-[15px] font-semibold">This drawing couldn&apos;t be read</h2>
              <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                The file doesn&apos;t contain Excalidraw scene data, or it&apos;s in a format this viewer
                doesn&apos;t understand.
              </p>
              {isMarkdown ? (
                <Button className="mt-5" variant="outline" onClick={() => setShowSource(true)}>
                  <Code2 />
                  View source
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <ExcalidrawCanvas key={resolvedTheme} scene={state.scene} dark={resolvedTheme === "dark"} />
        )}
      </div>
    </div>
  )
}

export default DrawingViewer
