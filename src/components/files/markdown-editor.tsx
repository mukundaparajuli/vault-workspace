"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import "github-markdown-css"

export default function MarkdownEditorPreview({ content }: { content: string }) {
    const [editorContent, setEditorContent] = useState(content || "# Hello, Markdown!")

    return (
        <div className="flex h-screen">
            <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-1/2 p-4 border-r font-mono text-sm outline-none resize-none"
            />

            <div className="w-1/2 p-4 overflow-auto markdown-body">
                <ReactMarkdown>
                    {editorContent}
                </ReactMarkdown>
            </div>
        </div>
    )
}
