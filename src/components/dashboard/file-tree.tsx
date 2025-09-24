"use client"

import React, { useState } from "react"
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react"
import { cn } from "@/lib/utils"  // shadcn utility for conditional classes
import { VaultItem } from "@/lib/vaults/get-folder-structure"



const FileTreeNode = ({ name, children }: { name: string; children?: VaultItem | null }) => {
    const [open, setOpen] = useState(false)
    const isFolder = children && typeof children === "object"

    return (
        <li className="ml-2">
            <div
                className={cn(
                    "flex items-center gap-1 cursor-pointer rounded-md px-2 py-1 hover:bg-accent",
                    isFolder && "font-medium"
                )}
                onClick={() => isFolder && setOpen(!open)}
            >
                {isFolder ? (
                    <>
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span>{name}</span>
                    </>
                ) : (
                    <>
                        <File className="h-4 w-4 text-gray-500" />
                        <span>{name}</span>
                    </>
                )}
            </div>

            {isFolder && open && (
                <ul className="ml-4 border-l border-muted pl-2">
                    {Object.entries(children!).map(([childName, childContent]) => (
                        <FileTreeNode key={childName} name={childName} children={childContent} />
                    ))}
                </ul>
            )}
        </li>
    )
}

export function FileTree({ tree }: { tree: VaultItem }) {
    return (
        <ul className="text-sm font-mono">
            {Object.entries(tree).map(([name, children]) => (
                <FileTreeNode key={name} name={name} children={children} />
            ))}
        </ul>
    )
}
