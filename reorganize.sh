#!/bin/bash
# Finance Dashboard Reorganization Script
# This script shows the commands to reorganize the project structure
# Run this from the finance-dashboard directory

echo "Finance Dashboard Reorganization Script"
echo "======================================"
echo ""

# Create backup with timestamp
BACKUP_DIR="temp/backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup in: $BACKUP_DIR"

# File movements (showing the mapping)
echo ""
echo "File Movement Plan:"
echo "==================="

# Documentation files
echo "Moving documentation files..."
echo "  Phase3-Improvments-Summary.pdf → docs/"
echo "  Summary Phase 1 Improvements.pdf → docs/"
echo "  testing-document.pdf → docs/"
echo "  file-verification-guide.html → docs/"
echo "  loading-instructions.html → docs/"

# Core app files
echo ""
echo "Organizing core application files..."
echo "  app-main.js → src/App.js"
echo "  app-init.js → src/index.js"
echo "  index.html → public/index.html"
echo "  manifest.json → public/manifest.json"
echo "  sw.js → public/sw.js"
echo "  offline.html → public/offline.html"

# Component files
echo ""
echo "Reorganizing components..."
echo "  app-components-auth.js → src/components/auth/"
echo "  app-components-main.js → src/components/layout/"
echo "  app-components-finance.js → src/components/finance/"

# Feature modules
echo ""
echo "Moving feature modules..."
echo "  app-features-*.js → src/features/*/"

# State management
echo ""
echo "Organizing state management..."
echo "  app-state.js → src/state/"
echo "  app-config.js → src/config/"

# Utilities
echo ""
echo "Consolidating utilities..."
echo "  app-utils-*.js → src/utils/"
echo "  app-storage*.js → src/utils/storage/"

# Test and debug files
echo ""
echo "Moving test files..."
echo "  app-test-*.js → tests/"
echo "  app-debug-*.js → tests/debug/"
echo "  test-*.html → tests/"

echo ""
echo "Reorganization plan complete!"
echo "Run 'git init' after reorganization to initialize version control."