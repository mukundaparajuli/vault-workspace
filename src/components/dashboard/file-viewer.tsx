"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure from "@/lib/vaults/get-folder-structure"
import { fromSlug } from "@/lib/core/utils"

interface FileViewerProps {
    fileHandle: FileSystemFileHandle
    fileName: string
}

const FileViewer: React.FC<FileViewerProps> = ({ fileHandle, fileName }) => {
    const [content, setContent] = useState<string>("")
    const [fileUrl, setFileUrl] = useState<string>("")
    const [fileType, setFileType] = useState<string>("")

    useEffect(() => {
        const load = async () => {
            const file = await fileHandle.getFile()
            setFileType(file.type)

            if (file.type.startsWith("image/")) {
                setFileUrl(URL.createObjectURL(file))
            } else if (
                file.type === "text/plain" ||
                file.type === "application/json" ||
                file.name.endsWith(".md")
            ) {
                setContent(await file.text())
            } else if (file.type === "application/pdf") {
                setFileUrl(URL.createObjectURL(file))
            }
        }
        load()
    }, [fileHandle])

    if (fileType.startsWith("image/") && fileUrl) {
        return <img src={fileUrl} alt={fileName} className="max-w-full h-auto" />
    }

    if (fileType === "application/pdf" && fileUrl) {
        return (
            <iframe src={fileUrl} className="w-full h-screen border-0" title={fileName} />
        )
    }

    return (
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">{content}</pre>
    )
}

export default FileViewer
