"use client";

import React, { useEffect, useState } from "react";
import FileTree from "./file-tree";
import { useParams } from "next/navigation";
import { VaultItem } from "@/lib/vaults/get-folder-structure";
import useVault from "@/hooks/use-vault";
import getFolderStructure from "@/lib/vaults/get-folder-structure";
import { fromSlug } from "@/lib/core/utils";

const SelectedFolderTree: React.FC = () => {
    const [folder, setFolder] = useState<VaultItem | null>(null);
    const [loading, setLoading] = useState(false);
    const { vault } = useVault();
    const params = useParams();
    const path = params.path as string[] | undefined;

    if (!path || path.length === 0) {
        return null;
    }

    useEffect(() => {
        const fetchFolder = async () => {
            if (!vault) return;

            setLoading(true);
            try {
                let currentDir = vault;
                let folderName = "Vault Root";

                // Check if last segment is a file
                for (let i = 0; i < path.length; i++) {
                    const slug = path[i];

                    const currentContents = await getFolderStructure(vault, currentDir);
                    const folderNames = currentContents
                        .filter((item) => item.kind === "folder")
                        .map((item) => item.name);
                    const fileNames = currentContents
                        .filter((item) => item.kind === "file")
                        .map((item) => item.name);

                    const actualFolderName = fromSlug(slug, folderNames);
                    const actualFileName = fromSlug(slug, fileNames);

                    if (actualFolderName) {
                        currentDir = await currentDir.getDirectoryHandle(actualFolderName);
                        folderName = actualFolderName;
                    } else if (actualFileName) {
                        // stop at parent folder if it's a file
                        break;
                    } else {
                        throw new Error(`No match found for slug: ${slug}`);
                    }
                }

                const folderStructure = await getFolderStructure(vault, currentDir);

                const currentFolder: VaultItem = {
                    name: folderName,
                    kind: "folder",
                    handle: currentDir,
                    children: folderStructure,
                };

                setFolder(currentFolder);
            } catch (error) {
                console.error("Failed to get folder structure:", error);
                setFolder(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFolder();
    }, [path, vault]);

    if (!vault) {
        return (
            <div className="w-1/3 h-screen overflow-y-auto border-l border-gray-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Folder Structure</h2>
                <div className="text-gray-600 text-center py-8">
                    <p className="text-sm">No vault selected</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Please select a vault from the sidebar
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-1/3 h-screen overflow-y-auto border-l border-gray-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Folder Structure</h2>
                <div className="text-gray-600 text-center py-8">
                    <div className="animate-pulse">
                        <p className="text-sm">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!folder) {
        return (
            <div className="w-1/3 h-screen overflow-y-auto border-l border-gray-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Folder Structure</h2>
                <div className="text-gray-600 text-center py-8">
                    <p className="text-sm">No folder structure available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-1/3 h-screen overflow-y-auto overflow-x-hidden border-l p-4">
            <h2 className="mb-4 text-lg font-semibold">Folder Structure</h2>
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{folder.name}</h3>
                {folder.children && folder.children.length > 0 ? (
                    folder.children.map((child) => (
                        <FileTree key={child.name} {...child} />
                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No items in this folder</p>
                )}
            </div>
        </div>
    );
};

export default SelectedFolderTree;
