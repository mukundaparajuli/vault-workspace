import { decompressFromBase64 } from "lz-string"

/** The subset of an Excalidraw scene we need to render it. */
export type ExcalidrawScene = {
  elements: unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}

const isScene = (value: unknown): value is ExcalidrawScene =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as ExcalidrawScene).elements)

/** Whether a markdown file is an Obsidian Excalidraw drawing, regardless of its name. */
export const isExcalidrawMarkdown = (text: string) =>
  /^---[\s\S]*?excalidraw-plugin:[\s\S]*?---/.test(text.slice(0, 2000)) ||
  /```compressed-json\s*\n/.test(text)

/**
 * Parse a drawing from any of the formats found in vaults:
 *  - `.excalidraw` / `.excalidraw.json`: the scene as plain JSON
 *  - Obsidian `.excalidraw.md`: the scene in a ```json block, or LZ-string
 *    compressed in a ```compressed-json block (the plugin's default)
 */
export const parseExcalidraw = (text: string): ExcalidrawScene | null => {
  const trimmed = text.trim()

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      return isScene(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const compressed = /```compressed-json\s*\n([\s\S]*?)```/.exec(text)
  if (compressed) {
    try {
      const json = decompressFromBase64(compressed[1].replace(/\s+/g, ""))
      const parsed = json ? JSON.parse(json) : null
      if (isScene(parsed)) return parsed
    } catch {
      /* fall through to the plain json block */
    }
  }

  const plain = /```json\s*\n([\s\S]*?)```/.exec(text)
  if (plain) {
    try {
      const parsed = JSON.parse(plain[1])
      if (isScene(parsed)) return parsed
    } catch {
      return null
    }
  }

  return null
}
