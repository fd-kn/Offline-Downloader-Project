if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/cached_pages.js')
            .then(reg => {
                if (navigator.onLine) {
                    fetch('/allwebpages')
                        .then(response => response.json())
                        .then(allWebpages => {
                            reg.active.postMessage({
                                type: 'newData',
                                payload: allWebpages
                            });
                            console.log('Checking which webpages remain:' , allWebpages);

                        })
                        .catch(error => {
                            console.error('Error fetching allWebpages data:', error);
                        });
                } else {
                    console.log('No Wi-Fi connection detected. Skipping fetching of webpages.');
                }

                console.log('Service Worker Working from MainJS');
            })
            .catch(err => console.log(`Service Worker Error from MainJS : ${err}`));
    });
}
