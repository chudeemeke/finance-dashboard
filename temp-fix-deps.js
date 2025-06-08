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
            get: () => () => React.createElement('span', { 
                style: { 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    background: '#ddd',
                    borderRadius: '4px'
                } 
            })
        })
    };
    
    // Add commonly used icons
    const iconNames = ['Loader2', 'Home', 'Settings', 'User', 'LogOut', 'Menu', 'X', 'Plus', 'Edit', 'Trash2'];
    iconNames.forEach(name => {
        window.lucide[name] = () => React.createElement('span', { 
            style: { 
                display: 'inline-block', 
                width: '20px', 
                height: '20px', 
                background: '#ddd',
                borderRadius: '4px'
            },
            title: name
        });
    });
    
    console.warn('Lucide icons not loaded - using placeholders');
}