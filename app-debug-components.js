/**
 * app-debug-components.js - Component Availability Debugging Module
 * 
 * Purpose:
 * This module provides comprehensive debugging capabilities to identify missing or undefined
 * React components that may cause rendering failures in the Finance Dashboard application.
 * It helps diagnose React Error #130 which indicates an undefined component was passed to React.
 * 
 * Features:
 * - Verifies core React library availability
 * - Checks all registered Finance App components
 * - Identifies undefined components that could cause rendering failures
 * - Provides detailed console output for troubleshooting
 * 
 * Usage:
 * Include this script at the end of your HTML body to debug component loading issues.
 * Check browser console for detailed component availability report.
 * 
 * @module app-debug-components
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    /**
     * Debug timestamp function
     * Returns formatted timestamp for debug messages
     */
    const getTimestamp = () => new Date().toISOString();
    
    /**
     * Debug logging function with consistent formatting
     * @param {string} category - Debug category
     * @param {string} message - Debug message
     * @param {*} data - Optional data to log
     */
    const debugLog = (category, message, data = null) => {
        const timestamp = getTimestamp();
        const prefix = `[${timestamp}] [DEBUG-COMPONENTS] [${category}]`;
        if (data !== null) {
            console.log(`${prefix} ${message}:`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    };

    /**
     * Component Debug Header
     * Provides clear visual separation in console output for debugging session
     */
    console.log('\n' + '='.repeat(80));
    console.log('=== COMPONENT DEBUG SESSION STARTED ===');
    console.log(`=== Timestamp: ${getTimestamp()} ===`);
    console.log('='.repeat(80) + '\n');

    /**
     * Step 1: Core Library Verification
     * Checks if React and ReactDOM are properly loaded and available
     * These are essential dependencies that must be present before any component can render
     */
    debugLog('CORE-LIBS', 'Starting core library verification...');
    
    // Check React
    debugLog('CORE-LIBS', 'Checking React availability');
    const reactAvailable = typeof React !== 'undefined';
    debugLog('CORE-LIBS', `React type: ${typeof React}`, React);
    debugLog('CORE-LIBS', `React available: ${reactAvailable}`);
    if (reactAvailable) {
        debugLog('CORE-LIBS', 'React version', React.version);
    } else {
        console.error(`[${getTimestamp()}] [CRITICAL] React is not loaded!`);
    }
    
    // Check ReactDOM
    debugLog('CORE-LIBS', 'Checking ReactDOM availability');
    const reactDOMAvailable = typeof ReactDOM !== 'undefined';
    debugLog('CORE-LIBS', `ReactDOM type: ${typeof ReactDOM}`, ReactDOM);
    debugLog('CORE-LIBS', `ReactDOM available: ${reactDOMAvailable}`);
    if (!reactDOMAvailable) {
        console.error(`[${getTimestamp()}] [CRITICAL] ReactDOM is not loaded!`);
    }

    /**
     * Step 2: FinanceApp Namespace Verification
     * Checks if the main application namespace exists
     * All components should be registered under this namespace
     */
    debugLog('NAMESPACE', 'Checking FinanceApp namespace...');
    const financeAppExists = typeof window.FinanceApp !== 'undefined' && window.FinanceApp !== null;
    debugLog('NAMESPACE', `window.FinanceApp exists: ${financeAppExists}`);
    debugLog('NAMESPACE', 'window.FinanceApp value', window.FinanceApp);
    
    if (!financeAppExists) {
        console.error(`[${getTimestamp()}] [CRITICAL] FinanceApp namespace is not defined!`);
        console.error(`[${getTimestamp()}] [CRITICAL] Cannot proceed with component verification`);
        return; // Exit early if namespace doesn't exist
    }

    /**
     * Step 3: Component Availability Check
     * Systematically verifies each component category and lists their availability
     * This helps identify which specific components might be missing
     */
    debugLog('COMPONENTS', 'Starting component verification...');
    
    // Define expected components by category
    const componentCategories = {
        'AUTH': ['AuthLogin', 'AuthRegister', 'AuthForgotPassword'],
        'MAIN': ['Dashboard', 'Header', 'Sidebar', 'Footer'],
        'FINANCE': ['TransactionForm', 'AccountOverview', 'BudgetChart', 'SpendingAnalysis'],
        'ROUTING': ['Router'],
        'ROOT': ['App']
    };

    // Track component status
    const componentStatus = {
        found: [],
        missing: [],
        undefined: []
    };

    /**
     * Check each component category
     */
    Object.entries(componentCategories).forEach(([category, componentNames]) => {
        debugLog('COMPONENTS', `Checking ${category} components...`);
        
        componentNames.forEach(componentName => {
            debugLog('COMPONENTS', `  Checking ${componentName}...`);
            
            // Check if component exists in namespace
            const componentExists = componentName in window.FinanceApp;
            debugLog('COMPONENTS', `    - Exists in namespace: ${componentExists}`);
            
            if (componentExists) {
                const component = window.FinanceApp[componentName];
                const componentType = typeof component;
                const isFunction = componentType === 'function';
                const isUndefined = component === undefined;
                const isNull = component === null;
                
                debugLog('COMPONENTS', `    - Type: ${componentType}`);
                debugLog('COMPONENTS', `    - Is function: ${isFunction}`);
                debugLog('COMPONENTS', `    - Is undefined: ${isUndefined}`);
                debugLog('COMPONENTS', `    - Is null: ${isNull}`);
                
                if (isUndefined || isNull) {
                    componentStatus.undefined.push(componentName);
                    console.error(`[${getTimestamp()}] [ERROR] Component ${componentName} is ${isUndefined ? 'undefined' : 'null'}!`);
                } else if (isFunction) {
                    componentStatus.found.push(componentName);
                    debugLog('COMPONENTS', `    - ✓ Component ${componentName} is properly defined`);
                    
                    // Additional validation for React components
                    try {
                        debugLog('COMPONENTS', `    - Component name: ${component.name || 'Anonymous'}`);
                        debugLog('COMPONENTS', `    - Component length: ${component.length}`);
                    } catch (e) {
                        debugLog('COMPONENTS', `    - Error accessing component properties: ${e.message}`);
                    }
                } else {
                    console.warn(`[${getTimestamp()}] [WARNING] Component ${componentName} is not a function (type: ${componentType})`);
                }
            } else {
                componentStatus.missing.push(componentName);
                console.error(`[${getTimestamp()}] [ERROR] Component ${componentName} is not registered in FinanceApp namespace!`);
            }
        });
    });

    /**
     * Step 4: Deferred Component Validation
     * Uses setTimeout to ensure all scripts have completed loading
     * This catches components that might be registered asynchronously
     * 
     * @param {number} delay - Milliseconds to wait before checking (100ms default)
     */
    debugLog('ASYNC', 'Scheduling deferred validation in 100ms...');
    
    setTimeout(() => {
        debugLog('ASYNC', 'Starting deferred component validation...');
        
        /**
         * Get all registered components
         * Falls back to empty object if FinanceApp namespace doesn't exist
         */
        const components = window.FinanceApp || {};
        const allComponentNames = Object.keys(components);
        
        debugLog('ASYNC', `Total components in namespace: ${allComponentNames.length}`);
        debugLog('ASYNC', 'All component names', allComponentNames);
        
        /**
         * Iterate through all component entries
         * Object.entries converts the components object into [key, value] pairs
         * This allows us to check each component name and its corresponding value
         */
        let undefinedCount = 0;
        let functionCount = 0;
        let otherCount = 0;
        
        Object.entries(components).forEach(([name, component]) => {
            const componentType = typeof component;
            
            if (component === undefined || component === null) {
                undefinedCount++;
                console.error(`[${getTimestamp()}] [ASYNC-ERROR] Component ${name} is ${component === undefined ? 'undefined' : 'null'}!`);
            } else if (componentType === 'function') {
                functionCount++;
                debugLog('ASYNC', `✓ ${name} is a valid function component`);
            } else {
                otherCount++;
                console.warn(`[${getTimestamp()}] [ASYNC-WARNING] ${name} is type: ${componentType}`);
            }
        });
        
        /**
         * Final Report
         */
        console.log('\n' + '='.repeat(80));
        console.log('=== COMPONENT DEBUG SUMMARY ===');
        console.log(`=== Timestamp: ${getTimestamp()} ===`);
        console.log('='.repeat(80));
        
        console.log(`Total Components: ${allComponentNames.length}`);
        console.log(`Valid Functions: ${functionCount}`);
        console.log(`Undefined/Null: ${undefinedCount}`);
        console.log(`Other Types: ${otherCount}`);
        
        console.log('\nComponent Status:');
        console.log(`  Found: ${componentStatus.found.length} components`);
        if (componentStatus.found.length > 0) {
            console.log(`    - ${componentStatus.found.join(', ')}`);
        }
        
        console.log(`  Missing: ${componentStatus.missing.length} components`);
        if (componentStatus.missing.length > 0) {
            console.log(`    - ${componentStatus.missing.join(', ')}`);
        }
        
        console.log(`  Undefined: ${componentStatus.undefined.length} components`);
        if (componentStatus.undefined.length > 0) {
            console.log(`    - ${componentStatus.undefined.join(', ')}`);
        }
        
        // Likely cause of React Error #130
        if (undefinedCount > 0 || componentStatus.undefined.length > 0) {
            console.error('\n[CRITICAL] Found undefined components - this is likely causing React Error #130');
            console.error('[SOLUTION] Check the files that should define these components');
        }
        
        console.log('='.repeat(80) + '\n');
        
    }, 100); // 100ms delay ensures most async operations complete

})(window);