/**
 * Family Finance Dashboard v3.1.0
 * Authentication Components
 * 
 * Includes Login, Registration, and Demo Account Access
 */

(function() {
    'use strict';
    
    const { useState, useEffect, useCallback } = React;
    const { useFinance } = FinanceApp;
    
    // Login Component
    const LoginForm = () => {
        const { state, actions } = useFinance();
        const [formData, setFormData] = useState({
            username: '',
            password: ''
        });
        const [showPassword, setShowPassword] = useState(false);
        const [isRegistering, setIsRegistering] = useState(false);
        const [errors, setErrors] = useState({});
        
        // Handle input changes
        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
            // Clear error for this field
            setErrors(prev => ({ ...prev, [name]: '' }));
        };
        
        // Validate form
        const validateForm = () => {
            const newErrors = {};
            
            if (!formData.username.trim()) {
                newErrors.username = 'Username is required';
            } else if (formData.username.length < 3) {
                newErrors.username = 'Username must be at least 3 characters';
            }
            
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (isRegistering) {
                const passwordValidation = FinanceApp.Utils.validatePassword(formData.password);
                if (!passwordValidation.isValid) {
                    newErrors.password = passwordValidation.errors[0];
                }
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };
        
        // Handle login
        const handleLogin = async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            const result = await actions.auth.login(formData.username, formData.password);
            
            if (!result.success) {
                setErrors({ general: result.error });
            }
        };
        
        // Handle registration
        const handleRegister = async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            // Check if username already exists
            const existingUser = state.users.all.find(u => u.username === formData.username);
            if (existingUser) {
                setErrors({ username: 'Username already exists' });
                return;
            }
            
            const result = await actions.users.create({
                ...formData,
                role: state.users.length === 0 ? 'admin' : 'viewer', // First user is admin
                email: `${formData.username}@family.local`,
                settings: {}
            });
            
            if (result.success) {
                FinanceApp.Utils.NotificationUtils.show('Registration successful! Please login.', 'success');
                setIsRegistering(false);
                setFormData({ username: formData.username, password: '' });
            }
        };
        
        // Demo account login
        const loginWithDemo = async (role) => {
            const demoAccounts = {
                admin: { username: 'demo_admin', password: 'Demo@2024!' },
                editor: { username: 'demo_editor', password: 'Demo@2024!' },
                viewer: { username: 'demo_viewer', password: 'Demo@2024!' }
            };
            
            const account = demoAccounts[role];
            
            // Create demo account if it doesn't exist
            const existingUser = state.users.all.find(u => u.username === account.username);
            if (!existingUser) {
                await actions.users.create({
                    username: account.username,
                    password: account.password,
                    role: role,
                    email: `${account.username}@demo.local`,
                    isDemo: true,
                    settings: {}
                });
            }
            
            // Login with demo account
            await actions.auth.login(account.username, account.password);
        };
        
        return React.createElement('div', {
            className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4'
        },
            React.createElement('div', {
                className: 'max-w-md w-full'
            },
                // Logo and Title
                React.createElement('div', {
                    className: 'text-center mb-8 animate-fade-in'
                },
                    React.createElement('div', {
                        className: 'inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4'
                    },
                        React.createElement('i', {
                            'data-lucide': 'wallet',
                            className: 'w-10 h-10 text-white'
                        })
                    ),
                    React.createElement('h1', {
                        className: 'text-3xl font-bold text-gray-900'
                    }, 'Family Finance Dashboard'),
                    React.createElement('p', {
                        className: 'text-gray-600 mt-2'
                    }, 'Manage your family finances with ease')
                ),
                
                // Login/Register Form
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-xl p-8 animate-scale-in'
                },
                    React.createElement('h2', {
                        className: 'text-2xl font-semibold mb-6'
                    }, isRegistering ? 'Create Account' : 'Welcome Back'),
                    
                    // Error message
                    errors.general && React.createElement('div', {
                        className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'
                    }, errors.general),
                    
                    // Form
                    React.createElement('form', {
                        onSubmit: isRegistering ? handleRegister : handleLogin,
                        className: 'space-y-4'
                    },
                        // Username field
                        React.createElement('div', null,
                            React.createElement('label', {
                                htmlFor: 'username',
                                className: 'block text-sm font-medium text-gray-700 mb-1'
                            }, 'Username'),
                            React.createElement('div', {
                                className: 'relative'
                            },
                                React.createElement('input', {
                                    type: 'text',
                                    id: 'username',
                                    name: 'username',
                                    value: formData.username,
                                    onChange: handleChange,
                                    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.username ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                    placeholder: 'Enter your username',
                                    autoComplete: 'username'
                                }),
                                React.createElement('i', {
                                    'data-lucide': 'user',
                                    className: 'absolute right-3 top-2.5 w-5 h-5 text-gray-400'
                                })
                            ),
                            errors.username && React.createElement('p', {
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.username)
                        ),
                        
                        // Password field
                        React.createElement('div', null,
                            React.createElement('label', {
                                htmlFor: 'password',
                                className: 'block text-sm font-medium text-gray-700 mb-1'
                            }, 'Password'),
                            React.createElement('div', {
                                className: 'relative'
                            },
                                React.createElement('input', {
                                    type: showPassword ? 'text' : 'password',
                                    id: 'password',
                                    name: 'password',
                                    value: formData.password,
                                    onChange: handleChange,
                                    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                    placeholder: 'Enter your password',
                                    autoComplete: isRegistering ? 'new-password' : 'current-password'
                                }),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setShowPassword(!showPassword),
                                    className: 'absolute right-3 top-2.5 text-gray-400 hover:text-gray-600'
                                },
                                    React.createElement('i', {
                                        'data-lucide': showPassword ? 'eye-off' : 'eye',
                                        className: 'w-5 h-5'
                                    })
                                )
                            ),
                            errors.password && React.createElement('p', {
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.password)
                        ),
                        
                        // Password requirements (for registration)
                        isRegistering && React.createElement('div', {
                            className: 'bg-gray-50 rounded p-3 text-sm text-gray-600'
                        },
                            React.createElement('p', {
                                className: 'font-medium mb-1'
                            }, 'Password must contain:'),
                            React.createElement('ul', {
                                className: 'list-disc list-inside space-y-1'
                            },
                                React.createElement('li', null, `At least ${FinanceApp.CONFIG.PASSWORD_MIN_LENGTH} characters`),
                                React.createElement('li', null, 'One uppercase letter'),
                                React.createElement('li', null, 'One lowercase letter'),
                                React.createElement('li', null, 'One number'),
                                React.createElement('li', null, 'One special character')
                            )
                        ),
                        
                        // Submit button
                        React.createElement('button', {
                            type: 'submit',
                            disabled: state.loading,
                            className: 'w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        }, 
                            state.loading 
                                ? React.createElement('span', {
                                    className: 'inline-flex items-center'
                                },
                                    React.createElement('span', {
                                        className: 'loading-spinner w-5 h-5 mr-2'
                                    }),
                                    'Processing...'
                                )
                                : (isRegistering ? 'Create Account' : 'Sign In')
                        )
                    ),
                    
                    // Toggle between login and register
                    React.createElement('div', {
                        className: 'mt-6 text-center'
                    },
                        React.createElement('p', {
                            className: 'text-sm text-gray-600'
                        },
                            isRegistering ? 'Already have an account? ' : "Don't have an account? ",
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => {
                                    setIsRegistering(!isRegistering);
                                    setErrors({});
                                    setFormData({ username: '', password: '' });
                                },
                                className: 'text-primary hover:text-blue-600 font-medium'
                            }, isRegistering ? 'Sign In' : 'Create Account')
                        )
                    ),
                    
                    // Demo accounts section
                    React.createElement('div', {
                        className: 'mt-8 pt-6 border-t border-gray-200'
                    },
                        React.createElement('p', {
                            className: 'text-sm text-gray-600 text-center mb-4'
                        }, 'Or try with a demo account:'),
                        React.createElement('div', {
                            className: 'grid grid-cols-3 gap-2'
                        },
                            ['admin', 'editor', 'viewer'].map(role => 
                                React.createElement('button', {
                                    key: role,
                                    type: 'button',
                                    onClick: () => loginWithDemo(role),
                                    className: 'py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors capitalize'
                                }, `Demo ${role}`)
                            )
                        )
                    )
                ),
                
                // Footer
                React.createElement('div', {
                    className: 'mt-8 text-center text-sm text-gray-600'
                },
                    React.createElement('p', null, 
                        `Version ${FinanceApp.CONFIG.APP_VERSION} • `,
                        React.createElement('a', {
                            href: '#',
                            className: 'text-primary hover:text-blue-600'
                        }, 'Privacy Policy')
                    )
                )
            )
        );
    };
    
    // Session Manager Component
    const SessionManager = ({ children }) => {
        const { state, actions } = useFinance();
        const [lastActivity, setLastActivity] = useState(Date.now());
        
        // Update last activity on user interaction
        useEffect(() => {
            const updateActivity = () => {
                setLastActivity(Date.now());
                if (state.isAuthenticated) {
                    actions.updateSession();
                }
            };
            
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            events.forEach(event => {
                window.addEventListener(event, updateActivity);
            });
            
            return () => {
                events.forEach(event => {
                    window.removeEventListener(event, updateActivity);
                });
            };
        }, [state.isAuthenticated]);
        
        // Check for inactivity
        useEffect(() => {
            if (!state.isAuthenticated) return;
            
            const checkInactivity = () => {
                const inactiveTime = Date.now() - lastActivity;
                const warningTime = FinanceApp.CONFIG.SESSION_TIMEOUT - 5 * 60 * 1000; // 5 minutes before timeout
                
                if (inactiveTime > FinanceApp.CONFIG.SESSION_TIMEOUT) {
                    actions.logout();
                    FinanceApp.Utils.NotificationUtils.show('Session expired due to inactivity', 'warning');
                } else if (inactiveTime > warningTime) {
                    const remainingMinutes = Math.ceil((FinanceApp.CONFIG.SESSION_TIMEOUT - inactiveTime) / 60000);
                    FinanceApp.Utils.NotificationUtils.show(
                        `Your session will expire in ${remainingMinutes} minutes`, 
                        'warning'
                    );
                }
            };
            
            const interval = setInterval(checkInactivity, 60000); // Check every minute
            return () => clearInterval(interval);
        }, [state.isAuthenticated, lastActivity]);
        
        return children;
    };
    
    // Access Control Component
    const RequireAuth = ({ children, requiredRole = null }) => {
        const { state } = useFinance();
        
        if (!state.isAuthenticated) {
            return React.createElement(LoginForm);
        }
        
        if (requiredRole && state.currentUser.role !== 'admin' && state.currentUser.role !== requiredRole) {
            return React.createElement('div', {
                className: 'flex items-center justify-center min-h-screen'
            },
                React.createElement('div', {
                    className: 'bg-red-50 border border-red-200 rounded-lg p-8 max-w-md'
                },
                    React.createElement('h2', {
                        className: 'text-xl font-semibold text-red-800 mb-2'
                    }, 'Access Denied'),
                    React.createElement('p', {
                        className: 'text-red-600'
                    }, `You need ${requiredRole} or admin privileges to access this feature.`)
                )
            );
        }
        
        return children;
    };
    
    // Can Component - For conditional rendering based on permissions
    const Can = ({ perform, on, children, fallback = null }) => {
        const { state } = useFinance();
        
        if (!state.isAuthenticated) return fallback;
        
        const userRole = state.currentUser.role;
        
        // Admin can do anything
        if (userRole === 'admin') return children;
        
        // Define permission matrix
        const permissions = {
            viewer: ['view'],
            editor: ['view', 'create', 'edit'],
            admin: ['view', 'create', 'edit', 'delete', 'manage']
        };
        
        const userPermissions = permissions[userRole] || [];
        
        if (userPermissions.includes(perform)) {
            return children;
        }
        
        return fallback;
    };
    
    // Export components to global FinanceApp object
    Object.assign(window.FinanceApp, {
        AuthComponents: {
            LoginForm,
            SessionManager,
            RequireAuth,
            Can
        }
    });
    
    console.log('FinanceApp Authentication Components loaded successfully');
})();