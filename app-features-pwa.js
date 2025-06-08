/**
 * app-features-pwa.js - Progressive Web App Features (Improved)
 * Version: 3.1.0
 * 
 * Improvements:
 * - Service Worker registration with separate file handling
 * - WebAuthn API for biometric authentication
 * - Enhanced camera capture with comprehensive error handling
 * - Better offline sync mechanisms
 * - Improved mobile optimization
 */

(function(global) {
    'use strict';

    const { React, ReactDOM } = global;
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    const e = React.createElement;

    // ===========================
    // Service Worker Manager (Improved)
    // ===========================
    class ServiceWorkerManager {
        constructor() {
            this.registration = null;
            this.updateAvailable = false;
            this.syncManager = new BackgroundSyncManager();
            this.updateCallbacks = new Set();
        }

        async register() {
            if (!('serviceWorker' in navigator)) {
                console.warn('Service Workers not supported');
                return false;
            }

            try {
                // Register service worker from actual file
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });

                // Listen for updates
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.updateAvailable = true;
                            this.notifyUpdateCallbacks();
                        }
                    });
                });

                // Handle controller change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });

                // Check for updates periodically
                setInterval(() => this.checkForUpdates(), 60000); // Every minute

                console.log('Service Worker registered successfully');
                return true;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                return false;
            }
        }

        async checkForUpdates() {
            if (this.registration) {
                await this.registration.update();
            }
        }

        async skipWaiting() {
            if (this.registration && this.registration.waiting) {
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        }

        onUpdate(callback) {
            this.updateCallbacks.add(callback);
            return () => this.updateCallbacks.delete(callback);
        }

        notifyUpdateCallbacks() {
            this.updateCallbacks.forEach(callback => callback());
        }

        // Generate service worker file content
        static generateServiceWorkerFile() {
            return `
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
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://unpkg.com/recharts@2.5.0/dist/Recharts.js',
    'https://unpkg.com/lucide@0.263.1/dist/umd/lucide.js'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Handle API calls differently
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Use cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
        });
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match(OFFLINE_URL);
        }
        throw error;
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
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

// Sync offline transactions
async function syncTransactions() {
    const cache = await caches.open('offline-transactions');
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const response = await fetch(request.clone());
            if (response.ok) {
                await cache.delete(request);
            }
        } catch (error) {
            console.error('Sync failed for:', request.url);
        }
    }
}

// Handle skip waiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Finance Dashboard', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
`;
        }
    }

    // ===========================
    // Background Sync Manager
    // ===========================
    class BackgroundSyncManager {
        constructor() {
            this.pendingSync = [];
            this.syncInProgress = false;
        }

        async registerSync(tag, data) {
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register(tag);
                    
                    // Store data for sync
                    this.pendingSync.push({ tag, data, timestamp: Date.now() });
                    await this.storePendingSync();
                } catch (error) {
                    console.error('Background sync registration failed:', error);
                    // Fallback to immediate sync
                    await this.immediateSync(tag, data);
                }
            } else {
                // Fallback for browsers without background sync
                await this.immediateSync(tag, data);
            }
        }

        async immediateSync(tag, data) {
            try {
                // Implement immediate sync logic
                if (navigator.onLine) {
                    await this.performSync(tag, data);
                } else {
                    // Store for later
                    this.pendingSync.push({ tag, data, timestamp: Date.now() });
                    await this.storePendingSync();
                }
            } catch (error) {
                console.error('Immediate sync failed:', error);
            }
        }

        async performSync(tag, data) {
            // Implement actual sync logic based on tag
            switch (tag) {
                case 'sync-transactions':
                    await this.syncTransactions(data);
                    break;
                case 'sync-budgets':
                    await this.syncBudgets(data);
                    break;
                default:
                    console.warn('Unknown sync tag:', tag);
            }
        }

        async syncTransactions(data) {
            // Simulate API call
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Transactions synced:', data);
                    resolve();
                }, 1000);
            });
        }

        async syncBudgets(data) {
            // Simulate API call
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Budgets synced:', data);
                    resolve();
                }, 1000);
            });
        }

        async storePendingSync() {
            localStorage.setItem('pendingSync', JSON.stringify(this.pendingSync));
        }

        async loadPendingSync() {
            const stored = localStorage.getItem('pendingSync');
            if (stored) {
                this.pendingSync = JSON.parse(stored);
            }
        }

        async processPendingSync() {
            if (this.syncInProgress || !navigator.onLine) return;

            this.syncInProgress = true;
            await this.loadPendingSync();

            const pending = [...this.pendingSync];
            this.pendingSync = [];

            for (const item of pending) {
                try {
                    await this.performSync(item.tag, item.data);
                } catch (error) {
                    console.error('Sync failed:', error);
                    this.pendingSync.push(item);
                }
            }

            await this.storePendingSync();
            this.syncInProgress = false;
        }
    }

    // ===========================
    // WebAuthn Biometric Manager (Improved)
    // ===========================
    class BiometricAuthManager {
        constructor() {
            this.isAvailable = this.checkAvailability();
            this.credentials = new Map();
        }

        checkAvailability() {
            return 'credentials' in navigator && 
                   'create' in navigator.credentials &&
                   'get' in navigator.credentials;
        }

        async isSupported() {
            if (!this.isAvailable) return false;

            try {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return available;
            } catch (error) {
                console.error('WebAuthn availability check failed:', error);
                return false;
            }
        }

        async register(userId, username) {
            if (!this.isAvailable) {
                throw new Error('WebAuthn not available');
            }

            try {
                // Create challenge
                const challenge = crypto.getRandomValues(new Uint8Array(32));
                
                // Public key credential creation options
                const publicKeyCredentialCreationOptions = {
                    challenge,
                    rp: {
                        name: "Finance Dashboard",
                        id: window.location.hostname,
                    },
                    user: {
                        id: new TextEncoder().encode(userId),
                        name: username,
                        displayName: username,
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" }, // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000,
                    attestation: "indirect"
                };

                // Create credential
                const credential = await navigator.credentials.create({
                    publicKey: publicKeyCredentialCreationOptions
                });

                // Store credential info
                const credentialInfo = {
                    credId: this.bufferToBase64(credential.rawId),
                    publicKey: this.bufferToBase64(credential.response.publicKey),
                    userId,
                    username,
                    createdAt: Date.now()
                };

                this.credentials.set(userId, credentialInfo);
                this.saveCredentials();

                return credentialInfo;
            } catch (error) {
                console.error('WebAuthn registration failed:', error);
                throw error;
            }
        }

        async authenticate(userId) {
            if (!this.isAvailable) {
                throw new Error('WebAuthn not available');
            }

            const credentialInfo = this.credentials.get(userId);
            if (!credentialInfo) {
                throw new Error('No credentials found for user');
            }

            try {
                // Create challenge
                const challenge = crypto.getRandomValues(new Uint8Array(32));

                // Public key credential request options
                const publicKeyCredentialRequestOptions = {
                    challenge,
                    allowCredentials: [{
                        id: this.base64ToBuffer(credentialInfo.credId),
                        type: 'public-key',
                        transports: ['internal']
                    }],
                    userVerification: "required",
                    timeout: 60000
                };

                // Get assertion
                const assertion = await navigator.credentials.get({
                    publicKey: publicKeyCredentialRequestOptions
                });

                // Verify assertion (in production, this would be done server-side)
                const verified = this.verifyAssertion(assertion, challenge, credentialInfo);

                if (verified) {
                    return {
                        success: true,
                        userId,
                        timestamp: Date.now()
                    };
                } else {
                    throw new Error('Authentication verification failed');
                }
            } catch (error) {
                console.error('WebAuthn authentication failed:', error);
                throw error;
            }
        }

        verifyAssertion(assertion, challenge, credentialInfo) {
            // In production, this verification would happen server-side
            // Here we're doing a simplified client-side check
            try {
                const clientDataJSON = JSON.parse(
                    new TextDecoder().decode(assertion.response.clientDataJSON)
                );
                
                // Verify challenge
                const challengeBase64 = this.bufferToBase64(challenge);
                if (clientDataJSON.challenge !== challengeBase64) {
                    return false;
                }

                // Verify origin
                if (clientDataJSON.origin !== window.location.origin) {
                    return false;
                }

                // Additional verification would happen here in production
                return true;
            } catch (error) {
                console.error('Assertion verification error:', error);
                return false;
            }
        }

        async removeCredential(userId) {
            this.credentials.delete(userId);
            this.saveCredentials();
        }

        saveCredentials() {
            const data = Array.from(this.credentials.entries());
            localStorage.setItem('webauthn_credentials', JSON.stringify(data));
        }

        loadCredentials() {
            try {
                const stored = localStorage.getItem('webauthn_credentials');
                if (stored) {
                    const data = JSON.parse(stored);
                    this.credentials = new Map(data);
                }
            } catch (error) {
                console.error('Failed to load credentials:', error);
            }
        }

        bufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            bytes.forEach(byte => binary += String.fromCharCode(byte));
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }

        base64ToBuffer(base64) {
            const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes.buffer;
        }
    }

    // ===========================
    // Enhanced Camera Manager (Improved)
    // ===========================
    class CameraManager {
        constructor() {
            this.stream = null;
            this.videoElement = null;
            this.facingMode = 'environment';
            this.constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };
            this.errorHandlers = new Map();
        }

        async checkPermissions() {
            try {
                const result = await navigator.permissions.query({ name: 'camera' });
                return result.state;
            } catch (error) {
                console.warn('Permissions API not supported:', error);
                return 'prompt';
            }
        }

        async requestCamera() {
            try {
                // Check if camera is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera API not supported');
                }

                // Check permissions first
                const permissionState = await this.checkPermissions();
                if (permissionState === 'denied') {
                    throw new Error('Camera permission denied');
                }

                // Stop any existing stream
                await this.stopCamera();

                // Request camera access with fallback constraints
                try {
                    this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
                } catch (initialError) {
                    console.warn('Failed with ideal constraints, trying basic:', initialError);
                    // Fallback to basic constraints
                    this.stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                }

                return this.stream;
            } catch (error) {
                this.handleError(error);
                throw error;
            }
        }

        async switchCamera() {
            this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
            this.constraints.video.facingMode = this.facingMode;
            
            if (this.stream) {
                await this.stopCamera();
                return await this.requestCamera();
            }
        }

        async capturePhoto(videoElement) {
            if (!videoElement || !this.stream) {
                throw new Error('No video stream available');
            }

            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                
                const context = canvas.getContext('2d');
                context.drawImage(videoElement, 0, 0);
                
                // Convert to blob with quality settings
                return new Promise((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to capture photo'));
                            }
                        },
                        'image/jpeg',
                        0.8 // 80% quality
                    );
                });
            } catch (error) {
                this.handleError(error);
                throw error;
            }
        }

        async stopCamera() {
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.stream = null;
            }
        }

        handleError(error) {
            let errorMessage = 'Camera error';
            let errorType = 'unknown';
            let userAction = 'Please try again';

            // Comprehensive error handling
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied';
                errorType = 'permission';
                userAction = 'Please enable camera access in your browser settings';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found';
                errorType = 'not_found';
                userAction = 'Please connect a camera to your device';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Camera is already in use';
                errorType = 'in_use';
                userAction = 'Please close other apps using the camera';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage = 'Camera constraints not satisfied';
                errorType = 'constraints';
                userAction = 'Your camera may not support the requested settings';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Camera not supported';
                errorType = 'not_supported';
                userAction = 'Your browser does not support camera access';
            } else if (error.name === 'SecurityError') {
                errorMessage = 'Security error';
                errorType = 'security';
                userAction = 'Camera access is not allowed on insecure connections';
            } else if (error.message) {
                errorMessage = error.message;
            }

            const errorInfo = {
                message: errorMessage,
                type: errorType,
                userAction,
                originalError: error,
                timestamp: Date.now()
            };

            // Notify error handlers
            this.errorHandlers.forEach(handler => handler(errorInfo));

            console.error('Camera error:', errorInfo);
            return errorInfo;
        }

        onError(handler) {
            const id = Symbol();
            this.errorHandlers.set(id, handler);
            return () => this.errorHandlers.delete(id);
        }

        async getDevices() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                return devices.filter(device => device.kind === 'videoinput');
            } catch (error) {
                console.error('Failed to enumerate devices:', error);
                return [];
            }
        }

        async selectDevice(deviceId) {
            this.constraints.video = {
                deviceId: { exact: deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            };
            
            if (this.stream) {
                await this.stopCamera();
                return await this.requestCamera();
            }
        }
    }

    // ===========================
    // Mobile Components
    // ===========================
    
    // Mobile Navigation Component
    const MobileNavigation = () => {
        const { state } = window.FinanceApp.useFinance();
        const [activeTab, setActiveTab] = useState('dashboard');

        const tabs = [
            { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
            { id: 'transactions', icon: 'Receipt', label: 'Transactions' },
            { id: 'budgets', icon: 'PieChart', label: 'Budgets' },
            { id: 'accounts', icon: 'Wallet', label: 'Accounts' },
            { id: 'more', icon: 'Menu', label: 'More' }
        ];

        return e('nav', {
            className: 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden'
        }, 
            e('div', { className: 'flex justify-around items-center h-16' },
                tabs.map(tab => 
                    e('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                            activeTab === tab.id 
                                ? 'text-blue-500 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400'
                        }`
                    },
                        e(lucide[tab.icon], { size: 20 }),
                        e('span', { className: 'text-xs mt-1' }, tab.label)
                    )
                )
            )
        );
    };

    // Pull-to-Refresh Component
    const PullToRefresh = ({ onRefresh, children }) => {
        const [isPulling, setIsPulling] = useState(false);
        const [pullDistance, setPullDistance] = useState(0);
        const [isRefreshing, setIsRefreshing] = useState(false);
        const touchStartY = useRef(0);
        const containerRef = useRef(null);

        const handleTouchStart = useCallback((e) => {
            if (containerRef.current.scrollTop === 0) {
                touchStartY.current = e.touches[0].clientY;
                setIsPulling(true);
            }
        }, []);

        const handleTouchMove = useCallback((e) => {
            if (!isPulling || isRefreshing) return;

            const touchY = e.touches[0].clientY;
            const distance = Math.max(0, touchY - touchStartY.current);
            
            if (distance > 0) {
                e.preventDefault();
                setPullDistance(Math.min(distance, 150));
            }
        }, [isPulling, isRefreshing]);

        const handleTouchEnd = useCallback(async () => {
            if (!isPulling) return;

            setIsPulling(false);
            
            if (pullDistance > 80) {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
            }
            
            setPullDistance(0);
        }, [isPulling, pullDistance, onRefresh]);

        return e('div', {
            ref: containerRef,
            className: 'relative overflow-auto h-full',
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
            e('div', {
                className: 'absolute top-0 left-0 right-0 flex justify-center items-center transition-all',
                style: {
                    height: `${pullDistance}px`,
                    marginTop: `-${pullDistance}px`
                }
            },
                pullDistance > 80
                    ? e(lucide.RotateCw, { 
                        size: 24, 
                        className: `${isRefreshing ? 'animate-spin' : ''}` 
                      })
                    : e(lucide.ChevronDown, { size: 24 })
            ),
            children
        );
    };

    // Swipeable Card Component
    const SwipeableCard = ({ onSwipeLeft, onSwipeRight, children }) => {
        const [touchStart, setTouchStart] = useState(null);
        const [touchEnd, setTouchEnd] = useState(null);
        const [swiping, setSwiping] = useState(false);
        const [swipeDistance, setSwipeDistance] = useState(0);

        const minSwipeDistance = 50;

        const handleTouchStart = (e) => {
            setTouchEnd(null);
            setTouchStart(e.targetTouches[0].clientX);
            setSwiping(true);
        };

        const handleTouchMove = (e) => {
            if (!swiping) return;
            const currentTouch = e.targetTouches[0].clientX;
            setTouchEnd(currentTouch);
            setSwipeDistance(currentTouch - touchStart);
        };

        const handleTouchEnd = () => {
            if (!touchStart || !touchEnd) return;
            
            const distance = touchStart - touchEnd;
            const isLeftSwipe = distance > minSwipeDistance;
            const isRightSwipe = distance < -minSwipeDistance;

            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            } else if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }

            setSwiping(false);
            setSwipeDistance(0);
        };

        return e('div', {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            className: 'transition-transform',
            style: {
                transform: swiping ? `translateX(${swipeDistance}px)` : 'translateX(0)'
            }
        }, children);
    };

    // ===========================
    // PWA Manager Component
    // ===========================
    const PWAManager = () => {
        const [isInstallable, setIsInstallable] = useState(false);
        const [deferredPrompt, setDeferredPrompt] = useState(null);
        const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
        const [isOffline, setIsOffline] = useState(!navigator.onLine);
        const [biometricEnabled, setBiometricEnabled] = useState(false);
        const [biometricSupported, setBiometricSupported] = useState(false);

        const swManager = useRef(new ServiceWorkerManager());
        const biometricManager = useRef(new BiometricAuthManager());
        const cameraManager = useRef(new CameraManager());

        useEffect(() => {
            // Initialize service worker
            swManager.current.register();

            // Listen for install prompt
            const handleBeforeInstallPrompt = (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setIsInstallable(true);
            };

            // Listen for app installed
            const handleAppInstalled = () => {
                setIsInstallable(false);
                setDeferredPrompt(null);
            };

            // Listen for online/offline
            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.addEventListener('appinstalled', handleAppInstalled);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Check biometric support
            biometricManager.current.isSupported().then(supported => {
                setBiometricSupported(supported);
            });

            // Listen for service worker updates
            const unsubscribe = swManager.current.onUpdate(() => {
                setIsUpdateAvailable(true);
            });

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('appinstalled', handleAppInstalled);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                unsubscribe();
            };
        }, []);

        const handleInstall = async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('App installed');
            }
            
            setDeferredPrompt(null);
        };

        const handleUpdate = () => {
            swManager.current.skipWaiting();
        };

        const handleEnableBiometric = async () => {
            try {
                const user = window.FinanceApp.StateSelectors.getCurrentUser({ auth: { currentUser: { id: 'user123', username: 'testuser' } } });
                await biometricManager.current.register(user.id, user.username);
                setBiometricEnabled(true);
                window.FinanceApp.Utils.NotificationManager.show('Biometric authentication enabled', 'success');
            } catch (error) {
                window.FinanceApp.Utils.NotificationManager.show('Failed to enable biometric auth: ' + error.message, 'error');
            }
        };

        const testBiometric = async () => {
            try {
                const user = window.FinanceApp.StateSelectors.getCurrentUser({ auth: { currentUser: { id: 'user123' } } });
                const result = await biometricManager.current.authenticate(user.id);
                window.FinanceApp.Utils.NotificationManager.show('Biometric authentication successful', 'success');
            } catch (error) {
                window.FinanceApp.Utils.NotificationManager.show('Biometric authentication failed: ' + error.message, 'error');
            }
        };

        return e('div', { className: 'space-y-4' },
            // Offline indicator
            isOffline && e('div', { 
                className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg flex items-center gap-2'
            },
                e(lucide.WifiOff, { size: 20 }),
                e('span', null, 'You are offline. Changes will sync when connection is restored.')
            ),

            // Install prompt
            isInstallable && e('div', { 
                className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg'
            },
                e('div', { className: 'flex items-center justify-between' },
                    e('div', { className: 'flex items-center gap-2' },
                        e(lucide.Download, { size: 20 }),
                        e('span', null, 'Install Finance Dashboard for a better experience')
                    ),
                    e('button', {
                        onClick: handleInstall,
                        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, 'Install')
                )
            ),

            // Update available
            isUpdateAvailable && e('div', { 
                className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg'
            },
                e('div', { className: 'flex items-center justify-between' },
                    e('div', { className: 'flex items-center gap-2' },
                        e(lucide.RefreshCw, { size: 20 }),
                        e('span', null, 'A new version is available')
                    ),
                    e('button', {
                        onClick: handleUpdate,
                        className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
                    }, 'Update')
                )
            ),

            // Biometric authentication
            biometricSupported && e('div', { className: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg' },
                e('h3', { className: 'font-semibold mb-2' }, 'Biometric Authentication'),
                !biometricEnabled 
                    ? e('button', {
                        onClick: handleEnableBiometric,
                        className: 'px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
                      }, 'Enable Biometric Login')
                    : e('div', { className: 'space-y-2' },
                        e('p', { className: 'text-green-600 dark:text-green-400' }, 'Biometric authentication is enabled'),
                        e('button', {
                            onClick: testBiometric,
                            className: 'px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
                        }, 'Test Biometric Login')
                      )
            )
        );
    };

    // ===========================
    // Receipt Scanner Component (Improved)
    // ===========================
    const ReceiptScanner = ({ onScan, onClose }) => {
        const [scanning, setScanning] = useState(false);
        const [error, setError] = useState(null);
        const [devices, setDevices] = useState([]);
        const [selectedDevice, setSelectedDevice] = useState(null);
        const videoRef = useRef(null);
        const cameraManager = useRef(new CameraManager());

        useEffect(() => {
            // Load available cameras
            cameraManager.current.getDevices().then(deviceList => {
                setDevices(deviceList);
                if (deviceList.length > 0) {
                    setSelectedDevice(deviceList[0].deviceId);
                }
            });

            // Setup error handler
            const unsubscribe = cameraManager.current.onError((errorInfo) => {
                setError(errorInfo);
                setScanning(false);
            });

            return () => {
                cameraManager.current.stopCamera();
                unsubscribe();
            };
        }, []);

        const startScanning = async () => {
            try {
                setError(null);
                setScanning(true);

                if (selectedDevice) {
                    await cameraManager.current.selectDevice(selectedDevice);
                }

                const stream = await cameraManager.current.requestCamera();
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (err) {
                // Error is handled by the camera manager
                setScanning(false);
            }
        };

        const captureReceipt = async () => {
            try {
                const blob = await cameraManager.current.capturePhoto(videoRef.current);
                
                // Simulate OCR processing
                window.FinanceApp.Utils.NotificationManager.show('Processing receipt...', 'info');
                
                setTimeout(() => {
                    const mockData = {
                        merchant: 'Sample Store',
                        total: Math.floor(Math.random() * 100) + 10,
                        date: new Date().toISOString(),
                        items: [
                            { name: 'Item 1', price: 10.99 },
                            { name: 'Item 2', price: 25.50 }
                        ]
                    };
                    
                    onScan(mockData);
                    stopScanning();
                }, 2000);
            } catch (err) {
                window.FinanceApp.Utils.NotificationManager.show('Failed to capture receipt', 'error');
            }
        };

        const stopScanning = () => {
            cameraManager.current.stopCamera();
            setScanning(false);
        };

        const switchCamera = async () => {
            try {
                await cameraManager.current.switchCamera();
                if (videoRef.current && cameraManager.current.stream) {
                    videoRef.current.srcObject = cameraManager.current.stream;
                }
            } catch (err) {
                // Error handled by camera manager
            }
        };

        return e('div', { className: 'fixed inset-0 bg-black z-50 flex flex-col' },
            // Header
            e('div', { className: 'bg-gray-900 p-4 flex items-center justify-between' },
                e('h2', { className: 'text-white text-lg font-semibold' }, 'Scan Receipt'),
                e('button', {
                    onClick: onClose,
                    className: 'text-white'
                }, e(lucide.X, { size: 24 }))
            ),

            // Camera view
            e('div', { className: 'flex-1 relative' },
                !scanning 
                    ? e('div', { className: 'h-full flex flex-col items-center justify-center p-8' },
                        error 
                            ? e('div', { className: 'text-center' },
                                e('div', { className: 'text-red-400 mb-4' },
                                    e(lucide.AlertCircle, { size: 48, className: 'mx-auto mb-2' }),
                                    e('p', { className: 'font-semibold' }, error.message),
                                    e('p', { className: 'text-sm mt-2' }, error.userAction)
                                ),
                                e('button', {
                                    onClick: startScanning,
                                    className: 'mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg'
                                }, 'Try Again')
                              )
                            : e('div', { className: 'text-center' },
                                e(lucide.Camera, { size: 64, className: 'text-gray-400 mx-auto mb-4' }),
                                e('p', { className: 'text-gray-300 mb-4' }, 'Position the receipt in the camera view'),
                                devices.length > 1 && e('select', {
                                    value: selectedDevice,
                                    onChange: (e) => setSelectedDevice(e.target.value),
                                    className: 'mb-4 px-4 py-2 bg-gray-800 text-white rounded'
                                },
                                    devices.map(device => 
                                        e('option', { 
                                            key: device.deviceId, 
                                            value: device.deviceId 
                                        }, device.label || `Camera ${device.deviceId.substr(0, 8)}...`)
                                    )
                                ),
                                e('button', {
                                    onClick: startScanning,
                                    className: 'px-6 py-3 bg-blue-500 text-white rounded-lg'
                                }, 'Start Camera')
                              )
                      )
                    : e('div', { className: 'h-full relative' },
                        e('video', {
                            ref: videoRef,
                            className: 'h-full w-full object-cover',
                            playsInline: true,
                            muted: true
                        }),
                        // Scanning overlay
                        e('div', { className: 'absolute inset-0 flex items-center justify-center' },
                            e('div', { 
                                className: 'w-80 h-96 border-2 border-white rounded-lg',
                                style: {
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                                }
                            })
                        ),
                        // Controls
                        e('div', { className: 'absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4' },
                            devices.length > 1 && e('button', {
                                onClick: switchCamera,
                                className: 'p-3 bg-gray-800 text-white rounded-full'
                            }, e(lucide.RotateCw, { size: 24 })),
                            e('button', {
                                onClick: captureReceipt,
                                className: 'p-4 bg-blue-500 text-white rounded-full'
                            }, e(lucide.Camera, { size: 32 })),
                            e('button', {
                                onClick: stopScanning,
                                className: 'p-3 bg-gray-800 text-white rounded-full'
                            }, e(lucide.X, { size: 24 }))
                        )
                      )
            )
        );
    };

    // ===========================
    // Export API
    // ===========================
    global.FinanceApp = global.FinanceApp || {};
    global.FinanceApp.PWAFeatures = {
        // Managers
        ServiceWorkerManager,
        BackgroundSyncManager,
        BiometricAuthManager,
        CameraManager,

        // Components
        MobileNavigation,
        PullToRefresh,
        SwipeableCard,
        PWAManager,
        ReceiptScanner,

        // Initialize
        initialize: async function() {
            console.log('Initializing PWA Features...');
            
            // Register service worker
            const swManager = new ServiceWorkerManager();
            await swManager.register();

            // Initialize background sync
            const syncManager = new BackgroundSyncManager();
            window.addEventListener('online', () => syncManager.processPendingSync());

            // Load biometric credentials
            const biometricManager = new BiometricAuthManager();
            biometricManager.loadCredentials();

            console.log('PWA Features initialized successfully');
            return true;
        }
    };

})(window);
