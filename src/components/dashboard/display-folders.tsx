"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import useVault from '@/hooks/use-vault'
import getFolderStructure, { VaultItem } from '@/lib/vaults/get-folder-structure'
import FolderCard from './folder-card'
import { FolderOpenIcon } from 'lucide-react'

const DisplayFolders = () => {
    const [folders, setFolders] = useState<VaultItem[] | null>(null)
    const [isEmpty, setIsEmpty] = useState(false)
    const params = useParams()
    const path = params.path as string[]
    const { vault } = useVault()

    useEffect(() => {
        const fetchStructure = async () => {
            if (!vault) return;
            try {
                setIsEmpty(false) // Reset empty state

                if (path && path.length > 0) {
                    console.log("path param", path)

                    // Navigate to the correct directory based on the path
                    let currentDir = vault;
                    for (const folderName of path) {
                        currentDir = await currentDir.getDirectoryHandle(folderName);
                    }

                    const structure = await getFolderStructure(vault, currentDir)
                    console.log("structure through param", structure)

                    if (structure.length === 0) {
                        setIsEmpty(true)
                    }
                    setFolders(structure)
                } else if (vault) {
                    const structure = await getFolderStructure(vault)
                    console.log("structure", structure)

                    if (structure.length === 0) {
                        setIsEmpty(true)
                    }
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
            <div className="flex flex-col items-center justify-center mt-16 text-gray-500">
                <FolderOpenIcon size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">This folder is empty</h3>
                <p className="text-sm">No files or folders found in this directory</p>
            </div>
        )
    }

    if (!folders) {
        return (
            <div className="text-gray-500 text-center mt-8">
                Loading folders...
            </div>
        )
    }


    return (
        <div className="w-full max-w-screen px-10 mt-8">
            {/* Optional: Show current path */}
            {path && path.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                    Current path: /{path.join('/')}
                </div>
            )}

            <div className="flex flex-wrap justify-start gap-4">
                {folders.map((folder) => (
                    <FolderCard key={folder.name} {...folder} />
                ))}
            </div>

            {/* Show item count */}
            <div className="mt-4 text-xs text-gray-500">
                {folders.length} item{folders.length !== 1 ? 's' : ''} found
            </div>
        </div>
    )
}

export default DisplayFolders