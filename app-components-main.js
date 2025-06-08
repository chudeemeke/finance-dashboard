/**
 * Family Finance Dashboard v3.1.0
 * Main Layout Components
 * 
 * This file contains the main layout components including:
 * - MainLayout: App shell with navigation and sidebar
 * - Dashboard: Overview with charts and metrics  
 * - Navigation: Responsive navigation with role-based menu items
 * - Header: User info, notifications, and quick actions
 * - Footer: App info and links
 * 
 * Dependencies:
 * - React 18.2.0
 * - Tailwind CSS
 * - Recharts 2.5.0
 * - Lucide Icons
 * - app-state.js (State Management)
 * - app-components-auth.js (Auth Components)
 */

(function() {
  'use strict';

  const { React, lucideReact: Icons, Recharts } = window;
  const { createElement: h, useState, useEffect, useMemo, useCallback, Fragment } = React;
  const { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
  } = Recharts;

  // Get global app objects
  const { CONFIG, Utils, useFinance, StateSelectors, AuthComponents } = window.FinanceApp;
  const { formatCurrency, formatDate, formatRelativeTime } = Utils.DateUtils;
  const { NotificationManager } = Utils;

  /**
   * Navigation Component - Responsive navigation with role-based menu items
   * @component
   */
  const Navigation = () => {
    const { state, actions } = useFinance();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    
    const currentUser = state.auth.currentUser;
    const userRole = currentUser?.role || 'viewer';

    // Define navigation items with role-based access
    const navigationItems = useMemo(() => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Icons.LayoutDashboard,
        path: '#dashboard',
        roles: ['admin', 'editor', 'viewer']
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: Icons.Receipt,
        path: '#transactions',
        roles: ['admin', 'editor', 'viewer'],
        submenu: [
          { id: 'all', label: 'All Transactions', path: '#transactions/all' },
          { id: 'add', label: 'Add Transaction', path: '#transactions/add', roles: ['admin', 'editor'] },
          { id: 'categories', label: 'Categories', path: '#transactions/categories' }
        ]
      },
      {
        id: 'budgets',
        label: 'Budgets',
        icon: Icons.PieChart,
        path: '#budgets',
        roles: ['admin', 'editor', 'viewer'],
        submenu: [
          { id: 'overview', label: 'Budget Overview', path: '#budgets/overview' },
          { id: 'create', label: 'Create Budget', path: '#budgets/create', roles: ['admin', 'editor'] },
          { id: 'reports', label: 'Budget Reports', path: '#budgets/reports' }
        ]
      },
      {
        id: 'bills',
        label: 'Bills & Payments',
        icon: Icons.Calendar,
        path: '#bills',
        roles: ['admin', 'editor', 'viewer']
      },
      {
        id: 'savings',
        label: 'Savings Goals',
        icon: Icons.Target,
        path: '#savings',
        roles: ['admin', 'editor', 'viewer']
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: Icons.FileText,
        path: '#reports',
        roles: ['admin', 'editor', 'viewer']
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Icons.Settings,
        path: '#settings',
        roles: ['admin']
      }
    ], []);

    // Filter navigation items based on user role
    const accessibleItems = navigationItems.filter(item => 
      item.roles.includes(userRole)
    );

    const handleNavClick = (item, e) => {
      e.preventDefault();
      if (item.submenu) {
        setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
      } else {
        actions.ui.setActiveView(item.id);
        setIsMobileMenuOpen(false);
        setActiveSubmenu(null);
      }
    };

    const NavItem = ({ item, isMobile = false }) => {
      const Icon = item.icon;
      const isActive = state.ui.activeView === item.id;
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isSubmenuOpen = activeSubmenu === item.id;

      return h('div', { key: item.id, className: 'relative' },
        h('a', {
          href: item.path,
          onClick: (e) => handleNavClick(item, e),
          className: `
            flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
            ${isActive 
              ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            }
            ${isMobile ? 'text-base' : 'text-sm'}
          `
        },
          h('div', { className: 'flex items-center space-x-3' },
            h(Icon, { size: isMobile ? 20 : 18 }),
            h('span', { className: 'font-medium' }, item.label)
          ),
          hasSubmenu && h(Icons.ChevronDown, { 
            size: 16,
            className: `transform transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`
          })
        ),
        
        // Submenu
        hasSubmenu && isSubmenuOpen && h('div', {
          className: `
            ${isMobile ? 'ml-4 mt-1' : 'absolute left-0 mt-1 w-48 z-50'}
            bg-white rounded-lg shadow-lg border border-gray-200
            animate-in slide-in-from-top-1 duration-200
          `
        },
          item.submenu
            .filter(subItem => !subItem.roles || subItem.roles.includes(userRole))
            .map(subItem => 
              h('a', {
                key: subItem.id,
                href: subItem.path,
                onClick: (e) => {
                  e.preventDefault();
                  actions.ui.setActiveView(`${item.id}/${subItem.id}`);
                  setIsMobileMenuOpen(false);
                },
                className: `
                  block px-4 py-2 text-sm text-gray-700
                  hover:bg-gray-100 hover:text-blue-600
                  transition-colors duration-150
                  first:rounded-t-lg last:rounded-b-lg
                `
              }, subItem.label)
            )
        )
      );
    };

    return h('nav', { className: 'relative' },
      // Desktop Navigation
      h('div', { className: 'hidden lg:block space-y-1' },
        accessibleItems.map(item => h(NavItem, { item, key: item.id }))
      ),

      // Mobile Menu Button
      h('button', {
        onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
        className: 'lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors'
      },
        h(isMobileMenuOpen ? Icons.X : Icons.Menu, { size: 24 })
      ),

      // Mobile Navigation
      isMobileMenuOpen && h('div', {
        className: `
          lg:hidden absolute top-full left-0 right-0 mt-2
          bg-white rounded-lg shadow-xl border border-gray-200
          p-4 space-y-1 z-50
          animate-in slide-in-from-top-2 duration-200
        `
      },
        accessibleItems.map(item => h(NavItem, { item, isMobile: true, key: item.id }))
      )
    );
  };

  /**
   * Header Component - User info, notifications, and quick actions
   * @component
   */
  const Header = () => {
    const { state, actions } = useFinance();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    
    const currentUser = state.auth.currentUser;
    const notifications = state.ui.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
      actions.auth.logout();
      NotificationManager.success('Logged out successfully');
    };

    const QuickAction = ({ icon: Icon, label, onClick, badge }) => (
      h('button', {
        onClick,
        className: `
          relative p-2 rounded-lg hover:bg-gray-100 transition-colors
          group flex items-center space-x-1
        `
      },
        h(Icon, { 
          size: 20,
          className: 'text-gray-600 group-hover:text-blue-600 transition-colors'
        }),
        h('span', { className: 'hidden sm:inline text-sm text-gray-600 group-hover:text-blue-600' }, label),
        badge > 0 && h('span', {
          className: `
            absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white
            text-xs rounded-full flex items-center justify-center
            animate-in zoom-in duration-200
          `
        }, badge)
      )
    );

    return h('header', {
      className: `
        bg-white border-b border-gray-200 px-4 py-3
        flex items-center justify-between
        sticky top-0 z-40 backdrop-blur-sm bg-white/95
      `
    },
      // Left side - Logo and Search
      h('div', { className: 'flex items-center space-x-4 flex-1' },
        h('div', { className: 'flex items-center space-x-2' },
          h(Icons.DollarSign, { 
            size: 32,
            className: 'text-blue-600 animate-pulse'
          }),
          h('div', {},
            h('h1', { className: 'text-xl font-bold text-gray-900' }, 'Finance Dashboard'),
            h('p', { className: 'text-xs text-gray-500' }, 'v3.1.0')
          )
        ),
        
        // Search Bar
        h('div', { className: 'hidden md:flex flex-1 max-w-md ml-8' },
          h('div', { className: 'relative w-full' },
            h(Icons.Search, {
              size: 18,
              className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            }),
            h('input', {
              type: 'search',
              placeholder: 'Search transactions, budgets...',
              className: `
                w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
              `
            })
          )
        )
      ),

      // Right side - Quick actions and user menu
      h('div', { className: 'flex items-center space-x-2' },
        // Quick Actions
        h(QuickAction, {
          icon: Icons.Plus,
          label: 'Add',
          onClick: () => actions.ui.setActiveView('transactions/add')
        }),
        h(QuickAction, {
          icon: Icons.Bell,
          label: 'Notifications',
          badge: unreadCount,
          onClick: () => setShowNotifications(!showNotifications)
        }),
        
        // User Menu
        h('div', { className: 'relative ml-3' },
          h('button', {
            onClick: () => setShowUserMenu(!showUserMenu),
            className: `
              flex items-center space-x-2 p-2 rounded-lg
              hover:bg-gray-100 transition-colors
            `
          },
            h(AuthComponents.UserAvatar, { user: currentUser, size: 'sm' }),
            h('div', { className: 'hidden sm:block text-left' },
              h('p', { className: 'text-sm font-medium text-gray-900' }, currentUser?.name),
              h('p', { className: 'text-xs text-gray-500' }, currentUser?.role)
            ),
            h(Icons.ChevronDown, { size: 16 })
          ),

          // User Dropdown Menu
          showUserMenu && h('div', {
            className: `
              absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg
              border border-gray-200 py-1 z-50
              animate-in slide-in-from-top-1 duration-200
            `
          },
            h('a', {
              href: '#profile',
              className: 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
            },
              h(Icons.User, { size: 16, className: 'mr-2' }),
              'Profile'
            ),
            h('a', {
              href: '#settings',
              className: 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
            },
              h(Icons.Settings, { size: 16, className: 'mr-2' }),
              'Settings'
            ),
            h('hr', { className: 'my-1 border-gray-200' }),
            h('button', {
              onClick: handleLogout,
              className: 'flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'
            },
              h(Icons.LogOut, { size: 16, className: 'mr-2' }),
              'Logout'
            )
          )
        ),

        // Notifications Dropdown
        showNotifications && h('div', {
          className: `
            absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg
            border border-gray-200 z-50
            animate-in slide-in-from-top-1 duration-200
          `
        },
          h('div', { className: 'p-4 border-b border-gray-200' },
            h('h3', { className: 'text-lg font-semibold' }, 'Notifications'),
            unreadCount > 0 && h('p', { className: 'text-sm text-gray-500' }, 
              `${unreadCount} unread`
            )
          ),
          h('div', { className: 'max-h-80 overflow-y-auto' },
            notifications.length === 0 
              ? h('p', { className: 'p-4 text-center text-gray-500' }, 'No notifications')
              : notifications.map((notification, index) => 
                  h('div', {
                    key: index,
                    className: `
                      p-4 hover:bg-gray-50 cursor-pointer
                      ${!notification.read ? 'bg-blue-50' : ''}
                      ${index < notifications.length - 1 ? 'border-b border-gray-200' : ''}
                    `
                  },
                    h('div', { className: 'flex items-start space-x-3' },
                      h('div', { 
                        className: `
                          p-2 rounded-full
                          ${notification.type === 'success' ? 'bg-green-100 text-green-600' : ''}
                          ${notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : ''}
                          ${notification.type === 'error' ? 'bg-red-100 text-red-600' : ''}
                          ${notification.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                        `
                      },
                        h(Icons.Bell, { size: 16 })
                      ),
                      h('div', { className: 'flex-1' },
                        h('p', { className: 'text-sm font-medium text-gray-900' }, 
                          notification.title
                        ),
                        h('p', { className: 'text-xs text-gray-500 mt-1' }, 
                          notification.message
                        ),
                        h('p', { className: 'text-xs text-gray-400 mt-1' }, 
                          formatRelativeTime(notification.timestamp)
                        )
                      )
                    )
                  )
                )
          ),
          h('div', { className: 'p-3 border-t border-gray-200' },
            h('button', {
              onClick: () => {
                actions.ui.clearNotifications();
                setShowNotifications(false);
              },
              className: 'text-sm text-blue-600 hover:text-blue-700'
            }, 'Clear all')
          )
        )
      )
    );
  };

  /**
   * Footer Component - App info and links
   * @component
   */
  const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    const FooterLink = ({ href, children }) => 
      h('a', {
        href,
        className: 'text-gray-500 hover:text-gray-700 transition-colors'
      }, children);

    return h('footer', {
      className: `
        bg-gray-50 border-t border-gray-200 px-6 py-8
        mt-auto
      `
    },
      h('div', { className: 'max-w-7xl mx-auto' },
        h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-8' },
          // Company Info
          h('div', {},
            h('div', { className: 'flex items-center space-x-2 mb-4' },
              h(Icons.DollarSign, { size: 24, className: 'text-blue-600' }),
              h('span', { className: 'font-bold text-lg' }, 'Finance Dashboard')
            ),
            h('p', { className: 'text-sm text-gray-600' }, 
              'Your personal finance management solution. Track expenses, manage budgets, and achieve your financial goals.'
            ),
            h('p', { className: 'text-xs text-gray-500 mt-2' }, 
              `© ${currentYear} All rights reserved.`
            )
          ),

          // Quick Links
          h('div', {},
            h('h3', { className: 'font-semibold text-gray-900 mb-4' }, 'Quick Links'),
            h('ul', { className: 'space-y-2' },
              h('li', {}, h(FooterLink, { href: '#dashboard' }, 'Dashboard')),
              h('li', {}, h(FooterLink, { href: '#transactions' }, 'Transactions')),
              h('li', {}, h(FooterLink, { href: '#budgets' }, 'Budgets')),
              h('li', {}, h(FooterLink, { href: '#reports' }, 'Reports'))
            )
          ),

          // Support
          h('div', {},
            h('h3', { className: 'font-semibold text-gray-900 mb-4' }, 'Support'),
            h('ul', { className: 'space-y-2' },
              h('li', {}, h(FooterLink, { href: '#help' }, 'Help Center')),
              h('li', {}, h(FooterLink, { href: '#docs' }, 'Documentation')),
              h('li', {}, h(FooterLink, { href: '#contact' }, 'Contact Us')),
              h('li', {}, h(FooterLink, { href: '#feedback' }, 'Send Feedback'))
            )
          ),

          // Connect
          h('div', {},
            h('h3', { className: 'font-semibold text-gray-900 mb-4' }, 'Connect'),
            h('p', { className: 'text-sm text-gray-600 mb-4' }, 
              'Stay updated with our latest features and financial tips.'
            ),
            h('div', { className: 'flex space-x-4' },
              h('a', {
                href: '#',
                className: 'text-gray-400 hover:text-gray-600 transition-colors'
              }, h(Icons.Twitter, { size: 20 })),
              h('a', {
                href: '#',
                className: 'text-gray-400 hover:text-gray-600 transition-colors'
              }, h(Icons.Facebook, { size: 20 })),
              h('a', {
                href: '#',
                className: 'text-gray-400 hover:text-gray-600 transition-colors'
              }, h(Icons.Linkedin, { size: 20 })),
              h('a', {
                href: '#',
                className: 'text-gray-400 hover:text-gray-600 transition-colors'
              }, h(Icons.Github, { size: 20 }))
            )
          )
        ),

        // Bottom Bar
        h('div', { 
          className: 'mt-8 pt-8 border-t border-gray-200 flex flex-wrap justify-between items-center'
        },
          h('div', { className: 'flex flex-wrap gap-4 text-sm text-gray-500' },
            h(FooterLink, { href: '#privacy' }, 'Privacy Policy'),
            h(FooterLink, { href: '#terms' }, 'Terms of Service'),
            h(FooterLink, { href: '#cookies' }, 'Cookie Policy')
          ),
          h('div', { className: 'text-sm text-gray-500' },
            'Version 3.1.0 • Built with ❤️'
          )
        )
      )
    );
  };

  /**
   * Dashboard Component - Overview with charts and metrics
   * @component
   */
  const Dashboard = () => {
    const { state, selectors } = useFinance();
    const [timeRange, setTimeRange] = useState('month'); // week, month, year
    const [isLoading, setIsLoading] = useState(true);

    // Get financial summary
    const summary = selectors.getFinancialSummary(state);
    const monthlyTrends = selectors.getMonthlyTrends(state);
    const categoryBreakdown = selectors.getCategoryBreakdown(state);
    const upcomingBills = selectors.getUpcomingBills(state);
    const savingsProgress = selectors.getSavingsProgress(state);

    useEffect(() => {
      // Simulate loading
      setTimeout(() => setIsLoading(false), 500);
    }, []);

    // Metric Card Component
    const MetricCard = ({ title, value, change, icon: Icon, color = 'blue', trend }) => (
      h('div', {
        className: `
          bg-white rounded-xl shadow-sm border border-gray-200
          p-6 hover:shadow-md transition-all duration-300
          group cursor-pointer
        `
      },
        h('div', { className: 'flex items-center justify-between mb-4' },
          h('div', {
            className: `
              p-3 rounded-lg bg-${color}-100 text-${color}-600
              group-hover:scale-110 transition-transform duration-300
            `
          },
            h(Icon, { size: 24 })
          ),
          trend && h('div', {
            className: `
              flex items-center space-x-1 text-sm
              ${trend > 0 ? 'text-green-600' : 'text-red-600'}
            `
          },
            h(trend > 0 ? Icons.TrendingUp : Icons.TrendingDown, { size: 16 }),
            h('span', {}, `${Math.abs(trend)}%`)
          )
        ),
        h('h3', { className: 'text-sm font-medium text-gray-500' }, title),
        h('p', { className: 'text-2xl font-bold text-gray-900 mt-1' }, value),
        change && h('p', { 
          className: `text-sm mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`
        }, 
          `${change > 0 ? '+' : ''}${formatCurrency(change)} from last ${timeRange}`
        )
      )
    );

    // Chart Card Component
    const ChartCard = ({ title, children, actions }) => (
      h('div', {
        className: `
          bg-white rounded-xl shadow-sm border border-gray-200
          p-6 hover:shadow-md transition-shadow duration-300
        `
      },
        h('div', { className: 'flex items-center justify-between mb-6' },
          h('h3', { className: 'text-lg font-semibold text-gray-900' }, title),
          actions
        ),
        children
      )
    );

    if (isLoading) {
      return h('div', { className: 'flex items-center justify-center h-64' },
        h('div', { className: 'text-center' },
          h(Icons.Loader2, { 
            size: 48,
            className: 'animate-spin text-blue-600 mx-auto mb-4'
          }),
          h('p', { className: 'text-gray-500' }, 'Loading dashboard...')
        )
      );
    }

    return h('div', { className: 'p-6 space-y-6' },
      // Dashboard Header
      h('div', { className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 
            `Welcome back, ${state.auth.currentUser?.name}!`
          ),
          h('p', { className: 'text-gray-500 mt-1' }, 
            `Here's your financial overview for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          )
        ),
        h('div', { className: 'flex items-center space-x-2 mt-4 sm:mt-0' },
          // Time Range Selector
          h('select', {
            value: timeRange,
            onChange: (e) => setTimeRange(e.target.value),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              bg-white text-sm
            `
          },
            h('option', { value: 'week' }, 'This Week'),
            h('option', { value: 'month' }, 'This Month'),
            h('option', { value: 'year' }, 'This Year')
          ),
          h('button', {
            className: `
              p-2 rounded-lg hover:bg-gray-100 transition-colors
              text-gray-600 hover:text-gray-900
            `
          },
            h(Icons.RefreshCw, { size: 20 })
          )
        )
      ),

      // Metrics Grid
      h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' },
        h(MetricCard, {
          title: 'Total Balance',
          value: formatCurrency(summary.totalBalance),
          change: summary.balanceChange,
          icon: Icons.Wallet,
          color: 'blue',
          trend: 5.2
        }),
        h(MetricCard, {
          title: 'Monthly Income',
          value: formatCurrency(summary.monthlyIncome),
          change: summary.incomeChange,
          icon: Icons.TrendingUp,
          color: 'green',
          trend: 12.5
        }),
        h(MetricCard, {
          title: 'Monthly Expenses',
          value: formatCurrency(summary.monthlyExpenses),
          change: summary.expenseChange,
          icon: Icons.TrendingDown,
          color: 'red',
          trend: -3.2
        }),
        h(MetricCard, {
          title: 'Savings Rate',
          value: `${summary.savingsRate}%`,
          icon: Icons.PiggyBank,
          color: 'purple',
          trend: 8.7
        })
      ),

      // Charts Row
      h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
        // Income vs Expenses Chart
        h(ChartCard, {
          title: 'Income vs Expenses Trend',
          actions: h('div', { className: 'flex space-x-2' },
            h('button', { className: 'text-sm text-gray-500 hover:text-gray-700' }, 'Export'),
            h('button', { className: 'text-sm text-gray-500 hover:text-gray-700' }, 'Details')
          )
        },
          h(ResponsiveContainer, { width: '100%', height: 300 },
            h(LineChart, { data: monthlyTrends },
              h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
              h(XAxis, { dataKey: 'month', stroke: '#6b7280' }),
              h(YAxis, { stroke: '#6b7280' }),
              h(Tooltip, {
                contentStyle: { 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }
              }),
              h(Legend, { wrapperStyle: { paddingTop: '20px' } }),
              h(Line, {
                type: 'monotone',
                dataKey: 'income',
                stroke: '#10b981',
                strokeWidth: 2,
                dot: { fill: '#10b981', r: 4 },
                activeDot: { r: 6 }
              }),
              h(Line, {
                type: 'monotone',
                dataKey: 'expenses',
                stroke: '#ef4444',
                strokeWidth: 2,
                dot: { fill: '#ef4444', r: 4 },
                activeDot: { r: 6 }
              })
            )
          )
        ),

        // Category Breakdown Chart
        h(ChartCard, {
          title: 'Spending by Category'
        },
          h(ResponsiveContainer, { width: '100%', height: 300 },
            h(PieChart, {},
              h(Pie, {
                data: categoryBreakdown,
                cx: '50%',
                cy: '50%',
                labelLine: false,
                label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`,
                outerRadius: 100,
                fill: '#8884d8',
                dataKey: 'value'
              },
                categoryBreakdown.map((entry, index) => 
                  h(Cell, { 
                    key: `cell-${index}`,
                    fill: CONFIG.CHART_COLORS[index % CONFIG.CHART_COLORS.length]
                  })
                )
              ),
              h(Tooltip, {
                formatter: (value) => formatCurrency(value),
                contentStyle: { 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }
              })
            )
          )
        )
      ),

      // Bottom Section
      h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
        // Upcoming Bills
        h('div', {
          className: `
            bg-white rounded-xl shadow-sm border border-gray-200
            p-6 hover:shadow-md transition-shadow duration-300
          `
        },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Upcoming Bills'),
            h('a', { 
              href: '#bills',
              className: 'text-sm text-blue-600 hover:text-blue-700'
            }, 'View all')
          ),
          h('div', { className: 'space-y-3' },
            upcomingBills.slice(0, 5).map((bill, index) => 
              h('div', {
                key: index,
                className: 'flex items-center justify-between p-3 rounded-lg hover:bg-gray-50'
              },
                h('div', { className: 'flex items-center space-x-3' },
                  h('div', {
                    className: `
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${bill.isPaid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                    `
                  },
                    h(Icons.Receipt, { size: 16 })
                  ),
                  h('div', {},
                    h('p', { className: 'font-medium text-gray-900' }, bill.name),
                    h('p', { className: 'text-sm text-gray-500' }, 
                      `Due ${formatDate(bill.dueDate, 'MMM dd')}`
                    )
                  )
                ),
                h('p', { className: 'font-semibold text-gray-900' }, 
                  formatCurrency(bill.amount)
                )
              )
            )
          )
        ),

        // Savings Goals Progress
        h('div', {
          className: `
            bg-white rounded-xl shadow-sm border border-gray-200
            p-6 hover:shadow-md transition-shadow duration-300
          `
        },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Savings Goals'),
            h('a', { 
              href: '#savings',
              className: 'text-sm text-blue-600 hover:text-blue-700'
            }, 'Manage')
          ),
          h('div', { className: 'space-y-4' },
            savingsProgress.slice(0, 3).map((goal, index) => 
              h('div', { key: index },
                h('div', { className: 'flex items-center justify-between mb-2' },
                  h('span', { className: 'text-sm font-medium text-gray-700' }, goal.name),
                  h('span', { className: 'text-sm text-gray-500' }, 
                    `${goal.progress}%`
                  )
                ),
                h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                  h('div', {
                    className: 'bg-blue-600 h-2 rounded-full transition-all duration-500',
                    style: { width: `${goal.progress}%` }
                  })
                ),
                h('p', { className: 'text-xs text-gray-500 mt-1' },
                  `${formatCurrency(goal.current)} of ${formatCurrency(goal.target)}`
                )
              )
            )
          )
        ),

        // Quick Actions
        h('div', {
          className: `
            bg-gradient-to-br from-blue-500 to-blue-600
            rounded-xl shadow-sm p-6 text-white
          `
        },
          h('h3', { className: 'text-lg font-semibold mb-4' }, 'Quick Actions'),
          h('div', { className: 'grid grid-cols-2 gap-3' },
            [
              { icon: Icons.Plus, label: 'Add Transaction', action: 'transactions/add' },
              { icon: Icons.Target, label: 'New Goal', action: 'savings/new' },
              { icon: Icons.FileText, label: 'Reports', action: 'reports' },
              { icon: Icons.Settings, label: 'Settings', action: 'settings' }
            ].map((item, index) => 
              h('button', {
                key: index,
                onClick: () => window.location.hash = `#${item.action}`,
                className: `
                  flex flex-col items-center justify-center p-4
                  bg-white/10 backdrop-blur-sm rounded-lg
                  hover:bg-white/20 transition-all duration-200
                  group
                `
              },
                h(item.icon, { 
                  size: 24,
                  className: 'mb-2 group-hover:scale-110 transition-transform'
                }),
                h('span', { className: 'text-sm' }, item.label)
              )
            )
          )
        )
      )
    );
  };

  /**
   * MainLayout Component - App shell with navigation and sidebar
   * @component
   */
  const MainLayout = ({ children }) => {
    const { state } = useFinance();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setIsSidebarOpen(false);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Render current view based on state
    const renderContent = () => {
      const view = state.ui.activeView || 'dashboard';
      
      switch (view) {
        case 'dashboard':
          return h(Dashboard);
        case 'transactions':
        case 'transactions/all':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Transactions')
          );
        case 'transactions/add':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Add Transaction')
          );
        case 'budgets':
        case 'budgets/overview':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Budgets')
          );
        case 'bills':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Bills & Payments')
          );
        case 'savings':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Savings Goals')
          );
        case 'reports':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Reports')
          );
        case 'settings':
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Settings')
          );
        default:
          return h('div', { className: 'p-6' }, 
            h('h2', { className: 'text-2xl font-bold' }, 'Page Not Found')
          );
      }
    };

    return h('div', { className: 'min-h-screen bg-gray-50 flex flex-col' },
      // Header
      h(Header),

      // Main Content Area
      h('div', { className: 'flex flex-1 overflow-hidden' },
        // Sidebar
        h('aside', {
          className: `
            ${isSidebarOpen ? 'w-64' : 'w-0'}
            ${isMobile ? 'absolute' : 'relative'}
            bg-white border-r border-gray-200
            transition-all duration-300 ease-in-out
            overflow-hidden z-30
            ${isMobile && isSidebarOpen ? 'shadow-xl' : ''}
          `
        },
          h('div', { className: 'p-4 h-full overflow-y-auto' },
            h(Navigation)
          )
        ),

        // Sidebar Toggle (Mobile)
        isMobile && h('button', {
          onClick: () => setIsSidebarOpen(!isSidebarOpen),
          className: `
            fixed bottom-4 left-4 z-40
            p-3 bg-blue-600 text-white rounded-full shadow-lg
            hover:bg-blue-700 transition-colors
          `
        },
          h(isSidebarOpen ? Icons.X : Icons.Menu, { size: 24 })
        ),

        // Main Content
        h('main', { 
          className: 'flex-1 overflow-y-auto bg-gray-50',
          onClick: () => isMobile && setIsSidebarOpen(false)
        },
          h('div', { className: 'max-w-7xl mx-auto' },
            children || renderContent()
          )
        )
      ),

      // Footer
      h(Footer)
    );
  };

  // Export components to global FinanceApp object
  window.FinanceApp = window.FinanceApp || {};
  window.FinanceApp.MainComponents = {
    MainLayout,
    Dashboard,
    Navigation,
    Header,
    Footer
  };

})();