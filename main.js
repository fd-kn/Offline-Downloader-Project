if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('/cached_pages.js')
        .then(reg => console.log('Servie Worker Working :)'))
        .catch(err => console.log(`Service Worker Error : ${err}`))
    })
}