/**
 * temp-fix-deps.js - Temporary fix for missing dependencies
 * Add this BEFORE your app scripts in index.html
 */

// Mock Recharts if not loaded
if (!window.Recharts) {
    window.Recharts = {
        LineChart: () => null,
        BarChart: () => null,
        PieChart: () => null,
        AreaChart: () => null,
        ComposedChart: () => null,
        RadarChart: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        Tooltip: () => null,
        Legend: () => null,
        Line: () => null,
        Bar: () => null,
        Area: () => null,
        Pie: () => null,
        Cell: () => null,
        ResponsiveContainer: ({ children }) => children
    };
    console.warn('Recharts not loaded - using mock implementation');
}

// Mock Lucide icons if not loaded
if (!window.lucide) {
    window.lucide = {
        createIcons: () => {},
        icons: new Proxy({}, {
            get: () => () => {
                // Check if React is available
                if (typeof React !== 'undefined' && React.createElement) {
                    return React.createElement('span', { 
                        style: { 
                            display: 'inline-block', 
                            width: '20px', 
                            height: '20px', 
                            background: '#ddd',
                            borderRadius: '4px'
                        } 
                    });
                }
                // Return a simple div if React isn't available
                return null;
            }
        })
    };
    
    // Add commonly used icons
    const iconNames = ['Loader2', 'Home', 'Settings', 'User', 'LogOut', 'Menu', 'X', 'Plus', 'Edit', 'Trash2'];
    iconNames.forEach(name => {
        window.lucide[name] = () => {
            // Check if React is available
            if (typeof React !== 'undefined' && React.createElement) {
                return React.createElement('span', { 
                    style: { 
                        display: 'inline-block', 
                        width: '20px', 
                        height: '20px', 
                        background: '#ddd',
                        borderRadius: '4px'
                    },
                    title: name
                });
            }
            // Return null if React isn't available
            return null;
        };
    });
    
    console.warn('Lucide icons not loaded - using placeholders');
}