"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import FolderCard from "./folder-card"
import { FolderOpenIcon } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { fromSlug } from "@/lib/core/utils"

const DisplayFolders = () => {
    const [folders, setFolders] = useState<VaultItem[] | null>(null)
    const [isEmpty, setIsEmpty] = useState(false)
    const params = useParams()
    const path = params.path as string[] | undefined
    const { vault } = useVault()
    const router = useRouter()

    useEffect(() => {
        const fetchStructure = async () => {
            if (!vault) return
            try {
                setIsEmpty(false)

                let currentDir = vault
                if (path && path.length > 0) {
                    for (let i = 0; i < path.length; i++) {
                        const slug = path[i]
                        const contents = await getFolderStructure(vault, currentDir)
                        const folderNames = contents.filter(i => i.kind === "folder").map(i => i.name)
                        const actualFolder = fromSlug(slug, folderNames)
                        if (!actualFolder) {
                            setIsEmpty(true)
                            return
                        }
                        currentDir = await currentDir.getDirectoryHandle(actualFolder)
                    }
                }

                const structure = await getFolderStructure(vault, currentDir)
                if (structure.length === 0) setIsEmpty(true)
                setFolders(structure)
            } catch (error) {
                console.error("Failed to load folder:", error)
                setIsEmpty(true)
            }
        }

        fetchStructure()
    }, [path, vault])

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                <FolderOpenIcon size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-700">
                    This folder is empty
                </h3>
                <p className="text-sm text-gray-500">
                    No files or folders found in this directory
                </p>
            </div>
        )
    }

    if (!folders) {
        return (
            <div className="text-gray-600 text-center mt-12">
                <div className="animate-pulse">Loading folders...</div>
            </div>
        )
    }

    const handleBreadcrumbClick = (index: number) => {
        const newPath = path?.slice(0, index + 1) || []
        router.push(`/dashboard/${newPath.join("/")}`)
    }

    return (
        <div className="w-full max-w-screen px-8">
            <div className="my-8">
                {path && path.length > 0 && (
                    <Breadcrumb>
                        <div className="flex items-center justify-start">
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    onClick={() => router.push("/dashboard")}
                                    className="text-gray-600 hover:text-gray-900 cursor-pointer"
                                >
                                    Home
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {path.map((folderName, idx) => (
                                <div key={folderName} className="flex items-center justify-start">
                                    <span className="mx-2 text-gray-400">/</span>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            onClick={() => handleBreadcrumbClick(idx)}
                                            className="text-gray-600 hover:text-gray-900 cursor-pointer"
                                        >
                                            {folderName}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </div>
                    </Breadcrumb>
                )}
            </div>

            <div className="flex flex-wrap justify-start gap-6">
                {folders.map(folder => (
                    <FolderCard key={folder.name} {...folder} />
                ))}
            </div>

            <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
                {folders.length} item{folders.length !== 1 ? "s" : ""} found
            </div>
        </div>
    )
}

export default DisplayFolders
