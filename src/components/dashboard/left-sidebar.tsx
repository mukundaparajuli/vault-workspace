"use client"

import React from 'react'
import { SidebarProvider, SidebarTrigger } from '../ui'
import { AppSidebar } from './app-sidebar'

const LeftSidebar = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-screen h-screen bg-white flex overflow-hidden'>
            <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <div className="fixed top-3 left-3 z-50">
                    <SidebarTrigger className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1.5" />
                </div>
                <main className="flex-1 h-full overflow-auto">
                    {children}
                </main>
            </SidebarProvider>
        </div>
    )
}

export default LeftSidebar