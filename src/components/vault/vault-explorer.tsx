"use client"

import useVault from "@/hooks/use-vault"
import { Button } from "../ui/button"

const VaultExplorer = () => {
    const { vault, chooseVault } = useVault();
    console.log("vault", vault);
    return (
        <div>
            {!vault ?
                <Button onClick={chooseVault}>Vault Location</Button>
                : <div>Vault Location</div>
            }
        </div>
    )
}

export default VaultExplorer