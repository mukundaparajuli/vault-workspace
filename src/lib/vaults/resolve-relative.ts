/**
 * Resolve a path written inside a note (e.g. `../assets/diagram.png` or
 * `/attachments/photo.jpg`) to a file handle inside the vault.
 *
 * @param vault     Vault root handle.
 * @param baseDir   Actual (non-slug) folder names of the note's directory.
 * @param target    The raw path from the markdown source.
 */
export const resolveRelativeFile = async (
  vault: FileSystemDirectoryHandle,
  baseDir: string[],
  target: string
): Promise<FileSystemFileHandle | null> => {
  const clean = decodeURIComponent(target.split(/[?#]/)[0] ?? "").trim()

  if (!clean) return null

  const segments = clean.startsWith("/") ? [] : [...baseDir]

  for (const part of clean.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") {
      segments.pop()
      continue
    }
    segments.push(part)
  }

  const fileName = segments.pop()
  if (!fileName) return null

  try {
    let dir = vault
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment)
    }
    return await dir.getFileHandle(fileName)
  } catch {
    return null
  }
}

export const isExternalSource = (src: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)
