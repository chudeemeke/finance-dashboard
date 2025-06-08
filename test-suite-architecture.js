/**
 * Family Finance Dashboard v3.1.0
 * Comprehensive Test Suite Architecture
 * 
 * Full testing framework with unit, integration, E2E, performance,
 * security, and accessibility testing using Jest, React Testing Library,
 * Cypress, and custom testing utilities
 */

// Test Framework Architecture
const TestSuiteArchitecture = {
  /**
   * 1. TEST CATEGORIES
   */
  categories: {
    unit: {
      description: 'Isolated component and function testing',
      tools: ['Jest', 'React Testing Library'],
      coverage: 'Minimum 90%',
      files: [
        'unit/components/*.test.js',
        'unit/services/*.test.js',
        'unit/utils/*.test.js',
        'unit/hooks/*.test.js'
      ]
    },
    
    integration: {
      description: 'Component interaction and service integration',
      tools: ['Jest', 'React Testing Library', 'MSW'],
      coverage: 'Minimum 80%',
      files: [
        'integration/features/*.test.js',
        'integration/workflows/*.test.js',
        'integration/api/*.test.js'
      ]
    },
    
    e2e: {
      description: 'End-to-end user workflows',
      tools: ['Cypress', 'Playwright'],
      coverage: 'Critical paths 100%',
      files: [
        'e2e/workflows/*.cy.js',
        'e2e/features/*.cy.js',
        'e2e/smoke/*.cy.js'
      ]
    },
    
    performance: {
      description: 'Performance benchmarks and optimization',
      tools: ['Lighthouse CI', 'Web Vitals', 'Custom benchmarks'],
      metrics: {
        FCP: '< 1.8s',
        LCP: '< 2.5s',
        FID: '< 100ms',
        CLS: '< 0.1'
      }
    },
    
    security: {
      description: 'Security vulnerability testing',
      tools: ['OWASP ZAP', 'Custom security tests'],
      checks: [
        'XSS prevention',
        'CSRF protection',
        'SQL injection',
        'Authentication bypass',
        'Data encryption'
      ]
    },
    
    accessibility: {
      description: 'WCAG 2.1 AA compliance',
      tools: ['axe-core', 'Pa11y', 'NVDA testing'],
      standards: ['WCAG 2.1 AA', 'Section 508']
    },
    
    visual: {
      description: 'Visual regression testing',
      tools: ['Percy', 'Chromatic', 'BackstopJS'],
      coverage: 'All major components'
    },
    
    mobile: {
      description: 'Mobile-specific testing',
      tools: ['Cypress Mobile', 'BrowserStack'],
      devices: ['iPhone 12', 'Samsung Galaxy S21', 'iPad Pro']
    }
  },

  /**
   * 2. TEST STRUCTURE
   */
  structure: {
    root: 'tests/',
    directories: {
      unit: {
        components: 'unit/components/',
        services: 'unit/services/',
        utils: 'unit/utils/',
        hooks: 'unit/hooks/',
        patterns: 'unit/patterns/'
      },
      integration: {
        features: 'integration/features/',
        workflows: 'integration/workflows/',
        api: 'integration/api/',
        state: 'integration/state/'
      },
      e2e: {
        workflows: 'e2e/workflows/',
        features: 'e2e/features/',
        smoke: 'e2e/smoke/',
        regression: 'e2e/regression/'
      },
      fixtures: 'fixtures/',
      mocks: 'mocks/',
      helpers: 'helpers/',
      snapshots: '__snapshots__/'
    }
  },

  /**
   * 3. TEST UTILITIES
   */
  utilities: {
    testingLibrary: {
      render: 'Custom render with providers',
      userEvent: 'Enhanced user event simulation',
      queries: 'Custom queries for finance components',
      matchers: 'Custom Jest matchers'
    },
    
    factories: {
      user: 'User data factory',
      transaction: 'Transaction factory',
      account: 'Account factory',
      budget: 'Budget factory'
    },
    
    builders: {
      state: 'Redux state builder',
      component: 'Component prop builder',
      mock: 'Mock data builder'
    }
  }
};

/**
 * TEST IMPLEMENTATION EXAMPLES
 */

// 1. Base Test Setup
const TestSetup = `
// test-setup.js
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IndexedDB
require('fake-indexeddb/auto');

// Performance marks
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();
`;

// 2. Custom Render with All Providers
const CustomRender = `
// test-utils.js
import { render as rtlRender } from '@testing-library/react';
import { FinanceProvider } from '../app-state';
import { BrowserRouter } from 'react-router-dom';

const AllTheProviders = ({ children, initialState }) => {
  return React.createElement(
    FinanceProvider,
    { initialState },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        ErrorBoundary,
        null,
        children
      )
    )
  );
};

export const render = (ui, options = {}) => {
  const { initialState, ...renderOptions } = options;
  
  return rtlRender(ui, {
    wrapper: (props) => React.createElement(
      AllTheProviders,
      { ...props, initialState }
    ),
    ...renderOptions
  });
};

export * from '@testing-library/react';
export { render };
`;

// 3. Test Data Factories
const TestFactories = `
// factories/index.js
import { faker } from '@faker-js/faker';

export const UserFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    name: faker.name.fullName(),
    role: faker.helpers.arrayElement(['admin', 'user', 'viewer']),
    createdAt: faker.date.past(),
    ...overrides
  }),
  
  buildList: (count, overrides = {}) => 
    Array.from({ length: count }, () => UserFactory.build(overrides))
};

export const TransactionFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    amount: faker.datatype.number({ min: -1000, max: 1000, precision: 0.01 }),
    description: faker.commerce.productName(),
    category: faker.helpers.arrayElement(['food', 'transport', 'utilities', 'entertainment']),
    date: faker.date.recent().toISOString().split('T')[0],
    type: faker.helpers.arrayElement(['income', 'expense']),
    ...overrides
  }),
  
  buildList: (count, overrides = {}) =>
    Array.from({ length: count }, () => TransactionFactory.build(overrides))
};

export const AccountFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    name: faker.finance.accountName(),
    type: faker.helpers.arrayElement(['checking', 'savings', 'credit']),
    balance: faker.datatype.number({ min: 0, max: 10000, precision: 0.01 }),
    currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
    ...overrides
  })
};
`;

// 4. Custom Jest Matchers
const CustomMatchers = `
// matchers/finance-matchers.js
expect.extend({
  toBeValidCurrency(received) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    const pass = validCurrencies.includes(received);
    
    return {
      pass,
      message: () => pass
        ? \`expected \${received} not to be a valid currency\`
        : \`expected \${received} to be a valid currency\`
    };
  },
  
  toBeWithinBudget(received, budget) {
    const pass = received <= budget;
    
    return {
      pass,
      message: () => pass
        ? \`expected \${received} not to be within budget of \${budget}\`
        : \`expected \${received} to be within budget of \${budget}\`
    };
  },
  
  toHavePositiveBalance(received) {
    const balance = received.balance || received;
    const pass = balance > 0;
    
    return {
      pass,
      message: () => pass
        ? \`expected balance \${balance} not to be positive\`
        : \`expected balance \${balance} to be positive\`
    };
  }
});
`;

// 5. Component Unit Test Example
const ComponentUnitTest = `
// unit/components/TransactionList.test.js
import { render, screen, waitFor, within } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '../../../app-components-finance';
import { TransactionFactory } from '../../factories';

describe('TransactionList', () => {
  const mockTransactions = TransactionFactory.buildList(5);
  
  it('renders transaction list with correct data', () => {
    render(React.createElement(TransactionList, {
      transactions: mockTransactions
    }));
    
    mockTransactions.forEach(transaction => {
      expect(screen.getByText(transaction.description)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(transaction.amount))).toBeInTheDocument();
    });
  });
  
  it('filters transactions by category', async () => {
    const user = userEvent.setup();
    render(React.createElement(TransactionList, {
      transactions: mockTransactions
    }));
    
    const filterSelect = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(filterSelect, 'food');
    
    const foodTransactions = mockTransactions.filter(t => t.category === 'food');
    const otherTransactions = mockTransactions.filter(t => t.category !== 'food');
    
    foodTransactions.forEach(transaction => {
      expect(screen.getByText(transaction.description)).toBeInTheDocument();
    });
    
    otherTransactions.forEach(transaction => {
      expect(screen.queryByText(transaction.description)).not.toBeInTheDocument();
    });
  });
  
  it('handles empty state correctly', () => {
    render(React.createElement(TransactionList, {
      transactions: []
    }));
    
    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });
  
  it('supports pagination', async () => {
    const user = userEvent.setup();
    const manyTransactions = TransactionFactory.buildList(25);
    
    render(React.createElement(TransactionList, {
      transactions: manyTransactions,
      itemsPerPage: 10
    }));
    
    // Check first page
    expect(screen.getAllByRole('row')).toHaveLength(11); // 10 + header
    
    // Navigate to second page
    const nextButton = screen.getByLabelText(/next page/i);
    await user.click(nextButton);
    
    // Check second page
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(11);
    });
  });
});
`;

// 6. Service Unit Test Example
const ServiceUnitTest = `
// unit/services/EncryptionService.test.js
import { EncryptionService } from '../../../app-features-security';

describe('EncryptionService', () => {
  const testData = { 
    username: 'testuser', 
    balance: 1234.56 
  };
  const testPassword = 'SecurePass123!';
  
  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts data correctly', async () => {
      const encrypted = await EncryptionService.encrypt(testData, testPassword);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toEqual(JSON.stringify(testData));
      
      const decrypted = await EncryptionService.decrypt(encrypted, testPassword);
      expect(decrypted).toEqual(testData);
    });
    
    it('fails to decrypt with wrong password', async () => {
      const encrypted = await EncryptionService.encrypt(testData, testPassword);
      
      await expect(
        EncryptionService.decrypt(encrypted, 'WrongPassword')
      ).rejects.toThrow();
    });
    
    it('generates different encrypted output for same data', async () => {
      const encrypted1 = await EncryptionService.encrypt(testData, testPassword);
      const encrypted2 = await EncryptionService.encrypt(testData, testPassword);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });
  });
  
  describe('session keys', () => {
    it('generates unique session keys', async () => {
      const key1 = await EncryptionService.generateSessionKey();
      const key2 = await EncryptionService.generateSessionKey();
      
      expect(key1).toBeTruthy();
      expect(key2).toBeTruthy();
      expect(key1).not.toEqual(key2);
    });
    
    it('encrypts with session key', async () => {
      const keyId = await EncryptionService.generateSessionKey();
      const encrypted = await EncryptionService.encryptWithSessionKey(testData, keyId);
      
      expect(encrypted).toBeTruthy();
      
      const decrypted = await EncryptionService.decryptWithSessionKey(encrypted, keyId);
      expect(decrypted).toEqual(testData);
    });
  });
});
`;

// 7. Integration Test Example
const IntegrationTest = `
// integration/features/MultiCurrency.test.js
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { MultiCurrencyAccount } from '../../../app-features-international';
import { ExchangeRateService } from '../../../app-features-international';
import { server, rest } from '../../mocks/server';

describe('Multi-Currency Integration', () => {
  beforeEach(() => {
    // Mock exchange rate API
    server.use(
      rest.get('/api/exchange-rates', (req, res, ctx) => {
        return res(ctx.json({
          base: 'USD',
          rates: {
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.50
          }
        }));
      })
    );
  });
  
  it('converts between currencies with live rates', async () => {
    const user = userEvent.setup();
    
    render(React.createElement(MultiCurrencyAccount));
    
    // Add EUR account
    const addButton = screen.getByText(/add account/i);
    await user.click(addButton);
    
    const nameInput = screen.getByPlaceholderText(/account name/i);
    await user.type(nameInput, 'European Account');
    
    const currencySelect = screen.getByLabelText(/currency/i);
    await user.selectOptions(currencySelect, 'EUR');
    
    const balanceInput = screen.getByPlaceholderText(/initial balance/i);
    await user.type(balanceInput, '1000');
    
    const saveButton = screen.getByText(/save/i);
    await user.click(saveButton);
    
    // Check conversion is displayed
    await waitFor(() => {
      expect(screen.getByText(/€1,000.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$1,176.47/)).toBeInTheDocument(); // 1000 / 0.85
    });
  });
  
  it('updates totals when exchange rates change', async () => {
    render(React.createElement(MultiCurrencyAccount));
    
    // Simulate rate change
    act(() => {
      ExchangeRateService.emit('ratesUpdated', {
        EUR: 0.90 // Changed from 0.85
      });
    });
    
    await waitFor(() => {
      // Total should update based on new rate
      const totalElement = screen.getByText(/total balance/i).nextSibling;
      expect(totalElement).toHaveTextContent(/\$1,111.11/); // 1000 / 0.90
    });
  });
});
`;

// 8. E2E Test Example
const E2ETest = `
// e2e/workflows/complete-financial-setup.cy.js
describe('Complete Financial Setup Workflow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('testuser@example.com', 'password123');
  });
  
  it('completes full financial profile setup', () => {
    // Step 1: Add bank accounts
    cy.get('[data-testid="add-account"]').click();
    cy.get('#account-name').type('Main Checking');
    cy.get('#account-type').select('checking');
    cy.get('#initial-balance').type('5000');
    cy.get('#currency').select('USD');
    cy.get('[data-testid="save-account"]').click();
    
    cy.contains('Account added successfully').should('be.visible');
    
    // Step 2: Set up budgets
    cy.get('[data-testid="nav-budgets"]').click();
    cy.get('[data-testid="create-budget"]').click();
    
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment'];
    const amounts = [500, 200, 150, 100];
    
    categories.forEach((category, index) => {
      cy.get('[data-testid="add-budget-category"]').click();
      cy.get(\`#category-\${index}\`).select(category);
      cy.get(\`#budget-amount-\${index}\`).type(amounts[index]);
    });
    
    cy.get('[data-testid="save-budgets"]').click();
    
    // Step 3: Import transactions
    cy.get('[data-testid="nav-import"]').click();
    cy.get('[data-testid="import-csv"]').click();
    
    const csvFile = 'cypress/fixtures/sample-transactions.csv';
    cy.get('input[type="file"]').attachFile(csvFile);
    
    cy.get('[data-testid="map-fields"]').within(() => {
      cy.get('#map-date').select('Transaction Date');
      cy.get('#map-amount').select('Amount');
      cy.get('#map-description').select('Description');
      cy.get('#map-category').select('Category');
    });
    
    cy.get('[data-testid="import-confirm"]').click();
    cy.contains('100 transactions imported').should('be.visible');
    
    // Step 4: Verify dashboard
    cy.get('[data-testid="nav-dashboard"]').click();
    
    // Check account balance
    cy.get('[data-testid="total-balance"]')
      .should('contain', '$5,000.00');
    
    // Check budget usage
    cy.get('[data-testid="budget-progress"]').within(() => {
      cy.get('.progress-bar').should('have.length', 4);
    });
    
    // Check recent transactions
    cy.get('[data-testid="recent-transactions"]')
      .find('tr')
      .should('have.length.at.least', 5);
    
    // Step 5: Enable 2FA
    cy.get('[data-testid="nav-security"]').click();
    cy.get('[data-testid="enable-2fa"]').click();
    
    cy.get('[data-testid="qr-code"]').should('be.visible');
    cy.get('#verification-code').type('123456');
    cy.get('[data-testid="verify-2fa"]').click();
    
    cy.contains('Two-factor authentication enabled').should('be.visible');
  });
  
  it('handles errors gracefully', () => {
    // Test network error
    cy.intercept('GET', '/api/transactions', { statusCode: 500 });
    cy.get('[data-testid="nav-transactions"]').click();
    
    cy.contains('Failed to load transactions').should('be.visible');
    cy.get('[data-testid="retry-button"]').should('be.visible');
    
    // Test validation error
    cy.get('[data-testid="add-transaction"]').click();
    cy.get('[data-testid="save-transaction"]').click();
    
    cy.contains('Please fill in all required fields').should('be.visible');
  });
});
`;

// 9. Performance Test Example
const PerformanceTest = `
// performance/dashboard-metrics.test.js
import { measurePerformance } from '../helpers/performance';

describe('Dashboard Performance', () => {
  it('loads within performance budget', async () => {
    const metrics = await measurePerformance('/dashboard', {
      runs: 3,
      throttling: '3G'
    });
    
    expect(metrics.FCP).toBeLessThan(1800); // First Contentful Paint < 1.8s
    expect(metrics.LCP).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    expect(metrics.FID).toBeLessThan(100);  // First Input Delay < 100ms
    expect(metrics.CLS).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });
  
  it('handles large datasets efficiently', async () => {
    const startTime = performance.now();
    
    // Render with 10,000 transactions
    const largeDataset = TransactionFactory.buildList(10000);
    render(React.createElement(TransactionList, {
      transactions: largeDataset
    }));
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // Should render in < 1s
    
    // Check virtual scrolling is working
    const visibleRows = screen.getAllByRole('row');
    expect(visibleRows.length).toBeLessThan(100); // Should virtualize
  });
});
`;

// 10. Security Test Example
const SecurityTest = `
// security/xss-prevention.test.js
describe('XSS Prevention', () => {
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<svg onload=alert("XSS")>'
  ];
  
  it('sanitizes user input in transaction descriptions', () => {
    maliciousInputs.forEach(input => {
      render(React.createElement(TransactionForm, {
        onSubmit: jest.fn()
      }));
      
      const descriptionInput = screen.getByLabelText(/description/i);
      userEvent.type(descriptionInput, input);
      
      const submitButton = screen.getByText(/save/i);
      userEvent.click(submitButton);
      
      // Check that script tags are not rendered
      expect(screen.queryByText('alert')).not.toBeInTheDocument();
      expect(document.querySelector('script')).toBeNull();
    });
  });
  
  it('prevents SQL injection in search queries', async () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1; DELETE FROM transactions WHERE 1=1"
    ];
    
    for (const attempt of sqlInjectionAttempts) {
      const response = await api.searchTransactions(attempt);
      expect(response.error).toBeUndefined();
      expect(response.data).toEqual([]); // Should return empty, not error
    }
  });
});
`;

// 11. Accessibility Test Example
const AccessibilityTest = `
// accessibility/wcag-compliance.test.js
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('WCAG 2.1 AA Compliance', () => {
  it('dashboard has no accessibility violations', async () => {
    const { container } = render(React.createElement(Dashboard));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('provides keyboard navigation for all interactive elements', () => {
    render(React.createElement(TransactionList));
    
    // Tab through all interactive elements
    const interactiveElements = [
      screen.getByLabelText(/filter/i),
      screen.getByLabelText(/sort/i),
      screen.getByText(/add transaction/i),
      ...screen.getAllByRole('button')
    ];
    
    interactiveElements.forEach((element, index) => {
      userEvent.tab();
      expect(element).toHaveFocus();
    });
  });
  
  it('has proper ARIA labels for screen readers', () => {
    render(React.createElement(BudgetManager));
    
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label');
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label');
    expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    
    screen.getAllByRole('button').forEach(button => {
      expect(button).toHaveAccessibleName();
    });
  });
  
  it('maintains color contrast ratios', async () => {
    const { container } = render(React.createElement(App));
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
  });
});
`;

// 12. Test Configuration Files
const TestConfigs = {
  jest: `
// jest.config.js
module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.{js,jsx}',
    '**/*.{spec,test}.{js,jsx}'
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};`,

  cypress: `
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Performance testing
      on('task', {
        measurePerformance: require('./cypress/plugins/performance')
      });
      
      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      return config;
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.{js,jsx}'
  }
});`,

  prettier: `
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}`,

  eslint: `
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
    'plugin:cypress/recommended'
  ],
  rules: {
    'testing-library/await-async-query': 'error',
    'testing-library/no-await-sync-query': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'jest-dom/prefer-checked': 'error',
    'jest-dom/prefer-enabled-disabled': 'error'
  }
};`
};

// 13. CI/CD Pipeline Configuration
const CIPipeline = `
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start application
        run: npm start &
        env:
          CI: true
      
      - name: Wait for app
        run: npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
  
  performance-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
      
      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci
  
  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --production
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'finance-dashboard'
          path: '.'
          format: 'HTML'
      
      - name: Upload security reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: reports
`;

// Export test suite architecture
export default TestSuiteArchitecture;