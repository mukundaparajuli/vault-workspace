"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import FolderCard from "./folder-card"
import { FolderOpen } from "lucide-react"
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
            <div className="w-full max-w-4xl mx-auto px-6">
                {/* Breadcrumb Navigation */}
                {path && path.length > 0 && (
                    <div className="py-6 border-b border-gray-100">
                        <Breadcrumb>
                            <div className="flex items-center">
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        onClick={() => router.push("/dashboard")}
                                        className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors text-sm"
                                    >
                                        Home
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {path.map((folderName, idx) => (
                                    <div key={folderName} className="flex items-center">
                                        <span className="mx-3 text-gray-300">/</span>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink
                                                onClick={() => {
                                                    const newPath = path?.slice(0, idx + 1) || []
                                                    router.push(`/dashboard/${newPath.join("/")}`)
                                                }}
                                                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors text-sm"
                                            >
                                                {folderName}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                    </div>
                                ))}
                            </div>
                        </Breadcrumb>
                    </div>
                )}

                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FolderOpen size={40} className="text-gray-300 mb-4" />
                    <h3 className="text-base font-medium mb-1 text-gray-600">
                        Empty folder
                    </h3>
                    <p className="text-sm text-gray-400">
                        No items found in this directory
                    </p>
                </div>
            </div>
        )
    }

    if (!folders) {
        return (
            <div className="w-full max-w-4xl mx-auto px-6">
                <div className="flex items-center justify-center py-24">
                    <div className="text-sm text-gray-400">Loading...</div>
                </div>
            </div>
        )
    }

    const handleBreadcrumbClick = (index: number) => {
        const newPath = path?.slice(0, index + 1) || []
        router.push(`/dashboard/${newPath.join("/")}`)
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-6">
            {/* Breadcrumb Navigation */}
            {path && path.length > 0 && (
                <div className="py-6 border-b border-gray-100">
                    <Breadcrumb>
                        <div className="flex items-center">
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    onClick={() => router.push("/dashboard")}
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors text-sm"
                                >
                                    Home
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {path.map((folderName, idx) => (
                                <div key={folderName} className="flex items-center">
                                    <span className="mx-3 text-gray-300">/</span>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            onClick={() => handleBreadcrumbClick(idx)}
                                            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors text-sm"
                                        >
                                            {folderName}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </div>
                    </Breadcrumb>
                </div>
            )}

            {/* Main Content */}
            <div className="py-6">
                <div className="space-y-0">
                    {folders.map((folder) => (
                        <FolderCard
                            key={folder.name}
                            {...folder}
                        // isLast={index === folders.length - 1}
                        />
                    ))}
                </div>
            </div>

            {/* Footer Info */}
            <div className="border-t border-gray-100 pt-4 pb-8">
                <p className="text-xs text-gray-400">
                    {folders.length} {folders.length === 1 ? 'item' : 'items'}
                </p>
            </div>
        </div>
    )
}

export default DisplayFolders