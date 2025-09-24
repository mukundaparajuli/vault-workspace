"use client"

import { VaultItem } from "@/lib/vaults/get-folder-structure";
import { createContext, useContext, useState } from "react";

interface SelectedFolderContextType {
    selectedFolder: VaultItem | null;
    setSelectedFolder: (folder: VaultItem | null) => void;
}

const SelectedFolderContext = createContext<SelectedFolderContextType | null>(null);

export const SelectedFolderContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedFolder, setSelectedFolder] = useState<VaultItem | null>(null);
    return (
        <SelectedFolderContext.Provider value={{ selectedFolder, setSelectedFolder }}>
            {children}
        </SelectedFolderContext.Provider>
    )
}

const useSelectedFolderContext = () => {
    const context = useContext(SelectedFolderContext);
    if (!context) {
        throw new Error('useSelectedFolderContext must be used within a SelectedFolderContextProvider');
    }
    return context;
};

export default useSelectedFolderContext;
