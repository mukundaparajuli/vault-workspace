"use client"

import { useEffect, useState } from "react"
import { get, set, del } from "idb-keyval";

const useVault = () => {
    const [vault, setVault] = useState<FileSystemDirectoryHandle | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSavedVault = async () => {
            try {
                const saved = await get<FileSystemDirectoryHandle>("vaultDir");
                if (saved) {
                    try {
                        const permission = await (saved as any).queryPermission({ mode: "readwrite" });
                        if (permission === "granted") {
                            setVault(saved);
                        } else {
                            await del("vaultDir");
                        }
                    } catch (error) {
                        console.warn("Saved vault handle is invalid:", error);
                        await del("vaultDir");
                    }
                }
            } catch (error) {
                console.error("Failed to load saved vault:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedVault();
    }, []);

    const chooseVault = async () => {
        try {
            const dirHandle = await (window as any).showDirectoryPicker();
            const permission = await dirHandle.requestPermission({ mode: "readwrite", isPersistent: true });
            if (permission === "granted") {
                await set("vaultDir", dirHandle);
                setVault(dirHandle);
            } else {
                console.warn("Permission denied for vault access");
            }
        } catch (error) {
            console.error("Failed to choose vault:", error);
        }
    };

    const clearVault = async () => {
        await del("vaultDir");
        setVault(null);
    };

    return { vault, chooseVault, clearVault, isLoading };
};

export default useVault;