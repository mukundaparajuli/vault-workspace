"use client";

import { useState, useEffect } from "react";
import { FileText, Save, Eye, Edit, Columns } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface MarkdownEditorProps {
    fileHandle: FileSystemFileHandle;
    fileName: string;
    onClose: () => void;
}

const MarkdownImage = ({ src, alt, ...props }: any) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadImage = async () => {
            if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:')) {
                setImageUrl(src);
                return;
            }

            setImageUrl(null);
        };

        loadImage();
    }, [src]);

    if (!imageUrl) {
        return <span className="text-gray-400 italic text-sm">[Image: {alt || src}]</span>;
    }

    return <img src={imageUrl} alt={alt} className="max-w-full h-auto rounded-lg" {...props} />;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    fileHandle,
    fileName,
}) => {
    const [content, setContent] = useState("");
    const [isEditing, setIsEditing] = useState(true);
    const [isSplit, setIsSplit] = useState(false);
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
        <div className="w-full h-full">
            <div className="bg-white w-full h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <h2 className="text-sm font-medium text-gray-700">{fileName}</h2>
                        {hasChanges && (
                            <span className="text-xs text-gray-400">• Unsaved</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsSplit((s) => !s)}
                            className={`p-2 rounded hover:bg-gray-50 transition-colors ${isSplit ? 'bg-gray-100' : ''}`}
                            title="Toggle split view"
                        >
                            <Columns className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-2 rounded hover:bg-gray-50 transition-colors ${!isEditing ? 'bg-gray-100' : ''}`}
                            title={isEditing ? "Preview" : "Edit"}
                        >
                            {isEditing ? (
                                <Eye className="w-4 h-4 text-gray-500" />
                            ) : (
                                <Edit className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                        <button
                            onClick={saveFile}
                            disabled={isSaving || !hasChanges}
                            className="p-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-30"
                            title="Save"
                        >
                            <Save className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0">
                    {isSplit ? (
                        <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100 min-h-0">
                            <div className="overflow-hidden bg-gray-50 min-h-0">
                                <CodeMirror
                                    value={content}
                                    height="100%"
                                    extensions={[markdown()]}
                                    onChange={(value: string) => {
                                        setContent(value);
                                        setHasChanges(true);
                                    }}
                                    className="h-full text-sm"
                                />
                            </div>
                            <div className="overflow-y-auto bg-white min-h-0">
                                <article className="prose prose-sm max-w-none p-6 prose-headings:font-semibold prose-headings:text-gray-700 prose-p:text-gray-600 prose-a:text-gray-600 prose-a:underline prose-code:text-gray-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-4 prose-blockquote:border-gray-200 prose-blockquote:text-gray-500 prose-hr:border-gray-100 prose-table:text-sm prose-th:bg-gray-50 prose-th:border prose-th:border-gray-200 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-2 prose-img:rounded-lg prose-li:text-gray-600">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{
                                            img: MarkdownImage
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>
                    ) : isEditing ? (
                        <div className="flex-1 bg-gray-50 min-h-0">
                            <CodeMirror
                                value={content}
                                height="100%"
                                extensions={[markdown()]}
                                onChange={(value: string) => {
                                    setContent(value);
                                    setHasChanges(true);
                                }}
                                className="h-full text-sm"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto bg-white min-h-0">
                            <article className="prose prose-sm max-w-none p-6 prose-headings:font-semibold prose-headings:text-gray-700 prose-p:text-gray-600 prose-a:text-gray-600 prose-a:underline prose-code:text-gray-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-4 prose-blockquote:border-gray-200 prose-blockquote:text-gray-500 prose-hr:border-gray-100 prose-table:text-sm prose-th:bg-gray-50 prose-th:border prose-th:border-gray-200 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-2 prose-img:rounded-lg prose-li:text-gray-600">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        img: MarkdownImage
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </article>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;