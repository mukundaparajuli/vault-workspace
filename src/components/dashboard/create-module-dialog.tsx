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
                <div className="px-4 py-2 bg-gray-900 text-white cursor-pointer shadow-sm rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium">
                    Create New Module
                </div>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-xl shadow-xl p-6 border border-gray-200 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">Create Module</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                        Create a new file or folder in the current directory.
                    </DialogDescription>
                </DialogHeader>
                <CreateModuleForm />
            </DialogContent>
        </Dialog>
    );
}

export default CreateModuleDialog;