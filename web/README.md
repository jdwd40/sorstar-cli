# Sorstar Web Interface

Modern, responsive web interface for the Sorstar space trading game.

## Features

- **Mobile-First Responsive Design**: Optimized for phones, tablets, and desktop
- **Modular JavaScript Architecture**: Clean separation of concerns
- **Advanced Trading System**: Enhanced buy/sell with confirmation dialogs
- **Real-time Updates**: Live game state synchronization
- **PWA Ready**: Service worker support for offline capabilities

## File Structure

```
web/
├── css/
│   └── styles.css          # Mobile-first responsive styles
├── js/
│   ├── api.js             # API communication layer
│   ├── auth.js            # Authentication management
│   ├── game.js            # Core game logic
│   ├── trading.js         # Trading system
│   └── ui.js              # UI utilities and helpers
└── sw.js                  # Service worker (PWA)

sorstar-web.html           # Main HTML file
```

## Usage

1. Start the Sorstar server:
   ```bash
   node src/index.js server
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/sorstar-web.html
   ```

3. Login with test accounts:
   - `testpilot / password123` (has existing game)
   - `frontend_test / test123` (new user)

**Note**: The web interface must be accessed via the HTTP server (not by opening the HTML file directly) to avoid CORS issues with ES6 modules.

## Development Shortcuts

- **Ctrl/Cmd + 1**: Auto-fill testpilot credentials
- **Ctrl/Cmd + 2**: Auto-fill frontend_test credentials
- **Escape**: Close any open modal

## Responsive Breakpoints

- **Mobile**: < 768px (stacked layout)
- **Tablet**: 768px - 1024px (2-column stats)
- **Desktop**: 1024px - 1440px (3-column stats)
- **Large Desktop**: > 1440px (4-column stats)

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with ES6 module support

## Architecture

The application uses a modular ES6 architecture:

- **ApiClient**: Handles all HTTP communication
- **AuthManager**: User authentication and session management
- **GameManager**: Core game state and actions
- **TradingManager**: Advanced buy/sell functionality
- **UI**: Utility functions for interface management

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast color scheme
- Touch-friendly button sizes (44px minimum)