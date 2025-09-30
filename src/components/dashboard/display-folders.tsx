"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import useVault from '@/hooks/use-vault'
import getFolderStructure, { VaultItem } from '@/lib/vaults/get-folder-structure'
import FolderCard from './folder-card'
import { FolderOpenIcon } from 'lucide-react'
import { fromSlug } from '@/lib/core/utils'

const DisplayFolders = () => {
    const [folders, setFolders] = useState<VaultItem[] | null>(null)
    const [isEmpty, setIsEmpty] = useState(false)
    const params = useParams()
    const path = params.path as string[] | undefined
    const { vault } = useVault()

    useEffect(() => {
        const fetchStructure = async () => {
            if (!vault) return;
            try {
                setIsEmpty(false)

                if (path && path.length > 0) {
                    let currentDir = vault

                    // For each path segment, convert slug to actual folder name
                    for (let i = 0; i < path.length; i++) {
                        const slug = path[i]

                        // Get the current directory contents to find the actual folder name
                        const currentContents = await getFolderStructure(vault, currentDir)
                        const folderNames = currentContents
                            .filter(item => item.kind === "folder")
                            .map(item => item.name)

                        // Convert slug back to actual folder name
                        const actualFolderName = fromSlug(slug, folderNames)

                        if (!actualFolderName) {
                            console.error(`Could not find folder for slug: ${slug}`)
                            setIsEmpty(true)
                            return
                        }

                        currentDir = await currentDir.getDirectoryHandle(actualFolderName)
                    }

                    const structure = await getFolderStructure(vault, currentDir)
                    console.log("Fetched folder structure for path:", path, structure)
                    if (structure.length === 0) setIsEmpty(true)
                    setFolders(structure)
                } else if (vault) {
                    const structure = await getFolderStructure(vault)
                    if (structure.length === 0) setIsEmpty(true)
                    setFolders(structure)
                }
            } catch (error) {
                console.error("Failed to get folder structure:", error)
                setIsEmpty(true)
            }
        }

        fetchStructure()
    }, [path, vault])

    if (isEmpty || folders?.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                <FolderOpenIcon size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-700">This folder is empty</h3>
                <p className="text-sm text-gray-500">No files or folders found in this directory</p>
            </div>
        )
    }

    if (!folders) {
        return (
            <div className="text-gray-600 text-center mt-12">
                <div className="animate-pulse">
                    Loading folders...
                </div>
            </div>
        )
    }



    return (
        <div className="w-full max-w-screen px-8 mt-9">
            <div className="flex flex-col justify-start rounded-xl">
                {folders.map((folder) => (
                    <FolderCard key={folder.name} {...folder} />
                ))}
            </div>

            <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
                {folders.length} item{folders.length !== 1 ? 's' : ''} found
            </div>
        </div>
    )
}

export default DisplayFolders
