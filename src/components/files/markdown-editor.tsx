"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import "github-markdown-css"

export default function MarkdownEditorPreview({ content }: { content: string }) {
    const [editorContent, setEditorContent] = useState(content || "# Hello, Markdown!")

    return (
        <div className="flex h-screen">
            {/* Editor */}
            <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-1/2 p-4 border-r font-mono text-sm outline-none resize-none"
            />

            {/* Preview */}
            <div className="w-1/2 p-4 overflow-auto markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editorContent}
                </ReactMarkdown>
            </div>
        </div>
    )
}
