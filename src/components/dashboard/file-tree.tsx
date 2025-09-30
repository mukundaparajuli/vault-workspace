"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderIcon, FileIcon } from "lucide-react";
import { VaultItem } from "@/lib/vaults/get-folder-structure";
import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import { toSlug } from "@/lib/core/utils";

interface FileTreeProps {
    node: VaultItem;
}

const FileTree: React.FC<FileTreeProps> = ({ node }) => {
    const { setSelectedFolder } = useSelectedFolderContext();
    const router = useRouter();
    const params = useParams();

    const isFolder = node.kind === "folder";
    const [expanded, setExpanded] = useState<boolean>(false);
    const [children,] = useState<VaultItem[] | null>(node.children ?? null);
    const [loading,] = useState(false);

    const currentSlugs = (params?.path as string[] | undefined) || [];
    const nodeSlugPath = useMemo(() => (node.path ?? []).map(toSlug), [node.path]);

    const isOnActivePath = useMemo(() => {
        if (nodeSlugPath.length === 0) return false;
        if (nodeSlugPath.length > currentSlugs.length) return false;
        for (let i = 0; i < nodeSlugPath.length; i++) {
            if (nodeSlugPath[i] !== currentSlugs[i]) return false;
        }
        return true;
    }, [nodeSlugPath, currentSlugs.join("/")]);

    const isExactActive = useMemo(() => {
        if (nodeSlugPath.length === 0) return false;
        if (nodeSlugPath.length !== currentSlugs.length) return false;
        for (let i = 0; i < nodeSlugPath.length; i++) {
            if (nodeSlugPath[i] !== currentSlugs[i]) return false;
        }
        return true;
    }, [nodeSlugPath, currentSlugs]);

    useEffect(() => {
        if (isFolder && isOnActivePath && !expanded) {
            setExpanded(true);
        }
    }, [isFolder, isOnActivePath]);

    const navigateToNode = useCallback(() => {
        if (!node.path) return;
        const nodeSlugs = (node.path ?? []).map(toSlug);
        const needsPrefix = currentSlugs.length > 0 && nodeSlugs.length > 0 && nodeSlugs[0] !== currentSlugs[0];
        const finalSlugs = needsPrefix ? [...currentSlugs, ...nodeSlugs] : nodeSlugs;
        const slugPath = finalSlugs.map(encodeURIComponent);
        if (isFolder) setSelectedFolder(node);
        router.push(`/dashboard/${slugPath.join("/")}`);
    }, [node, isFolder, setSelectedFolder, router, currentSlugs]);

    return (
        <div>
            <div className="flex w-full items-center py-1 px-2 rounded-md group">
                <div
                    className={`flex items-start space-x-2 flex-1 py-1 px-2 rounded-md ${isFolder ? "cursor-pointer hover:bg-gray-100" : "cursor-pointer hover:bg-gray-50"
                        } ${isExactActive ? "bg-gray-200" : ""}`}
                    onClick={navigateToNode}
                    title={node.name}
                >
                    {isFolder ? (
                        <FolderIcon size={16} className="text-gray-700" />
                    ) : (
                        <FileIcon size={14} className="text-gray-500" />
                    )}
                    <span className={`text-sm text-start ${isFolder ? "font-medium text-gray-800" : "text-gray-700"} ${isExactActive ? "font-semibold" : ""}`}>
                        {node.name}
                    </span>
                </div>
            </div>

            {isFolder && (
                <div className="ml-6 border-l border-gray-200 pl-3 mt-1">
                    {loading && <div className="text-xs text-gray-500 py-1">Loading...</div>}
                    {!loading && children && children.map((child) => (
                        <FileTree key={child.path.join("/")} node={child} />
                    ))}

                </div>
            )}
        </div>
    );
};

export default FileTree;
