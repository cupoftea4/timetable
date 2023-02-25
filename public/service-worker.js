/* eslint-disable no-restricted-globals */

const DYNAMIC_CACHE_NAME_PREFIX  = 'd-app-v';
const CURRENT_CACHE_VERSION = "1.3";
const DYNAMIC_CACHE_NAME  = `${DYNAMIC_CACHE_NAME_PREFIX}${CURRENT_CACHE_VERSION}`;

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Check if the cache name starts with the prefix and it's not the current version
          return cacheName.startsWith(DYNAMIC_CACHE_NAME_PREFIX) && cacheName !== DYNAMIC_CACHE_NAME;
        }).map(cacheName => {
          // Delete the old cache
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (url.toString().includes(location.origin + '/static/') || url.toString() === location.origin + '/') {
    event.respondWith(networkFirst(request))
  }
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
