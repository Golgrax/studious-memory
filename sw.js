// Bayanihan Weather Alert - Service Worker

const CACHE_NAME = 'bayanihan-weather-v1.0.0';
const STATIC_CACHE_NAME = 'bayanihan-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'bayanihan-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/responsive.css',
    '/scripts/utils.js',
    '/scripts/api.js',
    '/scripts/map.js',
    '/scripts/main.js',
    '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
    'https://publicalert.pagasa.dost.gov.ph/feeds/'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('bayanihan-')) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Activation failed', error);
            })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request.url)) {
        event.respondWith(handleStaticFile(request));
    } else if (isAPIRequest(request.url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isImageRequest(request.url)) {
        event.respondWith(handleImageRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

// Check if request is for a static file
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.includes(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.html');
}

// Check if request is for API data
function isAPIRequest(url) {
    return API_ENDPOINTS.some(endpoint => url.includes(endpoint)) ||
           url.includes('pagasa.dost.gov.ph');
}

// Check if request is for an image
function isImageRequest(url) {
    return url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.gif') ||
           url.includes('.svg') ||
           url.includes('.webp');
}

// Handle static file requests (Cache First strategy)
async function handleStaticFile(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Static file request failed', error);
        
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
        }
        
        // Return empty response for other static files
        return new Response('', { status: 408, statusText: 'Request Timeout' });
    }
}

// Handle API requests (Network First with cache fallback)
async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request, {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (networkResponse.ok) {
            // Cache successful response
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error(`Network response not ok: ${networkResponse.status}`);
    } catch (error) {
        console.warn('Service Worker: Network request failed, trying cache', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add header to indicate cached response
            const response = cachedResponse.clone();
            response.headers.set('X-Served-By', 'ServiceWorker-Cache');
            return response;
        }
        
        // Return offline data if available
        return createOfflineResponse();
    }
}

// Handle image requests (Cache First with network fallback)
async function handleImageRequest(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Image request failed', error);
        
        // Return placeholder image or cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return empty image response
        return new Response('', { 
            status: 404, 
            statusText: 'Image Not Found',
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
}

// Handle other requests (Network First)
async function handleOtherRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Other request failed', error);
        
        // Try cache fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

// Create offline response for API requests
function createOfflineResponse() {
    const offlineData = {
        id: 'offline',
        title: 'OFFLINE MODE',
        updated: new Date().toISOString(),
        entries: [
            {
                id: 'offline-alert',
                title: 'Offline Mode - No Current Data Available',
                updated: new Date().toISOString(),
                author: 'Bayanihan Weather Alert',
                link: '#',
                severity: 'info',
                region: 'All Regions',
                alertType: 'System Notice'
            }
        ]
    };
    
    return new Response(JSON.stringify(offlineData), {
        status: 200,
        statusText: 'OK (Offline)',
        headers: {
            'Content-Type': 'application/json',
            'X-Served-By': 'ServiceWorker-Offline'
        }
    });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'weather-data-sync') {
        event.waitUntil(syncWeatherData());
    }
});

// Sync weather data when connection is restored
async function syncWeatherData() {
    try {
        console.log('Service Worker: Syncing weather data...');
        
        // Fetch fresh data from PAGASA
        const response = await fetch('https://publicalert.pagasa.dost.gov.ph/feeds/');
        
        if (response.ok) {
            // Update cache with fresh data
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put('https://publicalert.pagasa.dost.gov.ph/feeds/', response.clone());
            
            // Notify all clients about the update
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'DATA_UPDATED',
                    message: 'Weather data has been updated'
                });
            });
            
            console.log('Service Worker: Weather data synced successfully');
        }
    } catch (error) {
        console.error('Service Worker: Failed to sync weather data', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: 'New weather alert available',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/#alerts'
        },
        actions: [
            {
                action: 'view',
                title: 'View Alerts',
                icon: '/assets/images/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/images/action-dismiss.png'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.message || options.body;
        options.data.alertId = data.alertId;
    }
    
    event.waitUntil(
        self.registration.showNotification('Bayanihan Weather Alert', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'view' || !action) {
        // Open the app and navigate to alerts
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // If app is already open, focus it
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin)) {
                            client.focus();
                            client.postMessage({
                                type: 'NAVIGATE_TO_ALERTS',
                                alertId: data.alertId
                            });
                            return;
                        }
                    }
                    
                    // If app is not open, open it
                    return clients.openWindow(data.url || '/#alerts');
                })
        );
    }
    // 'dismiss' action just closes the notification (already handled above)
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_WEATHER_DATA':
            event.waitUntil(cacheWeatherData(data));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearAllCaches());
            break;
            
        case 'GET_CACHE_INFO':
            event.waitUntil(getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            }));
            break;
    }
});

// Cache weather data manually
async function cacheWeatherData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('https://publicalert.pagasa.dost.gov.ph/feeds/', response);
        console.log('Service Worker: Weather data cached manually');
    } catch (error) {
        console.error('Service Worker: Failed to cache weather data manually', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches', error);
    }
}

// Get cache information
async function getCacheInfo() {
    try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheInfo[cacheName] = {
                size: keys.length,
                urls: keys.map(request => request.url)
            };
        }
        
        return cacheInfo;
    } catch (error) {
        console.error('Service Worker: Failed to get cache info', error);
        return {};
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered');
    
    if (event.tag === 'weather-update') {
        event.waitUntil(syncWeatherData());
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Script loaded successfully');

