/**
 * Family Finance Dashboard v3.1.0
 * Multi-Currency & Internationalization Features
 * 
 * Provides comprehensive multi-currency support and internationalization (i18n)
 * including real-time exchange rates, currency conversion, and language support
 */

(function(window) {
  'use strict';

  const { React, ReactDOM } = window;
  const { Utils, ActionTypes, useFinance, CONFIG } = window.FinanceApp;

  // Exchange rate service with simulated real-time updates
  const ExchangeRateService = (() => {
    const BASE_CURRENCY = 'USD';
    const UPDATE_INTERVAL = 300000; // 5 minutes
    
    // Simulated exchange rates (in production, would fetch from API)
    const baseRates = {
      USD: 1.00,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.50,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.50,
      BRL: 5.25,
      MXN: 20.50,
      SGD: 1.35,
      HKD: 7.75,
      NZD: 1.42,
      SEK: 8.65,
      NOK: 8.55,
      DKK: 6.35,
      PLN: 3.95,
      ZAR: 15.25,
      AED: 3.67
    };

    let rates = { ...baseRates };
    let listeners = [];
    let updateTimer = null;

    // Simulate rate fluctuations
    const simulateRateChanges = () => {
      const newRates = {};
      Object.keys(rates).forEach(currency => {
        if (currency !== BASE_CURRENCY) {
          // Simulate ±0.5% fluctuation
          const fluctuation = (Math.random() - 0.5) * 0.01;
          newRates[currency] = rates[currency] * (1 + fluctuation);
        } else {
          newRates[currency] = 1;
        }
      });
      rates = newRates;
      notifyListeners();
    };

    const notifyListeners = () => {
      listeners.forEach(listener => listener(rates));
    };

    const startUpdates = () => {
      if (!updateTimer) {
        updateTimer = setInterval(simulateRateChanges, UPDATE_INTERVAL);
      }
    };

    const stopUpdates = () => {
      if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
      }
    };

    return {
      getRates: () => ({ ...rates }),
      getRate: (from, to) => {
        if (from === to) return 1;
        if (from === BASE_CURRENCY) return rates[to];
        if (to === BASE_CURRENCY) return 1 / rates[from];
        return rates[to] / rates[from];
      },
      convert: (amount, from, to) => {
        return amount * ExchangeRateService.getRate(from, to);
      },
      subscribe: (listener) => {
        listeners.push(listener);
        startUpdates();
        return () => {
          listeners = listeners.filter(l => l !== listener);
          if (listeners.length === 0) stopUpdates();
        };
      },
      getCurrencies: () => Object.keys(rates),
      getHistoricalRates: (currency, days = 30) => {
        // Simulate historical data
        const historical = [];
        const now = new Date();
        const currentRate = rates[currency];
        
        for (let i = days; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          // Simulate historical fluctuation
          const fluctuation = (Math.random() - 0.5) * 0.02;
          historical.push({
            date: date.toISOString().split('T')[0],
            rate: currentRate * (1 + fluctuation)
          });
        }
        return historical;
      }
    };
  })();

  // Internationalization service
  const i18n = (() => {
    const translations = {
      en: {
        // Common
        app_name: 'Family Finance Dashboard',
        welcome: 'Welcome',
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        budgets: 'Budgets',
        bills: 'Bills',
        savings: 'Savings',
        reports: 'Reports',
        settings: 'Settings',
        
        // Actions
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        
        // Finance specific
        income: 'Income',
        expense: 'Expense',
        transfer: 'Transfer',
        balance: 'Balance',
        amount: 'Amount',
        category: 'Category',
        date: 'Date',
        description: 'Description',
        currency: 'Currency',
        exchange_rate: 'Exchange Rate',
        
        // Time periods
        today: 'Today',
        yesterday: 'Yesterday',
        this_week: 'This Week',
        this_month: 'This Month',
        this_year: 'This Year',
        last_30_days: 'Last 30 Days',
        
        // Messages
        success_saved: 'Successfully saved',
        error_occurred: 'An error occurred',
        confirm_delete: 'Are you sure you want to delete this item?',
        no_data: 'No data available',
        loading: 'Loading...'
      },
      es: {
        app_name: 'Panel de Finanzas Familiares',
        welcome: 'Bienvenido',
        dashboard: 'Panel',
        transactions: 'Transacciones',
        budgets: 'Presupuestos',
        bills: 'Facturas',
        savings: 'Ahorros',
        reports: 'Informes',
        settings: 'Configuración',
        add: 'Añadir',
        edit: 'Editar',
        delete: 'Eliminar',
        save: 'Guardar',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        search: 'Buscar',
        filter: 'Filtrar',
        export: 'Exportar',
        import: 'Importar',
        income: 'Ingresos',
        expense: 'Gastos',
        transfer: 'Transferencia',
        balance: 'Saldo',
        amount: 'Cantidad',
        category: 'Categoría',
        date: 'Fecha',
        description: 'Descripción',
        currency: 'Moneda',
        exchange_rate: 'Tipo de Cambio',
        today: 'Hoy',
        yesterday: 'Ayer',
        this_week: 'Esta Semana',
        this_month: 'Este Mes',
        this_year: 'Este Año',
        last_30_days: 'Últimos 30 Días',
        success_saved: 'Guardado exitosamente',
        error_occurred: 'Ocurrió un error',
        confirm_delete: '¿Está seguro de que desea eliminar este elemento?',
        no_data: 'No hay datos disponibles',
        loading: 'Cargando...'
      },
      fr: {
        app_name: 'Tableau de Bord Finances Familiales',
        welcome: 'Bienvenue',
        dashboard: 'Tableau de bord',
        transactions: 'Transactions',
        budgets: 'Budgets',
        bills: 'Factures',
        savings: 'Épargne',
        reports: 'Rapports',
        settings: 'Paramètres',
        add: 'Ajouter',
        edit: 'Modifier',
        delete: 'Supprimer',
        save: 'Enregistrer',
        cancel: 'Annuler',
        confirm: 'Confirmer',
        search: 'Rechercher',
        filter: 'Filtrer',
        export: 'Exporter',
        import: 'Importer',
        income: 'Revenus',
        expense: 'Dépenses',
        transfer: 'Transfert',
        balance: 'Solde',
        amount: 'Montant',
        category: 'Catégorie',
        date: 'Date',
        description: 'Description',
        currency: 'Devise',
        exchange_rate: 'Taux de Change',
        today: "Aujourd'hui",
        yesterday: 'Hier',
        this_week: 'Cette Semaine',
        this_month: 'Ce Mois',
        this_year: 'Cette Année',
        last_30_days: '30 Derniers Jours',
        success_saved: 'Enregistré avec succès',
        error_occurred: 'Une erreur est survenue',
        confirm_delete: 'Êtes-vous sûr de vouloir supprimer cet élément?',
        no_data: 'Aucune donnée disponible',
        loading: 'Chargement...'
      },
      de: {
        app_name: 'Familienfinanz-Dashboard',
        welcome: 'Willkommen',
        dashboard: 'Dashboard',
        transactions: 'Transaktionen',
        budgets: 'Budgets',
        bills: 'Rechnungen',
        savings: 'Ersparnisse',
        reports: 'Berichte',
        settings: 'Einstellungen',
        add: 'Hinzufügen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        confirm: 'Bestätigen',
        search: 'Suchen',
        filter: 'Filtern',
        export: 'Exportieren',
        import: 'Importieren',
        income: 'Einkommen',
        expense: 'Ausgaben',
        transfer: 'Überweisung',
        balance: 'Saldo',
        amount: 'Betrag',
        category: 'Kategorie',
        date: 'Datum',
        description: 'Beschreibung',
        currency: 'Währung',
        exchange_rate: 'Wechselkurs',
        today: 'Heute',
        yesterday: 'Gestern',
        this_week: 'Diese Woche',
        this_month: 'Diesen Monat',
        this_year: 'Dieses Jahr',
        last_30_days: 'Letzte 30 Tage',
        success_saved: 'Erfolgreich gespeichert',
        error_occurred: 'Ein Fehler ist aufgetreten',
        confirm_delete: 'Sind Sie sicher, dass Sie dieses Element löschen möchten?',
        no_data: 'Keine Daten verfügbar',
        loading: 'Laden...'
      },
      ja: {
        app_name: '家族財務ダッシュボード',
        welcome: 'ようこそ',
        dashboard: 'ダッシュボード',
        transactions: '取引',
        budgets: '予算',
        bills: '請求書',
        savings: '貯蓄',
        reports: 'レポート',
        settings: '設定',
        add: '追加',
        edit: '編集',
        delete: '削除',
        save: '保存',
        cancel: 'キャンセル',
        confirm: '確認',
        search: '検索',
        filter: 'フィルター',
        export: 'エクスポート',
        import: 'インポート',
        income: '収入',
        expense: '支出',
        transfer: '振替',
        balance: '残高',
        amount: '金額',
        category: 'カテゴリー',
        date: '日付',
        description: '説明',
        currency: '通貨',
        exchange_rate: '為替レート',
        today: '今日',
        yesterday: '昨日',
        this_week: '今週',
        this_month: '今月',
        this_year: '今年',
        last_30_days: '過去30日間',
        success_saved: '正常に保存されました',
        error_occurred: 'エラーが発生しました',
        confirm_delete: 'このアイテムを削除してもよろしいですか？',
        no_data: 'データがありません',
        loading: '読み込み中...'
      }
    };

    let currentLocale = 'en';
    let listeners = [];

    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

    const notify = () => {
      listeners.forEach(listener => listener(currentLocale));
    };

    return {
      setLocale: (locale) => {
        if (translations[locale]) {
          currentLocale = locale;
          document.documentElement.lang = locale;
          document.documentElement.dir = rtlLanguages.includes(locale) ? 'rtl' : 'ltr';
          notify();
        }
      },
      getLocale: () => currentLocale,
      t: (key, params = {}) => {
        let text = translations[currentLocale][key] || translations['en'][key] || key;
        // Replace parameters like {name} with actual values
        Object.keys(params).forEach(param => {
          text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        });
        return text;
      },
      getAvailableLocales: () => Object.keys(translations),
      subscribe: (listener) => {
        listeners.push(listener);
        return () => {
          listeners = listeners.filter(l => l !== listener);
        };
      },
      isRTL: () => rtlLanguages.includes(currentLocale)
    };
  })();

  // Locale formatting utilities
  const LocaleFormatter = {
    // Format number based on locale
    formatNumber: (number, locale = i18n.getLocale(), options = {}) => {
      return new Intl.NumberFormat(locale, options).format(number);
    },

    // Format currency based on locale and currency code
    formatCurrency: (amount, currency, locale = i18n.getLocale()) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },

    // Format date based on locale
    formatDate: (date, locale = i18n.getLocale(), options = {}) => {
      return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    },

    // Format relative time
    formatRelativeTime: (date, locale = i18n.getLocale()) => {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const daysDiff = Math.round((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) return i18n.t('today');
      if (daysDiff === -1) return i18n.t('yesterday');
      if (daysDiff > -7 && daysDiff < 0) return rtf.format(daysDiff, 'day');
      if (daysDiff > -30 && daysDiff < 0) return rtf.format(Math.round(daysDiff / 7), 'week');
      return this.formatDate(date, locale);
    },

    // Parse number from locale format
    parseNumber: (str, locale = i18n.getLocale()) => {
      const formatter = new Intl.NumberFormat(locale);
      const parts = formatter.formatToParts(12345.6);
      const numerals = Array.from({ length: 10 }).map((_, i) => formatter.format(i));
      const index = new Map(numerals.map((d, i) => [d, i]));
      const group = new RegExp(`[${parts.find(d => d.type === 'group')?.value}]`, 'g');
      const decimal = new RegExp(`[${parts.find(d => d.type === 'decimal')?.value}]`);
      const numeral = new RegExp(`[${numerals.join('')}]`, 'g');
      
      return parseFloat(str.trim()
        .replace(group, '')
        .replace(decimal, '.')
        .replace(numeral, d => index.get(d)));
    },

    // Get currency symbol position
    getCurrencySymbolPosition: (currency, locale = i18n.getLocale()) => {
      const formatted = this.formatCurrency(1, currency, locale);
      const symbol = formatted.replace(/[\d.,\s]/g, '');
      return formatted.indexOf(symbol) === 0 ? 'before' : 'after';
    }
  };

  // Currency selector component
  const CurrencySelector = ({ value, onChange, className = '' }) => {
    const currencies = ExchangeRateService.getCurrencies();
    
    return React.createElement('select', {
      value: value,
      onChange: (e) => onChange(e.target.value),
      className: `px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
    },
      currencies.map(currency => 
        React.createElement('option', { key: currency, value: currency },
          `${currency} - ${LocaleFormatter.formatCurrency(1000, currency).replace(/[\d.,\s]/g, '').trim()}`
        )
      )
    );
  };

  // Language selector component
  const LanguageSelector = ({ className = '' }) => {
    const [locale, setLocale] = React.useState(i18n.getLocale());
    
    React.useEffect(() => {
      const unsubscribe = i18n.subscribe(newLocale => {
        setLocale(newLocale);
      });
      return unsubscribe;
    }, []);

    const languages = {
      en: { name: 'English', flag: '🇬🇧' },
      es: { name: 'Español', flag: '🇪🇸' },
      fr: { name: 'Français', flag: '🇫🇷' },
      de: { name: 'Deutsch', flag: '🇩🇪' },
      ja: { name: '日本語', flag: '🇯🇵' }
    };

    return React.createElement('select', {
      value: locale,
      onChange: (e) => i18n.setLocale(e.target.value),
      className: `px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
    },
      Object.entries(languages).map(([code, lang]) => 
        React.createElement('option', { key: code, value: code },
          `${lang.flag} ${lang.name}`
        )
      )
    );
  };

  // Currency converter component
  const CurrencyConverter = () => {
    const [amount, setAmount] = React.useState('100');
    const [fromCurrency, setFromCurrency] = React.useState('USD');
    const [toCurrency, setToCurrency] = React.useState('EUR');
    const [rates, setRates] = React.useState(ExchangeRateService.getRates());
    const [historicalData, setHistoricalData] = React.useState([]);

    React.useEffect(() => {
      const unsubscribe = ExchangeRateService.subscribe(newRates => {
        setRates(newRates);
      });
      return unsubscribe;
    }, []);

    React.useEffect(() => {
      setHistoricalData(ExchangeRateService.getHistoricalRates(toCurrency, 30));
    }, [toCurrency]);

    const convertedAmount = ExchangeRateService.convert(
      parseFloat(amount) || 0,
      fromCurrency,
      toCurrency
    );

    const swapCurrencies = () => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    };

    return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
        i18n.t('currency') + ' ' + i18n.t('converter', { defaultValue: 'Converter' })
      ),
      
      React.createElement('div', { className: 'space-y-4' },
        // From currency
        React.createElement('div', { className: 'flex items-center space-x-2' },
          React.createElement('input', {
            type: 'number',
            value: amount,
            onChange: (e) => setAmount(e.target.value),
            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            placeholder: i18n.t('amount')
          }),
          React.createElement(CurrencySelector, {
            value: fromCurrency,
            onChange: setFromCurrency,
            className: 'w-32'
          })
        ),
        
        // Swap button
        React.createElement('div', { className: 'flex justify-center' },
          React.createElement('button', {
            onClick: swapCurrencies,
            className: 'p-2 text-gray-600 hover:text-gray-800 transition-colors',
            'aria-label': 'Swap currencies'
          },
            React.createElement('svg', {
              className: 'w-6 h-6',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
              })
            )
          )
        ),
        
        // To currency
        React.createElement('div', { className: 'flex items-center space-x-2' },
          React.createElement('input', {
            type: 'text',
            value: LocaleFormatter.formatNumber(convertedAmount, i18n.getLocale(), {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
            readOnly: true,
            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50'
          }),
          React.createElement(CurrencySelector, {
            value: toCurrency,
            onChange: setToCurrency,
            className: 'w-32'
          })
        ),
        
        // Exchange rate info
        React.createElement('div', { className: 'text-sm text-gray-600 text-center' },
          `1 ${fromCurrency} = ${LocaleFormatter.formatNumber(
            ExchangeRateService.getRate(fromCurrency, toCurrency),
            i18n.getLocale(),
            { minimumFractionDigits: 4, maximumFractionDigits: 4 }
          )} ${toCurrency}`
        ),
        
        // Mini chart for historical rates
        React.createElement('div', { className: 'mt-4 h-32' },
          React.createElement(window.Recharts.ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(window.Recharts.LineChart, { data: historicalData },
              React.createElement(window.Recharts.XAxis, {
                dataKey: 'date',
                tickFormatter: (date) => LocaleFormatter.formatDate(date, i18n.getLocale(), { month: 'short', day: 'numeric' })
              }),
              React.createElement(window.Recharts.YAxis, {
                domain: ['dataMin - 0.01', 'dataMax + 0.01'],
                tickFormatter: (value) => value.toFixed(3)
              }),
              React.createElement(window.Recharts.Tooltip, {
                formatter: (value) => LocaleFormatter.formatNumber(value, i18n.getLocale(), {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4
                })
              }),
              React.createElement(window.Recharts.Line, {
                type: 'monotone',
                dataKey: 'rate',
                stroke: '#3B82F6',
                strokeWidth: 2,
                dot: false
              })
            )
          )
        )
      )
    );
  };

  // Multi-currency account component
  const MultiCurrencyAccount = () => {
    const { state, actions } = useFinance();
    const [accounts, setAccounts] = React.useState([
      { id: '1', name: 'USD Account', currency: 'USD', balance: 5000 },
      { id: '2', name: 'EUR Account', currency: 'EUR', balance: 3000 },
      { id: '3', name: 'GBP Account', currency: 'GBP', balance: 2000 }
    ]);
    const [showAddAccount, setShowAddAccount] = React.useState(false);
    const [newAccount, setNewAccount] = React.useState({ name: '', currency: 'USD', balance: 0 });

    const totalInBaseCurrency = accounts.reduce((total, account) => {
      return total + ExchangeRateService.convert(account.balance, account.currency, 'USD');
    }, 0);

    const addAccount = () => {
      if (newAccount.name && newAccount.currency) {
        setAccounts([...accounts, {
          ...newAccount,
          id: Utils.generateUUID(),
          balance: parseFloat(newAccount.balance) || 0
        }]);
        setNewAccount({ name: '', currency: 'USD', balance: 0 });
        setShowAddAccount(false);
      }
    };

    return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h3', { className: 'text-lg font-semibold' }, 
          i18n.t('multi_currency_accounts', { defaultValue: 'Multi-Currency Accounts' })
        ),
        React.createElement('button', {
          onClick: () => setShowAddAccount(true),
          className: 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm'
        }, i18n.t('add') + ' ' + i18n.t('account', { defaultValue: 'Account' }))
      ),
      
      // Total balance
      React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 rounded-lg' },
        React.createElement('div', { className: 'text-sm text-gray-600' }, 
          i18n.t('total_balance', { defaultValue: 'Total Balance' }) + ' (USD)'
        ),
        React.createElement('div', { className: 'text-2xl font-bold text-gray-800' },
          LocaleFormatter.formatCurrency(totalInBaseCurrency, 'USD')
        )
      ),
      
      // Account list
      React.createElement('div', { className: 'space-y-3' },
        accounts.map(account => 
          React.createElement('div', {
            key: account.id,
            className: 'flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          },
            React.createElement('div', null,
              React.createElement('div', { className: 'font-medium' }, account.name),
              React.createElement('div', { className: 'text-sm text-gray-600' },
                `${LocaleFormatter.formatCurrency(account.balance, account.currency)} ≈ ${
                  LocaleFormatter.formatCurrency(
                    ExchangeRateService.convert(account.balance, account.currency, 'USD'),
                    'USD'
                  )
                }`
              )
            ),
            React.createElement('div', { className: 'text-lg font-semibold text-right' },
              LocaleFormatter.formatCurrency(account.balance, account.currency)
            )
          )
        )
      ),
      
      // Add account modal
      showAddAccount && React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: () => setShowAddAccount(false)
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg p-6 w-96',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 
            i18n.t('add') + ' ' + i18n.t('account', { defaultValue: 'Account' })
          ),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('input', {
              type: 'text',
              value: newAccount.name,
              onChange: (e) => setNewAccount({ ...newAccount, name: e.target.value }),
              placeholder: i18n.t('account_name', { defaultValue: 'Account Name' }),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            }),
            React.createElement(CurrencySelector, {
              value: newAccount.currency,
              onChange: (currency) => setNewAccount({ ...newAccount, currency }),
              className: 'w-full'
            }),
            React.createElement('input', {
              type: 'number',
              value: newAccount.balance,
              onChange: (e) => setNewAccount({ ...newAccount, balance: e.target.value }),
              placeholder: i18n.t('initial_balance', { defaultValue: 'Initial Balance' }),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            }),
            React.createElement('div', { className: 'flex justify-end space-x-2' },
              React.createElement('button', {
                onClick: () => setShowAddAccount(false),
                className: 'px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
              }, i18n.t('cancel')),
              React.createElement('button', {
                onClick: addAccount,
                className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
              }, i18n.t('add'))
            )
          )
        )
      )
    );
  };

  // Currency gain/loss tracker
  const CurrencyGainLossTracker = () => {
    const [baseCurrency] = React.useState('USD');
    const [holdings] = React.useState([
      { currency: 'EUR', amount: 5000, purchaseRate: 0.82, currentRate: 0.85 },
      { currency: 'GBP', amount: 3000, purchaseRate: 0.75, currentRate: 0.73 },
      { currency: 'JPY', amount: 100000, purchaseRate: 105, currentRate: 110.50 }
    ]);

    const calculateGainLoss = (holding) => {
      const purchaseValue = holding.amount / holding.purchaseRate;
      const currentValue = holding.amount / holding.currentRate;
      const gainLoss = currentValue - purchaseValue;
      const percentage = (gainLoss / purchaseValue) * 100;
      return { gainLoss, percentage };
    };

    const totalGainLoss = holdings.reduce((total, holding) => {
      const { gainLoss } = calculateGainLoss(holding);
      return total + gainLoss;
    }, 0);

    return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
        i18n.t('currency_gain_loss', { defaultValue: 'Currency Gain/Loss' })
      ),
      
      React.createElement('div', { className: 'mb-4 p-4 bg-gray-50 rounded-lg' },
        React.createElement('div', { className: 'text-sm text-gray-600' }, 
          i18n.t('total_gain_loss', { defaultValue: 'Total Gain/Loss' })
        ),
        React.createElement('div', {
          className: `text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`
        },
          `${totalGainLoss >= 0 ? '+' : ''}${LocaleFormatter.formatCurrency(totalGainLoss, baseCurrency)}`
        )
      ),
      
      React.createElement('div', { className: 'space-y-3' },
        holdings.map((holding, index) => {
          const { gainLoss, percentage } = calculateGainLoss(holding);
          const isPositive = gainLoss >= 0;
          
          return React.createElement('div', {
            key: index,
            className: 'p-4 border border-gray-200 rounded-lg'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, 
                  `${LocaleFormatter.formatCurrency(holding.amount, holding.currency)}`
                ),
                React.createElement('div', { className: 'text-sm text-gray-600' },
                  `${i18n.t('purchase_rate', { defaultValue: 'Purchase Rate' })}: ${holding.purchaseRate}`,
                  ' → ',
                  `${i18n.t('current_rate', { defaultValue: 'Current Rate' })}: ${holding.currentRate}`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', {
                  className: `font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`
                },
                  `${isPositive ? '+' : ''}${LocaleFormatter.formatCurrency(gainLoss, baseCurrency)}`
                ),
                React.createElement('div', {
                  className: `text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`
                },
                  `${isPositive ? '+' : ''}${percentage.toFixed(2)}%`
                )
              )
            )
          );
        })
      )
    );
  };

  // Internationalized transaction form
  const I18nTransactionForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = React.useState({
      type: initialData?.type || 'expense',
      amount: initialData?.amount || '',
      currency: initialData?.currency || 'USD',
      category: initialData?.category || '',
      description: initialData?.description || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      ...initialData
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        amount: LocaleFormatter.parseNumber(formData.amount)
      });
    };

    const categories = {
      income: ['salary', 'freelance', 'investment', 'gift', 'other'],
      expense: ['food', 'transport', 'utilities', 'entertainment', 'shopping', 'health', 'other']
    };

    return React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      // Transaction type
      React.createElement('div', { className: 'flex space-x-4' },
        ['income', 'expense'].map(type =>
          React.createElement('label', {
            key: type,
            className: 'flex items-center space-x-2 cursor-pointer'
          },
            React.createElement('input', {
              type: 'radio',
              name: 'type',
              value: type,
              checked: formData.type === type,
              onChange: (e) => setFormData({ ...formData, type: e.target.value, category: '' }),
              className: 'text-blue-500'
            }),
            React.createElement('span', { className: 'capitalize' }, i18n.t(type))
          )
        )
      ),
      
      // Amount and currency
      React.createElement('div', { className: 'flex space-x-2' },
        React.createElement('input', {
          type: 'text',
          value: formData.amount,
          onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
          placeholder: i18n.t('amount'),
          className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          required: true
        }),
        React.createElement(CurrencySelector, {
          value: formData.currency,
          onChange: (currency) => setFormData({ ...formData, currency }),
          className: 'w-32'
        })
      ),
      
      // Category
      React.createElement('select', {
        value: formData.category,
        onChange: (e) => setFormData({ ...formData, category: e.target.value }),
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        required: true
      },
        React.createElement('option', { value: '' }, i18n.t('select_category', { defaultValue: 'Select Category' })),
        categories[formData.type].map(cat =>
          React.createElement('option', { key: cat, value: cat }, 
            i18n.t(`category_${cat}`, { defaultValue: cat.charAt(0).toUpperCase() + cat.slice(1) })
          )
        )
      ),
      
      // Description
      React.createElement('input', {
        type: 'text',
        value: formData.description,
        onChange: (e) => setFormData({ ...formData, description: e.target.value }),
        placeholder: i18n.t('description'),
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      }),
      
      // Date
      React.createElement('input', {
        type: 'date',
        value: formData.date,
        onChange: (e) => setFormData({ ...formData, date: e.target.value }),
        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        required: true
      }),
      
      // Buttons
      React.createElement('div', { className: 'flex justify-end space-x-2' },
        React.createElement('button', {
          type: 'button',
          onClick: onCancel,
          className: 'px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
        }, i18n.t('cancel')),
        React.createElement('button', {
          type: 'submit',
          className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        }, i18n.t('save'))
      )
    );
  };

  // Locale-aware date picker component
  const LocaleDatePicker = ({ value, onChange, locale = i18n.getLocale() }) => {
    const formatDateForInput = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return React.createElement('div', { className: 'relative' },
      React.createElement('input', {
        type: 'date',
        value: formatDateForInput(value),
        onChange: (e) => onChange(e.target.value),
        className: 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      }),
      React.createElement('div', { className: 'absolute top-full left-0 mt-1 text-sm text-gray-600' },
        LocaleFormatter.formatDate(value, locale, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      )
    );
  };

  // Export all components and utilities
  window.FinanceApp.InternationalFeatures = {
    // Services
    ExchangeRateService,
    i18n,
    LocaleFormatter,
    
    // Components
    CurrencySelector,
    LanguageSelector,
    CurrencyConverter,
    MultiCurrencyAccount,
    CurrencyGainLossTracker,
    I18nTransactionForm,
    LocaleDatePicker,
    
    // Helper to create i18n-aware components
    createI18nComponent: (Component) => {
      return (props) => {
        const [, forceUpdate] = React.useReducer(x => x + 1, 0);
        
        React.useEffect(() => {
          const unsubscribe = i18n.subscribe(() => forceUpdate());
          return unsubscribe;
        }, []);
        
        return React.createElement(Component, { ...props, i18n, LocaleFormatter });
      };
    }
  };

  // Auto-initialize with browser locale if available
  const browserLocale = navigator.language.split('-')[0];
  if (i18n.getAvailableLocales().includes(browserLocale)) {
    i18n.setLocale(browserLocale);
  }

})(window);