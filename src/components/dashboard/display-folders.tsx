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

                    for (let i = 0; i < path.length; i++) {
                        const slug = path[i]

                        const currentContents = await getFolderStructure(vault, currentDir)
                        const folderNames = currentContents
                            .filter(item => item.kind === "folder")
                            .map(item => item.name)

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
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <FolderOpenIcon size={48} className="text-gray-300 mb-4" />
                <h3 className="text-base font-medium mb-1 text-gray-600">This folder is empty</h3>
                <p className="text-sm text-gray-400">No files or folders found</p>
            </div>
        )
    }

    if (!folders) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                <div className="animate-pulse text-sm">Loading...</div>
            </div>
        )
    }



    return (
        <div className="h-full p-4 pt-6">
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                {folders.map((folder) => (
                    <FolderCard key={folder.name} {...folder} />
                ))}
            </div>

            <div className="mt-3 text-xs text-gray-400 px-1">
                {folders.length} item{folders.length !== 1 ? 's' : ''}
            </div>
        </div>
    )
}

export default DisplayFolders
