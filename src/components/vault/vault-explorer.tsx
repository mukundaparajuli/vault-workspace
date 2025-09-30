"use client"

import useVault from "@/hooks/use-vault"
import { Button } from "../ui/button"

const VaultExplorer = () => {
    const { vault, chooseVault } = useVault()

    return (
        <div className="flex items-center gap-4">
            {!vault ? (
                <Button onClick={chooseVault}>Choose Vault</Button>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                        Vault Location: <span className="font-medium border shadow-md p-2 rounded-md flex-1 text-center">{vault.name ?? "Unknown"}</span>
                    </div>
                    <Button onClick={chooseVault} variant="default">
                        Change Vault
                    </Button>
                </div>
            )}
        </div>
    )
}

export default VaultExplorer
