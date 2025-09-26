"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure from "@/lib/vaults/get-folder-structure"
import { fromSlug } from "@/lib/core/utils"
import DisplayFolders from "./display-folders"
import FileViewer from "./file-viewer"
import CreateModuleDialog from "./create-module-dialog"
import VaultExplorer from "../vault/vault-explorer"

const VaultDisplay = () => {
    const { vault } = useVault()
    const params = useParams()
    const path = params.path as string[] | undefined

    const [kind, setKind] = useState<"folder" | "file" | null>(null)
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
    const [fileName, setFileName] = useState("")

    useEffect(() => {
        const resolvePath = async () => {
            if (!vault) return
            if (!path || path.length === 0) {
                setKind("folder")
                return
            }

            let currentDir = vault
            for (let i = 0; i < path.length - 1; i++) {
                const slug = path[i]
                const contents = await getFolderStructure(vault, currentDir)
                const folderNames = contents.filter(i => i.kind === "folder").map(i => i.name)
                const actualFolder = fromSlug(slug, folderNames)
                if (!actualFolder) return
                currentDir = await currentDir.getDirectoryHandle(actualFolder)
            }

            const lastSlug = path[path.length - 1]
            const contents = await getFolderStructure(vault, currentDir)

            const folderNames = contents.filter(i => i.kind === "folder").map(i => i.name)
            const actualFolder = fromSlug(lastSlug, folderNames)
            if (actualFolder) {
                setKind("folder")
                return
            }

            const fileNames = contents.filter(i => i.kind === "file").map(i => i.name)
            const actualFile = fromSlug(lastSlug, fileNames)
            if (actualFile) {
                const handle = await currentDir.getFileHandle(actualFile)
                setKind("file")
                setFileHandle(handle)
                setFileName(actualFile)
                return
            }
        }

        resolvePath()
    }, [vault, path])
    if (!vault) return <VaultExplorer />
    if (!kind) return <div className="text-gray-500 text-center">Loading...</div>
    return (
        <div className="relative w-full">
            {kind === "folder" &&
                <div className="absolute top-4 right-8 z-10">
                    <CreateModuleDialog />
                </div>
            }
            {
                kind === "folder" ? <DisplayFolders /> : (fileHandle && <FileViewer fileHandle={fileHandle} fileName={fileName} />)
            }
        </div>
    )

}

export default VaultDisplay
