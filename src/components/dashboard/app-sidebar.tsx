"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import useVault from "@/hooks/use-vault";
import getFolderStructure, { VaultItem } from "@/lib/vaults/get-folder-structure";

export function AppSidebar() {
    const [folderStructure, setFolderStructure] = useState<VaultItem[] | null>(null);
    const { vault } = useVault();

    useEffect(() => {
        if (!vault) return;

        const fetchStructure = async () => {
            try {
                const structure = await getFolderStructure(vault);
                setFolderStructure(structure);
            } catch (error) {
                console.error("Failed to get folder structure:", error);
            }
        };

        fetchStructure();
    }, [vault]);

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {folderStructure && <RenderFolders items={folderStructure} />}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

interface RenderFoldersProps {
    items: VaultItem[];
}

const RenderFolders: React.FC<RenderFoldersProps> = ({ items }) => {
    return (
        <>
            {items.map((item) => (
                <div key={item.name} style={{ paddingLeft: 10 }}>
                    <SidebarMenuItem>{item.name}</SidebarMenuItem>
                    {item.children && item.children.length > 0 && (
                        <RenderFolders items={item.children} />
                    )}
                </div>
            ))}
        </>
    );
};
