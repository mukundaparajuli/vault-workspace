"use client"

import getFolderStructure, { type VaultItem } from "@/lib/vaults/get-folder-structure"
import { del, get, set } from "idb-keyval"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type VaultStatus = "loading" | "empty" | "needs-permission" | "ready"

interface VaultContextValue {
  vault: FileSystemDirectoryHandle | null
  /** Display name of the vault folder, never empty. */
  vaultName: string
  /** True until the persisted handle has been checked on startup. */
  isLoading: boolean
  status: VaultStatus
  /** A remembered vault whose permission must be re-granted with a user gesture. */
  pendingVaultName: string | null
  isSupported: boolean
  /** Full recursive tree of the vault, shared by the sidebar and command palette. */
  tree: VaultItem[] | null
  isTreeLoading: boolean
  structureVersion: number
  chooseVault: () => Promise<FileSystemDirectoryHandle | null>
  reconnectVault: () => Promise<FileSystemDirectoryHandle | null>
  clearVault: () => Promise<void>
  refreshStructure: () => void
}

const VaultContext = createContext<VaultContextValue | null>(null)

type PermissionMode = { mode?: "read" | "readwrite" }

type DirectoryHandleWithPermission = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: PermissionMode) => Promise<PermissionState>
  requestPermission?: (descriptor?: PermissionMode) => Promise<PermissionState>
}

type WindowWithDirectoryPicker = Window &
  typeof globalThis & {
    showDirectoryPicker: (options?: { mode?: "read" | "readwrite"; id?: string }) => Promise<FileSystemDirectoryHandle>
  }

const STORAGE_KEY = "vaultDir"

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const [vault, setVault] = useState<FileSystemDirectoryHandle | null>(null)
  const [pendingHandle, setPendingHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(true)
  const [structureVersion, setStructureVersion] = useState(0)
  const [tree, setTree] = useState<VaultItem[] | null>(null)
  const [isTreeLoading, setIsTreeLoading] = useState(false)

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "showDirectoryPicker" in window)

    const loadSavedVault = async () => {
      try {
        const saved = await get<FileSystemDirectoryHandle>(STORAGE_KEY)

        if (saved) {
          try {
            const permission = await (saved as DirectoryHandleWithPermission).queryPermission?.({
              mode: "readwrite",
            })

            if (permission === "granted") {
              setVault(saved)
            } else {
              // Browsers drop the grant between sessions; keep the handle so the
              // user can reconnect in one click instead of re-picking the folder.
              setPendingHandle(saved)
            }
          } catch (error) {
            console.warn("Saved vault handle is invalid:", error)
            await del(STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error("Failed to load saved vault:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedVault()
  }, [])

  useEffect(() => {
    let isMounted = true

    if (!vault) {
      setTree(null)
      return
    }

    setIsTreeLoading(true)

    getFolderStructure(vault)
      .then((structure) => {
        if (isMounted) setTree(structure)
      })
      .catch((error) => {
        console.error("Failed to read vault structure:", error)
        if (isMounted) setTree([])
      })
      .finally(() => {
        if (isMounted) setIsTreeLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [vault, structureVersion])

  const refreshStructure = useCallback(() => {
    setStructureVersion((version) => version + 1)
  }, [])

  const chooseVault = useCallback(async () => {
    try {
      const dirHandle = await (window as WindowWithDirectoryPicker).showDirectoryPicker({
        mode: "readwrite",
        id: "vault-workspace",
      })
      const permission = await (dirHandle as DirectoryHandleWithPermission).requestPermission?.({
        mode: "readwrite",
      })

      if (permission === "granted" || permission === undefined) {
        await set(STORAGE_KEY, dirHandle)
        setPendingHandle(null)
        setVault(dirHandle)
        refreshStructure()
        return dirHandle
      }

      console.warn("Permission denied for vault access")
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Failed to choose vault:", error)
      }
    }

    return null
  }, [refreshStructure])

  const reconnectVault = useCallback(async () => {
    if (!pendingHandle) {
      return chooseVault()
    }

    try {
      const permission = await (pendingHandle as DirectoryHandleWithPermission).requestPermission?.({
        mode: "readwrite",
      })

      if (permission === "granted" || permission === undefined) {
        setVault(pendingHandle)
        setPendingHandle(null)
        refreshStructure()
        return pendingHandle
      }
    } catch (error) {
      console.error("Failed to reconnect vault:", error)
    }

    return null
  }, [pendingHandle, chooseVault, refreshStructure])

  const clearVault = useCallback(async () => {
    await del(STORAGE_KEY)
    setVault(null)
    setPendingHandle(null)
    refreshStructure()
  }, [refreshStructure])

  const status: VaultStatus = isLoading
    ? "loading"
    : vault
      ? "ready"
      : pendingHandle
        ? "needs-permission"
        : "empty"

  const value = useMemo<VaultContextValue>(
    () => ({
      vault,
      vaultName: vault?.name || "Vault",
      isLoading,
      status,
      pendingVaultName: pendingHandle?.name ?? null,
      isSupported,
      tree,
      isTreeLoading,
      structureVersion,
      chooseVault,
      reconnectVault,
      clearVault,
      refreshStructure,
    }),
    [
      vault,
      isLoading,
      status,
      pendingHandle,
      isSupported,
      tree,
      isTreeLoading,
      structureVersion,
      chooseVault,
      reconnectVault,
      clearVault,
      refreshStructure,
    ]
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

const useVaultContext = () => {
  const context = useContext(VaultContext)

  if (!context) {
    throw new Error("useVault must be used within a VaultProvider")
  }

  return context
}

export default useVaultContext
