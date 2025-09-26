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
            className={`w-48 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-gray-300 hover:scale-105`}
            onClick={handleClick}
        >
            <div className="flex items-center space-x-3 mb-3">
                {item.kind === "folder" ? (
                    <Folder className="w-6 h-6 text-gray-700" />
                ) : item.name.endsWith(".md") ? (
                    <File className="w-5 h-5 text-green-600" />
                ) : (
                    <File className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {item.kind}
                </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {item.name}
            </h3>
            {item.kind === "file" && (
                <p className="text-xs text-gray-500 mt-1">
                    {item.name.endsWith(".md") ? "Click to edit" : "Click to view"}
                </p>
            )}
        </div>
    )
}

export default FolderCard
