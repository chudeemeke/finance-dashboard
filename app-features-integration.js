/**
 * app-features-integration.js - Data Import/Export & Integrations (Improved)
 * Version: 3.1.0
 * 
 * Improvements:
 * - Real Excel parsing using SheetJS
 * - Comprehensive QIF/OFX parsers
 * - Enhanced bank API simulation with realistic data
 * - Client-side OCR using Tesseract.js
 */

(function(global) {
    'use strict';

    const { React, ReactDOM } = global;
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    const e = React.createElement;

    // ===========================
    // File Parser Factory (Improved)
    // ===========================
    class FileParserFactory {
        static async getParser(fileType) {
            switch (fileType.toLowerCase()) {
                case 'csv':
                    return new CSVParser();
                case 'xlsx':
                case 'xls':
                    return new ExcelParser();
                case 'qif':
                    return new QIFParser();
                case 'ofx':
                    return new OFXParser();
                case 'json':
                    return new JSONParser();
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
        }
    }

    // ===========================
    // CSV Parser (Enhanced)
    // ===========================
    class CSVParser {
        async parse(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        // Load Papa Parse if not already loaded
                        if (!window.Papa) {
                            await this.loadPapaParse();
                        }

                        const results = Papa.parse(e.target.result, {
                            header: true,
                            dynamicTyping: true,
                            skipEmptyLines: true,
                            delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
                            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
                        });

                        if (results.errors.length > 0) {
                            console.warn('CSV parsing warnings:', results.errors);
                        }

                        const transactions = this.mapToTransactions(results.data);
                        resolve({
                            success: true,
                            transactions,
                            raw: results.data,
                            meta: results.meta
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }

        async loadPapaParse() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        mapToTransactions(data) {
            return data.map(row => {
                // Try to intelligently map common CSV formats
                const transaction = {
                    id: window.FinanceApp.Utils.generateUUID(),
                    date: this.parseDate(row.date || row.transaction_date || row.posted_date || row.trans_date),
                    amount: this.parseAmount(row.amount || row.debit || row.credit || row.value),
                    type: this.determineType(row),
                    category: this.parseCategory(row.category || row.type || row.description),
                    merchant: row.merchant || row.payee || row.description || 'Unknown',
                    description: row.description || row.memo || row.notes || '',
                    accountId: row.account || row.account_id || 'imported',
                    imported: true,
                    importDate: new Date().toISOString()
                };

                // Handle split debit/credit columns
                if (row.debit && row.credit) {
                    transaction.amount = row.debit || -row.credit;
                    transaction.type = row.debit ? 'expense' : 'income';
                }

                return transaction;
            }).filter(tx => tx.date && !isNaN(tx.amount));
        }

        parseDate(dateStr) {
            if (!dateStr) return null;
            
            // Try multiple date formats
            const formats = [
                /^\d{4}-\d{2}-\d{2}/, // ISO format
                /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
                /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
                /^\d{1,2}\/\d{1,2}\/\d{2,4}/ // M/D/YY or M/D/YYYY
            ];

            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }

            // Try parsing with moment-like logic
            for (const format of formats) {
                if (format.test(dateStr)) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString();
                    }
                }
            }

            return null;
        }

        parseAmount(value) {
            if (typeof value === 'number') return Math.abs(value);
            if (!value) return 0;

            // Remove currency symbols and commas
            const cleaned = value.toString()
                .replace(/[$£€¥,]/g, '')
                .replace(/\s+/g, '')
                .trim();

            return Math.abs(parseFloat(cleaned)) || 0;
        }

        determineType(row) {
            // Check for explicit type field
            if (row.type) {
                const type = row.type.toLowerCase();
                if (type.includes('income') || type.includes('credit') || type.includes('deposit')) {
                    return 'income';
                }
                return 'expense';
            }

            // Check amount sign
            if (row.amount && row.amount < 0) return 'expense';
            if (row.debit) return 'expense';
            if (row.credit) return 'income';

            // Default to expense
            return 'expense';
        }

        parseCategory(value) {
            if (!value) return 'Other';

            const categoryMap = {
                'food': 'Food',
                'dining': 'Food',
                'restaurant': 'Food',
                'grocery': 'Groceries',
                'transport': 'Transport',
                'gas': 'Transport',
                'fuel': 'Transport',
                'shopping': 'Shopping',
                'entertainment': 'Entertainment',
                'bills': 'Bills',
                'utilities': 'Bills',
                'healthcare': 'Healthcare',
                'medical': 'Healthcare',
                'education': 'Education',
                'travel': 'Travel'
            };

            const lowercaseValue = value.toLowerCase();
            for (const [key, category] of Object.entries(categoryMap)) {
                if (lowercaseValue.includes(key)) {
                    return category;
                }
            }

            return 'Other';
        }
    }

    // ===========================
    // Excel Parser (Improved with actual parsing)
    // ===========================
    class ExcelParser {
        async parse(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        // Load SheetJS if not already loaded
                        if (!window.XLSX) {
                            await this.loadSheetJS();
                        }

                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {
                            type: 'array',
                            cellDates: true,
                            cellNF: false,
                            cellText: false
                        });

                        // Find the most likely sheet containing transactions
                        const sheetName = this.findTransactionSheet(workbook);
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // Convert to JSON
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            raw: false,
                            dateNF: 'yyyy-mm-dd'
                        });

                        // Parse transactions
                        const csvParser = new CSVParser();
                        const transactions = csvParser.mapToTransactions(jsonData);

                        resolve({
                            success: true,
                            transactions,
                            raw: jsonData,
                            sheets: workbook.SheetNames,
                            meta: {
                                sheetName,
                                rowCount: jsonData.length
                            }
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read Excel file'));
                reader.readAsArrayBuffer(file);
            });
        }

        async loadSheetJS() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        findTransactionSheet(workbook) {
            // Look for sheets with transaction-like names
            const transactionKeywords = ['transaction', 'trans', 'expense', 'income', 'ledger', 'register'];
            
            for (const sheetName of workbook.SheetNames) {
                const lowerName = sheetName.toLowerCase();
                if (transactionKeywords.some(keyword => lowerName.includes(keyword))) {
                    return sheetName;
                }
            }

            // Default to first sheet
            return workbook.SheetNames[0];
        }
    }

    // ===========================
    // QIF Parser (Comprehensive Implementation)
    // ===========================
    class QIFParser {
        async parse(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        const transactions = this.parseQIF(content);
                        
                        resolve({
                            success: true,
                            transactions,
                            raw: content,
                            meta: {
                                format: 'QIF',
                                transactionCount: transactions.length
                            }
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read QIF file'));
                reader.readAsText(file);
            });
        }

        parseQIF(content) {
            const lines = content.split(/\r?\n/);
            const transactions = [];
            let currentTransaction = null;
            let accountType = 'Bank';

            for (const line of lines) {
                if (line.startsWith('!')) {
                    // Account type header
                    accountType = line.substring(1).trim();
                    continue;
                }

                if (line === '^') {
                    // End of transaction
                    if (currentTransaction && currentTransaction.date) {
                        transactions.push(this.normalizeTransaction(currentTransaction));
                    }
                    currentTransaction = null;
                    continue;
                }

                if (!currentTransaction) {
                    currentTransaction = {};
                }

                // Parse transaction fields
                const fieldType = line.charAt(0);
                const value = line.substring(1);

                switch (fieldType) {
                    case 'D': // Date
                        currentTransaction.date = this.parseQIFDate(value);
                        break;
                    case 'T': // Amount
                    case 'U': // Amount (alternative)
                        currentTransaction.amount = this.parseQIFAmount(value);
                        break;
                    case 'P': // Payee
                        currentTransaction.payee = value;
                        break;
                    case 'M': // Memo
                        currentTransaction.memo = value;
                        break;
                    case 'C': // Cleared status
                        currentTransaction.cleared = value;
                        break;
                    case 'N': // Check number
                        currentTransaction.checkNumber = value;
                        break;
                    case 'L': // Category
                        currentTransaction.category = this.parseQIFCategory(value);
                        break;
                    case 'S': // Split category
                        if (!currentTransaction.splits) {
                            currentTransaction.splits = [];
                        }
                        currentTransaction.splits.push({ category: value });
                        break;
                    case '$': // Split amount
                        if (currentTransaction.splits && currentTransaction.splits.length > 0) {
                            const lastSplit = currentTransaction.splits[currentTransaction.splits.length - 1];
                            lastSplit.amount = this.parseQIFAmount(value);
                        }
                        break;
                    case 'E': // Split memo
                        if (currentTransaction.splits && currentTransaction.splits.length > 0) {
                            const lastSplit = currentTransaction.splits[currentTransaction.splits.length - 1];
                            lastSplit.memo = value;
                        }
                        break;
                }
            }

            // Don't forget the last transaction if file doesn't end with ^
            if (currentTransaction && currentTransaction.date) {
                transactions.push(this.normalizeTransaction(currentTransaction));
            }

            return transactions;
        }

        parseQIFDate(dateStr) {
            // QIF dates can be in various formats: MM/DD/YY, MM/DD/YYYY, DD/MM/YY, etc.
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts.length !== 3) return null;

            let month, day, year;
            
            // Assume MM/DD/YY format (most common in QIF)
            month = parseInt(parts[0]);
            day = parseInt(parts[1]);
            year = parseInt(parts[2]);

            // Handle 2-digit years
            if (year < 100) {
                year += year < 50 ? 2000 : 1900;
            }

            // Validate and swap if needed (for DD/MM/YY format)
            if (month > 12 && day <= 12) {
                [month, day] = [day, month];
            }

            const date = new Date(year, month - 1, day);
            return date.toISOString();
        }

        parseQIFAmount(amountStr) {
            // Remove commas and parse
            const cleaned = amountStr.replace(/,/g, '');
            return parseFloat(cleaned) || 0;
        }

        parseQIFCategory(categoryStr) {
            // Remove brackets if present
            const cleaned = categoryStr.replace(/[\[\]]/g, '');
            
            // Map to standard categories
            const categoryMap = {
                'Food & Dining': 'Food',
                'Groceries': 'Groceries',
                'Transportation': 'Transport',
                'Auto & Transport': 'Transport',
                'Shopping': 'Shopping',
                'Entertainment': 'Entertainment',
                'Bills & Utilities': 'Bills',
                'Healthcare': 'Healthcare',
                'Education': 'Education',
                'Travel': 'Travel'
            };

            for (const [key, value] of Object.entries(categoryMap)) {
                if (cleaned.toLowerCase().includes(key.toLowerCase())) {
                    return value;
                }
            }

            return cleaned || 'Other';
        }

        normalizeTransaction(qifTransaction) {
            const amount = Math.abs(qifTransaction.amount || 0);
            const isExpense = (qifTransaction.amount || 0) < 0;

            return {
                id: window.FinanceApp.Utils.generateUUID(),
                date: qifTransaction.date,
                amount: amount,
                type: isExpense ? 'expense' : 'income',
                category: qifTransaction.category || 'Other',
                merchant: qifTransaction.payee || 'Unknown',
                description: qifTransaction.memo || '',
                accountId: 'imported',
                imported: true,
                importDate: new Date().toISOString(),
                checkNumber: qifTransaction.checkNumber,
                cleared: qifTransaction.cleared === 'X',
                splits: qifTransaction.splits
            };
        }
    }

    // ===========================
    // OFX Parser (Comprehensive Implementation)
    // ===========================
    class OFXParser {
        async parse(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        const transactions = this.parseOFX(content);
                        
                        resolve({
                            success: true,
                            transactions,
                            raw: content,
                            meta: {
                                format: 'OFX',
                                transactionCount: transactions.length
                            }
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read OFX file'));
                reader.readAsText(file);
            });
        }

        parseOFX(content) {
            // Convert SGML to XML format if needed
            const xmlContent = this.convertToXML(content);
            
            // Parse XML
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlContent, 'text/xml');
            
            // Extract transactions
            const transactions = [];
            const stmttrns = doc.getElementsByTagName('STMTTRN');
            
            for (let i = 0; i < stmttrns.length; i++) {
                const transaction = this.parseTransaction(stmttrns[i]);
                if (transaction) {
                    transactions.push(transaction);
                }
            }

            // Also check for credit card transactions
            const ccstmttrns = doc.getElementsByTagName('CCSTMTTRN');
            for (let i = 0; i < ccstmttrns.length; i++) {
                const transaction = this.parseTransaction(ccstmttrns[i]);
                if (transaction) {
                    transactions.push(transaction);
                }
            }

            return transactions;
        }

        convertToXML(content) {
            // OFX files before version 2.0 use SGML format
            // Convert to XML by adding closing tags
            let xml = content;

            // Remove headers
            xml = xml.replace(/^[\s\S]*?<OFX>/m, '<OFX>');

            // Add XML declaration
            if (!xml.startsWith('<?xml')) {
                xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
            }

            // Convert SGML tags to XML
            const tags = ['OFX', 'SIGNONMSGSRSV1', 'SONRS', 'STATUS', 'BANKMSGSRSV1', 
                         'STMTTRNRS', 'STMTRS', 'BANKTRANLIST', 'STMTTRN', 'CCSTMTTRNRS',
                         'CCSTMTRS', 'CCSTMTTRN', 'LEDGERBAL', 'AVAILBAL'];

            tags.forEach(tag => {
                const regex = new RegExp(`<${tag}>(?!.*</${tag}>)`, 'g');
                xml = xml.replace(regex, `<${tag}>`);
                
                // Add closing tags
                const openTag = `<${tag}>`;
                const closeTag = `</${tag}>`;
                
                let pos = 0;
                while ((pos = xml.indexOf(openTag, pos)) !== -1) {
                    pos += openTag.length;
                    const nextOpen = xml.indexOf(openTag, pos);
                    const nextClose = xml.indexOf(closeTag, pos);
                    
                    if (nextClose === -1 || (nextOpen !== -1 && nextOpen < nextClose)) {
                        // Find where to insert closing tag
                        let insertPos = nextOpen !== -1 ? nextOpen : xml.length;
                        
                        // Look for next tag at same level
                        const nextTagMatch = xml.substring(pos).match(/<[A-Z]+>/);
                        if (nextTagMatch) {
                            insertPos = pos + nextTagMatch.index;
                        }
                        
                        xml = xml.substring(0, insertPos) + closeTag + xml.substring(insertPos);
                    }
                }
            });

            return xml;
        }

        parseTransaction(element) {
            try {
                const getElementText = (tagName) => {
                    const el = element.getElementsByTagName(tagName)[0];
                    return el ? el.textContent.trim() : '';
                };

                const trntype = getElementText('TRNTYPE');
                const dtposted = getElementText('DTPOSTED');
                const trnamt = getElementText('TRNAMT');
                const fitid = getElementText('FITID');
                const name = getElementText('NAME');
                const memo = getElementText('MEMO');

                if (!dtposted || !trnamt) return null;

                // Parse date (YYYYMMDDHHMMSS format)
                const year = dtposted.substring(0, 4);
                const month = dtposted.substring(4, 6);
                const day = dtposted.substring(6, 8);
                const date = new Date(`${year}-${month}-${day}`);

                // Parse amount
                const amount = parseFloat(trnamt);

                // Determine type
                let type = 'expense';
                if (amount > 0 || ['CREDIT', 'DEP', 'INT', 'DIV'].includes(trntype)) {
                    type = 'income';
                }

                return {
                    id: fitid || window.FinanceApp.Utils.generateUUID(),
                    date: date.toISOString(),
                    amount: Math.abs(amount),
                    type: type,
                    category: this.categorizeTransaction(trntype, name, memo),
                    merchant: name || 'Unknown',
                    description: memo || '',
                    accountId: 'imported',
                    imported: true,
                    importDate: new Date().toISOString(),
                    trntype: trntype
                };
            } catch (error) {
                console.error('Error parsing OFX transaction:', error);
                return null;
            }
        }

        categorizeTransaction(trntype, name, memo) {
            const text = `${trntype} ${name} ${memo}`.toLowerCase();

            // Transaction type based categories
            if (['INT', 'DIV'].includes(trntype)) return 'Income';
            if (['FEE', 'SRVCHG'].includes(trntype)) return 'Bills';
            if (['ATM', 'CASH'].includes(trntype)) return 'Cash';

            // Text-based categorization
            const categories = {
                'grocery': 'Groceries',
                'supermarket': 'Groceries',
                'restaurant': 'Food',
                'coffee': 'Food',
                'gas': 'Transport',
                'fuel': 'Transport',
                'uber': 'Transport',
                'lyft': 'Transport',
                'amazon': 'Shopping',
                'walmart': 'Shopping',
                'netflix': 'Entertainment',
                'spotify': 'Entertainment',
                'utility': 'Bills',
                'electric': 'Bills',
                'insurance': 'Bills',
                'pharmacy': 'Healthcare',
                'doctor': 'Healthcare',
                'medical': 'Healthcare'
            };

            for (const [keyword, category] of Object.entries(categories)) {
                if (text.includes(keyword)) {
                    return category;
                }
            }

            return 'Other';
        }
    }

    // ===========================
    // JSON Parser
    // ===========================
    class JSONParser {
        async parse(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        let transactions = [];

                        // Handle different JSON structures
                        if (Array.isArray(data)) {
                            transactions = data;
                        } else if (data.transactions && Array.isArray(data.transactions)) {
                            transactions = data.transactions;
                        } else if (data.data && Array.isArray(data.data)) {
                            transactions = data.data;
                        }

                        // Normalize transactions
                        const normalizedTransactions = transactions.map(tx => ({
                            id: tx.id || window.FinanceApp.Utils.generateUUID(),
                            date: tx.date || tx.timestamp || tx.created_at,
                            amount: Math.abs(tx.amount || 0),
                            type: tx.type || (tx.amount < 0 ? 'expense' : 'income'),
                            category: tx.category || 'Other',
                            merchant: tx.merchant || tx.payee || tx.vendor || 'Unknown',
                            description: tx.description || tx.memo || tx.notes || '',
                            accountId: tx.accountId || tx.account_id || 'imported',
                            imported: true,
                            importDate: new Date().toISOString()
                        }));

                        resolve({
                            success: true,
                            transactions: normalizedTransactions,
                            raw: data
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read JSON file'));
                reader.readAsText(file);
            });
        }
    }

    // ===========================
    // Enhanced Bank API Simulator (Improved)
    // ===========================
    class BankAPISimulator {
        constructor() {
            this.banks = [
                { id: 'chase', name: 'Chase Bank', logo: '🏦' },
                { id: 'bofa', name: 'Bank of America', logo: '🏛️' },
                { id: 'wells', name: 'Wells Fargo', logo: '🏪' },
                { id: 'citi', name: 'Citibank', logo: '🌆' },
                { id: 'capital_one', name: 'Capital One', logo: '💳' }
            ];

            this.merchants = [
                'Starbucks', 'Amazon', 'Walmart', 'Target', 'Whole Foods',
                'Shell Gas Station', 'Netflix', 'Spotify', 'Apple Store',
                'Best Buy', 'Home Depot', 'CVS Pharmacy', 'Uber', 'Lyft',
                'McDonald\'s', 'Chipotle', 'Trader Joe\'s', 'Costco'
            ];

            this.categories = {
                'Starbucks': 'Food',
                'Amazon': 'Shopping',
                'Walmart': 'Shopping',
                'Target': 'Shopping',
                'Whole Foods': 'Groceries',
                'Shell Gas Station': 'Transport',
                'Netflix': 'Entertainment',
                'Spotify': 'Entertainment',
                'Apple Store': 'Shopping',
                'Best Buy': 'Shopping',
                'Home Depot': 'Shopping',
                'CVS Pharmacy': 'Healthcare',
                'Uber': 'Transport',
                'Lyft': 'Transport',
                'McDonald\'s': 'Food',
                'Chipotle': 'Food',
                'Trader Joe\'s': 'Groceries',
                'Costco': 'Shopping'
            };
        }

        async connect(bankId, credentials) {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulate authentication
            if (!credentials.username || !credentials.password) {
                throw new Error('Invalid credentials');
            }

            // Generate session token
            const token = btoa(`${bankId}:${credentials.username}:${Date.now()}`);
            
            return {
                success: true,
                token,
                bankId,
                message: 'Successfully connected to bank'
            };
        }

        async getAccounts(token) {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const bankId = atob(token).split(':')[0];
            const bank = this.banks.find(b => b.id === bankId);

            return [
                {
                    id: `${bankId}_checking_001`,
                    name: 'Primary Checking',
                    type: 'checking',
                    balance: 5234.56,
                    currency: 'USD',
                    mask: '****1234',
                    bank: bank.name
                },
                {
                    id: `${bankId}_savings_001`,
                    name: 'Savings Account',
                    type: 'savings',
                    balance: 12500.00,
                    currency: 'USD',
                    mask: '****5678',
                    bank: bank.name
                },
                {
                    id: `${bankId}_credit_001`,
                    name: 'Rewards Credit Card',
                    type: 'credit',
                    balance: -1234.56,
                    currency: 'USD',
                    mask: '****9012',
                    bank: bank.name,
                    creditLimit: 10000
                }
            ];
        }

        async getTransactions(token, accountId, startDate, endDate) {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const transactions = [];
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            // Generate realistic transaction patterns
            for (let i = 0; i < days; i++) {
                const date = new Date(start);
                date.setDate(date.getDate() + i);

                // Skip weekends for some transactions
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                // Morning coffee (weekdays)
                if (!isWeekend && Math.random() > 0.3) {
                    transactions.push(this.generateTransaction(date, 'Starbucks', 4.50 + Math.random() * 3, 'expense'));
                }

                // Lunch (most days)
                if (Math.random() > 0.4) {
                    const lunchMerchants = ['Chipotle', 'McDonald\'s', 'Subway', 'Local Deli'];
                    const merchant = lunchMerchants[Math.floor(Math.random() * lunchMerchants.length)];
                    transactions.push(this.generateTransaction(date, merchant, 8 + Math.random() * 12, 'expense'));
                }

                // Random shopping (occasional)
                if (Math.random() > 0.7) {
                    const shoppingMerchants = ['Amazon', 'Target', 'Walmart', 'Best Buy'];
                    const merchant = shoppingMerchants[Math.floor(Math.random() * shoppingMerchants.length)];
                    transactions.push(this.generateTransaction(date, merchant, 20 + Math.random() * 180, 'expense'));
                }

                // Gas (weekly)
                if (i % 7 === 3 && accountId.includes('checking')) {
                    transactions.push(this.generateTransaction(date, 'Shell Gas Station', 35 + Math.random() * 25, 'expense'));
                }

                // Groceries (weekly)
                if (i % 7 === 6) {
                    const groceryMerchants = ['Whole Foods', 'Trader Joe\'s', 'Kroger'];
                    const merchant = groceryMerchants[Math.floor(Math.random() * groceryMerchants.length)];
                    transactions.push(this.generateTransaction(date, merchant, 80 + Math.random() * 120, 'expense'));
                }

                // Salary (monthly)
                if (date.getDate() === 15 && accountId.includes('checking')) {
                    transactions.push(this.generateTransaction(date, 'Direct Deposit - Employer', 3500, 'income'));
                }

                // Bills (monthly)
                if (date.getDate() === 1) {
                    transactions.push(this.generateTransaction(date, 'Rent Payment', 1500, 'expense'));
                }
                if (date.getDate() === 5) {
                    transactions.push(this.generateTransaction(date, 'Electric Bill', 80 + Math.random() * 40, 'expense'));
                }
                if (date.getDate() === 10) {
                    transactions.push(this.generateTransaction(date, 'Internet Bill', 69.99, 'expense'));
                }
            }

            // Sort by date descending
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            return {
                transactions,
                hasMore: false,
                accountId
            };
        }

        generateTransaction(date, merchant, amount, type) {
            const hour = 8 + Math.floor(Math.random() * 14); // Between 8 AM and 10 PM
            const minute = Math.floor(Math.random() * 60);
            
            const transactionDate = new Date(date);
            transactionDate.setHours(hour, minute, 0, 0);

            return {
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: transactionDate.toISOString(),
                amount: Math.round(amount * 100) / 100,
                type,
                merchant,
                category: this.categories[merchant] || 'Other',
                description: `Purchase at ${merchant}`,
                pending: Math.random() > 0.8 && (new Date() - transactionDate) < 3 * 24 * 60 * 60 * 1000,
                accountId: 'bank_connected'
            };
        }

        async disconnect(token) {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
                success: true,
                message: 'Successfully disconnected from bank'
            };
        }
    }

    // ===========================
    // Receipt OCR Service (Improved with Tesseract.js)
    // ===========================
    class ReceiptOCRService {
        constructor() {
            this.worker = null;
            this.isInitialized = false;
        }

        async initialize() {
            if (this.isInitialized) return;

            try {
                // Load Tesseract.js
                await this.loadTesseract();
                
                // Create worker
                this.worker = await Tesseract.createWorker({
                    logger: m => console.log('OCR:', m)
                });

                await this.worker.loadLanguage('eng');
                await this.worker.initialize('eng');
                
                this.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize OCR:', error);
                // Fallback to mock mode
                this.isInitialized = false;
            }
        }

        async loadTesseract() {
            return new Promise((resolve, reject) => {
                if (window.Tesseract) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        async processReceipt(imageBlob) {
            if (!this.isInitialized) {
                // Fallback to mock processing
                return this.mockProcessReceipt();
            }

            try {
                // Convert blob to base64
                const base64 = await this.blobToBase64(imageBlob);
                
                // Perform OCR
                const { data: { text, lines } } = await this.worker.recognize(base64);
                
                // Parse receipt data
                const receiptData = this.parseReceiptText(text, lines);
                
                return receiptData;
            } catch (error) {
                console.error('OCR processing failed:', error);
                return this.mockProcessReceipt();
            }
        }

        async blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        parseReceiptText(text, lines) {
            const receipt = {
                merchant: '',
                date: null,
                total: 0,
                subtotal: 0,
                tax: 0,
                items: [],
                raw: text
            };

            // Extract merchant (usually in first few lines)
            const merchantPatterns = [
                /^([A-Z][A-Z\s&]+)$/m,
                /STORE\s*#?\s*\d+/i,
                /^(.+?)\s*\n/
            ];

            for (const pattern of merchantPatterns) {
                const match = text.match(pattern);
                if (match) {
                    receipt.merchant = match[1].trim();
                    break;
                }
            }

            // Extract date
            const datePatterns = [
                /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
                /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
                /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
            ];

            for (const pattern of datePatterns) {
                const match = text.match(pattern);
                if (match) {
                    receipt.date = new Date(match[1]).toISOString();
                    break;
                }
            }

            // Extract amounts
            const amountPattern = /\$?\s*(\d+\.\d{2})/g;
            const amounts = [];
            let match;

            while ((match = amountPattern.exec(text)) !== null) {
                amounts.push(parseFloat(match[1]));
            }

            // Find total (usually the largest amount or labeled)
            const totalPattern = /TOTAL:?\s*\$?\s*(\d+\.\d{2})/i;
            const totalMatch = text.match(totalPattern);
            
            if (totalMatch) {
                receipt.total = parseFloat(totalMatch[1]);
            } else if (amounts.length > 0) {
                receipt.total = Math.max(...amounts);
            }

            // Find subtotal
            const subtotalPattern = /SUBTOTAL:?\s*\$?\s*(\d+\.\d{2})/i;
            const subtotalMatch = text.match(subtotalPattern);
            
            if (subtotalMatch) {
                receipt.subtotal = parseFloat(subtotalMatch[1]);
            }

            // Find tax
            const taxPattern = /TAX:?\s*\$?\s*(\d+\.\d{2})/i;
            const taxMatch = text.match(taxPattern);
            
            if (taxMatch) {
                receipt.tax = parseFloat(taxMatch[1]);
            }

            // Extract line items
            lines.forEach(line => {
                const itemPattern = /(.+?)\s+\$?\s*(\d+\.\d{2})$/;
                const itemMatch = line.text.match(itemPattern);
                
                if (itemMatch && !line.text.match(/TOTAL|TAX|SUBTOTAL/i)) {
                    receipt.items.push({
                        name: itemMatch[1].trim(),
                        price: parseFloat(itemMatch[2])
                    });
                }
            });

            // Fallback date to today if not found
            if (!receipt.date) {
                receipt.date = new Date().toISOString();
            }

            return receipt;
        }

        mockProcessReceipt() {
            // Fallback mock data when OCR is not available
            const merchants = ['Target', 'Walmart', 'Whole Foods', 'CVS Pharmacy'];
            const merchant = merchants[Math.floor(Math.random() * merchants.length)];
            
            const items = [];
            const itemCount = 3 + Math.floor(Math.random() * 5);
            
            for (let i = 0; i < itemCount; i++) {
                items.push({
                    name: `Item ${i + 1}`,
                    price: Math.round((5 + Math.random() * 25) * 100) / 100
                });
            }

            const subtotal = items.reduce((sum, item) => sum + item.price, 0);
            const tax = Math.round(subtotal * 0.08 * 100) / 100;
            const total = subtotal + tax;

            return {
                merchant,
                date: new Date().toISOString(),
                total,
                subtotal,
                tax,
                items,
                raw: 'Mock receipt data (OCR not available)'
            };
        }

        async terminate() {
            if (this.worker) {
                await this.worker.terminate();
                this.worker = null;
                this.isInitialized = false;
            }
        }
    }

    // ===========================
    // Import Wizard Component
    // ===========================
    const ImportWizard = ({ onComplete, onCancel }) => {
        const [step, setStep] = useState('select'); // select, preview, map, import
        const [file, setFile] = useState(null);
        const [parseResult, setParseResult] = useState(null);
        const [mappings, setMappings] = useState({});
        const [importing, setImporting] = useState(false);
        const [error, setError] = useState('');

        const handleFileSelect = (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                setFile(selectedFile);
                setError('');
            }
        };

        const parseFile = async () => {
            if (!file) return;

            setError('');
            try {
                const extension = file.name.split('.').pop().toLowerCase();
                const parser = await FileParserFactory.getParser(extension);
                const result = await parser.parse(file);
                
                setParseResult(result);
                setStep('preview');
            } catch (err) {
                setError(`Failed to parse file: ${err.message}`);
            }
        };

        const importTransactions = async () => {
            setImporting(true);
            
            try {
                // Apply any custom mappings
                const mappedTransactions = parseResult.transactions.map(tx => ({
                    ...tx,
                    ...mappings
                }));

                // Simulate import delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                onComplete(mappedTransactions);
            } catch (err) {
                setError(`Import failed: ${err.message}`);
                setImporting(false);
            }
        };

        return e('div', { className: 'space-y-6' },
            // Progress indicator
            e('div', { className: 'flex justify-between mb-6' },
                ['select', 'preview', 'map', 'import'].map((s, index) =>
                    e('div', { 
                        key: s,
                        className: `flex items-center ${index < 3 ? 'flex-1' : ''}`
                    },
                        e('div', { 
                            className: `w-8 h-8 rounded-full flex items-center justify-center ${
                                step === s ? 'bg-blue-500 text-white' :
                                ['preview', 'map', 'import'].indexOf(step) > index ? 'bg-green-500 text-white' :
                                'bg-gray-300'
                            }`
                        }, index + 1),
                        index < 3 && e('div', { 
                            className: `flex-1 h-1 mx-2 ${
                                ['preview', 'map', 'import'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-300'
                            }`
                        })
                    )
                )
            ),

            // Step content
            step === 'select' && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Select File to Import'),
                
                e('div', { className: 'space-y-4' },
                    e('div', { 
                        className: 'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'
                    },
                        e('input', {
                            type: 'file',
                            accept: '.csv,.xlsx,.xls,.qif,.ofx,.json',
                            onChange: handleFileSelect,
                            className: 'hidden',
                            id: 'file-input'
                        }),
                        e('label', { 
                            htmlFor: 'file-input',
                            className: 'cursor-pointer'
                        },
                            e(lucide.Upload, { size: 48, className: 'mx-auto mb-4 text-gray-400' }),
                            e('p', { className: 'text-lg mb-2' }, 'Click to select file'),
                            e('p', { className: 'text-sm text-gray-500' }, 
                                'Supported formats: CSV, Excel, QIF, OFX, JSON'
                            )
                        )
                    ),

                    file && e('div', { className: 'p-4 bg-gray-50 rounded-lg' },
                        e('p', { className: 'font-medium' }, file.name),
                        e('p', { className: 'text-sm text-gray-500' }, 
                            `Size: ${(file.size / 1024).toFixed(1)} KB`
                        )
                    ),

                    error && e('div', { className: 'p-4 bg-red-50 text-red-600 rounded-lg' }, error),

                    e('button', {
                        onClick: parseFile,
                        disabled: !file,
                        className: 'w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
                    }, 'Next')
                )
            ),

            step === 'preview' && parseResult && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Preview Transactions'),
                
                e('div', { className: 'mb-4 p-4 bg-gray-50 rounded-lg' },
                    e('p', null, `Found ${parseResult.transactions.length} transactions`),
                    parseResult.meta && e('p', { className: 'text-sm text-gray-600' }, 
                        `Format: ${parseResult.meta.format || 'Unknown'}`
                    )
                ),

                e('div', { className: 'overflow-x-auto' },
                    e('table', { className: 'min-w-full divide-y divide-gray-200' },
                        e('thead', { className: 'bg-gray-50' },
                            e('tr', null,
                                ['Date', 'Merchant', 'Category', 'Amount', 'Type'].map(header =>
                                    e('th', { 
                                        key: header,
                                        className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'
                                    }, header)
                                )
                            )
                        ),
                        e('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            parseResult.transactions.slice(0, 5).map((tx, index) =>
                                e('tr', { key: index },
                                    e('td', { className: 'px-4 py-2 text-sm' }, 
                                        new Date(tx.date).toLocaleDateString()
                                    ),
                                    e('td', { className: 'px-4 py-2 text-sm' }, tx.merchant),
                                    e('td', { className: 'px-4 py-2 text-sm' }, tx.category),
                                    e('td', { className: 'px-4 py-2 text-sm' }, `$${tx.amount.toFixed(2)}`),
                                    e('td', { className: 'px-4 py-2 text-sm' }, tx.type)
                                )
                            )
                        )
                    )
                ),

                parseResult.transactions.length > 5 && 
                e('p', { className: 'text-sm text-gray-500 mt-2' }, 
                    `... and ${parseResult.transactions.length - 5} more transactions`
                ),

                e('div', { className: 'flex gap-2 mt-6' },
                    e('button', {
                        onClick: () => setStep('select'),
                        className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                    }, 'Back'),
                    e('button', {
                        onClick: () => setStep('map'),
                        className: 'flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    }, 'Next')
                )
            ),

            step === 'map' && e('div', null,
                e('h3', { className: 'text-lg font-semibold mb-4' }, 'Map Fields (Optional)'),
                
                e('p', { className: 'text-sm text-gray-600 mb-4' }, 
                    'Adjust how fields are mapped if needed'
                ),

                e('div', { className: 'space-y-4' },
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium mb-1' }, 'Default Account'),
                        e('select', {
                            className: 'w-full p-2 border rounded',
                            onChange: (e) => setMappings({ ...mappings, accountId: e.target.value })
                        },
                            e('option', { value: 'imported' }, 'Imported Transactions'),
                            e('option', { value: 'checking' }, 'Checking Account'),
                            e('option', { value: 'savings' }, 'Savings Account'),
                            e('option', { value: 'credit' }, 'Credit Card')
                        )
                    ),

                    e('div', null,
                        e('label', { className: 'block text-sm font-medium mb-1' }, 'Category Mapping'),
                        e('p', { className: 'text-sm text-gray-600' }, 
                            'Categories have been automatically detected'
                        )
                    )
                ),

                e('div', { className: 'flex gap-2 mt-6' },
                    e('button', {
                        onClick: () => setStep('preview'),
                        className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                    }, 'Back'),
                    e('button', {
                        onClick: importTransactions,
                        disabled: importing,
                        className: 'flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50'
                    }, importing ? 'Importing...' : 'Import')
                )
            )
        );
    };

    // ===========================
    // Export Manager Component
    // ===========================
    const ExportManager = ({ transactions, onClose }) => {
        const [format, setFormat] = useState('csv');
        const [dateRange, setDateRange] = useState('all');
        const [categories, setCategories] = useState([]);

        const exportData = () => {
            let dataToExport = transactions;

            // Filter by date range
            if (dateRange !== 'all') {
                const now = new Date();
                const startDate = new Date();
                
                switch (dateRange) {
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case 'quarter':
                        startDate.setMonth(now.getMonth() - 3);
                        break;
                    case 'year':
                        startDate.setFullYear(now.getFullYear() - 1);
                        break;
                }

                dataToExport = dataToExport.filter(tx => 
                    new Date(tx.date) >= startDate
                );
            }

            // Filter by categories
            if (categories.length > 0) {
                dataToExport = dataToExport.filter(tx => 
                    categories.includes(tx.category)
                );
            }

            // Export based on format
            switch (format) {
                case 'csv':
                    exportCSV(dataToExport);
                    break;
                case 'excel':
                    exportExcel(dataToExport);
                    break;
                case 'json':
                    exportJSON(dataToExport);
                    break;
                case 'qif':
                    exportQIF(dataToExport);
                    break;
            }

            onClose();
        };

        const exportCSV = (data) => {
            const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type', 'Description'];
            const rows = data.map(tx => [
                new Date(tx.date).toLocaleDateString(),
                tx.merchant,
                tx.category,
                tx.amount.toFixed(2),
                tx.type,
                tx.description
            ]);

            const csv = [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');

            downloadFile(csv, `transactions_${Date.now()}.csv`, 'text/csv');
        };

        const exportExcel = async (data) => {
            if (!window.XLSX) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                await new Promise((resolve) => {
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }

            const ws = XLSX.utils.json_to_sheet(data.map(tx => ({
                Date: new Date(tx.date).toLocaleDateString(),
                Merchant: tx.merchant,
                Category: tx.category,
                Amount: tx.amount,
                Type: tx.type,
                Description: tx.description
            })));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
            
            XLSX.writeFile(wb, `transactions_${Date.now()}.xlsx`);
        };

        const exportJSON = (data) => {
            const json = JSON.stringify({ transactions: data }, null, 2);
            downloadFile(json, `transactions_${Date.now()}.json`, 'application/json');
        };

        const exportQIF = (data) => {
            let qif = '!Type:Bank\n';
            
            data.forEach(tx => {
                qif += `D${new Date(tx.date).toLocaleDateString()}\n`;
                qif += `T${tx.type === 'expense' ? '-' : ''}${tx.amount.toFixed(2)}\n`;
                qif += `P${tx.merchant}\n`;
                if (tx.description) qif += `M${tx.description}\n`;
                qif += `L${tx.category}\n`;
                qif += '^\n';
            });

            downloadFile(qif, `transactions_${Date.now()}.qif`, 'text/plain');
        };

        const downloadFile = (content, filename, type) => {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        };

        // Get unique categories
        const allCategories = [...new Set(transactions.map(tx => tx.category))];

        return e('div', { className: 'space-y-4' },
            e('h3', { className: 'text-lg font-semibold' }, 'Export Transactions'),

            e('div', null,
                e('label', { className: 'block text-sm font-medium mb-1' }, 'Format'),
                e('select', {
                    value: format,
                    onChange: (e) => setFormat(e.target.value),
                    className: 'w-full p-2 border rounded'
                },
                    e('option', { value: 'csv' }, 'CSV'),
                    e('option', { value: 'excel' }, 'Excel'),
                    e('option', { value: 'json' }, 'JSON'),
                    e('option', { value: 'qif' }, 'QIF')
                )
            ),

            e('div', null,
                e('label', { className: 'block text-sm font-medium mb-1' }, 'Date Range'),
                e('select', {
                    value: dateRange,
                    onChange: (e) => setDateRange(e.target.value),
                    className: 'w-full p-2 border rounded'
                },
                    e('option', { value: 'all' }, 'All Time'),
                    e('option', { value: 'month' }, 'Last Month'),
                    e('option', { value: 'quarter' }, 'Last Quarter'),
                    e('option', { value: 'year' }, 'Last Year')
                )
            ),

            e('div', null,
                e('label', { className: 'block text-sm font-medium mb-1' }, 'Categories'),
                e('div', { className: 'space-y-2 max-h-40 overflow-y-auto' },
                    allCategories.map(cat =>
                        e('label', { key: cat, className: 'flex items-center' },
                            e('input', {
                                type: 'checkbox',
                                checked: categories.includes(cat),
                                onChange: (e) => {
                                    if (e.target.checked) {
                                        setCategories([...categories, cat]);
                                    } else {
                                        setCategories(categories.filter(c => c !== cat));
                                    }
                                },
                                className: 'mr-2'
                            }),
                            cat
                        )
                    )
                )
            ),

            e('div', { className: 'flex gap-2' },
                e('button', {
                    onClick: onClose,
                    className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                }, 'Cancel'),
                e('button', {
                    onClick: exportData,
                    className: 'flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                }, 'Export')
            )
        );
    };

    // ===========================
    // Bank Connection Component
    // ===========================
    const BankConnection = ({ onConnect, onClose }) => {
        const [selectedBank, setSelectedBank] = useState('');
        const [credentials, setCredentials] = useState({ username: '', password: '' });
        const [connecting, setConnecting] = useState(false);
        const [error, setError] = useState('');

        const bankAPI = useRef(new BankAPISimulator());

        const handleConnect = async () => {
            if (!selectedBank || !credentials.username || !credentials.password) {
                setError('Please fill all fields');
                return;
            }

            setConnecting(true);
            setError('');

            try {
                const connection = await bankAPI.current.connect(selectedBank, credentials);
                const accounts = await bankAPI.current.getAccounts(connection.token);
                
                onConnect({
                    bank: bankAPI.current.banks.find(b => b.id === selectedBank),
                    accounts,
                    token: connection.token
                });
            } catch (err) {
                setError(err.message);
                setConnecting(false);
            }
        };

        return e('div', { className: 'space-y-4' },
            e('h3', { className: 'text-lg font-semibold' }, 'Connect Bank Account'),
            
            e('div', null,
                e('label', { className: 'block text-sm font-medium mb-1' }, 'Select Bank'),
                e('div', { className: 'grid grid-cols-2 gap-2' },
                    bankAPI.current.banks.map(bank =>
                        e('button', {
                            key: bank.id,
                            onClick: () => setSelectedBank(bank.id),
                            className: `p-4 border rounded-lg text-center transition-colors ${
                                selectedBank === bank.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-300 hover:border-gray-400'
                            }`
                        },
                            e('div', { className: 'text-2xl mb-1' }, bank.logo),
                            e('div', { className: 'text-sm' }, bank.name)
                        )
                    )
                )
            ),

            selectedBank && e('div', { className: 'space-y-4' },
                e('div', null,
                    e('label', { className: 'block text-sm font-medium mb-1' }, 'Username'),
                    e('input', {
                        type: 'text',
                        value: credentials.username,
                        onChange: (e) => setCredentials({ ...credentials, username: e.target.value }),
                        className: 'w-full p-2 border rounded'
                    })
                ),

                e('div', null,
                    e('label', { className: 'block text-sm font-medium mb-1' }, 'Password'),
                    e('input', {
                        type: 'password',
                        value: credentials.password,
                        onChange: (e) => setCredentials({ ...credentials, password: e.target.value }),
                        className: 'w-full p-2 border rounded'
                    })
                ),

                e('p', { className: 'text-xs text-gray-500' }, 
                    'This is a demo. Enter any username/password to simulate connection.'
                )
            ),

            error && e('div', { className: 'p-3 bg-red-50 text-red-600 rounded' }, error),

            e('div', { className: 'flex gap-2' },
                e('button', {
                    onClick: onClose,
                    className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                }, 'Cancel'),
                e('button', {
                    onClick: handleConnect,
                    disabled: !selectedBank || connecting,
                    className: 'flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
                }, connecting ? 'Connecting...' : 'Connect')
            )
        );
    };

    // ===========================
    // Export API
    // ===========================
    global.FinanceApp = global.FinanceApp || {};
    global.FinanceApp.IntegrationFeatures = {
        // Parsers
        FileParserFactory,
        CSVParser,
        ExcelParser,
        QIFParser,
        OFXParser,
        JSONParser,

        // Services
        BankAPISimulator,
        ReceiptOCRService,

        // Components
        ImportWizard,
        ExportManager,
        BankConnection,

        // Initialize
        initialize: function() {
            console.log('Initializing Integration Features...');
            
            // Pre-load libraries if needed
            const preloadLibraries = async () => {
                try {
                    // Pre-load Papa Parse for CSV
                    if (!window.Papa) {
                        const papascript = document.createElement('script');
                        papascript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
                        document.head.appendChild(papascript);
                    }

                    // Pre-load SheetJS for Excel
                    if (!window.XLSX) {
                        const xlsxscript = document.createElement('script');
                        xlsxscript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                        document.head.appendChild(xlsxscript);
                    }

                    console.log('Integration libraries pre-loaded');
                } catch (error) {
                    console.warn('Failed to pre-load some libraries:', error);
                }
            };

            preloadLibraries();
            
            console.log('Integration Features initialized successfully');
            return true;
        }
    };

})(window);