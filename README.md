# Vault Workspace

A local-first markdown notebook that runs in the browser. Point it at any folder on your computer and it becomes a fast, offline-capable workspace. Files never leave your disk.

## Features

- **Your folder is the database.** Uses the File System Access API to read and write plain files directly. The chosen folder is remembered and can be reconnected in one click.
- **Editor** with Write / Split / Read modes, autosave, `Ctrl/⌘ S`, focus mode, word count and an outline for long notes. Code and data files open in a code editor with syntax highlighting.
- **Markdown preview** with GFM tables and task lists, highlighted code blocks, and relative images and links resolved from inside the vault. Obsidian-style `[[wikilinks]]` and `![[embeds]]` work too.
- **Excalidraw drawings.** `.excalidraw`, `.excalidraw.json` and Obsidian `.excalidraw.md` files open in a pannable, zoomable viewer with PNG/SVG export. Drawings embed inline in notes (`![[Diagram]]` or `![](Diagram.excalidraw)`) and show thumbnails in the folder grid.
- **Command palette** (`Ctrl/⌘ K`) with fuzzy search across every file and folder, recent files and all actions.
- **File management:** create notes and folders, upload by dialog or drag-and-drop, and rename, delete or copy paths from right-click or `⋯` menus.
- **Views:** grid with image thumbnails and note excerpts, or a sortable list. The home view shows quick actions and recently opened files.
- Picks up edits made by other apps when the window regains focus.
- Light, dark and system themes. Installable PWA that works offline.

## Keyboard shortcuts

| Shortcut              | Action                    |
| --------------------- | ------------------------- |
| `Ctrl/⌘ K`            | Search & commands         |
| `Ctrl/⌘ B`            | Toggle sidebar            |
| `Ctrl/⌘ S`            | Save now                  |
| `Ctrl/⌘ E`            | Toggle write / read       |
| `Ctrl/⌘ ⇧ F`          | Focus mode (`Esc` exits)  |

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

## Browser support

Folder access uses the [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_API), so you need **Chrome, Edge or Arc**. Firefox and Safari don't support it.

**Brave** has the API but turns it off by default. Open `brave://flags/#file-system-access-api`, set it to **Enabled**, and relaunch. The app detects Brave and shows these steps.

`predev`/`prebuild` copy Excalidraw's fonts into `public/excalidraw-assets/` (git-ignored) so drawings render offline.

## Stack

Next.js 15 · React 19 · Tailwind CSS v4 · shadcn/ui on Radix · cmdk · sonner · CodeMirror 6 · react-markdown · Excalidraw · Geist.
