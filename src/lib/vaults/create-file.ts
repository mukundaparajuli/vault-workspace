const createFile = async (baseHandle: FileSystemDirectoryHandle, fileName: string, extension: string = ".md") => {
    const fileHandle = await baseHandle.getFileHandle(`${fileName + extension}`, { create: true });
    return fileHandle;
}

export default createFile;