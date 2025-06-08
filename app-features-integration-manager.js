/**
 * Family Finance Dashboard v3.1.0
 * Phase 3 Feature Integration & Management
 * 
 * Integrates all Phase 3 features with the main application,
 * provides feature management, performance optimizations,
 * and comprehensive error handling using design patterns
 */

(function(window) {
  'use strict';

  const { React, ReactDOM } = window;
  const { Utils, ActionTypes, useFinance, CONFIG } = window.FinanceApp;

  // Feature Registry Pattern - Manages all Phase 3 features
  const FeatureRegistry = (() => {
    const features = new Map();
    const dependencies = new Map();
    const loadOrder = [];
    
    class Feature {
      constructor(id, config) {
        this.id = id;
        this.name = config.name;
        this.description = config.description;
        this.version = config.version;
        this.dependencies = config.dependencies || [];
        this.enabled = config.enabled !== false;
        this.loaded = false;
        this.instance = null;
        this.config = config;
        this.hooks = {
          beforeLoad: config.beforeLoad || (() => {}),
          afterLoad: config.afterLoad || (() => {}),
          beforeUnload: config.beforeUnload || (() => {}),
          afterUnload: config.afterUnload || (() => {})
        };
      }

      async load() {
        if (this.loaded) return this.instance;
        
        try {
          await this.hooks.beforeLoad();
          
          // Check dependencies
          for (const dep of this.dependencies) {
            const depFeature = features.get(dep);
            if (!depFeature || !depFeature.loaded) {
              throw new Error(`Dependency ${dep} not loaded for ${this.id}`);
            }
          }
          
          // Load feature module
          this.instance = await this.config.loader();
          this.loaded = true;
          
          await this.hooks.afterLoad();
          
          console.log(`Feature ${this.id} loaded successfully`);
          return this.instance;
        } catch (error) {
          console.error(`Failed to load feature ${this.id}:`, error);
          throw error;
        }
      }

      async unload() {
        if (!this.loaded) return;
        
        try {
          await this.hooks.beforeUnload();
          
          if (this.instance && typeof this.instance.cleanup === 'function') {
            await this.instance.cleanup();
          }
          
          this.instance = null;
          this.loaded = false;
          
          await this.hooks.afterUnload();
          
          console.log(`Feature ${this.id} unloaded successfully`);
        } catch (error) {
          console.error(`Failed to unload feature ${this.id}:`, error);
        }
      }

      toggle(enabled) {
        this.enabled = enabled;
        if (!enabled && this.loaded) {
          this.unload();
        }
      }
    }

    return {
      // Register a feature
      register: (id, config) => {
        const feature = new Feature(id, config);
        features.set(id, feature);
        dependencies.set(id, config.dependencies || []);
        
        // Update load order based on dependencies
        FeatureRegistry.updateLoadOrder();
        
        return feature;
      },

      // Update load order using topological sort
      updateLoadOrder: () => {
        const visited = new Set();
        const visiting = new Set();
        const order = [];

        const visit = (id) => {
          if (visited.has(id)) return;
          if (visiting.has(id)) {
            throw new Error(`Circular dependency detected involving ${id}`);
          }

          visiting.add(id);
          
          const deps = dependencies.get(id) || [];
          for (const dep of deps) {
            visit(dep);
          }
          
          visiting.delete(id);
          visited.add(id);
          order.push(id);
        };

        try {
          for (const id of features.keys()) {
            visit(id);
          }
          loadOrder.length = 0;
          loadOrder.push(...order);
        } catch (error) {
          console.error('Failed to update load order:', error);
        }
      },

      // Load all enabled features
      loadAll: async () => {
        const loaded = [];
        
        for (const id of loadOrder) {
          const feature = features.get(id);
          if (feature && feature.enabled) {
            try {
              await feature.load();
              loaded.push(id);
            } catch (error) {
              console.error(`Failed to load feature ${id}:`, error);
              // Continue loading other features
            }
          }
        }
        
        return loaded;
      },

      // Get feature by ID
      get: (id) => features.get(id),

      // Get all features
      getAll: () => Array.from(features.values()),

      // Check if feature is loaded
      isLoaded: (id) => {
        const feature = features.get(id);
        return feature && feature.loaded;
      },

      // Get feature instance
      getInstance: (id) => {
        const feature = features.get(id);
        return feature && feature.loaded ? feature.instance : null;
      }
    };
  })();

  // Performance Monitor with Observer Pattern
  const PerformanceOptimizer = (() => {
    const observers = [];
    const metrics = new Map();
    const thresholds = {
      renderTime: 16, // 60fps
      apiLatency: 1000,
      memoryUsage: 0.8 // 80% of available
    };

    class PerformanceMetric {
      constructor(name, type = 'time') {
        this.name = name;
        this.type = type;
        this.samples = [];
        this.maxSamples = 100;
      }

      record(value) {
        this.samples.push({
          value,
          timestamp: performance.now()
        });

        if (this.samples.length > this.maxSamples) {
          this.samples.shift();
        }

        // Check thresholds
        if (this.type === 'time' && value > thresholds.renderTime) {
          PerformanceOptimizer.notify('performance-warning', {
            metric: this.name,
            value,
            threshold: thresholds.renderTime
          });
        }
      }

      getAverage() {
        if (this.samples.length === 0) return 0;
        const sum = this.samples.reduce((acc, s) => acc + s.value, 0);
        return sum / this.samples.length;
      }

      getPercentile(p) {
        if (this.samples.length === 0) return 0;
        const sorted = [...this.samples].sort((a, b) => a.value - b.value);
        const index = Math.floor((p / 100) * sorted.length);
        return sorted[index].value;
      }
    }

    // Resource pool for object reuse
    class ResourcePool {
      constructor(factory, reset, maxSize = 100) {
        this.factory = factory;
        this.reset = reset;
        this.maxSize = maxSize;
        this.available = [];
        this.inUse = new Set();
      }

      acquire() {
        let resource;
        
        if (this.available.length > 0) {
          resource = this.available.pop();
        } else {
          resource = this.factory();
        }
        
        this.inUse.add(resource);
        return resource;
      }

      release(resource) {
        if (!this.inUse.has(resource)) return;
        
        this.inUse.delete(resource);
        this.reset(resource);
        
        if (this.available.length < this.maxSize) {
          this.available.push(resource);
        }
      }
    }

    return {
      // Subscribe to performance events
      subscribe: (callback) => {
        observers.push(callback);
        return () => {
          const index = observers.indexOf(callback);
          if (index > -1) observers.splice(index, 1);
        };
      },

      // Notify observers
      notify: (type, data) => {
        observers.forEach(callback => callback(type, data));
      },

      // Record metric
      record: (name, value, type = 'time') => {
        if (!metrics.has(name)) {
          metrics.set(name, new PerformanceMetric(name, type));
        }
        metrics.get(name).record(value);
      },

      // Get metric stats
      getStats: (name) => {
        const metric = metrics.get(name);
        if (!metric) return null;

        return {
          average: metric.getAverage(),
          p50: metric.getPercentile(50),
          p95: metric.getPercentile(95),
          p99: metric.getPercentile(99),
          samples: metric.samples.length
        };
      },

      // Create resource pool
      createPool: (factory, reset, maxSize) => {
        return new ResourcePool(factory, reset, maxSize);
      },

      // Debounce function with performance tracking
      debounce: (func, wait, name) => {
        let timeout;
        let lastCall = 0;
        
        return function(...args) {
          const now = performance.now();
          
          if (name && lastCall > 0) {
            PerformanceOptimizer.record(`debounce_${name}_interval`, now - lastCall);
          }
          
          lastCall = now;
          clearTimeout(timeout);
          
          timeout = setTimeout(() => {
            const start = performance.now();
            func.apply(this, args);
            
            if (name) {
              PerformanceOptimizer.record(`debounce_${name}_execution`, performance.now() - start);
            }
          }, wait);
        };
      },

      // Request idle callback with fallback
      requestIdleCallback: (callback, options = {}) => {
        if ('requestIdleCallback' in window) {
          return window.requestIdleCallback(callback, options);
        }
        
        // Fallback for browsers without support
        const timeout = options.timeout || 1;
        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => 50
          });
        }, timeout);
      },

      // Batch DOM updates
      batchUpdates: (() => {
        const updates = [];
        let scheduled = false;

        const flush = () => {
          const start = performance.now();
          
          updates.forEach(update => update());
          updates.length = 0;
          scheduled = false;
          
          PerformanceOptimizer.record('batch_update', performance.now() - start);
        };

        return (update) => {
          updates.push(update);
          
          if (!scheduled) {
            scheduled = true;
            requestAnimationFrame(flush);
          }
        };
      })()
    };
  })();

  // Error Boundary with Chain of Responsibility Pattern
  const ErrorHandlingSystem = (() => {
    class ErrorHandler {
      constructor(name, condition, handler) {
        this.name = name;
        this.condition = condition;
        this.handler = handler;
        this.next = null;
      }

      setNext(handler) {
        this.next = handler;
        return handler;
      }

      handle(error, context) {
        if (this.condition(error, context)) {
          return this.handler(error, context);
        }
        
        if (this.next) {
          return this.next.handle(error, context);
        }
        
        // Default handling if no handler matches
        console.error('Unhandled error:', error);
        return false;
      }
    }

    // Create error handler chain
    const networkErrorHandler = new ErrorHandler(
      'network',
      (error) => error.name === 'NetworkError' || error.message.includes('fetch'),
      (error, context) => {
        Utils.NotificationManager.error('Network error. Please check your connection.');
        if (context.retry) {
          setTimeout(() => context.retry(), 5000);
        }
        return true;
      }
    );

    const authErrorHandler = new ErrorHandler(
      'auth',
      (error) => error.code === 'AUTH_ERROR' || error.status === 401,
      (error, context) => {
        Utils.NotificationManager.error('Authentication required. Please log in again.');
        if (context.redirect) {
          context.redirect('/login');
        }
        return true;
      }
    );

    const validationErrorHandler = new ErrorHandler(
      'validation',
      (error) => error.name === 'ValidationError',
      (error, context) => {
        const messages = error.details || [error.message];
        messages.forEach(msg => Utils.NotificationManager.warning(msg));
        return true;
      }
    );

    const quotaErrorHandler = new ErrorHandler(
      'quota',
      (error) => error.name === 'QuotaExceededError',
      (error, context) => {
        Utils.NotificationManager.error('Storage quota exceeded. Please clear some data.');
        return true;
      }
    );

    // Build the chain
    networkErrorHandler
      .setNext(authErrorHandler)
      .setNext(validationErrorHandler)
      .setNext(quotaErrorHandler);

    return {
      handle: (error, context = {}) => {
        // Log to monitoring service
        ErrorHandlingSystem.logError(error, context);
        
        // Handle through chain
        return networkErrorHandler.handle(error, context);
      },

      logError: (error, context) => {
        const errorInfo = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          context,
          userAgent: navigator.userAgent,
          url: window.location.href
        };

        // In production, send to error monitoring service
        console.error('Error logged:', errorInfo);
        
        // Store in IndexedDB for later analysis
        if (window.FinanceApp.PWAFeatures?.IndexedDBManager) {
          window.FinanceApp.PWAFeatures.IndexedDBManager.save('errors', errorInfo).catch(console.error);
        }
      },

      // React Error Boundary Component
      ErrorBoundary: class extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
          ErrorHandlingSystem.handle(error, {
            component: errorInfo.componentStack,
            props: this.props
          });
        }

        render() {
          if (this.state.hasError) {
            return React.createElement('div', {
              className: 'min-h-screen flex items-center justify-center bg-gray-50'
            },
              React.createElement('div', {
                className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'
              },
                React.createElement('div', { className: 'text-6xl mb-4' }, '😔'),
                React.createElement('h2', {
                  className: 'text-2xl font-bold text-gray-800 mb-2'
                }, 'Something went wrong'),
                React.createElement('p', {
                  className: 'text-gray-600 mb-6'
                }, 'We apologize for the inconvenience. Please try refreshing the page.'),
                React.createElement('button', {
                  onClick: () => window.location.reload(),
                  className: 'px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                }, 'Refresh Page')
              )
            );
          }

          return this.props.children;
        }
      }
    };
  })();

  // Feature Toggle System with Strategy Pattern
  const FeatureToggleSystem = (() => {
    const strategies = new Map();
    const toggles = new Map();

    // Toggle evaluation strategies
    class ToggleStrategy {
      evaluate(context) {
        throw new Error('evaluate method must be implemented');
      }
    }

    class BooleanStrategy extends ToggleStrategy {
      constructor(value) {
        super();
        this.value = value;
      }

      evaluate() {
        return this.value;
      }
    }

    class PercentageStrategy extends ToggleStrategy {
      constructor(percentage) {
        super();
        this.percentage = percentage;
      }

      evaluate(context) {
        const hash = this.hashString(context.userId || 'anonymous');
        return (hash % 100) < this.percentage;
      }

      hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      }
    }

    class UserGroupStrategy extends ToggleStrategy {
      constructor(allowedGroups) {
        super();
        this.allowedGroups = new Set(allowedGroups);
      }

      evaluate(context) {
        return this.allowedGroups.has(context.userGroup);
      }
    }

    class DateRangeStrategy extends ToggleStrategy {
      constructor(startDate, endDate) {
        super();
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
      }

      evaluate() {
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
      }
    }

    // Register strategies
    strategies.set('boolean', BooleanStrategy);
    strategies.set('percentage', PercentageStrategy);
    strategies.set('userGroup', UserGroupStrategy);
    strategies.set('dateRange', DateRangeStrategy);

    return {
      // Define a feature toggle
      define: (name, config) => {
        const StrategyClass = strategies.get(config.type);
        if (!StrategyClass) {
          throw new Error(`Unknown toggle strategy: ${config.type}`);
        }

        const strategy = new StrategyClass(...(config.params || []));
        toggles.set(name, {
          name,
          description: config.description,
          strategy,
          dependencies: config.dependencies || []
        });
      },

      // Check if feature is enabled
      isEnabled: (name, context = {}) => {
        const toggle = toggles.get(name);
        if (!toggle) return false;

        // Check dependencies
        for (const dep of toggle.dependencies) {
          if (!FeatureToggleSystem.isEnabled(dep, context)) {
            return false;
          }
        }

        return toggle.strategy.evaluate(context);
      },

      // Get all toggles
      getAllToggles: () => {
        return Array.from(toggles.entries()).map(([name, toggle]) => ({
          name,
          description: toggle.description,
          dependencies: toggle.dependencies
        }));
      },

      // React hook for feature toggles
      useFeatureToggle: (name) => {
        const [enabled, setEnabled] = React.useState(false);
        const { state } = useFinance();

        React.useEffect(() => {
          const context = {
            userId: state.currentUser?.id,
            userGroup: state.currentUser?.group
          };
          
          setEnabled(FeatureToggleSystem.isEnabled(name, context));
        }, [name, state.currentUser]);

        return enabled;
      }
    };
  })();

  // Unified Dashboard Component with Composite Pattern
  const UnifiedDashboard = () => {
    const [activeView, setActiveView] = React.useState('overview');
    const [features, setFeatures] = React.useState([]);
    const [metrics, setMetrics] = React.useState({});
    const { state } = useFinance();

    React.useEffect(() => {
      // Load feature status
      setFeatures(FeatureRegistry.getAll());
      
      // Subscribe to performance metrics
      const unsubscribe = PerformanceOptimizer.subscribe((type, data) => {
        if (type === 'performance-warning') {
          Utils.NotificationManager.warning(
            `Performance warning: ${data.metric} exceeded threshold`
          );
        }
      });

      return unsubscribe;
    }, []);

    const views = [
      { id: 'overview', name: 'Overview', icon: '📊' },
      { id: 'features', name: 'Features', icon: '🔧' },
      { id: 'performance', name: 'Performance', icon: '⚡' },
      { id: 'security', name: 'Security', icon: '🔒' },
      { id: 'international', name: 'International', icon: '🌍' },
      { id: 'gamification', name: 'Gamification', icon: '🎮' }
    ];

    const renderContent = () => {
      switch (activeView) {
        case 'overview':
          return React.createElement(DashboardOverview, { state });
          
        case 'features':
          return React.createElement(FeatureManagement, { features });
          
        case 'performance':
          return React.createElement(PerformanceDashboard, { metrics });
          
        case 'security':
          const SecurityDashboard = window.FinanceApp.SecurityFeatures?.SecurityComponents?.SecurityDashboard;
          return SecurityDashboard ? React.createElement(SecurityDashboard) : null;
          
        case 'international':
          return React.createElement(InternationalDashboard);
          
        case 'gamification':
          return React.createElement(GamificationDashboard, { userId: state.currentUser?.id });
          
        default:
          return null;
      }
    };

    return React.createElement(ErrorHandlingSystem.ErrorBoundary, null,
      React.createElement('div', { className: 'min-h-screen bg-gray-50' },
        // Navigation
        React.createElement('div', { className: 'bg-white shadow-sm border-b' },
          React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
            React.createElement('div', { className: 'flex space-x-8' },
              views.map(view =>
                React.createElement('button', {
                  key: view.id,
                  onClick: () => setActiveView(view.id),
                  className: `py-4 px-2 border-b-2 transition-colors ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`
                },
                  React.createElement('span', { className: 'mr-2' }, view.icon),
                  view.name
                )
              )
            )
          )
        ),
        
        // Content
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
          renderContent()
        )
      )
    );
  };

  // Dashboard Overview Component
  const DashboardOverview = ({ state }) => {
    const InternationalFeatures = window.FinanceApp.InternationalFeatures;
    const AdvancedFeatures = window.FinanceApp.AdvancedFeatures;
    const SecurityFeatures = window.FinanceApp.SecurityFeatures;

    return React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
      // Multi-currency accounts
      InternationalFeatures?.MultiCurrencyAccount && 
        React.createElement(InternationalFeatures.MultiCurrencyAccount),
      
      // AI Insights
      AdvancedFeatures?.AIInsights && 
        React.createElement('div', { className: 'lg:col-span-2' },
          React.createElement(AdvancedFeatures.AIInsights)
        ),
      
      // Smart Notifications
      AdvancedFeatures?.SmartNotifications && 
        React.createElement(AdvancedFeatures.SmartNotifications),
      
      // Currency Converter
      InternationalFeatures?.CurrencyConverter && 
        React.createElement(InternationalFeatures.CurrencyConverter),
      
      // Activity Feed
      AdvancedFeatures?.CollaborationComponents?.ActivityFeed && 
        React.createElement(AdvancedFeatures.CollaborationComponents.ActivityFeed)
    );
  };

  // Feature Management Component
  const FeatureManagement = ({ features }) => {
    const [loading, setLoading] = React.useState({});

    const handleToggle = async (feature) => {
      setLoading({ ...loading, [feature.id]: true });
      
      try {
        if (feature.loaded) {
          await feature.unload();
        } else {
          await feature.load();
        }
        
        // Force re-render
        setLoading({ ...loading, [feature.id]: false });
      } catch (error) {
        ErrorHandlingSystem.handle(error, {
          context: `Failed to toggle feature ${feature.id}`
        });
        setLoading({ ...loading, [feature.id]: false });
      }
    };

    return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
      React.createElement('h2', { className: 'text-xl font-semibold mb-6' }, 
        'Feature Management'
      ),
      
      React.createElement('div', { className: 'space-y-4' },
        features.map(feature =>
          React.createElement('div', {
            key: feature.id,
            className: 'flex items-center justify-between p-4 border border-gray-200 rounded-lg'
          },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h3', { className: 'font-medium' }, feature.name),
              React.createElement('p', { className: 'text-sm text-gray-600' }, 
                feature.description
              ),
              feature.dependencies.length > 0 && 
                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                  'Dependencies: ', feature.dependencies.join(', ')
                )
            ),
            React.createElement('div', { className: 'flex items-center space-x-3' },
              React.createElement('span', {
                className: `text-sm ${feature.loaded ? 'text-green-600' : 'text-gray-500'}`
              }, feature.loaded ? 'Loaded' : 'Not loaded'),
              React.createElement('button', {
                onClick: () => handleToggle(feature),
                disabled: loading[feature.id] || !feature.enabled,
                className: `px-4 py-2 rounded transition-colors ${
                  feature.loaded
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } disabled:bg-gray-300`
              }, loading[feature.id] ? 'Loading...' : feature.loaded ? 'Unload' : 'Load')
            )
          )
        )
      )
    );
  };

  // Performance Dashboard Component
  const PerformanceDashboard = ({ metrics }) => {
    const [stats, setStats] = React.useState({});

    React.useEffect(() => {
      const updateStats = () => {
        const newStats = {};
        ['render', 'api_call', 'data_processing'].forEach(metric => {
          newStats[metric] = PerformanceOptimizer.getStats(metric);
        });
        setStats(newStats);
      };

      updateStats();
      const interval = setInterval(updateStats, 5000);
      
      return () => clearInterval(interval);
    }, []);

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('h2', { className: 'text-xl font-semibold mb-6' }, 
          'Performance Metrics'
        ),
        
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
          Object.entries(stats).map(([name, data]) =>
            React.createElement('div', {
              key: name,
              className: 'bg-gray-50 rounded-lg p-4'
            },
              React.createElement('h3', { className: 'font-medium capitalize mb-2' }, 
                name.replace(/_/g, ' ')
              ),
              data ? React.createElement('div', { className: 'space-y-1 text-sm' },
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'Average:'),
                  React.createElement('span', { className: 'font-medium' }, 
                    `${data.average.toFixed(2)}ms`
                  )
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'P95:'),
                  React.createElement('span', { className: 'font-medium' }, 
                    `${data.p95.toFixed(2)}ms`
                  )
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600' }, 'Samples:'),
                  React.createElement('span', { className: 'font-medium' }, data.samples)
                )
              ) : React.createElement('div', { className: 'text-gray-500' }, 'No data')
            )
          )
        )
      ),
      
      // Memory usage
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
          'Resource Usage'
        ),
        React.createElement(ResourceMonitor)
      )
    );
  };

  // Resource Monitor Component
  const ResourceMonitor = () => {
    const [resources, setResources] = React.useState({});

    React.useEffect(() => {
      const updateResources = () => {
        if (performance.memory) {
          setResources({
            usedJSHeap: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
            totalJSHeap: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
            limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
          });
        }
      };

      updateResources();
      const interval = setInterval(updateResources, 2000);
      
      return () => clearInterval(interval);
    }, []);

    if (!performance.memory) {
      return React.createElement('div', { className: 'text-gray-500' }, 
        'Memory monitoring not available in this browser'
      );
    }

    const usagePercentage = (resources.usedJSHeap / resources.limit) * 100;

    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', null,
        React.createElement('div', { className: 'flex justify-between mb-2' },
          React.createElement('span', { className: 'text-sm text-gray-600' }, 
            'JS Heap Usage'
          ),
          React.createElement('span', { className: 'text-sm font-medium' },
            `${resources.usedJSHeap} / ${resources.limit} MB`
          )
        ),
        React.createElement('div', { className: 'relative h-4 bg-gray-200 rounded-full overflow-hidden' },
          React.createElement('div', {
            className: `absolute left-0 top-0 h-full transition-all duration-500 ${
              usagePercentage > 80 ? 'bg-red-500' : 
              usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`,
            style: { width: `${usagePercentage}%` }
          })
        )
      )
    );
  };

  // International Dashboard Component
  const InternationalDashboard = () => {
    const InternationalFeatures = window.FinanceApp.InternationalFeatures;
    if (!InternationalFeatures) return null;

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('h2', { className: 'text-xl font-semibold' }, 
            'International Settings'
          ),
          React.createElement(InternationalFeatures.LanguageSelector)
        ),
        
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          React.createElement(InternationalFeatures.CurrencyGainLossTracker),
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
              'Exchange Rates'
            ),
            React.createElement(ExchangeRateTable)
          )
        )
      )
    );
  };

  // Exchange Rate Table Component
  const ExchangeRateTable = () => {
    const [rates, setRates] = React.useState({});
    const InternationalFeatures = window.FinanceApp.InternationalFeatures;

    React.useEffect(() => {
      if (!InternationalFeatures?.ExchangeRateService) return;
      
      const updateRates = () => {
        setRates(InternationalFeatures.ExchangeRateService.getRates());
      };

      updateRates();
      const unsubscribe = InternationalFeatures.ExchangeRateService.subscribe(updateRates);
      
      return unsubscribe;
    }, []);

    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

    return React.createElement('div', { className: 'overflow-x-auto' },
      React.createElement('table', { className: 'min-w-full text-sm' },
        React.createElement('thead', null,
          React.createElement('tr', { className: 'bg-gray-50' },
            React.createElement('th', { 
              className: 'px-4 py-2 text-left font-medium text-gray-700' 
            }, 'Currency'),
            React.createElement('th', { 
              className: 'px-4 py-2 text-right font-medium text-gray-700' 
            }, 'Rate (vs USD)')
          )
        ),
        React.createElement('tbody', null,
          majorCurrencies.map(currency =>
            React.createElement('tr', { 
              key: currency,
              className: 'border-t' 
            },
              React.createElement('td', { className: 'px-4 py-2' }, currency),
              React.createElement('td', { 
                className: 'px-4 py-2 text-right font-mono' 
              }, rates[currency]?.toFixed(4) || '-')
            )
          )
        )
      )
    );
  };

  // Gamification Dashboard Component
  const GamificationDashboard = ({ userId }) => {
    const GamificationFeatures = window.FinanceApp.GamificationFeatures;
    if (!GamificationFeatures || !userId) return null;

    const { AchievementShowcase, LevelProgress, StreakTracker, ActiveChallenges } = 
      GamificationFeatures.ProgressComponents;

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
        React.createElement('div', { className: 'md:col-span-2' },
          React.createElement(AchievementShowcase, { userId })
        ),
        React.createElement('div', { className: 'space-y-6' },
          React.createElement(LevelProgress, { userId }),
          React.createElement(StreakTracker, { userId })
        )
      ),
      React.createElement(ActiveChallenges, { userId })
    );
  };

  // Register all Phase 3 features
  const registerPhase3Features = () => {
    // International Features
    FeatureRegistry.register('international', {
      name: 'International Support',
      description: 'Multi-currency and internationalization features',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.InternationalFeatures,
      afterLoad: () => {
        console.log('International features loaded');
      }
    });

    // Integration Features
    FeatureRegistry.register('integration', {
      name: 'Data Integration',
      description: 'Import/export and third-party integrations',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.IntegrationFeatures,
      dependencies: ['international']
    });

    // PWA Features
    FeatureRegistry.register('pwa', {
      name: 'Progressive Web App',
      description: 'Offline support and mobile features',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.PWAFeatures,
      afterLoad: async () => {
        if (window.FinanceApp.PWAFeatures?.initializePWA) {
          await window.FinanceApp.PWAFeatures.initializePWA();
        }
      }
    });

    // Advanced Analytics
    FeatureRegistry.register('analytics', {
      name: 'Advanced Analytics',
      description: 'AI-powered insights and predictions',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.AdvancedFeatures,
      dependencies: ['international', 'pwa'],
      afterLoad: () => {
        // Initialize real-time features
        const session = window.FinanceApp.SecurityFeatures?.SessionManager?.getCurrentSession();
        if (session && window.FinanceApp.AdvancedFeatures?.initializeRealtime) {
          window.FinanceApp.AdvancedFeatures.initializeRealtime(session.userId);
        }
      }
    });

    // Security Features
    FeatureRegistry.register('security', {
      name: 'Enhanced Security',
      description: 'Advanced security and privacy features',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.SecurityFeatures,
      dependencies: ['pwa'],
      afterLoad: async () => {
        if (window.FinanceApp.SecurityFeatures?.initializeSecurity) {
          await window.FinanceApp.SecurityFeatures.initializeSecurity();
        }
      }
    });

    // Gamification Features
    FeatureRegistry.register('gamification', {
      name: 'Gamification',
      description: 'Achievements and engagement features',
      version: '3.1.0',
      enabled: true,
      loader: async () => window.FinanceApp.GamificationFeatures,
      dependencies: ['analytics']
    });
  };

  // Define feature toggles
  const defineFeatureToggles = () => {
    FeatureToggleSystem.define('advanced_analytics', {
      type: 'boolean',
      params: [true],
      description: 'Enable AI-powered analytics'
    });

    FeatureToggleSystem.define('real_time_collab', {
      type: 'percentage',
      params: [100], // 100% rollout
      description: 'Enable real-time collaboration features'
    });

    FeatureToggleSystem.define('gamification_beta', {
      type: 'userGroup',
      params: [['beta', 'admin']],
      description: 'Enable gamification for beta users'
    });

    FeatureToggleSystem.define('holiday_themes', {
      type: 'dateRange',
      params: ['2024-12-01', '2025-01-07'],
      description: 'Enable holiday themes'
    });
  };

  // Initialize Phase 3 Integration
  const initializePhase3 = async () => {
    try {
      console.log('Initializing Phase 3 features...');
      
      // Register features
      registerPhase3Features();
      
      // Define feature toggles
      defineFeatureToggles();
      
      // Load all enabled features
      const loaded = await FeatureRegistry.loadAll();
      console.log('Loaded features:', loaded);
      
      // Set up performance monitoring
      if ('PerformanceObserver' in window) {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            PerformanceOptimizer.record(entry.name, entry.duration);
          }
        });
        perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
      }
      
      // Set up global error handling
      window.addEventListener('unhandledrejection', event => {
        ErrorHandlingSystem.handle(new Error(event.reason), {
          type: 'unhandledRejection'
        });
      });
      
      console.log('Phase 3 initialization complete');
    } catch (error) {
      console.error('Failed to initialize Phase 3:', error);
      ErrorHandlingSystem.handle(error, {
        context: 'Phase 3 initialization'
      });
    }
  };

  // Export integration features
  window.FinanceApp.Phase3Integration = {
    // Core systems
    FeatureRegistry,
    PerformanceOptimizer,
    ErrorHandlingSystem,
    FeatureToggleSystem,
    
    // Components
    UnifiedDashboard,
    
    // Initialize
    initialize: initializePhase3,
    
    // Utilities
    utils: {
      // Check if all Phase 3 features are loaded
      areAllFeaturesLoaded: () => {
        const requiredFeatures = [
          'international',
          'integration', 
          'pwa',
          'analytics',
          'security',
          'gamification'
        ];
        
        return requiredFeatures.every(id => FeatureRegistry.isLoaded(id));
      },
      
      // Get feature instance
      getFeature: (id) => FeatureRegistry.getInstance(id),
      
      // Performance helpers
      measurePerformance: (name, fn) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        PerformanceOptimizer.record(name, duration);
        return result;
      },
      
      // Batch operations
      batchUpdate: PerformanceOptimizer.batchUpdates,
      
      // Feature toggle hook
      useFeatureToggle: FeatureToggleSystem.useFeatureToggle
    }
  };

  // Auto-initialize if main app is ready
  if (window.FinanceApp.initialized) {
    initializePhase3();
  }

})(window);