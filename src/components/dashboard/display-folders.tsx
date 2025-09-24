"use client"

import useSelectedFolderContext from '@/contexts/RootFolderContext'
import useVault from '@/hooks/use-vault';
import getFolderStructure, { VaultItem } from '@/lib/vaults/get-folder-structure';
import React, { useEffect, useState } from 'react'
import FolderCard from './folder-card';

const DisplayFolders = () => {
    const [folders, setFolders] = useState<VaultItem[] | null>(null);
    const { selectedFolder } = useSelectedFolderContext();
    const { vault } = useVault();

    useEffect(() => {
        if (selectedFolder) {
            setFolders(selectedFolder);
        } else if (vault) {
            const fetchStructure = async () => {
                try {
                    const structure = await getFolderStructure(vault);
                    console.log("structure", structure);
                    setFolders(structure);
                } catch (error) {
                    console.error("Failed to get folder structure:", error);
                }
            };
            fetchStructure();
        }
    }, [selectedFolder, vault]);

    console.log("folders", folders);
    if (!folders) return <div>Loading...</div>;

    return (
        <div className='w-full px-20 max-w-screen flex flex-col items-center justify-start mt-8'>
            DisplayFolders
            {
                folders && folders.map((folder) => (
                    <FolderCard key={folder.name} {...folder} />
                ))
            }
        </div>
    )
}

export default DisplayFolders
