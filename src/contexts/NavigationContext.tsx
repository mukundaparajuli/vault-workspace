"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { sanitizePath, validatePath, buildBreadcrumbPath, toSlug } from '@/lib/core/utils'

interface NavigationState {
    currentPath: string[]
    actualNames: string[]
    breadcrumbs: Array<{ slug: string, name: string, path: string[] }>
    isNavigating: boolean
    error: string | null
    history: string[][]
    historyIndex: number
}

interface NavigationContextType {
    state: NavigationState
    navigateTo: (path: string[]) => void
    navigateBack: () => void
    navigateForward: () => void
    updateActualNames: (names: string[]) => void
    setError: (error: string | null) => void
    setNavigating: (isNavigating: boolean) => void
    canGoBack: boolean
    canGoForward: boolean
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter()
    const params = useParams()
    const path = params.path as string[] | undefined

    const [state, setState] = useState<NavigationState>({
        currentPath: [],
        actualNames: [],
        breadcrumbs: [],
        isNavigating: false,
        error: null,
        history: [[]],
        historyIndex: 0
    })

    // Update state when URL changes
    useEffect(() => {
        const sanitizedPath = sanitizePath(path || [])
        const isValid = validatePath(sanitizedPath)

        setState(prev => ({
            ...prev,
            currentPath: sanitizedPath,
            error: isValid ? null : 'Invalid path format',
            breadcrumbs: buildBreadcrumbPath(sanitizedPath, prev.actualNames)
        }))
    }, [path])

    const navigateTo = useCallback((newPath: string[]) => {
        const sanitizedPath = sanitizePath(newPath)

        if (!validatePath(sanitizedPath)) {
            setState(prev => ({ ...prev, error: 'Invalid path format' }))
            return
        }

        setState(prev => {
            const newHistory = prev.history.slice(0, prev.historyIndex + 1)
            newHistory.push(sanitizedPath)

            return {
                ...prev,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                error: null,
                isNavigating: true
            }
        })

        const slugPath = sanitizedPath.map(segment => encodeURIComponent(toSlug(segment)))
        router.push(`/dashboard/${slugPath.join('/')}`)
    }, [router])

    const navigateBack = useCallback(() => {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1
            const targetPath = state.history[newIndex]

            setState(prev => ({
                ...prev,
                historyIndex: newIndex,
                isNavigating: true
            }))

            const slugPath = targetPath.map(segment => encodeURIComponent(toSlug(segment)))
            router.push(`/dashboard/${slugPath.join('/')}`)
        }
    }, [state.historyIndex, state.history, router])

    const navigateForward = useCallback(() => {
        if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1
            const targetPath = state.history[newIndex]

            setState(prev => ({
                ...prev,
                historyIndex: newIndex,
                isNavigating: true
            }))

            const slugPath = targetPath.map(segment => encodeURIComponent(segment))
            router.push(`/dashboard/${slugPath.join('/')}`)
        }
    }, [state.historyIndex, state.history, router])

    const updateActualNames = useCallback((names: string[]) => {
        setState(prev => ({
            ...prev,
            actualNames: names,
            breadcrumbs: buildBreadcrumbPath(prev.currentPath, names)
        }))
    }, [])

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error }))
    }, [])

    const setNavigating = useCallback((isNavigating: boolean) => {
        setState(prev => ({ ...prev, isNavigating }))
    }, [])

    const canGoBack = state.historyIndex > 0
    const canGoForward = state.historyIndex < state.history.length - 1

    const contextValue: NavigationContextType = {
        state,
        navigateTo,
        navigateBack,
        navigateForward,
        updateActualNames,
        setError,
        setNavigating,
        canGoBack,
        canGoForward
    }

    return (
        <NavigationContext.Provider value={contextValue}>
            {children}
        </NavigationContext.Provider>
    )
}

export const useNavigation = (): NavigationContextType => {
    const context = useContext(NavigationContext)
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider')
    }
    return context
}

export default NavigationContext
