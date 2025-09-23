import CreateModuleDialog from "@/components/dashboard/create-module-dialog"

const Page = () => {
    return (
        <div className="relative w-full">
            <div className="absolute top-10 right-10">
                <CreateModuleDialog />
            </div>
        </div>
    )
}

export default Page