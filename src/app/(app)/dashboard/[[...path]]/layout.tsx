import LeftSidebar from '@/components/dashboard/left-sidebar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <LeftSidebar>
            {children}
        </LeftSidebar>
    )
}

export default layout