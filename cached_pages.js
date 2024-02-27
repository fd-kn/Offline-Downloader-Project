const cacheName = 'v2';

const cacheAssets = [
    '/index.js',
    '/main.js',
    '/public/styles.css',
    '/views/home.ejs',
    '/views/error.ejs'

];

self.addEventListener('install', async e => {
    console.log('Service Worker Installed');

    try {
        const cache = await caches.open(cacheName);
        console.log('Service Worker: Caching Files');
        await cache.addAll(cacheAssets);
        console.log('Service Worker: Files Cached Successfully');
    } catch (error) {
        console.error('Service Worker: Cache Installation Error', error);
    }
    
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    console.log('Service Worker Activated');

    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', async event => {
    console.log('Service Worker: Fetching');
    event.respondWith(
        // Try fetching the requested resource from the network
        fetch(event.request)
            .then(async response => {
                // If the fetch is successful, clone the response
                const responseClone = response.clone();
                // Open the cache
                const cache = await caches.open(cacheName);
                // Put the fetched response in the cache
                await cache.put(event.request, responseClone);
                // Return the fetched response
                return response;

            })
            .catch(async error => {
                // If fetch fails (e.g., due to network error), try serving from cache
                console.error('Service Worker: Fetch failed - no wifi; serving from cache', error);
                try {
                    const cachedResponse = await caches.match(event.request);
                    // If the cached response is found, return it
                    if (cachedResponse) {
                        console.log('it works here')
                        return cachedResponse;
                    }
                    // If the requested resource is not found in cache, return a generic offline response
                    return new Response('Not found in cache. Please check your internet connection.');
                } catch (error) {
                    // If an error occurs while serving from cache, return a generic offline response
                    console.error('Service Worker: Cache match failed', error);
                    return new Response('Offline mode. Please check your internet connection.');
                }
            })
    );
});
