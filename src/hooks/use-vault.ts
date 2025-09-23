import { useEffect, useState } from "react"
import { get, set } from "idb-keyval";

const useVault = () => {
    const [vault, setVault] = useState<FileSystemDirectoryHandle | null>(null);

    useEffect(() => {
        (async () => {
            const saved = await get<FileSystemDirectoryHandle>("vaultDir");
            if (saved) {
                const permission = await (saved as any).queryPermission({ mode: "readwrite" });
                if (permission === "granted") {
                    setVault(saved);
                }
            }
        })();
    }, []);

    const chooseVault = async () => {
        const dirHandle = await (window as any).showDirectoryPicker();
        const permission = await dirHandle.requestPermission({ mode: "readwrite" });
        if (permission === "granted") {
            await set("vaultDir", dirHandle);
            setVault(dirHandle);
        }
    }

    return { vault, chooseVault };
};

export default useVault;