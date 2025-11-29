"use client"

import useVault from "@/hooks/use-vault"
import { FolderOpen, Loader2 } from "lucide-react"

const VaultExplorer = () => {
    const { vault, chooseVault, clearVault, isLoading } = useVault()

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading vault...</span>
            </div>
        )
    }

    return (
        <div className="w-full">
            {!vault ? (
                <button
                    onClick={chooseVault}
                    className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    <FolderOpen className="w-4 h-4" />
                    Choose Vault
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="truncate flex-1">{vault.name ?? "Unknown"}</span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={chooseVault}
                            className="flex-1 py-1.5 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
                        >
                            Change
                        </button>
                        <button
                            onClick={clearVault}
                            className="flex-1 py-1.5 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VaultExplorer
