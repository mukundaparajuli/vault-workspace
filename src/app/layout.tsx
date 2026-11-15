import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import ServiceWorkerRegister from "@/components/service-worker-register"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { VaultProvider } from "@/contexts/VaultContext"

export const metadata: Metadata = {
  title: {
    default: "Vault Workspace",
    template: "%s · Vault Workspace",
  },
  description: "A focused, local-first workspace for browsing and editing your markdown vault, fully offline.",
  applicationName: "Vault Workspace",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Vault",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#151518" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-svh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <VaultProvider>{children}</VaultProvider>
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
