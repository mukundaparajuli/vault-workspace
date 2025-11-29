"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from "lucide-react"
import { cn, toSlug, sanitizePath } from "@/lib/core/utils"
import useSelectedFolderContext from "@/contexts/SelectedFolderContext"
import VaultExplorer from "../vault/vault-explorer"

export function AppSidebar() {
    const [folderStructure, setFolderStructure] = useState<VaultItem[] | null>(null)
    const { vault } = useVault()
    const router = useRouter()

    useEffect(() => {
        if (!vault) return

        const fetchStructure = async () => {
            try {
                const structure = await getFolderStructure(vault)
                setFolderStructure(structure)
            } catch (error) {
                console.error("Failed to get folder structure:", error)
            }
        }

        fetchStructure()
    }, [vault])

    return (
        <Sidebar className="h-full bg-white border-r border-gray-100">
            <SidebarContent className="flex flex-col h-full overflow-hidden">
                <SidebarHeader className="pt-6">
                    <h2
                        className="text-lg text-center font-semibold text-gray-700 py-2 cursor-pointer hover:text-gray-500 transition-colors"
                        onClick={() => router.push("/dashboard")}
                    >
                        Vault
                    </h2>
                </SidebarHeader>

                <div className="flex-1 overflow-y-auto px-2">
                    <SidebarMenu>
                        {folderStructure &&
                            folderStructure.map((item) => (
                                <TreeNode key={item.name} item={item} depth={0} />
                            ))}
                    </SidebarMenu>
                </div>
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator className="bg-gray-100" />
                <div className="px-3 py-2">
                    <VaultExplorer />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

// Unified tree node for folders and files
const TreeNode = ({ item, depth }: { item: VaultItem; depth: number }) => {
    const { setSelectedFolder } = useSelectedFolderContext()
    const router = useRouter()
    const params = useParams()
    const rawPath = (params.path as string[] | undefined) || []
    const path = useMemo(() => sanitizePath(rawPath), [rawPath])
    const [isExpanded, setIsExpanded] = useState(false)

    const isFolder = item.kind === "folder"
    const itemPath = item.path || [item.name]
    const itemSlugPath = useMemo(() => itemPath.map(toSlug), [itemPath])

    const children = item.children || []

    const isInActivePath = useMemo(() => {
        if (path.length === 0 || itemSlugPath.length === 0) return false
        if (itemSlugPath.length > path.length) return false
        return itemSlugPath.every((slug, i) => slug === path[i])
    }, [path, itemSlugPath])

    // Check if this exact item is currently selected
    const isActive = useMemo(() => {
        if (path.length === 0 || itemSlugPath.length !== path.length) return false
        return itemSlugPath.every((slug, i) => slug === path[i])
    }, [path, itemSlugPath])

    useEffect(() => {
        if (isFolder && isInActivePath && !isExpanded) {
            setIsExpanded(true)
        }
    }, [isFolder, isInActivePath, isExpanded])

    const handleClick = () => {
        if (isFolder) {
            setSelectedFolder(item)
            if (!isExpanded) {
                setIsExpanded(true)
            }
        }
        router.push(`/dashboard/${itemSlugPath.join("/")}`)
    }

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isFolder) return
        setIsExpanded(!isExpanded)
    }

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors",
                    isActive
                        ? "bg-gray-100 text-gray-700"
                        : "hover:bg-gray-50 text-gray-600 hover:text-gray-700"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                {isFolder ? (
                    <button
                        onClick={handleToggle}
                        className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                        )}
                    </button>
                ) : (
                    <span className="w-4 flex-shrink-0" />
                )}

                {isFolder ? (
                    <FolderIcon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive || isInActivePath ? "text-gray-500" : "text-gray-400"
                    )} />
                ) : (
                    <FileIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}

                <span className={cn(
                    "text-sm truncate",
                    isActive && "font-medium"
                )}>
                    {item.name}
                </span>
            </div>

            {isExpanded && children.length > 0 && (
                <div>
                    {children.map((child) => (
                        <TreeNode key={child.name} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}