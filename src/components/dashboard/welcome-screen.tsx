"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import useVault from "@/hooks/use-vault"
import { ArrowRight, FolderOpen, HardDrive, Loader2, NotebookPen, ShieldCheck, WifiOff } from "lucide-react"
import { useState } from "react"

const FEATURES = [
  {
    icon: HardDrive,
    title: "Your files, your disk",
    body: "Notes are plain markdown in a folder you choose. Nothing is uploaded.",
  },
  {
    icon: NotebookPen,
    title: "Write and preview",
    body: "A calm editor with live preview, autosave, and syntax highlighting.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Install it as an app and keep writing without a connection.",
  },
]

const WelcomeScreen = () => {
  const { status, isSupported, pendingVaultName, chooseVault, reconnectVault } = useVault()
  const [busy, setBusy] = useState<"open" | "reconnect" | null>(null)

  const run = async (kind: "open" | "reconnect") => {
    setBusy(kind)
    try {
      await (kind === "open" ? chooseVault() : reconnectVault())
    } finally {
      setBusy(null)
    }
  }

  const needsPermission = status === "needs-permission" && pendingVaultName

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="absolute top-2.5 left-2.5 z-10">
        <SidebarTrigger className="text-muted-foreground" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-dots [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <div className="animate-fade-up">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <NotebookPen className="size-5" />
          </div>

          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.1]">
            {needsPermission ? "Welcome back." : "A quiet place for your notes."}
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-7 text-pretty text-muted-foreground">
            {needsPermission ? (
              <>
                Your browser needs permission again to open{" "}
                <span className="font-medium text-foreground">{pendingVaultName}</span>. Nothing has
                changed on disk.
              </>
            ) : (
              "Vault Workspace turns any folder on your computer into a fast, local-first notebook. Pick a folder to get started."
            )}
          </p>

          {isSupported ? (
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              {needsPermission ? (
                <>
                  <Button size="lg" onClick={() => void run("reconnect")} disabled={busy !== null}>
                    {busy === "reconnect" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    Reconnect to {pendingVaultName}
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => void run("open")} disabled={busy !== null}>
                    Open a different folder
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={() => void run("open")} disabled={busy !== null} className="group">
                  {busy === "open" ? <Loader2 className="animate-spin" /> : <FolderOpen />}
                  Open a folder
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[13px] leading-6">
              <p className="font-medium">This browser can&apos;t open local folders.</p>
              <p className="text-muted-foreground">
                Vault Workspace needs the File System Access API. Use a recent version of Chrome, Edge,
                Arc, or another Chromium-based browser.
              </p>
            </div>
          )}
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="animate-fade-up bg-card p-4"
              style={{ animationDelay: `${120 + index * 60}ms` }}
            >
              <Icon className="size-4 text-muted-foreground" />
              <p className="mt-3 text-[13px] font-medium">{title}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default WelcomeScreen
