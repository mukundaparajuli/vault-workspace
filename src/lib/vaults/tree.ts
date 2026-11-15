import { toSlug } from "@/lib/core/utils"
import type { VaultItem } from "./get-folder-structure"

/** Depth-first list of every node in the tree. */
export const flattenTree = (items: VaultItem[], out: VaultItem[] = []): VaultItem[] => {
    for (const item of items) {
        out.push(item)
        if (item.children) flattenTree(item.children, out)
    }
    return out
}

/** Map a slug path from the URL to the real names using the cached tree. */
export const namesForSlugPath = (tree: VaultItem[] | null, slugPath: string[]): string[] | null => {
    if (!tree) return null

    const names: string[] = []
    let level: VaultItem[] = tree

    for (const slug of slugPath) {
        const match = level.find((item) => toSlug(item.name) === slug)
        if (!match) return null
        names.push(match.name)
        level = match.children ?? []
    }

    return names
}

/**
 * Resolve an Obsidian-style `[[target]]` by name anywhere in the vault.
 * Accepts bare names (`Roadmap`), names with extension, or partial paths
 * (`Projects/Roadmap`). Shortest matching path wins, like Obsidian.
 */
export const findByName = (tree: VaultItem[] | null, target: string): VaultItem | null => {
    if (!tree) return null

    const wanted = target.split("#")[0].trim().replace(/^\/+/, "").toLowerCase()
    if (!wanted) return null

    const candidates = [wanted, `${wanted}.md`, `${wanted}.excalidraw.md`, `${wanted}.excalidraw`]
    const matches = flattenTree(tree).filter((item) => {
        if (item.kind !== "file") return false
        const path = item.path.join("/").toLowerCase()
        return candidates.some((candidate) => path === candidate || path.endsWith(`/${candidate}`))
    })

    matches.sort((a, b) => a.path.length - b.path.length)
    return matches[0] ?? null
}
