"use client"

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string
  }
}

/** Fonts are copied here by `scripts/copy-excalidraw-assets.mjs` so drawings render offline. */
export const EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/"

let modulePromise: Promise<typeof import("@excalidraw/excalidraw")> | null = null

/**
 * Lazily load Excalidraw (it's large) after pointing it at self-hosted assets.
 * The asset path must be set before the module first runs.
 */
export const loadExcalidraw = () => {
  if (!modulePromise) {
    window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH
    modulePromise = import("@excalidraw/excalidraw")
  }
  return modulePromise
}
