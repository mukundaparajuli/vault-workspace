import { AppSidebar } from "@/components/dashboard/app-sidebar"
import CreateModuleDialog from "@/components/dashboard/create-module-dialog"
import DisplayFolderTree from "@/components/dashboard/display-folder-tree"
import DisplayFolders from "@/components/dashboard/display-folders"
import VaultExplorer from "@/components/vault/vault-explorer"

const Page = () => {
    return (
        <div className="relative w-full">
            <div className="absolute top-10 right-10">
                <CreateModuleDialog />
            </div>
            <VaultExplorer />
            <DisplayFolderTree />
        </div>
    )
}

export default Page