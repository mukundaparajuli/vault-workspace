"use client";

import React, { useEffect, useState } from "react";
import useVault from "@/hooks/use-vault";
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure";

const DisplayFolderStructure = () => {
    const { vault } = useVault();
    const [folderStructure, setFolderStructure] = useState<VaultItem[] | null>(null);

    useEffect(() => {
        if (!vault) return;

        const fetchStructure = async () => {
            try {
                const structure = await getFolderStructure(vault);
                setFolderStructure(structure);
            } catch (error) {
                console.error("Failed to get folder structure:", error);
            }
        };

        fetchStructure();
    }, [vault]);




    return <div>
        {folderStructure ? (
            <pre className="p-4 bg-gray-100 rounded-lg overflow-x-auto">
                {JSON.stringify(folderStructure, null, 2)}
            </pre>
        ) : (
            <div>Loading...</div>
        )}
    </div>;
};

export default DisplayFolderStructure;
