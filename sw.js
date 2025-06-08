// Service Worker for Finance Dashboard v3.1.0 - GitHub Pages Version
const CACHE_NAME = 'finance-dashboard-v3.1.0';
const OFFLINE_URL = './offline.html';

/**
 * Helper function to get the correct base path for GitHub Pages
 * This allows the service worker to work both locally and on GitHub Pages
 */
function getBasePath() {
    const url = new URL(self.location);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // If running on GitHub Pages (has repository name in path)
    if (pathSegments.length > 0 && !pathSegments[0].includes('.')) {
        return `/${pathSegments[0]}/`;
    }
    
    // Local development
    return '/';
}

const BASE_PATH = getBasePath();

/**
 * Convert relative paths to absolute paths based on deployment context
 * @param {string} path - The relative path to convert
 * @returns {string} - The absolute path
 */
function toAbsolutePath(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('./')) {
        return BASE_PATH + path.substring(2);
    }
    if (path.startsWith('/')) {
        return BASE_PATH + path.substring(1);
    }
    return BASE_PATH + path;
}

// Files to cache immediately with relative paths
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './app-config.js',
    './app-state.js',
    './app-storage.js',
    './app-storage-init.js',
    './app-utils-init.js',
    './app-utils-privacy-fix.js',
    './app-component-fix.js',
    './app-render-debug.js',
    './app-components-auth.js',
    './app-components-main.js',
    './app-components-finance.js',
    './app-init.js',
    './app-main.js',
    './app-features-international.js',
    './app-features-integration.js',
    './app-features-pwa.js',
    './app-features-advanced.js',
    './app-features-security.js',
    './app-features-gamification.js',
    './app-features-integration-manager.js',
    './app-phase3-complete.js',
    './app-debug-components.js',
    './temp-fix-deps.js',
    // External CDN resources
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://cdn.jsdelivr.net/npm/recharts@2/dist/Recharts.js',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
].map(url => url.startsWith('http') ? url : toAbsolutePath(url));

// Dynamic cache configuration
const CACHE_STRATEGIES = {
    networkFirst: [
        'api/',
        'auth/',
        'sync/'
    ],
    cacheFirst: [
        'static/',
        'assets/',
        'images/',
        'fonts/'
    ],
    staleWhileRevalidate: [
        'data/',
        'config/'
    ]
};

/**
 * Install event - Pre-cache all static assets
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Pre-caching static assets');
                
                // Cache files one by one to handle failures gracefully
                const cachePromises = STATIC_CACHE_URLS.map(url => {
                    return cache.add(url).catch(error => {
                        console.warn(`[ServiceWorker] Failed to cache ${url}:`, error);
                        // Don't fail the entire installation if one resource fails
                        return Promise.resolve();
                    });
                });
                
                return Promise.all(cachePromises);
            })
            .then(() => {
                console.log('[ServiceWorker] Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[ServiceWorker] Installation failed:', error);
            })
    );
});

/**
 * Activate event - Clean up old caches and claim clients
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
            // Claim all clients immediately
            self.clients.claim()
        ]).then(() => {
            console.log('[ServiceWorker] Activation complete');
        })
    );
});

/**
 * Fetch event - Handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Determine caching strategy
    let strategy = 'cacheFirst'; // default strategy
    
    // Check if URL matches any strategy pattern
    const pathname = url.pathname.replace(BASE_PATH, '');
    
    for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => pathname.startsWith(pattern))) {
            strategy = strategyName;
            break;
        }
    }
    
    // Apply appropriate strategy
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

/**
 * Cache-first strategy - Serve from cache, fallback to network
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function cacheFirstStrategy(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Update cache in background if online
            if (navigator.onLine) {
                fetchAndCache(request, cache);
            }
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[ServiceWorker] Cache-first strategy failed:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            const offlinePage = await cache.match(toAbsolutePath(OFFLINE_URL));
            return offlinePage || new Response('Offline - Finance Dashboard', { 
                status: 503,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        return new Response('Network error', { status: 503 });
    }
}

/**
 * Network-first strategy - Try network, fallback to cache
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
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
        
        return new Response(JSON.stringify({ 
            error: 'Network error',
            offline: true 
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale-while-revalidate strategy - Serve from cache while updating
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // If network fails, we already have cachedResponse as fallback
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

/**
 * Helper function to fetch and cache in background
 * @param {Request} request - The request to fetch
 * @param {Cache} cache - The cache to store in
 */
async function fetchAndCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response);
        }
    } catch (error) {
        // Silently fail - this is a background update
        console.debug('[ServiceWorker] Background update failed:', error);
    }
}

/**
 * Message event handler - Handle messages from the app
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[ServiceWorker] Skip waiting requested');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ 
            version: CACHE_NAME,
            basePath: BASE_PATH
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[ServiceWorker] Cache cleared');
            event.ports[0].postMessage({ success: true });
        });
    }
});

/**
 * Background sync event - Sync offline data when connection restored
 */
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    switch (event.tag) {
        case 'sync-transactions':
            event.waitUntil(syncOfflineData('transactions'));
            break;
        case 'sync-budgets':
            event.waitUntil(syncOfflineData('budgets'));
            break;
        case 'sync-settings':
            event.waitUntil(syncOfflineData('settings'));
            break;
        default:
            console.warn('[ServiceWorker] Unknown sync tag:', event.tag);
    }
});

/**
 * Generic offline data sync function
 * @param {string} dataType - Type of data to sync
 */
async function syncOfflineData(dataType) {
    try {
        console.log(`[ServiceWorker] Syncing offline ${dataType}...`);
        
        // Notify clients of sync completion
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                dataType: dataType,
                timestamp: new Date().toISOString()
            });
        });
        
        return Promise.resolve();
    } catch (error) {
        console.error(`[ServiceWorker] ${dataType} sync failed:`, error);
        throw error;
    }
}

console.log('[ServiceWorker] Script loaded successfully');
console.log('[ServiceWorker] Base path:', BASE_PATH);