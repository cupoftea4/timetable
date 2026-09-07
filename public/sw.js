const CACHE_PREFIX = "d-app-v";
const CACHE_NAME = CACHE_PREFIX + new URLSearchParams(location.search).get("v");
const HOME = "/home";
// Same-origin proxy to lpnu.ua, must never be cached
const PROXY_PATH = "/get.php";

const isHtml = (response) => (response.headers.get("content-type") ?? "").includes("text/html");
// Navigations must get HTML, anything else must not (the SPA fallback answers missing files with HTML)
const isUsable = (request, response) => response.ok && isHtml(response) === (request.mode === "navigate");

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith(PROXY_PATH)) return;
  event.respondWith(url.pathname.startsWith("/assets/") ? cacheFirst(request) : networkFirst(request));
});

// Stores the current app shell together with its hashed assets, so they always match
async function precache() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch("/", { cache: "no-cache" });
  if (!response.ok || !isHtml(response)) throw new Error("Failed to fetch app shell");
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  await Promise.all([cache.put(HOME, response), cache.addAll(assets)]);
}

// Hashed assets never change, so the cached copy is always correct
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isUsable(request, response)) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const isNavigation = request.mode === "navigate";
  const fromCache = () => cache.match(isNavigation ? HOME : request);
  try {
    const response = await fetch(request);
    if (!isUsable(request, response)) return (await fromCache()) ?? response;
    if (!isNavigation) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await fromCache();
    if (cached) return cached;
    throw error;
  }
}
