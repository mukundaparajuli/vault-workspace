import CreateModulePopover from "@/components/dashboard/create-module-dialog";
import VaultExplorer from "@/components/vault/vault-explorer";
export default function Home() {
  return (
    <div >
      <CreateModulePopover />
      <VaultExplorer />
    </div>
  );
}
