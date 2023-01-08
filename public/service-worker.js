/* eslint-disable no-restricted-globals */

const STATIC_CACHE_NAME = 's-app-v3'
const DYNAMIC_CACHE_NAME = 'd-app-v3'

const OFFLINE_URL = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    })()
  );
});

self.addEventListener('fetch', event => {
  const {request} = event

  const url = new URL(request.url)
  if (url.origin === location.origin) 
    event.respondWith(networkFirst(request))
})

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  try {
    const response = await fetch(request)
    await cache.put(request, response.clone())
    return response
  } catch (e) {
    const cached = await cache.match(request)
    return cached ?? await caches.match('offline.html')
  }
}
