"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Command as CommandIcon, Search, FilePlus, FolderOpen } from "lucide-react";

const commands = [
    { id: "new-file", title: "Create new file", icon: FilePlus },
    { id: "open-file", title: "Open file...", icon: FolderOpen },
];

const CommandPalette: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            // Cmd/Ctrl+P
            if ((isMac && e.metaKey && e.key === "p") || (!isMac && e.ctrlKey && e.key === "p")) {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const filtered = useMemo(() => {
        if (!query) return commands;
        return commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
    }, [query]);

    const runCommand = (id: string) => {
        // placeholder commands for now
        console.log("Running command:", id);
        setOpen(false);
        setQuery("");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-gray-500/20" onClick={() => setOpen(false)}>
            <div className="w-full max-w-xl bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <CommandIcon className="w-4 h-4 text-gray-400" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                        placeholder="Type a command or search..."
                    />
                    <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded">Esc</kbd>
                </div>
                <ul className="max-h-72 overflow-auto py-1">
                    {filtered.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-gray-400 text-center">No commands found</li>
                    ) : (
                        filtered.map((c) => {
                            const Icon = c.icon || Search;
                            return (
                                <li
                                    key={c.id}
                                    className="cursor-pointer hover:bg-gray-50 px-4 py-2.5 flex items-center gap-3 transition-colors"
                                    onClick={() => runCommand(c.id)}
                                >
                                    <Icon className="w-4 h-4 text-gray-400" />
                                    <span className="flex-1 text-sm text-gray-700">{c.title}</span>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
