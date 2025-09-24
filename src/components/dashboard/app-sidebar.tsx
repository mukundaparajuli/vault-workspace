"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import useSelectedFolderContext from "@/contexts/RootFolderContext"
import { toSlug } from "@/utils/slug"

export function AppSidebar() {
    const [folderStructure, setFolderStructure] = useState<VaultItem[] | null>(null)
    const { vault } = useVault()

    useEffect(() => {
        if (!vault) return

        const fetchStructure = async () => {
            try {
                const structure = await getFolderStructure(vault)
                console.log("Fetched folder structure:", structure)
                setFolderStructure(structure)
            } catch (error) {
                console.error("Failed to get folder structure:", error)
            }
        }

        fetchStructure()
    }, [vault])

    return (
        <Sidebar className="h-full bg-gray-50 pt-6">
            <SidebarContent>
                <SidebarMenu>
                    {folderStructure &&
                        folderStructure
                            .filter((item) => item.kind === "folder")
                            .map((item) => <FolderNode key={item.name} item={item} />)}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}

const FolderNode = ({ item }: { item: VaultItem }) => {
    const { selectedFolder, setSelectedFolder } = useSelectedFolderContext()
    const router = useRouter()

    const handleClick = () => {
        console.log("Folder clicked:", item)
        setSelectedFolder(item)

        // Navigate to vault route with slug
        const slug = toSlug(item.name)
        router.push(`/dashboard/${slug}`)
    }

    const isActive = selectedFolder?.name === item.name

    return (
        <SidebarMenuItem
            className={cn(
                "flex items-center cursor-pointer rounded-md px-2 py-1 transition-all duration-150",
                isActive
                    ? "bg-gray-200 text-gray-900 font-medium"
                    : "hover:bg-gray-100 text-gray-800 font-medium"
            )}
            onClick={handleClick}
        >
            <FolderIcon className="text-gray-600" />
            <span className="ml-2">{item.name}</span>
        </SidebarMenuItem>
    )
}
