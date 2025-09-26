"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Eye, Edit } from "lucide-react";

interface MarkdownEditorProps {
    fileHandle: FileSystemFileHandle;
    fileName: string;
    onClose: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ fileHandle, fileName, onClose }) => {
    const [content, setContent] = useState("");
    const [isEditing, setIsEditing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadFile();
    }, [fileHandle]);

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
            console.log("File saved successfully");
        } catch (error) {
            console.error("Failed to save file:", error);
            alert("Failed to save file. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderMarkdown = (text: string) => {
        // Simple markdown rendering (you might want to use a proper markdown library)
        return text
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 text-gray-800">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 text-gray-700">$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
            .replace(/`(.*)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
            .replace(/\n/gim, '<br>');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
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
                            {isEditing ? <Eye className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                            {isEditing ? "Preview" : "Edit"}
                        </Button>
                        <Button
                            onClick={saveFile}
                            disabled={isSaving || !hasChanges}
                            size="sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={onClose} size="sm">
                            Close
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {isEditing ? (
                        <div className="flex-1 p-4">
                            <Textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="Start writing your markdown here..."
                                className="w-full h-full resize-none border-0 focus:ring-0 text-sm font-mono"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500">
                        {isEditing ? "Edit mode" : "Preview mode"} •
                        Use markdown syntax for formatting •
                        Press Ctrl+S to save
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;
