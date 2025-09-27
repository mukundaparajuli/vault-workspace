"use client"

import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon, FileIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation";
import { toSlug } from "@/lib/core/utils";
import { useEffect } from "react";
import useVault from "@/hooks/use-vault";

const FileTree = (rootFolder: VaultItem) => {
    const { setSelectedFolder } = useSelectedFolderContext();
    const router = useRouter();
    const params = useParams();
    const { vault } = useVault();

    const currentPath = (params.path as string[]) || [];

    useEffect(() => {
        if (!vault) return;
        if (rootFolder.kind === "file") {
            const fileSlug = toSlug(rootFolder.name);

            // sibling bhako case ma
            if (currentPath.slice(0, -1).includes(fileSlug)) {
                const nextPath = [...currentPath.slice(0, -1), fileSlug];
                router.push(`/dashboard/${nextPath.join('/')}`);
            }

            // edi haina tyo file chai kunai children ko pani children ho bhanedekhi

            // current path ko lagi folder structure nikalna paryo
            const currentDir = vault;
            const folderStructure = getFolderStructure(vault, currentPath.slice(0, -1));
        }
    }, [rootFolder]);




    const handleFolderClick = (folder: VaultItem) => () => {
        if (folder.kind !== "folder") return;

        setSelectedFolder(folder);
        const folderSlug = toSlug(folder.name);

        let nextPath: string[];
        if (currentPath.length > 0) {
            nextPath = [...currentPath, folderSlug];
        } else {
            nextPath = [folderSlug];
        }

        router.push(`/dashboard/${nextPath.join("/")}`);
    };

    const handleFileClick = (file: VaultItem) => () => {

        if (file.kind !== "file") return;
        const fileSlug = toSlug(file.name);

        if (rootFolder.children?.includes(file)) {
            let nextPath = [...currentPath, fileSlug];
            router.push(`/dashboard/${nextPath.join("/")}`);
            return;
        }

        for (const child of rootFolder.children || []) {
            if (child.kind === "folder" && child.children?.includes(file)) {
                let nextPath = [...currentPath, toSlug(child.name), fileSlug];
                router.push(`/dashboard/${nextPath.join("/")}`);
                return;
            }
        }

        // If the file is not found in the current folder or its immediate children,
        // we assume it's in the same hierarchy level as the current folder.


        console.log("out of the scope file click:", file);


        // let nextPath: string[];
        // if (currentPath.length > 0) {
        //     // Replace the last segment with this file (same hierarchy)
        //     nextPath = [...currentPath.slice(0, -1), fileSlug];
        // } else {
        //     nextPath = [fileSlug];
        // }

        // router.push(`/dashboard/${nextPath.join("/")}`);
    };

    return (
        <div>
            <div key={rootFolder.name}>
                {/* Node */}
                <div
                    className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-all duration-200 ${rootFolder.kind === "folder"
                        ? "cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                        : "cursor-pointer hover:bg-gray-50"
                        }`}
                    onClick={
                        rootFolder.kind === "folder"
                            ? handleFolderClick(rootFolder)
                            : handleFileClick(rootFolder)
                    }
                >
                    {rootFolder.kind === "folder" ? (
                        <FolderIcon size={16} className="text-gray-700" />
                    ) : (
                        <FileIcon size={14} className="text-gray-500" />
                    )}
                    <span
                        className={`text-sm select-none ${rootFolder.kind === "folder"
                            ? "font-medium text-gray-800 hover:text-gray-900"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        {rootFolder.name}
                    </span>
                </div>

                {/* Children */}
                {rootFolder.children && rootFolder.children.length > 0 && (
                    <div className="ml-6 border-l border-gray-200 pl-3 mt-1">
                        {rootFolder.children.map((child) => (
                            <div key={child.name} className="mb-1">
                                <FileTree {...child} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FileTree
