"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure from "@/lib/vaults/get-folder-structure"
import { fromSlug } from "@/lib/core/utils"
import DisplayFolders from "./display-folders"
import FileViewer from "./file-viewer"
import CreateModuleDialog from "./create-module-dialog"
import VaultExplorer from "../vault/vault-explorer"
import { Maximize2, X } from "lucide-react"

const VaultDisplay = () => {
    const { vault, isLoading } = useVault()
    const params = useParams()
    const path = params.path as string[] | undefined

    const [kind, setKind] = useState<"folder" | "file" | null>(null)
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
    const [fileName, setFileName] = useState("")
    const [isFullscreen, setIsFullscreen] = useState(false)


    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev)
    }, [])

    const exitFullscreen = useCallback(() => {
        setIsFullscreen(false)
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "f" || e.key === "F") {
                toggleFullscreen()
            }
            if (e.key === "Escape") {
                exitFullscreen()
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [toggleFullscreen, exitFullscreen])

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




    if (isLoading) return (
        <div className="h-full flex items-center justify-center">
            <div className="text-sm text-gray-400">Loading vault...</div>
        </div>
    )

    if (!vault) return (
        <div className="h-full flex flex-col items-center justify-center px-4">
            <VaultExplorer />
            <p className="mt-4 text-xs text-gray-400 text-center max-w-sm">
                Select a folder to use as your vault. Make sure your browser supports the File System Access API.
            </p>
        </div>
    )
    if (!kind) return (
        <div className="h-full flex items-center justify-center">
            <div className="text-sm text-gray-400">Loading...</div>
        </div>
    )
    return (
        <div className="relative w-full h-full overflow-hidden">
            {kind === "folder" && (
                <div className="absolute top-4 right-4 z-10">
                    <CreateModuleDialog />
                </div>
            )}
            {kind === "folder" ? (
                <DisplayFolders />
            ) : (
                fileHandle && (
                    <div className="h-full">
                        {!isFullscreen && (
                            <button
                                onClick={toggleFullscreen}
                                className="absolute top-2 right-2 z-20 p-2 rounded hover:bg-gray-100 transition-colors"
                                title="Fullscreen (F)"
                            >
                                <Maximize2 size={16} className="text-gray-500" />
                            </button>
                        )}

                        <div
                            className={isFullscreen ? "fixed inset-0 bg-white z-50 flex flex-col" : "h-full"}
                        >
                            {isFullscreen && (
                                <button
                                    onClick={toggleFullscreen}
                                    className="absolute top-4 right-4 z-50 p-2 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <X size={16} className="text-gray-500" />
                                </button>
                            )}
                            <FileViewer fileHandle={fileHandle} fileName={fileName} isFullScreen={isFullscreen} />
                        </div>
                    </div>
                )
            )}
        </div>
    )
}

export default VaultDisplay
