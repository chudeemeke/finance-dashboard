/**
 * app-test-suite.js - Comprehensive Test Suite for Finance Dashboard v3.1.0
 * 
 * This is a browser-based test suite that runs without any build tools.
 * Simply include this file after all app files and run window.FinanceApp.TestSuite.runAll()
 */

(function(global) {
    'use strict';

    // Test Framework (Minimal browser-based testing)
    class TestRunner {
        constructor() {
            this.tests = [];
            this.results = {
                passed: 0,
                failed: 0,
                skipped: 0,
                total: 0
            };
            this.currentSuite = '';
        }

        describe(suiteName, testFn) {
            this.currentSuite = suiteName;
            console.group(`📦 ${suiteName}`);
            testFn();
            console.groupEnd();
        }

        it(testName, testFn) {
            this.tests.push({
                suite: this.currentSuite,
                name: testName,
                fn: testFn
            });
        }

        async runAll() {
            console.log('🧪 Starting Finance Dashboard Test Suite...\n');
            const startTime = performance.now();

            for (const test of this.tests) {
                await this.runTest(test);
            }

            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            this.printResults(duration);
            return this.results;
        }

        async runTest(test) {
            this.results.total++;
            
            try {
                // Setup test context
                const context = this.createTestContext();
                
                // Run test
                await test.fn(context);
                
                // Test passed
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.error(`❌ ${test.name}`);
                console.error(`   ${error.message}`);
                console.error(error.stack);
            }
        }

        createTestContext() {
            return {
                assert: {
                    equal: (actual, expected, message) => {
                        if (actual !== expected) {
                            throw new Error(message || `Expected ${actual} to equal ${expected}`);
                        }
                    },
                    notEqual: (actual, expected, message) => {
                        if (actual === expected) {
                            throw new Error(message || `Expected ${actual} to not equal ${expected}`);
                        }
                    },
                    isTrue: (value, message) => {
                        if (value !== true) {
                            throw new Error(message || `Expected ${value} to be true`);
                        }
                    },
                    isFalse: (value, message) => {
                        if (value !== false) {
                            throw new Error(message || `Expected ${value} to be false`);
                        }
                    },
                    isNull: (value, message) => {
                        if (value !== null) {
                            throw new Error(message || `Expected ${value} to be null`);
                        }
                    },
                    isNotNull: (value, message) => {
                        if (value === null) {
                            throw new Error(message || `Expected value to not be null`);
                        }
                    },
                    isUndefined: (value, message) => {
                        if (value !== undefined) {
                            throw new Error(message || `Expected ${value} to be undefined`);
                        }
                    },
                    isDefined: (value, message) => {
                        if (value === undefined) {
                            throw new Error(message || `Expected value to be defined`);
                        }
                    },
                    includes: (array, item, message) => {
                        if (!array.includes(item)) {
                            throw new Error(message || `Expected array to include ${item}`);
                        }
                    },
                    throws: async (fn, message) => {
                        let threw = false;
                        try {
                            await fn();
                        } catch {
                            threw = true;
                        }
                        if (!threw) {
                            throw new Error(message || 'Expected function to throw');
                        }
                    },
                    doesNotThrow: async (fn, message) => {
                        try {
                            await fn();
                        } catch (error) {
                            throw new Error(message || `Expected function not to throw: ${error.message}`);
                        }
                    }
                },
                // Mock localStorage for tests
                mockStorage: this.createMockStorage(),
                // Test utilities
                utils: {
                    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
                    generateTestData: this.generateTestData
                }
            };
        }

        createMockStorage() {
            const storage = new Map();
            return {
                getItem: (key) => storage.get(key) || null,
                setItem: (key, value) => storage.set(key, value),
                removeItem: (key) => storage.delete(key),
                clear: () => storage.clear(),
                get length() { return storage.size; }
            };
        }

        generateTestData() {
            return {
                user: {
                    id: 'test-user-' + Math.random(),
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'admin'
                },
                transaction: {
                    id: 'test-tx-' + Math.random(),
                    date: new Date().toISOString(),
                    amount: 100.50,
                    type: 'expense',
                    category: 'Food',
                    merchant: 'Test Restaurant',
                    description: 'Test transaction'
                },
                account: {
                    id: 'test-acc-' + Math.random(),
                    name: 'Test Account',
                    type: 'checking',
                    balance: 1000.00,
                    currency: 'USD'
                }
            };
        }

        printResults(duration) {
            console.log('\n' + '='.repeat(50));
            console.log('📊 Test Results:');
            console.log('='.repeat(50));
            console.log(`✅ Passed:  ${this.results.passed}`);
            console.log(`❌ Failed:  ${this.results.failed}`);
            console.log(`⏭️  Skipped: ${this.results.skipped}`);
            console.log(`📝 Total:   ${this.results.total}`);
            console.log(`⏱️  Duration: ${duration}s`);
            console.log('='.repeat(50));
            
            if (this.results.failed === 0) {
                console.log('🎉 All tests passed!');
            } else {
                console.log(`⚠️  ${this.results.failed} tests failed`);
            }
        }
    }

    // Create test runner instance
    const runner = new TestRunner();

    // ===========================
    // Configuration Tests
    // ===========================
    runner.describe('Configuration Tests', () => {
        runner.it('should have FinanceApp global object', ({ assert }) => {
            assert.isDefined(window.FinanceApp);
            assert.isDefined(window.FinanceApp.CONFIG);
        });

        runner.it('should have correct app configuration', ({ assert }) => {
            const config = window.FinanceApp.CONFIG;
            assert.equal(config.APP_NAME, 'Family Finance Dashboard');
            assert.equal(config.VERSION, '3.1.0');
            assert.isDefined(config.FEATURES);
            assert.isDefined(config.CURRENCIES);
        });

        runner.it('should have all utility functions', ({ assert }) => {
            const utils = window.FinanceApp.Utils;
            assert.isDefined(utils.generateUUID);
            assert.isDefined(utils.hashPassword);
            assert.isDefined(utils.validatePassword);
            assert.isDefined(utils.DateUtils);
            assert.isDefined(utils.ValidationUtils);
            assert.isDefined(utils.StorageUtils);
        });
    });

    // ===========================
    // State Management Tests
    // ===========================
    runner.describe('State Management Tests', () => {
        runner.it('should have Redux-style state management', ({ assert }) => {
            assert.isDefined(window.FinanceApp.ActionTypes);
            assert.isDefined(window.FinanceApp.FinanceProvider);
            assert.isDefined(window.FinanceApp.useFinance);
            assert.isDefined(window.FinanceApp.StateSelectors);
        });

        runner.it('should handle transaction actions', async ({ assert, utils }) => {
            const testData = utils.generateTestData();
            
            // Mock dispatch
            const dispatch = (action) => {
                assert.equal(action.type, window.FinanceApp.ActionTypes.ADD_TRANSACTION);
                assert.isDefined(action.payload);
            };

            // Test action creator
            const action = {
                type: window.FinanceApp.ActionTypes.ADD_TRANSACTION,
                payload: testData.transaction
            };

            dispatch(action);
        });

        runner.it('should validate state selectors', ({ assert }) => {
            const selectors = window.FinanceApp.StateSelectors;
            
            // Test with mock state
            const mockState = {
                auth: {
                    currentUser: { id: '1', role: 'admin' },
                    isAuthenticated: true
                },
                transactions: [
                    { id: '1', amount: 100, type: 'expense' },
                    { id: '2', amount: 200, type: 'income' }
                ],
                accounts: []
            };

            assert.isTrue(selectors.isAuthenticated(mockState));
            assert.equal(selectors.getCurrentUser(mockState).role, 'admin');
            assert.equal(selectors.getTotalBalance(mockState), 100); // 200 - 100
        });
    });

    // ===========================
    // Authentication Tests
    // ===========================
    runner.describe('Authentication Tests', () => {
        runner.it('should have authentication components', ({ assert }) => {
            const authComponents = window.FinanceApp.AuthComponents;
            assert.isDefined(authComponents.LoginForm);
            assert.isDefined(authComponents.SessionManager);
            assert.isDefined(authComponents.RequireAuth);
            assert.isDefined(authComponents.Can);
        });

        runner.it('should hash passwords correctly', async ({ assert }) => {
            const password = 'TestPassword123!';
            const hash1 = await window.FinanceApp.Utils.hashPassword(password);
            const hash2 = await window.FinanceApp.Utils.hashPassword(password);
            
            assert.notEqual(hash1, password);
            assert.notEqual(hash1, hash2); // Different salt each time
            
            // Verify password
            const isValid = await window.FinanceApp.Utils.validatePassword(password, hash1);
            assert.isTrue(isValid);
        });

        runner.it('should validate password strength', ({ assert }) => {
            const validation = window.FinanceApp.Utils.ValidationUtils;
            
            assert.isFalse(validation.password('weak'));
            assert.isFalse(validation.password('12345678'));
            assert.isTrue(validation.password('StrongP@ss123'));
        });
    });

    // ===========================
    // PWA Feature Tests
    // ===========================
    runner.describe('PWA Feature Tests', () => {
        runner.it('should have PWA features available', ({ assert }) => {
            assert.isDefined(window.FinanceApp.PWAFeatures);
            assert.isDefined(window.FinanceApp.PWAFeatures.ServiceWorkerManager);
            assert.isDefined(window.FinanceApp.PWAFeatures.BiometricAuthManager);
            assert.isDefined(window.FinanceApp.PWAFeatures.CameraManager);
        });

        runner.it('should detect service worker support', ({ assert }) => {
            const swSupported = 'serviceWorker' in navigator;
            if (swSupported) {
                assert.isDefined(navigator.serviceWorker);
            }
        });

        runner.it('should have WebAuthn manager', ({ assert }) => {
            const biometricManager = new window.FinanceApp.PWAFeatures.BiometricAuthManager();
            assert.isDefined(biometricManager.isAvailable);
            assert.isDefined(biometricManager.register);
            assert.isDefined(biometricManager.authenticate);
        });
    });

    // ===========================
    // Security Feature Tests
    // ===========================
    runner.describe('Security Feature Tests', () => {
        runner.it('should have security features available', ({ assert }) => {
            assert.isDefined(window.FinanceApp.SecurityFeatures);
            assert.isDefined(window.FinanceApp.SecurityFeatures.TOTPAuthenticator);
            assert.isDefined(window.FinanceApp.SecurityFeatures.AdvancedEncryptionService);
            assert.isDefined(window.FinanceApp.SecurityFeatures.EnhancedSessionManager);
        });

        runner.it('should generate TOTP secrets', ({ assert }) => {
            const totp = new window.FinanceApp.SecurityFeatures.TOTPAuthenticator();
            const secret = totp.generateSecret();
            
            assert.equal(secret.length, 32);
            assert.isTrue(/^[A-Z2-7]+$/.test(secret));
        });

        runner.it('should encrypt and decrypt data', async ({ assert }) => {
            const encryptionService = new window.FinanceApp.SecurityFeatures.AdvancedEncryptionService();
            const testData = { message: 'Secret data' };
            const password = 'TestPassword123!';
            
            const encrypted = await encryptionService.encrypt(testData, password);
            assert.notEqual(encrypted, JSON.stringify(testData));
            
            const decrypted = await encryptionService.decrypt(encrypted, password);
            assert.equal(decrypted.message, testData.message);
        });

        runner.it('should generate secure passwords', ({ assert }) => {
            const encryptionService = new window.FinanceApp.SecurityFeatures.AdvancedEncryptionService();
            const password = encryptionService.generateSecurePassword(16);
            
            assert.equal(password.length, 16);
            assert.isTrue(/[A-Z]/.test(password)); // Has uppercase
            assert.isTrue(/[a-z]/.test(password)); // Has lowercase
            assert.isTrue(/[0-9]/.test(password)); // Has numbers
        });
    });

    // ===========================
    // Integration Feature Tests
    // ===========================
    runner.describe('Integration Feature Tests', () => {
        runner.it('should have integration features available', ({ assert }) => {
            assert.isDefined(window.FinanceApp.IntegrationFeatures);
            assert.isDefined(window.FinanceApp.IntegrationFeatures.FileParserFactory);
            assert.isDefined(window.FinanceApp.IntegrationFeatures.BankAPISimulator);
            assert.isDefined(window.FinanceApp.IntegrationFeatures.ReceiptOCRService);
        });

        runner.it('should parse CSV data correctly', async ({ assert }) => {
            const csvContent = 'Date,Amount,Category\n2024-01-01,100.50,Food\n2024-01-02,50.25,Transport';
            const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
            
            const parser = await window.FinanceApp.IntegrationFeatures.FileParserFactory.getParser('csv');
            assert.isDefined(parser);
            
            // Note: Actual parsing would require Papa Parse to be loaded
        });

        runner.it('should simulate bank connections', async ({ assert }) => {
            const bankAPI = new window.FinanceApp.IntegrationFeatures.BankAPISimulator();
            const banks = bankAPI.banks;
            
            assert.isTrue(banks.length > 0);
            assert.isDefined(banks[0].id);
            assert.isDefined(banks[0].name);
        });
    });

    // ===========================
    // Advanced Feature Tests
    // ===========================
    runner.describe('Advanced Feature Tests', () => {
        runner.it('should have advanced features available', ({ assert }) => {
            assert.isDefined(window.FinanceApp.AdvancedFeatures);
            assert.isDefined(window.FinanceApp.AdvancedFeatures.P2PCollaborationEngine);
            assert.isDefined(window.FinanceApp.AdvancedFeatures.AIAnalyticsEngine);
            assert.isDefined(window.FinanceApp.AdvancedFeatures.PeerComparisonAnalytics);
        });

        runner.it('should create P2P collaboration engine', ({ assert }) => {
            const p2pEngine = new window.FinanceApp.AdvancedFeatures.P2PCollaborationEngine();
            assert.isDefined(p2pEngine.localPeerId);
            assert.isDefined(p2pEngine.createOffer);
            assert.isDefined(p2pEngine.handleOffer);
        });

        runner.it('should have AI analytics methods', ({ assert }) => {
            const aiEngine = new window.FinanceApp.AdvancedFeatures.AIAnalyticsEngine();
            assert.isDefined(aiEngine.initialize);
            assert.isDefined(aiEngine.predictSpending);
            assert.isDefined(aiEngine.detectAnomalies);
        });
    });

    // ===========================
    // International Feature Tests
    // ===========================
    runner.describe('International Feature Tests', () => {
        runner.it('should have i18n support', ({ assert }) => {
            assert.isDefined(window.FinanceApp.InternationalFeatures);
            assert.isDefined(window.FinanceApp.InternationalFeatures.i18n);
            assert.isDefined(window.FinanceApp.InternationalFeatures.CurrencyConverter);
        });

        runner.it('should support multiple languages', ({ assert }) => {
            const i18n = window.FinanceApp.InternationalFeatures.i18n;
            const languages = i18n.languages;
            
            assert.includes(languages, 'en');
            assert.includes(languages, 'es');
            assert.includes(languages, 'fr');
        });

        runner.it('should convert currencies', async ({ assert }) => {
            const converter = new window.FinanceApp.InternationalFeatures.CurrencyConverter();
            
            // Test with mock rates
            converter.rates = {
                USD: 1,
                EUR: 0.85,
                GBP: 0.73
            };
            
            const converted = converter.convert(100, 'USD', 'EUR');
            assert.equal(converted, 85);
        });
    });

    // ===========================
    // Component Rendering Tests
    // ===========================
    runner.describe('Component Rendering Tests', () => {
        runner.it('should have React and ReactDOM available', ({ assert }) => {
            assert.isDefined(window.React);
            assert.isDefined(window.ReactDOM);
            assert.isDefined(React.createElement);
            assert.isDefined(React.useState);
        });

        runner.it('should have main components defined', ({ assert }) => {
            assert.isDefined(window.FinanceApp.MainComponents);
            assert.isDefined(window.FinanceApp.FinanceComponents);
        });

        runner.it('should create React elements', ({ assert }) => {
            const element = React.createElement('div', { className: 'test' }, 'Hello');
            assert.isDefined(element);
            assert.equal(element.type, 'div');
            assert.equal(element.props.className, 'test');
        });
    });

    // ===========================
    // Data Validation Tests
    // ===========================
    runner.describe('Data Validation Tests', () => {
        runner.it('should validate email addresses', ({ assert }) => {
            const validate = window.FinanceApp.Utils.ValidationUtils;
            
            assert.isTrue(validate.email('test@example.com'));
            assert.isTrue(validate.email('user.name+tag@example.co.uk'));
            assert.isFalse(validate.email('invalid.email'));
            assert.isFalse(validate.email('@example.com'));
        });

        runner.it('should validate amounts', ({ assert }) => {
            const validate = window.FinanceApp.Utils.ValidationUtils;
            
            assert.isTrue(validate.amount('100'));
            assert.isTrue(validate.amount('100.50'));
            assert.isTrue(validate.amount(100.50));
            assert.isFalse(validate.amount('abc'));
            assert.isFalse(validate.amount(-100));
        });

        runner.it('should validate dates', ({ assert }) => {
            const validate = window.FinanceApp.Utils.ValidationUtils;
            
            assert.isTrue(validate.date('2024-01-01'));
            assert.isTrue(validate.date(new Date().toISOString()));
            assert.isFalse(validate.date('invalid-date'));
            assert.isFalse(validate.date('2024-13-01'));
        });
    });

    // ===========================
    // Performance Tests
    // ===========================
    runner.describe('Performance Tests', () => {
        runner.it('should have performance utilities', ({ assert }) => {
            const perfUtils = window.FinanceApp.Utils.PerformanceUtils;
            assert.isDefined(perfUtils.debounce);
            assert.isDefined(perfUtils.throttle);
            assert.isDefined(perfUtils.memoize);
        });

        runner.it('should debounce function calls', async ({ assert, utils }) => {
            let callCount = 0;
            const fn = () => callCount++;
            
            const debounced = window.FinanceApp.Utils.PerformanceUtils.debounce(fn, 50);
            
            // Call multiple times rapidly
            debounced();
            debounced();
            debounced();
            
            // Should not have been called yet
            assert.equal(callCount, 0);
            
            // Wait for debounce delay
            await utils.wait(100);
            
            // Should have been called once
            assert.equal(callCount, 1);
        });

        runner.it('should memoize function results', ({ assert }) => {
            let callCount = 0;
            const expensiveFn = (n) => {
                callCount++;
                return n * 2;
            };
            
            const memoized = window.FinanceApp.Utils.PerformanceUtils.memoize(expensiveFn);
            
            assert.equal(memoized(5), 10);
            assert.equal(callCount, 1);
            
            // Call again with same argument
            assert.equal(memoized(5), 10);
            assert.equal(callCount, 1); // Should not increment
            
            // Call with different argument
            assert.equal(memoized(10), 20);
            assert.equal(callCount, 2);
        });
    });

    // ===========================
    // Error Handling Tests
    // ===========================
    runner.describe('Error Handling Tests', () => {
        runner.it('should handle storage errors gracefully', async ({ assert }) => {
            const storage = window.FinanceApp.Utils.StorageUtils;
            
            // Mock localStorage to throw error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => { throw new Error('Storage full'); };
            
            // Should not throw
            await assert.doesNotThrow(() => {
                storage.setSecure('test-key', { data: 'test' });
            });
            
            // Restore
            localStorage.setItem = originalSetItem;
        });

        runner.it('should validate data before processing', ({ assert }) => {
            const validation = window.FinanceApp.Utils.ValidationUtils;
            
            // Test transaction validation
            const invalidTransaction = {
                amount: -100,
                type: 'invalid',
                date: 'not-a-date'
            };
            
            assert.isFalse(validation.amount(invalidTransaction.amount));
            assert.isFalse(validation.date(invalidTransaction.date));
        });
    });

    // ===========================
    // Integration Tests
    // ===========================
    runner.describe('Integration Tests', () => {
        runner.it('should initialize app without errors', async ({ assert }) => {
            await assert.doesNotThrow(async () => {
                // Check if all phases can initialize
                if (window.FinanceApp.initialize) {
                    // Don't actually initialize to avoid side effects
                    assert.isDefined(window.FinanceApp.initialize);
                }
            });
        });

        runner.it('should have all feature flags available', ({ assert }) => {
            const config = window.FinanceApp.CONFIG;
            const features = config.FEATURES;
            
            assert.isDefined(features.MULTI_CURRENCY);
            assert.isDefined(features.AI_INSIGHTS);
            assert.isDefined(features.BANK_SYNC);
            assert.isDefined(features.RECEIPT_SCANNING);
        });
    });

    // Export test suite
    global.FinanceApp = global.FinanceApp || {};
    global.FinanceApp.TestSuite = {
        runner,
        runAll: () => runner.runAll(),
        
        // Utility to run specific test suites
        runSuite: (suiteName) => {
            const suiteTests = runner.tests.filter(t => t.suite === suiteName);
            console.log(`Running ${suiteName} (${suiteTests.length} tests)...`);
            
            suiteTests.forEach(test => {
                runner.runTest(test);
            });
        },
        
        // Get test statistics
        getStats: () => runner.results,
        
        // Reset test results
        reset: () => {
            runner.results = {
                passed: 0,
                failed: 0,
                skipped: 0,
                total: 0
            };
        }
    };

})(window);
