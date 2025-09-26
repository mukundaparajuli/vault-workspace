import { VaultItem } from "./get-folder-structure"
import { toSlug } from "@/lib/core/utils"

type VaultItemWithContent = VaultItem & { content?: string }

// vaultRoot would be set when user selects the vault folder
let vaultRoot: VaultItemWithContent[] = []

export function setVaultRoot(root: VaultItem[]) {
    vaultRoot = root
}

export async function getFileByPath(path: string[]): Promise<VaultItemWithContent | null> {
    let current: VaultItemWithContent[] = vaultRoot
    let found: VaultItemWithContent | null = null

    for (const segment of path) {
        const match = current.find((item) => toSlug(item.name) === segment)
        if (!match) return null
        found = match
        current = match.kind === "folder" && match.children ? match.children : []
    }

    if (
        found?.kind === "file" &&
        found.handle &&
        "getFile" in found.handle &&
        typeof found.handle.getFile === "function"
    ) {
        const file = await (found.handle as FileSystemFileHandle).getFile();
        const text = await file.text();
        return { ...found, content: text };
    }

    return found
}
