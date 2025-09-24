"use client"

import useSelectedFolderContext from "@/contexts/RootFolderContext";
import { VaultItem } from "@/lib/vaults/get-folder-structure"
import { FolderIcon, FileIcon } from "lucide-react"
import { redirect, useParams, useRouter } from "next/navigation";

const FileTree = (rootFolder: VaultItem) => {
    console.log("Rendering FileTree with:", rootFolder);
    const { selectedFolder, setSelectedFolder } = useSelectedFolderContext();
    const router = useRouter();
    const params = useParams();
    const handleFolderClick = (folder: VaultItem) => () => {
        setSelectedFolder(`${rootFolder.name}/${folder.name}`);
        const nextPath = `/dashboard/${params.path}/${folder.name}`;
        router.push(nextPath);
    }
    return (
        <div>
            <div key={rootFolder.name}>
                {/* Node */}
                <div className="flex items-center space-x-2 py-1">
                    {rootFolder.kind === "folder" ? (
                        <FolderIcon size={16} className="text-blue-600" />
                    ) : (
                        <FileIcon size={16} className="text-gray-500" />
                    )}
                    <span
                        className={
                            rootFolder.kind === "folder"
                                ? "font-medium text-gray-800"
                                : "text-gray-600"
                        }
                        onClick={handleFolderClick(rootFolder)}
                    >
                        {rootFolder.name}
                    </span>
                </div>

                {/* Children */}
                {rootFolder.children && rootFolder.children.length > 0 && (
                    <div className=" border-l border-gray-300 ">
                        {rootFolder.children.map((child) => (
                            <div className="flex items-center" key={child.name}>
                                <span className="text-gray-300 pl-3"> - </span>
                                <div key={child.name}>
                                    <FileTree {...child} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FileTree
