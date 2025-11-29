const createFolder = async (baseHandle: FileSystemDirectoryHandle, folderName: string) => {
    let current = baseHandle;
    current = await current.getDirectoryHandle(folderName, { create: true });
    return current;
}

export default createFolder;