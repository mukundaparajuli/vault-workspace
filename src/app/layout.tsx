import type { Metadata } from "next";
import "./globals.css";
import { SelectedFolderContextProvider } from "@/contexts/SelectedFolderContext";
import CommandPalette from "@/components/ui/command-palette";
import { NavigationProvider } from "@/contexts/NavigationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavigationProvider>
          <SelectedFolderContextProvider>
            {children}
            <CommandPalette />
          </SelectedFolderContextProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
