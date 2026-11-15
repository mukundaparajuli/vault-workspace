import { VaultItem } from "./get-folder-structure"

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
    entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

const copyFile = async (
    source: FileSystemFileHandle,
    parent: FileSystemDirectoryHandle,
    name: string
) => {
    const file = await source.getFile()
    const target = await parent.getFileHandle(name, { create: true })
    const writable = await target.createWritable()
    await writable.write(file)
    await writable.close()
}

const copyDirectory = async (
    source: FileSystemDirectoryHandle,
    parent: FileSystemDirectoryHandle,
    name: string
) => {
    const target = await parent.getDirectoryHandle(name, { create: true })

    for await (const [childName, handle] of (source as DirectoryHandleWithEntries).entries()) {
        if (handle.kind === "directory") {
            await copyDirectory(handle as FileSystemDirectoryHandle, target, childName)
        } else {
            await copyFile(handle as FileSystemFileHandle, target, childName)
        }
    }
}

/**
 * The File System Access API has no native rename, so this copies the entry
 * (recursively for folders) under the new name and then removes the original.
 */
export const renameEntry = async (
    parent: FileSystemDirectoryHandle,
    item: VaultItem,
    newName: string
) => {
    if (item.kind === "folder") {
        await copyDirectory(item.handle as FileSystemDirectoryHandle, parent, newName)
    } else {
        await copyFile(item.handle as FileSystemFileHandle, parent, newName)
    }

    await parent.removeEntry(item.name, { recursive: true })
}

export const deleteEntry = async (
    parent: FileSystemDirectoryHandle,
    item: VaultItem
) => {
    await parent.removeEntry(item.name, { recursive: true })
}
