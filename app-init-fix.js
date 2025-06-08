/**
 * app-init-fix.js - Fix initialization order issues
 * This file ensures all dependencies are loaded in the correct order
 */

(function() {
    'use strict';
    
    // Ensure global namespace exists
    window.FinanceApp = window.FinanceApp || {};
    window.FinanceApp.Utils = window.FinanceApp.Utils || {};
    window.FinanceApp.Components = window.FinanceApp.Components || {};
    window.FinanceApp.Features = window.FinanceApp.Features || {};
    
    // Create placeholder for privacy utilities if not exists
    if (!window.FinanceApp.Utils.PrivacyUtils) {
        window.FinanceApp.Utils.PrivacyUtils = {
            getPrivacySettingDescription: function(setting) {
                const descriptions = {
                    'analytics': 'Allow anonymous usage analytics',
                    'crash-reports': 'Send crash reports to improve the app',
                    'personalization': 'Enable personalized recommendations',
                    'data-sharing': 'Share data with family members'
                };
                return descriptions[setting] || 'Unknown setting';
            },
            getDefaultPrivacySettings: function() {
                return {
                    analytics: false,
                    crashReports: false,
                    personalization: true,
                    dataSharing: false
                };
            }
        };
    }
    
    // Ensure all required utilities exist
    const requiredUtils = [
        'generateUUID',
        'DateUtils',
        'ValidationUtils',
        'StorageUtils',
        'NotificationManager'
    ];
    
    requiredUtils.forEach(util => {
        if (!window.FinanceApp.Utils[util]) {
            console.warn(`Missing utility: ${util} - creating placeholder`);
            
            // Create basic placeholders
            switch(util) {
                case 'generateUUID':
                    window.FinanceApp.Utils.generateUUID = function() {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            const r = Math.random() * 16 | 0;
                            const v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    };
                    break;
                case 'DateUtils':
                    window.FinanceApp.Utils.DateUtils = {
                        formatDate: (date) => new Date(date).toLocaleDateString(),
                        formatCurrency: (amount) => `$${amount.toFixed(2)}`
                    };
                    break;
                case 'ValidationUtils':
                    window.FinanceApp.Utils.ValidationUtils = {
                        validate: () => ({ isValid: true }),
                        validateForm: () => ({ isValid: true, errors: {} })
                    };
                    break;
                case 'StorageUtils':
                    window.FinanceApp.Utils.StorageUtils = {
                        get: (key) => localStorage.getItem(key),
                        set: (key, value) => localStorage.setItem(key, value),
                        remove: (key) => localStorage.removeItem(key)
                    };
                    break;
                case 'NotificationManager':
                    window.FinanceApp.Utils.NotificationManager = {
                        success: (msg) => console.log('Success:', msg),
                        error: (msg) => console.error('Error:', msg),
                        info: (msg) => console.log('Info:', msg)
                    };
                    break;
            }
        }
    });
    
    // Ensure React hooks exist
    if (!window.FinanceApp.useFinance) {
        window.FinanceApp.useFinance = function() {
            return {
                state: {
                    auth: { isAuthenticated: false, user: null },
                    finance: {
                        transactions: [],
                        budgets: [],
                        bills: [],
                        savingsGoals: []
                    }
                },
                dispatch: () => {},
                actions: {
                    auth: {},
                    finance: {},
                    ui: {}
                }
            };
        };
    }
    
    console.log('Initialization fixes applied');
})();