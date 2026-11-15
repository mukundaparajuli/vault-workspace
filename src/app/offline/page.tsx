import Link from "next/link"
import { ArrowLeft, CloudOff } from "lucide-react"

export const metadata = {
  title: "Offline",
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="max-w-sm animate-fade-up text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-card shadow-sm">
          <CloudOff className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight">You&apos;re offline</h1>
        <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
          This page isn&apos;t cached yet, but your vault lives on your disk and keeps working. Head back to
          the workspace to keep writing.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" />
          Back to workspace
        </Link>
      </div>
    </div>
  )
}
