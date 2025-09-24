"use client"

import useVault from "@/hooks/use-vault"
import { Button } from "../ui/button"

const VaultExplorer = () => {
    const { vault, chooseVault } = useVault();
    return (
        <div>
            {!vault &&
                <Button onClick={chooseVault}>Vault Location</Button>
            }
        </div>
    )
}

export default VaultExplorer