import CreateModuleDialog from "@/components/dashboard/create-module-dialog"
import SelectedFolderTree from "@/components/dashboard/display-folder-tree"
import DisplayFolders from "@/components/dashboard/display-folders"
import VaultExplorer from "@/components/vault/vault-explorer"

const Page = () => {
    return (
        <div className="relative w-full flex">
            <div className="absolute top-4 right-8 z-10">
                <CreateModuleDialog />
            </div>
            <div className="w-full flex justify-center items-start pt-8">
                <DisplayFolders />
            </div>
            <div className="flex h-screen w-full flex-1 overflow-hidden">
                <VaultExplorer />
            </div>
        </div>
    )
}

export default Page