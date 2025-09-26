"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, X, Image, File, FileImage } from "lucide-react";

interface FileViewerProps {
    fileHandle: FileSystemFileHandle;
    fileName: string;
    onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileHandle, fileName, onClose }) => {
    const [fileContent, setFileContent] = useState<string>("");
    const [fileUrl, setFileUrl] = useState<string>("");
    const [fileType, setFileType] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFile();
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [fileHandle]);

    const loadFile = async () => {
        try {
            const file = await fileHandle.getFile();
            setFileType(file.type);

            // Handle different file types
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setFileUrl(url);
            } else if (file.type === 'text/plain' || file.type === 'application/json' || file.name.endsWith('.md')) {
                const text = await file.text();
                setFileContent(text);
            } else if (file.type === 'application/pdf') {
                const url = URL.createObjectURL(file);
                setFileUrl(url);
            } else {
                // For other file types, show file info
                setFileContent(`File: ${fileName}\nSize: ${(file.size / 1024).toFixed(2)} KB\nType: ${file.type || 'Unknown'}`);
            }
        } catch (error) {
            console.error("Failed to load file:", error);
            setFileContent("Failed to load file content.");
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async () => {
        try {
            const file = await fileHandle.getFile();
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download file:", error);
        }
    };

    const getFileIcon = () => {
        if (fileType.startsWith('image/')) {
            return <Image className="w-6 h-6 text-blue-600" />;
        } else if (fileName.endsWith('.md')) {
            return <FileText className="w-6 h-6 text-green-600" />;
        } else if (fileType === 'application/pdf') {
            return <FileImage className="w-6 h-6 text-red-600" />;
        } else {
            return <File className="w-6 h-6 text-gray-600" />;
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading...</div>
                </div>
            );
        }

        if (fileType.startsWith('image/') && fileUrl) {
            return (
                <div className="flex items-center justify-center h-full p-4">
                    <img
                        src={fileUrl}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                </div>
            );
        }

        if (fileType === 'application/pdf' && fileUrl) {
            return (
                <div className="h-full">
                    <iframe
                        src={fileUrl}
                        className="w-full h-full border-0"
                        title={fileName}
                    />
                </div>
            );
        }

        return (
            <div className="h-full overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                    {fileContent}
                </pre>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {getFileIcon()}
                        <h2 className="text-lg font-semibold text-gray-900">{fileName}</h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {fileType || 'Unknown type'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadFile}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="outline" onClick={onClose} size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Close
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500">
                        {fileName} • {fileType || 'Unknown type'} •
                        Click download to save the file
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FileViewer;
