export type FileKind =
  | "markdown"
  | "excalidraw"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "code"
  | "data"
  | "text"
  | "archive"
  | "other"

const EXTENSIONS: Record<Exclude<FileKind, "other" | "excalidraw">, string[]> = {
  markdown: ["md", "markdown", "mdx"],
  image: ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp", "ico"],
  video: ["mp4", "webm", "mov", "m4v", "ogv"],
  audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
  pdf: ["pdf"],
  code: [
    "js", "jsx", "ts", "tsx", "mjs", "cjs", "css", "scss", "html", "py", "rb", "go", "rs",
    "java", "kt", "c", "h", "cpp", "cs", "php", "sh", "bash", "zsh", "sql", "swift", "lua",
  ],
  data: ["json", "yaml", "yml", "toml", "xml", "csv", "tsv", "ini", "env"],
  text: ["txt", "log", "rtf"],
  archive: ["zip", "tar", "gz", "rar", "7z"],
}

export const getExtension = (name: string): string => {
  const index = name.lastIndexOf(".")
  return index > 0 ? name.slice(index + 1).toLowerCase() : ""
}

/** `.excalidraw`, `.excalidraw.json` and Obsidian's `.excalidraw.md` drawings. */
export const isExcalidrawName = (name: string) => /\.excalidraw(\.(md|json))?$/i.test(name)

export const getFileKind = (name: string): FileKind => {
  if (isExcalidrawName(name)) return "excalidraw"

  const extension = getExtension(name)

  for (const [kind, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return kind as FileKind
    }
  }

  return "other"
}

/** Whether a file is safe to read as UTF-8 text and show in the text viewer. */
export const isTextKind = (kind: FileKind) =>
  kind === "markdown" || kind === "code" || kind === "data" || kind === "text"

export const stripExtension = (name: string) => {
  const index = name.lastIndexOf(".")
  return index > 0 ? name.slice(0, index) : name
}

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "just now"
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`

  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
