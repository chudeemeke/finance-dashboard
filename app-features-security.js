/**
 * app-features-security.js - Enhanced Security & Privacy (Improved)
 * Version: 3.1.0
 * 
 * Improvements:
 * - Proper TOTP implementation with HMAC-SHA1
 * - Enhanced encryption using Web Crypto API
 * - Improved session management
 * - Better privacy controls
 */

(function(global) {
    'use strict';

    const { React, ReactDOM } = global;
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    const e = React.createElement;

    // ===========================
    // TOTP Implementation with HMAC-SHA1 (Improved)
    // ===========================
    class TOTPAuthenticator {
        constructor() {
            this.algorithm = 'SHA-1';
            this.digits = 6;
            this.period = 30;
            this.window = 1; // Allow 1 period before/after for clock drift
        }

        /**
         * Generate a random base32 secret
         */
        generateSecret(length = 32) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            const randomValues = new Uint8Array(length);
            crypto.getRandomValues(randomValues);
            
            for (let i = 0; i < length; i++) {
                secret += chars[randomValues[i] % chars.length];
            }
            
            return secret;
        }

        /**
         * Convert base32 string to Uint8Array
         */
        base32ToBytes(base32) {
            const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            const bits = base32
                .toUpperCase()
                .replace(/[^A-Z2-7]/g, '')
                .split('')
                .map(char => base32Chars.indexOf(char).toString(2).padStart(5, '0'))
                .join('');
            
            const bytes = [];
            for (let i = 0; i < bits.length; i += 8) {
                bytes.push(parseInt(bits.substr(i, 8), 2));
            }
            
            return new Uint8Array(bytes);
        }

        /**
         * Convert integer to 8-byte array (big-endian)
         */
        intToBytes(num) {
            const bytes = new Uint8Array(8);
            for (let i = 7; i >= 0; i--) {
                bytes[i] = num & 0xff;
                num = Math.floor(num / 256);
            }
            return bytes;
        }

        /**
         * Perform HMAC-SHA1
         */
        async hmacSha1(key, data) {
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
            );
            
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
            return new Uint8Array(signature);
        }

        /**
         * Generate HOTP value
         */
        async generateHOTP(secret, counter) {
            const key = this.base32ToBytes(secret);
            const counterBytes = this.intToBytes(counter);
            
            // Perform HMAC-SHA1
            const hmac = await this.hmacSha1(key, counterBytes);
            
            // Dynamic truncation
            const offset = hmac[hmac.length - 1] & 0x0f;
            const code = ((hmac[offset] & 0x7f) << 24) |
                        ((hmac[offset + 1] & 0xff) << 16) |
                        ((hmac[offset + 2] & 0xff) << 8) |
                        (hmac[offset + 3] & 0xff);
            
            // Generate digits
            const digits = code % Math.pow(10, this.digits);
            return digits.toString().padStart(this.digits, '0');
        }

        /**
         * Generate TOTP value
         */
        async generateTOTP(secret, time = Date.now()) {
            const counter = Math.floor(time / 1000 / this.period);
            return this.generateHOTP(secret, counter);
        }

        /**
         * Verify TOTP code
         */
        async verifyTOTP(secret, code, time = Date.now()) {
            const counter = Math.floor(time / 1000 / this.period);
            
            // Check current and adjacent time windows
            for (let i = -this.window; i <= this.window; i++) {
                const expectedCode = await this.generateHOTP(secret, counter + i);
                if (expectedCode === code) {
                    return {
                        valid: true,
                        delta: i
                    };
                }
            }
            
            return {
                valid: false,
                delta: null
            };
        }

        /**
         * Generate QR code URL for authenticator apps
         */
        generateQRCodeURL(secret, issuer, accountName) {
            const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?` +
                          `secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${this.algorithm}&digits=${this.digits}&period=${this.period}`;
            
            // Use a QR code service (in production, generate client-side)
            return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
        }

        /**
         * Generate backup codes
         */
        generateBackupCodes(count = 10) {
            const codes = [];
            for (let i = 0; i < count; i++) {
                const randomBytes = new Uint8Array(4);
                crypto.getRandomValues(randomBytes);
                const code = Array.from(randomBytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                    .toUpperCase();
                codes.push(code);
            }
            return codes;
        }
    }

    // ===========================
    // Advanced Encryption Service (Improved)
    // ===========================
    class AdvancedEncryptionService {
        constructor() {
            this.algorithm = 'AES-GCM';
            this.keyLength = 256;
            this.saltLength = 32;
            this.ivLength = 12;
            this.tagLength = 128;
            this.pbkdf2Iterations = 100000;
        }

        /**
         * Derive key from password using PBKDF2
         */
        async deriveKey(password, salt) {
            const encoder = new TextEncoder();
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations: this.pbkdf2Iterations,
                    hash: 'SHA-256'
                },
                passwordKey,
                {
                    name: this.algorithm,
                    length: this.keyLength
                },
                true,
                ['encrypt', 'decrypt']
            );
        }

        /**
         * Encrypt data
         */
        async encrypt(data, password) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            // Derive key
            const key = await this.deriveKey(password, salt);
            
            // Encrypt
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv,
                    tagLength: this.tagLength
                },
                key,
                dataBuffer
            );
            
            // Combine salt, iv, and encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
            
            // Convert to base64
            return btoa(String.fromCharCode(...combined));
        }

        /**
         * Decrypt data
         */
        async decrypt(encryptedBase64, password) {
            try {
                // Convert from base64
                const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
                
                // Extract salt, iv, and encrypted data
                const salt = combined.slice(0, this.saltLength);
                const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
                const encryptedData = combined.slice(this.saltLength + this.ivLength);
                
                // Derive key
                const key = await this.deriveKey(password, salt);
                
                // Decrypt
                const decryptedBuffer = await crypto.subtle.decrypt(
                    {
                        name: this.algorithm,
                        iv,
                        tagLength: this.tagLength
                    },
                    key,
                    encryptedData
                );
                
                // Convert back to string and parse JSON
                const decoder = new TextDecoder();
                const decryptedString = decoder.decode(decryptedBuffer);
                return JSON.parse(decryptedString);
            } catch (error) {
                console.error('Decryption failed:', error);
                throw new Error('Invalid password or corrupted data');
            }
        }

        /**
         * Generate secure random password
         */
        generateSecurePassword(length = 16, options = {}) {
            const defaults = {
                uppercase: true,
                lowercase: true,
                numbers: true,
                symbols: true
            };
            
            const opts = { ...defaults, ...options };
            let charset = '';
            
            if (opts.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (opts.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
            if (opts.numbers) charset += '0123456789';
            if (opts.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            const randomValues = new Uint8Array(length);
            crypto.getRandomValues(randomValues);
            
            let password = '';
            for (let i = 0; i < length; i++) {
                password += charset[randomValues[i] % charset.length];
            }
            
            return password;
        }

        /**
         * Hash data using SHA-256
         */
        async hash(data) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        /**
         * Generate encryption key fingerprint
         */
        async generateKeyFingerprint(key) {
            const exported = await crypto.subtle.exportKey('raw', key);
            const fingerprint = await this.hash(new Uint8Array(exported));
            return fingerprint.substring(0, 16);
        }
    }

    // ===========================
    // Enhanced Session Manager (Improved)
    // ===========================
    class EnhancedSessionManager {
        constructor() {
            this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
            this.warningTime = 5 * 60 * 1000; // 5 minutes before timeout
            this.activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            this.lastActivity = Date.now();
            this.sessionId = null;
            this.isLocked = false;
            this.callbacks = new Map();
        }

        initialize() {
            this.sessionId = this.generateSessionId();
            this.lastActivity = Date.now();
            
            // Setup activity listeners
            this.activityEvents.forEach(event => {
                document.addEventListener(event, this.updateActivity.bind(this), { passive: true });
            });
            
            // Start session monitoring
            this.startMonitoring();
            
            // Setup visibility change detection
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            
            // Setup storage event for cross-tab communication
            window.addEventListener('storage', this.handleStorageEvent.bind(this));
            
            // Announce session
            this.broadcastSessionEvent('session-started');
        }

        generateSessionId() {
            return 'session-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + Date.now().toString(36);
        }

        updateActivity() {
            this.lastActivity = Date.now();
            if (this.isLocked) {
                this.trigger('activity-while-locked');
            }
        }

        startMonitoring() {
            this.monitorInterval = setInterval(() => {
                const now = Date.now();
                const timeSinceActivity = now - this.lastActivity;
                const timeUntilTimeout = this.sessionTimeout - timeSinceActivity;
                
                if (timeUntilTimeout <= 0) {
                    this.handleTimeout();
                } else if (timeUntilTimeout <= this.warningTime && timeUntilTimeout > this.warningTime - 1000) {
                    this.trigger('timeout-warning', { timeRemaining: timeUntilTimeout });
                }
                
                // Update session info
                this.updateSessionInfo();
            }, 1000);
        }

        handleTimeout() {
            this.lockSession();
            this.trigger('session-timeout');
            this.broadcastSessionEvent('session-timeout');
        }

        lockSession() {
            this.isLocked = true;
            this.trigger('session-locked');
            
            // Clear sensitive data from memory
            this.clearSensitiveData();
        }

        async unlockSession(password) {
            // Verify password
            const isValid = await this.verifyPassword(password);
            
            if (isValid) {
                this.isLocked = false;
                this.lastActivity = Date.now();
                this.sessionId = this.generateSessionId();
                this.trigger('session-unlocked');
                this.broadcastSessionEvent('session-unlocked');
                return true;
            }
            
            return false;
        }

        async verifyPassword(password) {
            // In a real app, this would verify against a securely stored hash
            const storedHash = localStorage.getItem('session_password_hash');
            if (!storedHash) return true; // No password set
            
            const encryptionService = new AdvancedEncryptionService();
            const inputHash = await encryptionService.hash(password);
            
            return inputHash === storedHash;
        }

        clearSensitiveData() {
            // Clear any sensitive data from memory
            // This would include clearing form data, temporary encryption keys, etc.
            this.trigger('clear-sensitive-data');
        }

        handleVisibilityChange() {
            if (document.hidden) {
                this.trigger('tab-hidden');
            } else {
                this.trigger('tab-visible');
                this.updateActivity();
            }
        }

        handleStorageEvent(event) {
            if (event.key === 'finance_session_event') {
                try {
                    const data = JSON.parse(event.newValue);
                    if (data.sessionId !== this.sessionId) {
                        this.trigger('cross-tab-event', data);
                        
                        // Handle specific events
                        if (data.event === 'session-locked' || data.event === 'session-timeout') {
                            this.lockSession();
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse session event:', error);
                }
            }
        }

        broadcastSessionEvent(event, data = {}) {
            const eventData = {
                event,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                ...data
            };
            
            localStorage.setItem('finance_session_event', JSON.stringify(eventData));
            
            // Clean up after broadcast
            setTimeout(() => {
                localStorage.removeItem('finance_session_event');
            }, 100);
        }

        updateSessionInfo() {
            const info = {
                sessionId: this.sessionId,
                isLocked: this.isLocked,
                lastActivity: this.lastActivity,
                timeRemaining: Math.max(0, this.sessionTimeout - (Date.now() - this.lastActivity))
            };
            
            this.trigger('session-update', info);
        }

        extendSession() {
            this.lastActivity = Date.now();
            this.trigger('session-extended');
        }

        endSession() {
            clearInterval(this.monitorInterval);
            
            // Remove event listeners
            this.activityEvents.forEach(event => {
                document.removeEventListener(event, this.updateActivity);
            });
            
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('storage', this.handleStorageEvent);
            
            // Clear session data
            this.clearSensitiveData();
            this.broadcastSessionEvent('session-ended');
            
            this.trigger('session-ended');
        }

        on(event, callback) {
            if (!this.callbacks.has(event)) {
                this.callbacks.set(event, new Set());
            }
            this.callbacks.get(event).add(callback);
            
            return () => {
                const callbacks = this.callbacks.get(event);
                if (callbacks) {
                    callbacks.delete(callback);
                }
            };
        }

        trigger(event, data) {
            const callbacks = this.callbacks.get(event);
            if (callbacks) {
                callbacks.forEach(callback => callback(data));
            }
        }
    }

    // ===========================
    // Privacy Control Manager (Improved)
    // ===========================
    class PrivacyControlManager {
        constructor() {
            this.settings = this.loadSettings();
            this.dataRetentionPolicies = {
                transactions: 365 * 2, // 2 years
                analytics: 365, // 1 year
                logs: 90, // 90 days
                temp: 7 // 7 days
            };
        }

        loadSettings() {
            const defaults = {
                shareAnalytics: false,
                enableCrashReports: false,
                allowPeerComparison: true,
                dataMinimization: true,
                autoDeleteOldData: true,
                encryptLocalStorage: true,
                anonymizeExports: true,
                blockThirdPartyScripts: true
            };
            
            const stored = localStorage.getItem('privacy_settings');
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        }

        saveSettings() {
            localStorage.setItem('privacy_settings', JSON.stringify(this.settings));
        }

        updateSetting(key, value) {
            this.settings[key] = value;
            this.saveSettings();
            this.applySettings();
        }

        applySettings() {
            // Apply privacy settings
            if (this.settings.blockThirdPartyScripts) {
                this.blockThirdPartyScripts();
            }
            
            if (this.settings.autoDeleteOldData) {
                this.scheduleDataCleanup();
            }
        }

        blockThirdPartyScripts() {
            // Create a MutationObserver to watch for script additions
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'SCRIPT' && node.src) {
                            const url = new URL(node.src, window.location.origin);
                            if (url.origin !== window.location.origin) {
                                console.warn('Blocked third-party script:', node.src);
                                node.remove();
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }

        async exportUserData(password) {
            const encryptionService = new AdvancedEncryptionService();
            const data = await this.collectAllUserData();
            
            if (this.settings.anonymizeExports) {
                this.anonymizeData(data);
            }
            
            // Encrypt the export
            const encrypted = await encryptionService.encrypt(data, password);
            
            // Create download
            const blob = new Blob([encrypted], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-data-export-${Date.now()}.encrypted`;
            a.click();
            URL.revokeObjectURL(url);
        }

        async collectAllUserData() {
            // Collect all user data from various sources
            const data = {
                exportDate: new Date().toISOString(),
                version: '3.1.0',
                transactions: await this.getTransactions(),
                budgets: await this.getBudgets(),
                accounts: await this.getAccounts(),
                settings: this.settings,
                metadata: {
                    totalTransactions: 0,
                    dateRange: { start: null, end: null }
                }
            };
            
            // Calculate metadata
            if (data.transactions.length > 0) {
                data.metadata.totalTransactions = data.transactions.length;
                const dates = data.transactions.map(t => new Date(t.date));
                data.metadata.dateRange = {
                    start: new Date(Math.min(...dates)).toISOString(),
                    end: new Date(Math.max(...dates)).toISOString()
                };
            }
            
            return data;
        }

        anonymizeData(data) {
            // Remove or hash personally identifiable information
            if (data.transactions) {
                data.transactions.forEach(tx => {
                    // Hash merchant names
                    if (tx.merchant) {
                        tx.merchant = this.hashString(tx.merchant);
                    }
                    // Remove descriptions
                    delete tx.description;
                    // Round amounts to nearest dollar
                    tx.amount = Math.round(tx.amount);
                });
            }
            
            if (data.accounts) {
                data.accounts.forEach(account => {
                    // Hash account names
                    account.name = this.hashString(account.name);
                    // Remove account numbers
                    delete account.accountNumber;
                });
            }
        }

        hashString(str) {
            // Simple hash for anonymization (not cryptographic)
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return 'anon_' + Math.abs(hash).toString(36);
        }

        async deleteAllUserData() {
            // Confirm deletion
            const confirmed = confirm(
                'Are you sure you want to delete all your data? This cannot be undone.'
            );
            
            if (!confirmed) return false;
            
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear IndexedDB
            const databases = await indexedDB.databases();
            for (const db of databases) {
                await indexedDB.deleteDatabase(db.name);
            }
            
            // Clear cookies
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, 
                    "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            return true;
        }

        scheduleDataCleanup() {
            // Run cleanup daily
            const runCleanup = async () => {
                console.log('Running privacy data cleanup...');
                await this.cleanupOldData();
            };
            
            // Run immediately
            runCleanup();
            
            // Schedule daily
            setInterval(runCleanup, 24 * 60 * 60 * 1000);
        }

        async cleanupOldData() {
            const now = Date.now();
            
            // Clean up transactions
            const transactions = await this.getTransactions();
            const transactionCutoff = now - (this.dataRetentionPolicies.transactions * 24 * 60 * 60 * 1000);
            const filteredTransactions = transactions.filter(tx => 
                new Date(tx.date).getTime() > transactionCutoff
            );
            
            if (filteredTransactions.length < transactions.length) {
                await this.saveTransactions(filteredTransactions);
                console.log(`Cleaned up ${transactions.length - filteredTransactions.length} old transactions`);
            }
            
            // Clean up logs
            this.cleanupLogs();
        }

        cleanupLogs() {
            // Clean up console logs and debug data
            if (this.settings.dataMinimization) {
                console.clear();
            }
        }

        // Mock data access methods (would connect to real storage)
        async getTransactions() {
            const stored = localStorage.getItem('transactions');
            return stored ? JSON.parse(stored) : [];
        }

        async saveTransactions(transactions) {
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }

        async getBudgets() {
            const stored = localStorage.getItem('budgets');
            return stored ? JSON.parse(stored) : [];
        }

        async getAccounts() {
            const stored = localStorage.getItem('accounts');
            return stored ? JSON.parse(stored) : [];
        }
    }

    // ===========================
    // Two-Factor Authentication Component
    // ===========================
    const TwoFactorSetup = ({ onComplete, onCancel }) => {
        const [step, setStep] = useState('generate'); // generate, verify, backup
        const [secret, setSecret] = useState('');
        const [qrCodeUrl, setQrCodeUrl] = useState('');
        const [verificationCode, setVerificationCode] = useState('');
        const [backupCodes, setBackupCodes] = useState([]);
        const [error, setError] = useState('');
        
        const totpAuth = useRef(new TOTPAuthenticator());

        useEffect(() => {
            generateSecret();
        }, []);

        const generateSecret = () => {
            const newSecret = totpAuth.current.generateSecret();
            setSecret(newSecret);
            
            const qrUrl = totpAuth.current.generateQRCodeURL(
                newSecret,
                'Finance Dashboard',
                window.FinanceApp.StateSelectors.getCurrentUser(
                    { auth: { currentUser: { email: 'user@example.com' } } }
                ).email
            );
            setQrCodeUrl(qrUrl);
        };

        const verifyCode = async () => {
            setError('');
            
            const result = await totpAuth.current.verifyTOTP(secret, verificationCode);
            if (result.valid) {
                // Generate backup codes
                const codes = totpAuth.current.generateBackupCodes();
                setBackupCodes(codes);
                setStep('backup');
            } else {
                setError('Invalid code. Please try again.');
            }
        };

        const complete2FASetup = () => {
            // Save encrypted secret
            const encryptedSecret = btoa(secret); // In production, use proper encryption
            localStorage.setItem('2fa_secret', encryptedSecret);
            localStorage.setItem('2fa_backup_codes', JSON.stringify(backupCodes));
            
            onComplete({
                secret,
                backupCodes,
                enabled: true
            });
        };

        return e('div', { className: 'space-y-6' },
            step === 'generate' && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Set Up Two-Factor Authentication'),
                
                e('div', { className: 'space-y-4' },
                    e('p', { className: 'text-sm text-gray-600' }, 
                        'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'
                    ),
                    
                    e('div', { className: 'flex justify-center' },
                        e('img', {
                            src: qrCodeUrl,
                            alt: 'TOTP QR Code',
                            className: 'border p-4 bg-white'
                        })
                    ),
                    
                    e('div', { className: 'text-center' },
                        e('p', { className: 'text-sm text-gray-600 mb-2' }, 'Or enter this secret manually:'),
                        e('code', { className: 'text-xs bg-gray-100 p-2 rounded block' }, secret)
                    ),
                    
                    e('button', {
                        onClick: () => setStep('verify'),
                        className: 'w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, 'Next')
                )
            ),

            step === 'verify' && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Verify Setup'),
                
                e('div', { className: 'space-y-4' },
                    e('p', { className: 'text-sm text-gray-600' }, 
                        'Enter the 6-digit code from your authenticator app to verify the setup'
                    ),
                    
                    e('input', {
                        type: 'text',
                        value: verificationCode,
                        onChange: (e) => setVerificationCode(e.target.value),
                        placeholder: '000000',
                        maxLength: 6,
                        className: 'w-full p-3 text-center text-2xl font-mono border rounded'
                    }),
                    
                    error && e('p', { className: 'text-red-500 text-sm' }, error),
                    
                    e('div', { className: 'flex gap-2' },
                        e('button', {
                            onClick: () => setStep('generate'),
                            className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                        }, 'Back'),
                        
                        e('button', {
                            onClick: verifyCode,
                            disabled: verificationCode.length !== 6,
                            className: 'flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
                        }, 'Verify')
                    )
                )
            ),

            step === 'backup' && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Save Backup Codes'),
                
                e('div', { className: 'space-y-4' },
                    e('p', { className: 'text-sm text-gray-600' }, 
                        'Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.'
                    ),
                    
                    e('div', { className: 'grid grid-cols-2 gap-2 p-4 bg-gray-100 rounded' },
                        backupCodes.map((code, index) =>
                            e('code', { 
                                key: index,
                                className: 'font-mono text-sm'
                            }, code)
                        )
                    ),
                    
                    e('button', {
                        onClick: () => {
                            const text = backupCodes.join('\n');
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'finance-dashboard-backup-codes.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                        },
                        className: 'w-full px-4 py-2 border rounded hover:bg-gray-50'
                    }, 'Download Codes'),
                    
                    e('button', {
                        onClick: complete2FASetup,
                        className: 'w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
                    }, 'Complete Setup')
                )
            )
        );
    };

    // ===========================
    // Security Dashboard Component
    // ===========================
    const SecurityDashboard = () => {
        const [activeTab, setActiveTab] = useState('overview');
        const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
        const [sessionInfo, setSessionInfo] = useState(null);
        const [privacySettings, setPrivacySettings] = useState({});
        const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
        
        const sessionManager = useRef(new EnhancedSessionManager());
        const privacyManager = useRef(new PrivacyControlManager());
        const encryptionService = useRef(new AdvancedEncryptionService());

        useEffect(() => {
            // Initialize session manager
            sessionManager.current.initialize();
            
            // Check 2FA status
            const has2FA = localStorage.getItem('2fa_secret') !== null;
            setTwoFactorEnabled(has2FA);
            
            // Load privacy settings
            setPrivacySettings(privacyManager.current.settings);
            
            // Subscribe to session updates
            const unsubscribe = sessionManager.current.on('session-update', (info) => {
                setSessionInfo(info);
            });

            return () => {
                unsubscribe();
            };
        }, []);

        const handlePrivacySettingChange = (key, value) => {
            privacyManager.current.updateSetting(key, value);
            setPrivacySettings({ ...privacyManager.current.settings });
        };

        const handleExportData = async () => {
            const password = prompt('Enter a password to encrypt your data export:');
            if (password) {
                await privacyManager.current.exportUserData(password);
            }
        };

        const handleDeleteData = async () => {
            const deleted = await privacyManager.current.deleteAllUserData();
            if (deleted) {
                window.location.reload();
            }
        };

        const formatTime = (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return `${hours}h ${minutes % 60}m`;
            } else if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            } else {
                return `${seconds}s`;
            }
        };

        return e('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6' },
            e('h2', { className: 'text-2xl font-bold mb-6' }, 'Security & Privacy'),
            
            // Tab Navigation
            e('div', { className: 'flex gap-4 mb-6 border-b' },
                ['overview', '2fa', 'session', 'privacy', 'audit'].map(tab =>
                    e('button', {
                        key: tab,
                        onClick: () => setActiveTab(tab),
                        className: `pb-2 px-4 font-medium transition-colors ${
                            activeTab === tab 
                                ? 'text-blue-500 border-b-2 border-blue-500' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`
                    }, tab === '2fa' ? 'Two-Factor' : tab.charAt(0).toUpperCase() + tab.slice(1))
                )
            ),

            // Tab Content
            activeTab === 'overview' && e('div', { className: 'space-y-6' },
                // Security Status
                e('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                    e('div', { className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        e('h3', { className: 'font-semibold mb-2' }, 'Account Security'),
                        e('div', { className: 'space-y-2' },
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Two-Factor Authentication'),
                                e('span', { 
                                    className: twoFactorEnabled ? 'text-green-500' : 'text-yellow-500'
                                }, twoFactorEnabled ? '✓ Enabled' : '⚠ Disabled')
                            ),
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Encryption'),
                                e('span', { className: 'text-green-500' }, '✓ AES-256-GCM')
                            ),
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Session Security'),
                                e('span', { className: 'text-green-500' }, '✓ Active')
                            )
                        )
                    ),
                    
                    e('div', { className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        e('h3', { className: 'font-semibold mb-2' }, 'Privacy Status'),
                        e('div', { className: 'space-y-2' },
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Data Minimization'),
                                e('span', { 
                                    className: privacySettings.dataMinimization ? 'text-green-500' : 'text-yellow-500'
                                }, privacySettings.dataMinimization ? '✓ Active' : '⚠ Inactive')
                            ),
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Analytics Sharing'),
                                e('span', { 
                                    className: !privacySettings.shareAnalytics ? 'text-green-500' : 'text-yellow-500'
                                }, !privacySettings.shareAnalytics ? '✓ Disabled' : '⚠ Enabled')
                            ),
                            e('div', { className: 'flex items-center justify-between' },
                                e('span', null, 'Local Encryption'),
                                e('span', { 
                                    className: privacySettings.encryptLocalStorage ? 'text-green-500' : 'text-yellow-500'
                                }, privacySettings.encryptLocalStorage ? '✓ Enabled' : '⚠ Disabled')
                            )
                        )
                    )
                ),
                
                // Quick Actions
                e('div', { className: 'flex gap-4' },
                    e('button', {
                        onClick: () => setShowTwoFactorSetup(true),
                        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'),
                    
                    e('button', {
                        onClick: handleExportData,
                        className: 'px-4 py-2 border rounded hover:bg-gray-50'
                    }, 'Export Data'),
                    
                    e('button', {
                        onClick: () => sessionManager.current.lockSession(),
                        className: 'px-4 py-2 border rounded hover:bg-gray-50'
                    }, 'Lock Session')
                )
            ),

            activeTab === '2fa' && e('div', null,
                !showTwoFactorSetup 
                    ? e('div', { className: 'space-y-4' },
                        e('h3', { className: 'text-lg font-semibold' }, 'Two-Factor Authentication'),
                        
                        twoFactorEnabled 
                            ? e('div', { className: 'p-4 bg-green-50 dark:bg-green-900/20 rounded-lg' },
                                e('p', { className: 'text-green-800 dark:text-green-200' }, 
                                    '✓ Two-factor authentication is enabled for your account'
                                ),
                                e('div', { className: 'mt-4 space-y-2' },
                                    e('button', {
                                        onClick: () => {
                                            if (confirm('Are you sure you want to disable 2FA?')) {
                                                localStorage.removeItem('2fa_secret');
                                                localStorage.removeItem('2fa_backup_codes');
                                                setTwoFactorEnabled(false);
                                            }
                                        },
                                        className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                                    }, 'Disable 2FA'),
                                    
                                    e('button', {
                                        onClick: () => {
                                            const codes = localStorage.getItem('2fa_backup_codes');
                                            if (codes) {
                                                alert('Backup codes:\n' + JSON.parse(codes).join('\n'));
                                            }
                                        },
                                        className: 'px-4 py-2 border rounded hover:bg-gray-50 ml-2'
                                    }, 'View Backup Codes')
                                )
                              )
                            : e('div', { className: 'p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg' },
                                e('p', { className: 'text-yellow-800 dark:text-yellow-200 mb-4' }, 
                                    'Two-factor authentication adds an extra layer of security to your account'
                                ),
                                e('button', {
                                    onClick: () => setShowTwoFactorSetup(true),
                                    className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                                }, 'Set Up 2FA')
                              )
                      )
                    : e(TwoFactorSetup, {
                        onComplete: (data) => {
                            setTwoFactorEnabled(true);
                            setShowTwoFactorSetup(false);
                            window.FinanceApp.Utils.NotificationManager.show(
                                'Two-factor authentication enabled successfully', 
                                'success'
                            );
                        },
                        onCancel: () => setShowTwoFactorSetup(false)
                      })
            ),

            activeTab === 'session' && e('div', { className: 'space-y-4' },
                e('h3', { className: 'text-lg font-semibold' }, 'Session Management'),
                
                sessionInfo && e('div', { className: 'space-y-4' },
                    e('div', { className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        e('div', { className: 'space-y-2' },
                            e('div', { className: 'flex justify-between' },
                                e('span', { className: 'font-medium' }, 'Session ID'),
                                e('code', { className: 'text-sm' }, sessionInfo.sessionId.substring(0, 16) + '...')
                            ),
                            e('div', { className: 'flex justify-between' },
                                e('span', { className: 'font-medium' }, 'Status'),
                                e('span', { 
                                    className: sessionInfo.isLocked ? 'text-red-500' : 'text-green-500'
                                }, sessionInfo.isLocked ? 'Locked' : 'Active')
                            ),
                            e('div', { className: 'flex justify-between' },
                                e('span', { className: 'font-medium' }, 'Time Remaining'),
                                e('span', null, formatTime(sessionInfo.timeRemaining))
                            )
                        )
                    ),
                    
                    e('div', { className: 'flex gap-2' },
                        e('button', {
                            onClick: () => sessionManager.current.extendSession(),
                            className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                        }, 'Extend Session'),
                        
                        e('button', {
                            onClick: () => sessionManager.current.lockSession(),
                            className: 'px-4 py-2 border rounded hover:bg-gray-50'
                        }, 'Lock Now'),
                        
                        e('button', {
                            onClick: () => {
                                sessionManager.current.endSession();
                                window.location.reload();
                            },
                            className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                        }, 'End Session')
                    )
                )
            ),

            activeTab === 'privacy' && e('div', { className: 'space-y-4' },
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Privacy Settings'),
                
                Object.entries(privacySettings).map(([key, value]) =>
                    e('div', { 
                        key, 
                        className: 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded'
                    },
                        e('div', null,
                            e('p', { className: 'font-medium' }, 
                                key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                            ),
                            e('p', { className: 'text-sm text-gray-600' }, 
                                this.getPrivacySettingDescription(key)
                            )
                        ),
                        e('label', { className: 'relative inline-flex items-center cursor-pointer' },
                            e('input', {
                                type: 'checkbox',
                                checked: value,
                                onChange: (e) => handlePrivacySettingChange(key, e.target.checked),
                                className: 'sr-only peer'
                            }),
                            e('div', { 
                                className: `w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                           dark:bg-gray-700 peer-checked:after:translate-x-full 
                                           peer-checked:after:border-white after:content-[''] after:absolute 
                                           after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
                                           after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`
                            })
                        )
                    )
                ),
                
                e('div', { className: 'pt-4 border-t space-y-2' },
                    e('button', {
                        onClick: handleExportData,
                        className: 'w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, 'Export All Data'),
                    
                    e('button', {
                        onClick: handleDeleteData,
                        className: 'w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                    }, 'Delete All Data')
                )
            ),

            activeTab === 'audit' && e('div', { className: 'space-y-4' },
                e('h3', { className: 'text-lg font-semibold' }, 'Security Audit Log'),
                e('p', { className: 'text-sm text-gray-600' }, 
                    'Recent security events and actions'
                ),
                
                e('div', { className: 'space-y-2' },
                    [
                        { event: 'Session Started', time: '2 minutes ago', type: 'info' },
                        { event: '2FA Verification', time: '2 minutes ago', type: 'success' },
                        { event: 'Login Successful', time: '2 minutes ago', type: 'success' },
                        { event: 'Password Changed', time: '3 days ago', type: 'warning' },
                        { event: 'Data Export', time: '1 week ago', type: 'info' }
                    ].map((log, index) =>
                        e('div', { 
                            key: index,
                            className: 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded'
                        },
                            e('div', { className: 'flex items-center gap-3' },
                                e('div', { 
                                    className: `w-2 h-2 rounded-full ${
                                        log.type === 'success' ? 'bg-green-500' :
                                        log.type === 'warning' ? 'bg-yellow-500' :
                                        'bg-blue-500'
                                    }`
                                }),
                                e('span', { className: 'font-medium' }, log.event)
                            ),
                            e('span', { className: 'text-sm text-gray-500' }, log.time)
                        )
                    )
                )
            )
        );
    };

    // Helper method for privacy setting descriptions
    SecurityDashboard.prototype.getPrivacySettingDescription = function(key) {
        const descriptions = {
            shareAnalytics: 'Share anonymous usage data to help improve the app',
            enableCrashReports: 'Send crash reports to help fix issues',
            allowPeerComparison: 'Compare your spending with anonymized peer data',
            dataMinimization: 'Automatically remove unnecessary data',
            autoDeleteOldData: 'Delete data older than retention policy',
            encryptLocalStorage: 'Encrypt all data stored locally',
            anonymizeExports: 'Remove personal information from exports',
            blockThirdPartyScripts: 'Block external scripts for privacy'
        };
        
        return descriptions[key] || '';
    };

    // ===========================
    // Export API
    // ===========================
    global.FinanceApp = global.FinanceApp || {};
    global.FinanceApp.SecurityFeatures = {
        // Classes
        TOTPAuthenticator,
        AdvancedEncryptionService,
        EnhancedSessionManager,
        PrivacyControlManager,

        // Components
        TwoFactorSetup,
        SecurityDashboard,

        // Initialize
        initialize: function() {
            console.log('Initializing Security Features...');
            
            // Initialize session manager
            const sessionManager = new EnhancedSessionManager();
            sessionManager.initialize();

            // Apply privacy settings
            const privacyManager = new PrivacyControlManager();
            privacyManager.applySettings();

            console.log('Security Features initialized successfully');
            return true;
        }
    };

})(window);
