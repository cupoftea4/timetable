/* eslint-disable no-restricted-globals */

const DYNAMIC_CACHE_NAME = 'd-app-v3'


self.addEventListener('fetch', event => {
  const {request} = event
  const url = new URL(request.url)
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
