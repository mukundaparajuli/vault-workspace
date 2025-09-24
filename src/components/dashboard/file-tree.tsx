"use client"

import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon, FileIcon } from "lucide-react"
import { redirect, useParams, useRouter } from "next/navigation";
import { toSlug } from "@/lib/core/utils";

const FileTree = (rootFolder: VaultItem) => {
    console.log("Rendering FileTree with:", rootFolder);
    const { selectedFolder, setSelectedFolder } = useSelectedFolderContext();
    const router = useRouter();
    const params = useParams();

    const handleFolderClick = (folder: VaultItem) => () => {
        // Only handle folder clicks, not file clicks
        if (folder.kind !== "folder") return;

        // Set the selected folder in context
        setSelectedFolder(folder);

        // Navigate to the folder using slug
        const currentPath = params.path as string[] || [];
        const folderSlug = toSlug(folder.name);
        const nextPath = `/dashboard/${[...currentPath, folderSlug].join('/')}`;
        router.push(nextPath);
    };
    return (
        <div>
            <div key={rootFolder.name}>
                {/* Node */}
                <div
                    className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-all duration-200 ${rootFolder.kind === "folder"
                        ? "cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                        : "cursor-default"
                        }`}
                    onClick={rootFolder.kind === "folder" ? handleFolderClick(rootFolder) : undefined}
                >
                    {rootFolder.kind === "folder" ? (
                        <FolderIcon size={16} className="text-gray-700" />
                    ) : (
                        <FileIcon size={14} className="text-gray-500" />
                    )}
                    <span
                        className={`text-sm select-none ${rootFolder.kind === "folder"
                            ? "font-medium text-gray-800 hover:text-gray-900"
                            : "text-gray-600"
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
