const uploadFile = async (baseHandle: FileSystemDirectoryHandle, file: File) => {
    const fileHandle = await baseHandle.getFileHandle(file.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return fileHandle;
};

export default uploadFile;
