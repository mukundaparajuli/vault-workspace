"use client"

import { useEffect, useState } from "react"
import ReactPlayer from "react-player"
import MarkdownEditor from "./markdown-editor"

interface FileViewerProps {
    fileHandle: FileSystemFileHandle
    fileName: string
}

const FileViewer: React.FC<FileViewerProps> = ({ fileHandle, fileName }) => {
    const [content, setContent] = useState<string>("")
    const [fileUrl, setFileUrl] = useState<string>("")
    const [fileType, setFileType] = useState<string>("")

    useEffect(() => {
        let url: string | null = null

        const loadFile = async () => {
            const file = await fileHandle.getFile()
            setFileType(file.type)

            if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf") {
                url = URL.createObjectURL(file)
                setFileUrl(url)
            } else if (
                file.type === "text/plain" ||
                file.type === "application/json" ||
                file.name.endsWith(".md")
            ) {
                setContent(await file.text())
            }
        }

        loadFile()

        return () => {
            if (url) URL.revokeObjectURL(url)
        }
    }, [fileHandle])

    // Image
    if (fileType.startsWith("image/") && fileUrl) {
        return <img src={fileUrl} alt={fileName} className="max-w-full h-auto" />
    }

    //Markdown
    if (fileName.endsWith(".md")) {
        return (
            <MarkdownEditor fileHandle={fileHandle} fileName={fileName} onClose={() => { }} />
        )
    }

    // PDF
    if (fileType === "application/pdf" && fileUrl) {
        return (
            <iframe
                src={fileUrl}
                className="w-full h-[calc(100vh-2rem)] border-0"
                title={fileName}
            />
        )
    }

    // Video
    if (fileType.startsWith("video/") && fileUrl) {
        return <ReactPlayer src={fileUrl} controls width="100%" height="100%" />
    }



    // Plain text / JSON
    return (
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[calc(100vh-4rem)]">
            {content}
        </pre>
    )
}

export default FileViewer
