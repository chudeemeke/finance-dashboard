/**
 * Family Finance Dashboard v3.1.0
 * Complete Phase 3 Integration with Admin Panel
 * 
 * Provides comprehensive integration, admin controls, feature showcase,
 * migration utilities, and monitoring dashboard using advanced design patterns
 */

(function(window) {
  'use strict';

  const { React, ReactDOM } = window;
  const { Utils, ActionTypes, useFinance, CONFIG } = window.FinanceApp;

  // Admin Panel with Facade Pattern
  const AdminPanel = (() => {
    // Admin state management
    const adminState = {
      authenticated: false,
      permissions: new Set(),
      auditLog: []
    };

    // Permission levels
    const PERMISSIONS = {
      VIEW_ANALYTICS: 'view_analytics',
      MANAGE_FEATURES: 'manage_features',
      VIEW_USERS: 'view_users',
      MANAGE_USERS: 'manage_users',
      VIEW_SECURITY: 'view_security',
      MANAGE_SECURITY: 'manage_security',
      EXPORT_DATA: 'export_data',
      SYSTEM_CONFIG: 'system_config'
    };

    // Admin authentication
    const authenticate = async (credentials) => {
      // In production, this would validate against secure backend
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        adminState.authenticated = true;
        adminState.permissions = new Set(Object.values(PERMISSIONS));
        
        // Log authentication
        AdminPanel.logAction('authentication', 'success', { username: credentials.username });
        
        return true;
      }
      
      AdminPanel.logAction('authentication', 'failed', { username: credentials.username });
      return false;
    };

    // Check permission
    const hasPermission = (permission) => {
      return adminState.authenticated && adminState.permissions.has(permission);
    };

    // Log admin action
    const logAction = (action, status, details = {}) => {
      const entry = {
        id: Utils.generateUUID(),
        timestamp: new Date().toISOString(),
        action,
        status,
        details,
        user: adminState.authenticated ? 'admin' : 'anonymous'
      };
      
      adminState.auditLog.unshift(entry);
      
      // Keep only last 1000 entries
      if (adminState.auditLog.length > 1000) {
        adminState.auditLog = adminState.auditLog.slice(0, 1000);
      }
    };

    // Admin Panel Component
    const Component = () => {
      const [authenticated, setAuthenticated] = React.useState(adminState.authenticated);
      const [activeSection, setActiveSection] = React.useState('dashboard');
      const [stats, setStats] = React.useState({});

      React.useEffect(() => {
        if (authenticated) {
          loadStats();
        }
      }, [authenticated]);

      const loadStats = async () => {
        const Phase3Integration = window.FinanceApp.Phase3Integration;
        const features = Phase3Integration?.FeatureRegistry?.getAll() || [];
        
        setStats({
          totalFeatures: features.length,
          loadedFeatures: features.filter(f => f.loaded).length,
          activeUsers: Math.floor(Math.random() * 1000) + 500, // Mock data
          systemHealth: 'Good',
          lastBackup: new Date(Date.now() - 3600000).toISOString()
        });
      };

      if (!authenticated) {
        return React.createElement(AdminLogin, {
          onLogin: async (credentials) => {
            const success = await authenticate(credentials);
            setAuthenticated(success);
            return success;
          }
        });
      }

      const sections = [
        { id: 'dashboard', name: 'Dashboard', icon: '📊', permission: null },
        { id: 'features', name: 'Features', icon: '🔧', permission: PERMISSIONS.MANAGE_FEATURES },
        { id: 'users', name: 'Users', icon: '👥', permission: PERMISSIONS.VIEW_USERS },
        { id: 'analytics', name: 'Analytics', icon: '📈', permission: PERMISSIONS.VIEW_ANALYTICS },
        { id: 'security', name: 'Security', icon: '🔒', permission: PERMISSIONS.VIEW_SECURITY },
        { id: 'system', name: 'System', icon: '⚙️', permission: PERMISSIONS.SYSTEM_CONFIG },
        { id: 'audit', name: 'Audit Log', icon: '📋', permission: PERMISSIONS.VIEW_SECURITY }
      ];

      const availableSections = sections.filter(s => 
        !s.permission || hasPermission(s.permission)
      );

      return React.createElement('div', { className: 'min-h-screen bg-gray-100' },
        // Header
        React.createElement('div', { className: 'bg-white shadow-sm border-b' },
          React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
            React.createElement('div', { className: 'flex justify-between items-center py-4' },
              React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 
                'Admin Panel'
              ),
              React.createElement('button', {
                onClick: () => {
                  adminState.authenticated = false;
                  setAuthenticated(false);
                  AdminPanel.logAction('logout', 'success');
                },
                className: 'px-4 py-2 text-sm text-red-600 hover:text-red-800'
              }, 'Logout')
            )
          )
        ),
        
        // Navigation
        React.createElement('div', { className: 'bg-white shadow-sm border-b' },
          React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
            React.createElement('div', { className: 'flex space-x-6' },
              availableSections.map(section =>
                React.createElement('button', {
                  key: section.id,
                  onClick: () => setActiveSection(section.id),
                  className: `py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`
                },
                  React.createElement('span', { className: 'mr-2' }, section.icon),
                  section.name
                )
              )
            )
          )
        ),
        
        // Content
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
          renderSection(activeSection, stats)
        )
      );
    };

    const renderSection = (section, stats) => {
      switch (section) {
        case 'dashboard':
          return React.createElement(AdminDashboard, { stats });
        case 'features':
          return React.createElement(FeatureControl);
        case 'users':
          return React.createElement(UserManagement);
        case 'analytics':
          return React.createElement(SystemAnalytics);
        case 'security':
          return React.createElement(SecurityControl);
        case 'system':
          return React.createElement(SystemConfiguration);
        case 'audit':
          return React.createElement(AuditLog, { logs: adminState.auditLog });
        default:
          return null;
      }
    };

    return {
      Component,
      authenticate,
      hasPermission,
      logAction,
      PERMISSIONS
    };
  })();

  // Admin Login Component
  const AdminLogin = ({ onLogin }) => {
    const [credentials, setCredentials] = React.useState({ username: '', password: '' });
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      const success = await onLogin(credentials);
      
      if (!success) {
        setError('Invalid credentials');
      }
      
      setLoading(false);
    };

    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center bg-gray-50'
    },
      React.createElement('div', {
        className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-8'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-center mb-8'
        }, 'Admin Login'),
        
        React.createElement('form', { onSubmit: handleSubmit },
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('input', {
              type: 'text',
              value: credentials.username,
              onChange: (e) => setCredentials({ ...credentials, username: e.target.value }),
              placeholder: 'Username',
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              required: true
            }),
            React.createElement('input', {
              type: 'password',
              value: credentials.password,
              onChange: (e) => setCredentials({ ...credentials, password: e.target.value }),
              placeholder: 'Password',
              className: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              required: true
            }),
            error && React.createElement('p', {
              className: 'text-red-500 text-sm'
            }, error),
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300'
            }, loading ? 'Logging in...' : 'Login')
          )
        )
      )
    );
  };

  // Admin Dashboard Component
  const AdminDashboard = ({ stats }) => {
    const metrics = [
      { label: 'Total Features', value: stats.totalFeatures || 0, icon: '🔧' },
      { label: 'Loaded Features', value: stats.loadedFeatures || 0, icon: '✅' },
      { label: 'Active Users', value: stats.activeUsers || 0, icon: '👥' },
      { label: 'System Health', value: stats.systemHealth || 'Unknown', icon: '💚' }
    ];

    return React.createElement('div', { className: 'space-y-6' },
      // Metrics Grid
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
        metrics.map((metric, index) =>
          React.createElement('div', {
            key: index,
            className: 'bg-white rounded-lg shadow p-6'
          },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', null,
                React.createElement('p', { className: 'text-sm text-gray-600' }, metric.label),
                React.createElement('p', { className: 'text-2xl font-bold mt-1' }, metric.value)
              ),
              React.createElement('span', { className: 'text-3xl' }, metric.icon)
            )
          )
        )
      ),
      
      // Quick Actions
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Quick Actions'),
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
          [
            { label: 'Export Data', icon: '📤', action: 'export' },
            { label: 'Backup System', icon: '💾', action: 'backup' },
            { label: 'Clear Cache', icon: '🗑️', action: 'clear-cache' },
            { label: 'Run Diagnostics', icon: '🔍', action: 'diagnostics' }
          ].map(action =>
            React.createElement('button', {
              key: action.action,
              onClick: () => handleQuickAction(action.action),
              className: 'p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            },
              React.createElement('div', { className: 'text-2xl mb-2' }, action.icon),
              React.createElement('div', { className: 'text-sm' }, action.label)
            )
          )
        )
      ),
      
      // System Status
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'System Status'),
        React.createElement(SystemStatusMonitor)
      )
    );
  };

  const handleQuickAction = (action) => {
    AdminPanel.logAction(`quick_action_${action}`, 'initiated');
    
    switch (action) {
      case 'export':
        Utils.NotificationManager.info('Data export started...');
        break;
      case 'backup':
        Utils.NotificationManager.info('System backup initiated...');
        break;
      case 'clear-cache':
        if (window.confirm('Clear all cached data?')) {
          localStorage.clear();
          sessionStorage.clear();
          Utils.NotificationManager.success('Cache cleared successfully');
        }
        break;
      case 'diagnostics':
        runSystemDiagnostics();
        break;
    }
  };

  // System Status Monitor
  const SystemStatusMonitor = () => {
    const [status, setStatus] = React.useState({
      api: { status: 'operational', latency: 45 },
      database: { status: 'operational', latency: 12 },
      cache: { status: 'operational', hitRate: 0.92 },
      storage: { status: 'warning', usage: 0.85 }
    });

    const statusColors = {
      operational: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    return React.createElement('div', { className: 'space-y-3' },
      Object.entries(status).map(([service, data]) =>
        React.createElement('div', {
          key: service,
          className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg'
        },
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('div', {
              className: `w-3 h-3 rounded-full ${statusColors[data.status]}`
            }),
            React.createElement('span', { className: 'font-medium capitalize' }, service)
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' },
            data.latency && `${data.latency}ms`,
            data.hitRate && `${(data.hitRate * 100).toFixed(0)}% hit rate`,
            data.usage && `${(data.usage * 100).toFixed(0)}% used`
          )
        )
      )
    );
  };

  // Feature Control Component
  const FeatureControl = () => {
    const Phase3Integration = window.FinanceApp.Phase3Integration;
    const [features, setFeatures] = React.useState([]);
    const [toggles, setToggles] = React.useState([]);

    React.useEffect(() => {
      if (Phase3Integration) {
        setFeatures(Phase3Integration.FeatureRegistry.getAll());
        setToggles(Phase3Integration.FeatureToggleSystem.getAllToggles());
      }
    }, []);

    const handleFeatureToggle = async (feature) => {
      AdminPanel.logAction('feature_toggle', 'initiated', { 
        feature: feature.id,
        action: feature.loaded ? 'unload' : 'load'
      });

      try {
        if (feature.loaded) {
          await feature.unload();
        } else {
          await feature.load();
        }
        
        setFeatures(Phase3Integration.FeatureRegistry.getAll());
        Utils.NotificationManager.success(`Feature ${feature.id} ${feature.loaded ? 'loaded' : 'unloaded'}`);
      } catch (error) {
        Utils.NotificationManager.error(`Failed to toggle feature: ${error.message}`);
      }
    };

    return React.createElement('div', { className: 'space-y-6' },
      // Feature Registry
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Feature Registry'),
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'min-w-full' },
            React.createElement('thead', null,
              React.createElement('tr', { className: 'bg-gray-50' },
                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Feature'),
                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Version'),
                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Dependencies'),
                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
              )
            ),
            React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
              features.map(feature =>
                React.createElement('tr', { key: feature.id },
                  React.createElement('td', { className: 'px-4 py-3' },
                    React.createElement('div', null,
                      React.createElement('div', { className: 'font-medium' }, feature.name),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, feature.description)
                    )
                  ),
                  React.createElement('td', { className: 'px-4 py-3 text-sm' }, feature.version),
                  React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                    feature.dependencies.join(', ') || 'None'
                  ),
                  React.createElement('td', { className: 'px-4 py-3' },
                    React.createElement('span', {
                      className: `inline-flex px-2 py-1 text-xs rounded-full ${
                        feature.loaded
                          ? 'bg-green-100 text-green-800'
                          : feature.enabled
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`
                    }, feature.loaded ? 'Loaded' : feature.enabled ? 'Ready' : 'Disabled')
                  ),
                  React.createElement('td', { className: 'px-4 py-3' },
                    React.createElement('button', {
                      onClick: () => handleFeatureToggle(feature),
                      className: 'text-sm text-blue-600 hover:text-blue-800'
                    }, feature.loaded ? 'Unload' : 'Load')
                  )
                )
              )
            )
          )
        )
      ),
      
      // Feature Toggles
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Feature Toggles'),
        React.createElement('div', { className: 'space-y-3' },
          toggles.map(toggle =>
            React.createElement('div', {
              key: toggle.name,
              className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg'
            },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, toggle.name),
                React.createElement('div', { className: 'text-sm text-gray-600' }, toggle.description)
              ),
              React.createElement('div', { className: 'text-sm text-gray-500' },
                'Dependencies: ', toggle.dependencies.join(', ') || 'None'
              )
            )
          )
        )
      )
    );
  };

  // User Management Component
  const UserManagement = () => {
    const [users, setUsers] = React.useState([
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', lastActive: new Date() },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', lastActive: new Date(Date.now() - 3600000) },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', lastActive: new Date(Date.now() - 86400000) }
    ]);

    const [selectedUser, setSelectedUser] = React.useState(null);

    return React.createElement('div', { className: 'space-y-6' },
      // User Stats
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Users'),
          React.createElement('div', { className: 'text-3xl font-bold mt-2' }, users.length)
        ),
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Active Today'),
          React.createElement('div', { className: 'text-3xl font-bold mt-2' }, 
            users.filter(u => new Date() - u.lastActive < 86400000).length
          )
        ),
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Admin Users'),
          React.createElement('div', { className: 'text-3xl font-bold mt-2' }, 
            users.filter(u => u.role === 'admin').length
          )
        )
      ),
      
      // User List
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6 border-b' },
          React.createElement('h3', { className: 'text-lg font-semibold' }, 'User List')
        ),
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'min-w-full' },
            React.createElement('thead', null,
              React.createElement('tr', { className: 'bg-gray-50' },
                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'User'),
                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Role'),
                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Last Active'),
                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
              )
            ),
            React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
              users.map(user =>
                React.createElement('tr', { key: user.id },
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', null,
                      React.createElement('div', { className: 'font-medium' }, user.name),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, user.email)
                    )
                  ),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('span', {
                      className: `inline-flex px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`
                    }, user.role)
                  ),
                  React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-500' },
                    formatRelativeTime(user.lastActive)
                  ),
                  React.createElement('td', { className: 'px-6 py-4 text-sm' },
                    React.createElement('button', {
                      onClick: () => setSelectedUser(user),
                      className: 'text-blue-600 hover:text-blue-800'
                    }, 'View Details')
                  )
                )
              )
            )
          )
        )
      )
    );
  };

  // System Analytics Component
  const SystemAnalytics = () => {
    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'System Analytics'),
        React.createElement('div', { className: 'h-64 flex items-center justify-center text-gray-500' },
          'Analytics charts would be displayed here'
        )
      ),
      
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h4', { className: 'font-medium mb-4' }, 'Feature Usage'),
          React.createElement('div', { className: 'space-y-3' },
            [
              { feature: 'Multi-Currency', usage: 78 },
              { feature: 'AI Analytics', usage: 65 },
              { feature: 'Import/Export', usage: 45 },
              { feature: 'Gamification', usage: 82 }
            ].map(item =>
              React.createElement('div', { key: item.feature },
                React.createElement('div', { className: 'flex justify-between text-sm mb-1' },
                  React.createElement('span', null, item.feature),
                  React.createElement('span', { className: 'font-medium' }, `${item.usage}%`)
                ),
                React.createElement('div', { className: 'h-2 bg-gray-200 rounded-full overflow-hidden' },
                  React.createElement('div', {
                    className: 'h-full bg-blue-500',
                    style: { width: `${item.usage}%` }
                  })
                )
              )
            )
          )
        ),
        
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h4', { className: 'font-medium mb-4' }, 'Performance Metrics'),
          React.createElement('div', { className: 'space-y-3' },
            [
              { metric: 'API Response Time', value: '45ms', status: 'good' },
              { metric: 'Page Load Time', value: '1.2s', status: 'good' },
              { metric: 'Error Rate', value: '0.02%', status: 'good' },
              { metric: 'Memory Usage', value: '85%', status: 'warning' }
            ].map(item =>
              React.createElement('div', {
                key: item.metric,
                className: 'flex justify-between items-center'
              },
                React.createElement('span', { className: 'text-sm' }, item.metric),
                React.createElement('span', {
                  className: `text-sm font-medium ${
                    item.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                  }`
                }, item.value)
              )
            )
          )
        )
      )
    );
  };

  // Security Control Component
  const SecurityControl = () => {
    const [securitySettings, setSecuritySettings] = React.useState({
      twoFactorRequired: true,
      sessionTimeout: 30,
      passwordComplexity: 'high',
      dataEncryption: true,
      auditLogging: true
    });

    const handleSettingChange = (setting, value) => {
      setSecuritySettings({ ...securitySettings, [setting]: value });
      AdminPanel.logAction('security_setting_change', 'updated', { setting, value });
      Utils.NotificationManager.success('Security setting updated');
    };

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-6' }, 'Security Settings'),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', { className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg' },
            React.createElement('div', null,
              React.createElement('div', { className: 'font-medium' }, 'Two-Factor Authentication'),
              React.createElement('div', { className: 'text-sm text-gray-600' }, 'Require 2FA for all users')
            ),
            React.createElement('button', {
              onClick: () => handleSettingChange('twoFactorRequired', !securitySettings.twoFactorRequired),
              className: `relative inline-flex h-6 w-11 items-center rounded-full ${
                securitySettings.twoFactorRequired ? 'bg-blue-600' : 'bg-gray-200'
              }`
            },
              React.createElement('span', {
                className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  securitySettings.twoFactorRequired ? 'translate-x-6' : 'translate-x-1'
                }`
              })
            )
          ),
          
          React.createElement('div', { className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg' },
            React.createElement('div', null,
              React.createElement('div', { className: 'font-medium' }, 'Session Timeout'),
              React.createElement('div', { className: 'text-sm text-gray-600' }, 'Auto-logout after inactivity')
            ),
            React.createElement('select', {
              value: securitySettings.sessionTimeout,
              onChange: (e) => handleSettingChange('sessionTimeout', parseInt(e.target.value)),
              className: 'px-3 py-1 border border-gray-300 rounded-md text-sm'
            },
              [15, 30, 60, 120].map(minutes =>
                React.createElement('option', { key: minutes, value: minutes }, 
                  `${minutes} minutes`
                )
              )
            )
          ),
          
          React.createElement('div', { className: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg' },
            React.createElement('div', null,
              React.createElement('div', { className: 'font-medium' }, 'Password Complexity'),
              React.createElement('div', { className: 'text-sm text-gray-600' }, 'Minimum password requirements')
            ),
            React.createElement('select', {
              value: securitySettings.passwordComplexity,
              onChange: (e) => handleSettingChange('passwordComplexity', e.target.value),
              className: 'px-3 py-1 border border-gray-300 rounded-md text-sm'
            },
              ['low', 'medium', 'high'].map(level =>
                React.createElement('option', { key: level, value: level }, 
                  level.charAt(0).toUpperCase() + level.slice(1)
                )
              )
            )
          )
        )
      ),
      
      // Active Sessions
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Active Sessions'),
        React.createElement('div', { className: 'space-y-3' },
          [
            { user: 'Admin', device: 'Chrome on Windows', location: 'New York, US', time: '2 minutes ago' },
            { user: 'John Doe', device: 'Safari on iPhone', location: 'London, UK', time: '15 minutes ago' },
            { user: 'Jane Smith', device: 'Firefox on Mac', location: 'Tokyo, JP', time: '1 hour ago' }
          ].map((session, index) =>
            React.createElement('div', {
              key: index,
              className: 'flex items-center justify-between p-4 border border-gray-200 rounded-lg'
            },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, session.user),
                React.createElement('div', { className: 'text-sm text-gray-600' }, 
                  `${session.device} • ${session.location}`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { className: 'text-sm text-gray-500' }, session.time),
                React.createElement('button', {
                  className: 'text-sm text-red-600 hover:text-red-800 mt-1'
                }, 'Terminate')
              )
            )
          )
        )
      )
    );
  };

  // System Configuration Component
  const SystemConfiguration = () => {
    const [config, setConfig] = React.useState({
      maintenanceMode: false,
      debugMode: false,
      apiRateLimit: 1000,
      maxUploadSize: 10,
      cacheEnabled: true,
      compressionEnabled: true
    });

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-6' }, 'System Configuration'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          // Maintenance Mode
          React.createElement('div', { className: 'p-4 border border-gray-200 rounded-lg' },
            React.createElement('div', { className: 'flex items-center justify-between mb-2' },
              React.createElement('span', { className: 'font-medium' }, 'Maintenance Mode'),
              React.createElement('button', {
                onClick: () => setConfig({ ...config, maintenanceMode: !config.maintenanceMode }),
                className: `relative inline-flex h-6 w-11 items-center rounded-full ${
                  config.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                }`
              },
                React.createElement('span', {
                  className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`
                })
              )
            ),
            React.createElement('p', { className: 'text-sm text-gray-600' }, 
              'Enable to prevent user access during updates'
            )
          ),
          
          // Debug Mode
          React.createElement('div', { className: 'p-4 border border-gray-200 rounded-lg' },
            React.createElement('div', { className: 'flex items-center justify-between mb-2' },
              React.createElement('span', { className: 'font-medium' }, 'Debug Mode'),
              React.createElement('button', {
                onClick: () => setConfig({ ...config, debugMode: !config.debugMode }),
                className: `relative inline-flex h-6 w-11 items-center rounded-full ${
                  config.debugMode ? 'bg-blue-600' : 'bg-gray-200'
                }`
              },
                React.createElement('span', {
                  className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.debugMode ? 'translate-x-6' : 'translate-x-1'
                  }`
                })
              )
            ),
            React.createElement('p', { className: 'text-sm text-gray-600' }, 
              'Enable detailed logging and error reporting'
            )
          ),
          
          // API Rate Limit
          React.createElement('div', { className: 'p-4 border border-gray-200 rounded-lg' },
            React.createElement('label', { className: 'block' },
              React.createElement('span', { className: 'font-medium' }, 'API Rate Limit'),
              React.createElement('input', {
                type: 'number',
                value: config.apiRateLimit,
                onChange: (e) => setConfig({ ...config, apiRateLimit: parseInt(e.target.value) }),
                className: 'mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
              }),
              React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, 
                'Requests per hour per user'
              )
            )
          ),
          
          // Max Upload Size
          React.createElement('div', { className: 'p-4 border border-gray-200 rounded-lg' },
            React.createElement('label', { className: 'block' },
              React.createElement('span', { className: 'font-medium' }, 'Max Upload Size'),
              React.createElement('input', {
                type: 'number',
                value: config.maxUploadSize,
                onChange: (e) => setConfig({ ...config, maxUploadSize: parseInt(e.target.value) }),
                className: 'mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
              }),
              React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, 
                'Maximum file size in MB'
              )
            )
          )
        )
      ),
      
      // Database Operations
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Database Operations'),
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
          [
            { label: 'Optimize Tables', icon: '⚡', action: 'optimize' },
            { label: 'Clear Logs', icon: '🗑️', action: 'clear-logs' },
            { label: 'Rebuild Indexes', icon: '🔧', action: 'rebuild-indexes' },
            { label: 'Export Database', icon: '💾', action: 'export-db' }
          ].map(operation =>
            React.createElement('button', {
              key: operation.action,
              onClick: () => handleDatabaseOperation(operation.action),
              className: 'p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center'
            },
              React.createElement('div', { className: 'text-2xl mb-2' }, operation.icon),
              React.createElement('div', { className: 'text-sm' }, operation.label)
            )
          )
        )
      )
    );
  };

  const handleDatabaseOperation = (operation) => {
    AdminPanel.logAction(`database_${operation}`, 'initiated');
    Utils.NotificationManager.info(`Database operation '${operation}' started...`);
  };

  // Audit Log Component
  const AuditLog = ({ logs }) => {
    const [filter, setFilter] = React.useState('all');
    
    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.action.includes(filter));

    return React.createElement('div', { className: 'bg-white rounded-lg shadow' },
      React.createElement('div', { className: 'p-6 border-b' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h3', { className: 'text-lg font-semibold' }, 'Audit Log'),
          React.createElement('select', {
            value: filter,
            onChange: (e) => setFilter(e.target.value),
            className: 'px-3 py-1 border border-gray-300 rounded-md text-sm'
          },
            React.createElement('option', { value: 'all' }, 'All Actions'),
            React.createElement('option', { value: 'auth' }, 'Authentication'),
            React.createElement('option', { value: 'feature' }, 'Features'),
            React.createElement('option', { value: 'security' }, 'Security'),
            React.createElement('option', { value: 'database' }, 'Database')
          )
        )
      ),
      React.createElement('div', { className: 'divide-y divide-gray-200 max-h-96 overflow-y-auto' },
        filteredLogs.map(log =>
          React.createElement('div', { key: log.id, className: 'p-4 hover:bg-gray-50' },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, log.action),
                React.createElement('div', { className: 'text-sm text-gray-600' }, 
                  `User: ${log.user} • Status: ${log.status}`
                ),
                log.details && Object.keys(log.details).length > 0 &&
                  React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                    JSON.stringify(log.details)
                  )
              ),
              React.createElement('div', { className: 'text-sm text-gray-500' },
                formatRelativeTime(new Date(log.timestamp))
              )
            )
          )
        )
      )
    );
  };

  // Helper Functions
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const runSystemDiagnostics = async () => {
    Utils.NotificationManager.info('Running system diagnostics...');
    
    // Simulate diagnostic checks
    const diagnostics = {
      database: true,
      api: true,
      storage: window.FinanceApp.PWAFeatures?.IndexedDBManager ? true : false,
      features: window.FinanceApp.Phase3Integration?.utils.areAllFeaturesLoaded()
    };

    setTimeout(() => {
      const issues = Object.entries(diagnostics).filter(([, status]) => !status);
      
      if (issues.length === 0) {
        Utils.NotificationManager.success('All systems operational');
      } else {
        Utils.NotificationManager.warning(`Issues found: ${issues.map(([name]) => name).join(', ')}`);
      }
      
      AdminPanel.logAction('diagnostics', 'completed', diagnostics);
    }, 2000);
  };

  // Feature Showcase Component
  const FeatureShowcase = () => {
    const [activeDemo, setActiveDemo] = React.useState('overview');

    const demos = [
      { id: 'overview', name: 'Overview', icon: '🎯' },
      { id: 'multicurrency', name: 'Multi-Currency', icon: '💱' },
      { id: 'ai-insights', name: 'AI Insights', icon: '🤖' },
      { id: 'import-export', name: 'Import/Export', icon: '📤' },
      { id: 'gamification', name: 'Gamification', icon: '🎮' },
      { id: 'security', name: 'Security', icon: '🔐' },
      { id: 'collaboration', name: 'Collaboration', icon: '👥' }
    ];

    const renderDemo = () => {
      switch (activeDemo) {
        case 'overview':
          return React.createElement('div', { className: 'prose max-w-none' },
            React.createElement('h2', null, 'Welcome to Finance Dashboard v3.1.0'),
            React.createElement('p', null, 
              'This showcase demonstrates all the new features added in Phase 3:'
            ),
            React.createElement('ul', null,
              React.createElement('li', null, 'Multi-currency support with real-time exchange rates'),
              React.createElement('li', null, 'AI-powered financial insights and predictions'),
              React.createElement('li', null, 'Comprehensive data import/export capabilities'),
              React.createElement('li', null, 'Progressive Web App with offline support'),
              React.createElement('li', null, 'Advanced security features including 2FA'),
              React.createElement('li', null, 'Gamification to encourage better financial habits'),
              React.createElement('li', null, 'Real-time collaboration features')
            )
          );
          
        case 'multicurrency':
          const MultiCurrency = window.FinanceApp.InternationalFeatures?.MultiCurrencyAccount;
          return MultiCurrency ? React.createElement(MultiCurrency) : null;
          
        case 'ai-insights':
          const AIInsights = window.FinanceApp.AdvancedFeatures?.AIInsights;
          return AIInsights ? React.createElement(AIInsights) : null;
          
        case 'import-export':
          const ImportWizard = window.FinanceApp.IntegrationFeatures?.ImportWizard;
          return ImportWizard ? React.createElement(ImportWizard, {
            onComplete: (data) => Utils.NotificationManager.success('Import completed!'),
            onCancel: () => setActiveDemo('overview')
          }) : null;
          
        case 'gamification':
          const AchievementShowcase = window.FinanceApp.GamificationFeatures?.ProgressComponents?.AchievementShowcase;
          return AchievementShowcase ? React.createElement(AchievementShowcase, {
            userId: 'demo-user'
          }) : null;
          
        case 'security':
          const TwoFactorSetup = window.FinanceApp.SecurityFeatures?.SecurityComponents?.TwoFactorSetup;
          return TwoFactorSetup ? React.createElement(TwoFactorSetup, {
            userId: 'demo-user',
            onComplete: () => Utils.NotificationManager.success('2FA setup complete!')
          }) : null;
          
        case 'collaboration':
          const ActivityFeed = window.FinanceApp.AdvancedFeatures?.CollaborationComponents?.ActivityFeed;
          return ActivityFeed ? React.createElement(ActivityFeed) : null;
          
        default:
          return null;
      }
    };

    return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
      React.createElement('div', { className: 'bg-white shadow-sm border-b' },
        React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
          React.createElement('h1', { className: 'text-2xl font-bold py-4' }, 
            'Feature Showcase'
          ),
          React.createElement('div', { className: 'flex space-x-4 overflow-x-auto pb-2' },
            demos.map(demo =>
              React.createElement('button', {
                key: demo.id,
                onClick: () => setActiveDemo(demo.id),
                className: `px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeDemo === demo.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`
              },
                React.createElement('span', { className: 'mr-2' }, demo.icon),
                demo.name
              )
            )
          )
        )
      ),
      
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
        renderDemo()
      )
    );
  };

  // Export complete Phase 3 integration
  window.FinanceApp.Phase3Complete = {
    // Admin Panel
    AdminPanel,
    
    // Feature Showcase
    FeatureShowcase,
    
    // Version info
    version: '3.1.0',
    
    // Check system status
    getSystemStatus: () => {
      const Phase3Integration = window.FinanceApp.Phase3Integration;
      
      return {
        featuresLoaded: Phase3Integration?.utils.areAllFeaturesLoaded() || false,
        adminEnabled: AdminPanel.adminState.authenticated,
        version: '3.1.0',
        buildDate: new Date().toISOString()
      };
    }
  };

  console.log('Finance Dashboard v3.1.0 - Phase 3 Complete');

})(window);