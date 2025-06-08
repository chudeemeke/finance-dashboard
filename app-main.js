/**
 * Family Finance Dashboard v3.1.0
 * Main App Integration
 * 
 * This file integrates all components and initializes the application.
 * It implements:
 * - App initialization and bootstrapping
 * - Route management and navigation
 * - Component integration
 * - Error boundaries and fallbacks
 * - Performance monitoring
 * 
 * Design Patterns Used:
 * - Facade Pattern: Simplified interface to complex subsystems
 * - Mediator Pattern: Centralized communication between components
 * - Chain of Responsibility: Error handling chain
 * - Template Method: App initialization sequence
 */

(function() {
  'use strict';
  
  // Temporary icon fix
	if (!window.lucide) {
		window.lucide = {
			Loader2: () => React.createElement('div', { 
				className: 'loading-spinner'
			}),
			Home: () => React.createElement('span', null, '🏠'),
			User: () => React.createElement('span', null, '👤'),
			LogOut: () => React.createElement('span', null, '🚪'),
			Settings: () => React.createElement('span', null, '⚙️'),
			Menu: () => React.createElement('span', null, '☰'),
			X: () => React.createElement('span', null, '✕')
		};
	}

  const { React, ReactDOM } = window;
  const { createElement: h, useState, useEffect, useCallback, Suspense, lazy } = React;

  // Get all app modules
  const {
    CONFIG,
    Utils,
    useFinance,
    StateSelectors,
    AuthComponents,
    MainComponents,
    FinanceComponents
  } = window.FinanceApp;

  const { NotificationManager, PerformanceUtils } = Utils;

  /**
   * Error Boundary Component
   * Implements Chain of Responsibility pattern for error handling
   */
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
      
      // Log error to monitoring service
      if (CONFIG.ENABLE_ERROR_TRACKING) {
        this.logErrorToService(error, errorInfo);
      }

      this.setState({
        error,
        errorInfo
      });
    }

    logErrorToService(error, errorInfo) {
      // In production, this would send to error tracking service
      const errorData = {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Error logged:', errorData);
    }

    render() {
      if (this.state.hasError) {
        return h('div', { 
          className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4' 
        },
          h('div', { className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-6' },
            h('div', { className: 'flex items-center space-x-3 mb-4' },
              h('div', { className: 'p-3 bg-red-100 text-red-600 rounded-full' },
                h(window.lucideReact.AlertTriangle, { size: 24 })
              ),
              h('h2', { className: 'text-xl font-bold text-gray-900' }, 
                'Oops! Something went wrong'
              )
            ),
            h('p', { className: 'text-gray-600 mb-4' }, 
              'We encountered an unexpected error. Please try refreshing the page.'
            ),
            CONFIG.IS_DEVELOPMENT && this.state.error && h('details', { 
              className: 'mb-4' 
            },
              h('summary', { className: 'cursor-pointer text-sm text-gray-500' }, 
                'Error details'
              ),
              h('pre', { 
                className: 'mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto' 
              }, 
                this.state.error.toString() + '\n' + this.state.errorInfo.componentStack
              )
            ),
            h('div', { className: 'flex space-x-3' },
              h('button', {
                onClick: () => window.location.reload(),
                className: `
                  flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 transition-colors
                `
              }, 'Refresh Page'),
              h('button', {
                onClick: () => this.setState({ hasError: false }),
                className: `
                  flex-1 px-4 py-2 border border-gray-300 rounded-lg
                  hover:bg-gray-50 transition-colors
                `
              }, 'Try Again')
            )
          )
        );
      }

      return this.props.children;
    }
  }

  /**
   * App Router Component
   * Implements Strategy pattern for route handling
   */
  const AppRouter = () => {
    const { state, actions } = useFinance();
    const [currentRoute, setCurrentRoute] = useState(window.location.hash.slice(1) || 'dashboard');

    useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash.slice(1);
        setCurrentRoute(hash || 'dashboard');
        actions.ui.setActiveView(hash || 'dashboard');
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Route configuration using Strategy pattern
    const routes = {
      'dashboard': {
        component: MainComponents.Dashboard,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'transactions': {
        component: FinanceComponents.TransactionList,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'transactions/add': {
        component: () => h('div', { className: 'p-6' },
          h('h2', { className: 'text-2xl font-bold mb-6' }, 'Add Transaction'),
          h(FinanceComponents.TransactionForm)
        ),
        requiresAuth: true,
        minRole: 'editor'
      },
      'budgets': {
        component: FinanceComponents.BudgetManager,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'expenses': {
        component: FinanceComponents.ExpenseTracker,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'income': {
        component: FinanceComponents.IncomeManager,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'bills': {
        component: FinanceComponents.BillTracker,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'savings': {
        component: FinanceComponents.SavingsGoals,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'reports': {
        component: FinanceComponents.FinancialReports,
        requiresAuth: true,
        minRole: 'viewer'
      },
      'settings': {
        component: SettingsPage,
        requiresAuth: true,
        minRole: 'admin'
      }
    };

    const route = routes[currentRoute] || routes['dashboard'];
    
    // Check authentication and authorization
    if (route.requiresAuth && !state.auth.isAuthenticated) {
      return h(AuthComponents.LoginForm);
    }

    if (route.minRole && !hasRequiredRole(state.auth.currentUser, route.minRole)) {
      return h(UnauthorizedPage);
    }

    return h(route.component);
  };

  /**
   * Settings Page Component
   */
  const SettingsPage = () => {
    const { state, actions } = useFinance();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(state.ui.preferences || {});

    const handleSaveSettings = () => {
      actions.ui.updatePreferences(settings);
      NotificationManager.success('Settings saved successfully');
    };

    const tabs = [
      { id: 'general', label: 'General', icon: window.lucideReact.Settings },
      { id: 'notifications', label: 'Notifications', icon: window.lucideReact.Bell },
      { id: 'security', label: 'Security', icon: window.lucideReact.Shield },
      { id: 'data', label: 'Data & Privacy', icon: window.lucideReact.Database },
      { id: 'advanced', label: 'Advanced', icon: window.lucideReact.Wrench }
    ];

    return h('div', { className: 'p-6' },
      h('div', { className: 'max-w-4xl mx-auto' },
        h('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'Settings'),
        
        // Tab Navigation
        h('div', { className: 'flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg' },
          tabs.map(tab => 
            h('button', {
              key: tab.id,
              onClick: () => setActiveTab(tab.id),
              className: `
                flex items-center space-x-2 px-4 py-2 rounded-md transition-all
                ${activeTab === tab.id 
                  ? 'bg-white shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `
            },
              h(tab.icon, { size: 16 }),
              h('span', {}, tab.label)
            )
          )
        ),

        // Settings Content
        h('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
          // General Settings
          activeTab === 'general' && h('div', { className: 'space-y-6' },
            h('div', {},
              h('h3', { className: 'text-lg font-semibold mb-4' }, 'General Settings'),
              
              // Currency
              h('div', { className: 'mb-4' },
                h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Currency'
                ),
                h('select', {
                  value: settings.currency || 'USD',
                  onChange: (e) => setSettings({ ...settings, currency: e.target.value }),
                  className: `
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `
                },
                  h('option', { value: 'USD' }, 'USD - US Dollar'),
                  h('option', { value: 'EUR' }, 'EUR - Euro'),
                  h('option', { value: 'GBP' }, 'GBP - British Pound'),
                  h('option', { value: 'JPY' }, 'JPY - Japanese Yen')
                )
              ),

              // Date Format
              h('div', { className: 'mb-4' },
                h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Date Format'
                ),
                h('select', {
                  value: settings.dateFormat || 'MM/DD/YYYY',
                  onChange: (e) => setSettings({ ...settings, dateFormat: e.target.value }),
                  className: `
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `
                },
                  h('option', { value: 'MM/DD/YYYY' }, 'MM/DD/YYYY'),
                  h('option', { value: 'DD/MM/YYYY' }, 'DD/MM/YYYY'),
                  h('option', { value: 'YYYY-MM-DD' }, 'YYYY-MM-DD')
                )
              ),

              // Theme
              h('div', {},
                h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Theme'
                ),
                h('div', { className: 'flex space-x-4' },
                  ['light', 'dark', 'auto'].map(theme => 
                    h('label', {
                      key: theme,
                      className: 'flex items-center space-x-2 cursor-pointer'
                    },
                      h('input', {
                        type: 'radio',
                        name: 'theme',
                        value: theme,
                        checked: (settings.theme || 'light') === theme,
                        onChange: (e) => setSettings({ ...settings, theme: e.target.value }),
                        className: 'text-blue-600'
                      }),
                      h('span', { className: 'text-sm text-gray-700 capitalize' }, theme)
                    )
                  )
                )
              )
            )
          ),

          // Notifications Settings
          activeTab === 'notifications' && h('div', { className: 'space-y-6' },
            h('h3', { className: 'text-lg font-semibold mb-4' }, 'Notification Settings'),
            
            [
              { id: 'billReminders', label: 'Bill payment reminders' },
              { id: 'budgetAlerts', label: 'Budget limit alerts' },
              { id: 'savingsUpdates', label: 'Savings goal updates' },
              { id: 'weeklyReports', label: 'Weekly summary reports' },
              { id: 'monthlyReports', label: 'Monthly financial reports' }
            ].map(item => 
              h('label', {
                key: item.id,
                className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer'
              },
                h('span', { className: 'text-gray-700' }, item.label),
                h('input', {
                  type: 'checkbox',
                  checked: settings.notifications?.[item.id] ?? true,
                  onChange: (e) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [item.id]: e.target.checked
                    }
                  }),
                  className: 'rounded border-gray-300 text-blue-600'
                })
              )
            )
          ),

          // Security Settings
          activeTab === 'security' && h('div', { className: 'space-y-6' },
            h('h3', { className: 'text-lg font-semibold mb-4' }, 'Security Settings'),
            
            h('div', { className: 'space-y-4' },
              h('div', {},
                h('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Change Password'),
                h('button', {
                  className: `
                    px-4 py-2 border border-gray-300 rounded-lg
                    hover:bg-gray-50 transition-colors
                  `
                }, 'Update Password')
              ),

              h('div', {},
                h('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Two-Factor Authentication'),
                h('p', { className: 'text-sm text-gray-600 mb-3' }, 
                  'Add an extra layer of security to your account'
                ),
                h('button', {
                  className: `
                    px-4 py-2 bg-blue-600 text-white rounded-lg
                    hover:bg-blue-700 transition-colors
                  `
                }, 'Enable 2FA')
              ),

              h('div', {},
                h('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Active Sessions'),
                h('p', { className: 'text-sm text-gray-600 mb-3' }, 
                  'Manage devices where you are currently logged in'
                ),
                h('button', {
                  className: `
                    px-4 py-2 border border-red-300 text-red-600 rounded-lg
                    hover:bg-red-50 transition-colors
                  `
                }, 'View Sessions')
              )
            )
          ),

          // Data & Privacy Settings
          activeTab === 'data' && h('div', { className: 'space-y-6' },
            h('h3', { className: 'text-lg font-semibold mb-4' }, 'Data & Privacy'),
            
            h('div', { className: 'space-y-4' },
              h('div', { className: 'p-4 bg-blue-50 rounded-lg' },
                h('h4', { className: 'font-medium text-blue-900 mb-2' }, 'Data Export'),
                h('p', { className: 'text-sm text-blue-700 mb-3' }, 
                  'Download all your financial data in CSV or JSON format'
                ),
                h('div', { className: 'flex space-x-3' },
                  h('button', {
                    className: `
                      px-4 py-2 bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors
                    `
                  }, 'Export as CSV'),
                  h('button', {
                    className: `
                      px-4 py-2 border border-blue-600 text-blue-600 rounded-lg
                      hover:bg-blue-50 transition-colors
                    `
                  }, 'Export as JSON')
                )
              ),

              h('div', { className: 'p-4 bg-red-50 rounded-lg' },
                h('h4', { className: 'font-medium text-red-900 mb-2' }, 'Delete Account'),
                h('p', { className: 'text-sm text-red-700 mb-3' }, 
                  'Permanently delete your account and all associated data. This action cannot be undone.'
                ),
                h('button', {
                  className: `
                    px-4 py-2 bg-red-600 text-white rounded-lg
                    hover:bg-red-700 transition-colors
                  `
                }, 'Delete Account')
              )
            )
          ),

          // Advanced Settings
          activeTab === 'advanced' && h('div', { className: 'space-y-6' },
            h('h3', { className: 'text-lg font-semibold mb-4' }, 'Advanced Settings'),
            
            h('div', { className: 'space-y-4' },
              h('label', { className: 'flex items-center justify-between' },
                h('div', {},
                  h('span', { className: 'font-medium text-gray-900' }, 'Developer Mode'),
                  h('p', { className: 'text-sm text-gray-500' }, 
                    'Show advanced options and debugging information'
                  )
                ),
                h('input', {
                  type: 'checkbox',
                  checked: settings.developerMode || false,
                  onChange: (e) => setSettings({ ...settings, developerMode: e.target.checked }),
                  className: 'rounded border-gray-300 text-blue-600'
                })
              ),

              h('label', { className: 'flex items-center justify-between' },
                h('div', {},
                  h('span', { className: 'font-medium text-gray-900' }, 'Performance Mode'),
                  h('p', { className: 'text-sm text-gray-500' }, 
                    'Optimize for performance on slower devices'
                  )
                ),
                h('input', {
                  type: 'checkbox',
                  checked: settings.performanceMode || false,
                  onChange: (e) => setSettings({ ...settings, performanceMode: e.target.checked }),
                  className: 'rounded border-gray-300 text-blue-600'
                })
              ),

              h('div', {},
                h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Data Retention'
                ),
                h('select', {
                  value: settings.dataRetention || '1year',
                  onChange: (e) => setSettings({ ...settings, dataRetention: e.target.value }),
                  className: `
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `
                },
                  h('option', { value: '6months' }, '6 Months'),
                  h('option', { value: '1year' }, '1 Year'),
                  h('option', { value: '2years' }, '2 Years'),
                  h('option', { value: 'forever' }, 'Forever')
                )
              )
            )
          ),

          // Save Button
          h('div', { className: 'flex justify-end pt-6 mt-6 border-t border-gray-200' },
            h('button', {
              onClick: handleSaveSettings,
              className: `
                px-6 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            }, 'Save Changes')
          )
        )
      )
    );
  };

  /**
   * Unauthorized Page Component
   */
  const UnauthorizedPage = () => {
    return h('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4' },
      h('div', { className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center' },
        h('div', { className: 'mb-4' },
          h(window.lucideReact.ShieldX, { 
            size: 64, 
            className: 'mx-auto text-red-500' 
          })
        ),
        h('h2', { className: 'text-2xl font-bold text-gray-900 mb-2' }, 
          'Access Denied'
        ),
        h('p', { className: 'text-gray-600 mb-6' }, 
          'You do not have permission to access this page.'
        ),
        h('button', {
          onClick: () => window.location.hash = '#dashboard',
          className: `
            px-6 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors
          `
        }, 'Go to Dashboard')
      )
    );
  };

  /**
   * Loading Component
   */
  const LoadingScreen = () => {
  return h('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center' },
    h('div', { className: 'text-center' },
      h('div', { className: 'loading-spinner mx-auto mb-4' }),
      h('p', { className: 'text-gray-600' }, 'Loading Finance Dashboard...')
    )
  );
};

  /**
   * Role checking utility
   */
  const hasRequiredRole = (user, requiredRole) => {
    const roleHierarchy = {
      viewer: 0,
      editor: 1,
      admin: 2
    };

    return user && roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  /**
   * Main App Component
   * Implements Facade pattern for simplified interface
   */
  const App = () => {
    const { state } = useFinance();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      // App initialization sequence (Template Method pattern)
      const initializeApp = async () => {
        try {
          // 1. Check browser compatibility
          checkBrowserCompatibility();

          // 2. Load saved preferences
          try {
				loadUserPreferences();
			} catch (e) {
				console.warn('Could not load preferences:', e);
			}

          // 3. Initialize performance monitoring
          if (CONFIG.ENABLE_PERFORMANCE_MONITORING) {
            initializePerformanceMonitoring();
          }

          // 4. Setup service worker (if available)
          if ('serviceWorker' in navigator && CONFIG.ENABLE_OFFLINE_MODE) {
            await setupServiceWorker();
          }

          // 5. Check for updates
          checkForUpdates();

          setIsInitialized(true);
        } catch (error) {
          console.error('App initialization failed:', error);
          window.FinanceApp.Utils.NotificationManager.show('Failed to initialize app', 'error');
        }
      };

      initializeApp();
    }, []);

    // Browser compatibility check
    const checkBrowserCompatibility = () => {
      const requiredFeatures = [
        'localStorage',
        'sessionStorage',
        'Promise',
        'fetch',
        'IntersectionObserver'
      ];

      const unsupportedFeatures = requiredFeatures.filter(feature => 
        !(feature in window)
      );

      if (unsupportedFeatures.length > 0) {
        throw new Error(`Browser missing required features: ${unsupportedFeatures.join(', ')}`);
      }
    };

    // Load user preferences
    const loadUserPreferences = () => {
      const savedPreferences = window.FinanceApp.Storage.getItem('userPreferences');
      if (savedPreferences) {
        // Apply saved preferences
        console.log('Loaded user preferences:', savedPreferences);
      }
    };

    // Initialize performance monitoring
    const initializePerformanceMonitoring = () => {
      PerformanceUtils.startMonitoring();
      
      // Log performance metrics periodically
      setInterval(() => {
        const metrics = PerformanceUtils.getMetrics();
        console.log('Performance metrics:', metrics);
      }, CONFIG.PERFORMANCE_LOG_INTERVAL);
    };

    // Setup service worker
    const setupServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    };

    // Check for updates
    const checkForUpdates = () => {
      // In production, this would check for app updates
      console.log('Checking for updates...');
    };

    if (!isInitialized) {
      return h(LoadingScreen);
    }

    // Main app layout
    if (!state.auth.isAuthenticated) {
      return h(ErrorBoundary, {},
        h('div', { className: 'min-h-screen bg-gray-50' },
          h(AuthComponents.LoginForm)
        )
      );
    }

    return h(ErrorBoundary, {},
      h(MainComponents.MainLayout, {},
        h(Suspense, { fallback: h(LoadingScreen) },
          h(AppRouter)
        )
      )
    );
  };

  /**
   * Initialize and mount the app
   * Implements the Module pattern for encapsulation
   */
  const initializeFinanceApp = () => {
    // Create root element if it doesn't exist
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }

    // Create React root and render app
    const reactRoot = ReactDOM.createRoot(root);
    
    // Wrap app with providers
    reactRoot.render(
      h(window.FinanceApp.FinanceProvider, {},
        h(App)
      )
    );

    // Log successful initialization
    console.log('Finance Dashboard v3.1.0 initialized successfully');
    
    // Expose app instance for debugging in development
    if (CONFIG.IS_DEVELOPMENT) {
      window.__financeApp = {
        version: '3.1.0',
        config: CONFIG,
        utils: Utils,
        components: {
          auth: AuthComponents,
          main: MainComponents,
          finance: FinanceComponents
        },
        getState: () => window.FinanceApp._store?.getState(),
        dispatch: (action) => window.FinanceApp._store?.dispatch(action)
      };
    }
  };

  // Export main app functions
  window.FinanceApp = window.FinanceApp || {};
  window.FinanceApp.App = App;
  window.FinanceApp.initialize = initializeFinanceApp;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFinanceApp);
  } else {
    initializeFinanceApp();
  }

})();