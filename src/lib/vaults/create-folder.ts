/**
 * Creates a folder inside a folder.
 * 
 * @param baseHandle - current folder where the user is in
 * @param folderName - name of the folder that the user is trying to create
 * @returns the handle to the deepest folder
 */

const createFolder = async (baseHandle: FileSystemDirectoryHandle, folderName: string) => {
    let current = baseHandle;
    current = await current.getDirectoryHandle(folderName, { create: true });
    return current;
}

export default createFolder;