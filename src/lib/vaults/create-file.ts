/**
 * Creates a file inside a folder.
 * 
 * @param baseHandle - current folder where the user is in
 * @param fileName - name of the file that the user is trying to create
 * @param extension - extension of the file (@default .md)
 * @returns the handle to the deepest folder
 */

const createFile = async (baseHandle: FileSystemDirectoryHandle, fileName: string, extension: string = ".md") => {
    const fileHandle = await baseHandle.getFileHandle(`${fileName + extension}`, { create: true });
    return fileHandle;
}

export default createFile;