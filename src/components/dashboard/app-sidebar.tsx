"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useVault from "@/hooks/use-vault"
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon } from "lucide-react"
import { cn } from "@/lib/core/utils"
import useSelectedFolderContext from "@/contexts/SelectedFolderContext"
import { toSlug } from "@/lib/core/utils"

export function AppSidebar() {
    const [folderStructure, setFolderStructure] = useState<VaultItem[] | null>(null)
    const { vault } = useVault()
    const router = useRouter()
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
        <Sidebar className="h-full bg-white border-r border-gray-200">
            <SidebarContent>
                <SidebarHeader>
                    <h2 className="text-xl text-center font-bold text-gray-900 py-2 cursor-pointer" onClick={() => router.push("/dashboard")}>Vault</h2>
                </SidebarHeader>
                <SidebarMenu className="px-2">
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
                "flex items-center cursor-pointer rounded-lg px-3 py-2 transition-all duration-200 mb-1",
                isActive
                    ? "bg-gray-900 text-white font-medium shadow-sm"
                    : "hover:bg-gray-100 text-gray-700 font-medium hover:text-gray-900"
            )}
            onClick={handleClick}
        >
            <FolderIcon className={cn(
                "w-4 h-4",
                isActive ? "text-gray-300" : "text-gray-500"
            )} />
            <span className="ml-3 text-sm">{item.name}</span>
        </SidebarMenuItem>
    )
}
