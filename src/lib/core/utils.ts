import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Slug utilities
export const toSlug = (name: string) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')       // replace spaces with hyphens
        .replace(/[^\w\-]/g, '')    // remove non-alphanumeric except hyphen
}

export const fromSlug = (slug: string, folders: string[]) => {
    // Find the actual folder name that matches the slug
    return folders.find(f => toSlug(f) === slug)
}
