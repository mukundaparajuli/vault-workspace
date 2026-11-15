/* Vault Workspace service worker - app shell caching for full offline use. */
const VERSION = "v3"
const PRECACHE = `vault-precache-${VERSION}`
const RUNTIME = `vault-runtime-${VERSION}`
const OFFLINE_URL = "/offline"

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/dashboard",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE)

      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: "reload" }))
            if (response.ok || response.type === "opaque") {
              await cache.put(url, response)
            }
          } catch {
            /* Ignore individual precache failures. */
          }
        })
      )

      await self.skipWaiting()
    })()
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

const isCacheable = (request) => {
  if (request.method !== "GET") {
    return false
  }

  const url = new URL(request.url)
  return url.origin === self.location.origin
}

const cacheFirst = async (request) => {
  const cache = await caches.open(RUNTIME)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (response && response.status === 200) {
    cache.put(request, response.clone())
  }

  return response
}

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => undefined)

  return cached || (await network) || Response.error()
}

const handleNavigation = async (request) => {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME)
    cache.put(request, response.clone())
    return response
  } catch {
    const cache = await caches.open(RUNTIME)
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    const precache = await caches.open(PRECACHE)
    const url = new URL(request.url)

    if (url.pathname.startsWith("/dashboard")) {
      const shell = (await cache.match("/dashboard")) || (await precache.match("/dashboard"))
      if (shell) {
        return shell
      }
    }

    const offlinePage = await precache.match(OFFLINE_URL)

    if (offlinePage) {
      return offlinePage
    }

    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    })
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (!isCacheable(request)) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request))
    return
  }

  const url = new URL(request.url)

  if (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/excalidraw-assets/")) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})
