"use client"

import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import { useState, useEffect } from "react"
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
    const [actualNames] = useState<string[]>([])

    useEffect(() => {
        const currentPath = sanitizePath(path || [])
        if (!validatePath(currentPath)) return

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
    }, [path])

    const navigateTo = (targetPath: string[]) => {
        const sanitizedPath = sanitizePath(targetPath)
        if (!validatePath(sanitizedPath)) return
        const slugPath = sanitizedPath.map(segment => encodeURIComponent(toSlug(segment)))
        router.push(`/dashboard/${slugPath.join('/')}`)
    }

    const navigateBack = () => {
        if (history.currentIndex > 0) {
            const targetIndex = history.currentIndex - 1
            const targetPath = history.paths[targetIndex]
            setHistory(prev => ({ ...prev, currentIndex: targetIndex }))
            navigateTo(targetPath)
        }
    }

    const navigateForward = () => {
        if (history.currentIndex < history.paths.length - 1) {
            const targetIndex = history.currentIndex + 1
            const targetPath = history.paths[targetIndex]
            setHistory(prev => ({ ...prev, currentIndex: targetIndex }))
            navigateTo(targetPath)
        }
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
        <div className="flex items-center gap-1 text-sm">
            <button
                onClick={navigateBack}
                disabled={!canGoBack}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Go back"
            >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
                onClick={navigateForward}
                disabled={!canGoForward}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Go forward"
            >
                <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>

            <div className="flex items-center ml-2">
                <button
                    onClick={() => navigateTo([])}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <Home className="h-3.5 w-3.5" />
                </button>

                {breadcrumbs.map((breadcrumb, idx) => (
                    <div key={breadcrumb.path.join('/')} className="flex items-center">
                        <span className="mx-1.5 text-gray-300">/</span>
                        <button
                            onClick={() => navigateTo(breadcrumb.path)}
                            className={`hover:text-gray-700 transition-colors ${idx === breadcrumbs.length - 1
                                ? 'text-gray-700 font-medium'
                                : 'text-gray-500'
                                }`}
                        >
                            {breadcrumb.name}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EnhancedBreadCrumb