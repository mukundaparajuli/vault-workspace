"use client"

import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { File, Folder } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { toSlug } from "@/lib/core/utils"

const FolderCard = (item: VaultItem) => {
    const router = useRouter()
    const params = useParams()
    const path = params.path as string[] | undefined

    const handleClick = () => {
        const currentPath = path || []
        const slug = toSlug(item.name)
        const nextPath = `/dashboard/${[...currentPath, slug].join("/")}`
        router.push(nextPath)
    }

    return (
        <div
            className="flex items-center p-4 bg-white hover:bg-gray-25 border-b border-gray-100 hover:border-gray-150 cursor-pointer group transition-colors duration-150"
            onClick={handleClick}
        >
            <div className="flex items-center mr-4">
                {item.kind === "folder" ? (
                    <Folder className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                ) : item.name.endsWith(".md") ? (
                    <File className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                ) : (
                    <File className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 text-sm group-hover:text-gray-900 transition-colors truncate">
                    {item.name}
                </h3>
                {item.kind === "file" && (
                    <p className="text-xs text-gray-400 mt-0.5">
                        {item.name.endsWith(".md") ? "Markdown file" : "Document"}
                    </p>
                )}
            </div>

            <div className="ml-4 flex-shrink-0">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    {item.kind}
                </span>
            </div>
        </div>
    )
}

export default FolderCard