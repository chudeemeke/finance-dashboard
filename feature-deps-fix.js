/**
 * feature-deps-fix.js - Fixes feature module dependencies
 * Ensures feature modules don't crash when dependencies aren't ready
 */

(function() {
    'use strict';
    
    console.log('[FEATURE-DEPS-FIX] Patching feature dependencies...');
    
    // Ensure all feature namespaces exist
    window.FinanceApp = window.FinanceApp || {};
    window.FinanceApp.Features = window.FinanceApp.Features || {};
    
    // Create stub for International Features
    if (!window.FinanceApp.InternationalFeatures) {
        window.FinanceApp.InternationalFeatures = {
            i18n: {
                t: function(key) { return key; },
                changeLanguage: function() { return Promise.resolve(); },
                language: 'en'
            }
        };
        console.log('[FEATURE-DEPS-FIX] Created InternationalFeatures stub');
    }
    
    // Create stub for Advanced Features
    if (!window.FinanceApp.AdvancedFeatures) {
        window.FinanceApp.AdvancedFeatures = {
            AIAnalyticsEngine: {
                analyzeTransactions: function() { return Promise.resolve({}); },
                predictSpending: function() { return Promise.resolve({}); },
                generateInsights: function() { return Promise.resolve([]); }
            }
        };
        console.log('[FEATURE-DEPS-FIX] Created AdvancedFeatures stub');
    }
    
    // Create stub for Security Features
    if (!window.FinanceApp.SecurityFeatures) {
        window.FinanceApp.SecurityFeatures = {
            PrivacySettings: window.FinanceApp.Utils?.PrivacyUtils || {
                getPrivacySettingDescription: function(setting) { return setting; },
                getDefaultPrivacySettings: function() { return {}; }
            }
        };
        console.log('[FEATURE-DEPS-FIX] Created SecurityFeatures stub');
    }
    
    // Fix Utils.PrivacyUtils reference
    if (window.FinanceApp.Utils && !window.FinanceApp.Utils.PrivacyUtils) {
        window.FinanceApp.Utils.PrivacyUtils = window.FinanceApp.SecurityFeatures?.PrivacySettings || {
            getPrivacySettingDescription: function(setting) { return setting; },
            getDefaultPrivacySettings: function() { return {}; }
        };
    }
    
    console.log('[FEATURE-DEPS-FIX] Feature dependencies patched');
})();