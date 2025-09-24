"use client";

import useSelectedFolderContext from "@/contexts/RootFolderContext";
import React from "react";
import FileTree from "./file-tree";

const SelectedFolderTree: React.FC = () => {
    const { selectedFolder } = useSelectedFolderContext();
    console.log("SelectedFolderTree rendering with selectedFolder:", selectedFolder);
    if (!selectedFolder) return null;

    return (
        <div className="w-1/3 h-screen overflow-y-auto border-l p-4">
            <h2 className="mb-4 text-lg font-semibold">Folder Structure</h2>
            <FileTree {...selectedFolder} />
        </div>
    );
};

export default SelectedFolderTree;
