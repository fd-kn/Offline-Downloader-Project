if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('/cached_pages.js')
        .then(reg => {
            fetch('/allwebpages')
            .then(response => response.json())
            .then(allWebpages => {
                reg.active.postMessage({
                    type: 'newData',
                    payload: allWebpages
                });

                // allWebpages.forEach(webpage => {
                //     console.log(webpage.title); 
                // });
            })
            .catch(error => {
                console.error('Error fetching allWebpages data:', error);
            });
            console.log('Service Worker Working from MainJS :)');

          
           
        })
        .catch(err => console.log(`Service Worker Error from MainJS : ${err}`))
    })
}