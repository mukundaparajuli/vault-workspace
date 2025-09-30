"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import FileTree from "./file-tree";
import { useParams } from "next/navigation";
import { VaultItem } from "@/lib/vaults/get-folder-structure";
import useVault from "@/hooks/use-vault";
import getFolderStructure from "@/lib/vaults/get-folder-structure";
import { fromSlug, sanitizePath, validatePath } from "@/lib/core/utils";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu } from "@/components/ui/sidebar";

const SelectedFolderTree: React.FC = () => {
    const [folder, setFolder] = useState<VaultItem | null>(null);
    const [, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { vault } = useVault();
    const params = useParams();
    const rawPath = (params.path as string[] | undefined) || [];
    const path = useMemo(() => sanitizePath(rawPath), [rawPath]);
    const pathKey = path.join('/');


    const loadFolder = useCallback(async () => {
        if (!vault) return;
        setLoading(true);
        setError(null);
        try {
            if (!validatePath(path)) {
                throw new Error("Invalid path format");
            }

            let currentDir = vault;
            let folderName = "Vault Root";
            const effectivePath: string[] = [];

            if (path.length > 0) {
                for (let i = 0; i < path.length; i++) {
                    const slug = path[i];
                    const currentContents: VaultItem[] = await getFolderStructure(vault, currentDir);

                    const folderNames = currentContents
                        .filter((item) => item.kind === "folder")
                        .map((i) => i.name);
                    const fileNames = currentContents
                        .filter((item) => item.kind === "file")
                        .map((i) => i.name);

                    const actualFolderName = fromSlug(slug, folderNames);
                    const actualFileName = fromSlug(slug, fileNames);

                    if (actualFolderName) {
                        currentDir = await currentDir.getDirectoryHandle(actualFolderName);
                        folderName = actualFolderName;
                        effectivePath.push(actualFolderName);
                    } else if (actualFileName) {
                        break;
                    } else {
                        throw new Error(`Path segment not found: ${slug}`);
                    }
                }
            }

            const folderStructure = await getFolderStructure(vault, currentDir);

            const currentFolder: VaultItem = {
                name: folderName,
                kind: "folder",
                handle: currentDir,
                path: effectivePath,
                children: folderStructure.map((item) => ({
                    ...item,
                    path: [...effectivePath, item.name],
                })),
            };

            setFolder(currentFolder);
        } catch (e: any) {
            console.error("Failed to get folder structure:", e);
            setError(e?.message || "Failed to get folder structure");
            setFolder(null);
        } finally {
            setLoading(false);
        }
    }, [vault, pathKey]);

    useEffect(() => {
        loadFolder();
    }, [loadFolder]);

    if (!vault) return null;
    if (path.length === 0) return null;

    return (
        <div className="h-full">
            <Sidebar side="right" >
                <SidebarContent className="p-2 overflow-hidden">
                    <SidebarHeader className="py-2">
                        <p className="text-xs text-gray-500 mt-1">{folder ? folder.name : (error ? 'Error' : '')}</p>
                    </SidebarHeader>
                    <SidebarMenu className="px-2 truncate">
                        {folder && folder.children && folder.children.length > 0 ? (
                            folder.children.map((child) => (
                                <FileTree key={child.path.join('/')} node={child} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm px-2">No items in this folder</p>
                        )}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
        </div>
    );
};

export default SelectedFolderTree;
