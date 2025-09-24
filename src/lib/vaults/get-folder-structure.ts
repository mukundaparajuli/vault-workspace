export type VaultItem = {
    name: string;
    kind: "file" | "folder";
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
    children?: VaultItem[];
}
const getFolderStructure = async (
    vault: FileSystemDirectoryHandle,
    dirHandle?: FileSystemDirectoryHandle
): Promise<VaultItem[]> => {
    if (!dirHandle) dirHandle = vault;

    const items: VaultItem[] = [];
    for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === "directory") {
            items.push({
                name,
                kind: "folder",
                handle,
                children: await getFolderStructure(vault, handle)
            });
        } else {
            items.push({
                name,
                kind: "file",
                handle
            });
        }
    }
    return items;
};


export default getFolderStructure;