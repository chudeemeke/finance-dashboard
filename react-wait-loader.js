/**
 * react-wait-loader.js - Ensures all scripts wait for React to be ready
 * This wraps script execution to wait for React availability
 */

(function() {
    'use strict';
    
    console.log('[REACT-WAIT] Initializing React wait system...');
    
    // Store original script loading
    const originalAppendChild = HTMLHeadElement.prototype.appendChild;
    const originalBodyAppendChild = HTMLBodyElement.prototype.appendChild;
    
    // Track React readiness
    window.__reactReady = false;
    window.__reactWaiters = [];
    
    // Function to check if React is ready
    function checkReactReady() {
        return typeof React !== 'undefined' && 
               typeof ReactDOM !== 'undefined' && 
               React.createElement && 
               ReactDOM.render;
    }
    
    // Function to execute waiting scripts
    function executeWaitingScripts() {
        console.log('[REACT-WAIT] React is ready! Executing waiting scripts...');
        window.__reactReady = true;
        
        // Execute all waiting callbacks
        while (window.__reactWaiters.length > 0) {
            const waiter = window.__reactWaiters.shift();
            try {
                waiter();
            } catch (error) {
                console.error('[REACT-WAIT] Error executing waiting script:', error);
            }
        }
    }
    
    // Wait for React to be available
    window.waitForReact = function(callback) {
        if (checkReactReady()) {
            // React is already ready
            callback();
        } else {
            // Add to waiting list
            window.__reactWaiters.push(callback);
        }
    };
    
    // Monitor for React availability
    const reactCheckInterval = setInterval(function() {
        if (checkReactReady() && !window.__reactReady) {
            clearInterval(reactCheckInterval);
            executeWaitingScripts();
        }
    }, 50);
    
    // Also listen for the custom event from react-cdn-fix.js
    window.addEventListener('reactLoaded', function() {
        if (!window.__reactReady) {
            executeWaitingScripts();
        }
    });
    
    // Timeout after 15 seconds
    setTimeout(function() {
        if (!window.__reactReady) {
            clearInterval(reactCheckInterval);
            console.error('[REACT-WAIT] Timeout waiting for React. Executing scripts anyway...');
            executeWaitingScripts();
        }
    }, 15000);
    
    // Create a wrapper function for React-dependent code
    window.withReact = function(code) {
        return `
            window.waitForReact(function() {
                try {
                    ${code}
                } catch (error) {
                    console.error('[REACT-WAIT] Error in React-dependent code:', error);
                }
            });
        `;
    };
    
    console.log('[REACT-WAIT] React wait system ready');
})();