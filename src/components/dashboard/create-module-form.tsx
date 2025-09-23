"use client"
import { Button } from "@/components/ui/button"
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fileType, moduleType } from "@/constants/module.constant";
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

const CreateModuleForm = () => {
    const { vault, chooseVault } = useVault();
    const moduleSchema = z.object({
        name: z.string().min(1, "Module name is required"),
        description: z.string().optional(),
        moduleType: z.enum(moduleType),
        fileType: z.enum(fileType).optional().refine((type) => {
            if (type === moduleType.FILE) {
                return !!fileType;
            }
            return true;
        }, {
            message: "File type is required to create a file."
        })
    })
    type ModuleSchemaType = z.infer<typeof moduleSchema>;

    const form = useForm<ModuleSchemaType>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            name: "",
            description: "",
            moduleType: moduleType.FILE,
            fileType: fileType.MARKDOWN,
        },
    })

    const handleSubmit = async (values: ModuleSchemaType) => {
        console.log(values);
        console.log(vault);
        if (values.moduleType === "Folder") {
            if (!vault) {
                await chooseVault();
            } else {
                console.log("creating the folder");
                await createFolder(vault, values.name);
                console.log("folder created successfully");
            }
        } else if (values.moduleType === "file") {
            // implement file creating feature here
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
                    {selectedModuleType === moduleType.FILE && <FormField
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