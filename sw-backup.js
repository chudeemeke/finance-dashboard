// Service Worker for Finance Dashboard v3.1.0
const CACHE_NAME = 'finance-dashboard-v3.1.0';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/app-config.js',
    '/app-state.js',
    '/app-components-auth.js',
    '/app-components-main.js',
    '/app-components-finance.js',
    '/app-init.js',
    '/app-main.js',
    '/app-features-international.js',
    '/app-features-integration.js',
    '/app-features-pwa.js',
    '/app-features-advanced.js',
    '/app-features-security.js',
    '/app-features-gamification.js',
    '/app-features-integration-manager.js',
    '/app-phase3-complete.js',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://unpkg.com/recharts@2.5.0/dist/Recharts.js',
    'https://unpkg.com/lucide@0.263.1/dist/umd/lucide.js'
];

// Dynamic cache configuration
const CACHE_STRATEGIES = {
    networkFirst: [
        '/api/',
        '/auth/',
        '/sync/'
    ],
    cacheFirst: [
        '/static/',
        '/assets/',
        '/images/',
        '/fonts/'
    ],
    staleWhileRevalidate: [
        '/data/',
        '/config/'
    ]
};

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker activated successfully');
        })
    );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Determine caching strategy
    let strategy = 'cacheFirst'; // default strategy

    for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => url.pathname.startsWith(pattern))) {
            strategy = strategyName;
            break;
        }
    }

    // Apply strategy
    switch (strategy) {
        case 'networkFirst':
            event.respondWith(networkFirstStrategy(request));
            break;
        case 'cacheFirst':
            event.respondWith(cacheFirstStrategy(request));
            break;
        case 'staleWhileRevalidate':
            event.respondWith(staleWhileRevalidateStrategy(request));
            break;
        default:
            event.respondWith(cacheFirstStrategy(request));
    }
});

// Cache-first strategy
async function cacheFirstStrategy(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Update cache in background
            fetchAndCache(request, cache);
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            return cache.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
        }
        
        return new Response('Network error', { status: 503 });
    }
}

// Network-first strategy
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Helper function to fetch and cache in background
async function fetchAndCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response);
        }
    } catch (error) {
        // Silently fail - this is a background update
    }
}

// Background sync
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);
    
    switch (event.tag) {
        case 'sync-transactions':
            event.waitUntil(syncTransactions());
            break;
        case 'sync-budgets':
            event.waitUntil(syncBudgets());
            break;
        case 'sync-settings':
            event.waitUntil(syncSettings());
            break;
        default:
            console.warn('Unknown sync tag:', event.tag);
    }
});

// Sync offline transactions
async function syncTransactions() {
    try {
        const cache = await caches.open('offline-transactions');
        const requests = await cache.keys();
        
        console.log(`Syncing ${requests.length} offline transactions...`);
        
        for (const request of requests) {
            try {
                const cachedResponse = await cache.match(request);
                const data = await cachedResponse.json();
                
                // Attempt to sync with server
                const response = await fetch(request, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Sync-Retry': 'true'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    await cache.delete(request);
                    console.log('Transaction synced successfully');
                }
            } catch (error) {
                console.error('Failed to sync transaction:', error);
            }
        }
        
        // Notify clients of sync completion
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                tag: 'sync-transactions'
            });
        });
    } catch (error) {
        console.error('Transaction sync failed:', error);
        throw error;
    }
}

// Sync budgets
async function syncBudgets() {
    // Similar implementation to syncTransactions
    console.log('Syncing budgets...');
    return Promise.resolve();
}

// Sync settings
async function syncSettings() {
    // Similar implementation to syncTransactions
    console.log('Syncing settings...');
    return Promise.resolve();
}

// Handle skip waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Skip waiting requested');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    let data = {
        title: 'Finance Dashboard',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png'
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: data.id || 1
        },
        actions: data.actions || [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window if not open
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync event:', event.tag);
    
    switch (event.tag) {
        case 'update-exchange-rates':
            event.waitUntil(updateExchangeRates());
            break;
        case 'check-bills':
            event.waitUntil(checkUpcomingBills());
            break;
        default:
            console.warn('Unknown periodic sync tag:', event.tag);
    }
});

// Update exchange rates
async function updateExchangeRates() {
    try {
        const response = await fetch('/api/exchange-rates');
        if (response.ok) {
            const rates = await response.json();
            
            // Cache the rates
            const cache = await caches.open(CACHE_NAME);
            await cache.put(
                new Request('/api/exchange-rates'),
                new Response(JSON.stringify(rates), {
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            
            // Notify clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'EXCHANGE_RATES_UPDATED',
                    data: rates
                });
            });
        }
    } catch (error) {
        console.error('Failed to update exchange rates:', error);
    }
}

// Check upcoming bills
async function checkUpcomingBills() {
    // Implementation for checking bills
    console.log('Checking upcoming bills...');
    return Promise.resolve();
}

console.log('Service Worker loaded successfully');
