/**
 * app-render-debug.js - React Render Debugging Module
 * 
 * Purpose:
 * This module provides comprehensive debugging capabilities for React rendering operations.
 * It intercepts ReactDOM.render and ReactDOM.createRoot to identify undefined components
 * that cause React Error #130. The module tracks every render attempt with detailed logging
 * to pinpoint the exact location and nature of rendering failures.
 * 
 * Features:
 * - Intercepts all React rendering operations
 * - Provides detailed logging of render attempts
 * - Identifies undefined or null components before they crash
 * - Wraps component functions to track their execution
 * - Maintains compatibility with both React 17 (render) and React 18 (createRoot)
 * 
 * Error Detection:
 * - Null/undefined elements passed to render
 * - Components with undefined type property
 * - Component execution errors
 * - Root render failures
 * 
 * @module app-render-debug
 * @version 1.0.0
 * @requires React
 * @requires ReactDOM
 */

(function(global) {
    'use strict';

    /**
     * Debug configuration
     * Controls the verbosity and features of the debugging module
     */
    const DEBUG_CONFIG = {
        enabled: true,
        logLevel: 'verbose', // verbose, normal, minimal
        trackComponentCalls: true,
        trackRenderCalls: true,
        stackTraceOnError: true,
        performanceTracking: true
    };

    /**
     * Performance tracking storage
     * Stores render timing information for analysis
     */
    const performanceData = {
        renders: [],
        componentCalls: []
    };

    /**
     * Get current timestamp in ISO format
     * @returns {string} ISO formatted timestamp
     */
    const getTimestamp = () => new Date().toISOString();

    /**
     * Enhanced logging function with multiple levels and formatting
     * @param {string} level - Log level (info, warn, error, debug, trace)
     * @param {string} category - Log category for filtering
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    const log = (level, category, message, data = null) => {
        if (!DEBUG_CONFIG.enabled) return;
        
        const timestamp = getTimestamp();
        const levelIcons = {
            'info': '✓',
            'warn': '⚠',
            'error': '✗',
            'debug': '→',
            'trace': '...'
        };
        
        const icon = levelIcons[level] || '•';
        const prefix = `[${timestamp}] [RENDER-DEBUG] [${category}] ${icon}`;
        
        // Select appropriate console method based on level
        const logMethod = level === 'error' ? console.error :
                         level === 'warn' ? console.warn :
                         level === 'trace' ? console.trace :
                         console.log;
        
        if (data !== null && data !== undefined) {
            logMethod(`${prefix} ${message}:`, data);
        } else {
            logMethod(`${prefix} ${message}`);
        }
        
        // Log stack trace for errors if configured
        if (level === 'error' && DEBUG_CONFIG.stackTraceOnError) {
            console.trace('Stack trace for error:');
        }
    };

    /**
     * Analyze element structure for debugging
     * Provides detailed information about React elements
     * 
     * @param {*} element - React element to analyze
     * @returns {Object} Analysis results
     */
    const analyzeElement = (element) => {
        const analysis = {
            isNull: element === null,
            isUndefined: element === undefined,
            type: typeof element,
            hasType: false,
            typeValue: null,
            hasProps: false,
            propsKeys: [],
            isValidElement: false,
            componentName: 'Unknown'
        };
        
        if (element && typeof element === 'object') {
            analysis.hasType = 'type' in element;
            analysis.typeValue = element.type;
            analysis.hasProps = 'props' in element;
            analysis.propsKeys = element.props ? Object.keys(element.props) : [];
            analysis.isValidElement = React.isValidElement(element);
            
            // Extract component name
            if (element.type) {
                if (typeof element.type === 'string') {
                    analysis.componentName = element.type;
                } else if (typeof element.type === 'function') {
                    analysis.componentName = element.type.displayName || 
                                           element.type.name || 
                                           'AnonymousComponent';
                }
            }
        }
        
        return analysis;
    };

    /**
     * Start initialization logging
     */
    log('info', 'INIT', 'Starting React render debugging module...');
    log('debug', 'INIT', 'Debug configuration', DEBUG_CONFIG);

    /**
     * Store original React methods
     * We need to preserve these to call them after our debugging logic
     */
    const originalMethods = {
        render: ReactDOM.render,
        createRoot: ReactDOM.createRoot,
        createElement: React.createElement
    };
    
    log('debug', 'INIT', 'Original React methods stored');

    /**
     * Override ReactDOM.render (React 17 compatibility)
     * Intercepts render calls to add debugging information
     * 
     * @param {React.Element} element - React element to render
     * @param {HTMLElement} container - DOM container
     * @param {Function} callback - Optional callback after render
     */
    ReactDOM.render = function(element, container, callback) {
        const startTime = performance.now();
        const callId = `render_${Date.now()}`;
        
        log('info', 'RENDER', `ReactDOM.render called (ID: ${callId})`);
        
        // Log container information
        log('debug', 'RENDER', 'Container element', {
            id: container?.id,
            className: container?.className,
            tagName: container?.tagName,
            innerHTML: container?.innerHTML?.substring(0, 100) + '...'
        });
        
        // Analyze the element being rendered
        const analysis = analyzeElement(element);
        log('debug', 'RENDER', 'Element analysis', analysis);
        
        // Critical error checks
        if (analysis.isNull || analysis.isUndefined) {
            log('error', 'RENDER', `CRITICAL: Attempting to render ${analysis.isNull ? 'null' : 'undefined'} element!`);
            log('error', 'RENDER', 'This will cause React Error #130');
            
            // Create emergency placeholder
            const placeholder = React.createElement('div', {
                style: { color: 'red', padding: '20px', border: '2px solid red' }
            }, 'ERROR: Attempted to render null/undefined component');
            
            return originalMethods.render.call(this, placeholder, container, callback);
        }
        
        // Check for undefined type
        if (!analysis.hasType || analysis.typeValue === undefined) {
            log('error', 'RENDER', 'CRITICAL: Element has undefined type!');
            log('error', 'RENDER', 'Element structure', element);
            log('error', 'RENDER', 'This will cause React Error #130');
        }
        
        // Log successful pre-render state
        log('info', 'RENDER', `Rendering component: ${analysis.componentName}`);
        log('debug', 'RENDER', 'Props keys', analysis.propsKeys);
        
        try {
            // Call original render
            const result = originalMethods.render.call(this, element, container, callback);
            
            // Log success
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            
            log('info', 'RENDER', `Render completed successfully in ${duration}ms`);
            
            if (DEBUG_CONFIG.performanceTracking) {
                performanceData.renders.push({
                    id: callId,
                    component: analysis.componentName,
                    duration: parseFloat(duration),
                    timestamp: Date.now()
                });
            }
            
            return result;
            
        } catch (error) {
            log('error', 'RENDER', 'Render failed with error', error);
            log('error', 'RENDER', 'Error message', error.message);
            log('error', 'RENDER', 'Error stack', error.stack);
            throw error;
        }
    };

    /**
     * Override ReactDOM.createRoot (React 18)
     * Intercepts root creation and render calls
     * 
     * @param {HTMLElement} container - DOM container
     * @param {Object} options - Root options
     */
    ReactDOM.createRoot = function(container, options) {
        log('info', 'ROOT', 'ReactDOM.createRoot called');
        log('debug', 'ROOT', 'Container', {
            id: container?.id,
            className: container?.className
        });
        log('debug', 'ROOT', 'Options', options);
        
        // Create root using original method
        const root = originalMethods.createRoot.call(this, container, options);
        
        // Store original render method
        const originalRootRender = root.render;
        
        /**
         * Override root.render method
         * @param {React.Element} element - Element to render
         */
        root.render = function(element) {
            const startTime = performance.now();
            const callId = `root_render_${Date.now()}`;
            
            log('info', 'ROOT-RENDER', `Root.render called (ID: ${callId})`);
            
            // Analyze element
            const analysis = analyzeElement(element);
            log('debug', 'ROOT-RENDER', 'Element analysis', analysis);
            
            // Critical error checks
            if (analysis.isNull || analysis.isUndefined) {
                log('error', 'ROOT-RENDER', `CRITICAL: Attempting to render ${analysis.isNull ? 'null' : 'undefined'} element!`);
                
                // Create emergency placeholder
                const placeholder = React.createElement('div', {
                    style: { color: 'red', padding: '20px', border: '2px solid red' }
                }, 'ERROR: Root render attempted with null/undefined component');
                
                return originalRootRender.call(this, placeholder);
            }
            
            try {
                const result = originalRootRender.call(this, element);
                
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);
                
                log('info', 'ROOT-RENDER', `Root render completed in ${duration}ms`);
                
                return result;
                
            } catch (error) {
                log('error', 'ROOT-RENDER', 'Root render failed', error);
                throw error;
            }
        };
        
        return root;
    };

    /**
     * Wrap App component to track its execution
     * This helps identify if the App component itself is causing issues
     */
    if (global.FinanceApp && global.FinanceApp.App) {
        log('info', 'COMPONENT-WRAP', 'Wrapping App component for debugging');
        
        const OriginalApp = global.FinanceApp.App;
        
        /**
         * Wrapped App component with debugging
         */
        global.FinanceApp.App = function WrappedApp(...args) {
            const callId = `app_${Date.now()}`;
            const startTime = performance.now();
            
            log('info', 'APP', `App component called (ID: ${callId})`);
            log('debug', 'APP', 'Arguments', args);
            log('debug', 'APP', 'Props', args[0]);
            
            try {
                // Call original App
                const result = OriginalApp.apply(this, args);
                
                // Analyze returned element
                const analysis = analyzeElement(result);
                log('debug', 'APP', 'App return value analysis', analysis);
                
                if (analysis.isNull || analysis.isUndefined) {
                    log('error', 'APP', 'CRITICAL: App component returned null/undefined!');
                    log('error', 'APP', 'This will cause React Error #130');
                }
                
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);
                
                log('info', 'APP', `App component completed in ${duration}ms`);
                
                if (DEBUG_CONFIG.performanceTracking) {
                    performanceData.componentCalls.push({
                        id: callId,
                        component: 'App',
                        duration: parseFloat(duration),
                        timestamp: Date.now()
                    });
                }
                
                return result;
                
            } catch (error) {
                log('error', 'APP', 'App component threw error', error);
                log('error', 'APP', 'Error details', {
                    message: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
        
        // Preserve display name
        global.FinanceApp.App.displayName = OriginalApp.displayName || 'App';
    } else {
        log('warn', 'COMPONENT-WRAP', 'App component not found for wrapping');
    }

    /**
     * Override React.createElement to catch component creation issues
     * This can help identify when undefined components are used
     */
    React.createElement = function(type, props, ...children) {
        if (DEBUG_CONFIG.logLevel === 'verbose') {
            log('trace', 'CREATE-ELEMENT', `Creating element: ${
                typeof type === 'string' ? type : 
                type?.displayName || type?.name || 'Unknown'
            }`);
        }
        
        if (type === undefined) {
            log('error', 'CREATE-ELEMENT', 'CRITICAL: Undefined component type passed to createElement!');
            log('error', 'CREATE-ELEMENT', 'Props', props);
            log('error', 'CREATE-ELEMENT', 'Children', children);
            
            // Return error placeholder
            return originalMethods.createElement.call(
                this, 
                'div', 
                { style: { color: 'red', border: '1px solid red', padding: '10px' } },
                'ERROR: Undefined component'
            );
        }
        
        return originalMethods.createElement.apply(this, arguments);
    };

    /**
     * Performance reporting function
     * Call this to see rendering performance data
     */
    global.getRenderPerformance = function() {
        log('info', 'PERFORMANCE', 'Rendering performance report:');
        log('info', 'PERFORMANCE', `Total renders: ${performanceData.renders.length}`);
        log('info', 'PERFORMANCE', `Total component calls: ${performanceData.componentCalls.length}`);
        
        if (performanceData.renders.length > 0) {
            const avgRenderTime = performanceData.renders
                .reduce((sum, r) => sum + r.duration, 0) / performanceData.renders.length;
            log('info', 'PERFORMANCE', `Average render time: ${avgRenderTime.toFixed(2)}ms`);
        }
        
        return performanceData;
    };

    /**
     * Module initialization complete
     */
    log('info', 'INIT', 'React render debugging module initialized successfully');
    log('info', 'INIT', 'Call getRenderPerformance() to see performance data');

})(window);