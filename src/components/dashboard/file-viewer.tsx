"use client"

import { useEffect, useState } from "react"
import MarkdownEditor from "./markdown-editor"

interface FileViewerProps {
    fileHandle: FileSystemFileHandle
    fileName: string
    isFullScreen?: boolean
}

const FileViewer: React.FC<FileViewerProps> = ({ fileHandle, fileName, isFullScreen }) => {
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
    }, [fileHandle, fileName])

    // Image
    if (fileType.startsWith("image/") && fileUrl) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
            </div>
        )
    }

    if (fileName.endsWith(".md")) {
        return (
            <div className="h-full w-full">
                <MarkdownEditor fileHandle={fileHandle} fileName={fileName} onClose={() => { }} />
            </div>
        )
    }

    if (fileType === "application/pdf" && fileUrl) {
        return (
            <iframe
                src={fileUrl}
                className={isFullScreen ? "w-full h-[100vh] border-0" : "w-full h-[calc(100vh-3rem)] border-0"}
                title={fileName}
            />
        )
    }

    if (fileType.startsWith("video/") && fileUrl) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black">
                <video
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    preload="metadata"
                    poster=""
                >
                    <source src={fileUrl} type={fileType} />
                    <source src={fileUrl} type="video/mp4" />
                    <source src={fileUrl} type="video/webm" />
                    <source src={fileUrl} type="video/ogg" />
                    <p className="text-white text-center p-4">
                        Your browser does not support the video tag or this video format.
                        <br />
                        Supported formats: MP4, WebM, OGG
                    </p>
                </video>
                <div className="text-white text-sm mt-2 opacity-75">
                    {fileName}
                </div>
            </div>
        )
    }



    return (
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[calc(100vh-4rem)]">
            {content}
        </pre>
    )
}

export default FileViewer
