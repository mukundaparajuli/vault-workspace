"use client"

import "@excalidraw/excalidraw/index.css"
import { Excalidraw } from "@excalidraw/excalidraw"
import type { ExcalidrawScene } from "@/lib/core/excalidraw"
import { EXCALIDRAW_ASSET_PATH } from "./load"

if (typeof window !== "undefined") {
  window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH
}

/**
 * Interactive, read-only Excalidraw canvas (pan, zoom, select to inspect).
 * Loaded through next/dynamic so neither the JS nor the CSS ship with the main bundle.
 */
const ExcalidrawCanvas = ({ scene, dark }: { scene: ExcalidrawScene; dark: boolean }) => (
  <div className="vault-excalidraw size-full">
    <Excalidraw
      initialData={{
        elements: scene.elements as never,
        appState: {
          ...(scene.appState ?? {}),
          viewModeEnabled: true,
          collaborators: new Map(),
        } as never,
        files: (scene.files ?? undefined) as never,
        scrollToContent: true,
      }}
      viewModeEnabled
      theme={dark ? "dark" : "light"}
      detectScroll={false}
      handleKeyboardGlobally={false}
      UIOptions={{
        canvasActions: {
          changeViewBackgroundColor: false,
          clearCanvas: false,
          export: false,
          loadScene: false,
          saveAsImage: false,
          saveToActiveFile: false,
          toggleTheme: false,
        },
      }}
    />
  </div>
)

export default ExcalidrawCanvas
