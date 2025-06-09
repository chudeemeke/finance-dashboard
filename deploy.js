#!/usr/bin/env node

/**
 * Finance Dashboard Deployment Manager
 * Handles GitHub Pages deployment with force-add for ignored files
 * 
 * @module DeploymentManager
 * @requires child_process
 * @requires fs
 * @requires path
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deployment configuration
 * @typedef {Object} DeploymentConfig
 * @property {string[]} forcedFiles - Files to force-add despite .gitignore
 * @property {string} repositoryUrl - GitHub repository URL
 * @property {string} branch - Deployment branch
 * @property {Object} verification - Verification settings
 */
const deploymentConfig = {
    forcedFiles: [
        'app-utils-privacy-fix.js',
        'temp-fix-deps.js',
        'app-render-debug.js',
        'app-component-fix.js',
        'app-debug-components.js'
    ],
    repositoryUrl: 'https://github.com/chudeemeke/finance-dashboard',
    branch: 'main',
    verification: {
        requiredFiles: [
            'index.html',
            'manifest.json',
            'sw.js',
            'app-main.js',
            'app-init.js',
            'app-state.js',
            'app-storage.js',
            'app-components-main.js',
            'app-components-finance.js',
            'app-components-auth.js'
        ],
        testUrls: [
            'https://chudeemeke.github.io/finance-dashboard/',
            'https://chudeemeke.github.io/finance-dashboard/test-basic.html'
        ]
    }
};

/**
 * Logger utility for formatted console output
 */
class Logger {
    static info(message) {
        console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
    }
    
    static success(message) {
        console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
    }
    
    static error(message) {
        console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    }
    
    static warning(message) {
        console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
    }
    
    static debug(message) {
        if (process.env.DEBUG) {
            console.log(`\x1b[35m[DEBUG]\x1b[0m ${message}`);
        }
    }
}

/**
 * Deployment Manager Class
 * Handles all deployment operations for GitHub Pages
 */
class DeploymentManager {
    constructor(config) {
        this.config = config;
        this.errors = [];
        this.warnings = [];
    }
    
    /**
     * Execute shell command with error handling
     * @param {string} command - Command to execute
     * @param {Object} options - Execution options
     * @returns {string} Command output
     */
    executeCommand(command, options = {}) {
        Logger.debug(`Executing: ${command}`);
        try {
            const output = execSync(command, { 
                encoding: 'utf8',
                ...options 
            });
            return output.trim();
        } catch (error) {
            Logger.error(`Command failed: ${command}`);
            Logger.error(`Error: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Check if file exists
     * @param {string} filePath - Path to check
     * @returns {boolean} File existence status
     */
    fileExists(filePath) {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Verify all required files exist
     * @returns {Object} Verification result
     */
    verifyRequiredFiles() {
        Logger.info('Verifying required files...');
        const missing = [];
        const present = [];
        
        // Check all required files
        const allFiles = [
            ...this.config.forcedFiles,
            ...this.config.verification.requiredFiles
        ];
        
        allFiles.forEach(file => {
            if (this.fileExists(file)) {
                present.push(file);
                Logger.debug(`✓ ${file}`);
            } else {
                missing.push(file);
                Logger.error(`✗ ${file} - MISSING`);
            }
        });
        
        return { missing, present, success: missing.length === 0 };
    }
    
    /**
     * Check Git status
     * @returns {Object} Git status information
     */
    checkGitStatus() {
        Logger.info('Checking Git status...');
        try {
            const status = this.executeCommand('git status --porcelain');
            const branch = this.executeCommand('git branch --show-current');
            const remoteUrl = this.executeCommand('git remote get-url origin');
            
            return {
                hasChanges: status.length > 0,
                changes: status.split('\n').filter(line => line.trim()),
                branch,
                remoteUrl,
                isCorrectRepo: remoteUrl.includes('finance-dashboard')
            };
        } catch (error) {
            Logger.error('Failed to check Git status');
            throw error;
        }
    }
    
    /**
     * Force add ignored files to Git
     */
    forceAddIgnoredFiles() {
        Logger.info('Force adding ignored files...');
        
        this.config.forcedFiles.forEach(file => {
            if (this.fileExists(file)) {
                try {
                    this.executeCommand(`git add -f ${file}`);
                    Logger.success(`Force added: ${file}`);
                } catch (error) {
                    Logger.error(`Failed to add ${file}: ${error.message}`);
                    this.errors.push(`Failed to add ${file}`);
                }
            } else {
                Logger.warning(`Skipping ${file} - file not found`);
                this.warnings.push(`${file} not found`);
            }
        });
    }
    
    /**
     * Create deployment commit
     * @param {string} message - Commit message
     */
    createDeploymentCommit(message) {
        Logger.info('Creating deployment commit...');
        try {
            // Add all changes
            this.executeCommand('git add .');
            
            // Force add ignored files
            this.forceAddIgnoredFiles();
            
            // Create commit
            const commitMessage = message || `Deploy: Force add ignored files for GitHub Pages - ${new Date().toISOString()}`;
            this.executeCommand(`git commit -m "${commitMessage}"`);
            Logger.success('Commit created successfully');
        } catch (error) {
            if (error.message.includes('nothing to commit')) {
                Logger.info('No changes to commit');
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Push to GitHub
     */
    pushToGitHub() {
        Logger.info('Pushing to GitHub...');
        try {
            this.executeCommand(`git push origin ${this.config.branch}`);
            Logger.success('Successfully pushed to GitHub');
        } catch (error) {
            Logger.error('Failed to push to GitHub');
            throw error;
        }
    }
    
    /**
     * Generate deployment report
     * @returns {Object} Deployment report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: this.errors.length === 0 ? 'SUCCESS' : 'FAILED',
            errors: this.errors,
            warnings: this.warnings,
            deploymentUrls: this.config.verification.testUrls,
            nextSteps: []
        };
        
        if (report.status === 'SUCCESS') {
            report.nextSteps = [
                'Wait 2-5 minutes for GitHub Pages to update',
                `Test main app: ${this.config.verification.testUrls[0]}`,
                `Verify test page: ${this.config.verification.testUrls[1]}`,
                'Check browser console for any errors',
                'Test PWA installation'
            ];
        } else {
            report.nextSteps = [
                'Fix the errors listed above',
                'Run the deployment script again',
                'Contact support if issues persist'
            ];
        }
        
        return report;
    }
    
    /**
     * Main deployment process
     */
    async deploy() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 Finance Dashboard Deployment Manager');
        console.log('='.repeat(60) + '\n');
        
        try {
            // Step 1: Verify files
            const fileCheck = this.verifyRequiredFiles();
            if (!fileCheck.success) {
                throw new Error(`Missing required files: ${fileCheck.missing.join(', ')}`);
            }
            
            // Step 2: Check Git status
            const gitStatus = this.checkGitStatus();
            if (!gitStatus.isCorrectRepo) {
                throw new Error('Not in the correct repository');
            }
            
            Logger.info(`Current branch: ${gitStatus.branch}`);
            Logger.info(`Changes detected: ${gitStatus.hasChanges ? 'Yes' : 'No'}`);
            
            // Step 3: Create commit and push
            this.createDeploymentCommit();
            this.pushToGitHub();
            
            // Step 4: Generate report
            const report = this.generateReport();
            this.displayReport(report);
            
            // Save report
            fs.writeFileSync(
                'deployment-report.json',
                JSON.stringify(report, null, 2)
            );
            
        } catch (error) {
            Logger.error(`Deployment failed: ${error.message}`);
            this.errors.push(error.message);
            const report = this.generateReport();
            this.displayReport(report);
            process.exit(1);
        }
    }
    
    /**
     * Display deployment report
     * @param {Object} report - Deployment report
     */
    displayReport(report) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Deployment Report');
        console.log('='.repeat(60));
        console.log(`Status: ${report.status}`);
        console.log(`Timestamp: ${report.timestamp}`);
        
        if (report.errors.length > 0) {
            console.log('\n❌ Errors:');
            report.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (report.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            report.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        console.log('\n📋 Next Steps:');
        report.nextSteps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step}`);
        });
        
        console.log('\n🔗 URLs:');
        report.deploymentUrls.forEach(url => {
            console.log(`  - ${url}`);
        });
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

// Run deployment if called directly
if (require.main === module) {
    const manager = new DeploymentManager(deploymentConfig);
    manager.deploy();
}

module.exports = { DeploymentManager, deploymentConfig };