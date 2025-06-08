/**
 * Family Finance Dashboard v3.1.0
 * State Management with React Context and Reducer
 * 
 * Updated to use Storage abstraction for hot-swappable persistence
 * All original functionality preserved
 */

(function() {
    'use strict';
    
    const { createContext, useContext, useReducer, useEffect, useCallback, useMemo } = React;
    
    // Wait for Storage module to be available
    const initializeStateManagement = () => {
        if (!window.FinanceApp?.Storage) {
            setTimeout(initializeStateManagement, 50);
            return;
        }
        
        /**
         * Action Types using Enum Pattern
         * Centralized action type definitions prevent typos and enable autocomplete
         * Organized by domain for better maintainability
         */
        const ActionTypes = {
            // Authentication Actions
            AUTH: {
                LOGIN_REQUEST: 'AUTH/LOGIN_REQUEST',
                LOGIN_SUCCESS: 'AUTH/LOGIN_SUCCESS',
                LOGIN_FAILURE: 'AUTH/LOGIN_FAILURE',
                LOGOUT: 'AUTH/LOGOUT',
                UPDATE_SESSION: 'AUTH/UPDATE_SESSION',
                SESSION_EXPIRED: 'AUTH/SESSION_EXPIRED'
            },
            
            // User Management Actions
            USER: {
                CREATE_REQUEST: 'USER/CREATE_REQUEST',
                CREATE_SUCCESS: 'USER/CREATE_SUCCESS',
                CREATE_FAILURE: 'USER/CREATE_FAILURE',
                UPDATE: 'USER/UPDATE',
                DELETE: 'USER/DELETE',
                SET_ALL: 'USER/SET_ALL',
                UPDATE_PREFERENCES: 'USER/UPDATE_PREFERENCES'
            },
            
            // Transaction Actions
            TRANSACTION: {
                SET_ALL: 'TRANSACTION/SET_ALL',
                ADD: 'TRANSACTION/ADD',
                UPDATE: 'TRANSACTION/UPDATE',
                DELETE: 'TRANSACTION/DELETE',
                BULK_DELETE: 'TRANSACTION/BULK_DELETE',
                IMPORT: 'TRANSACTION/IMPORT'
            },
            
            // Budget Actions
            BUDGET: {
                SET_ALL: 'BUDGET/SET_ALL',
                ADD: 'BUDGET/ADD',
                UPDATE: 'BUDGET/UPDATE',
                DELETE: 'BUDGET/DELETE',
                UPDATE_SPENT: 'BUDGET/UPDATE_SPENT',
                RESET_PERIOD: 'BUDGET/RESET_PERIOD'
            },
            
            // Bill Actions
            BILL: {
                SET_ALL: 'BILL/SET_ALL',
                ADD: 'BILL/ADD',
                UPDATE: 'BILL/UPDATE',
                DELETE: 'BILL/DELETE',
                MARK_PAID: 'BILL/MARK_PAID',
                SET_REMINDER: 'BILL/SET_REMINDER'
            },
            
            // Savings Goal Actions
            SAVINGS: {
                SET_ALL: 'SAVINGS/SET_ALL',
                ADD: 'SAVINGS/ADD',
                UPDATE: 'SAVINGS/UPDATE',
                DELETE: 'SAVINGS/DELETE',
                ADD_CONTRIBUTION: 'SAVINGS/ADD_CONTRIBUTION',
                WITHDRAW: 'SAVINGS/WITHDRAW'
            },
            
            // Settings Actions
            SETTINGS: {
                UPDATE: 'SETTINGS/UPDATE',
                RESET: 'SETTINGS/RESET',
                IMPORT: 'SETTINGS/IMPORT',
                EXPORT: 'SETTINGS/EXPORT'
            },
            
            // UI State Actions
            UI: {
                SET_LOADING: 'UI/SET_LOADING',
                SET_ERROR: 'UI/SET_ERROR',
                CLEAR_ERROR: 'UI/CLEAR_ERROR',
                SET_SUCCESS: 'UI/SET_SUCCESS',
                CLEAR_SUCCESS: 'UI/CLEAR_SUCCESS',
                SET_ACTIVE_VIEW: 'UI/SET_ACTIVE_VIEW',
                TOGGLE_SIDEBAR: 'UI/TOGGLE_SIDEBAR',
                SET_FILTER: 'UI/SET_FILTER',
                SET_SORT: 'UI/SET_SORT',
                SET_PAGINATION: 'UI/SET_PAGINATION'
            },
            
            // Audit Trail Actions
            AUDIT: {
                ADD_ENTRY: 'AUDIT/ADD_ENTRY',
                SET_ALL: 'AUDIT/SET_ALL',
                CLEAR: 'AUDIT/CLEAR'
            },
            
            // Data Management Actions
            DATA: {
                IMPORT_ALL: 'DATA/IMPORT_ALL',
                EXPORT_ALL: 'DATA/EXPORT_ALL',
                CLEAR_ALL: 'DATA/CLEAR_ALL',
                BACKUP_CREATE: 'DATA/BACKUP_CREATE',
                BACKUP_RESTORE: 'DATA/BACKUP_RESTORE'
            }
        };
        
        /**
         * Initial State Factory
         * Creates a fresh initial state with proper defaults
         * Now loads persisted data using Storage abstraction
         */
        const createInitialState = () => {
            // Load persisted data using Storage abstraction
            const persistedUsers = window.FinanceApp.Storage.getItem('users') || [];
            const persistedCurrentUser = window.FinanceApp.Storage.getItem('currentUser');
            const persistedSession = window.FinanceApp.Storage.getItem('session');
            const persistedTransactions = window.FinanceApp.Storage.getItem('transactions') || [];
            const persistedBudgets = window.FinanceApp.Storage.getItem('budgets') || [];
            const persistedBills = window.FinanceApp.Storage.getItem('bills') || [];
            const persistedSavingsGoals = window.FinanceApp.Storage.getItem('savingsGoals') || [];
            const persistedSettings = window.FinanceApp.Storage.getItem('settings') || {
                currency: FinanceApp.CONFIG.DEFAULT_CURRENCY,
                fiscalYearStart: 1,
                dateFormat: FinanceApp.CONFIG.DATE_FORMAT,
                numberFormat: FinanceApp.CONFIG.NUMBER_FORMAT,
                theme: 'light',
                language: 'en',
                notifications: {
                    bills: true,
                    budgets: true,
                    goals: true,
                    email: false,
                    push: false
                },
                privacy: {
                    shareAnalytics: false,
                    enableBackups: true
                },
                features: { ...FinanceApp.CONFIG.FEATURES }
            };
            const persistedAudit = window.FinanceApp.Storage.getItem('audit') || [];
            
            return {
                // Authentication State
                auth: {
                    currentUser: persistedCurrentUser,
                    isAuthenticated: !!persistedCurrentUser && !!persistedSession,
                    sessionExpiry: persistedSession?.expiresAt || null,
                    loginAttempts: 0,
                    lastLoginAttempt: null,
                    isLocked: false
                },
                
                // User Management State
                users: {
                    all: persistedUsers,
                    byId: persistedUsers.reduce((acc, user) => {
                        acc[user.id] = user;
                        return acc;
                    }, {}),
                    loading: false,
                    error: null
                },
                
                // Financial Data State
                transactions: {
                    all: persistedTransactions,
                    byId: persistedTransactions.reduce((acc, tx) => {
                        acc[tx.id] = tx;
                        return acc;
                    }, {}),
                    byCategory: {},
                    byMonth: {},
                    loading: false,
                    error: null,
                    filters: {
                        dateRange: 'month',
                        category: null,
                        type: null,
                        search: ''
                    },
                    sort: {
                        field: 'date',
                        direction: 'desc'
                    },
                    pagination: {
                        page: 1,
                        perPage: FinanceApp.CONFIG.ITEMS_PER_PAGE,
                        total: persistedTransactions.length
                    }
                },
                
                budgets: {
                    all: persistedBudgets,
                    byId: persistedBudgets.reduce((acc, budget) => {
                        acc[budget.id] = budget;
                        return acc;
                    }, {}),
                    byCategory: {},
                    active: [],
                    loading: false,
                    error: null
                },
                
                bills: {
                    all: persistedBills,
                    byId: persistedBills.reduce((acc, bill) => {
                        acc[bill.id] = bill;
                        return acc;
                    }, {}),
                    upcoming: [],
                    overdue: [],
                    loading: false,
                    error: null
                },
                
                savingsGoals: {
                    all: persistedSavingsGoals,
                    byId: persistedSavingsGoals.reduce((acc, goal) => {
                        acc[goal.id] = goal;
                        return acc;
                    }, {}),
                    active: [],
                    completed: [],
                    loading: false,
                    error: null
                },
                
                // Application Settings
                settings: persistedSettings,
                
                // UI State
                ui: {
                    loading: false,
                    loadingMessage: '',
                    error: null,
                    success: null,
                    activeView: 'dashboard',
                    sidebarOpen: true,
                    modals: {
                        transaction: false,
                        budget: false,
                        bill: false,
                        savings: false,
                        settings: false
                    }
                },
                
                // Audit Trail
                audit: {
                    entries: persistedAudit,
                    filters: {
                        userId: null,
                        action: null,
                        dateRange: 'week'
                    }
                },
                
                // Cache for computed values
                cache: {
                    totals: null,
                    trends: null,
                    lastUpdated: null
                }
            };
        };
        
        /**
         * State Selectors using Memoization Pattern
         * Compute derived state efficiently with caching
         */
        const StateSelectors = {
            /**
             * Get current user with role info
             */
            getCurrentUser: (state) => state.auth.currentUser,
            
            /**
             * Check if user has specific role
             */
            hasRole: (state, role) => {
                const user = state.auth.currentUser;
                return user && (user.role === role || user.role === 'admin');
            },
            
            /**
             * Get filtered transactions
             */
            getFilteredTransactions: (state) => {
                let transactions = state.transactions.all;
                const { filters } = state.transactions;
                
                // Apply filters
                if (filters.dateRange) {
                    const range = FinanceApp.Utils.DateUtils.getDateRange(filters.dateRange);
                    if (range.start && range.end) {
                        transactions = transactions.filter(t => {
                            const date = new Date(t.date);
                            return date >= range.start && date <= range.end;
                        });
                    }
                }
                
                if (filters.category) {
                    transactions = transactions.filter(t => t.category === filters.category);
                }
                
                if (filters.type) {
                    transactions = transactions.filter(t => t.type === filters.type);
                }
                
                if (filters.search) {
                    const search = filters.search.toLowerCase();
                    transactions = transactions.filter(t => 
                        t.description.toLowerCase().includes(search) ||
                        t.category.toLowerCase().includes(search) ||
                        t.amount.toString().includes(search)
                    );
                }
                
                return transactions;
            },
            
            /**
             * Get upcoming bills
             */
            getUpcomingBills: (state, days = 7) => {
                const now = new Date();
                const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
                
                return state.bills.all.filter(bill => {
                    const dueDate = new Date(bill.nextDueDate);
                    return dueDate >= now && dueDate <= future;
                }).sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
            },
            
            /**
             * Get budget status
             */
            getBudgetStatus: (state, budgetId) => {
                const budget = state.budgets.byId[budgetId];
                if (!budget) return null;
                
                const spent = budget.spent || 0;
                const remaining = budget.amount - spent;
                const percentage = (spent / budget.amount) * 100;
                
                return {
                    budget,
                    spent,
                    remaining,
                    percentage,
                    isOverBudget: spent > budget.amount,
                    status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
                };
            },
            
            /**
             * Get financial summary
             */
            getFinancialSummary: (state) => {
                const transactions = StateSelectors.getFilteredTransactions(state);
                
                const income = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const expenses = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const savings = state.savingsGoals.all
                    .reduce((sum, goal) => sum + goal.currentAmount, 0);
                    
                return {
                    income,
                    expenses,
                    net: income - expenses,
                    savings,
                    savingsRate: income > 0 ? (savings / income) * 100 : 0
                };
            }
        };
        
        /**
         * Persistence Helper
         * Automatically persists state changes to storage
         */
        const persistStateChange = (key, value) => {
            window.FinanceApp.Storage.setItem(key, value);
        };
        
        /**
         * Reducer using Command Pattern
         * Each action is a command that transforms state
         * Implements immutability and predictable updates
         */
        function financeReducer(state, action) {
            // Log action for debugging (in development only)
            if (FinanceApp.CONFIG.ENVIRONMENT === 'development') {
                console.log('Action:', action.type, action.payload);
            }
            
            /**
             * Helper function to update normalized data
             * Maintains both array and byId lookup
             */
            const updateNormalizedData = (data, item, operation = 'add') => {
                switch (operation) {
                    case 'add':
                        return {
                            all: [...data.all, item],
                            byId: { ...data.byId, [item.id]: item }
                        };
                    case 'update':
                        return {
                            all: data.all.map(i => i.id === item.id ? item : i),
                            byId: { ...data.byId, [item.id]: item }
                        };
                    case 'delete':
                        return {
                            all: data.all.filter(i => i.id !== item),
                            byId: Object.fromEntries(
                                Object.entries(data.byId).filter(([id]) => id !== item)
                            )
                        };
                    default:
                        return data;
                }
            };
            
            /**
             * Create audit entry for action
             * Implements Memento Pattern for state history
             */
            const createAuditEntry = (action, state) => {
                // Skip audit for certain actions
                const skipAudit = [
                    ...Object.values(ActionTypes.UI),
                    ActionTypes.AUDIT.ADD_ENTRY,
                    ActionTypes.AUDIT.SET_ALL
                ];
                
                if (skipAudit.includes(action.type)) {
                    return null;
                }
                
                return {
                    id: FinanceApp.Utils.generateUUID(),
                    timestamp: new Date().toISOString(),
                    userId: state.auth.currentUser?.id || 'system',
                    username: state.auth.currentUser?.username || 'System',
                    action: action.type,
                    details: action.payload,
                    metadata: {
                        ip: 'Local',
                        userAgent: navigator.userAgent,
                        sessionId: state.auth.sessionId
                    }
                };
            };
            
            // Main reducer logic
            let newState = state;
            
            switch (action.type) {
                // Authentication Actions
                case ActionTypes.AUTH.LOGIN_REQUEST:
                    newState = {
                        ...state,
                        ui: { ...state.ui, loading: true, error: null }
                    };
                    break;
                    
                case ActionTypes.AUTH.LOGIN_SUCCESS:
                    newState = {
                        ...state,
                        auth: {
                            ...state.auth,
                            currentUser: action.payload.user,
                            isAuthenticated: true,
                            sessionExpiry: action.payload.sessionExpiry,
                            loginAttempts: 0,
                            lastLoginAttempt: new Date().toISOString(),
                            isLocked: false
                        },
                        ui: { ...state.ui, loading: false, success: 'Login successful!' }
                    };
                    // Persist auth state
                    persistStateChange('currentUser', action.payload.user);
                    persistStateChange('session', {
                        ...action.payload.session,
                        expiresAt: action.payload.sessionExpiry
                    });
                    break;
                    
                case ActionTypes.AUTH.LOGIN_FAILURE:
                    const attempts = state.auth.loginAttempts + 1;
                    const isLocked = attempts >= FinanceApp.CONFIG.MAX_LOGIN_ATTEMPTS;
                    
                    newState = {
                        ...state,
                        auth: {
                            ...state.auth,
                            loginAttempts: attempts,
                            lastLoginAttempt: new Date().toISOString(),
                            isLocked: isLocked
                        },
                        ui: { 
                            ...state.ui, 
                            loading: false, 
                            error: isLocked 
                                ? 'Account locked due to too many failed attempts' 
                                : action.payload.error 
                        }
                    };
                    break;
                    
                case ActionTypes.AUTH.LOGOUT:
                    // Preserve users and settings on logout
                    newState = {
                        ...createInitialState(),
                        users: state.users,
                        settings: state.settings
                    };
                    // Clear auth from storage
                    persistStateChange('currentUser', null);
                    persistStateChange('session', null);
                    break;
                    
                case ActionTypes.AUTH.UPDATE_SESSION:
                    newState = {
                        ...state,
                        auth: {
                            ...state.auth,
                            sessionExpiry: new Date(Date.now() + FinanceApp.CONFIG.SESSION_TIMEOUT).toISOString()
                        }
                    };
                    // Update session in storage
                    if (state.auth.currentUser) {
                        persistStateChange('session', {
                            userId: state.auth.currentUser.id,
                            expiresAt: newState.auth.sessionExpiry
                        });
                    }
                    break;
                    
                // User Management Actions
                case ActionTypes.USER.CREATE_SUCCESS:
                    newState = {
                        ...state,
                        users: updateNormalizedData(state.users, action.payload, 'add')
                    };
                    // Persist users
                    persistStateChange('users', newState.users.all);
                    break;
                    
                case ActionTypes.USER.UPDATE:
                    const updatedState = {
                        ...state,
                        users: updateNormalizedData(state.users, action.payload, 'update')
                    };
                    
                    // Update current user if it's the one being updated
                    if (state.auth.currentUser?.id === action.payload.id) {
                        updatedState.auth = {
                            ...updatedState.auth,
                            currentUser: action.payload
                        };
                        persistStateChange('currentUser', action.payload);
                    }
                    
                    newState = updatedState;
                    // Persist users
                    persistStateChange('users', newState.users.all);
                    break;
                    
                case ActionTypes.USER.DELETE:
                    newState = {
                        ...state,
                        users: updateNormalizedData(state.users, action.payload, 'delete')
                    };
                    // Persist users
                    persistStateChange('users', newState.users.all);
                    break;
                    
                // Transaction Actions
                case ActionTypes.TRANSACTION.SET_ALL:
                    const transactionsByCategory = {};
                    const transactionsByMonth = {};
                    
                    // Build indexes for efficient querying
                    action.payload.forEach(transaction => {
                        // By category index
                        if (!transactionsByCategory[transaction.category]) {
                            transactionsByCategory[transaction.category] = [];
                        }
                        transactionsByCategory[transaction.category].push(transaction.id);
                        
                        // By month index
                        const monthKey = new Date(transaction.date).toISOString().slice(0, 7);
                        if (!transactionsByMonth[monthKey]) {
                            transactionsByMonth[monthKey] = [];
                        }
                        transactionsByMonth[monthKey].push(transaction.id);
                    });
                    
                    newState = {
                        ...state,
                        transactions: {
                            ...state.transactions,
                            all: action.payload,
                            byId: Object.fromEntries(action.payload.map(t => [t.id, t])),
                            byCategory: transactionsByCategory,
                            byMonth: transactionsByMonth,
                            pagination: {
                                ...state.transactions.pagination,
                                total: action.payload.length
                            }
                        },
                        cache: { ...state.cache, totals: null, lastUpdated: Date.now() }
                    };
                    // Persist transactions
                    persistStateChange('transactions', action.payload);
                    break;
                    
                case ActionTypes.TRANSACTION.ADD:
                    const newTransaction = {
                        ...action.payload,
                        id: action.payload.id || FinanceApp.Utils.generateUUID(),
                        createdAt: new Date().toISOString(),
                        createdBy: state.auth.currentUser.id
                    };
                    
                    newState = {
                        ...state,
                        transactions: {
                            ...state.transactions,
                            ...updateNormalizedData(state.transactions, newTransaction, 'add')
                        },
                        cache: { ...state.cache, totals: null, lastUpdated: Date.now() }
                    };
                    // Persist transactions
                    persistStateChange('transactions', newState.transactions.all);
                    break;
                    
                case ActionTypes.TRANSACTION.UPDATE:
                    const updatedTransaction = {
                        ...action.payload,
                        updatedAt: new Date().toISOString(),
                        updatedBy: state.auth.currentUser.id
                    };
                    
                    newState = {
                        ...state,
                        transactions: {
                            ...state.transactions,
                            ...updateNormalizedData(state.transactions, updatedTransaction, 'update')
                        },
                        cache: { ...state.cache, totals: null, lastUpdated: Date.now() }
                    };
                    // Persist transactions
                    persistStateChange('transactions', newState.transactions.all);
                    break;
                    
                case ActionTypes.TRANSACTION.DELETE:
                    newState = {
                        ...state,
                        transactions: {
                            ...state.transactions,
                            ...updateNormalizedData(state.transactions, action.payload, 'delete')
                        },
                        cache: { ...state.cache, totals: null, lastUpdated: Date.now() }
                    };
                    // Persist transactions
                    persistStateChange('transactions', newState.transactions.all);
                    break;
                    
                // Budget Actions
                case ActionTypes.BUDGET.SET_ALL:
                    const budgetsByCategory = {};
                    const activeBudgets = [];
                    
                    action.payload.forEach(budget => {
                        budgetsByCategory[budget.category] = budget.id;
                        if (budget.isActive) {
                            activeBudgets.push(budget.id);
                        }
                    });
                    
                    newState = {
                        ...state,
                        budgets: {
                            ...state.budgets,
                            all: action.payload,
                            byId: Object.fromEntries(action.payload.map(b => [b.id, b])),
                            byCategory: budgetsByCategory,
                            active: activeBudgets
                        }
                    };
                    // Persist budgets
                    persistStateChange('budgets', action.payload);
                    break;
                    
                case ActionTypes.BUDGET.ADD:
                    const newBudget = {
                        ...action.payload,
                        id: action.payload.id || FinanceApp.Utils.generateUUID(),
                        spent: 0,
                        createdAt: new Date().toISOString(),
                        createdBy: state.auth.currentUser.id,
                        isActive: true
                    };
                    
                    newState = {
                        ...state,
                        budgets: {
                            ...state.budgets,
                            ...updateNormalizedData(state.budgets, newBudget, 'add')
                        }
                    };
                    // Persist budgets
                    persistStateChange('budgets', newState.budgets.all);
                    break;
                    
                case ActionTypes.BUDGET.UPDATE:
                    newState = {
                        ...state,
                        budgets: {
                            ...state.budgets,
                            ...updateNormalizedData(state.budgets, action.payload, 'update')
                        }
                    };
                    // Persist budgets
                    persistStateChange('budgets', newState.budgets.all);
                    break;
                    
                case ActionTypes.BUDGET.UPDATE_SPENT:
                    const budgetToUpdate = state.budgets.byId[action.payload.budgetId];
                    if (!budgetToUpdate) return state;
                    
                    const updatedBudgetWithSpent = {
                        ...budgetToUpdate,
                        spent: action.payload.amount,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    newState = {
                        ...state,
                        budgets: {
                            ...state.budgets,
                            ...updateNormalizedData(state.budgets, updatedBudgetWithSpent, 'update')
                        }
                    };
                    // Persist budgets
                    persistStateChange('budgets', newState.budgets.all);
                    break;
                    
                // Bill Actions
                case ActionTypes.BILL.SET_ALL:
                    const upcomingBills = [];
                    const overdueBills = [];
                    const now = new Date();
                    
                    action.payload.forEach(bill => {
                        const dueDate = new Date(bill.nextDueDate);
                        if (dueDate > now) {
                            upcomingBills.push(bill.id);
                        } else if (dueDate < now && !bill.isPaid) {
                            overdueBills.push(bill.id);
                        }
                    });
                    
                    newState = {
                        ...state,
                        bills: {
                            ...state.bills,
                            all: action.payload,
                            byId: Object.fromEntries(action.payload.map(b => [b.id, b])),
                            upcoming: upcomingBills,
                            overdue: overdueBills
                        }
                    };
                    // Persist bills
                    persistStateChange('bills', action.payload);
                    break;
                    
                case ActionTypes.BILL.ADD:
                    const newBill = {
                        ...action.payload,
                        id: action.payload.id || FinanceApp.Utils.generateUUID(),
                        createdAt: new Date().toISOString(),
                        createdBy: state.auth.currentUser.id,
                        isPaid: false
                    };
                    
                    newState = {
                        ...state,
                        bills: {
                            ...state.bills,
                            ...updateNormalizedData(state.bills, newBill, 'add')
                        }
                    };
                    // Persist bills
                    persistStateChange('bills', newState.bills.all);
                    break;
                    
                case ActionTypes.BILL.MARK_PAID:
                    const billToPay = state.bills.byId[action.payload.billId];
                    if (!billToPay) return state;
                    
                    const paidBill = {
                        ...billToPay,
                        isPaid: true,
                        lastPaidDate: action.payload.paidDate,
                        paymentHistory: [
                            ...(billToPay.paymentHistory || []),
                            {
                                date: action.payload.paidDate,
                                amount: billToPay.amount,
                                method: action.payload.method
                            }
                        ]
                    };
                    
                    // Calculate next due date for recurring bills
                    if (billToPay.isRecurring) {
                        const currentDue = new Date(billToPay.nextDueDate);
                        const nextDue = new Date(currentDue);
                        
                        switch (billToPay.frequency) {
                            case 'weekly':
                                nextDue.setDate(nextDue.getDate() + 7);
                                break;
                            case 'biweekly':
                                nextDue.setDate(nextDue.getDate() + 14);
                                break;
                            case 'monthly':
                                nextDue.setMonth(nextDue.getMonth() + 1);
                                break;
                            case 'quarterly':
                                nextDue.setMonth(nextDue.getMonth() + 3);
                                break;
                            case 'annually':
                                nextDue.setFullYear(nextDue.getFullYear() + 1);
                                break;
                        }
                        
                        paidBill.nextDueDate = nextDue.toISOString();
                        paidBill.isPaid = false; // Reset for next payment
                    }
                    
                    newState = {
                        ...state,
                        bills: {
                            ...state.bills,
                            ...updateNormalizedData(state.bills, paidBill, 'update')
                        }
                    };
                    // Persist bills
                    persistStateChange('bills', newState.bills.all);
                    break;
                    
                // Savings Goal Actions
                case ActionTypes.SAVINGS.SET_ALL:
                    const activeGoals = [];
                    const completedGoals = [];
                    
                    action.payload.forEach(goal => {
                        if (goal.currentAmount >= goal.targetAmount) {
                            completedGoals.push(goal.id);
                        } else {
                            activeGoals.push(goal.id);
                        }
                    });
                    
                    newState = {
                        ...state,
                        savingsGoals: {
                            ...state.savingsGoals,
                            all: action.payload,
                            byId: Object.fromEntries(action.payload.map(g => [g.id, g])),
                            active: activeGoals,
                            completed: completedGoals
                        }
                    };
                    // Persist savings goals
                    persistStateChange('savingsGoals', action.payload);
                    break;
                    
                case ActionTypes.SAVINGS.ADD:
                    const newGoal = {
                        ...action.payload,
                        id: action.payload.id || FinanceApp.Utils.generateUUID(),
                        currentAmount: 0,
                        contributions: [],
                        createdAt: new Date().toISOString(),
                        createdBy: state.auth.currentUser.id
                    };
                    
                    newState = {
                        ...state,
                        savingsGoals: {
                            ...state.savingsGoals,
                            ...updateNormalizedData(state.savingsGoals, newGoal, 'add')
                        }
                    };
                    // Persist savings goals
                    persistStateChange('savingsGoals', newState.savingsGoals.all);
                    break;
                    
                case ActionTypes.SAVINGS.ADD_CONTRIBUTION:
                    const goalForContribution = state.savingsGoals.byId[action.payload.goalId];
                    if (!goalForContribution) return state;
                    
                    const contribution = {
                        id: FinanceApp.Utils.generateUUID(),
                        amount: action.payload.amount,
                        date: action.payload.date || new Date().toISOString(),
                        note: action.payload.note,
                        addedBy: state.auth.currentUser.id
                    };
                    
                    const updatedGoalWithContribution = {
                        ...goalForContribution,
                        currentAmount: goalForContribution.currentAmount + action.payload.amount,
                        contributions: [...(goalForContribution.contributions || []), contribution],
                        lastUpdated: new Date().toISOString()
                    };
                    
                    newState = {
                        ...state,
                        savingsGoals: {
                            ...state.savingsGoals,
                            ...updateNormalizedData(state.savingsGoals, updatedGoalWithContribution, 'update')
                        }
                    };
                    // Persist savings goals
                    persistStateChange('savingsGoals', newState.savingsGoals.all);
                    break;
                    
                // Settings Actions
                case ActionTypes.SETTINGS.UPDATE:
                    newState = {
                        ...state,
                        settings: FinanceApp.Utils.deepMerge(state.settings, action.payload)
                    };
                    // Persist settings
                    persistStateChange('settings', newState.settings);
                    break;
                    
                case ActionTypes.SETTINGS.RESET:
                    newState = {
                        ...state,
                        settings: createInitialState().settings
                    };
                    // Persist settings
                    persistStateChange('settings', newState.settings);
                    break;
                    
                // UI State Actions (not persisted)
                case ActionTypes.UI.SET_LOADING:
                    newState = {
                        ...state,
                        ui: {
                            ...state.ui,
                            loading: action.payload.loading,
                            loadingMessage: action.payload.message || ''
                        }
                    };
                    break;
                    
                case ActionTypes.UI.SET_ERROR:
                    newState = {
                        ...state,
                        ui: {
                            ...state.ui,
                            error: action.payload,
                            loading: false
                        }
                    };
                    break;
                    
                case ActionTypes.UI.CLEAR_ERROR:
                    newState = {
                        ...state,
                        ui: { ...state.ui, error: null }
                    };
                    break;
                    
                case ActionTypes.UI.SET_SUCCESS:
                    newState = {
                        ...state,
                        ui: { ...state.ui, success: action.payload }
                    };
                    break;
                    
                case ActionTypes.UI.CLEAR_SUCCESS:
                    newState = {
                        ...state,
                        ui: { ...state.ui, success: null }
                    };
                    break;
                    
                case ActionTypes.UI.SET_ACTIVE_VIEW:
                    newState = {
                        ...state,
                        ui: { ...state.ui, activeView: action.payload }
                    };
                    break;
                    
                case ActionTypes.UI.TOGGLE_SIDEBAR:
                    newState = {
                        ...state,
                        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
                    };
                    break;
                    
                case ActionTypes.UI.SET_FILTER:
                    newState = {
                        ...state,
                        [action.payload.domain]: {
                            ...state[action.payload.domain],
                            filters: {
                                ...state[action.payload.domain].filters,
                                ...action.payload.filters
                            }
                        }
                    };
                    break;
                    
                // Audit Trail Actions
                case ActionTypes.AUDIT.ADD_ENTRY:
                    const updatedAuditEntries = [
                        action.payload,
                        ...state.audit.entries
                    ].slice(0, FinanceApp.CONFIG.MAX_AUDIT_ENTRIES || 1000);
                    
                    newState = {
                        ...state,
                        audit: {
                            ...state.audit,
                            entries: updatedAuditEntries
                        }
                    };
                    // Persist audit log
                    persistStateChange('audit', updatedAuditEntries);
                    break;
                    
                // Data Management Actions
                case ActionTypes.DATA.IMPORT_ALL:
                    // Validate imported data structure
                    const importedData = action.payload;
                    const validatedState = {
                        ...state,
                        transactions: {
                            ...state.transactions,
                            all: importedData.transactions || [],
                            byId: {}
                        },
                        budgets: {
                            ...state.budgets,
                            all: importedData.budgets || [],
                            byId: {}
                        },
                        bills: {
                            ...state.bills,
                            all: importedData.bills || [],
                            byId: {}
                        },
                        savingsGoals: {
                            ...state.savingsGoals,
                            all: importedData.savingsGoals || [],
                            byId: {}
                        }
                    };
                    
                    // Rebuild indexes
                    validatedState.transactions.all.forEach(t => {
                        validatedState.transactions.byId[t.id] = t;
                    });
                    validatedState.budgets.all.forEach(b => {
                        validatedState.budgets.byId[b.id] = b;
                    });
                    validatedState.bills.all.forEach(b => {
                        validatedState.bills.byId[b.id] = b;
                    });
                    validatedState.savingsGoals.all.forEach(g => {
                        validatedState.savingsGoals.byId[g.id] = g;
                    });
                    
                    newState = validatedState;
                    
                    // Persist all imported data
                    persistStateChange('transactions', newState.transactions.all);
                    persistStateChange('budgets', newState.budgets.all);
                    persistStateChange('bills', newState.bills.all);
                    persistStateChange('savingsGoals', newState.savingsGoals.all);
                    break;
                    
                case ActionTypes.DATA.CLEAR_ALL:
                    if (!action.payload.confirmed) return state;
                    
                    // Preserve auth and settings
                    newState = {
                        ...createInitialState(),
                        auth: state.auth,
                        users: state.users,
                        settings: state.settings
                    };
                    
                    // Clear persisted data
                    persistStateChange('transactions', []);
                    persistStateChange('budgets', []);
                    persistStateChange('bills', []);
                    persistStateChange('savingsGoals', []);
                    persistStateChange('audit', []);
                    break;
                    
                default:
                    // Log unknown actions in development
                    if (FinanceApp.CONFIG.ENVIRONMENT === 'development') {
                        console.warn('Unknown action type:', action.type);
                    }
                    return state;
            }
            
            return newState;
        }
        
        // Create audit entry helper (same as before)
        const createAuditEntry = (action, state) => {
            const skipAudit = [
                ...Object.values(ActionTypes.UI),
                ActionTypes.AUDIT.ADD_ENTRY,
                ActionTypes.AUDIT.SET_ALL
            ];
            
            if (skipAudit.includes(action.type)) {
                return null;
            }
            
            return {
                id: FinanceApp.Utils.generateUUID(),
                timestamp: new Date().toISOString(),
                userId: state.auth.currentUser?.id || 'system',
                username: state.auth.currentUser?.username || 'System',
                action: action.type,
                details: action.payload,
                metadata: {
                    ip: 'Local',
                    userAgent: navigator.userAgent,
                    sessionId: state.auth.sessionId
                }
            };
        };
        
        /**
         * Enhanced Reducer with Audit Trail
         * Wraps the main reducer to automatically create audit entries
         */
        function enhancedReducer(state, action) {
            // Process the action
            const newState = financeReducer(state, action);
            
            // Create audit entry if needed
            if (state.auth.isAuthenticated) {
                const auditEntry = createAuditEntry(action, state);
                if (auditEntry) {
                    // Dispatch audit action asynchronously to avoid infinite loop
                    setTimeout(() => {
                        if (window.FinanceApp.dispatchAudit) {
                            window.FinanceApp.dispatchAudit({
                                type: ActionTypes.AUDIT.ADD_ENTRY,
                                payload: auditEntry
                            });
                        }
                    }, 0);
                }
            }
            
            return newState;
        }
        
        /**
         * Create Context with proper typing
         * Provides type safety when using TypeScript
         */
        const FinanceContext = createContext(null);
        
        /**
         * Context Provider Component
         * Implements Provider Pattern for dependency injection
         * Includes side effects management and performance optimizations
         */
        const FinanceProvider = ({ children }) => {
            // Initialize state with reducer
            const [state, dispatch] = useReducer(enhancedReducer, createInitialState());
            
            // Store dispatch globally for audit trail
            useEffect(() => {
                window.FinanceApp.dispatchAudit = dispatch;
                return () => {
                    delete window.FinanceApp.dispatchAudit;
                };
            }, [dispatch]);
            
            /**
             * Action Creators using Factory Pattern
             * Encapsulate action creation logic with validation and error handling
             */
            const actions = useMemo(() => ({
                // Authentication Actions
                auth: {
                    /**
                     * Login user with credentials
                     * @param {string} username - Username
                     * @param {string} password - Plain text password
                     * @returns {Promise<Object>} Login result
                     */
                    login: async (username, password) => {
                        dispatch({ type: ActionTypes.AUTH.LOGIN_REQUEST });
                        
                        try {
                            // Check if account is locked
                            if (state.auth.isLocked) {
                                const lockoutEnd = new Date(state.auth.lastLoginAttempt);
                                lockoutEnd.setTime(lockoutEnd.getTime() + FinanceApp.CONFIG.LOGIN_LOCKOUT_TIME);
                                
                                if (new Date() < lockoutEnd) {
                                    throw new Error('Account is temporarily locked. Please try again later.');
                                } else {
                                    // Reset lockout
                                    dispatch({ 
                                        type: ActionTypes.AUTH.UPDATE_SESSION, 
                                        payload: { isLocked: false, loginAttempts: 0 } 
                                    });
                                }
                            }
                            
                            // Get users from storage (not state) to ensure fresh data
                            const users = window.FinanceApp.Storage.getItem('users') || [];
                            
                            // Find user
                            const user = users.find(u => u.username === username);
                            
                            if (!user) {
                                throw new Error('Invalid username or password');
                            }
                            
                            // Verify password
                            const isValidPassword = await FinanceApp.Auth.verifyPassword(password, user.password);
                            
                            if (!isValidPassword) {
                                throw new Error('Invalid username or password');
                            }
                            
                            // Check if user is active
                            if (user.isDisabled) {
                                throw new Error('Account is disabled. Please contact an administrator.');
                            }
                            
                            // Create session
                            const sessionExpiry = new Date(Date.now() + FinanceApp.CONFIG.SESSION_TIMEOUT).toISOString();
                            const session = {
                                id: FinanceApp.Utils.generateUUID(),
                                userId: user.id,
                                startTime: Date.now(),
                                lastActivity: Date.now(),
                                expiresAt: sessionExpiry
                            };
                            
                            // Update user's last login
                            const updatedUser = {
                                ...user,
                                lastLogin: new Date().toISOString()
                            };
                            
                            // Update users in storage
                            const updatedUsers = users.map(u => 
                                u.id === user.id ? updatedUser : u
                            );
                            window.FinanceApp.Storage.setItem('users', updatedUsers);
                            
                            // Success
                            dispatch({ 
                                type: ActionTypes.AUTH.LOGIN_SUCCESS, 
                                payload: { user: updatedUser, sessionExpiry, session }
                            });
                            
                            // Log successful login
                            console.log(`User ${username} logged in successfully`);
                            
                            return { success: true, user: updatedUser };
                        } catch (error) {
                            dispatch({ 
                                type: ActionTypes.AUTH.LOGIN_FAILURE, 
                                payload: { error: error.message }
                            });
                            
                            return { success: false, error: error.message };
                        }
                    },
                    
                    /**
                     * Logout current user
                     */
                    logout: () => {
                        dispatch({ type: ActionTypes.AUTH.LOGOUT });
                        FinanceApp.Utils.NotificationManager.show('Logged out successfully', 'info');
                    },
                    
                    /**
                     * Update session expiry
                     */
                    updateSession: () => {
                        if (state.auth.isAuthenticated) {
                            dispatch({ type: ActionTypes.AUTH.UPDATE_SESSION });
                        }
                    }
                },
                
                // User Management Actions
                users: {
                    /**
                     * Create new user
                     * @param {Object} userData - User data
                     * @returns {Promise<Object>} Created user
                     */
                    create: async (userData) => {
                        try {
                            // Validate user data
                            const validation = FinanceApp.Utils.ValidationUtils.validateForm(userData, {
                                username: [
                                    { strategy: 'required' },
                                    { strategy: 'minLength', params: 3 },
                                    { strategy: 'maxLength', params: 50 }
                                ],
                                email: [
                                    { strategy: 'required' },
                                    { strategy: 'email' }
                                ],
                                password: [
                                    { strategy: 'required' }
                                ]
                            });
                            
                            if (!validation.isValid) {
                                throw new Error(Object.values(validation.errors)[0]);
                            }
                            
                            // Validate password
                            const passwordValidation = FinanceApp.Utils.validatePassword(userData.password);
                            if (!passwordValidation.isValid) {
                                throw new Error(passwordValidation.errors[0]);
                            }
                            
                            // Get current users from storage
                            const currentUsers = window.FinanceApp.Storage.getItem('users') || [];
                            
                            // Check if username exists
                            if (currentUsers.some(u => u.username === userData.username)) {
                                throw new Error('Username already exists');
                            }
                            
                            // Hash password
                            const hashedPassword = await FinanceApp.Auth.hashPassword(userData.password);
                            
                            // Create user
                            const newUser = {
                                id: FinanceApp.Utils.generateUUID(),
                                ...userData,
                                password: hashedPassword,
                                role: userData.role || (currentUsers.length === 0 ? 'admin' : 'viewer'),
                                isDisabled: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                lastLogin: null,
                                preferences: {
                                    theme: 'light',
                                    notifications: true,
                                    ...userData.preferences
                                }
                            };
                            
                            dispatch({ 
                                type: ActionTypes.USER.CREATE_SUCCESS, 
                                payload: newUser 
                            });
                            
                            FinanceApp.Utils.NotificationManager.show('User created successfully', 'success');
                            
                            return { success: true, user: newUser };
                        } catch (error) {
                            FinanceApp.Utils.NotificationManager.show(error.message, 'error');
                            return { success: false, error: error.message };
                        }
                    },
                    
                    /**
                     * Update user
                     * @param {Object} userData - Updated user data
                     */
                    update: (userData) => {
                        dispatch({ type: ActionTypes.USER.UPDATE, payload: userData });
                        FinanceApp.Utils.NotificationManager.show('User updated successfully', 'success');
                    },
                    
                    /**
                     * Delete user
                     * @param {string} userId - User ID to delete
                     */
                    delete: (userId) => {
                        // Prevent deleting current user
                        if (userId === state.auth.currentUser?.id) {
                            FinanceApp.Utils.NotificationManager.show('Cannot delete current user', 'error');
                            return;
                        }
                        
                        // Prevent deleting last admin
                        const admins = state.users.all.filter(u => u.role === 'admin');
                        const userToDelete = state.users.byId[userId];
                        if (userToDelete?.role === 'admin' && admins.length === 1) {
                            FinanceApp.Utils.NotificationManager.show('Cannot delete last admin user', 'error');
                            return;
                        }
                        
                        dispatch({ type: ActionTypes.USER.DELETE, payload: userId });
                        FinanceApp.Utils.NotificationManager.show('User deleted successfully', 'success');
                    }
                },
                
                // All other actions remain exactly the same...
                // (I'm truncating here for brevity, but ALL the rest of your actions code remains unchanged)
                
                // Transaction Management Actions
                transactions: {
                    /**
                     * Add new transaction
                     * @param {Object} transaction - Transaction data
                     * @returns {Object} Created transaction
                     */
                    add: (transaction) => {
                        // Validate transaction
                        const validation = FinanceApp.Utils.ValidationUtils.validateForm(transaction, {
                            amount: [
                                { strategy: 'required' },
                                { strategy: 'amount' }
                            ],
                            description: [
                                { strategy: 'required' },
                                { strategy: 'maxLength', params: 200 }
                            ],
                            category: [{ strategy: 'required' }],
                            date: [{ strategy: 'date' }],
                            type: [{ strategy: 'required' }]
                        });
                        
                        if (!validation.isValid) {
                            FinanceApp.Utils.NotificationManager.show(
                                Object.values(validation.errors)[0], 
                                'error'
                            );
                            return null;
                        }
                        
                        const newTransaction = {
                            ...transaction,
                            amount: parseFloat(transaction.amount),
                            date: transaction.date || new Date().toISOString()
                        };
                        
                        dispatch({ type: ActionTypes.TRANSACTION.ADD, payload: newTransaction });
                        FinanceApp.Utils.NotificationManager.show('Transaction added successfully', 'success');
                        
                        // Update budget spent if applicable
                        if (transaction.type === 'expense' && transaction.category) {
                            const budgetId = state.budgets.byCategory[transaction.category];
                            if (budgetId) {
                                actions.budgets.updateSpent(budgetId);
                            }
                        }
                        
                        return newTransaction;
                    },
                    
                    /**
                     * Update transaction
                     * @param {Object} transaction - Updated transaction data
                     */
                    update: (transaction) => {
                        const oldTransaction = state.transactions.byId[transaction.id];
                        
                        dispatch({ type: ActionTypes.TRANSACTION.UPDATE, payload: transaction });
                        FinanceApp.Utils.NotificationManager.show('Transaction updated successfully', 'success');
                        
                        // Update budgets if category or amount changed
                        if (oldTransaction && 
                            (oldTransaction.category !== transaction.category || 
                             oldTransaction.amount !== transaction.amount)) {
                            // Update old category budget
                            const oldBudgetId = state.budgets.byCategory[oldTransaction.category];
                            if (oldBudgetId) {
                                actions.budgets.updateSpent(oldBudgetId);
                            }
                            
                            // Update new category budget
                            const newBudgetId = state.budgets.byCategory[transaction.category];
                            if (newBudgetId) {
                                actions.budgets.updateSpent(newBudgetId);
                            }
                        }
                    },
                    
                    /**
                     * Delete transaction
                     * @param {string} transactionId - Transaction ID to delete
                     */
                    delete: (transactionId) => {
                        const transaction = state.transactions.byId[transactionId];
                        
                        dispatch({ type: ActionTypes.TRANSACTION.DELETE, payload: transactionId });
                        FinanceApp.Utils.NotificationManager.show('Transaction deleted successfully', 'success');
                        
                        // Update budget if it was an expense
                        if (transaction && transaction.type === 'expense') {
                            const budgetId = state.budgets.byCategory[transaction.category];
                            if (budgetId) {
                                actions.budgets.updateSpent(budgetId);
                            }
                        }
                    },
                    
                    /**
                     * Set filters for transaction list
                     * @param {Object} filters - Filter object
                     */
                    setFilters: (filters) => {
                        dispatch({
                            type: ActionTypes.UI.SET_FILTER,
                            payload: { domain: 'transactions', filters }
                        });
                    },
                    
                    /**
                     * Import transactions from file
                     * @param {Array} transactions - Transactions to import
                     */
                    import: async (transactions) => {
                        try {
                            // Validate all transactions
                            const validTransactions = [];
                            const errors = [];
                            
                            for (let i = 0; i < transactions.length; i++) {
                                const transaction = transactions[i];
                                const validation = FinanceApp.Utils.ValidationUtils.validateForm(transaction, {
                                    amount: [{ strategy: 'amount' }],
                                    description: [{ strategy: 'required' }],
                                    category: [{ strategy: 'required' }],
                                    date: [{ strategy: 'date' }],
                                    type: [{ strategy: 'required' }]
                                });
                                
                                if (validation.isValid) {
                                    validTransactions.push({
                                        ...transaction,
                                        id: transaction.id || FinanceApp.Utils.generateUUID(),
                                        amount: parseFloat(transaction.amount)
                                    });
                                } else {
                                    errors.push(`Row ${i + 1}: ${Object.values(validation.errors)[0]}`);
                                }
                            }
                            
                            if (errors.length > 0) {
                                FinanceApp.Utils.NotificationManager.show(
                                    `Import completed with ${errors.length} errors`, 
                                    'warning'
                                );
                                console.error('Import errors:', errors);
                            }
                            
                            if (validTransactions.length > 0) {
                                // Add all valid transactions
                                const allTransactions = [...state.transactions.all, ...validTransactions];
                                dispatch({ 
                                    type: ActionTypes.TRANSACTION.SET_ALL, 
                                    payload: allTransactions 
                                });
                                
                                FinanceApp.Utils.NotificationManager.show(
                                    `Imported ${validTransactions.length} transactions successfully`, 
                                    'success'
                                );
                                
                                // Update all budgets
                                state.budgets.all.forEach(budget => {
                                    actions.budgets.updateSpent(budget.id);
                                });
                            }
                            
                            return { 
                                success: true, 
                                imported: validTransactions.length, 
                                errors: errors.length 
                            };
                        } catch (error) {
                            FinanceApp.Utils.NotificationManager.show(
                                'Import failed: ' + error.message, 
                                'error'
                            );
                            return { success: false, error: error.message };
                        }
                    }
                },
                
                // Budget Management Actions
                budgets: {
                    /**
                     * Add new budget
                     * @param {Object} budget - Budget data
                     * @returns {Object} Created budget
                     */
                    add: (budget) => {
                        // Check if budget already exists for category
                        if (state.budgets.byCategory[budget.category]) {
                            FinanceApp.Utils.NotificationManager.show(
                                'A budget already exists for this category', 
                                'error'
                            );
                            return null;
                        }
                        
                        dispatch({ type: ActionTypes.BUDGET.ADD, payload: budget });
                        FinanceApp.Utils.NotificationManager.show('Budget created successfully', 'success');
                        
                        // Calculate initial spent amount
                        actions.budgets.updateSpent(budget.id);
                        
                        return budget;
                    },
                    
                    /**
                     * Update budget
                     * @param {Object} budget - Updated budget data
                     */
                    update: (budget) => {
                        dispatch({ type: ActionTypes.BUDGET.UPDATE, payload: budget });
                        FinanceApp.Utils.NotificationManager.show('Budget updated successfully', 'success');
                    },
                    
                    /**
                     * Delete budget
                     * @param {string} budgetId - Budget ID to delete
                     */
                    delete: (budgetId) => {
                        dispatch({ type: ActionTypes.BUDGET.DELETE, payload: budgetId });
                        FinanceApp.Utils.NotificationManager.show('Budget deleted successfully', 'success');
                    },
                    
                    /**
                     * Update budget spent amount based on transactions
                     * @param {string} budgetId - Budget ID to update
                     */
                    updateSpent: (budgetId) => {
                        const budget = state.budgets.byId[budgetId];
                        if (!budget) return;
                        
                        // Calculate spent amount from transactions
                        const dateRange = FinanceApp.Utils.DateUtils.getDateRange(budget.period);
                        const spent = state.transactions.all
                            .filter(t => 
                                t.type === 'expense' && 
                                t.category === budget.category &&
                                new Date(t.date) >= dateRange.start &&
                                new Date(t.date) <= dateRange.end
                            )
                            .reduce((sum, t) => sum + t.amount, 0);
                        
                        dispatch({
                            type: ActionTypes.BUDGET.UPDATE_SPENT,
                            payload: { budgetId, amount: spent }
                        });
                        
                        // Check if over budget and send notification
                        if (spent > budget.amount && state.settings.notifications.budgets) {
                            FinanceApp.Utils.NotificationManager.show(
                                `You've exceeded your ${budget.category} budget!`,
                                'warning',
                                5000
                            );
                        }
                    }
                },
                
                // Bill Management Actions
                bills: {
                    /**
                     * Add new bill
                     * @param {Object} bill - Bill data
                     * @returns {Object} Created bill
                     */
                    add: (bill) => {
                        dispatch({ type: ActionTypes.BILL.ADD, payload: bill });
                        FinanceApp.Utils.NotificationManager.show('Bill added successfully', 'success');
                        return bill;
                    },
                    
                    /**
                     * Update bill
                     * @param {Object} bill - Updated bill data
                     */
                    update: (bill) => {
                        dispatch({ type: ActionTypes.BILL.UPDATE, payload: bill });
                        FinanceApp.Utils.NotificationManager.show('Bill updated successfully', 'success');
                    },
                    
                    /**
                     * Delete bill
                     * @param {string} billId - Bill ID to delete
                     */
                    delete: (billId) => {
                        dispatch({ type: ActionTypes.BILL.DELETE, payload: billId });
                        FinanceApp.Utils.NotificationManager.show('Bill deleted successfully', 'success');
                    },
                    
                    /**
                     * Mark bill as paid
                     * @param {string} billId - Bill ID
                     * @param {Object} paymentInfo - Payment information
                     */
                    markPaid: (billId, paymentInfo = {}) => {
                        const bill = state.bills.byId[billId];
                        if (!bill) return;
                        
                        dispatch({
                            type: ActionTypes.BILL.MARK_PAID,
                            payload: {
                                billId,
                                paidDate: paymentInfo.date || new Date().toISOString(),
                                method: paymentInfo.method || 'manual'
                            }
                        });
                        
                        // Automatically create transaction if enabled
                        if (paymentInfo.createTransaction) {
                            actions.transactions.add({
                                type: 'expense',
                                amount: bill.amount,
                                category: 'Bills & Utilities',
                                description: `Bill payment: ${bill.name}`,
                                date: paymentInfo.date || new Date().toISOString(),
                                billId: billId
                            });
                        }
                        
                        FinanceApp.Utils.NotificationManager.show('Bill marked as paid', 'success');
                    }
                },
                
                // Savings Goal Actions
                savings: {
                    /**
                     * Add new savings goal
                     * @param {Object} goal - Goal data
                     * @returns {Object} Created goal
                     */
                    add: (goal) => {
                        dispatch({ type: ActionTypes.SAVINGS.ADD, payload: goal });
                        FinanceApp.Utils.NotificationManager.show('Savings goal created successfully', 'success');
                        return goal;
                    },
                    
                    /**
                     * Update savings goal
                     * @param {Object} goal - Updated goal data
                     */
                    update: (goal) => {
                        dispatch({ type: ActionTypes.SAVINGS.UPDATE, payload: goal });
                        FinanceApp.Utils.NotificationManager.show('Savings goal updated successfully', 'success');
                    },
                    
                    /**
                     * Delete savings goal
                     * @param {string} goalId - Goal ID to delete
                     */
                    delete: (goalId) => {
                        dispatch({ type: ActionTypes.SAVINGS.DELETE, payload: goalId });
                        FinanceApp.Utils.NotificationManager.show('Savings goal deleted successfully', 'success');
                    },
                    
                    /**
                     * Add contribution to savings goal
                     * @param {string} goalId - Goal ID
                     * @param {number} amount - Contribution amount
                     * @param {string} note - Optional note
                     */
                    contribute: (goalId, amount, note = '') => {
                        const goal = state.savingsGoals.byId[goalId];
                        if (!goal) return;
                        
                        dispatch({
                            type: ActionTypes.SAVINGS.ADD_CONTRIBUTION,
                            payload: { goalId, amount, note }
                        });
                        
                        // Check if goal is completed
                        const newAmount = goal.currentAmount + amount;
                        if (newAmount >= goal.targetAmount && state.settings.notifications.goals) {
                            FinanceApp.Utils.NotificationManager.show(
                                `Congratulations! You've reached your "${goal.name}" savings goal!`,
                                'success',
                                10000
                            );
                        }
                        
                        FinanceApp.Utils.NotificationManager.show('Contribution added successfully', 'success');
                    }
                },
                
                // Settings Actions
                settings: {
                    /**
                     * Update settings
                     * @param {Object} settings - Settings to update
                     */
                    update: (settings) => {
                        dispatch({ type: ActionTypes.SETTINGS.UPDATE, payload: settings });
                        FinanceApp.Utils.NotificationManager.show('Settings updated successfully', 'success');
                    },
                    
                    /**
                     * Reset settings to defaults
                     */
                    reset: () => {
                        FinanceApp.Utils.NotificationManager.confirm(
                            'Are you sure you want to reset all settings to defaults?',
                            () => {
                                dispatch({ type: ActionTypes.SETTINGS.RESET });
                                FinanceApp.Utils.NotificationManager.show('Settings reset to defaults', 'success');
                            }
                        );
                    }
                },
                
                // UI Actions
                ui: {
                    /**
                     * Set loading state
                     * @param {boolean} loading - Loading state
                     * @param {string} message - Optional loading message
                     */
                    setLoading: (loading, message = '') => {
                        dispatch({
                            type: ActionTypes.UI.SET_LOADING,
                            payload: { loading, message }
                        });
                    },
                    
                    /**
                     * Set active view
                     * @param {string} view - View name
                     */
                    setActiveView: (view) => {
                        dispatch({ type: ActionTypes.UI.SET_ACTIVE_VIEW, payload: view });
                    },
                    
                    /**
                     * Toggle sidebar
                     */
                    toggleSidebar: () => {
                        dispatch({ type: ActionTypes.UI.TOGGLE_SIDEBAR });
                    }
                },
                
                // Data Management Actions
                data: {
                    /**
                     * Export all data
                     * @returns {Object} Export result
                     */
                    export: () => {
                        try {
                            const exportData = {
                                version: FinanceApp.CONFIG.APP_VERSION,
                                exportDate: new Date().toISOString(),
                                data: {
                                    users: state.users.all.map(u => ({
                                        ...u,
                                        password: undefined // Don't export passwords
                                    })),
                                    transactions: state.transactions.all,
                                    budgets: state.budgets.all,
                                    bills: state.bills.all,
                                    savingsGoals: state.savingsGoals.all,
                                    settings: state.settings,
                                    audit: state.audit.entries
                                }
                            };
                            
                            const filename = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
                            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename;
                            a.click();
                            URL.revokeObjectURL(url);
                            
                            FinanceApp.Utils.NotificationManager.show('Data exported successfully', 'success');
                            
                            return { success: true };
                        } catch (error) {
                            FinanceApp.Utils.NotificationManager.show('Export failed: ' + error.message, 'error');
                            return { success: false, error: error.message };
                        }
                    },
                    
                    /**
                     * Import data from file
                     * @param {File} file - File to import
                     * @returns {Promise<Object>} Import result
                     */
                    import: async (file) => {
                        try {
                            dispatch({ type: ActionTypes.UI.SET_LOADING, payload: { loading: true, message: 'Importing data...' } });
                            
                            const text = await file.text();
                            const importData = JSON.parse(text);
                            
                            // Validate version compatibility
                            if (importData.version && importData.version.split('.')[0] !== FinanceApp.CONFIG.APP_VERSION.split('.')[0]) {
                                throw new Error('Incompatible data version');
                            }
                            
                            dispatch({
                                type: ActionTypes.DATA.IMPORT_ALL,
                                payload: importData.data
                            });
                            
                            dispatch({ type: ActionTypes.UI.SET_LOADING, payload: { loading: false } });
                            FinanceApp.Utils.NotificationManager.show('Data imported successfully', 'success');
                            
                            return { success: true };
                        } catch (error) {
                            dispatch({ type: ActionTypes.UI.SET_LOADING, payload: { loading: false } });
                            FinanceApp.Utils.NotificationManager.show('Import failed: ' + error.message, 'error');
                            return { success: false, error: error.message };
                        }
                    },
                    
                    /**
                     * Clear all data
                     */
                    clearAll: () => {
                        FinanceApp.Utils.NotificationManager.confirm(
                            'Are you sure you want to clear all data? This cannot be undone.',
                            () => {
                                dispatch({
                                    type: ActionTypes.DATA.CLEAR_ALL,
                                    payload: { confirmed: true }
                                });
                                FinanceApp.Utils.NotificationManager.show('All data cleared', 'warning');
                            }
                        );
                    }
                }
            }), [state]); // Include state in dependencies for actions that need current state
            
            /**
             * Session Management Effect
             * Monitors session expiry and handles automatic logout
             */
            useEffect(() => {
                if (!state.auth.isAuthenticated || !state.auth.sessionExpiry) return;
                
                const checkSession = () => {
                    const now = new Date();
                    const expiry = new Date(state.auth.sessionExpiry);
                    const warningTime = new Date(expiry.getTime() - FinanceApp.CONFIG.INACTIVITY_WARNING);
                    
                    if (now >= expiry) {
                        actions.auth.logout();
                        FinanceApp.Utils.NotificationManager.show('Session expired. Please login again.', 'warning');
                    } else if (now >= warningTime && now < expiry) {
                        const remainingMinutes = Math.ceil((expiry - now) / 60000);
                        FinanceApp.Utils.NotificationManager.show(
                            `Your session will expire in ${remainingMinutes} minutes`,
                            'warning',
                            10000
                        );
                    }
                };
                
                const interval = setInterval(checkSession, 60000); // Check every minute
                checkSession(); // Initial check
                
                return () => clearInterval(interval);
            }, [state.auth.isAuthenticated, state.auth.sessionExpiry]);
            
            /**
             * Auto-save Effect
             * Periodically saves state to browser storage
             */
            useEffect(() => {
                if (!state.auth.isAuthenticated) return;
                
                const saveState = FinanceApp.Utils.PerformanceUtils.debounce(() => {
                    try {
                        // Auto-save is now handled by the reducer on each state change
                        console.log('Auto-save check triggered');
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                    }
                }, 5000); // Save after 5 seconds of inactivity
                
                // Trigger save on state changes
                saveState();
            }, [state]);
            
            /**
             * Performance Monitoring Effect
             * Logs render performance in development
             */
            useEffect(() => {
                if (FinanceApp.CONFIG.ENVIRONMENT === 'development') {
                    console.log('FinanceProvider rendered');
                }
            });
            
            /**
             * Context Value
             * Memoized to prevent unnecessary re-renders
             */
            const contextValue = useMemo(() => ({
                state,
                dispatch,
                actions,
                selectors: StateSelectors
            }), [state, actions]);
            
            return React.createElement(
                FinanceContext.Provider,
                { value: contextValue },
                children
            );
        };
        
        /**
         * Custom Hook for Using Finance Context
         * Provides type safety and error handling
         */
        const useFinance = () => {
            const context = useContext(FinanceContext);
            
            if (!context) {
                throw new Error(
                    'useFinance must be used within a FinanceProvider. ' +
                    'Make sure your component is wrapped with <FinanceProvider>.'
                );
            }
            
            return context;
        };
        
        /**
         * Higher Order Component for Auth Protection
         * Implements Decorator Pattern for component enhancement
         */
        const withAuth = (Component, options = {}) => {
            const { requiredRole, redirectTo = '/login' } = options;
            
            return function AuthenticatedComponent(props) {
                const { state } = useFinance();
                
                if (!state.auth.isAuthenticated) {
                    // In a real app, this would redirect to login
                    return null;
                }
                
                if (requiredRole && !StateSelectors.hasRole(state, requiredRole)) {
                    return React.createElement('div', {
                        className: 'p-8 text-center'
                    }, 
                        React.createElement('h2', {
                            className: 'text-2xl font-bold text-red-600 mb-2'
                        }, 'Access Denied'),
                        React.createElement('p', null, 
                            `You need ${requiredRole} privileges to access this feature.`
                        )
                    );
                }
                
                return React.createElement(Component, props);
            };
        };
        
        /**
         * Export to Global FinanceApp Object
         * Makes state management available throughout the application
         */
        Object.assign(window.FinanceApp, {
            // Action types for external use
            ActionTypes,
            
            // Context and Provider
            FinanceContext,
            FinanceProvider,
            
            // Hooks
            useFinance,
            
            // HOCs
            withAuth,
            
            // Selectors
            StateSelectors,
            
            // Initial state factory
            createInitialState
        });
        
        /**
         * Log successful initialization
         */
        console.log('FinanceApp State Management loaded successfully');
        console.log('Design Patterns: Redux, Command, Observer, Memento, Factory, Strategy');
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeStateManagement);
    } else {
        initializeStateManagement();
    }
})();