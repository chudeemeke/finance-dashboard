/**
 * Automated Reorganization Script for Finance Dashboard
 * This Node.js script helps reorganize the project structure
 * 
 * Usage: node scripts/reorganize.js
 */

const fs = require('fs');
const path = require('path');

// File mapping configuration
const FILE_MAPPINGS = {
  // Documentation files
  'Phase3-Improvments-Summary.pdf': 'docs/Phase3-Improvements-Summary.pdf',
  'Summary Phase 1 Improvements.pdf': 'docs/Phase1-Improvements-Summary.pdf',
  'testing-document.pdf': 'docs/testing-documentation.pdf',
  'file-verification-guide.html': 'docs/file-verification-guide.html',
  'loading-instructions.html': 'docs/loading-instructions.html',
  
  // Public files
  'index.html': 'public/index.html',
  'manifest.json': 'public/manifest.json',
  'sw.js': 'public/sw.js',
  'offline.html': 'public/offline.html',
  
  // Core application files
  'app-main.js': 'src/App.js',
  'app-init.js': 'src/index.js',
  
  // Components
  'app-components-auth.js': 'src/components/auth/index.js',
  'app-components-main.js': 'src/components/layout/index.js',
  'app-components-finance.js': 'src/components/finance/index.js',
  
  // State management
  'app-state.js': 'src/state/store.js',
  'app-config.js': 'src/config/app.config.js',
  
  // Utilities
  'app-utils-init.js': 'src/utils/index.js',
  'app-utils-privacy-fix.js': 'src/utils/privacy.js',
  'app-storage.js': 'src/utils/storage/storage.js',
  'app-storage-init.js': 'src/utils/storage/init.js',
  
  // Features
  'app-features-advanced.js': 'src/features/advanced/index.js',
  'app-features-gamification.js': 'src/features/gamification/index.js',
  'app-features-integration.js': 'src/features/integration/index.js',
  'app-features-integration-manager.js': 'src/features/integration/manager.js',
  'app-features-international.js': 'src/features/international/index.js',
  'app-features-pwa.js': 'src/features/pwa/index.js',
  'app-features-security.js': 'src/features/security/index.js',
  
  // Test files
  'app-test-suite.js': 'tests/test-suite.js',
  'test-suite-architecture.js': 'tests/architecture.test.js',
  'test-runner-page.html': 'tests/test-runner.html',
  
  // Debug files (to temp)
  'app-debug-components.js': 'temp/debug/components.js',
  'app-render-debug.js': 'temp/debug/render.js',
  'app-component-fix.js': 'temp/legacy/component-fix.js',
  'temp-fix-deps.js': 'temp/legacy/deps-fix.js',
  
  // Phase completion
  'app-phase3-complete.js': 'temp/legacy/phase3-complete.js'
};

// Directories to create
const DIRECTORIES = [
  'src',
  'src/components',
  'src/components/auth',
  'src/components/common',
  'src/components/dashboard',
  'src/components/finance',
  'src/components/layout',
  'src/features',
  'src/features/advanced',
  'src/features/gamification',
  'src/features/integration',
  'src/features/international',
  'src/features/pwa',
  'src/features/security',
  'src/hooks',
  'src/utils',
  'src/utils/storage',
  'src/config',
  'src/state',
  'src/services',
  'public',
  'docs',
  'tests',
  'tests/debug',
  'scripts',
  'temp',
  'temp/debug',
  'temp/legacy',
  'temp/backup'
];

console.log('Finance Dashboard Reorganization Script');
console.log('======================================\n');

// Create directories
console.log('Creating directory structure...');
DIRECTORIES.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Creating: ${dir}`);
    // fs.mkdirSync(fullPath, { recursive: true });
  } else {
    console.log(`  Exists: ${dir}`);
  }
});

console.log('\nFile movement plan:');
console.log('==================');

// Show file mappings
Object.entries(FILE_MAPPINGS).forEach(([from, to]) => {
  const fromPath = path.join(__dirname, '..', from);
  const toPath = path.join(__dirname, '..', to);
  
  if (fs.existsSync(fromPath)) {
    console.log(`  ${from} → ${to}`);
    // Uncomment to actually move files:
    // const toDir = path.dirname(toPath);
    // fs.mkdirSync(toDir, { recursive: true });
    // fs.renameSync(fromPath, toPath);
  } else {
    console.log(`  ${from} (not found)`);
  }
});

console.log('\nReorganization plan complete!');
console.log('To execute the reorganization, uncomment the file movement code.');
console.log('\nNext steps:');
console.log('1. Review the plan above');
console.log('2. Create a backup of your project');
console.log('3. Uncomment the file movement code in this script');
console.log('4. Run the script again to execute the moves');
console.log('5. Update import paths in the moved files');
console.log('6. Initialize git: git init');
console.log('7. Install dependencies: npm install');