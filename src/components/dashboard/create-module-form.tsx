"use client"
import { Button } from "@/components/ui/button"
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fileType, moduleType } from "@/lib/core/constants";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea";
import useVault from "@/hooks/use-vault";
import createFolder from "@/lib/vaults/create-folder";
import createFile from "@/lib/vaults/create-file";
import useSelectedFolderContext from "@/contexts/SelectedFolderContext";
import { useParams, useRouter } from "next/navigation";
import { fromSlug } from "@/lib/core/utils";
import getFolderStructure from "@/lib/vaults/get-folder-structure";

const CreateModuleForm = () => {
    const { vault, chooseVault } = useVault();
    const params = useParams();
    const path = params.path as string[] | undefined;
    const router = useRouter();
    const moduleSchema = z.object({
        name: z.string().min(1, "Module name is required"),
        description: z.string().optional(),
        moduleType: z.enum(["File", "Folder"]),
        fileType: z.enum(["Markdown", "PDF", "Others"]).optional()
    }).refine((data) => {
        if (data.moduleType === "File") {
            return !!data.fileType;
        }
        return true;
    }, {
        message: "File type is required when creating a file.",
        path: ["fileType"]
    })
    type ModuleSchemaType = z.infer<typeof moduleSchema>;

    const form = useForm<ModuleSchemaType>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            name: "",
            description: "",
            moduleType: "File",
            fileType: "Markdown",
        },
    })

    const handleSubmit = async (values: ModuleSchemaType) => {
        console.log(values);
        console.log(vault);

        if (!vault) {
            await chooseVault();
            return;
        }

        try {
            let currentDir = vault;

            // Navigate to the current folder if we're in a subfolder
            if (path && path.length > 0) {
                // For each path segment, convert slug to actual folder name
                for (let i = 0; i < path.length; i++) {
                    const slug = path[i];

                    // Get the current directory contents to find the actual folder name
                    const currentContents = await getFolderStructure(vault, currentDir);
                    const folderNames = currentContents
                        .filter(item => item.kind === "folder")
                        .map(item => item.name);

                    // Convert slug back to actual folder name
                    const actualFolderName = fromSlug(slug, folderNames);

                    if (!actualFolderName) {
                        console.error(`Could not find folder for slug: ${slug}`);
                        throw new Error(`Folder not found for slug: ${slug}`);
                    }

                    currentDir = await currentDir.getDirectoryHandle(actualFolderName);
                }
            }

            if (values.moduleType === "Folder") {
                console.log("creating the folder in:", currentDir);
                await createFolder(currentDir, values.name);
                console.log("folder created successfully");
            } else if (values.moduleType === "File") {
                console.log("creating the file in:", currentDir);
                // Get file extension based on file type
                let extension = ".md"; // default to markdown
                if (values.fileType === "PDF") {
                    extension = ".pdf";
                } else if (values.fileType === "Others") {
                    extension = ".txt";
                }
                await createFile(currentDir, values.name, extension);
                console.log("file created successfully");
            }

            // Reset the form after successful creation
            form.reset();

            // Refresh the current page to show the new file/folder
            router.refresh();
        } catch (error) {
            console.error("Failed to create module:", error);
            // You might want to show an error message to the user here
        }
    }
    const moduleTypeArray = Object.values(moduleType);
    const fileTypeArray = Object.values(fileType);
    const selectedModuleType = form.watch('moduleType');

    return (
        <div className="w-full ">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 w-full">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Name of the module" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Description of the module" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="moduleType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Module Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a type for the module" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {
                                            moduleTypeArray.map((i) => {
                                                return (
                                                    <SelectItem value={i} key={i}>{i}</SelectItem>
                                                )
                                            })
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedModuleType === "File" && <FormField
                        control={form.control}
                        name="fileType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>File Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a type for the module" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {
                                            fileTypeArray.map((i) => {
                                                return (
                                                    <SelectItem value={i} key={i}>{i}</SelectItem>
                                                )
                                            })
                                        }
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />}
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    )
}

export default CreateModuleForm