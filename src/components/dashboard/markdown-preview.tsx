"use client"

import useVault from "@/hooks/use-vault"
import { getExtension } from "@/lib/core/file-kind"
import { toHref, toSlug } from "@/lib/core/utils"
import { isExternalSource, resolveRelativeFile } from "@/lib/vaults/resolve-relative"
import { ImageOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { memo, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"

export const headingId = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")

const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children)
  }
  return ""
}

/** Loads images referenced relative to the note from the vault itself. */
const VaultImage = ({ src, alt, dirNames, ...props }: ComponentPropsWithoutRef<"img"> & { dirNames: string[] }) => {
  const { vault } = useVault()
  const [resolved, setResolved] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const source = typeof src === "string" ? src : ""
  const external = isExternalSource(source)

  useEffect(() => {
    if (!vault || !source || external) return

    let url: string | null = null
    let cancelled = false

    resolveRelativeFile(vault, dirNames, source).then(async (handle) => {
      if (cancelled) return
      if (!handle) {
        setFailed(true)
        return
      }
      url = URL.createObjectURL(await handle.getFile())
      if (!cancelled) setResolved(url)
    })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [vault, source, external, dirNames])

  if (failed || !source) {
    return (
      <span className="not-prose inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[13px] text-muted-foreground">
        <ImageOff className="size-4" />
        Image not found: {alt || source}
      </span>
    )
  }

  const finalSrc = external ? source : resolved
  if (!finalSrc) return <span className="inline-block h-40 w-full animate-pulse rounded-xl bg-muted" />

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={finalSrc} alt={alt ?? ""} loading="lazy" {...props} />
}

const MarkdownPreview = memo(function MarkdownPreview({
  content,
  dirNames,
}: {
  content: string
  /** Real folder names of the note's directory, for resolving relative links. */
  dirNames: string[]
}) {
  const router = useRouter()

  const heading =
    (Tag: "h1" | "h2" | "h3" | "h4") =>
    // eslint-disable-next-line react/display-name
    ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
      <Tag id={headingId(textOf(children))} {...props}>
        {children}
      </Tag>
    )

  const components: Components = {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    h4: heading("h4"),
    img: ({ node: _node, ...props }) => <VaultImage {...props} dirNames={dirNames} />, // eslint-disable-line @typescript-eslint/no-unused-vars
    a: ({ href = "", children, node: _node, ...props }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
      if (href.startsWith("#")) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        )
      }

      if (isExternalSource(href)) {
        return (
          <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
            {children}
          </a>
        )
      }

      // Relative link to another file in the vault: navigate inside the app.
      return (
        <a
          href={href}
          {...props}
          onClick={(event) => {
            event.preventDefault()
            const clean = decodeURIComponent(href.split("#")[0] ?? "")
            const segments = clean.startsWith("/") ? [] : [...dirNames]
            for (const part of clean.split("/")) {
              if (!part || part === ".") continue
              if (part === "..") segments.pop()
              else segments.push(part)
            }
            if (segments.length > 0 && !getExtension(segments[segments.length - 1])) {
              segments[segments.length - 1] += ".md"
            }
            router.push(toHref(segments.map(toSlug)))
          }}
        >
          {children}
        </a>
      )
    },
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
      {content}
    </ReactMarkdown>
  )
})

export default MarkdownPreview
