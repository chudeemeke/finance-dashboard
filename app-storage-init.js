/**
 * app-storage-init.js - Storage System Initialization Handler
 * Ensures storage is ready before dependent systems initialize
 */

(function(global) {
    'use strict';

    // Ensure storage is ready before initializing state
    global.addEventListener('storage:initialized', () => {
        console.log('Storage system ready');
        global.STORAGE_READY = true;
        
        // Dispatch custom event for other modules
        global.dispatchEvent(new CustomEvent('app:storage-ready', {
            detail: { timestamp: Date.now() }
        }));
    });

    // Timeout handler for fallback
    setTimeout(() => {
        if (!global.STORAGE_READY) {
            console.warn('Storage initialization timeout - using fallback');
            global.STORAGE_READY = true;
            
            // Dispatch timeout event
            global.dispatchEvent(new CustomEvent('app:storage-timeout', {
                detail: { timestamp: Date.now() }
            }));
        }
    }, 5000);

})(window);