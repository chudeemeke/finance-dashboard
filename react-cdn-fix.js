/**
 * react-cdn-fix.js - Ensures React loads properly from CDN with fallback
 * This file MUST be loaded before any other scripts that depend on React
 */

(function() {
    'use strict';
    
    console.log('Checking React availability...');
    
    // Function to load script dynamically
    function loadScript(src, onLoad, onError) {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = onLoad;
        script.onerror = onError;
        document.head.appendChild(script);
    }
    
    // Function to check if React is loaded
    function checkReact() {
        return typeof React !== 'undefined' && typeof ReactDOM !== 'undefined';
    }
    
    // If React is already loaded, we're good
    if (checkReact()) {
        console.log('React is already loaded successfully');
        return;
    }
    
    console.log('React not found, attempting to load from CDN...');
    
    // Try to load React from CDN with fallback
    const reactCDNs = [
        {
            react: 'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
            reactDOM: 'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js'
        },
        {
            react: 'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
            reactDOM: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
        },
        {
            react: 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
            reactDOM: 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
        }
    ];
    
    let cdnIndex = 0;
    
    function tryLoadReact() {
        if (cdnIndex >= reactCDNs.length) {
            console.error('Failed to load React from all CDN sources');
            // Create minimal React mock to prevent errors
            window.React = {
                createElement: function(type, props, ...children) {
                    console.warn('Using mock React.createElement');
                    return { type, props, children };
                },
                Component: function() {},
                useState: function(initial) { return [initial, function() {}]; },
                useEffect: function() {},
                useCallback: function(fn) { return fn; },
                useMemo: function(fn) { return fn(); },
                useRef: function(initial) { return { current: initial }; },
                useContext: function() { return {}; },
                createContext: function() { return { Provider: function() {}, Consumer: function() {} }; },
                Fragment: 'Fragment'
            };
            
            window.ReactDOM = {
                render: function() { console.warn('Mock ReactDOM.render called'); },
                createRoot: function(container) {
                    return {
                        render: function() { 
                            console.warn('Mock ReactDOM.createRoot.render called');
                            container.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">React failed to load from CDN. Please check your internet connection and refresh the page.</div>';
                        }
                    };
                }
            };
            return;
        }
        
        const cdn = reactCDNs[cdnIndex];
        console.log(`Trying CDN ${cdnIndex + 1}: ${cdn.react}`);
        
        // Load React first
        loadScript(
            cdn.react,
            function() {
                console.log('React core loaded, loading ReactDOM...');
                // Then load ReactDOM
                loadScript(
                    cdn.reactDOM,
                    function() {
                        if (checkReact()) {
                            console.log('React and ReactDOM loaded successfully!');
                            // Dispatch event to notify other scripts
                            window.dispatchEvent(new Event('reactLoaded'));
                        } else {
                            console.error('React loaded but not available');
                            cdnIndex++;
                            tryLoadReact();
                        }
                    },
                    function() {
                        console.error('Failed to load ReactDOM from CDN');
                        cdnIndex++;
                        tryLoadReact();
                    }
                );
            },
            function() {
                console.error('Failed to load React from CDN');
                cdnIndex++;
                tryLoadReact();
            }
        );
    }
    
    // Start loading React
    tryLoadReact();
    
    // Also create a promise that other scripts can wait for
    window.ReactLoadPromise = new Promise(function(resolve) {
        const checkInterval = setInterval(function() {
            if (checkReact()) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(function() {
            clearInterval(checkInterval);
            resolve(); // Resolve anyway to prevent hanging
        }, 10000);
    });
    
})();