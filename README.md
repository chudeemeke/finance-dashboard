# Family Finance Dashboard

A comprehensive financial management system for families, built with React and modern web technologies.

## Features

### Core Financial Management
- **Transaction Tracking**: Record and categorize all income and expenses
- **Budget Management**: Set and monitor budgets by category
- **Bill Tracking**: Never miss a payment with bill reminders
- **Savings Goals**: Track progress toward financial goals
- **Financial Reports**: Visualize spending patterns and trends

### Advanced Features
- **Multi-User Support**: Role-based access (Admin, Editor, Viewer)
- **Data Visualization**: Interactive charts using Recharts
- **Offline Support**: Progressive Web App with offline functionality
- **Data Security**: Local encryption and privacy controls
- **International Support**: Multi-currency and localization ready

## Technology Stack

- **Frontend**: React 18.2.0
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Custom React Context implementation
- **Storage**: LocalStorage with encryption
- **PWA**: Service Worker for offline support

## Project Structure

```
finance-dashboard/
├── src/                    # Source code
│   ├── components/        # React components
│   │   ├── auth/         # Authentication
│   │   ├── common/       # Shared components
│   │   ├── dashboard/    # Dashboard views
│   │   ├── finance/      # Financial components
│   │   └── layout/       # Layout components
│   ├── features/         # Feature modules
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utilities
│   ├── config/          # Configuration
│   ├── state/           # State management
│   └── services/        # API services
├── public/              # Static assets
├── docs/                # Documentation
├── tests/               # Test files
└── scripts/             # Build scripts
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd finance-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

The app can be configured through `src/config/app.config.js`:

- `ENABLE_OFFLINE_MODE`: Enable PWA offline functionality
- `ENABLE_ENCRYPTION`: Enable local data encryption
- `DEFAULT_CURRENCY`: Set default currency (USD, EUR, GBP, etc.)
- `DATE_FORMAT`: Set date format preference

## User Roles

- **Admin**: Full access to all features and settings
- **Editor**: Can add/edit transactions and budgets
- **Viewer**: Read-only access to financial data

## Security

- All sensitive data is encrypted before storage
- No data is sent to external servers
- Optional password protection
- Session timeout for inactivity

## Progressive Web App

The dashboard can be installed as a PWA:
1. Open in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the prompts

## Testing

Run the test suite:
```bash
npm test
```

## Development Notes

### Code Style
- ESLint for code linting
- Prettier for code formatting
- Follow React best practices

### Adding New Features
1. Create feature in `/src/features/`
2. Add components in `/src/components/`
3. Update state management if needed
4. Add tests in `/tests/`

## Known Issues

- Chart animations may lag on older devices
- Some features require modern browser support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions:
- Open an issue on GitHub
- Email: your-email@example.com

## Acknowledgments

- React team for the amazing framework
- Tailwind CSS for utility-first styling
- Recharts for beautiful data visualization
- All contributors and testers

---

**Version**: 3.1.0  
**Last Updated**: June 8, 2025
