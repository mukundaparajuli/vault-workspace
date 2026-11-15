import LeftSidebar from "@/components/dashboard/left-sidebar"
import { cookies } from "next/headers"
import React from "react"

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

    return <LeftSidebar defaultOpen={defaultOpen}>{children}</LeftSidebar>
}

export default Layout
