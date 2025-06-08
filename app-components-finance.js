/**
 * Family Finance Dashboard v3.1.0
 * Financial Components
 * 
 * This file contains all financial-specific components:
 * - TransactionList: Filterable, sortable transaction table
 * - TransactionForm: Add/edit transactions with validation
 * - BudgetManager: Create and track budgets with progress bars
 * - ExpenseTracker: Category-wise expense breakdown
 * - IncomeManager: Track multiple income sources
 * - BillTracker: Upcoming bills with due date alerts
 * - SavingsGoals: Set and track savings goals with contributions
 * - FinancialCharts: Reusable chart components
 * 
 * Dependencies:
 * - React 18.2.0
 * - Tailwind CSS
 * - Recharts 2.5.0
 * - Lucide Icons
 * - app-state.js (State Management)
 * - app-config.js (Configuration)
 */

(function() {
  'use strict';

  const { React, lucideReact: Icons, Recharts } = window;
  const { createElement: h, useState, useEffect, useMemo, useCallback, Fragment } = React;
  const { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
  } = Recharts;

  // Get global app objects
  const { CONFIG, Utils, useFinance, StateSelectors, ActionTypes } = window.FinanceApp;
  const { formatCurrency, formatDate, formatRelativeTime } = Utils.DateUtils;
  const { ValidationUtils, NotificationManager } = Utils;

  /**
   * TransactionList Component - Filterable, sortable transaction table
   * @component
   */
  const TransactionList = () => {
    const { state, actions } = useFinance();
    const [filters, setFilters] = useState({
      search: '',
      category: 'all',
      type: 'all', // income, expense, all
      dateRange: 'month', // today, week, month, year, custom
      sortBy: 'date', // date, amount, category
      sortOrder: 'desc' // asc, desc
    });
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Get filtered and sorted transactions
    const filteredTransactions = useMemo(() => {
      let transactions = [...(state.finance.transactions || [])];

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        transactions = transactions.filter(t => 
          t.description?.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower) ||
          t.payee?.toLowerCase().includes(searchLower)
        );
      }

      // Apply category filter
      if (filters.category !== 'all') {
        transactions = transactions.filter(t => t.category === filters.category);
      }

      // Apply type filter
      if (filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type);
      }

      // Apply date range filter
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      switch (filters.dateRange) {
        case 'today':
          transactions = transactions.filter(t => new Date(t.date) >= startOfDay);
          break;
        case 'week':
          transactions = transactions.filter(t => new Date(t.date) >= startOfWeek);
          break;
        case 'month':
          transactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
          break;
        case 'year':
          transactions = transactions.filter(t => new Date(t.date) >= startOfYear);
          break;
      }

      // Apply sorting
      transactions.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(b.date) - new Date(a.date);
            break;
          case 'amount':
            comparison = b.amount - a.amount;
            break;
          case 'category':
            comparison = (a.category || '').localeCompare(b.category || '');
            break;
        }
        return filters.sortOrder === 'asc' ? -comparison : comparison;
      });

      return transactions;
    }, [state.finance.transactions, filters]);

    // Pagination
    const paginatedTransactions = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Handle bulk operations
    const handleBulkDelete = () => {
      if (confirm(`Delete ${selectedTransactions.length} transactions?`)) {
        selectedTransactions.forEach(id => {
          actions.finance.deleteTransaction(id);
        });
        setSelectedTransactions([]);
        NotificationManager.success('Transactions deleted successfully');
      }
    };

    const handleSelectAll = (checked) => {
      if (checked) {
        setSelectedTransactions(paginatedTransactions.map(t => t.id));
      } else {
        setSelectedTransactions([]);
      }
    };

    const handleSelectTransaction = (id, checked) => {
      if (checked) {
        setSelectedTransactions([...selectedTransactions, id]);
      } else {
        setSelectedTransactions(selectedTransactions.filter(tid => tid !== id));
      }
    };

    // Filter Controls Component
    const FilterControls = () => (
      h('div', { className: 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4' },
        h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4' },
          // Search
          h('div', { className: 'relative' },
            h(Icons.Search, {
              size: 18,
              className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            }),
            h('input', {
              type: 'search',
              placeholder: 'Search transactions...',
              value: filters.search,
              onChange: (e) => setFilters({ ...filters, search: e.target.value }),
              className: `
                w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `
            })
          ),

          // Category Filter
          h('select', {
            value: filters.category,
            onChange: (e) => setFilters({ ...filters, category: e.target.value }),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'all' }, 'All Categories'),
            CONFIG.CATEGORIES.map(cat => 
              h('option', { key: cat.id, value: cat.id }, cat.name)
            )
          ),

          // Type Filter
          h('select', {
            value: filters.type,
            onChange: (e) => setFilters({ ...filters, type: e.target.value }),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'all' }, 'All Types'),
            h('option', { value: 'income' }, 'Income'),
            h('option', { value: 'expense' }, 'Expense')
          ),

          // Date Range Filter
          h('select', {
            value: filters.dateRange,
            onChange: (e) => setFilters({ ...filters, dateRange: e.target.value }),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'today' }, 'Today'),
            h('option', { value: 'week' }, 'This Week'),
            h('option', { value: 'month' }, 'This Month'),
            h('option', { value: 'year' }, 'This Year'),
            h('option', { value: 'all' }, 'All Time')
          ),

          // Sort Controls
          h('div', { className: 'flex space-x-2' },
            h('select', {
              value: filters.sortBy,
              onChange: (e) => setFilters({ ...filters, sortBy: e.target.value }),
              className: `
                flex-1 px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `
            },
              h('option', { value: 'date' }, 'Date'),
              h('option', { value: 'amount' }, 'Amount'),
              h('option', { value: 'category' }, 'Category')
            ),
            h('button', {
              onClick: () => setFilters({ 
                ...filters, 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              }),
              className: `
                p-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
              `
            },
              h(filters.sortOrder === 'asc' ? Icons.SortAsc : Icons.SortDesc, { size: 18 })
            )
          )
        )
      )
    );

    return h('div', { className: 'space-y-4' },
      // Header
      h('div', { className: 'flex items-center justify-between mb-6' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Transactions'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            `${filteredTransactions.length} transactions found`
          )
        ),
        h('div', { className: 'flex items-center space-x-2' },
          selectedTransactions.length > 0 && h('div', { 
            className: 'flex items-center space-x-2 mr-4' 
          },
            h('span', { className: 'text-sm text-gray-500' }, 
              `${selectedTransactions.length} selected`
            ),
            h('button', {
              onClick: handleBulkDelete,
              className: `
                px-3 py-1 bg-red-600 text-white rounded-lg
                hover:bg-red-700 transition-colors text-sm
              `
            }, 'Delete')
          ),
          h('button', {
            onClick: () => actions.ui.setActiveView('transactions/add'),
            className: `
              flex items-center space-x-2 px-4 py-2
              bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 transition-colors
            `
          },
            h(Icons.Plus, { size: 18 }),
            h('span', {}, 'Add Transaction')
          )
        )
      ),

      // Filters
      h(FilterControls),

      // Transaction Table
      h('div', { 
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden' 
      },
        // Table
        h('div', { className: 'overflow-x-auto' },
          h('table', { className: 'w-full' },
            // Header
            h('thead', { className: 'bg-gray-50 border-b border-gray-200' },
              h('tr', {},
                h('th', { className: 'px-6 py-3 text-left' },
                  h('input', {
                    type: 'checkbox',
                    checked: selectedTransactions.length === paginatedTransactions.length,
                    onChange: (e) => handleSelectAll(e.target.checked),
                    className: 'rounded border-gray-300'
                  })
                ),
                h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                  'Date'
                ),
                h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                  'Description'
                ),
                h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                  'Category'
                ),
                h('th', { className: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                  'Amount'
                ),
                h('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase' }, 
                  'Actions'
                )
              )
            ),

            // Body
            h('tbody', { className: 'divide-y divide-gray-200' },
              paginatedTransactions.length === 0 
                ? h('tr', {},
                    h('td', { 
                      colSpan: 6,
                      className: 'px-6 py-12 text-center text-gray-500'
                    }, 
                      h('div', { className: 'flex flex-col items-center' },
                        h(Icons.Receipt, { size: 48, className: 'text-gray-300 mb-4' }),
                        h('p', {}, 'No transactions found'),
                        h('p', { className: 'text-sm mt-1' }, 'Try adjusting your filters')
                      )
                    )
                  )
                : paginatedTransactions.map(transaction => {
                    const category = CONFIG.CATEGORIES.find(c => c.id === transaction.category);
                    const isSelected = selectedTransactions.includes(transaction.id);
                    
                    return h('tr', { 
                      key: transaction.id,
                      className: `
                        hover:bg-gray-50 transition-colors
                        ${isSelected ? 'bg-blue-50' : ''}
                      `
                    },
                      h('td', { className: 'px-6 py-4' },
                        h('input', {
                          type: 'checkbox',
                          checked: isSelected,
                          onChange: (e) => handleSelectTransaction(transaction.id, e.target.checked),
                          className: 'rounded border-gray-300'
                        })
                      ),
                      h('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' },
                        formatDate(transaction.date, 'MMM dd, yyyy')
                      ),
                      h('td', { className: 'px-6 py-4' },
                        h('div', {},
                          h('p', { className: 'text-sm font-medium text-gray-900' }, 
                            transaction.description
                          ),
                          transaction.payee && h('p', { className: 'text-xs text-gray-500' }, 
                            transaction.payee
                          )
                        )
                      ),
                      h('td', { className: 'px-6 py-4' },
                        category && h('span', {
                          className: `
                            inline-flex items-center px-2.5 py-0.5 rounded-full
                            text-xs font-medium
                            ${category.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                            ${category.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                            ${category.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                            ${category.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${category.color === 'purple' ? 'bg-purple-100 text-purple-800' : ''}
                          `
                        },
                          h(Icons[category.icon], { size: 12, className: 'mr-1' }),
                          category.name
                        )
                      ),
                      h('td', { 
                        className: `
                          px-6 py-4 text-right font-medium whitespace-nowrap
                          ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}
                        `
                      },
                        `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`
                      ),
                      h('td', { className: 'px-6 py-4 text-center' },
                        h('div', { className: 'flex items-center justify-center space-x-2' },
                          h('button', {
                            onClick: () => actions.ui.openModal('editTransaction', transaction),
                            className: 'text-gray-400 hover:text-blue-600 transition-colors'
                          },
                            h(Icons.Edit2, { size: 16 })
                          ),
                          h('button', {
                            onClick: () => {
                              if (confirm('Delete this transaction?')) {
                                actions.finance.deleteTransaction(transaction.id);
                              }
                            },
                            className: 'text-gray-400 hover:text-red-600 transition-colors'
                          },
                            h(Icons.Trash2, { size: 16 })
                          )
                        )
                      )
                    );
                  })
            )
          )
        ),

        // Pagination
        filteredTransactions.length > itemsPerPage && h('div', {
          className: 'px-6 py-4 border-t border-gray-200 flex items-center justify-between'
        },
          h('p', { className: 'text-sm text-gray-500' },
            `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of ${filteredTransactions.length} results`
          ),
          h('div', { className: 'flex items-center space-x-2' },
            h('button', {
              onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
              disabled: currentPage === 1,
              className: `
                px-3 py-1 border border-gray-300 rounded-lg
                hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `
            }, 'Previous'),
            Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return h('button', {
                key: page,
                onClick: () => setCurrentPage(page),
                className: `
                  px-3 py-1 rounded-lg transition-colors
                  ${currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-50'
                  }
                `
              }, page);
            }),
            totalPages > 5 && h('span', { className: 'px-2' }, '...'),
            h('button', {
              onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)),
              disabled: currentPage === totalPages,
              className: `
                px-3 py-1 border border-gray-300 rounded-lg
                hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `
            }, 'Next')
          )
        )
      )
    );
  };

  /**
   * TransactionForm Component - Add/edit transactions with validation
   * @component
   */
  const TransactionForm = ({ transaction = null, onClose }) => {
    const { state, actions } = useFinance();
    const [formData, setFormData] = useState({
      type: transaction?.type || 'expense',
      amount: transaction?.amount || '',
      description: transaction?.description || '',
      category: transaction?.category || '',
      date: transaction?.date || new Date().toISOString().split('T')[0],
      payee: transaction?.payee || '',
      notes: transaction?.notes || '',
      recurring: transaction?.recurring || false,
      recurringFrequency: transaction?.recurringFrequency || 'monthly',
      tags: transaction?.tags || []
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
      const newErrors = {};

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }

      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }

      if (!formData.date) {
        newErrors.date = 'Date is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validate()) return;

      setIsSubmitting(true);

      try {
        const transactionData = {
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (transaction) {
          actions.finance.updateTransaction(transaction.id, transactionData);
          NotificationManager.success('Transaction updated successfully');
        } else {
          actions.finance.addTransaction(transactionData);
          NotificationManager.success('Transaction added successfully');
        }

        if (onClose) onClose();
      } catch (error) {
        NotificationManager.error('Failed to save transaction');
      } finally {
        setIsSubmitting(false);
      }
    };

    const FormField = ({ label, error, required = false, children }) => (
      h('div', { className: 'space-y-1' },
        h('label', { className: 'block text-sm font-medium text-gray-700' },
          label,
          required && h('span', { className: 'text-red-500 ml-1' }, '*')
        ),
        children,
        error && h('p', { className: 'text-xs text-red-600 mt-1' }, error)
      )
    );

    return h('form', { onSubmit: handleSubmit, className: 'space-y-6' },
      // Transaction Type Toggle
      h('div', { className: 'flex rounded-lg bg-gray-100 p-1' },
        ['expense', 'income'].map(type => 
          h('button', {
            key: type,
            type: 'button',
            onClick: () => setFormData({ ...formData, type }),
            className: `
              flex-1 py-2 px-4 rounded-md transition-all duration-200
              ${formData.type === type 
                ? 'bg-white shadow-sm font-medium' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `
          },
            type === 'income' ? 'Income' : 'Expense'
          )
        )
      ),

      // Form Grid
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        // Amount
        h(FormField, { label: 'Amount', error: errors.amount, required: true },
          h('div', { className: 'relative' },
            h('span', { 
              className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'
            }, '$'),
            h('input', {
              type: 'number',
              step: '0.01',
              value: formData.amount,
              onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
              className: `
                w-full pl-8 pr-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.amount ? 'border-red-300' : 'border-gray-300'}
              `,
              placeholder: '0.00'
            })
          )
        ),

        // Date
        h(FormField, { label: 'Date', error: errors.date, required: true },
          h('input', {
            type: 'date',
            value: formData.date,
            onChange: (e) => setFormData({ ...formData, date: e.target.value }),
            className: `
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.date ? 'border-red-300' : 'border-gray-300'}
            `
          })
        ),

        // Category
        h(FormField, { label: 'Category', error: errors.category, required: true },
          h('select', {
            value: formData.category,
            onChange: (e) => setFormData({ ...formData, category: e.target.value }),
            className: `
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.category ? 'border-red-300' : 'border-gray-300'}
            `
          },
            h('option', { value: '' }, 'Select category...'),
            CONFIG.CATEGORIES
              .filter(cat => cat.type === formData.type || cat.type === 'both')
              .map(cat => 
                h('option', { key: cat.id, value: cat.id }, cat.name)
              )
          )
        ),

        // Payee
        h(FormField, { label: 'Payee' },
          h('input', {
            type: 'text',
            value: formData.payee,
            onChange: (e) => setFormData({ ...formData, payee: e.target.value }),
            className: `
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `,
            placeholder: 'e.g., Amazon, Walmart'
          })
        )
      ),

      // Description
      h(FormField, { label: 'Description', error: errors.description, required: true },
        h('input', {
          type: 'text',
          value: formData.description,
          onChange: (e) => setFormData({ ...formData, description: e.target.value }),
          className: `
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.description ? 'border-red-300' : 'border-gray-300'}
          `,
          placeholder: 'What was this transaction for?'
        })
      ),

      // Notes
      h(FormField, { label: 'Notes' },
        h('textarea', {
          value: formData.notes,
          onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
          rows: 3,
          className: `
            w-full px-4 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            resize-none
          `,
          placeholder: 'Additional notes...'
        })
      ),

      // Recurring Transaction
      h('div', { className: 'bg-gray-50 p-4 rounded-lg' },
        h('label', { className: 'flex items-center space-x-3 cursor-pointer' },
          h('input', {
            type: 'checkbox',
            checked: formData.recurring,
            onChange: (e) => setFormData({ ...formData, recurring: e.target.checked }),
            className: 'rounded border-gray-300 text-blue-600'
          }),
          h('span', { className: 'text-sm font-medium text-gray-700' }, 
            'This is a recurring transaction'
          )
        ),
        
        formData.recurring && h('div', { className: 'mt-4' },
          h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
            'Frequency'
          ),
          h('select', {
            value: formData.recurringFrequency,
            onChange: (e) => setFormData({ ...formData, recurringFrequency: e.target.value }),
            className: `
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'daily' }, 'Daily'),
            h('option', { value: 'weekly' }, 'Weekly'),
            h('option', { value: 'biweekly' }, 'Bi-weekly'),
            h('option', { value: 'monthly' }, 'Monthly'),
            h('option', { value: 'quarterly' }, 'Quarterly'),
            h('option', { value: 'yearly' }, 'Yearly')
          )
        )
      ),

      // Form Actions
      h('div', { className: 'flex items-center justify-end space-x-3 pt-4' },
        onClose && h('button', {
          type: 'button',
          onClick: onClose,
          className: `
            px-4 py-2 border border-gray-300 rounded-lg
            hover:bg-gray-50 transition-colors
          `
        }, 'Cancel'),
        h('button', {
          type: 'submit',
          disabled: isSubmitting,
          className: `
            px-6 py-2 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 disabled:opacity-50
            transition-colors flex items-center space-x-2
          `
        },
          isSubmitting && h(Icons.Loader2, { size: 16, className: 'animate-spin' }),
          h('span', {}, transaction ? 'Update Transaction' : 'Add Transaction')
        )
      )
    );
  };

  /**
   * BudgetManager Component - Create and track budgets with progress bars
   * @component
   */
  const BudgetManager = () => {
    const { state, actions } = useFinance();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    
    const budgets = state.finance.budgets || [];
    const transactions = state.finance.transactions || [];

    // Calculate budget progress
    const budgetsWithProgress = useMemo(() => {
      return budgets.map(budget => {
        const spent = transactions
          .filter(t => 
            t.type === 'expense' && 
            t.category === budget.category &&
            new Date(t.date) >= new Date(budget.startDate) &&
            new Date(t.date) <= new Date(budget.endDate)
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budget.amount) * 100;
        const daysTotal = Math.ceil((new Date(budget.endDate) - new Date(budget.startDate)) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((new Date() - new Date(budget.startDate)) / (1000 * 60 * 60 * 24));
        const timePercentage = (daysElapsed / daysTotal) * 100;

        return {
          ...budget,
          spent,
          remaining: budget.amount - spent,
          percentage: Math.min(percentage, 100),
          timePercentage: Math.min(timePercentage, 100),
          isOverBudget: spent > budget.amount,
          daysRemaining: Math.max(0, daysTotal - daysElapsed)
        };
      });
    }, [budgets, transactions]);

    const CreateBudgetForm = () => {
      const [formData, setFormData] = useState({
        name: '',
        category: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
      const [errors, setErrors] = useState({});

      const handleSubmit = (e) => {
        e.preventDefault();
        
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }

        actions.finance.addBudget({
          ...formData,
          amount: parseFloat(formData.amount)
        });

        NotificationManager.success('Budget created successfully');
        setShowCreateForm(false);
      };

      return h('div', { 
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6' 
      },
        h('h3', { className: 'text-lg font-semibold mb-4' }, 'Create New Budget'),
        h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Name
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Budget Name'
              ),
              h('input', {
                type: 'text',
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                className: `
                  w-full px-4 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.name ? 'border-red-300' : 'border-gray-300'}
                `,
                placeholder: 'e.g., Monthly Food Budget'
              }),
              errors.name && h('p', { className: 'text-xs text-red-600 mt-1' }, errors.name)
            ),

            // Category
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Category'
              ),
              h('select', {
                value: formData.category,
                onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                className: `
                  w-full px-4 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.category ? 'border-red-300' : 'border-gray-300'}
                `
              },
                h('option', { value: '' }, 'Select category...'),
                CONFIG.CATEGORIES
                  .filter(cat => cat.type === 'expense' || cat.type === 'both')
                  .map(cat => 
                    h('option', { key: cat.id, value: cat.id }, cat.name)
                  )
              ),
              errors.category && h('p', { className: 'text-xs text-red-600 mt-1' }, errors.category)
            ),

            // Amount
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Budget Amount'
              ),
              h('div', { className: 'relative' },
                h('span', { 
                  className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' 
                }, '$'),
                h('input', {
                  type: 'number',
                  step: '0.01',
                  value: formData.amount,
                  onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                  className: `
                    w-full pl-8 pr-4 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.amount ? 'border-red-300' : 'border-gray-300'}
                  `,
                  placeholder: '0.00'
                })
              ),
              errors.amount && h('p', { className: 'text-xs text-red-600 mt-1' }, errors.amount)
            ),

            // Period
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Period'
              ),
              h('select', {
                value: formData.period,
                onChange: (e) => setFormData({ ...formData, period: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: 'weekly' }, 'Weekly'),
                h('option', { value: 'monthly' }, 'Monthly'),
                h('option', { value: 'quarterly' }, 'Quarterly'),
                h('option', { value: 'yearly' }, 'Yearly'),
                h('option', { value: 'custom' }, 'Custom')
              )
            ),

            // Start Date
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Start Date'
              ),
              h('input', {
                type: 'date',
                value: formData.startDate,
                onChange: (e) => setFormData({ ...formData, startDate: e.target.value }),
                className: `
                  w-full px-4 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.startDate ? 'border-red-300' : 'border-gray-300'}
                `
              }),
              errors.startDate && h('p', { className: 'text-xs text-red-600 mt-1' }, errors.startDate)
            ),

            // End Date
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'End Date'
              ),
              h('input', {
                type: 'date',
                value: formData.endDate,
                onChange: (e) => setFormData({ ...formData, endDate: e.target.value }),
                className: `
                  w-full px-4 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.endDate ? 'border-red-300' : 'border-gray-300'}
                `
              }),
              errors.endDate && h('p', { className: 'text-xs text-red-600 mt-1' }, errors.endDate)
            )
          ),

          // Actions
          h('div', { className: 'flex justify-end space-x-3 pt-4' },
            h('button', {
              type: 'button',
              onClick: () => setShowCreateForm(false),
              className: `
                px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
              `
            }, 'Cancel'),
            h('button', {
              type: 'submit',
              className: `
                px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            }, 'Create Budget')
          )
        )
      );
    };

    const BudgetCard = ({ budget }) => {
      const category = CONFIG.CATEGORIES.find(c => c.id === budget.category);
      const progressColor = budget.percentage > 90 ? 'red' : budget.percentage > 70 ? 'yellow' : 'green';
      
      return h('div', {
        className: `
          bg-white rounded-lg shadow-sm border border-gray-200 p-6
          hover:shadow-md transition-all duration-300
        `
      },
        // Header
        h('div', { className: 'flex items-start justify-between mb-4' },
          h('div', { className: 'flex items-center space-x-3' },
            category && h('div', {
              className: `
                p-2 rounded-lg
                ${category.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                ${category.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                ${category.color === 'red' ? 'bg-red-100 text-red-600' : ''}
                ${category.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                ${category.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
              `
            },
              h(Icons[category.icon], { size: 20 })
            ),
            h('div', {},
              h('h3', { className: 'font-semibold text-gray-900' }, budget.name),
              h('p', { className: 'text-sm text-gray-500' }, category?.name)
            )
          ),
          h('button', {
            className: 'text-gray-400 hover:text-gray-600 transition-colors'
          },
            h(Icons.MoreVertical, { size: 20 })
          )
        ),

        // Amount Info
        h('div', { className: 'mb-4' },
          h('div', { className: 'flex items-end justify-between mb-2' },
            h('div', {},
              h('p', { className: 'text-2xl font-bold text-gray-900' }, 
                formatCurrency(budget.spent)
              ),
              h('p', { className: 'text-sm text-gray-500' }, 
                `of ${formatCurrency(budget.amount)}`
              )
            ),
            h('div', { className: 'text-right' },
              h('p', { 
                className: `text-lg font-semibold ${budget.isOverBudget ? 'text-red-600' : 'text-green-600'}`
              }, 
                budget.isOverBudget 
                  ? `-${formatCurrency(Math.abs(budget.remaining))}`
                  : formatCurrency(budget.remaining)
              ),
              h('p', { className: 'text-sm text-gray-500' }, 
                budget.isOverBudget ? 'Over budget' : 'Remaining'
              )
            )
          )
        ),

        // Progress Bar
        h('div', { className: 'mb-4' },
          h('div', { className: 'flex items-center justify-between mb-1' },
            h('span', { className: 'text-sm text-gray-500' }, 'Spent'),
            h('span', { 
              className: `text-sm font-medium
                ${progressColor === 'red' ? 'text-red-600' : ''}
                ${progressColor === 'yellow' ? 'text-yellow-600' : ''}
                ${progressColor === 'green' ? 'text-green-600' : ''}
              `
            }, `${Math.round(budget.percentage)}%`)
          ),
          h('div', { className: 'relative' },
            h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
              h('div', {
                className: `h-2 rounded-full transition-all duration-500
                  ${progressColor === 'red' ? 'bg-red-500' : ''}
                  ${progressColor === 'yellow' ? 'bg-yellow-500' : ''}
                  ${progressColor === 'green' ? 'bg-green-500' : ''}
                `,
                style: { width: `${Math.min(budget.percentage, 100)}%` }
              })
            ),
            // Time indicator
            h('div', {
              className: 'absolute top-0 w-0.5 h-2 bg-gray-400',
              style: { left: `${budget.timePercentage}%` },
              title: `${Math.round(budget.timePercentage)}% of time elapsed`
            })
          )
        ),

        // Footer
        h('div', { className: 'flex items-center justify-between text-sm' },
          h('span', { className: 'text-gray-500' },
            `${budget.daysRemaining} days remaining`
          ),
          h('div', { className: 'flex items-center space-x-3' },
            h('button', { 
              className: 'text-blue-600 hover:text-blue-700 transition-colors' 
            }, 'Details'),
            h('button', { 
              className: 'text-gray-500 hover:text-gray-700 transition-colors' 
            }, 'Edit')
          )
        )
      );
    };

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Budget Manager'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            'Track and manage your spending limits'
          )
        ),
        h('button', {
          onClick: () => setShowCreateForm(!showCreateForm),
          className: `
            flex items-center space-x-2 px-4 py-2
            bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors
          `
        },
          h(Icons.Plus, { size: 18 }),
          h('span', {}, 'Create Budget')
        )
      ),

      // Create Form
      showCreateForm && h(CreateBudgetForm),

      // Period Filter
      h('div', { className: 'flex space-x-2' },
        ['all', 'week', 'month', 'quarter', 'year'].map(period => 
          h('button', {
            key: period,
            onClick: () => setSelectedPeriod(period),
            className: `
              px-4 py-2 rounded-lg transition-colors
              ${selectedPeriod === period 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `
          }, period.charAt(0).toUpperCase() + period.slice(1))
        )
      ),

      // Budgets Grid
      budgetsWithProgress.length === 0
        ? h('div', { 
            className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center' 
          },
            h(Icons.PieChart, { size: 48, className: 'mx-auto text-gray-300 mb-4' }),
            h('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, 
              'No budgets yet'
            ),
            h('p', { className: 'text-gray-500 mb-4' }, 
              'Create your first budget to start tracking your spending'
            ),
            h('button', {
              onClick: () => setShowCreateForm(true),
              className: `
                inline-flex items-center space-x-2 px-4 py-2
                bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            },
              h(Icons.Plus, { size: 18 }),
              h('span', {}, 'Create Budget')
            )
          )
        : h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            budgetsWithProgress.map(budget => 
              h(BudgetCard, { key: budget.id, budget })
            )
          )
    );
  };

  /**
   * ExpenseTracker Component - Category-wise expense breakdown
   * @component
   */
  const ExpenseTracker = () => {
    const { state } = useFinance();
    const [timeRange, setTimeRange] = useState('month');
    const [viewMode, setViewMode] = useState('chart'); // chart, list

    const expenses = useMemo(() => {
      const transactions = state.finance.transactions || [];
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      const filtered = transactions.filter(t => 
        t.type === 'expense' && new Date(t.date) >= startDate
      );

      // Group by category
      const byCategory = filtered.reduce((acc, t) => {
        const category = CONFIG.CATEGORIES.find(c => c.id === t.category);
        if (!category) return acc;

        if (!acc[t.category]) {
          acc[t.category] = {
            id: t.category,
            name: category.name,
            icon: category.icon,
            color: category.color,
            amount: 0,
            count: 0,
            transactions: []
          };
        }

        acc[t.category].amount += t.amount;
        acc[t.category].count += 1;
        acc[t.category].transactions.push(t);

        return acc;
      }, {});

      return Object.values(byCategory).sort((a, b) => b.amount - a.amount);
    }, [state.finance.transactions, timeRange]);

    const totalExpenses = expenses.reduce((sum, cat) => sum + cat.amount, 0);

    const chartData = expenses.map(cat => ({
      name: cat.name,
      value: cat.amount,
      percentage: ((cat.amount / totalExpenses) * 100).toFixed(1)
    }));

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Expense Tracker'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            `Total: ${formatCurrency(totalExpenses)}`
          )
        ),
        h('div', { className: 'flex items-center space-x-4' },
          // Time Range
          h('select', {
            value: timeRange,
            onChange: (e) => setTimeRange(e.target.value),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'week' }, 'This Week'),
            h('option', { value: 'month' }, 'This Month'),
            h('option', { value: 'year' }, 'This Year'),
            h('option', { value: 'all' }, 'All Time')
          ),
          // View Mode
          h('div', { className: 'flex rounded-lg bg-gray-100 p-1' },
            ['chart', 'list'].map(mode => 
              h('button', {
                key: mode,
                onClick: () => setViewMode(mode),
                className: `
                  px-3 py-1 rounded-md transition-all duration-200
                  ${viewMode === mode 
                    ? 'bg-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `
              },
                mode === 'chart' ? h(Icons.PieChart, { size: 16 }) : h(Icons.List, { size: 16 })
              )
            )
          )
        )
      ),

      // Content
      expenses.length === 0
        ? h('div', { 
            className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center' 
          },
            h(Icons.TrendingDown, { size: 48, className: 'mx-auto text-gray-300 mb-4' }),
            h('p', { className: 'text-gray-500' }, 'No expenses recorded for this period')
          )
        : viewMode === 'chart'
          ? h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
              // Pie Chart
              h('div', { 
                className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' 
              },
                h('h3', { className: 'text-lg font-semibold mb-4' }, 'Category Distribution'),
                h(ResponsiveContainer, { width: '100%', height: 400 },
                  h(PieChart, {},
                    h(Pie, {
                      data: chartData,
                      cx: '50%',
                      cy: '50%',
                      labelLine: false,
                      label: ({ name, percentage }) => `${percentage}%`,
                      outerRadius: 120,
                      fill: '#8884d8',
                      dataKey: 'value'
                    },
                      chartData.map((entry, index) => 
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
                    }),
                    h(Legend, {
                      verticalAlign: 'bottom',
                      height: 36
                    })
                  )
                )
              ),

              // Top Categories
              h('div', { 
                className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' 
              },
                h('h3', { className: 'text-lg font-semibold mb-4' }, 'Top Categories'),
                h('div', { className: 'space-y-4' },
                  expenses.slice(0, 5).map((cat, index) => {
                    const percentage = (cat.amount / totalExpenses) * 100;
                    
                    return h('div', { key: cat.id },
                      h('div', { className: 'flex items-center justify-between mb-2' },
                        h('div', { className: 'flex items-center space-x-3' },
                          h('div', {
                            className: `
                              p-2 rounded-lg
                              ${cat.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                              ${cat.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                              ${cat.color === 'red' ? 'bg-red-100 text-red-600' : ''}
                              ${cat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                              ${cat.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                            `
                          },
                            h(Icons[cat.icon], { size: 16 })
                          ),
                          h('div', {},
                            h('p', { className: 'font-medium text-gray-900' }, cat.name),
                            h('p', { className: 'text-xs text-gray-500' }, 
                              `${cat.count} transactions`
                            )
                          )
                        ),
                        h('p', { className: 'font-semibold text-gray-900' }, 
                          formatCurrency(cat.amount)
                        )
                      ),
                      h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                        h('div', {
                          className: `h-2 rounded-full transition-all duration-500`,
                          style: { 
                            width: `${percentage}%`,
                            backgroundColor: CONFIG.CHART_COLORS[index % CONFIG.CHART_COLORS.length]
                          }
                        })
                      )
                    );
                  })
                )
              )
            )
          : h('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
              h('table', { className: 'w-full' },
                h('thead', { className: 'bg-gray-50 border-b border-gray-200' },
                  h('tr', {},
                    h('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                      'Category'
                    ),
                    h('th', { className: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Transactions'
                    ),
                    h('th', { className: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Amount'
                    ),
                    h('th', { className: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Percentage'
                    )
                  )
                ),
                h('tbody', { className: 'divide-y divide-gray-200' },
                  expenses.map(cat => {
                    const percentage = ((cat.amount / totalExpenses) * 100).toFixed(1);
                    
                    return h('tr', { 
                      key: cat.id,
                      className: 'hover:bg-gray-50 transition-colors cursor-pointer'
                    },
                      h('td', { className: 'px-6 py-4' },
                        h('div', { className: 'flex items-center space-x-3' },
                          h('div', {
                            className: `
                              p-2 rounded-lg
                              ${cat.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                              ${cat.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                              ${cat.color === 'red' ? 'bg-red-100 text-red-600' : ''}
                              ${cat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                              ${cat.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                            `
                          },
                            h(Icons[cat.icon], { size: 16 })
                          ),
                          h('span', { className: 'font-medium text-gray-900' }, cat.name)
                        )
                      ),
                      h('td', { className: 'px-6 py-4 text-right text-gray-600' }, 
                        cat.count
                      ),
                      h('td', { className: 'px-6 py-4 text-right font-semibold text-gray-900' }, 
                        formatCurrency(cat.amount)
                      ),
                      h('td', { className: 'px-6 py-4 text-right' },
                        h('div', { className: 'flex items-center justify-end space-x-2' },
                          h('span', { className: 'text-sm text-gray-600' }, `${percentage}%`),
                          h('div', { className: 'w-24 bg-gray-200 rounded-full h-2' },
                            h('div', {
                              className: 'h-2 rounded-full bg-blue-600',
                              style: { width: `${percentage}%` }
                            })
                          )
                        )
                      )
                    );
                  })
                )
              )
            )
    );
  };

  /**
   * IncomeManager Component - Track multiple income sources
   * @component
   */
  const IncomeManager = () => {
    const { state, actions } = useFinance();
    const [showAddForm, setShowAddForm] = useState(false);
    
    const incomeSources = state.finance.incomeSources || [];
    const transactions = state.finance.transactions || [];

    // Calculate income statistics
    const incomeStats = useMemo(() => {
      const now = new Date();
      const thisMonth = transactions.filter(t => 
        t.type === 'income' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
      );

      const lastMonth = transactions.filter(t => {
        const date = new Date(t.date);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return t.type === 'income' &&
          date.getMonth() === lastMonthDate.getMonth() &&
          date.getFullYear() === lastMonthDate.getFullYear();
      });

      const thisMonthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);
      const lastMonthTotal = lastMonth.reduce((sum, t) => sum + t.amount, 0);
      const change = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : 0;

      return {
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        change,
        transactions: thisMonth
      };
    }, [transactions]);

    const AddIncomeSourceForm = () => {
      const [formData, setFormData] = useState({
        name: '',
        type: 'salary', // salary, freelance, business, investment, other
        amount: '',
        frequency: 'monthly', // monthly, weekly, biweekly, quarterly, yearly, oneTime
        nextPayDate: '',
        description: ''
      });

      const handleSubmit = (e) => {
        e.preventDefault();
        
        actions.finance.addIncomeSource({
          ...formData,
          amount: parseFloat(formData.amount),
          createdAt: new Date().toISOString()
        });

        NotificationManager.success('Income source added successfully');
        setShowAddForm(false);
      };

      return h('div', { 
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6' 
      },
        h('h3', { className: 'text-lg font-semibold mb-4' }, 'Add Income Source'),
        h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Name
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Source Name'
              ),
              h('input', {
                type: 'text',
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                required: true,
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `,
                placeholder: 'e.g., Main Job, Freelance Work'
              })
            ),

            // Type
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Type'
              ),
              h('select', {
                value: formData.type,
                onChange: (e) => setFormData({ ...formData, type: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: 'salary' }, 'Salary'),
                h('option', { value: 'freelance' }, 'Freelance'),
                h('option', { value: 'business' }, 'Business'),
                h('option', { value: 'investment' }, 'Investment'),
                h('option', { value: 'other' }, 'Other')
              )
            ),

            // Amount
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Expected Amount'
              ),
              h('div', { className: 'relative' },
                h('span', { 
                  className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' 
                }, '$'),
                h('input', {
                  type: 'number',
                  step: '0.01',
                  value: formData.amount,
                  onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                  required: true,
                  className: `
                    w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `,
                  placeholder: '0.00'
                })
              )
            ),

            // Frequency
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Frequency'
              ),
              h('select', {
                value: formData.frequency,
                onChange: (e) => setFormData({ ...formData, frequency: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: 'weekly' }, 'Weekly'),
                h('option', { value: 'biweekly' }, 'Bi-weekly'),
                h('option', { value: 'monthly' }, 'Monthly'),
                h('option', { value: 'quarterly' }, 'Quarterly'),
                h('option', { value: 'yearly' }, 'Yearly'),
                h('option', { value: 'oneTime' }, 'One Time')
              )
            ),

            // Next Pay Date
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Next Payment Date'
              ),
              h('input', {
                type: 'date',
                value: formData.nextPayDate,
                onChange: (e) => setFormData({ ...formData, nextPayDate: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              })
            )
          ),

          // Description
          h('div', {},
            h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
              'Description'
            ),
            h('textarea', {
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              rows: 2,
              className: `
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                resize-none
              `,
              placeholder: 'Additional notes...'
            })
          ),

          // Actions
          h('div', { className: 'flex justify-end space-x-3 pt-4' },
            h('button', {
              type: 'button',
              onClick: () => setShowAddForm(false),
              className: `
                px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
              `
            }, 'Cancel'),
            h('button', {
              type: 'submit',
              className: `
                px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            }, 'Add Income Source')
          )
        )
      );
    };

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Income Manager'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            'Track and manage your income sources'
          )
        ),
        h('button', {
          onClick: () => setShowAddForm(!showAddForm),
          className: `
            flex items-center space-x-2 px-4 py-2
            bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors
          `
        },
          h(Icons.Plus, { size: 18 }),
          h('span', {}, 'Add Source')
        )
      ),

      // Add Form
      showAddForm && h(AddIncomeSourceForm),

      // Income Summary Cards
      h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        // This Month
        h('div', {
          className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('div', {
              className: 'p-3 rounded-lg bg-green-100 text-green-600'
            },
              h(Icons.TrendingUp, { size: 24 })
            ),
            incomeStats.change !== 0 && h('span', {
              className: `
                text-sm font-medium
                ${incomeStats.change > 0 ? 'text-green-600' : 'text-red-600'}
              `
            }, `${incomeStats.change > 0 ? '+' : ''}${incomeStats.change.toFixed(1)}%`)
          ),
          h('h3', { className: 'text-sm font-medium text-gray-500' }, 'This Month'),
          h('p', { className: 'text-2xl font-bold text-gray-900 mt-1' }, 
            formatCurrency(incomeStats.thisMonth)
          )
        ),

        // Last Month
        h('div', {
          className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('div', {
              className: 'p-3 rounded-lg bg-blue-100 text-blue-600'
            },
              h(Icons.Calendar, { size: 24 })
            )
          ),
          h('h3', { className: 'text-sm font-medium text-gray-500' }, 'Last Month'),
          h('p', { className: 'text-2xl font-bold text-gray-900 mt-1' }, 
            formatCurrency(incomeStats.lastMonth)
          )
        ),

        // Average Monthly
        h('div', {
          className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'
        },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('div', {
              className: 'p-3 rounded-lg bg-purple-100 text-purple-600'
            },
              h(Icons.BarChart3, { size: 24 })
            )
          ),
          h('h3', { className: 'text-sm font-medium text-gray-500' }, 'Monthly Average'),
          h('p', { className: 'text-2xl font-bold text-gray-900 mt-1' }, 
            formatCurrency((incomeStats.thisMonth + incomeStats.lastMonth) / 2)
          )
        )
      ),

      // Income Sources List
      h('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
        h('div', { className: 'p-6 border-b border-gray-200' },
          h('h3', { className: 'text-lg font-semibold' }, 'Income Sources')
        ),
        incomeSources.length === 0
          ? h('div', { className: 'p-12 text-center' },
              h(Icons.DollarSign, { size: 48, className: 'mx-auto text-gray-300 mb-4' }),
              h('p', { className: 'text-gray-500' }, 'No income sources added yet')
            )
          : h('div', { className: 'divide-y divide-gray-200' },
              incomeSources.map(source => {
                const typeIcons = {
                  salary: Icons.Briefcase,
                  freelance: Icons.Laptop,
                  business: Icons.Building,
                  investment: Icons.TrendingUp,
                  other: Icons.DollarSign
                };
                const TypeIcon = typeIcons[source.type] || Icons.DollarSign;

                return h('div', {
                  key: source.id,
                  className: 'p-6 hover:bg-gray-50 transition-colors'
                },
                  h('div', { className: 'flex items-center justify-between' },
                    h('div', { className: 'flex items-center space-x-4' },
                      h('div', {
                        className: 'p-3 rounded-lg bg-green-100 text-green-600'
                      },
                        h(TypeIcon, { size: 24 })
                      ),
                      h('div', {},
                        h('h4', { className: 'font-semibold text-gray-900' }, source.name),
                        h('p', { className: 'text-sm text-gray-500' }, 
                          `${source.type} • ${source.frequency}`
                        ),
                        source.nextPayDate && h('p', { className: 'text-xs text-gray-400 mt-1' }, 
                          `Next payment: ${formatDate(source.nextPayDate, 'MMM dd, yyyy')}`
                        )
                      )
                    ),
                    h('div', { className: 'text-right' },
                      h('p', { className: 'text-xl font-bold text-gray-900' }, 
                        formatCurrency(source.amount)
                      ),
                      h('div', { className: 'flex items-center space-x-2 mt-2' },
                        h('button', {
                          className: 'text-blue-600 hover:text-blue-700 text-sm'
                        }, 'Edit'),
                        h('button', {
                          className: 'text-red-600 hover:text-red-700 text-sm'
                        }, 'Remove')
                      )
                    )
                  )
                );
              })
            )
      )
    );
  };

  /**
   * BillTracker Component - Upcoming bills with due date alerts
   * @component
   */
  const BillTracker = () => {
    const { state, actions } = useFinance();
    const [showAddForm, setShowAddForm] = useState(false);
    const [viewMode, setViewMode] = useState('upcoming'); // upcoming, calendar, all

    const bills = state.finance.bills || [];

    // Calculate upcoming bills
    const upcomingBills = useMemo(() => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return bills
        .filter(bill => {
          const dueDate = new Date(bill.nextDueDate);
          return dueDate >= now && dueDate <= thirtyDaysFromNow;
        })
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
    }, [bills]);

    // Group bills by status
    const billsByStatus = useMemo(() => {
      const now = new Date();
      
      return bills.reduce((acc, bill) => {
        const dueDate = new Date(bill.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          acc.overdue.push({ ...bill, daysUntilDue: Math.abs(daysUntilDue) });
        } else if (daysUntilDue <= 7) {
          acc.dueSoon.push({ ...bill, daysUntilDue });
        } else {
          acc.upcoming.push({ ...bill, daysUntilDue });
        }

        return acc;
      }, { overdue: [], dueSoon: [], upcoming: [] });
    }, [bills]);

    const AddBillForm = () => {
      const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: '',
        dueDay: '',
        frequency: 'monthly',
        autopay: false,
        payee: '',
        accountNumber: '',
        notes: ''
      });

      const handleSubmit = (e) => {
        e.preventDefault();
        
        // Calculate next due date
        const now = new Date();
        const nextDueDate = new Date(now.getFullYear(), now.getMonth(), parseInt(formData.dueDay));
        if (nextDueDate < now) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        actions.finance.addBill({
          ...formData,
          amount: parseFloat(formData.amount),
          nextDueDate: nextDueDate.toISOString(),
          createdAt: new Date().toISOString()
        });

        NotificationManager.success('Bill added successfully');
        setShowAddForm(false);
      };

      return h('div', { 
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6' 
      },
        h('h3', { className: 'text-lg font-semibold mb-4' }, 'Add New Bill'),
        h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Name
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Bill Name'
              ),
              h('input', {
                type: 'text',
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                required: true,
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `,
                placeholder: 'e.g., Electric Bill, Netflix'
              })
            ),

            // Amount
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Amount'
              ),
              h('div', { className: 'relative' },
                h('span', { 
                  className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' 
                }, '$'),
                h('input', {
                  type: 'number',
                  step: '0.01',
                  value: formData.amount,
                  onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                  required: true,
                  className: `
                    w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `,
                  placeholder: '0.00'
                })
              )
            ),

            // Category
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Category'
              ),
              h('select', {
                value: formData.category,
                onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                required: true,
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: '' }, 'Select category...'),
                CONFIG.CATEGORIES
                  .filter(cat => cat.type === 'expense' || cat.type === 'both')
                  .map(cat => 
                    h('option', { key: cat.id, value: cat.id }, cat.name)
                  )
              )
            ),

            // Due Day
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Due Day of Month'
              ),
              h('input', {
                type: 'number',
                min: '1',
                max: '31',
                value: formData.dueDay,
                onChange: (e) => setFormData({ ...formData, dueDay: e.target.value }),
                required: true,
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `,
                placeholder: '15'
              })
            ),

            // Frequency
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Frequency'
              ),
              h('select', {
                value: formData.frequency,
                onChange: (e) => setFormData({ ...formData, frequency: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: 'monthly' }, 'Monthly'),
                h('option', { value: 'quarterly' }, 'Quarterly'),
                h('option', { value: 'yearly' }, 'Yearly')
              )
            ),

            // Payee
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Payee'
              ),
              h('input', {
                type: 'text',
                value: formData.payee,
                onChange: (e) => setFormData({ ...formData, payee: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `,
                placeholder: 'Company or person'
              })
            )
          ),

          // Autopay
          h('div', { className: 'bg-gray-50 p-4 rounded-lg' },
            h('label', { className: 'flex items-center space-x-3 cursor-pointer' },
              h('input', {
                type: 'checkbox',
                checked: formData.autopay,
                onChange: (e) => setFormData({ ...formData, autopay: e.target.checked }),
                className: 'rounded border-gray-300 text-blue-600'
              }),
              h('div', {},
                h('span', { className: 'text-sm font-medium text-gray-700' }, 
                  'Autopay enabled'
                ),
                h('p', { className: 'text-xs text-gray-500' }, 
                  'This bill is automatically paid'
                )
              )
            )
          ),

          // Actions
          h('div', { className: 'flex justify-end space-x-3 pt-4' },
            h('button', {
              type: 'button',
              onClick: () => setShowAddForm(false),
              className: `
                px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
              `
            }, 'Cancel'),
            h('button', {
              type: 'submit',
              className: `
                px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            }, 'Add Bill')
          )
        )
      );
    };

    const BillCard = ({ bill, status }) => {
      const category = CONFIG.CATEGORIES.find(c => c.id === bill.category);
      const statusColors = {
        overdue: 'red',
        dueSoon: 'yellow',
        upcoming: 'green',
        paid: 'gray'
      };
      const color = statusColors[status] || 'gray';

      return h('div', {
        className: `
          bg-white rounded-lg shadow-sm border border-gray-200 p-4
          hover:shadow-md transition-all duration-300 cursor-pointer
        `
      },
        h('div', { className: 'flex items-center justify-between mb-3' },
          h('div', { className: 'flex items-center space-x-3' },
            category && h('div', {
              className: `
                p-2 rounded-lg
                ${color === 'red' ? 'bg-red-100 text-red-600' : ''}
                ${color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                ${color === 'green' ? 'bg-green-100 text-green-600' : ''}
                ${color === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
              `
            },
              h(Icons[category.icon], { size: 16 })
            ),
            h('div', {},
              h('h4', { className: 'font-medium text-gray-900' }, bill.name),
              h('p', { className: 'text-xs text-gray-500' }, bill.payee || category?.name)
            )
          ),
          bill.autopay && h('span', {
            className: 'text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'
          }, 'Autopay')
        ),

        h('div', { className: 'flex items-center justify-between' },
          h('div', {},
            h('p', { className: 'text-lg font-semibold text-gray-900' }, 
              formatCurrency(bill.amount)
            ),
            h('p', { 
              className: `text-sm
                ${color === 'red' ? 'text-red-600' : ''}
                ${color === 'yellow' ? 'text-yellow-600' : ''}
                ${color === 'green' ? 'text-green-600' : ''}
                ${color === 'gray' ? 'text-gray-600' : ''}
              `
            }, 
              status === 'overdue' 
                ? `${bill.daysUntilDue} days overdue`
                : status === 'paid'
                ? 'Paid'
                : `Due in ${bill.daysUntilDue} days`
            )
          ),
          h('button', {
            className: `
              px-3 py-1 text-sm rounded-lg transition-colors
              ${status === 'paid' 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `
          }, status === 'paid' ? 'Paid' : 'Mark Paid')
        )
      );
    };

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Bill Tracker'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            `${upcomingBills.length} bills due in the next 30 days`
          )
        ),
        h('div', { className: 'flex items-center space-x-4' },
          // View Mode
          h('div', { className: 'flex rounded-lg bg-gray-100 p-1' },
            ['upcoming', 'calendar', 'all'].map(mode => 
              h('button', {
                key: mode,
                onClick: () => setViewMode(mode),
                className: `
                  px-3 py-1 rounded-md transition-all duration-200 text-sm
                  ${viewMode === mode 
                    ? 'bg-white shadow-sm font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `
              }, mode.charAt(0).toUpperCase() + mode.slice(1))
            )
          ),
          h('button', {
            onClick: () => setShowAddForm(!showAddForm),
            className: `
              flex items-center space-x-2 px-4 py-2
              bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 transition-colors
            `
          },
            h(Icons.Plus, { size: 18 }),
            h('span', {}, 'Add Bill')
          )
        )
      ),

      // Add Form
      showAddForm && h(AddBillForm),

      // Status Summary
      h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        // Overdue
        h('div', {
          className: `
            bg-red-50 border border-red-200 rounded-lg p-4
            ${billsByStatus.overdue.length === 0 ? 'opacity-50' : ''}
          `
        },
          h('div', { className: 'flex items-center justify-between' },
            h('div', {},
              h('p', { className: 'text-red-900 font-semibold' }, 'Overdue'),
              h('p', { className: 'text-2xl font-bold text-red-600' }, 
                billsByStatus.overdue.length
              )
            ),
            h(Icons.AlertCircle, { size: 24, className: 'text-red-500' })
          ),
          billsByStatus.overdue.length > 0 && h('p', { 
            className: 'text-sm text-red-700 mt-2' 
          }, 
            `Total: ${formatCurrency(
              billsByStatus.overdue.reduce((sum, b) => sum + b.amount, 0)
            )}`
          )
        ),

        // Due Soon
        h('div', {
          className: `
            bg-yellow-50 border border-yellow-200 rounded-lg p-4
            ${billsByStatus.dueSoon.length === 0 ? 'opacity-50' : ''}
          `
        },
          h('div', { className: 'flex items-center justify-between' },
            h('div', {},
              h('p', { className: 'text-yellow-900 font-semibold' }, 'Due Soon'),
              h('p', { className: 'text-2xl font-bold text-yellow-600' }, 
                billsByStatus.dueSoon.length
              )
            ),
            h(Icons.Clock, { size: 24, className: 'text-yellow-500' })
          ),
          billsByStatus.dueSoon.length > 0 && h('p', { 
            className: 'text-sm text-yellow-700 mt-2' 
          }, 
            `Total: ${formatCurrency(
              billsByStatus.dueSoon.reduce((sum, b) => sum + b.amount, 0)
            )}`
          )
        ),

        // Upcoming
        h('div', {
          className: `
            bg-green-50 border border-green-200 rounded-lg p-4
            ${billsByStatus.upcoming.length === 0 ? 'opacity-50' : ''}
          `
        },
          h('div', { className: 'flex items-center justify-between' },
            h('div', {},
              h('p', { className: 'text-green-900 font-semibold' }, 'Upcoming'),
              h('p', { className: 'text-2xl font-bold text-green-600' }, 
                billsByStatus.upcoming.length
              )
            ),
            h(Icons.CheckCircle, { size: 24, className: 'text-green-500' })
          ),
          billsByStatus.upcoming.length > 0 && h('p', { 
            className: 'text-sm text-green-700 mt-2' 
          }, 
            `Total: ${formatCurrency(
              billsByStatus.upcoming.reduce((sum, b) => sum + b.amount, 0)
            )}`
          )
        )
      ),

      // Bills List
      viewMode === 'upcoming' && h('div', { className: 'space-y-4' },
        // Overdue Bills
        billsByStatus.overdue.length > 0 && h('div', {},
          h('h3', { className: 'text-lg font-semibold text-red-600 mb-3' }, 
            'Overdue Bills'
          ),
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            billsByStatus.overdue.map(bill => 
              h(BillCard, { key: bill.id, bill, status: 'overdue' })
            )
          )
        ),

        // Due Soon
        billsByStatus.dueSoon.length > 0 && h('div', {},
          h('h3', { className: 'text-lg font-semibold text-yellow-600 mb-3' }, 
            'Due Soon (7 days)'
          ),
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            billsByStatus.dueSoon.map(bill => 
              h(BillCard, { key: bill.id, bill, status: 'dueSoon' })
            )
          )
        ),

        // Upcoming
        billsByStatus.upcoming.length > 0 && h('div', {},
          h('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, 
            'Upcoming Bills'
          ),
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            billsByStatus.upcoming.map(bill => 
              h(BillCard, { key: bill.id, bill, status: 'upcoming' })
            )
          )
        ),

        // No bills
        bills.length === 0 && h('div', { 
          className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center' 
        },
          h(Icons.Receipt, { size: 48, className: 'mx-auto text-gray-300 mb-4' }),
          h('p', { className: 'text-gray-500' }, 'No bills added yet')
        )
      )
    );
  };

  /**
   * SavingsGoals Component - Set and track savings goals
   * @component
   */
  const SavingsGoals = () => {
    const { state, actions } = useFinance();
    const [showAddForm, setShowAddForm] = useState(false);
    
    const goals = state.finance.savingsGoals || [];

    // Calculate goal progress
    const goalsWithProgress = useMemo(() => {
      return goals.map(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const monthlyRequired = goal.targetDate 
          ? (goal.targetAmount - goal.currentAmount) / 
            Math.max(1, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
          : 0;

        return {
          ...goal,
          progress: Math.min(progress, 100),
          remaining: goal.targetAmount - goal.currentAmount,
          monthlyRequired,
          isCompleted: goal.currentAmount >= goal.targetAmount
        };
      });
    }, [goals]);

    const AddGoalForm = () => {
      const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        targetDate: '',
        category: '',
        description: '',
        priority: 'medium'
      });

      const handleSubmit = (e) => {
        e.preventDefault();
        
        actions.finance.addSavingsGoal({
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: 0,
          createdAt: new Date().toISOString()
        });

        NotificationManager.success('Savings goal created successfully');
        setShowAddForm(false);
      };

      return h('div', { 
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6' 
      },
        h('h3', { className: 'text-lg font-semibold mb-4' }, 'Create Savings Goal'),
        h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Name
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Goal Name'
              ),
              h('input', {
                type: 'text',
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                required: true,
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `,
                placeholder: 'e.g., Emergency Fund, Vacation'
              })
            ),

            // Target Amount
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Target Amount'
              ),
              h('div', { className: 'relative' },
                h('span', { 
                  className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' 
                }, '$'),
                h('input', {
                  type: 'number',
                  step: '0.01',
                  value: formData.targetAmount,
                  onChange: (e) => setFormData({ ...formData, targetAmount: e.target.value }),
                  required: true,
                  className: `
                    w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `,
                  placeholder: '0.00'
                })
              )
            ),

            // Target Date
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Target Date'
              ),
              h('input', {
                type: 'date',
                value: formData.targetDate,
                onChange: (e) => setFormData({ ...formData, targetDate: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              })
            ),

            // Category
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Category'
              ),
              h('select', {
                value: formData.category,
                onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: '' }, 'Select category...'),
                h('option', { value: 'emergency' }, 'Emergency Fund'),
                h('option', { value: 'vacation' }, 'Vacation'),
                h('option', { value: 'home' }, 'Home'),
                h('option', { value: 'car' }, 'Car'),
                h('option', { value: 'education' }, 'Education'),
                h('option', { value: 'retirement' }, 'Retirement'),
                h('option', { value: 'other' }, 'Other')
              )
            ),

            // Priority
            h('div', {},
              h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Priority'
              ),
              h('select', {
                value: formData.priority,
                onChange: (e) => setFormData({ ...formData, priority: e.target.value }),
                className: `
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `
              },
                h('option', { value: 'low' }, 'Low'),
                h('option', { value: 'medium' }, 'Medium'),
                h('option', { value: 'high' }, 'High')
              )
            )
          ),

          // Description
          h('div', {},
            h('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
              'Description'
            ),
            h('textarea', {
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              rows: 2,
              className: `
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                resize-none
              `,
              placeholder: 'What is this goal for?'
            })
          ),

          // Actions
          h('div', { className: 'flex justify-end space-x-3 pt-4' },
            h('button', {
              type: 'button',
              onClick: () => setShowAddForm(false),
              className: `
                px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
              `
            }, 'Cancel'),
            h('button', {
              type: 'submit',
              className: `
                px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            }, 'Create Goal')
          )
        )
      );
    };

    const GoalCard = ({ goal }) => {
      const [showContributeForm, setShowContributeForm] = useState(false);
      const [contributionAmount, setContributionAmount] = useState('');

      const handleContribute = () => {
        const amount = parseFloat(contributionAmount);
        if (amount > 0) {
          actions.finance.contributeToGoal(goal.id, amount);
          NotificationManager.success(`Added ${formatCurrency(amount)} to ${goal.name}`);
          setShowContributeForm(false);
          setContributionAmount('');
        }
      };

      const priorityColors = {
        low: 'gray',
        medium: 'blue',
        high: 'red'
      };

      const categoryIcons = {
        emergency: Icons.Shield,
        vacation: Icons.Plane,
        home: Icons.Home,
        car: Icons.Car,
        education: Icons.GraduationCap,
        retirement: Icons.PiggyBank,
        other: Icons.Target
      };

      const CategoryIcon = categoryIcons[goal.category] || Icons.Target;
      const priorityColor = priorityColors[goal.priority];

      return h('div', {
        className: `
          bg-white rounded-lg shadow-sm border border-gray-200 p-6
          hover:shadow-md transition-all duration-300
          ${goal.isCompleted ? 'border-green-300 bg-green-50' : ''}
        `
      },
        // Header
        h('div', { className: 'flex items-start justify-between mb-4' },
          h('div', { className: 'flex items-center space-x-3' },
            h('div', {
              className: `
                p-3 rounded-lg
                ${goal.isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
              `
            },
              h(CategoryIcon, { size: 24 })
            ),
            h('div', {},
              h('h3', { className: 'font-semibold text-gray-900' }, goal.name),
              h('div', { className: 'flex items-center space-x-2 mt-1' },
                h('span', {
                  className: `
                    text-xs px-2 py-0.5 rounded-full
                    ${priorityColor === 'red' ? 'bg-red-100 text-red-700' : ''}
                    ${priorityColor === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                    ${priorityColor === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                  `
                }, `${goal.priority} priority`),
                goal.targetDate && h('span', { className: 'text-xs text-gray-500' },
                  `Due ${formatDate(goal.targetDate, 'MMM yyyy')}`
                )
              )
            )
          ),
          goal.isCompleted && h('div', {
            className: 'flex items-center space-x-1 text-green-600'
          },
            h(Icons.CheckCircle, { size: 20 }),
            h('span', { className: 'text-sm font-medium' }, 'Completed!')
          )
        ),

        // Progress
        h('div', { className: 'mb-4' },
          h('div', { className: 'flex items-end justify-between mb-2' },
            h('div', {},
              h('p', { className: 'text-2xl font-bold text-gray-900' }, 
                formatCurrency(goal.currentAmount)
              ),
              h('p', { className: 'text-sm text-gray-500' }, 
                `of ${formatCurrency(goal.targetAmount)}`
              )
            ),
            h('div', { className: 'text-right' },
              h('p', { className: 'text-lg font-semibold text-gray-700' }, 
                `${Math.round(goal.progress)}%`
              ),
              !goal.isCompleted && h('p', { className: 'text-sm text-gray-500' }, 
                `${formatCurrency(goal.remaining)} to go`
              )
            )
          ),
          h('div', { className: 'w-full bg-gray-200 rounded-full h-3' },
            h('div', {
              className: `
                h-3 rounded-full transition-all duration-500
                ${goal.isCompleted ? 'bg-green-500' : 'bg-blue-600'}
              `,
              style: { width: `${goal.progress}%` }
            })
          ),
          !goal.isCompleted && goal.monthlyRequired > 0 && h('p', { 
            className: 'text-sm text-gray-500 mt-2' 
          }, 
            `Save ${formatCurrency(goal.monthlyRequired)}/month to reach goal`
          )
        ),

        // Actions
        !goal.isCompleted && h('div', { className: 'space-y-3' },
          !showContributeForm 
            ? h('button', {
                onClick: () => setShowContributeForm(true),
                className: `
                  w-full py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 transition-colors
                `
              }, 'Add Contribution')
            : h('div', { className: 'flex space-x-2' },
                h('div', { className: 'relative flex-1' },
                  h('span', { 
                    className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' 
                  }, '$'),
                  h('input', {
                    type: 'number',
                    step: '0.01',
                    value: contributionAmount,
                    onChange: (e) => setContributionAmount(e.target.value),
                    className: `
                      w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    `,
                    placeholder: '0.00',
                    autoFocus: true
                  })
                ),
                h('button', {
                  onClick: handleContribute,
                  className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                }, 'Add'),
                h('button', {
                  onClick: () => {
                    setShowContributeForm(false);
                    setContributionAmount('');
                  },
                  className: 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                }, 'Cancel')
              )
        ),

        // Footer
        h('div', { className: 'flex items-center justify-between pt-4 border-t border-gray-200' },
          goal.description && h('p', { className: 'text-sm text-gray-500 italic' }, 
            goal.description
          ),
          h('div', { className: 'flex items-center space-x-3' },
            h('button', { className: 'text-sm text-blue-600 hover:text-blue-700' }, 
              'History'
            ),
            h('button', { className: 'text-sm text-gray-500 hover:text-gray-700' }, 
              'Edit'
            )
          )
        )
      );
    };

    // Calculate total savings
    const totalSavings = goalsWithProgress.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goalsWithProgress.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Savings Goals'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            `${goalsWithProgress.filter(g => !g.isCompleted).length} active goals`
          )
        ),
        h('button', {
          onClick: () => setShowAddForm(!showAddForm),
          className: `
            flex items-center space-x-2 px-4 py-2
            bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors
          `
        },
          h(Icons.Plus, { size: 18 }),
          h('span', {}, 'New Goal')
        )
      ),

      // Add Form
      showAddForm && h(AddGoalForm),

      // Overall Progress
      totalTarget > 0 && h('div', {
        className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'
      },
        h('div', { className: 'flex items-center justify-between mb-4' },
          h('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Overall Progress'),
          h('span', { className: 'text-2xl font-bold text-blue-600' }, 
            `${Math.round(overallProgress)}%`
          )
        ),
        h('div', { className: 'w-full bg-gray-200 rounded-full h-4 mb-4' },
          h('div', {
            className: 'h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600',
            style: { width: `${overallProgress}%` }
          })
        ),
        h('div', { className: 'grid grid-cols-2 gap-4 text-center' },
          h('div', {},
            h('p', { className: 'text-sm text-gray-500' }, 'Total Saved'),
            h('p', { className: 'text-xl font-bold text-gray-900' }, 
              formatCurrency(totalSavings)
            )
          ),
          h('div', {},
            h('p', { className: 'text-sm text-gray-500' }, 'Total Target'),
            h('p', { className: 'text-xl font-bold text-gray-900' }, 
              formatCurrency(totalTarget)
            )
          )
        )
      ),

      // Goals Grid
      goalsWithProgress.length === 0
        ? h('div', { 
            className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center' 
          },
            h(Icons.Target, { size: 48, className: 'mx-auto text-gray-300 mb-4' }),
            h('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, 
              'No savings goals yet'
            ),
            h('p', { className: 'text-gray-500 mb-4' }, 
              'Start building your financial future by setting a savings goal'
            ),
            h('button', {
              onClick: () => setShowAddForm(true),
              className: `
                inline-flex items-center space-x-2 px-4 py-2
                bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition-colors
              `
            },
              h(Icons.Plus, { size: 18 }),
              h('span', {}, 'Create Your First Goal')
            )
          )
        : h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            goalsWithProgress
              .sort((a, b) => {
                // Sort by priority first, then by progress
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                if (a.priority !== b.priority) {
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return b.progress - a.progress;
              })
              .map(goal => 
                h(GoalCard, { key: goal.id, goal })
              )
          )
    );
  };

  /**
   * FinancialCharts Component - Reusable chart components
   * @component
   */
  const FinancialCharts = {
    // Cash Flow Chart
    CashFlowChart: ({ data, height = 300 }) => {
      return h(ResponsiveContainer, { width: '100%', height },
        h(AreaChart, { data },
          h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
          h(XAxis, { dataKey: 'month', stroke: '#6b7280' }),
          h(YAxis, { stroke: '#6b7280' }),
          h(Tooltip, {
            contentStyle: { 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            },
            formatter: (value) => formatCurrency(value)
          }),
          h(Legend, { wrapperStyle: { paddingTop: '20px' } }),
          h(Area, {
            type: 'monotone',
            dataKey: 'income',
            stackId: '1',
            stroke: '#10b981',
            fill: '#10b981',
            fillOpacity: 0.6
          }),
          h(Area, {
            type: 'monotone',
            dataKey: 'expenses',
            stackId: '2',
            stroke: '#ef4444',
            fill: '#ef4444',
            fillOpacity: 0.6
          })
        )
      );
    },

    // Net Worth Chart
    NetWorthChart: ({ data, height = 300 }) => {
      return h(ResponsiveContainer, { width: '100%', height },
        h(LineChart, { data },
          h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
          h(XAxis, { dataKey: 'month', stroke: '#6b7280' }),
          h(YAxis, { stroke: '#6b7280' }),
          h(Tooltip, {
            contentStyle: { 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            },
            formatter: (value) => formatCurrency(value)
          }),
          h(Line, {
            type: 'monotone',
            dataKey: 'netWorth',
            stroke: '#3b82f6',
            strokeWidth: 3,
            dot: { fill: '#3b82f6', r: 4 },
            activeDot: { r: 6 }
          })
        )
      );
    },

    // Budget Comparison Chart
    BudgetComparisonChart: ({ data, height = 300 }) => {
      return h(ResponsiveContainer, { width: '100%', height },
        h(BarChart, { data },
          h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
          h(XAxis, { dataKey: 'category', stroke: '#6b7280' }),
          h(YAxis, { stroke: '#6b7280' }),
          h(Tooltip, {
            contentStyle: { 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            },
            formatter: (value) => formatCurrency(value)
          }),
          h(Legend, { wrapperStyle: { paddingTop: '20px' } }),
          h(Bar, {
            dataKey: 'budget',
            fill: '#3b82f6',
            name: 'Budget'
          }),
          h(Bar, {
            dataKey: 'actual',
            fill: '#ef4444',
            name: 'Actual'
          })
        )
      );
    },

    // Expense Trend Chart
    ExpenseTrendChart: ({ data, height = 300 }) => {
      return h(ResponsiveContainer, { width: '100%', height },
        h(LineChart, { data },
          h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
          h(XAxis, { dataKey: 'date', stroke: '#6b7280' }),
          h(YAxis, { stroke: '#6b7280' }),
          h(Tooltip, {
            contentStyle: { 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            },
            formatter: (value) => formatCurrency(value)
          }),
          h(Legend, { wrapperStyle: { paddingTop: '20px' } }),
          data[0] && Object.keys(data[0])
            .filter(key => key !== 'date')
            .map((category, index) => 
              h(Line, {
                key: category,
                type: 'monotone',
                dataKey: category,
                stroke: CONFIG.CHART_COLORS[index % CONFIG.CHART_COLORS.length],
                strokeWidth: 2,
                dot: { r: 3 },
                activeDot: { r: 5 }
              })
            )
        )
      );
    },

    // Savings Progress Chart
    SavingsProgressChart: ({ data, height = 300 }) => {
      return h(ResponsiveContainer, { width: '100%', height },
        h(BarChart, { data, layout: 'horizontal' },
          h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f0f0f0' }),
          h(XAxis, { type: 'number', stroke: '#6b7280' }),
          h(YAxis, { type: 'category', dataKey: 'name', stroke: '#6b7280' }),
          h(Tooltip, {
            contentStyle: { 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            },
            formatter: (value) => formatCurrency(value)
          }),
          h(Bar, {
            dataKey: 'current',
            fill: '#10b981',
            name: 'Current',
            radius: [0, 4, 4, 0]
          }),
          h(Bar, {
            dataKey: 'remaining',
            fill: '#e5e7eb',
            name: 'Remaining',
            radius: [0, 4, 4, 0],
            stackId: 'stack'
          })
        )
      );
    }
  };

  /**
   * FinancialReports Component - Generate various financial reports
   * @component
   */
  const FinancialReports = () => {
    const { state, selectors } = useFinance();
    const [reportType, setReportType] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate report data based on type
    const reportData = useMemo(() => {
      const transactions = state.finance.transactions || [];
      const budgets = state.finance.budgets || [];
      const goals = state.finance.savingsGoals || [];

      switch (reportType) {
        case 'monthly':
          return generateMonthlyReport(transactions, budgets, selectedMonth);
        case 'annual':
          return generateAnnualReport(transactions, goals);
        case 'tax':
          return generateTaxReport(transactions);
        case 'budget':
          return generateBudgetReport(budgets, transactions);
        default:
          return null;
      }
    }, [state.finance, reportType, selectedMonth]);

    // Report generation functions
    const generateMonthlyReport = (transactions, budgets, month) => {
      const [year, monthNum] = month.split('-').map(Number);
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === monthNum - 1;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const byCategory = monthTransactions.reduce((acc, t) => {
        const category = CONFIG.CATEGORIES.find(c => c.id === t.category);
        if (!category) return acc;

        if (!acc[t.category]) {
          acc[t.category] = {
            name: category.name,
            income: 0,
            expenses: 0,
            count: 0
          };
        }

        if (t.type === 'income') {
          acc[t.category].income += t.amount;
        } else {
          acc[t.category].expenses += t.amount;
        }
        acc[t.category].count += 1;

        return acc;
      }, {});

      return {
        period: month,
        income,
        expenses,
        netIncome: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0,
        transactionCount: monthTransactions.length,
        categories: Object.values(byCategory),
        topExpenses: monthTransactions
          .filter(t => t.type === 'expense')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
      };
    };

    const generateAnnualReport = (transactions, goals) => {
      const currentYear = new Date().getFullYear();
      const yearTransactions = transactions.filter(t => 
        new Date(t.date).getFullYear() === currentYear
      );

      // Monthly breakdown
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthTransactions = yearTransactions.filter(t => 
          new Date(t.date).getMonth() === i
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: new Date(currentYear, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          income,
          expenses,
          netIncome: income - expenses
        };
      });

      return {
        year: currentYear,
        monthlyData,
        totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
        totalExpenses: monthlyData.reduce((sum, m) => sum + m.expenses, 0),
        totalSavings: monthlyData.reduce((sum, m) => sum + m.netIncome, 0),
        goalsProgress: goals.map(g => ({
          name: g.name,
          progress: (g.currentAmount / g.targetAmount * 100).toFixed(1),
          remaining: g.targetAmount - g.currentAmount
        }))
      };
    };

    const generateTaxReport = (transactions) => {
      const currentYear = new Date().getFullYear();
      const yearTransactions = transactions.filter(t => 
        new Date(t.date).getFullYear() === currentYear - 1
      );

      // Categorize for tax purposes
      const taxCategories = {
        income: {
          salary: 0,
          freelance: 0,
          investment: 0,
          other: 0
        },
        deductions: {
          business: 0,
          medical: 0,
          charity: 0,
          education: 0,
          homeOffice: 0
        }
      };

      // Process transactions for tax categories
      yearTransactions.forEach(t => {
        // Tax categorization logic here
        // This is simplified - real tax categorization would be more complex
        if (t.type === 'income') {
          if (t.category === 'salary') taxCategories.income.salary += t.amount;
          else if (t.category === 'freelance') taxCategories.income.freelance += t.amount;
          else taxCategories.income.other += t.amount;
        } else if (t.type === 'expense') {
          // Map expenses to potential deductions
          if (['business', 'office'].includes(t.category)) {
            taxCategories.deductions.business += t.amount;
          } else if (t.category === 'medical') {
            taxCategories.deductions.medical += t.amount;
          }
        }
      });

      return {
        taxYear: currentYear - 1,
        income: taxCategories.income,
        totalIncome: Object.values(taxCategories.income).reduce((a, b) => a + b, 0),
        deductions: taxCategories.deductions,
        totalDeductions: Object.values(taxCategories.deductions).reduce((a, b) => a + b, 0),
        transactions: yearTransactions
      };
    };

    const generateBudgetReport = (budgets, transactions) => {
      return budgets.map(budget => {
        const budgetTransactions = transactions.filter(t => 
          t.type === 'expense' && 
          t.category === budget.category &&
          new Date(t.date) >= new Date(budget.startDate) &&
          new Date(t.date) <= new Date(budget.endDate)
        );

        const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
        const variance = budget.amount - spent;
        const variancePercent = (variance / budget.amount * 100).toFixed(1);

        return {
          name: budget.name,
          category: budget.category,
          budgeted: budget.amount,
          spent,
          variance,
          variancePercent,
          status: spent > budget.amount ? 'over' : spent > budget.amount * 0.9 ? 'warning' : 'good',
          transactions: budgetTransactions.length
        };
      });
    };

    const handleExportReport = () => {
      setIsGenerating(true);
      
      // Simulate report generation
      setTimeout(() => {
        // In a real app, this would generate a PDF or Excel file
        NotificationManager.success('Report exported successfully');
        setIsGenerating(false);
      }, 2000);
    };

    const ReportHeader = ({ title, subtitle }) => (
      h('div', { className: 'mb-6' },
        h('h3', { className: 'text-xl font-bold text-gray-900' }, title),
        h('p', { className: 'text-gray-500 mt-1' }, subtitle)
      )
    );

    const MetricBox = ({ label, value, change, color = 'blue' }) => (
      h('div', { className: 'bg-white rounded-lg p-4 border border-gray-200' },
        h('p', { className: 'text-sm text-gray-500 mb-1' }, label),
        h('p', { className: `text-2xl font-bold text-${color}-600` }, value),
        change && h('p', { 
          className: `text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}` 
        }, 
          `${change > 0 ? '+' : ''}${change}%`
        )
      )
    );

    return h('div', { className: 'space-y-6' },
      // Header
      h('div', { className: 'flex items-center justify-between' },
        h('div', {},
          h('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Financial Reports'),
          h('p', { className: 'text-gray-500 mt-1' }, 
            'Generate and export detailed financial reports'
          )
        ),
        h('div', { className: 'flex items-center space-x-4' },
          // Report Type Selector
          h('select', {
            value: reportType,
            onChange: (e) => setReportType(e.target.value),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          },
            h('option', { value: 'monthly' }, 'Monthly Report'),
            h('option', { value: 'annual' }, 'Annual Report'),
            h('option', { value: 'tax' }, 'Tax Report'),
            h('option', { value: 'budget' }, 'Budget Report')
          ),
          
          // Month selector for monthly reports
          reportType === 'monthly' && h('input', {
            type: 'month',
            value: selectedMonth,
            onChange: (e) => setSelectedMonth(e.target.value),
            className: `
              px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `
          }),

          // Export button
          h('button', {
            onClick: handleExportReport,
            disabled: isGenerating,
            className: `
              flex items-center space-x-2 px-4 py-2
              bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 disabled:opacity-50
              transition-colors
            `
          },
            isGenerating 
              ? h(Icons.Loader2, { size: 18, className: 'animate-spin' })
              : h(Icons.Download, { size: 18 }),
            h('span', {}, isGenerating ? 'Generating...' : 'Export')
          )
        )
      ),

      // Report Content
      reportData && h('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
        // Monthly Report
        reportType === 'monthly' && h('div', { className: 'space-y-6' },
          h(ReportHeader, {
            title: `Monthly Financial Report - ${formatDate(selectedMonth + '-01', 'MMMM yyyy')}`,
            subtitle: 'Detailed breakdown of your monthly finances'
          }),

          // Summary Metrics
          h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6' },
            h(MetricBox, {
              label: 'Total Income',
              value: formatCurrency(reportData.income),
              color: 'green'
            }),
            h(MetricBox, {
              label: 'Total Expenses',
              value: formatCurrency(reportData.expenses),
              color: 'red'
            }),
            h(MetricBox, {
              label: 'Net Income',
              value: formatCurrency(reportData.netIncome),
              color: reportData.netIncome >= 0 ? 'blue' : 'red'
            }),
            h(MetricBox, {
              label: 'Savings Rate',
              value: `${reportData.savingsRate}%`,
              color: 'purple'
            })
          ),

          // Category Breakdown
          h('div', { className: 'mb-6' },
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Category Breakdown'),
            h('div', { className: 'overflow-x-auto' },
              h('table', { className: 'w-full' },
                h('thead', { className: 'bg-gray-50 border-b border-gray-200' },
                  h('tr', {},
                    h('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                      'Category'
                    ),
                    h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Income'
                    ),
                    h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Expenses'
                    ),
                    h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Net'
                    ),
                    h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                      'Transactions'
                    )
                  )
                ),
                h('tbody', { className: 'divide-y divide-gray-200' },
                  reportData.categories.map(cat => 
                    h('tr', { key: cat.name, className: 'hover:bg-gray-50' },
                      h('td', { className: 'px-4 py-3 text-sm text-gray-900' }, cat.name),
                      h('td', { className: 'px-4 py-3 text-sm text-right text-green-600' }, 
                        cat.income > 0 ? formatCurrency(cat.income) : '-'
                      ),
                      h('td', { className: 'px-4 py-3 text-sm text-right text-red-600' }, 
                        cat.expenses > 0 ? formatCurrency(cat.expenses) : '-'
                      ),
                      h('td', { 
                        className: `px-4 py-3 text-sm text-right font-medium
                          ${cat.income - cat.expenses >= 0 ? 'text-green-600' : 'text-red-600'}
                        `
                      }, 
                        formatCurrency(cat.income - cat.expenses)
                      ),
                      h('td', { className: 'px-4 py-3 text-sm text-right text-gray-500' }, 
                        cat.count
                      )
                    )
                  )
                )
              )
            )
          ),

          // Top Expenses
          reportData.topExpenses.length > 0 && h('div', {},
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Top Expenses'),
            h('div', { className: 'space-y-2' },
              reportData.topExpenses.map((expense, index) => 
                h('div', {
                  key: index,
                  className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                },
                  h('div', {},
                    h('p', { className: 'font-medium text-gray-900' }, expense.description),
                    h('p', { className: 'text-sm text-gray-500' }, 
                      formatDate(expense.date, 'MMM dd')
                    )
                  ),
                  h('p', { className: 'font-semibold text-red-600' }, 
                    formatCurrency(expense.amount)
                  )
                )
              )
            )
          )
        ),

        // Annual Report
        reportType === 'annual' && h('div', { className: 'space-y-6' },
          h(ReportHeader, {
            title: `Annual Financial Report - ${reportData.year}`,
            subtitle: 'Year-over-year financial performance'
          }),

          // Annual Summary
          h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' },
            h(MetricBox, {
              label: 'Total Income',
              value: formatCurrency(reportData.totalIncome),
              color: 'green'
            }),
            h(MetricBox, {
              label: 'Total Expenses',
              value: formatCurrency(reportData.totalExpenses),
              color: 'red'
            }),
            h(MetricBox, {
              label: 'Total Savings',
              value: formatCurrency(reportData.totalSavings),
              color: 'blue'
            })
          ),

          // Monthly Trend Chart
          h('div', { className: 'mb-6' },
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Monthly Trends'),
            h(FinancialCharts.CashFlowChart, {
              data: reportData.monthlyData,
              height: 400
            })
          ),

          // Goals Progress
          reportData.goalsProgress.length > 0 && h('div', {},
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Savings Goals Progress'),
            h('div', { className: 'space-y-3' },
              reportData.goalsProgress.map((goal, index) => 
                h('div', { key: index, className: 'bg-gray-50 p-4 rounded-lg' },
                  h('div', { className: 'flex items-center justify-between mb-2' },
                    h('span', { className: 'font-medium text-gray-900' }, goal.name),
                    h('span', { className: 'text-sm text-gray-500' }, 
                      `${goal.progress}% complete`
                    )
                  ),
                  h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                    h('div', {
                      className: 'h-2 rounded-full bg-blue-600',
                      style: { width: `${goal.progress}%` }
                    })
                  ),
                  h('p', { className: 'text-sm text-gray-500 mt-2' },
                    `${formatCurrency(goal.remaining)} remaining`
                  )
                )
              )
            )
          )
        ),

        // Tax Report
        reportType === 'tax' && h('div', { className: 'space-y-6' },
          h(ReportHeader, {
            title: `Tax Report - ${reportData.taxYear}`,
            subtitle: 'Income and potential deductions for tax filing'
          }),

          h('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6' },
            h('div', { className: 'flex items-start space-x-3' },
              h(Icons.AlertTriangle, { size: 20, className: 'text-yellow-600 mt-0.5' }),
              h('div', {},
                h('p', { className: 'text-sm font-medium text-yellow-800' }, 
                  'Tax Disclaimer'
                ),
                h('p', { className: 'text-sm text-yellow-700 mt-1' }, 
                  'This report is for informational purposes only. Please consult with a tax professional for accurate tax advice and filing.'
                )
              )
            )
          ),

          // Income Summary
          h('div', { className: 'mb-6' },
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Income Summary'),
            h('div', { className: 'bg-gray-50 rounded-lg p-4' },
              Object.entries(reportData.income).map(([category, amount]) => 
                h('div', {
                  key: category,
                  className: 'flex items-center justify-between py-2'
                },
                  h('span', { className: 'text-gray-700 capitalize' }, category),
                  h('span', { className: 'font-medium text-gray-900' }, 
                    formatCurrency(amount)
                  )
                )
              ),
              h('div', { 
                className: 'flex items-center justify-between pt-3 mt-3 border-t border-gray-200' 
              },
                h('span', { className: 'font-semibold text-gray-900' }, 'Total Income'),
                h('span', { className: 'font-bold text-gray-900' }, 
                  formatCurrency(reportData.totalIncome)
                )
              )
            )
          ),

          // Deductions Summary
          h('div', {},
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Potential Deductions'),
            h('div', { className: 'bg-gray-50 rounded-lg p-4' },
              Object.entries(reportData.deductions).map(([category, amount]) => 
                h('div', {
                  key: category,
                  className: 'flex items-center justify-between py-2'
                },
                  h('span', { className: 'text-gray-700 capitalize' }, 
                    category.replace(/([A-Z])/g, ' $1').trim()
                  ),
                  h('span', { className: 'font-medium text-gray-900' }, 
                    formatCurrency(amount)
                  )
                )
              ),
              h('div', { 
                className: 'flex items-center justify-between pt-3 mt-3 border-t border-gray-200' 
              },
                h('span', { className: 'font-semibold text-gray-900' }, 'Total Deductions'),
                h('span', { className: 'font-bold text-gray-900' }, 
                  formatCurrency(reportData.totalDeductions)
                )
              )
            )
          )
        ),

        // Budget Report
        reportType === 'budget' && h('div', { className: 'space-y-6' },
          h(ReportHeader, {
            title: 'Budget Performance Report',
            subtitle: 'Analysis of budget vs actual spending'
          }),

          h('div', { className: 'overflow-x-auto' },
            h('table', { className: 'w-full' },
              h('thead', { className: 'bg-gray-50 border-b border-gray-200' },
                h('tr', {},
                  h('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 
                    'Budget'
                  ),
                  h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                    'Budgeted'
                  ),
                  h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                    'Spent'
                  ),
                  h('th', { className: 'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase' }, 
                    'Variance'
                  ),
                  h('th', { className: 'px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase' }, 
                    'Status'
                  )
                )
              ),
              h('tbody', { className: 'divide-y divide-gray-200' },
                reportData.map(budget => 
                  h('tr', { key: budget.name, className: 'hover:bg-gray-50' },
                    h('td', { className: 'px-4 py-3' },
                      h('div', {},
                        h('p', { className: 'text-sm font-medium text-gray-900' }, budget.name),
                        h('p', { className: 'text-xs text-gray-500' }, 
                          `${budget.transactions} transactions`
                        )
                      )
                    ),
                    h('td', { className: 'px-4 py-3 text-sm text-right text-gray-900' }, 
                      formatCurrency(budget.budgeted)
                    ),
                    h('td', { className: 'px-4 py-3 text-sm text-right text-gray-900' }, 
                      formatCurrency(budget.spent)
                    ),
                    h('td', { 
                      className: `px-4 py-3 text-sm text-right font-medium
                        ${budget.variance >= 0 ? 'text-green-600' : 'text-red-600'}
                      `
                    }, 
                      `${budget.variance >= 0 ? '+' : ''}${formatCurrency(budget.variance)} (${budget.variancePercent}%)`
                    ),
                    h('td', { className: 'px-4 py-3 text-center' },
                      h('span', {
                        className: `
                          inline-flex px-2 py-1 text-xs font-medium rounded-full
                          ${budget.status === 'good' ? 'bg-green-100 text-green-800' : ''}
                          ${budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${budget.status === 'over' ? 'bg-red-100 text-red-800' : ''}
                        `
                      }, budget.status.toUpperCase())
                    )
                  )
                )
              )
            )
          ),

          // Budget Chart
          h('div', { className: 'mt-6' },
            h('h4', { className: 'text-lg font-semibold mb-4' }, 'Budget vs Actual'),
            h(FinancialCharts.BudgetComparisonChart, {
              data: reportData.map(b => ({
                category: b.name,
                budget: b.budgeted,
                actual: b.spent
              })),
              height: 300
            })
          )
        )
      )
    );
  };

  /**
   * Export all finance components to global FinanceApp object
   * Following the Module pattern for encapsulation
   */
  window.FinanceApp = window.FinanceApp || {};
  window.FinanceApp.FinanceComponents = {
    // Transaction Components
    TransactionList,
    TransactionForm,
    
    // Budget Components
    BudgetManager,
    ExpenseTracker,
    
    // Income Components
    IncomeManager,
    
    // Bill Components
    BillTracker,
    
    // Savings Components
    SavingsGoals,
    
    // Chart Components
    FinancialCharts,
    
    // Report Components
    FinancialReports,
    
    // Factory pattern for creating finance components
    createFinanceComponent: (type, props) => {
      const components = {
        'transaction-list': TransactionList,
        'transaction-form': TransactionForm,
        'budget-manager': BudgetManager,
        'expense-tracker': ExpenseTracker,
        'income-manager': IncomeManager,
        'bill-tracker': BillTracker,
        'savings-goals': SavingsGoals,
        'financial-reports': FinancialReports
      };
      
      const Component = components[type];
      if (!Component) {
        throw new Error(`Unknown finance component type: ${type}`);
      }
      
      return h(Component, props);
    }
  };

})();