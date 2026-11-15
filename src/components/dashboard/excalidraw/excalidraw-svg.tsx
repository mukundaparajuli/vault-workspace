"use client"

import type { ExcalidrawScene } from "@/lib/core/excalidraw"
import { cn } from "@/lib/core/utils"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { loadExcalidraw } from "./load"

/**
 * Static SVG rendering of a drawing, used for embeds inside notes and for
 * folder thumbnails. Re-renders when the theme flips.
 */
const ExcalidrawSvg = ({
  scene,
  className,
  padding = 16,
  fit = "contain",
}: {
  scene: ExcalidrawScene
  className?: string
  padding?: number
  /**
   * `contain` scales the drawing to fill the box (thumbnails).
   * `natural` keeps its drawn size, only shrinking to fit (embeds in notes).
   */
  fit?: "contain" | "natural"
}) => {
  const container = useRef<HTMLSpanElement>(null)
  const { resolvedTheme } = useTheme()
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const dark = resolvedTheme === "dark"

  useEffect(() => {
    let cancelled = false

    loadExcalidraw()
      .then(async ({ exportToSvg, restoreElements }) => {
        const svg = await exportToSvg({
          // Fill in fields older files omit; exportToSvg doesn't do this itself.
          elements: restoreElements(scene.elements as never, null),
          appState: {
            ...(scene.appState ?? {}),
            exportBackground: false,
            exportWithDarkMode: dark,
          } as never,
          files: (scene.files ?? null) as never,
          exportPadding: padding,
        })
        if (cancelled || !container.current) return

        const naturalWidth = Number(svg.getAttribute("width")) || 0
        svg.removeAttribute("width")
        svg.removeAttribute("height")
        svg.setAttribute("role", "img")
        if (fit === "natural" && naturalWidth) {
          svg.style.display = "block"
          svg.style.margin = "0 auto"
          svg.style.width = `min(100%, ${naturalWidth}px)`
          svg.style.height = "auto"
        } else {
          svg.style.width = "100%"
          svg.style.height = "100%"
        }
        container.current.replaceChildren(svg)
        setState("ready")
      })
      .catch((error) => {
        console.error("Failed to render drawing:", error)
        if (!cancelled) setState("error")
      })

    return () => {
      cancelled = true
    }
  }, [scene, dark, padding, fit])

  return (
    // Spans (not divs) so this can sit inside a markdown paragraph.
    <span className={cn("relative block", className)}>
      <span ref={container} className="block size-full" />
      {state === "loading" ? <span className="absolute inset-0 block animate-pulse rounded-lg bg-muted" /> : null}
      {state === "error" ? (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] text-muted-foreground">
          Couldn&apos;t render drawing
        </span>
      ) : null}
    </span>
  )
}

export default ExcalidrawSvg
