import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { File, Folder } from "lucide-react"


const FolderCard = (folder: VaultItem) => {
    return (
        <div className="w-full max-w-screen px-8 py-4 mx-28 mb-4 bg-gray-400 rounded-lg shadow-md border-gray-300 border-2 ">
            <h2 className="font-bold text-white text-2xl">{folder.name}</h2>
            <div className="flex items-center space-x-2 mt-2">
                {folder.kind === "folder" ? <Folder className="text-gray-200" /> : <File className="text-gray-200" />}
                <h3 className="text-gray-200 font-medium">{folder.kind.toUpperCase()}</h3>
            </div>
        </div>
    )
}

export default FolderCard