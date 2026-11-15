"use client"

import useVault from "@/hooks/use-vault"
import { parseExcalidraw, type ExcalidrawScene } from "@/lib/core/excalidraw"
import { getExtension, getFileKind } from "@/lib/core/file-kind"
import { toHref, toSlug } from "@/lib/core/utils"
import { isExternalSource, resolveRelativeFile } from "@/lib/vaults/resolve-relative"
import { findByName } from "@/lib/vaults/tree"
import { ArrowUpRight, FileWarning, ImageOff, PenTool } from "lucide-react"
import { useRouter } from "next/navigation"
import { memo, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import ExcalidrawSvg from "./excalidraw/excalidraw-svg"

/** Internal URL schemes produced from Obsidian `![[embed]]` / `[[link]]` syntax. */
const EMBED_SCHEME = "vault-embed:"
const LINK_SCHEME = "vault-link:"

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

/**
 * Rewrite `![[target|alias]]` and `[[target|alias]]` into standard markdown
 * using internal schemes, leaving fenced and inline code untouched.
 */
const rewriteWikilinks = (markdown: string) =>
  markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((chunk, index) => {
      if (index % 2 === 1) return chunk // code
      return chunk
        .replace(/!\[\[([^\]|\n]+)(?:\|([^\]\n]*))?\]\]/g, (_, target: string, alias?: string) =>
          `![${(alias ?? target).trim()}](${EMBED_SCHEME}${encodeURIComponent(target.trim())})`
        )
        .replace(/\[\[([^\]|\n]+)(?:\|([^\]\n]*))?\]\]/g, (_, target: string, alias?: string) =>
          `[${(alias ?? target).trim()}](${LINK_SCHEME}${encodeURIComponent(target.trim())})`
        )
    })
    .join("")

const urlTransform = (url: string) =>
  url.startsWith(EMBED_SCHEME) || url.startsWith(LINK_SCHEME) ? url : defaultUrlTransform(url)

/** Join a relative path onto the note's folder, honouring `..` and leading `/`. */
const joinPath = (dirNames: string[], target: string) => {
  const clean = decodeURIComponent(target.split(/[?#]/)[0] ?? "")
  const segments = clean.startsWith("/") ? [] : [...dirNames]
  for (const part of clean.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") segments.pop()
    else segments.push(part)
  }
  return segments
}

type Resolved = { handle: FileSystemFileHandle; names: string[] }

/** Find the vault file an embed points at: by name for `![[…]]`, by path otherwise. */
const useResolvedFile = (source: string, dirNames: string[]) => {
  const { vault, tree } = useVault()
  const [state, setState] = useState<Resolved | "missing" | null>(null)

  useEffect(() => {
    if (!vault || !source) return
    let cancelled = false

    const resolve = async (): Promise<Resolved | null> => {
      if (source.startsWith(EMBED_SCHEME)) {
        const item = findByName(tree, decodeURIComponent(source.slice(EMBED_SCHEME.length)))
        return item ? { handle: item.handle as FileSystemFileHandle, names: item.path } : null
      }
      const handle = await resolveRelativeFile(vault, dirNames, source)
      return handle ? { handle, names: joinPath(dirNames, source) } : null
    }

    resolve()
      .then((result) => !cancelled && setState(result ?? "missing"))
      .catch(() => !cancelled && setState("missing"))

    return () => {
      cancelled = true
    }
  }, [vault, tree, source, dirNames])

  return state
}

const MissingEmbed = ({ label, drawing }: { label: string; drawing?: boolean }) => (
  <span className="not-prose inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[13px] text-muted-foreground">
    {drawing ? <FileWarning className="size-4" /> : <ImageOff className="size-4" />}
    Not found: {label}
  </span>
)

/** An Excalidraw drawing rendered inline in a note; click to open it full size. */
const DrawingEmbed = ({ resolved, label }: { resolved: Resolved; label: string }) => {
  const router = useRouter()
  const [scene, setScene] = useState<ExcalidrawScene | "invalid" | null>(null)

  useEffect(() => {
    let cancelled = false
    resolved.handle
      .getFile()
      .then((file) => file.text())
      .then((text) => !cancelled && setScene(parseExcalidraw(text) ?? "invalid"))
      .catch(() => !cancelled && setScene("invalid"))
    return () => {
      cancelled = true
    }
  }, [resolved])

  if (scene === "invalid") return <MissingEmbed label={label} drawing />

  return (
    <span className="not-prose group/embed relative my-6 block overflow-hidden rounded-xl border bg-card">
      {scene ? (
        <ExcalidrawSvg scene={scene} fit="natural" className="min-h-24 w-full p-4 [&_svg]:max-h-[30rem]" />
      ) : (
        <span className="block h-56 animate-pulse bg-muted" />
      )}
      <button
        type="button"
        onClick={() => router.push(toHref(resolved.names.map(toSlug)))}
        className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border bg-popover/90 px-2 py-1 text-[12px] font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover/embed:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <PenTool className="size-3" />
        Open drawing
        <ArrowUpRight className="size-3" />
      </button>
    </span>
  )
}

/** Image loaded from the vault, revoking its object URL when unmounted. */
const BlobImage = ({ resolved, alt, ...props }: { resolved: Resolved } & ComponentPropsWithoutRef<"img">) => {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let created: string | null = null
    let cancelled = false
    resolved.handle.getFile().then((file) => {
      if (cancelled) return
      created = URL.createObjectURL(file)
      setUrl(created)
    })
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [resolved])

  if (!url) return <span className="inline-block h-40 w-full animate-pulse rounded-xl bg-muted" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt ?? ""} loading="lazy" {...props} />
}

/** Handles every `![…](…)`: external images, vault images, drawings and note embeds. */
const VaultEmbed = ({ src, alt, dirNames, ...props }: ComponentPropsWithoutRef<"img"> & { dirNames: string[] }) => {
  const router = useRouter()
  const source = typeof src === "string" ? src : ""
  const external = isExternalSource(source) && !source.startsWith(EMBED_SCHEME)
  const resolved = useResolvedFile(external ? "" : source, dirNames)
  const label = alt || decodeURIComponent(source.replace(EMBED_SCHEME, ""))

  if (!source) return <MissingEmbed label={label} />

  if (external) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={source} alt={alt ?? ""} loading="lazy" {...props} />
  }

  if (resolved === null) return <span className="inline-block h-40 w-full animate-pulse rounded-xl bg-muted" />
  if (resolved === "missing") return <MissingEmbed label={label} />

  const kind = getFileKind(resolved.names[resolved.names.length - 1] ?? "")

  if (kind === "excalidraw") return <DrawingEmbed resolved={resolved} label={label} />
  if (kind === "image") return <BlobImage resolved={resolved} alt={alt} {...props} />

  // Embedded notes and other files show as a link card.
  return (
    <button
      type="button"
      onClick={() => router.push(toHref(resolved.names.map(toSlug)))}
      className="not-prose inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-[13px] font-medium shadow-xs hover:bg-accent"
    >
      {label}
      <ArrowUpRight className="size-3.5 text-muted-foreground" />
    </button>
  )
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
  const { tree } = useVault()
  const source = useMemo(() => rewriteWikilinks(content), [content])

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
    img: ({ node: _node, ...props }) => <VaultEmbed {...props} dirNames={dirNames} />, // eslint-disable-line @typescript-eslint/no-unused-vars
    a: ({ href = "", children, node: _node, ...props }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
      if (href.startsWith(LINK_SCHEME)) {
        const item = findByName(tree, decodeURIComponent(href.slice(LINK_SCHEME.length)))
        if (!item) {
          return (
            <span className="cursor-not-allowed text-muted-foreground underline decoration-dashed underline-offset-4" title="Note not found">
              {children}
            </span>
          )
        }
        return (
          <a
            href={toHref(item.path.map(toSlug))}
            {...props}
            onClick={(event) => {
              event.preventDefault()
              router.push(toHref(item.path.map(toSlug)))
            }}
          >
            {children}
          </a>
        )
      }

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
            const segments = joinPath(dirNames, href)
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
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
      urlTransform={urlTransform}
    >
      {source}
    </ReactMarkdown>
  )
})

export default MarkdownPreview
