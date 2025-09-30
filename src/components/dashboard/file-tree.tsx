"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from "lucide-react";
import { VaultItem } from "@/lib/vaults/get-folder-structure";
import getFolderStructure from "@/lib/vaults/get-folder-structure";
import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import useVault from "@/hooks/use-vault";
import { toSlug } from "@/lib/core/utils";

interface FileTreeProps {
    node: VaultItem;
}

const FileTree: React.FC<FileTreeProps> = ({ node }) => {
    const { setSelectedFolder } = useSelectedFolderContext();
    const { vault } = useVault();
    const router = useRouter();
    const params = useParams();

    const isFolder = node.kind === "folder";
    const [expanded, setExpanded] = useState<boolean>(false);
    const [children, setChildren] = useState<VaultItem[] | null>(node.children ?? null);
    const [loading, setLoading] = useState(false);
    const pathKey = useMemo(() => (node.path ? node.path.join("/") : ""), [node.path]);

    // Current URL path slugs
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
    }, [nodeSlugPath, currentSlugs.join("/")]);

    useEffect(() => {
        if (isFolder && isOnActivePath && !expanded) {
            setExpanded(true);
        }
    }, [isFolder, isOnActivePath]);

    const navigateToNode = useCallback(() => {
        if (!node.path) return;
        const nodeSlugs = (node.path ?? []).map(toSlug);
        // If nodeSlugs doesn't start with currentSlugs (root), prefix currentSlugs to keep absolute path
        const needsPrefix = currentSlugs.length > 0 && nodeSlugs.length > 0 && nodeSlugs[0] !== currentSlugs[0];
        const finalSlugs = needsPrefix ? [...currentSlugs, ...nodeSlugs] : nodeSlugs;
        const slugPath = finalSlugs.map(encodeURIComponent);
        if (isFolder) setSelectedFolder(node);
        router.push(`/dashboard/${slugPath.join("/")}`);
    }, [node, isFolder, setSelectedFolder, router, currentSlugs.join("/")]);

    const toggleExpand = useCallback(async () => {
        if (!isFolder) {
            navigateToNode();
            return;
        }
        setExpanded((prev) => !prev);
        // Lazy load children on first expand
        if (
            !expanded &&
            !children &&
            vault &&
            node.handle &&
            typeof node.handle === "object" &&
            "getDirectoryHandle" in node.handle
        ) {
            setLoading(true);
            try {
                const structure = await getFolderStructure(vault, node.handle as FileSystemDirectoryHandle);
                const built = structure.map((item) => ({
                    ...item,
                    path: [...(node.path ?? []), item.name],
                }));
                setChildren(built);
            } finally {
                setLoading(false);
            }
        }
    }, [expanded, children, vault, node, navigateToNode, isFolder]);

    return (
        <div>
            <div className="flex w-full items-center py-1 px-2 rounded-md group">
                {/* {isFolder ? (
                    <button
                        className="mr-1 p-1 rounded hover:bg-gray-100 text-gray-600"
                        aria-label={expanded ? "Collapse" : "Expand"}
                        onClick={toggleExpand}
                    >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <span className="w-5 inline-block" />
                )} */}

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
                    {!loading && (!children || children.length === 0) && (
                        <div className="text-xs text-gray-400 py-1">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileTree;
