/**
 * app-scripts-wrapper.js - Wraps all React-dependent scripts to wait for React
 * This ensures scripts don't execute until React is fully loaded
 */

(function() {
    'use strict';
    
    console.log('[SCRIPT-WRAPPER] Wrapping React-dependent scripts...');
    
    // List of scripts that depend on React
    const reactDependentScripts = [
        './app-state.js',
        './app-components-auth.js',
        './app-init.js',
        './app-components-main.js',
        './app-components-finance.js',
        './app-main.js',
        './app-features-international.js',
        './app-features-integration.js',
        './app-features-pwa.js',
        './app-features-advanced.js',
        './app-features-security.js',
        './app-features-gamification.js',
        './app-features-integration-manager.js',
        './app-phase3-complete.js',
        './app-debug-components.js'
    ];
    
    // Scripts that should load immediately (no React dependency)
    const immediateScripts = [
        './app-utils-init.js',
        './app-utils-privacy-fix.js',
        './app-component-fix.js',
        './app-render-debug.js',
        './app-config.js',
        './app-storage.js',
        './app-storage-init.js',
        './feature-deps-fix.js'  // Fix feature dependencies
    ];
    
    // Function to load a script
    function loadScript(src, waitForReact = false) {
        if (waitForReact) {
            console.log(`[SCRIPT-WRAPPER] Queueing React-dependent script: ${src}`);
            window.waitForReact(function() {
                console.log(`[SCRIPT-WRAPPER] Loading React-dependent script: ${src}`);
                const script = document.createElement('script');
                script.src = src;
                script.onerror = function() {
                    console.error(`[SCRIPT-WRAPPER] Failed to load: ${src}`);
                };
                document.body.appendChild(script);
            });
        } else {
            console.log(`[SCRIPT-WRAPPER] Loading immediate script: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.onerror = function() {
                console.error(`[SCRIPT-WRAPPER] Failed to load: ${src}`);
            };
            document.body.appendChild(script);
        }
    }
    
    // Load immediate scripts first
    immediateScripts.forEach(function(src) {
        loadScript(src, false);
    });
    
    // Queue React-dependent scripts
    reactDependentScripts.forEach(function(src) {
        loadScript(src, true);
    });
    
    console.log('[SCRIPT-WRAPPER] Script loading configured');
})();