/**
 * app-storage.js - Enterprise Storage Management System
 * Provides comprehensive data persistence with multiple storage backends,
 * encryption, caching, migration, and import/export capabilities.
 */

(function(global) {
    'use strict';

    // Storage System Configuration
    const STORAGE_CONFIG = {
        version: '1.0.0',
        prefix: 'ffd_', // Family Finance Dashboard prefix
        encryption: {
            enabled: true,
            algorithm: 'AES-GCM',
            keyDerivation: 'PBKDF2',
            iterations: 100000
        },
        quota: {
            localStorage: 5 * 1024 * 1024, // 5MB
            indexedDB: 50 * 1024 * 1024,    // 50MB
            warning: 0.8,                   // Warn at 80% usage
            critical: 0.95                  // Critical at 95% usage
        },
        sync: {
            enabled: true,
            interval: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 5000
        },
        compression: {
            enabled: true,
            threshold: 1024 // Compress data larger than 1KB
        }
    };

    /**
     * Storage Manager - Singleton Pattern
     * Manages all storage operations with automatic fallback mechanisms
     */
    class StorageManager {
        constructor() {
            if (StorageManager.instance) {
                return StorageManager.instance;
            }

            this.config = { ...STORAGE_CONFIG };
            this.cache = new Map();
            this.dirty = new Set();
            this.syncQueue = [];
            this.encryptionKey = null;
            this.isInitialized = false;
            this.storageBackends = new Map();
            this.migrationHistory = [];
            this.eventEmitter = new EventTarget();
            
            StorageManager.instance = this;
        }

        /**
         * Initialize the storage system
         */
        async initialize() {
            if (this.isInitialized) return;

            try {
                // Initialize storage backends
                await this._initializeBackends();
                
                // Setup encryption if enabled
                if (this.config.encryption.enabled) {
                    await this._initializeEncryption();
                }
                
                // Run migrations
                await this._runMigrations();
                
                // Start sync service
                if (this.config.sync.enabled) {
                    this._startSyncService();
                }
                
                // Monitor storage quota
                this._monitorStorageQuota();
                
                this.isInitialized = true;
                this._emit('initialized');
                
            } catch (error) {
                console.error('Storage initialization failed:', error);
                throw new StorageError('Failed to initialize storage system', error);
            }
        }

        /**
         * Initialize storage backends with fallback mechanism
         */
        async _initializeBackends() {
            // IndexedDB Backend
            try {
                const idb = await this._initializeIndexedDB();
                this.storageBackends.set('indexedDB', idb);
            } catch (error) {
                console.warn('IndexedDB initialization failed:', error);
            }

            // LocalStorage Backend
            try {
                if (this._isLocalStorageAvailable()) {
                    this.storageBackends.set('localStorage', {
                        type: 'localStorage',
                        available: true,
                        quota: this.config.quota.localStorage
                    });
                }
            } catch (error) {
                console.warn('LocalStorage not available:', error);
            }

            // SessionStorage Backend
            try {
                if (this._isSessionStorageAvailable()) {
                    this.storageBackends.set('sessionStorage', {
                        type: 'sessionStorage',
                        available: true,
                        quota: 5 * 1024 * 1024 // 5MB typical limit
                    });
                }
            } catch (error) {
                console.warn('SessionStorage not available:', error);
            }

            // Memory Backend (always available)
            this.storageBackends.set('memory', {
                type: 'memory',
                available: true,
                data: new Map(),
                quota: 10 * 1024 * 1024 // 10MB limit for memory storage
            });

            if (this.storageBackends.size === 0) {
                throw new Error('No storage backends available');
            }
        }

        /**
         * Initialize IndexedDB with proper error handling
         */
        async _initializeIndexedDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(`${this.config.prefix}database`, 1);
                
                request.onerror = () => reject(request.error);
                
                request.onsuccess = () => {
                    resolve({
                        type: 'indexedDB',
                        available: true,
                        db: request.result,
                        quota: this.config.quota.indexedDB
                    });
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object stores
                    if (!db.objectStoreNames.contains('data')) {
                        db.createObjectStore('data', { keyPath: 'key' });
                    }
                    
                    if (!db.objectStoreNames.contains('metadata')) {
                        const metaStore = db.createObjectStore('metadata', { keyPath: 'key' });
                        metaStore.createIndex('type', 'type', { unique: false });
                        metaStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                    
                    if (!db.objectStoreNames.contains('sync')) {
                        const syncStore = db.createObjectStore('sync', { keyPath: 'id', autoIncrement: true });
                        syncStore.createIndex('status', 'status', { unique: false });
                        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        }

        /**
         * Initialize encryption system
         */
        async _initializeEncryption() {
            try {
                // Check if encryption key exists
                let keyData = await this._getRawData('_encryption_key', 'localStorage');
                
                if (!keyData) {
                    // Generate new encryption key
                    this.encryptionKey = await this._generateEncryptionKey();
                    
                    // Store key (in production, use more secure method)
                    await this._setRawData('_encryption_key', 
                        await this._exportKey(this.encryptionKey), 
                        'localStorage'
                    );
                } else {
                    // Import existing key
                    this.encryptionKey = await this._importKey(keyData);
                }
            } catch (error) {
                console.error('Encryption initialization failed:', error);
                this.config.encryption.enabled = false;
            }
        }

        /**
         * Store data with automatic backend selection
         */
        async set(key, value, options = {}) {
            const storageKey = this.config.prefix + key;
            const timestamp = Date.now();
            
            try {
                // Validate input
                if (!key || typeof key !== 'string') {
                    throw new ValidationError('Invalid key provided');
                }
                
                // Prepare data
                let data = {
                    key: storageKey,
                    value: value,
                    timestamp: timestamp,
                    type: options.type || 'data',
                    metadata: {
                        created: timestamp,
                        modified: timestamp,
                        accessed: timestamp,
                        version: this.config.version,
                        ...options.metadata
                    }
                };
                
                // Compress if needed
                if (this.config.compression.enabled && 
                    JSON.stringify(value).length > this.config.compression.threshold) {
                    data = await this._compressData(data);
                }
                
                // Encrypt if enabled
                if (this.config.encryption.enabled && !options.skipEncryption) {
                    data.value = await this._encrypt(data.value);
                    data.encrypted = true;
                }
                
                // Store in cache
                this.cache.set(storageKey, data);
                
                // Mark as dirty for sync
                this.dirty.add(storageKey);
                
                // Store in backend
                const backend = this._selectBackend(data, options.backend);
                await this._storeInBackend(backend, storageKey, data);
                
                // Emit event
                this._emit('set', { key, value, backend: backend.type });
                
                return true;
                
            } catch (error) {
                console.error(`Failed to store key: ${key}`, error);
                throw new StorageError(`Failed to store data for key: ${key}`, error);
            }
        }

        /**
         * Retrieve data with automatic fallback
         */
        async get(key, options = {}) {
            const storageKey = this.config.prefix + key;
            
            try {
                // Check cache first
                if (this.cache.has(storageKey) && !options.skipCache) {
                    const cached = this.cache.get(storageKey);
                    cached.metadata.accessed = Date.now();
                    return cached.value;
                }
                
                // Try each backend in priority order
                const backends = this._getBackendPriority();
                
                for (const backend of backends) {
                    try {
                        const data = await this._getFromBackend(backend, storageKey);
                        
                        if (data) {
                            // Decrypt if needed
                            if (data.encrypted && this.config.encryption.enabled) {
                                data.value = await this._decrypt(data.value);
                            }
                            
                            // Decompress if needed
                            if (data.compressed) {
                                data.value = await this._decompressData(data.value);
                            }
                            
                            // Update cache
                            this.cache.set(storageKey, data);
                            
                            // Update access time
                            data.metadata.accessed = Date.now();
                            
                            // Emit event
                            this._emit('get', { key, backend: backend.type });
                            
                            return data.value;
                        }
                    } catch (backendError) {
                        console.warn(`Backend ${backend.type} failed:`, backendError);
                    }
                }
                
                // If default value provided
                if ('default' in options) {
                    return options.default;
                }
                
                return null;
                
            } catch (error) {
                console.error(`Failed to retrieve key: ${key}`, error);
                throw new StorageError(`Failed to retrieve data for key: ${key}`, error);
            }
        }

        /**
         * Remove data from all backends
         */
        async remove(key) {
            const storageKey = this.config.prefix + key;
            
            try {
                // Remove from cache
                this.cache.delete(storageKey);
                this.dirty.delete(storageKey);
                
                // Remove from all backends
                const promises = [];
                
                for (const [name, backend] of this.storageBackends) {
                    promises.push(this._removeFromBackend(backend, storageKey));
                }
                
                await Promise.allSettled(promises);
                
                // Emit event
                this._emit('remove', { key });
                
                return true;
                
            } catch (error) {
                console.error(`Failed to remove key: ${key}`, error);
                throw new StorageError(`Failed to remove data for key: ${key}`, error);
            }
        }

        /**
         * Clear all data with optional filter
         */
        async clear(filter = null) {
            try {
                if (filter && typeof filter === 'function') {
                    // Clear with filter
                    const keys = await this.keys();
                    const promises = [];
                    
                    for (const key of keys) {
                        if (filter(key)) {
                            promises.push(this.remove(key));
                        }
                    }
                    
                    await Promise.allSettled(promises);
                } else {
                    // Clear all
                    this.cache.clear();
                    this.dirty.clear();
                    
                    // Clear all backends
                    for (const [name, backend] of this.storageBackends) {
                        await this._clearBackend(backend);
                    }
                }
                
                // Emit event
                this._emit('clear', { filter: !!filter });
                
                return true;
                
            } catch (error) {
                console.error('Failed to clear storage:', error);
                throw new StorageError('Failed to clear storage', error);
            }
        }

        /**
         * Get all keys
         */
        async keys() {
            const allKeys = new Set();
            
            try {
                // Get keys from all backends
                for (const [name, backend] of this.storageBackends) {
                    const keys = await this._getKeysFromBackend(backend);
                    keys.forEach(key => {
                        if (key.startsWith(this.config.prefix)) {
                            allKeys.add(key.substring(this.config.prefix.length));
                        }
                    });
                }
                
                return Array.from(allKeys);
                
            } catch (error) {
                console.error('Failed to get keys:', error);
                throw new StorageError('Failed to retrieve keys', error);
            }
        }

        /**
         * Export all data
         */
        async export(options = {}) {
            try {
                const exportData = {
                    version: this.config.version,
                    timestamp: Date.now(),
                    data: {},
                    metadata: {
                        totalKeys: 0,
                        totalSize: 0,
                        compressed: options.compress || false,
                        encrypted: options.encrypt || false
                    }
                };
                
                // Get all keys and data
                const keys = await this.keys();
                
                for (const key of keys) {
                    const value = await this.get(key);
                    exportData.data[key] = value;
                    exportData.metadata.totalKeys++;
                }
                
                // Calculate size
                const jsonString = JSON.stringify(exportData);
                exportData.metadata.totalSize = new Blob([jsonString]).size;
                
                // Compress if requested
                if (options.compress) {
                    return await this._compressData(exportData);
                }
                
                return exportData;
                
            } catch (error) {
                console.error('Export failed:', error);
                throw new StorageError('Failed to export data', error);
            }
        }

        /**
         * Import data with validation
         */
        async import(data, options = {}) {
            try {
                // Decompress if needed
                if (data.compressed) {
                    data = await this._decompressData(data);
                }
                
                // Validate import data
                if (!data.version || !data.data) {
                    throw new ValidationError('Invalid import data format');
                }
                
                // Check version compatibility
                if (!this._isVersionCompatible(data.version)) {
                    if (!options.force) {
                        throw new ValidationError(`Incompatible version: ${data.version}`);
                    }
                }
                
                // Clear existing data if requested
                if (options.clearExisting) {
                    await this.clear();
                }
                
                // Import data
                const imported = [];
                const failed = [];
                
                for (const [key, value] of Object.entries(data.data)) {
                    try {
                        await this.set(key, value, { skipEncryption: !options.encrypt });
                        imported.push(key);
                    } catch (error) {
                        failed.push({ key, error: error.message });
                    }
                }
                
                // Emit event
                this._emit('import', { 
                    imported: imported.length, 
                    failed: failed.length,
                    total: Object.keys(data.data).length 
                });
                
                return {
                    success: imported.length > 0,
                    imported: imported.length,
                    failed: failed.length,
                    errors: failed
                };
                
            } catch (error) {
                console.error('Import failed:', error);
                throw new StorageError('Failed to import data', error);
            }
        }

        /**
         * Sync dirty data to persistent storage
         */
        async sync() {
            if (this.dirty.size === 0) return { synced: 0 };
            
            const toSync = Array.from(this.dirty);
            const synced = [];
            const failed = [];
            
            for (const key of toSync) {
                try {
                    const data = this.cache.get(key);
                    if (data) {
                        // Store in primary backend
                        const backend = this._selectBackend(data);
                        await this._storeInBackend(backend, key, data);
                        
                        synced.push(key);
                        this.dirty.delete(key);
                    }
                } catch (error) {
                    failed.push({ key, error: error.message });
                }
            }
            
            // Emit sync event
            this._emit('sync', { synced: synced.length, failed: failed.length });
            
            return {
                synced: synced.length,
                failed: failed.length,
                errors: failed
            };
        }

        /**
         * Get storage statistics
         */
        async getStats() {
            const stats = {
                backends: {},
                cache: {
                    size: this.cache.size,
                    dirty: this.dirty.size
                },
                quota: {},
                usage: {}
            };
            
            // Get backend stats
            for (const [name, backend] of this.storageBackends) {
                stats.backends[name] = {
                    available: backend.available,
                    type: backend.type
                };
                
                // Get usage stats
                const usage = await this._getBackendUsage(backend);
                stats.usage[name] = usage;
                
                if (backend.quota) {
                    stats.quota[name] = {
                        total: backend.quota,
                        used: usage.bytes,
                        percentage: (usage.bytes / backend.quota) * 100
                    };
                }
            }
            
            return stats;
        }

        /**
         * Monitor storage quota and emit warnings
         */
        async _monitorStorageQuota() {
            setInterval(async () => {
                try {
                    const stats = await this.getStats();
                    
                    for (const [backend, quota] of Object.entries(stats.quota)) {
                        const percentage = quota.percentage / 100;
                        
                        if (percentage >= this.config.quota.critical) {
                            this._emit('quota-critical', { backend, percentage: quota.percentage });
                        } else if (percentage >= this.config.quota.warning) {
                            this._emit('quota-warning', { backend, percentage: quota.percentage });
                        }
                    }
                } catch (error) {
                    console.error('Quota monitoring failed:', error);
                }
            }, 60000); // Check every minute
        }

        /**
         * Backend operations
         */
        async _storeInBackend(backend, key, data) {
            switch (backend.type) {
                case 'indexedDB':
                    return this._storeInIndexedDB(backend.db, key, data);
                    
                case 'localStorage':
                    return this._storeInLocalStorage(key, data);
                    
                case 'sessionStorage':
                    return this._storeInSessionStorage(key, data);
                    
                case 'memory':
                    backend.data.set(key, data);
                    return true;
                    
                default:
                    throw new Error(`Unknown backend type: ${backend.type}`);
            }
        }

        async _getFromBackend(backend, key) {
            switch (backend.type) {
                case 'indexedDB':
                    return this._getFromIndexedDB(backend.db, key);
                    
                case 'localStorage':
                    return this._getFromLocalStorage(key);
                    
                case 'sessionStorage':
                    return this._getFromSessionStorage(key);
                    
                case 'memory':
                    return backend.data.get(key);
                    
                default:
                    throw new Error(`Unknown backend type: ${backend.type}`);
            }
        }

        async _removeFromBackend(backend, key) {
            switch (backend.type) {
                case 'indexedDB':
                    return this._removeFromIndexedDB(backend.db, key);
                    
                case 'localStorage':
                    localStorage.removeItem(key);
                    return true;
                    
                case 'sessionStorage':
                    sessionStorage.removeItem(key);
                    return true;
                    
                case 'memory':
                    return backend.data.delete(key);
                    
                default:
                    throw new Error(`Unknown backend type: ${backend.type}`);
            }
        }

        /**
         * IndexedDB operations
         */
        async _storeInIndexedDB(db, key, data) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                const request = store.put(data);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        async _getFromIndexedDB(db, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['data'], 'readonly');
                const store = transaction.objectStore('data');
                const request = store.get(key);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async _removeFromIndexedDB(db, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                const request = store.delete(key);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * LocalStorage operations
         */
        _storeInLocalStorage(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    this._handleQuotaExceeded('localStorage');
                }
                throw error;
            }
        }

        _getFromLocalStorage(key) {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }

        /**
         * SessionStorage operations
         */
        _storeInSessionStorage(key, data) {
            try {
                sessionStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    this._handleQuotaExceeded('sessionStorage');
                }
                throw error;
            }
        }

        _getFromSessionStorage(key) {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }

        /**
         * Encryption operations
         */
        async _encrypt(data) {
            if (!this.encryptionKey) return data;
            
            try {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(JSON.stringify(data));
                
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encrypted = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv },
                    this.encryptionKey,
                    dataBuffer
                );
                
                return {
                    iv: Array.from(iv),
                    data: Array.from(new Uint8Array(encrypted))
                };
            } catch (error) {
                console.error('Encryption failed:', error);
                throw new EncryptionError('Failed to encrypt data', error);
            }
        }

        async _decrypt(encryptedData) {
            if (!this.encryptionKey || !encryptedData.iv || !encryptedData.data) {
                return encryptedData;
            }
            
            try {
                const decrypted = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
                    this.encryptionKey,
                    new Uint8Array(encryptedData.data)
                );
                
                const decoder = new TextDecoder();
                return JSON.parse(decoder.decode(decrypted));
            } catch (error) {
                console.error('Decryption failed:', error);
                throw new EncryptionError('Failed to decrypt data', error);
            }
        }

        async _generateEncryptionKey() {
            return crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        async _exportKey(key) {
            const exported = await crypto.subtle.exportKey('raw', key);
            return Array.from(new Uint8Array(exported));
        }

        async _importKey(keyData) {
            return crypto.subtle.importKey(
                'raw',
                new Uint8Array(keyData),
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        /**
         * Compression operations
         */
        async _compressData(data) {
            try {
                const jsonString = JSON.stringify(data);
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(jsonString);
                
                // Simple compression using CompressionStream if available
                if (typeof CompressionStream !== 'undefined') {
                    const cs = new CompressionStream('gzip');
                    const writer = cs.writable.getWriter();
                    writer.write(dataBuffer);
                    writer.close();
                    
                    const chunks = [];
                    const reader = cs.readable.getReader();
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                    }
                    
                    const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
                    let offset = 0;
                    
                    for (const chunk of chunks) {
                        compressed.set(chunk, offset);
                        offset += chunk.length;
                    }
                    
                    return {
                        compressed: true,
                        data: Array.from(compressed),
                        originalSize: dataBuffer.length,
                        compressedSize: compressed.length
                    };
                }
                
                // Fallback - no compression
                return data;
                
            } catch (error) {
                console.error('Compression failed:', error);
                return data;
            }
        }

        async _decompressData(compressedData) {
            try {
                if (!compressedData.compressed || !compressedData.data) {
                    return compressedData;
                }
                
                if (typeof DecompressionStream !== 'undefined') {
                    const ds = new DecompressionStream('gzip');
                    const writer = ds.writable.getWriter();
                    writer.write(new Uint8Array(compressedData.data));
                    writer.close();
                    
                    const chunks = [];
                    const reader = ds.readable.getReader();
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                    }
                    
                    const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
                    let offset = 0;
                    
                    for (const chunk of chunks) {
                        decompressed.set(chunk, offset);
                        offset += chunk.length;
                    }
                    
                    const decoder = new TextDecoder();
                    return JSON.parse(decoder.decode(decompressed));
                }
                
                // Fallback
                return compressedData;
                
            } catch (error) {
                console.error('Decompression failed:', error);
                return compressedData;
            }
        }

        /**
         * Event handling
         */
        _emit(event, data) {
            const customEvent = new CustomEvent(`storage:${event}`, { detail: data });
            this.eventEmitter.dispatchEvent(customEvent);
        }

        on(event, callback) {
            this.eventEmitter.addEventListener(`storage:${event}`, callback);
        }

        off(event, callback) {
            this.eventEmitter.removeEventListener(`storage:${event}`, callback);
        }

        /**
         * Utility methods
         */
        _selectBackend(data, preferredBackend = null) {
            if (preferredBackend && this.storageBackends.has(preferredBackend)) {
                return this.storageBackends.get(preferredBackend);
            }
            
            // Select based on data size and availability
            const dataSize = new Blob([JSON.stringify(data)]).size;
            
            // Prefer IndexedDB for large data
            if (dataSize > 1024 * 100 && this.storageBackends.has('indexedDB')) {
                return this.storageBackends.get('indexedDB');
            }
            
            // Use localStorage for smaller persistent data
            if (this.storageBackends.has('localStorage')) {
                return this.storageBackends.get('localStorage');
            }
            
            // Fallback to any available backend
            for (const [name, backend] of this.storageBackends) {
                if (backend.available) return backend;
            }
            
            throw new Error('No suitable storage backend available');
        }

        _getBackendPriority() {
            const priority = ['indexedDB', 'localStorage', 'sessionStorage', 'memory'];
            const available = [];
            
            for (const name of priority) {
                if (this.storageBackends.has(name)) {
                    available.push(this.storageBackends.get(name));
                }
            }
            
            return available;
        }

        _isLocalStorageAvailable() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }

        _isSessionStorageAvailable() {
            try {
                const test = '__storage_test__';
                sessionStorage.setItem(test, test);
                sessionStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }

        _isVersionCompatible(version) {
            const [major] = version.split('.').map(Number);
            const [currentMajor] = this.config.version.split('.').map(Number);
            return major === currentMajor;
        }

        async _getBackendUsage(backend) {
            const usage = { items: 0, bytes: 0 };
            
            switch (backend.type) {
                case 'localStorage':
                case 'sessionStorage':
                    const storage = backend.type === 'localStorage' ? localStorage : sessionStorage;
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        if (key.startsWith(this.config.prefix)) {
                            usage.items++;
                            usage.bytes += storage.getItem(key).length * 2; // UTF-16
                        }
                    }
                    break;
                    
                case 'indexedDB':
                    // Estimate based on navigator.storage if available
                    if ('storage' in navigator && 'estimate' in navigator.storage) {
                        const estimate = await navigator.storage.estimate();
                        usage.bytes = estimate.usage || 0;
                    }
                    break;
                    
                case 'memory':
                    usage.items = backend.data.size;
                    for (const [key, value] of backend.data) {
                        usage.bytes += new Blob([JSON.stringify(value)]).size;
                    }
                    break;
            }
            
            return usage;
        }

        async _clearBackend(backend) {
            switch (backend.type) {
                case 'localStorage':
                case 'sessionStorage':
                    const storage = backend.type === 'localStorage' ? localStorage : sessionStorage;
                    const keysToRemove = [];
                    
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        if (key.startsWith(this.config.prefix)) {
                            keysToRemove.push(key);
                        }
                    }
                    
                    keysToRemove.forEach(key => storage.removeItem(key));
                    break;
                    
                case 'indexedDB':
                    const transaction = backend.db.transaction(['data'], 'readwrite');
                    const store = transaction.objectStore('data');
                    await store.clear();
                    break;
                    
                case 'memory':
                    backend.data.clear();
                    break;
            }
        }

        async _getKeysFromBackend(backend) {
            const keys = [];
            
            switch (backend.type) {
                case 'localStorage':
                case 'sessionStorage':
                    const storage = backend.type === 'localStorage' ? localStorage : sessionStorage;
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        if (key.startsWith(this.config.prefix)) {
                            keys.push(key);
                        }
                    }
                    break;
                    
                case 'indexedDB':
                    const transaction = backend.db.transaction(['data'], 'readonly');
                    const store = transaction.objectStore('data');
                    const request = store.getAllKeys();
                    
                    await new Promise((resolve, reject) => {
                        request.onsuccess = () => {
                            keys.push(...request.result);
                            resolve();
                        };
                        request.onerror = () => reject(request.error);
                    });
                    break;
                    
                case 'memory':
                    keys.push(...backend.data.keys());
                    break;
            }
            
            return keys;
        }

        _handleQuotaExceeded(backend) {
            this._emit('quota-exceeded', { backend });
            
            // Try to clean up old data
            // This is a simple implementation - in production, implement smarter cleanup
            console.warn(`Quota exceeded for ${backend}, attempting cleanup...`);
        }

        /**
         * Start background sync service
         */
        _startSyncService() {
            setInterval(async () => {
                if (this.dirty.size > 0) {
                    try {
                        await this.sync();
                    } catch (error) {
                        console.error('Background sync failed:', error);
                    }
                }
            }, this.config.sync.interval);
        }

        /**
         * Migration system
         */
        async _runMigrations() {
            const currentVersion = await this.get('_system_version', { default: '0.0.0' });
            
            if (currentVersion === this.config.version) {
                return; // No migration needed
            }
            
            console.log(`Migrating from ${currentVersion} to ${this.config.version}`);
            
            // Define migrations
            const migrations = [
                // Example migration
                {
                    version: '1.0.0',
                    up: async () => {
                        // Migration logic here
                        console.log('Running migration to 1.0.0');
                    },
                    down: async () => {
                        // Rollback logic
                        console.log('Rolling back from 1.0.0');
                    }
                }
            ];
            
            // Run applicable migrations
            for (const migration of migrations) {
                if (this._compareVersions(currentVersion, migration.version) < 0) {
                    try {
                        await migration.up();
                        this.migrationHistory.push({
                            version: migration.version,
                            timestamp: Date.now(),
                            success: true
                        });
                    } catch (error) {
                        console.error(`Migration to ${migration.version} failed:`, error);
                        this.migrationHistory.push({
                            version: migration.version,
                            timestamp: Date.now(),
                            success: false,
                            error: error.message
                        });
                        throw error;
                    }
                }
            }
            
            // Update system version
            await this.set('_system_version', this.config.version, { 
                type: 'system',
                skipEncryption: true 
            });
        }

        _compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const part1 = parts1[i] || 0;
                const part2 = parts2[i] || 0;
                
                if (part1 < part2) return -1;
                if (part1 > part2) return 1;
            }
            
            return 0;
        }

        async _getRawData(key, backend) {
            const storage = backend === 'localStorage' ? localStorage : sessionStorage;
            const data = storage.getItem(this.config.prefix + key);
            return data ? JSON.parse(data) : null;
        }

        async _setRawData(key, value, backend) {
            const storage = backend === 'localStorage' ? localStorage : sessionStorage;
            storage.setItem(this.config.prefix + key, JSON.stringify(value));
        }
    }

    /**
     * Custom Error Classes
     */
    class StorageError extends Error {
        constructor(message, cause) {
            super(message);
            this.name = 'StorageError';
            this.cause = cause;
        }
    }

    class ValidationError extends StorageError {
        constructor(message) {
            super(message);
            this.name = 'ValidationError';
        }
    }

    class EncryptionError extends StorageError {
        constructor(message, cause) {
            super(message, cause);
            this.name = 'EncryptionError';
        }
    }

    /**
     * Storage Facade - Simplified API
     */
    class Storage {
        constructor() {
            this.manager = new StorageManager();
            this._initialized = false;
            this._initPromise = null;
        }

        async _ensureInitialized() {
            if (!this._initialized) {
                if (!this._initPromise) {
                    this._initPromise = this.manager.initialize();
                }
                await this._initPromise;
                this._initialized = true;
            }
        }

        async set(key, value, options) {
            await this._ensureInitialized();
            return this.manager.set(key, value, options);
        }

        async get(key, defaultValue = null) {
            await this._ensureInitialized();
            return this.manager.get(key, { default: defaultValue });
        }

        async remove(key) {
            await this._ensureInitialized();
            return this.manager.remove(key);
        }

        async clear(filter) {
            await this._ensureInitialized();
            return this.manager.clear(filter);
        }

        async keys() {
            await this._ensureInitialized();
            return this.manager.keys();
        }

        async has(key) {
            await this._ensureInitialized();
            const value = await this.manager.get(key);
            return value !== null;
        }

        async export(options) {
            await this._ensureInitialized();
            return this.manager.export(options);
        }

        async import(data, options) {
            await this._ensureInitialized();
            return this.manager.import(data, options);
        }

        async sync() {
            await this._ensureInitialized();
            return this.manager.sync();
        }

        async getStats() {
            await this._ensureInitialized();
            return this.manager.getStats();
        }

        on(event, callback) {
            this.manager.on(event, callback);
        }

        off(event, callback) {
            this.manager.off(event, callback);
        }

        // Convenience methods
        async setJSON(key, value, options) {
            return this.set(key, value, options);
        }

        async getJSON(key, defaultValue) {
            return this.get(key, defaultValue);
        }

        async increment(key, amount = 1) {
            const current = await this.get(key, 0);
            const newValue = Number(current) + amount;
            await this.set(key, newValue);
            return newValue;
        }

        async decrement(key, amount = 1) {
            return this.increment(key, -amount);
        }

        async push(key, value) {
            const array = await this.get(key, []);
            array.push(value);
            await this.set(key, array);
            return array;
        }

        async pop(key) {
            const array = await this.get(key, []);
            const value = array.pop();
            await this.set(key, array);
            return value;
        }

        async addToSet(key, value) {
            const set = new Set(await this.get(key, []));
            set.add(value);
            await this.set(key, Array.from(set));
            return set.size;
        }

        async removeFromSet(key, value) {
            const set = new Set(await this.get(key, []));
            const deleted = set.delete(value);
            await this.set(key, Array.from(set));
            return deleted;
        }
    }

    // Create global storage instance
    const storage = new Storage();

    // Export to global scope
    global.AppStorage = storage;
    global.StorageManager = StorageManager;
    global.StorageError = StorageError;
    global.ValidationError = ValidationError;
    global.EncryptionError = EncryptionError;

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => storage._ensureInitialized());
    } else {
        storage._ensureInitialized();
    }

})(window);