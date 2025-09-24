import { AppSidebar } from '@/components/dashboard/app-sidebar'
import SelectedFolderTree from '@/components/dashboard/display-folder-tree'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-screen p-2'>
            <SidebarProvider>
                <AppSidebar />
                <main className='w-full'>
                    <SidebarTrigger />
                    <div className='w-full max-w-screen flex-1'>
                        {children}
                    </div>
                </main>
                <SelectedFolderTree />
            </SidebarProvider>
        </div>
    )
}

export default layout