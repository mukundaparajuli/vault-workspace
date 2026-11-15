const createFile = async (
    baseHandle: FileSystemDirectoryHandle,
    fileName: string,
    extension: string = ".md",
    initialContent?: string
) => {
    const fileHandle = await baseHandle.getFileHandle(`${fileName + extension}`, { create: true });

    if (initialContent) {
        const writable = await fileHandle.createWritable();
        await writable.write(initialContent);
        await writable.close();
    }

    return fileHandle;
}

export default createFile;
