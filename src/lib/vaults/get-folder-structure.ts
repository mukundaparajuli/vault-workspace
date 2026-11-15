import { fromSlug } from "@/lib/core/utils"

export type VaultItem = {
    name: string;
    kind: "file" | "folder";
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
    children?: VaultItem[];
    path: string[];
};

export type ResolvedNode = {
    name: string;
    kind: "file" | "folder";
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
    parent: FileSystemDirectoryHandle;
    path: string[];
};

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
    entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

const sortItems = (items: VaultItem[]): VaultItem[] =>
    items.sort((left, right) => {
        if (left.kind !== right.kind) {
            return left.kind === "folder" ? -1 : 1
        }

        return left.name.localeCompare(right.name, undefined, {
            numeric: true,
            sensitivity: "base",
        })
    })

/**
 * List the direct children of a directory without recursing into subfolders.
 * Prefer this over {@link getFolderStructure} whenever only one folder is needed.
 */
export const listDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string[] = []
): Promise<VaultItem[]> => {
    const items: VaultItem[] = []

    for await (const [name, handle] of (dirHandle as DirectoryHandleWithEntries).entries()) {
        const currentPath = [...parentPath, name]

        items.push({
            name,
            kind: handle.kind === "directory" ? "folder" : "file",
            handle: handle as FileSystemFileHandle | FileSystemDirectoryHandle,
            path: currentPath,
        })
    }

    return sortItems(items)
}

/**
 * Recursively build the full vault tree. This walks the entire vault, so it is
 * intended for the sidebar tree and other places that genuinely need everything.
 */
const getFolderStructure = async (
    vault: FileSystemDirectoryHandle,
    dirHandle?: FileSystemDirectoryHandle,
    parentPath: string[] = []
): Promise<VaultItem[]> => {
    const target = dirHandle ?? vault
    const items = await listDirectory(target, parentPath)

    for (const item of items) {
        if (item.kind === "folder") {
            item.children = await getFolderStructure(
                vault,
                item.handle as FileSystemDirectoryHandle,
                item.path
            )
        }
    }

    return items
}

/**
 * Resolve a slug path (as it appears in the URL) to the actual vault node,
 * returning the containing directory too. Returns null when any segment is missing.
 */
export const resolvePath = async (
    vault: FileSystemDirectoryHandle,
    slugPath: string[]
): Promise<ResolvedNode | null> => {
    if (!slugPath || slugPath.length === 0) {
        return {
            name: vault.name,
            kind: "folder",
            handle: vault,
            parent: vault,
            path: [],
        }
    }

    let parent: FileSystemDirectoryHandle = vault
    const actualPath: string[] = []

    for (let index = 0; index < slugPath.length; index += 1) {
        const slug = slugPath[index]
        const isLast = index === slugPath.length - 1
        const entries = await listDirectory(parent)

        const folderName = fromSlug(
            slug,
            entries.filter((item) => item.kind === "folder").map((item) => item.name)
        )

        if (folderName) {
            const dirHandle = await parent.getDirectoryHandle(folderName)
            actualPath.push(folderName)

            if (isLast) {
                return {
                    name: folderName,
                    kind: "folder",
                    handle: dirHandle,
                    parent,
                    path: [...actualPath],
                }
            }

            parent = dirHandle
            continue
        }

        if (isLast) {
            const fileName = fromSlug(
                slug,
                entries.filter((item) => item.kind === "file").map((item) => item.name)
            )

            if (fileName) {
                const fileHandle = await parent.getFileHandle(fileName)
                return {
                    name: fileName,
                    kind: "file",
                    handle: fileHandle,
                    parent,
                    path: [...actualPath, fileName],
                }
            }
        }

        return null
    }

    return null
}

export default getFolderStructure;
