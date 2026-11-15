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
