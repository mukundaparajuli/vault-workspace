/**
 * Uploads a file to a directory.
 * 
 * @param baseHandle - current folder where the file should be uploaded
 * @param file - the file to upload
 * @returns the handle to the uploaded file
 */

const uploadFile = async (baseHandle: FileSystemDirectoryHandle, file: File) => {
    const fileHandle = await baseHandle.getFileHandle(file.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return fileHandle;
};

export default uploadFile;
