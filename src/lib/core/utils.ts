import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const toSlug = (name: string): string => {
    if (!name || typeof name !== 'string') {
        return ''
    }
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')       // replace spaces with hyphens
        .replace(/[^\w\-]/g, '')    // remove non-alphanumeric except hyphen
        .replace(/^-+|-+$/g, '')    // remove leading/trailing hyphens
        .replace(/-+/g, '-')        // collapse multiple hyphens
}

export const fromSlug = (slug: string, items: string[]): string | undefined => {
    if (!slug || !Array.isArray(items)) {
        return undefined
    }
    // Find the actual item name that matches the slug
    return items.find(item => toSlug(item) === slug.toLowerCase())
}

export interface NavigationPath {
    segments: string[]
    actualNames: string[]
    isValid: boolean
    error?: string
}

export const validatePath = (pathSegments: string[]): boolean => {
    if (!Array.isArray(pathSegments)) return false
    return pathSegments.every(segment =>
        typeof segment === 'string' &&
        segment.length > 0 &&
        segment.length <= 255 && // reasonable length limit
        !/[<>:"|?*\\]/.test(segment) // invalid file system characters
    )
}

export const sanitizePath = (pathSegments: string[]): string[] => {
    if (!Array.isArray(pathSegments)) return []
    return pathSegments
        .filter(segment => typeof segment === 'string' && segment.trim().length > 0)
        .map(segment => segment.trim())
        .slice(0, 50) // reasonable depth limit
}

export const buildBreadcrumbPath = (pathSegments: string[], actualNames: string[]): Array<{ slug: string, name: string, path: string[] }> => {
    const breadcrumbs: Array<{ slug: string, name: string, path: string[] }> = []

    for (let i = 0; i < pathSegments.length; i++) {
        const slug = pathSegments[i]
        const name = actualNames[i] || slug // fallback to slug if actual name not available
        const path = pathSegments.slice(0, i + 1)

        breadcrumbs.push({ slug, name, path })
    }

    return breadcrumbs
}

export const encodePathSegment = (segment: string): string => {
    return encodeURIComponent(toSlug(segment))
}

export const decodePathSegment = (segment: string): string => {
    try {
        return decodeURIComponent(segment)
    } catch {
        return segment // fallback to original if decoding fails
    }
}
