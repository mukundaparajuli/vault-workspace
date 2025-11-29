"use client"

import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { File, Folder, ChevronRight } from "lucide-react"
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
            className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer group transition-colors border-b border-gray-100 last:border-b-0"
            onClick={handleClick}
        >
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 group-hover:bg-gray-100 transition-colors">
                {item.kind === "folder" ? (
                    <Folder className="w-4 h-4 text-gray-500" />
                ) : (
                    <File className="w-4 h-4 text-gray-400" />
                )}
            </div>

            <div className="flex-1 min-w-0 ml-3">
                <span className="text-sm text-gray-700 group-hover:text-gray-800 transition-colors">
                    {item.name}
                </span>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
    )
}

export default FolderCard