const exists = async (dir: FileSystemDirectoryHandle, name: string) => {
    try {
        await dir.getFileHandle(name)
        return true
    } catch {
        try {
            await dir.getDirectoryHandle(name)
            return true
        } catch {
            return false
        }
    }
}

/** Returns `name`, or `name (1).ext`, `name (2).ext`… if the name is taken. */
export const uniqueName = async (dir: FileSystemDirectoryHandle, name: string) => {
    if (!(await exists(dir, name))) return name

    const dot = name.lastIndexOf(".")
    const stem = dot > 0 ? name.slice(0, dot) : name
    const extension = dot > 0 ? name.slice(dot) : ""

    for (let index = 1; index < 1000; index += 1) {
        const candidate = `${stem} (${index})${extension}`
        if (!(await exists(dir, candidate))) return candidate
    }

    return `${stem} (${Date.now()})${extension}`
}

const uploadFile = async (baseHandle: FileSystemDirectoryHandle, file: File, name = file.name) => {
    const fileHandle = await baseHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return fileHandle;
};

/** Writes every file into `dir`, renaming on conflict. Returns the names written. */
export const uploadFiles = async (dir: FileSystemDirectoryHandle, files: File[]) => {
    const written: string[] = []

    for (const file of files) {
        const name = await uniqueName(dir, file.name)
        await uploadFile(dir, file, name)
        written.push(name)
    }

    return written
}

export default uploadFile;
