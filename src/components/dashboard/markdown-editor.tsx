"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Save, Eye, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface MarkdownEditorProps {
    fileHandle: FileSystemFileHandle;
    fileName: string;
    onClose: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    fileHandle,
    fileName,
}) => {
    const [content, setContent] = useState("");
    const [isEditing, setIsEditing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadFile();
    }, [fileHandle, fileName]);

    const loadFile = async () => {
        try {
            const file = await fileHandle.getFile();
            const text = await file.text();
            setContent(text);
        } catch (error) {
            console.error("Failed to load file:", error);
            setContent("# New File\n\nStart writing your markdown here...");
        }
    };

    const saveFile = async () => {
        setIsSaving(true);
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save file:", error);
            alert("Failed to save file. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-2rem)]">
            <div className="bg-white w-full h-full max-w-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">{fileName}</h2>
                        {hasChanges && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? (
                                <>
                                    <Eye className="w-4 h-4 mr-2" /> Preview
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                </>
                            )}
                        </Button>
                        <Button onClick={saveFile} disabled={isSaving || !hasChanges} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {isEditing ? (
                        <div className="flex-1 p-4">
                            <CodeMirror
                                value={content}
                                height="100%"
                                extensions={[markdown()]}
                                onChange={(value: string) => {
                                    setContent(value);
                                    setHasChanges(true);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 p-4 overflow-y-auto prose prose-sm max-w-none">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500">
                        {isEditing ? "Edit mode" : "Preview mode"} • Use markdown syntax
                        for formatting • Press Ctrl+S to save
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;
