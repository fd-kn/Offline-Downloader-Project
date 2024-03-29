const cacheName = 'MainPages';
const cacheWebpages = 'WebPages'

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
        console.log('Caching Main Pages...');
        await cache.addAll(cacheAssets);

        console.log('Main Pages Cached Successfully');
    } catch (error) {
        console.error('Main Pages Installation Error', error);
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
                        console.log('Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});



self.addEventListener('message', event => {
    // Check if the message is coming from a valid source
    if (event.source && event.source.id) {
        // Handle messages based on their type
        switch (event.data.type) {
            case 'newData':
                // Handle the 'newData' message
                const webpageData = event.data.payload;
                console.log('New data received:', webpageData);


                // Store the data in cacheWebpages
                webpageData.forEach(webpage => {
                    const cacheKey = webpage.title;
                    console.log('cache key:', cacheKey);
                    caches.open(cacheWebpages).then(cache => {
                        cache.put(cacheKey, new Response(JSON.stringify(webpage)));
                        console.log('Data stored in cacheWebpages');
                        console.log(webpage.url);

                        cache.match(cacheKey).then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse.json().then(webpageData => {
                                    console.log('Webpage data retrieved from cache:', webpageData);
                                });
                            } else {
                                console.log('No matching cached response found.');
                            }
                        }).catch(error => {
                            console.error('Error matching cache:', error);
                        });
                    }).catch(error => {
                        console.error('Error storing data in cacheWebpages:', error);
                    });

                });

                break;

        }
    }
});




