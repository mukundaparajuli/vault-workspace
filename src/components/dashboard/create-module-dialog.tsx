import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import CreateModuleForm from "./create-module-form";

const CreateModuleDialog = () => {
    return (
        <Dialog>
            <DialogTrigger >
                <div className="p-2 border-2 cursor-pointer text-gray-800 shadow-md rounded-md">Create New Module</div>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <DialogHeader>
                    <DialogTitle>Create Module</DialogTitle>
                    <DialogDescription>
                        Fill the following to create a new module.
                    </DialogDescription>
                </DialogHeader>
                <CreateModuleForm />
            </DialogContent>
        </Dialog>
    );
}

export default CreateModuleDialog;