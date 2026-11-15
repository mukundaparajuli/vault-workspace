"use client"

import { useMemo, useSyncExternalStore } from "react"

export type RecentEntry = {
  /** Name of the vault the entry belongs to. */
  vault: string
  /** Slug path used for routing. */
  slugPath: string[]
  /** Human readable names of each segment. */
  names: string[]
  openedAt: number
}

const STORAGE_KEY = "vault:recent"
const CHANGE_EVENT = "vault:recent-change"
const LIMIT = 12
const EMPTY: RecentEntry[] = []

let cache: RecentEntry[] | null = null

const read = (): RecentEntry[] => {
  if (cache) return cache

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cache = raw ? (JSON.parse(raw) as RecentEntry[]) : EMPTY
  } catch {
    cache = EMPTY
  }

  return cache
}

const write = (entries: RecentEntry[]) => {
  cache = entries
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const sameEntry = (a: Pick<RecentEntry, "vault" | "slugPath">, b: Pick<RecentEntry, "vault" | "slugPath">) =>
  a.vault === b.vault && a.slugPath.join("/") === b.slugPath.join("/")

export const pushRecent = (entry: Omit<RecentEntry, "openedAt">) => {
  const next = [
    { ...entry, openedAt: Date.now() },
    ...read().filter((item) => !sameEntry(item, entry)),
  ].slice(0, LIMIT)
  write(next)
}

export const removeRecent = (vault: string, slugPath: string[]) => {
  // Drop the entry and anything nested beneath it (for deleted folders).
  const prefix = slugPath.join("/")
  write(
    read().filter((item) => {
      if (item.vault !== vault) return true
      const key = item.slugPath.join("/")
      return key !== prefix && !key.startsWith(`${prefix}/`)
    })
  )
}

export const clearRecent = (vault: string) => write(read().filter((entry) => entry.vault !== vault))

const subscribe = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null
      callback()
    }
  }

  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", onStorage)
  }
}

/** Recent entries for one vault, newest first. */
export const useRecent = (vault: string | null | undefined) => {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY)
  return useMemo(() => (vault ? all.filter((entry) => entry.vault === vault) : EMPTY), [all, vault])
}
