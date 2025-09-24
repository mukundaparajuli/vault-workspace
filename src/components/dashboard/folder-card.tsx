import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { File, Folder } from "lucide-react"

const FolderCard = (folder: VaultItem) => {
    return (
        <div className="w-full max-w-screen py-4 px-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <h2 className="font-semibold text-gray-800 text-2xl hover:underline transition-all duration-500 cursor-pointer">{folder.name}</h2>
            <div className="flex items-center space-x-2 mt-2">
                {folder.kind === "folder" ? (
                    <Folder className="text-gray-600" />
                ) : (
                    <File className="text-gray-600" />
                )}
                <h3 className="text-gray-600 font-medium">{folder.kind.toUpperCase()}</h3>
            </div>
        </div>
    )
}

export default FolderCard
