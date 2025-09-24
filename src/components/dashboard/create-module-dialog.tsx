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
                Create New Module
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