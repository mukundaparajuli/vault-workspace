"use client"

import { VaultItem } from "@/lib/vaults/get-folder-structure";
import { createContext, useContext, useState } from "react";

const SelectedFolderContext = createContext<any>(null);

export const SelectedFolderContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedFolder, setSelectedFolder] = useState<VaultItem | null>(null);
    return (
        <SelectedFolderContext.Provider value={{ selectedFolder, setSelectedFolder }}>
            {children}
        </SelectedFolderContext.Provider>
    )
}

const useSelectedFolderContext = () => {
    return useContext(SelectedFolderContext);
};

export default useSelectedFolderContext;