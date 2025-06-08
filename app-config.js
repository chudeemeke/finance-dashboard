/**
 * Family Finance Dashboard v3.1.0
 * Configuration, Constants, and Utility Functions
 * 
 * Design Patterns Implemented:
 * - Module Pattern: Encapsulates all configuration and utilities
 * - Factory Pattern: Object creation methods (UUID, notifications)
 * - Strategy Pattern: Validation strategies for different data types
 * - Singleton Pattern: Single global FinanceApp instance
 * - Facade Pattern: Simplified interfaces for complex operations
 * 
 * SOLID Principles:
 * - Single Responsibility: Each utility has one clear purpose
 * - Open/Closed: Extensible through configuration without modification
 * - Interface Segregation: Utilities grouped by domain
 * - Dependency Inversion: Utilities depend on abstractions (CONFIG)
 */

(function() {
    'use strict';
    
    /**
     * Initialize global namespace using Singleton pattern
     * Ensures only one instance of FinanceApp exists
     */
    window.FinanceApp = window.FinanceApp || {};
    
    /**
     * Application Configuration Object
     * Centralizes all configuration in one place for easy maintenance
     * Follow Open/Closed Principle - extend by modifying config, not code
     */
    const CONFIG = {
        // Application Metadata
        APP_NAME: 'Family Finance Dashboard',
        APP_VERSION: '3.1.0',
        BUILD_DATE: '2024-01-01',
        ENVIRONMENT: 'production',
        
        // Library Versions (locked for stability)
        LIBRARY_VERSIONS: {
            React: '18.2.0',
            ReactDOM: '18.2.0',
            Recharts: '2.5.0',
            Lucide: '0.263.1',
            Tailwind: '3.x (via CDN)'
        },
        
        // Database Configuration
        DB_NAME: 'FamilyFinanceDB',
        DB_VERSION: 1,
        DB_STORES: {
            USERS: 'users',
            TRANSACTIONS: 'transactions',
            BUDGETS: 'budgets',
            BILLS: 'bills',
            SAVINGS: 'savings',
            SETTINGS: 'settings',
            AUDIT: 'audit'
        },
        
        // Security Configuration
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
        INACTIVITY_WARNING: 5 * 60 * 1000, // Warning 5 minutes before timeout
        MAX_LOGIN_ATTEMPTS: 5,
        LOGIN_LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes lockout
        
        // Password Policy (Configurable security rules)
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_MAX_LENGTH: 128,
        PASSWORD_REQUIRE_UPPERCASE: true,
        PASSWORD_REQUIRE_LOWERCASE: true,
        PASSWORD_REQUIRE_NUMBER: true,
        PASSWORD_REQUIRE_SPECIAL: true,
        PASSWORD_SPECIAL_CHARS: '!@#$%^&*(),.?":{}|<>',
        
        // Data Constraints
        MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB max export
        MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB max attachment
        MAX_TRANSACTIONS_DISPLAY: 1000, // Performance limit
        MAX_AUDIT_ENTRIES: 10000, // Audit trail limit
        
        // UI Configuration
        ITEMS_PER_PAGE: 20,
        PAGINATION_SIZES: [10, 20, 50, 100],
        DATE_FORMAT: 'MM/DD/YYYY',
        TIME_FORMAT: '12h', // 12h or 24h
        NUMBER_FORMAT: 'thousand-comma', // thousand-comma or thousand-space
        ANIMATION_DURATION: 300, // milliseconds
        DEBOUNCE_DELAY: 300, // milliseconds
        
        // Chart Configuration
        CHART_COLORS: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
        ],
        CHART_ANIMATION_DURATION: 1000,
        CHART_MAX_DATA_POINTS: 365, // One year of daily data
        
        // Financial Categories (Extensible lists)
        DEFAULT_EXPENSE_CATEGORIES: [
            'Housing', 'Transportation', 'Food & Dining', 'Shopping',
            'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education',
            'Personal Care', 'Gifts & Donations', 'Taxes', 'Insurance', 'Other'
        ],
        
        DEFAULT_INCOME_CATEGORIES: [
            'Salary', 'Business', 'Investments', 'Rental', 'Freelance',
            'Bonus', 'Tax Refund', 'Gifts', 'Side Hustle', 'Other'
        ],
        
        DEFAULT_BILL_TYPES: [
            'Rent/Mortgage', 'Utilities', 'Insurance', 'Subscription',
            'Loan Payment', 'Credit Card', 'Other'
        ],
        
        // Currency Configuration
        DEFAULT_CURRENCY: 'USD',
        SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
        CURRENCY_SYMBOLS: {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$',
            CHF: 'Fr'
        },
        
        // Feature Flags (Easy enable/disable of features)
        FEATURES: {
            MULTI_CURRENCY: false,
            ATTACHMENTS: true,
            RECURRING_TRANSACTIONS: true,
            BUDGET_ALERTS: true,
            EXPORT_PDF: false,
            TWO_FACTOR_AUTH: false,
            DARK_MODE: false
        }
    };
    
    /**
     * UUID v4 Generator using Factory Pattern
     * Generates RFC4122 compliant UUIDs
     * Uses cryptographically secure random values when available
     */
    const UUIDFactory = {
        /**
         * Generate a new UUID v4
         * @returns {string} UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
         */
        create: function() {
            // Use crypto API if available (more secure)
            if (crypto && crypto.getRandomValues) {
                const buffer = new Uint16Array(8);
                crypto.getRandomValues(buffer);
                
                // Set version (4) and variant bits according to RFC4122
                buffer[3] = (buffer[3] & 0x0fff) | 0x4000; // Version 4
                buffer[4] = (buffer[4] & 0x3fff) | 0x8000; // Variant bits
                
                // Convert to hex string with proper formatting
                const hex = [];
                for (let i = 0; i < 8; i++) {
                    hex.push(buffer[i].toString(16).padStart(4, '0'));
                }
                
                return [
                    hex[0] + hex[1],      // 8 chars
                    hex[2],               // 4 chars
                    hex[3],               // 4 chars
                    hex[4],               // 4 chars
                    hex[5] + hex[6] + hex[7] // 12 chars
                ].join('-');
            } else {
                // Fallback for older browsers (less secure but functional)
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        },
        
        /**
         * Validate UUID format
         * @param {string} uuid - UUID to validate
         * @returns {boolean} True if valid UUID v4 format
         */
        isValid: function(uuid) {
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return regex.test(uuid);
        }
    };
    
    /**
     * Security Utilities using Strategy Pattern
     * Different strategies for hashing, validation, and sanitization
     */
    const SecurityUtils = {
        /**
         * Hash password using SHA-256
         * @param {string} password - Plain text password
         * @returns {Promise<string>} Hashed password as hex string
         */
        hashPassword: async function(password) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            } catch (error) {
                console.error('Password hashing failed:', error);
                // Fallback for environments without crypto.subtle
                console.warn('Using fallback password hashing - not recommended for production');
                return btoa(password); // Base64 encode as fallback
            }
        },
        
        /**
         * Validate password against configured policy
         * @param {string} password - Password to validate
         * @returns {Object} Validation result with isValid flag and error array
         */
        validatePassword: function(password) {
            const errors = [];
            
            // Length validation
            if (password.length < CONFIG.PASSWORD_MIN_LENGTH) {
                errors.push(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
            }
            if (password.length > CONFIG.PASSWORD_MAX_LENGTH) {
                errors.push(`Password must not exceed ${CONFIG.PASSWORD_MAX_LENGTH} characters`);
            }
            
            // Character type validation
            if (CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            
            if (CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            
            if (CONFIG.PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
                errors.push('Password must contain at least one number');
            }
            
            if (CONFIG.PASSWORD_REQUIRE_SPECIAL) {
                const specialRegex = new RegExp(`[${CONFIG.PASSWORD_SPECIAL_CHARS.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')}]`);
                if (!specialRegex.test(password)) {
                    errors.push('Password must contain at least one special character');
                }
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors,
                strength: this.calculatePasswordStrength(password)
            };
        },
        
        /**
         * Calculate password strength score
         * @param {string} password - Password to analyze
         * @returns {Object} Strength score and label
         */
        calculatePasswordStrength: function(password) {
            let score = 0;
            
            // Length bonus
            if (password.length >= 12) score += 2;
            else if (password.length >= 8) score += 1;
            
            // Character diversity
            if (/[a-z]/.test(password)) score += 1;
            if (/[A-Z]/.test(password)) score += 1;
            if (/\d/.test(password)) score += 1;
            if (/[^a-zA-Z0-9]/.test(password)) score += 1;
            
            // Pattern penalty
            if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
            if (/^[0-9]+$/.test(password)) score -= 1; // Only numbers
            
            const strength = {
                0: 'Very Weak',
                1: 'Very Weak',
                2: 'Weak',
                3: 'Fair',
                4: 'Good',
                5: 'Strong',
                6: 'Very Strong'
            };
            
            return {
                score: Math.max(0, Math.min(6, score)),
                label: strength[Math.max(0, Math.min(6, score))]
            };
        },
        
        /**
         * Sanitize user input to prevent XSS
         * @param {string} input - User input to sanitize
         * @returns {string} Sanitized input
         */
        sanitizeInput: function(input) {
            if (typeof input !== 'string') return input;
            
            // Remove script tags and event handlers
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
                .replace(/on\w+\s*=\s*'[^']*'/gi, '')
                .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
                .trim();
        },
        
        /**
         * Generate secure random token
         * @param {number} length - Token length in bytes
         * @returns {string} Random token as hex string
         */
        generateToken: function(length = 32) {
            const buffer = new Uint8Array(length);
            crypto.getRandomValues(buffer);
            return Array.from(buffer)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
    };
    
    /**
     * Date Utilities using Facade Pattern
     * Simplifies complex date operations
     */
    const DateUtils = {
        /**
         * Format date according to configured format
         * @param {Date|string} date - Date to format
         * @param {string} format - Optional format override
         * @returns {string} Formatted date string
         */
        formatDate: function(date, format = CONFIG.DATE_FORMAT) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            // Simple format implementation
            const formats = {
                'MM/DD/YYYY': {
                    month: '2-digit',
                    day: '2-digit', 
                    year: 'numeric'
                },
                'DD/MM/YYYY': {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                },
                'YYYY-MM-DD': {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
            };
            
            const options = formats[format] || formats['MM/DD/YYYY'];
            return d.toLocaleDateString('en-US', options);
        },
        
        /**
         * Format date with time
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted date-time string
         */
        formatDateTime: function(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: CONFIG.TIME_FORMAT === '12h' ? 'numeric' : '2-digit',
                minute: '2-digit',
                hour12: CONFIG.TIME_FORMAT === '12h'
            });
        },
        
        /**
         * Format relative time (e.g., "2 hours ago")
         * @param {Date|string} date - Date to format
         * @returns {string} Relative time string
         */
        formatRelativeTime: function(date) {
            const d = new Date(date);
            const now = new Date();
            const diffMs = now - d;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            
            if (diffDay > 30) return this.formatDate(d);
            if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
            if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
            if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
            return 'Just now';
        },
        
        /**
         * Format currency with proper symbol and separators
         * @param {number} amount - Amount to format
         * @param {string} currency - Currency code
         * @returns {string} Formatted currency string
         */
        formatCurrency: function(amount, currency = CONFIG.DEFAULT_CURRENCY) {
            const symbol = CONFIG.CURRENCY_SYMBOLS[currency] || '$';
            const absAmount = Math.abs(amount);
            
            let formatted;
            if (CONFIG.NUMBER_FORMAT === 'thousand-comma') {
                formatted = absAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                formatted = absAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            }
            
            return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
        },
        
        /**
         * Get month name from index
         * @param {number} monthIndex - Month index (0-11)
         * @returns {string} Month name
         */
        getMonthName: function(monthIndex) {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months[monthIndex] || '';
        },
        
        /**
         * Get date range for common periods
         * @param {string} rangeType - Range type (today, week, month, year, custom)
         * @returns {Object} Start and end dates
         */
        getDateRange: function(rangeType) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const ranges = {
                today: () => ({
                    start: today,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
                }),
                
                week: () => {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    return { start: weekStart, end: weekEnd };
                },
                
                month: () => ({
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                }),
                
                year: () => ({
                    start: new Date(now.getFullYear(), 0, 1),
                    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                }),
                
                lastMonth: () => ({
                    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
                }),
                
                last30Days: () => ({
                    start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }),
                
                last90Days: () => ({
                    start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
                    end: new Date()
                })
            };
            
            return ranges[rangeType] ? ranges[rangeType]() : { start: null, end: null };
        },
        
        /**
         * Check if date is in range
         * @param {Date} date - Date to check
         * @param {Date} start - Range start
         * @param {Date} end - Range end
         * @returns {boolean} True if date is in range
         */
        isDateInRange: function(date, start, end) {
            const d = new Date(date);
            return d >= start && d <= end;
        },
        
        /**
         * Add days to date
         * @param {Date} date - Base date
         * @param {number} days - Days to add (negative to subtract)
         * @returns {Date} New date
         */
        addDays: function(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }
    };
    
    /**
     * Validation Utilities using Strategy Pattern
     * Different validation strategies for different data types
     */
    const ValidationUtils = {
        /**
         * Validation strategies for different data types
         */
        strategies: {
            /**
             * Email validation strategy
             */
            email: {
                validate: function(value) {
                    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return regex.test(value);
                },
                message: 'Please enter a valid email address'
            },
            
            /**
             * Amount validation strategy
             */
            amount: {
                validate: function(value) {
                    return !isNaN(value) && value >= 0;
                },
                message: 'Please enter a valid positive amount'
            },
            
            /**
             * Date validation strategy
             */
            date: {
                validate: function(value) {
                    const d = new Date(value);
                    return d instanceof Date && !isNaN(d.getTime());
                },
                message: 'Please enter a valid date'
            },
            
            /**
             * Required field validation strategy
             */
            required: {
                validate: function(value) {
                    return value !== null && value !== undefined && value.toString().trim() !== '';
                },
                message: 'This field is required'
            },
            
            /**
             * Min length validation strategy
             */
            minLength: {
                validate: function(value, minLength) {
                    return value && value.length >= minLength;
                },
                message: function(minLength) {
                    return `Must be at least ${minLength} characters`;
                }
            },
            
            /**
             * Max length validation strategy
             */
            maxLength: {
                validate: function(value, maxLength) {
                    return !value || value.length <= maxLength;
                },
                message: function(maxLength) {
                    return `Must not exceed ${maxLength} characters`;
                }
            },
            
            /**
             * Pattern validation strategy
             */
            pattern: {
                validate: function(value, pattern) {
                    return new RegExp(pattern).test(value);
                },
                message: 'Invalid format'
            }
        },
        
        /**
         * Validate value using specified strategy
         * @param {*} value - Value to validate
         * @param {string} strategy - Strategy name
         * @param {*} params - Additional parameters for strategy
         * @returns {Object} Validation result
         */
        validate: function(value, strategy, params) {
            const strategyObj = this.strategies[strategy];
            if (!strategyObj) {
                console.error(`Unknown validation strategy: ${strategy}`);
                return { isValid: true };
            }
            
            const isValid = strategyObj.validate(value, params);
            const message = typeof strategyObj.message === 'function' 
                ? strategyObj.message(params) 
                : strategyObj.message;
            
            return {
                isValid: isValid,
                message: isValid ? null : message
            };
        },
        
        /**
         * Validate multiple fields
         * @param {Object} data - Data object to validate
         * @param {Object} rules - Validation rules
         * @returns {Object} Validation results
         */
        validateForm: function(data, rules) {
            const errors = {};
            let isValid = true;
            
            for (const field in rules) {
                const fieldRules = rules[field];
                const value = data[field];
                
                for (const rule of fieldRules) {
                    const result = this.validate(value, rule.strategy, rule.params);
                    if (!result.isValid) {
                        errors[field] = result.message;
                        isValid = false;
                        break; // Stop at first error for this field
                    }
                }
            }
            
            return { isValid, errors };
        },
        
        /**
         * Sanitize input to prevent XSS
         * @param {string} input - User input
         * @returns {string} Sanitized input
         */
        sanitizeInput: function(input) {
            return SecurityUtils.sanitizeInput(input);
        }
    };
    
	//REMOVED THE STORAGE SECTION moved to app-storage.js
    
    /**
     * Notification System using Observer Pattern
     * Manages application notifications with different types and behaviors
     */
    const NotificationManager = {
        /**
         * Active notifications registry
         */
        notifications: new Map(),
        
        /**
         * Notification type configurations
         */
        types: {
            success: {
                bgColor: 'bg-green-500',
                icon: 'check-circle',
                defaultDuration: 3000
            },
            error: {
                bgColor: 'bg-red-500',
                icon: 'alert-circle',
                defaultDuration: 5000
            },
            warning: {
                bgColor: 'bg-yellow-500',
                icon: 'alert-triangle',
                defaultDuration: 4000
            },
            info: {
                bgColor: 'bg-blue-500',
                icon: 'info',
                defaultDuration: 3000
            }
        },
        
        /**
         * Show notification
         * @param {string} message - Notification message
         * @param {string} type - Notification type
         * @param {number} duration - Display duration (0 for persistent)
         * @returns {string} Notification ID
         */
        show: function(message, type = 'info', duration = null) {
            const container = document.getElementById('notification-container');
            if (!container) {
                console.error('Notification container not found');
                return null;
            }
            
            const id = UUIDFactory.create();
            const config = this.types[type] || this.types.info;
            const finalDuration = duration !== null ? duration : config.defaultDuration;
            
            // Create notification element
            const notification = document.createElement('div');
            notification.id = id;
            notification.className = `${config.bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-3 
                                    transform transition-all duration-300 translate-x-full 
                                    flex items-center max-w-md`;
            
            notification.innerHTML = `
                <i data-lucide="${config.icon}" class="w-5 h-5 mr-3 flex-shrink-0"></i>
                <span class="flex-1">${SecurityUtils.sanitizeInput(message)}</span>
                <button onclick="FinanceApp.Utils.NotificationManager.dismiss('${id}')" 
                        class="ml-4 text-white hover:text-gray-200 focus:outline-none">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            `;
            
            container.appendChild(notification);
            this.notifications.set(id, { element: notification, timeout: null });
            
            // Initialize icons
            if (window.lucide) {
                lucide.createIcons();
            }
            
            // Animate in
            requestAnimationFrame(() => {
                notification.classList.remove('translate-x-full');
                notification.classList.add('translate-x-0');
            });
            
            // Auto dismiss
            if (finalDuration > 0) {
                const timeout = setTimeout(() => {
                    this.dismiss(id);
                }, finalDuration);
                this.notifications.get(id).timeout = timeout;
            }
            
            return id;
        },
        
        /**
         * Dismiss notification
         * @param {string} id - Notification ID
         */
        dismiss: function(id) {
            const notificationData = this.notifications.get(id);
            if (!notificationData) return;
            
            const { element, timeout } = notificationData;
            
            // Clear timeout if exists
            if (timeout) {
                clearTimeout(timeout);
            }
            
            // Animate out
            element.classList.remove('translate-x-0');
            element.classList.add('translate-x-full');
            
            // Remove after animation
            setTimeout(() => {
                element.remove();
                this.notifications.delete(id);
            }, 300);
        },
        
        /**
         * Dismiss all notifications
         */
        dismissAll: function() {
            this.notifications.forEach((_, id) => {
                this.dismiss(id);
            });
        },
        
        /**
         * Show confirmation dialog
         * @param {string} message - Confirmation message
         * @param {Function} onConfirm - Confirm callback
         * @param {Function} onCancel - Cancel callback
         */
        confirm: function(message, onConfirm, onCancel) {
            // This would be better implemented as a modal
            // For now, using native confirm
            const result = confirm(message);
            if (result && onConfirm) {
                onConfirm();
            } else if (!result && onCancel) {
                onCancel();
            }
            return result;
        }
    };
    
    /**
     * Chart Utilities using Builder Pattern
     * Builds chart configurations consistently
     */
    const ChartBuilder = {
        /**
         * Get color for chart element
         * @param {number} index - Element index
         * @returns {string} Color hex code
         */
        getColor: function(index) {
            return CONFIG.CHART_COLORS[index % CONFIG.CHART_COLORS.length];
        },
        
        /**
         * Build base chart configuration
         * @returns {Object} Base configuration
         */
        buildBaseConfig: function() {
            return {
                margin: { top: 20, right: 30, left: 40, bottom: 40 },
                animationDuration: CONFIG.CHART_ANIMATION_DURATION
            };
        },
        
        /**
         * Build line chart data
         * @param {Array} data - Raw data
         * @param {string} xKey - X axis key
         * @param {string} yKey - Y axis key
         * @returns {Object} Chart configuration
         */
        buildLineChart: function(data, xKey, yKey) {
            return {
                ...this.buildBaseConfig(),
                data: data.slice(-CONFIG.CHART_MAX_DATA_POINTS), // Limit data points
                xKey: xKey,
                yKey: yKey,
                stroke: this.getColor(0),
                strokeWidth: 2
            };
        },
        
        /**
         * Build pie chart data
         * @param {Array} data - Raw data
         * @param {string} nameKey - Name key
         * @param {string} valueKey - Value key
         * @returns {Array} Formatted chart data
         */
        buildPieChart: function(data, nameKey, valueKey) {
            return data.map((item, index) => ({
                ...item,
                name: item[nameKey],
                value: item[valueKey],
                fill: this.getColor(index)
            }));
        },
        
        /**
         * Build bar chart data
         * @param {Array} data - Raw data
         * @param {string} categoryKey - Category key
         * @param {Array<string>} valueKeys - Value keys for multiple series
         * @returns {Object} Chart configuration
         */
        buildBarChart: function(data, categoryKey, valueKeys) {
            return {
                ...this.buildBaseConfig(),
                data: data,
                categoryKey: categoryKey,
                bars: valueKeys.map((key, index) => ({
                    dataKey: key,
                    fill: this.getColor(index),
                    name: key
                }))
            };
        },
        
        /**
         * Format tooltip value
         * @param {number} value - Value to format
         * @param {string} type - Value type (currency, percent, number)
         * @returns {string} Formatted value
         */
        formatTooltipValue: function(value, type = 'number') {
            switch (type) {
                case 'currency':
                    return DateUtils.formatCurrency(value);
                case 'percent':
                    return `${(value * 100).toFixed(1)}%`;
                default:
                    return value.toLocaleString();
            }
        }
    };
    
    /**
     * Performance Utilities using Proxy Pattern
     * Provides optimized function execution
     */
    const PerformanceUtils = {
        /**
         * Debounce function execution
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @returns {Function} Debounced function
         */
        debounce: function(func, wait = CONFIG.DEBOUNCE_DELAY) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        /**
         * Throttle function execution
         * @param {Function} func - Function to throttle
         * @param {number} limit - Minimum time between executions
         * @returns {Function} Throttled function
         */
        throttle: function(func, limit = 100) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * Memoize function results
         * @param {Function} func - Function to memoize
         * @returns {Function} Memoized function
         */
        memoize: function(func) {
            const cache = new Map();
            return function(...args) {
                const key = JSON.stringify(args);
                if (cache.has(key)) {
                    return cache.get(key);
                }
                const result = func.apply(this, args);
                cache.set(key, result);
                return result;
            };
        },
        
        /**
         * Measure function execution time
         * @param {Function} func - Function to measure
         * @param {string} label - Performance label
         * @returns {Function} Wrapped function
         */
        measure: function(func, label) {
            return function(...args) {
                const start = performance.now();
                const result = func.apply(this, args);
                const end = performance.now();
                console.log(`${label}: ${(end - start).toFixed(2)}ms`);
                return result;
            };
        }
    };
    
    /**
     * Export all utilities to global FinanceApp object
     * Using Facade Pattern to provide a simplified interface
     */
    Object.assign(window.FinanceApp, {
        // Configuration
        CONFIG,
        
        // Core utilities
        Utils: {
            // UUID generation
            generateUUID: UUIDFactory.create,
            isValidUUID: UUIDFactory.isValid,
            
            // Security
            hashPassword: SecurityUtils.hashPassword,
            validatePassword: SecurityUtils.validatePassword,
            sanitizeInput: SecurityUtils.sanitizeInput,
            generateToken: SecurityUtils.generateToken,
            
            // Date utilities
            DateUtils,
            
            // Validation
            ValidationUtils,
            
            // Storage
            StorageUtils,
            
            // Notifications
            NotificationUtils: NotificationManager,
            NotificationManager, // Full access if needed
            
            // Charts
            ChartUtils: ChartBuilder,
            ChartBuilder, // Full access if needed
            
            // Performance
            PerformanceUtils,
            
            // Helper function to deep clone objects
            deepClone: function(obj) {
                return JSON.parse(JSON.stringify(obj));
            },
            
            // Helper function to merge objects
            deepMerge: function(target, source) {
                const output = Object.assign({}, target);
                if (isObject(target) && isObject(source)) {
                    Object.keys(source).forEach(key => {
                        if (isObject(source[key])) {
                            if (!(key in target))
                                Object.assign(output, { [key]: source[key] });
                            else
                                output[key] = deepMerge(target[key], source[key]);
                        } else {
                            Object.assign(output, { [key]: source[key] });
                        }
                    });
                }
                return output;
                
                function isObject(item) {
                    return item && typeof item === 'object' && !Array.isArray(item);
                }
            }
        }
    });
    
    /**
     * Log successful initialization
     */
    console.log('FinanceApp Configuration and Utilities loaded successfully');
    console.log(`Version: ${CONFIG.APP_VERSION}`);
    console.log('Design Patterns: Module, Factory, Strategy, Singleton, Facade, Adapter, Observer, Builder, Proxy');
})();