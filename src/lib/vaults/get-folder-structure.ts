export type VaultItem = {
    name: string;
    kind: "file" | "folder";
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
    children?: VaultItem[];
    path: string[];
};

const getFolderStructure = async (
    vault: FileSystemDirectoryHandle,
    dirHandle?: FileSystemDirectoryHandle,
    parentPath: string[] = []
): Promise<VaultItem[]> => {
    if (!dirHandle) dirHandle = vault;

    const items: VaultItem[] = [];

    for await (const [name, handle] of (dirHandle as any).entries()) {
        const currentPath = [...parentPath, name];

        if (handle.kind === "directory") {
            items.push({
                name,
                kind: "folder",
                handle,
                path: currentPath,
                children: await getFolderStructure(vault, handle, currentPath),
            });
        } else {
            items.push({
                name,
                kind: "file",
                handle,
                path: currentPath,
            });
        }
    }

    return items;
};

export default getFolderStructure;
