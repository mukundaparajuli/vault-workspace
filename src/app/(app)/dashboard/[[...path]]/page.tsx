import CreateModuleDialog from "@/components/dashboard/create-module-dialog"
import SelectedFolderTree from "@/components/dashboard/display-folder-tree"
import DisplayFolders from "@/components/dashboard/display-folders"
import VaultExplorer from "@/components/vault/vault-explorer"

const Page = () => {
    return (
        <div className="relative w-full max-w-screen flex">
            <div className="absolute  right-10">
                <CreateModuleDialog />
            </div>
            <div className="w-full max-w-screen flex justify-center items-start mt-10">
                <DisplayFolders />
            </div>
            <div className="flex h-screen w-full flex-1 overflow-hidden">
                <VaultExplorer />
            </div>
        </div>
    )
}

export default Page