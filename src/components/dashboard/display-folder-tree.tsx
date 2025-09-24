"use client"

import useSelectedFolderContext from '@/contexts/RootFolderContext';
import useVault from '@/hooks/use-vault';
import getFolderStructure, { VaultItem } from '@/lib/vaults/get-folder-structure';
import React, { useEffect } from 'react'
import { FileTree } from './file-tree';

const DisplayFolderTree = () => {
    const { selectedFolder } = useSelectedFolderContext();
    const { vault } = useVault();
    const [folders, setFolders] = React.useState<VaultItem[] | null>(null);
    useEffect(() => {
        if (selectedFolder) {
            setFolders(selectedFolder);
        } else if (vault) {
            setFolders(vault as any);
        }
    }, [selectedFolder, vault]);
    return (
        <div>
            <FileTree {...folders} />
        </div>
    )
}

export default DisplayFolderTree