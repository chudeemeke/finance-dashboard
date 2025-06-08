/**
 * app-utils-init.js - Initialize global Utils object
 * Must load before any other files that depend on Utils
 */

(function(global) {
    'use strict';

    // Initialize global Utils object
    global.Utils = global.Utils || {};

    // Initialize StorageUtils
    global.Utils.StorageUtils = {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
        clear: () => localStorage.clear()
    };

    // Initialize DateUtils
    global.Utils.DateUtils = {
        formatDate: (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString();
        },
        formatDateTime: (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString();
        },
        formatCurrency: (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount || 0);
        },
        formatRelativeTime: (date) => {
            if (!date) return '';
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
            const diff = Date.now() - new Date(date).getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) return rtf.format(-days, 'day');
            if (hours > 0) return rtf.format(-hours, 'hour');
            if (minutes > 0) return rtf.format(-minutes, 'minute');
            return rtf.format(-seconds, 'second');
        }
    };

    // Initialize NotificationManager
    global.Utils.NotificationManager = {
        notifications: [],
        listeners: new Set(),
        
        show: function(message, type = 'info', duration = 5000) {
            const notification = {
                id: Date.now(),
                message,
                type,
                timestamp: new Date()
            };
            
            this.notifications.push(notification);
            this.notifyListeners(notification);
            
            if (duration > 0) {
                setTimeout(() => this.dismiss(notification.id), duration);
            }
            
            return notification.id;
        },
        
        dismiss: function(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index > -1) {
                this.notifications.splice(index, 1);
                this.notifyListeners();
            }
        },
        
        addListener: function(callback) {
            this.listeners.add(callback);
        },
        
        removeListener: function(callback) {
            this.listeners.delete(callback);
        },
        
        notifyListeners: function(notification) {
            this.listeners.forEach(callback => {
                try {
                    callback(this.notifications, notification);
                } catch (error) {
                    console.error('Notification listener error:', error);
                }
            });
        }
    };

    // Initialize CurrencyFormatter
    global.Utils.CurrencyFormatter = {
        format: (amount, currency = 'USD') => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount || 0);
        }
    };

    // Initialize other utilities that might be needed
    global.Utils.ValidationUtils = {
        isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isPhone: (phone) => /^\+?[\d\s-()]+$/.test(phone),
        isRequired: (value) => value !== null && value !== undefined && value !== ''
    };

    console.log('Utils initialized:', Object.keys(global.Utils));

    // Also expose as global variables for compatibility
    global.StorageUtils = global.Utils.StorageUtils;
    global.DateUtils = global.Utils.DateUtils;
    global.NotificationManager = global.Utils.NotificationManager;
    global.CurrencyFormatter = global.Utils.CurrencyFormatter;
    global.ValidationUtils = global.Utils.ValidationUtils;

})(window);