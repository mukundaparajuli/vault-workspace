import { AppSidebar } from '@/components/dashboard/app-sidebar'
import EnhancedBreadCrumb from '@/components/dashboard/enhanced-breadcrumb'
import LeftSidebar from '@/components/dashboard/left-sidebar'
import RightSidebar from '@/components/dashboard/right-sidebar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='max-w-screen min-h-screen bg-gray-50 flex max-h-screen'>
            <LeftSidebar />
            <div className='max-w-screen w-full flex-1 flex-col'>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-transparent h-[3rem] max-h-[3rem]">
                    <EnhancedBreadCrumb />
                </div>
                {children}
            </div>
            <RightSidebar />
        </div>
    )
}

export default layout