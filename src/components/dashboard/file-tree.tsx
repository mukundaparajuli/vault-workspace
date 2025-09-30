"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FolderIcon, FileIcon } from "lucide-react";
import { VaultItem } from "@/lib/vaults/get-folder-structure";
import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import { toSlug } from "@/lib/core/utils";

interface FileTreeProps {
    node: VaultItem;
}

const FileTree: React.FC<FileTreeProps> = ({ node }) => {
    const { selectedFolder, setSelectedFolder } = useSelectedFolderContext();
    const router = useRouter();

    const handleClick = () => {
        if (!node.path) return;
        const slugPath = node.path.map(toSlug).map(encodeURIComponent);

        if (node.kind === "folder") {
            // check if the selected node is children to the currently selected folder
            selectedFolder?.children?.includes(node);

        };
        router.push(`/dashboard/${slugPath.join("/")}`);
    };


    return (
        <div>
            <div
                className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-all duration-200 ${node.kind === "folder"
                    ? "cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                    : "cursor-pointer hover:bg-gray-50"
                    }`}
                onClick={handleClick}
            >
                {node.kind === "folder" ? (
                    <FolderIcon size={16} className="text-gray-700" />
                ) : (
                    <FileIcon size={14} className="text-gray-500" />
                )}
                <span
                    className={`text-sm select-none overflow-y-clip ${node.kind === "folder"
                        ? "font-medium text-gray-800 hover:text-gray-900"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                >
                    {node.name}
                </span>
            </div>

            {node.children && node.children?.length > 0 && (
                <div className="ml-6 border-l border-gray-200 pl-3 mt-1">
                    {node.children.map((child) => (
                        <FileTree key={child.path.join("/")} node={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTree;
