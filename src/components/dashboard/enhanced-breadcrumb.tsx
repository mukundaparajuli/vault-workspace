"use client"

import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { decodePathSegment, sanitizePath, validatePath, toSlug } from "@/lib/core/utils"

interface NavigationHistory {
    paths: string[][]
    currentIndex: number
}

const EnhancedBreadCrumb = () => {
    const router = useRouter()
    const params = useParams()
    const path = params.path as string[] | undefined

    const [history, setHistory] = useState<NavigationHistory>({
        paths: [[]],
        currentIndex: 0
    })
    const [isNavigating, setIsNavigating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actualNames] = useState<string[]>([])

    useEffect(() => {
        const currentPath = sanitizePath(path || [])

        if (!validatePath(currentPath)) {
            setError('Invalid path format')
            return
        }

        setError(null)

        setHistory(prev => {
            const lastPath = prev.paths[prev.currentIndex] || []
            const pathsEqual = JSON.stringify(lastPath) === JSON.stringify(currentPath)

            if (!pathsEqual) {
                const newPaths = prev.paths.slice(0, prev.currentIndex + 1)
                newPaths.push(currentPath)
                return {
                    paths: newPaths,
                    currentIndex: newPaths.length - 1
                }
            }

            return prev
        })

        setIsNavigating(false)
    }, [path])

    const navigateTo = (targetPath: string[]) => {
        const sanitizedPath = sanitizePath(targetPath)

        if (!validatePath(sanitizedPath)) {
            setError('Invalid path format')
            return
        }

        setIsNavigating(true)
        setError(null)

        const slugPath = sanitizedPath.map(segment => encodeURIComponent(toSlug(segment)))
        router.push(`/dashboard/${slugPath.join('/')}`)
    }

    const navigateBack = () => {
        if (history.currentIndex > 0) {
            const targetIndex = history.currentIndex - 1
            const targetPath = history.paths[targetIndex]

            setHistory(prev => ({
                ...prev,
                currentIndex: targetIndex
            }))

            navigateTo(targetPath)
        }
    }

    const navigateForward = () => {
        if (history.currentIndex < history.paths.length - 1) {
            const targetIndex = history.currentIndex + 1
            const targetPath = history.paths[targetIndex]

            setHistory(prev => ({
                ...prev,
                currentIndex: targetIndex
            }))

            navigateTo(targetPath)
        }
    }

    const handleBreadcrumbClick = (targetPath: string[]) => {
        navigateTo(targetPath)
    }

    const handleHomeClick = () => {
        navigateTo([])
    }

    const canGoBack = history.currentIndex > 0
    const canGoForward = history.currentIndex < history.paths.length - 1

    const currentPath = sanitizePath(path || [])
    const breadcrumbs = currentPath.map((segment, index) => ({
        slug: segment,
        name: actualNames[index] || decodePathSegment(segment),
        path: currentPath.slice(0, index + 1)
    }))

    return (
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateBack}
                    disabled={!canGoBack}
                    className="h-8 w-8 p-0"
                    title="Go back"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateForward}
                    disabled={!canGoForward}
                    className="h-8 w-8 p-0"
                    title="Go forward"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-1 text-red-500" title={error}>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">Error</span>
                </div>
            )}

            <Breadcrumb>
                <div className="flex items-center whitespace-nowrap">
                    {/* Home */}
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            onClick={handleHomeClick}
                            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                        >
                            <Home className="h-4 w-4" />
                            <span className="font-medium">Home</span>
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    {breadcrumbs.length > 0 && (
                        <>
                            {'>'}
                            {breadcrumbs.map((breadcrumb, idx) => (
                                <div key={`${breadcrumb.path.join('/')}-${idx}`} className="flex items-center">
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            onClick={() => handleBreadcrumbClick(breadcrumb.path)}
                                            className={`cursor-pointer transition-colors ${idx === breadcrumbs.length - 1
                                                ? 'text-gray-900 font-semibold'
                                                : 'text-gray-600 hover:text-gray-900 hover:underline'
                                                }`}
                                        >
                                            {breadcrumb.name}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {idx < breadcrumbs.length - 1 && '›'}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </Breadcrumb>

            {isNavigating && (
                <div className="flex items-center gap-1 text-blue-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span className="text-xs">Loading...</span>
                </div>
            )}
        </div>
    )
}

export default EnhancedBreadCrumb
