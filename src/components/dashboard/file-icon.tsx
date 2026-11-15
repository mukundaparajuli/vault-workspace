import { getFileKind, type FileKind } from "@/lib/core/file-kind"
import { cn } from "@/lib/core/utils"
import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileJson2,
  FileText,
  FileVideo,
  File as FileGeneric,
  Folder,
  FolderOpen,
  NotebookText,
  type LucideIcon,
} from "lucide-react"

const KIND_META: Record<FileKind, { icon: LucideIcon; tint: string; label: string }> = {
  markdown: { icon: NotebookText, tint: "text-brand", label: "Note" },
  image: { icon: FileImage, tint: "text-emerald-600 dark:text-emerald-400", label: "Image" },
  video: { icon: FileVideo, tint: "text-rose-600 dark:text-rose-400", label: "Video" },
  audio: { icon: FileAudio, tint: "text-fuchsia-600 dark:text-fuchsia-400", label: "Audio" },
  pdf: { icon: FileText, tint: "text-red-600 dark:text-red-400", label: "PDF" },
  code: { icon: FileCode2, tint: "text-sky-600 dark:text-sky-400", label: "Code" },
  data: { icon: FileJson2, tint: "text-amber-600 dark:text-amber-400", label: "Data" },
  text: { icon: FileText, tint: "text-muted-foreground", label: "Text" },
  archive: { icon: FileArchive, tint: "text-orange-600 dark:text-orange-400", label: "Archive" },
  other: { icon: FileGeneric, tint: "text-subtle-foreground", label: "File" },
}

export const getKindMeta = (name: string) => KIND_META[getFileKind(name)]

export const FileIcon = ({
  name,
  kind,
  open,
  className,
}: {
  name: string
  kind: "file" | "folder"
  open?: boolean
  className?: string
}) => {
  if (kind === "folder") {
    const Icon = open ? FolderOpen : Folder
    return <Icon className={cn("size-4 shrink-0 text-muted-foreground", className)} />
  }

  const { icon: Icon, tint } = getKindMeta(name)
  return <Icon className={cn("size-4 shrink-0", tint, className)} />
}

/** A larger tile-style icon used in grid views and headers. */
export const FileTile = ({
  name,
  kind,
  className,
}: {
  name: string
  kind: "file" | "folder"
  className?: string
}) => (
  <div
    className={cn(
      "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card shadow-xs",
      className
    )}
  >
    <FileIcon name={name} kind={kind} className="size-[18px]" />
  </div>
)
