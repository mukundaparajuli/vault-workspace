"use client"

import React, { useMemo } from 'react'
import { SidebarProvider, SidebarTrigger } from '../ui'
import SelectedFolderTree from './selected-folder-tree'
import { useParams } from 'next/navigation';
import { sanitizePath } from '@/lib/core/utils';

const RightSidebar = () => {
    const params = useParams();
    const rawPath = (params.path as string[] | undefined) || [];
    const path = useMemo(() => sanitizePath(rawPath), [rawPath.join('/')]);

    return (
        <div className='relative'>
            <SidebarProvider>
                {path.length > 0 && <SidebarTrigger className=" text-gray-600 hover:text-gray-900" />}
                <SelectedFolderTree />
            </SidebarProvider>
        </div>
    )
}

export default RightSidebar