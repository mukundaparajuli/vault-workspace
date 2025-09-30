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
    const { vault } = useVault()
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
                kind === "folder" ? <DisplayFolders /> : (fileHandle &&

                    <div>
                        {/* Fullscreen toggle button (normal mode) */}
                        {!isFullscreen && (
                            <button
                                onClick={toggleFullscreen}
                                className="absolute top-2 right-2 z-20 bg-gray-800 text-white p-2 rounded-full shadow hover:bg-gray-700"
                            >
                                <Maximize2 size={18} />
                            </button>
                        )}

                        {/* Exit fullscreen button (only visible on hover) */}

                        <div
                            style={
                                isFullscreen
                                    ? {
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        width: "100vw",
                                        height: "100vh",
                                        backgroundColor: "white",
                                        zIndex: 1000,
                                    }
                                    : {}
                            }
                        >
                            {isFullscreen && (
                                <div className="absolute top-2 right-2 z-9999 group">
                                    <button
                                        onClick={toggleFullscreen}
                                        className="opacity-100 group-hover:opacity-100 transition-opacity duration-200 bg-gray-600 text-white p-2 rounded-full shadow z-9999"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                            <FileViewer fileHandle={fileHandle} fileName={fileName} isFullScreen={isFullscreen} />
                        </div>

                    </div>

                )
            }
        </div>
    )

}

export default VaultDisplay
