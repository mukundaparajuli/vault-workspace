"use client"
import { useParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from "@/components/ui/breadcrumb"

const BreadCrumb = () => {
    const router = useRouter();
    const params = useParams();
    const path = params.path as string[] | undefined

    const handleBreadcrumbClick = (index: number) => {
        const newPath = path?.slice(0, index + 1) || []
        router.push(`/dashboard/${newPath.join('/')}`)
    }

    return (
        <div>
            {path && path.length > 0 && (
                <Breadcrumb >
                    <div className='flex items-center justify-start'>
                        <BreadcrumbItem className='cursor-pointer hover:text-gray-900 transition-colors font-bold hover:underline'>
                            <BreadcrumbLink onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
                                Home
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {path.map((folderName, idx) => (
                            <div key={folderName} className='flex items-center justify-start'>
                                <span className="mx-2 text-gray-400">/</span>
                                <BreadcrumbItem className='cursor-pointer hover:text-gray-900 transition-colors'>
                                    <BreadcrumbLink onClick={() => handleBreadcrumbClick(idx)} className="text-gray-600 hover:text-gray-900 font-bold hover:underline">
                                        {folderName}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </div>
                        ))}
                    </div>
                </Breadcrumb>
            )}
        </div>
    )
}

export default BreadCrumb