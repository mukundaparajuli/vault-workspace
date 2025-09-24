import { AppSidebar } from '@/components/dashboard/app-sidebar'
import SelectedFolderTree from '@/components/dashboard/display-folder-tree'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-screen min-h-screen bg-gray-50'>
            <SidebarProvider>
                <AppSidebar />
                <main className='w-full bg-gray-50'>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                        <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
                    </div>
                    <div className='w-full flex-1'>
                        {children}
                    </div>
                </main>
                <SelectedFolderTree />
            </SidebarProvider>
        </div>
    )
}

export default layout