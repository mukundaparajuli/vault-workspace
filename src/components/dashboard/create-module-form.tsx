"use client"
import { Button } from "@/components/ui/button"
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import useVault from "@/hooks/use-vault";
import createFolder from "@/lib/vaults/create-folder";
import createFile from "@/lib/vaults/create-file";
import uploadFile from "@/lib/vaults/upload-file";
import { useParams, useRouter } from "next/navigation";
import { fromSlug } from "@/lib/core/utils";
import getFolderStructure from "@/lib/vaults/get-folder-structure";

const moduleSchema = z.object({
    name: z.string().optional(),
    moduleType: z.enum(["File", "Folder", "Upload"]),
    uploadedFile: z.instanceof(File).optional(),
}).superRefine((data, ctx) => {
    if (data.moduleType === "Upload" && !data.uploadedFile) {
        ctx.addIssue({
            code: "custom",
            message: "File is required when uploading",
            path: ["uploadedFile"],
        });
    }
    if ((data.moduleType === "File" || data.moduleType === "Folder") && (!data.name || data.name.trim().length === 0)) {
        ctx.addIssue({
            code: "custom",
            message: "Name is required",
            path: ["name"],
        });
    }
});


type ModuleSchemaType = z.infer<typeof moduleSchema>;

const CreateModuleForm = () => {
    const { vault, chooseVault } = useVault();
    const params = useParams();
    const path = params.path as string[] | undefined;
    const router = useRouter();

    const form = useForm<ModuleSchemaType>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            name: "",
            moduleType: "File",
            uploadedFile: undefined,
        },
    });

    const handleSubmit = async (values: ModuleSchemaType) => {
        console.log(values);
        if (!vault) {
            await chooseVault();
            return;
        }

        try {
            let currentDir = vault;

            // Navigate to the current folder if we're in a subfolder
            if (path && path.length > 0) {
                for (let i = 0; i < path.length; i++) {
                    const slug = path[i];
                    const currentContents = await getFolderStructure(vault, currentDir);
                    const folderNames = currentContents
                        .filter(item => item.kind === "folder")
                        .map(item => item.name);

                    const actualFolderName = fromSlug(slug, folderNames);
                    if (!actualFolderName) throw new Error(`Folder not found for slug: ${slug}`);
                    currentDir = await currentDir.getDirectoryHandle(actualFolderName);
                }
            }

            if (values.moduleType === "Folder" && values.name) {
                await createFolder(currentDir, values.name);
            } else if (values.moduleType === "File" && values.name) {
                await createFile(currentDir, values.name, ".md");
            } else if (values.moduleType === "Upload" && values.uploadedFile) {
                await uploadFile(currentDir, values.uploadedFile);
            }

            form.reset();
            router.refresh();
        } catch (error) {
            console.error("Failed to create module:", error);
        }
    };

    const moduleTypeArray = ["File", "Folder", "Upload"];
    const selectedModuleType = form.watch("moduleType");

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 w-full">
                    {selectedModuleType !== "Upload" && (
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={
                                                selectedModuleType === "File"
                                                    ? "Name of the markdown file (without .md)"
                                                    : "Name of the folder"
                                            }
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}


                    <FormField
                        control={form.control}
                        name="moduleType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Module Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a type for the module" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {moduleTypeArray.map((i) => (
                                            <SelectItem value={i} key={i}>{i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {selectedModuleType === "Upload" && (
                        <FormField
                            control={form.control}
                            name="uploadedFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload File</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    form.setValue("uploadedFile", file, {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                    });
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Selected: {(field.value as File).name}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <Button type="submit" className="cursor-pointer disabled:cursor-not-allowed ">Submit</Button>
                </form>
            </Form>
        </div>
    );
};

export default CreateModuleForm;
