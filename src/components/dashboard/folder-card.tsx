import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { File, Folder } from "lucide-react"
import { useRouter } from "next/navigation"
import { toSlug } from "@/lib/core/utils"
import { useParams } from "next/navigation"
import { useState } from "react"
import MarkdownEditor from "./markdown-editor"
import FileViewer from "./file-viewer"

const FolderCard = (folder: VaultItem) => {
    const router = useRouter()
    const params = useParams()
    const path = params.path as string[] | undefined
    const [showEditor, setShowEditor] = useState(false)
    const [showViewer, setShowViewer] = useState(false)

    const handleClick = () => {
        if (folder.kind === "folder") {
            const currentPath = path || []
            const folderSlug = toSlug(folder.name)
            const nextPath = `/dashboard/${[...currentPath, folderSlug].join('/')}`
            router.push(nextPath)
        } else if (folder.kind === "file") {
            if (folder.name.endsWith('.md')) {
                setShowEditor(true)
            } else {
                setShowViewer(true)
            }
        }
    }

    return (
        <>
            <div
                className={`w-48 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer ${folder.kind === "folder" ? "hover:border-gray-300 hover:scale-105" : "hover:border-gray-300"
                    }`}
                onClick={handleClick}
            >
                <div className="flex items-center space-x-3 mb-3">
                    {folder.kind === "folder" ? (
                        <Folder className="w-6 h-6 text-gray-700" />
                    ) : folder.name.endsWith('.md') ? (
                        <File className="w-5 h-5 text-green-600" />
                    ) : (
                        <File className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {folder.kind}
                    </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {folder.name}
                </h3>
                {folder.kind === "file" && (
                    <p className="text-xs text-gray-500 mt-1">
                        {folder.name.endsWith('.md') ? 'Click to edit' : 'Click to view'}
                    </p>
                )}
            </div>

            {/* Markdown Editor Modal */}
            {showEditor && (
                <MarkdownEditor
                    fileHandle={folder.handle as FileSystemFileHandle}
                    fileName={folder.name}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* File Viewer Modal */}
            {showViewer && (
                <FileViewer
                    fileHandle={folder.handle as FileSystemFileHandle}
                    fileName={folder.name}
                    onClose={() => setShowViewer(false)}
                />
            )}
        </>
    )
}

export default FolderCard
