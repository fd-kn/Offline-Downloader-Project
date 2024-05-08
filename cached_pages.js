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
                    console.log('cache stuff - this is what cache exist: ' , cache)
                    if (cache !== cacheName && cache !== cacheWebpages) {
                        console.log('Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});




self.addEventListener('message', event => {
    if (event.source && event.source.id) {
        switch (event.data.type) {
            case 'newData':
                const webpageData = event.data.payload;
                console.log('New data received:', webpageData);

                caches.open(cacheWebpages).then(cache => {
                    cache.keys().then(keys => {
                        keys.forEach(key => {
                            cache.delete(key);
                        });
                    }).then(() => {
                        webpageData.forEach(webpage => {
                            const cacheKey = webpage.title;
                            console.log('cache key:', cacheKey);
                            cache.put(cacheKey, new Response(JSON.stringify(webpage)));
                            console.log('Data stored in cacheWebpages');
                            console.log(webpage.url);
                        });
                    }).catch(error => {
                        console.error('Error clearing cache:', error);
                    });
                }).catch(error => {
                    console.error('Error opening cacheWebpages:', error);
                });

                break;
        }
    }
});
