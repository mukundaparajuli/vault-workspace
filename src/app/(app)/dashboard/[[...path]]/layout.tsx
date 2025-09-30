import { AppSidebar } from '@/components/dashboard/app-sidebar'
import EnhancedBreadCrumb from '@/components/dashboard/enhanced-breadcrumb'
import SelectedFolderTree from '@/components/dashboard/selected-folder-tree'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='max-w-screen min-h-screen bg-gray-50 flex max-h-screen'>
            <div className='relative'>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarTrigger className=" text-gray-600 hover:text-gray-900" />
                </SidebarProvider>
            </div>
            <div className='max-w-screen w-full flex-1 flex-col'>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-transparent h-[3rem] max-h-[3rem]">
                    <EnhancedBreadCrumb />
                </div>
                {children}
            </div>
            <div className='relative'>
                <SidebarProvider>
                    <SidebarTrigger className=" text-gray-600 hover:text-gray-900" />
                    <SelectedFolderTree />
                </SidebarProvider>
            </div>
        </div>
    )
}

export default layout