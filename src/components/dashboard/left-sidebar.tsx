import React from 'react'
import { SidebarProvider, SidebarTrigger } from '../ui'
import { AppSidebar } from './app-sidebar'

const LeftSidebar = () => {
    return (
        <div className='relative'>
            <SidebarProvider>
                <AppSidebar />
                <SidebarTrigger className=" text-gray-600 hover:text-gray-900" />
            </SidebarProvider>
        </div>
    )
}

export default LeftSidebar