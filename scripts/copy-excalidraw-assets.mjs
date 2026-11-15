// Copies Excalidraw's fonts into public/ so drawings render offline instead of
// fetching them from a CDN. Runs before `dev` and `build`; the output is git-ignored.
import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
// The package doesn't export package.json, so read it from node_modules directly
// (works for both npm's flat layout and pnpm's symlinks).
const packageDir = join(root, "node_modules", "@excalidraw", "excalidraw")
const source = join(packageDir, "dist", "prod", "fonts")
const target = join(root, "public", "excalidraw-assets", "fonts")

if (!existsSync(source)) {
  console.warn(`[excalidraw] fonts not found at ${source}; drawings will fall back to the CDN`)
  process.exit(0)
}

if (existsSync(target)) process.exit(0)

mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true })
console.log("[excalidraw] copied fonts to public/excalidraw-assets/fonts")
