/* eslint-disable no-restricted-globals */

const DYNAMIC_CACHE_NAME_PREFIX  = "d-app-v";
const CURRENT_CACHE_VERSION = "1.7";
const DYNAMIC_CACHE_NAME  = `${DYNAMIC_CACHE_NAME_PREFIX}${CURRENT_CACHE_VERSION}`;
const SERVER_FILE_NAME = "get.php";

async function shouldCache(request, cache) {
  const url = (new URL(request.url)).toString();
  if (url.includes(SERVER_FILE_NAME)) return false;
  return url.startsWith(location.origin + '/assets/') || 
         url.startsWith(location.origin  + '/images/') ||
         url === location.origin  + '/manifest.json' ||
         ((url.startsWith(location.origin  + '/') && !(await cache.match("/"))) ? "home" : false);
}

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
  event.respondWith(networkFirst(request));
})

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  try {
    const response = await fetch(request);
    const cacheRes = await shouldCache(request, cache);  

    if (cacheRes) {
      cache.put(cacheRes === "home" ? "/" : request, response.clone());
    }

    return response ?? await cache.match(request);
  } catch (error) {
    return await cache.match(request).then(async res => res ?? await cache.match("/")); 
  }
  
}