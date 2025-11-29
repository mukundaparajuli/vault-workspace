"use client"

import React, { useMemo, useState } from 'react'
import { PanelRightOpen, PanelRightClose } from 'lucide-react'
import SelectedFolderTree from './selected-folder-tree'
import { useParams } from 'next/navigation';
import { sanitizePath } from '@/lib/core/utils';

const RightSidebar = () => {
    const params = useParams();
    const rawPath = (params.path as string[] | undefined) || [];
    const path = useMemo(() => sanitizePath(rawPath), [rawPath]);
    const [isOpen, setIsOpen] = useState(true);

    // Only show sidebar when we have a path
    if (path.length === 0) return null;

    return (
        <div className="flex h-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-full px-1 hover:bg-gray-50 border-l border-gray-100 flex items-start pt-3 transition-colors"
                title={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                {isOpen ? (
                    <PanelRightClose className="w-4 h-4 text-gray-400" />
                ) : (
                    <PanelRightOpen className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="w-64 h-full border-l border-gray-100 bg-white overflow-hidden">
                    <SelectedFolderTree />
                </div>
            )}
        </div>
    )
}

export default RightSidebar