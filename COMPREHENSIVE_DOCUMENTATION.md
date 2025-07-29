# Sorstar - Comprehensive Code Documentation

## Table of Contents

1. [Overview](#overview)
2. [Backend Models](#backend-models)
3. [Backend Services](#backend-services)
4. [Backend Controllers](#backend-controllers)
5. [Backend Utilities](#backend-utilities)
6. [Frontend JavaScript Modules](#frontend-javascript-modules)
7. [CLI Interface](#cli-interface)
8. [Database Scripts](#database-scripts)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)

---

## Overview

Sorstar is a turn-based space trading game available as both a CLI application and web interface. The project includes:

- **Backend**: Node.js/Express API server with PostgreSQL database
- **Frontend**: Vanilla JavaScript web interface
- **CLI**: Interactive command-line interface
- **Database**: PostgreSQL with migration and seeding scripts

**Project Structure:**
```
sorstar/
├── src/                    # Backend source code
│   ├── models/            # Data models
│   ├── controllers/       # API controllers
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   ├── scripts/           # Database setup scripts
│   ├── cli.js             # CLI interface
│   ├── server.js          # Express server
│   └── index.js           # Main entry point
├── web/                   # Frontend web interface
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── sw.js              # Service worker
├── tests/                 # Test files
└── package.json           # Project configuration
```

---

## Backend Models

### User Model (`src/models/User.js`)

Represents user accounts with authentication capabilities.

**Properties:**
- `id` (number): Unique user identifier
- `username` (string): User's chosen username
- `passwordHash` (string): Bcrypt-hashed password
- `createdAt` (Date): Account creation timestamp

**Static Methods:**

#### `User.findByUsername(username)`
Finds a user by their username.

**Parameters:**
- `username` (string): The username to search for

**Returns:** `Promise<User|null>` - User instance or null if not found

**Example:**
```javascript
import { User } from './models/User.js';

const user = await User.findByUsername('pilot123');
if (user) {
    console.log(`Found user: ${user.username}`);
}
```

#### `User.findById(id)`
Finds a user by their ID.

**Parameters:**
- `id` (number): The user ID to search for

**Returns:** `Promise<User|null>` - User instance or null if not found

#### `User.create(username, password)`
Creates a new user account with hashed password.

**Parameters:**
- `username` (string): Desired username (must be unique)
- `password` (string): Plain text password (will be hashed)

**Returns:** `Promise<User>` - New user instance

**Throws:** Error if username already exists

**Example:**
```javascript
try {
    const newUser = await User.create('newpilot', 'securepassword');
    console.log(`Created user: ${newUser.username}`);
} catch (error) {
    console.error(`Failed to create user: ${error.message}`);
}
```

**Instance Methods:**

#### `validatePassword(password)`
Validates a password against the stored hash.

**Parameters:**
- `password` (string): Plain text password to validate

**Returns:** `Promise<boolean>` - True if password is valid

#### `toJSON()`
Returns a safe JSON representation (excludes password hash).

**Returns:** `Object` - Safe user data for API responses

---

### Game Model (`src/models/Game.js`)

Represents an active game session for a user.

**Properties:**
- `id` (number): Unique game identifier
- `userId` (number): Associated user ID
- `shipId` (number): Player's ship ID
- `currentPlanetId` (number): Current location
- `credits` (number): Player's money
- `turnsUsed` (number): Number of turns taken
- `createdAt` (Date): Game creation timestamp
- `updatedAt` (Date): Last update timestamp
- `shipName` (string): Ship name (from join)
- `cargoCapacity` (number): Ship's cargo capacity
- `planetName` (string): Current planet name
- `planetDescription` (string): Current planet description

**Static Methods:**

#### `Game.findByUserId(userId)`
Finds the most recent game for a user.

**Parameters:**
- `userId` (number): The user ID to search for

**Returns:** `Promise<Game|null>` - Game instance or null if not found

#### `Game.findById(id)`
Finds a game by its ID.

**Parameters:**
- `id` (number): The game ID to search for

**Returns:** `Promise<Game|null>` - Game instance or null if not found

#### `Game.create(userId, shipId)`
Creates a new game for a user with the selected ship.

**Parameters:**
- `userId` (number): User ID for the new game
- `shipId` (number): Selected ship ID

**Returns:** `Promise<Game>` - New game instance

**Example:**
```javascript
import { Game } from './models/Game.js';

// Start a new game with ship ID 1
const game = await Game.create(userId, 1);
console.log(`Game started at ${game.planetName} with ${game.credits} credits`);
```

**Instance Methods:**

#### `travelToPlanet(planetId)`
Moves the player to a different planet and increments turn count.

**Parameters:**
- `planetId` (number): Destination planet ID

**Returns:** `Promise<void>`

**Example:**
```javascript
await game.travelToPlanet(2);
console.log(`Traveled to planet ${planetId}, turn ${game.turnsUsed}`);
```

#### `getCargo()`
Retrieves the player's current cargo inventory.

**Returns:** `Promise<Array>` - Array of cargo items with commodity info

**Example:**
```javascript
const cargo = await game.getCargo();
cargo.forEach(item => {
    console.log(`${item.commodity_name}: ${item.quantity} units`);
});
```

#### `buyCommodity(commodityId, quantity, pricePerUnit)`
Purchases commodities and updates game state in a transaction.

**Parameters:**
- `commodityId` (number): ID of commodity to buy
- `quantity` (number): Number of units to purchase
- `pricePerUnit` (number): Price per unit

**Returns:** `Promise<void>`

**Example:**
```javascript
// Buy 5 units of Electronics at 150 credits each
await game.buyCommodity(1, 5, 150);
console.log(`Purchased 5 Electronics for 750 credits`);
```

#### `sellCommodity(commodityId, quantity, pricePerUnit)`
Sells commodities and updates game state in a transaction.

**Parameters:**
- `commodityId` (number): ID of commodity to sell
- `quantity` (number): Number of units to sell
- `pricePerUnit` (number): Price per unit

**Returns:** `Promise<void>`

#### `toJSON()`
Returns a JSON representation of the game state.

**Returns:** `Object` - Complete game state data

---

### Planet Model (`src/models/Planet.js`)

Represents planets in the game universe.

**Properties:**
- `id` (number): Unique planet identifier
- `name` (string): Planet name
- `description` (string): Planet description
- `xCoord` (number): X coordinate in space
- `yCoord` (number): Y coordinate in space

**Static Methods:**

#### `Planet.findAll()`
Retrieves all planets in the game.

**Returns:** `Promise<Array<Planet>>` - Array of all planets

#### `Planet.findById(id)`
Finds a planet by its ID.

**Parameters:**
- `id` (number): Planet ID to search for

**Returns:** `Promise<Planet|null>` - Planet instance or null

#### `Planet.findByName(name)`
Finds a planet by its name.

**Parameters:**
- `name` (string): Planet name to search for

**Returns:** `Promise<Planet|null>` - Planet instance or null

**Instance Methods:**

#### `getMarketPrices()`
Retrieves current market prices for all commodities on this planet.

**Returns:** `Promise<Array>` - Array of market data with prices and stock

**Example:**
```javascript
const planet = await Planet.findByName('Terra Nova');
const market = await planet.getMarketPrices();
market.forEach(item => {
    console.log(`${item.commodity_name}: Buy ${item.buy_price}, Sell ${item.sell_price}`);
});
```

---

### Ship Model (`src/models/Ship.js`)

Represents available ships players can choose from.

**Properties:**
- `id` (number): Unique ship identifier
- `name` (string): Ship name
- `cargoCapacity` (number): Maximum cargo units
- `cost` (number): Ship purchase cost
- `description` (string): Ship description

**Static Methods:**

#### `Ship.findAll()`
Retrieves all available ships.

**Returns:** `Promise<Array<Ship>>` - Array of all ships

#### `Ship.findById(id)`
Finds a ship by its ID.

**Parameters:**
- `id` (number): Ship ID to search for

**Returns:** `Promise<Ship|null>` - Ship instance or null

**Example:**
```javascript
import { Ship } from './models/Ship.js';

const ships = await Ship.findAll();
ships.forEach(ship => {
    console.log(`${ship.name}: ${ship.cargoCapacity} cargo, ${ship.cost} credits`);
});
```

---

### Commodity Model (`src/models/Commodity.js`)

Represents tradeable goods in the game.

**Properties:**
- `id` (number): Unique commodity identifier
- `name` (string): Commodity name
- `basePrice` (number): Base price for calculations
- `description` (string): Commodity description

**Static Methods:**

#### `Commodity.findAll()`
Retrieves all commodities.

**Returns:** `Promise<Array<Commodity>>` - Array of all commodities

#### `Commodity.findById(id)`
Finds a commodity by its ID.

**Parameters:**
- `id` (number): Commodity ID to search for

**Returns:** `Promise<Commodity|null>` - Commodity instance or null

#### `Commodity.findByName(name)`
Finds a commodity by its name.

**Parameters:**
- `name` (string): Commodity name to search for

**Returns:** `Promise<Commodity|null>` - Commodity instance or null

---

## Backend Services

### Authentication Service (`src/services/authService.js`)

Handles user authentication operations.

#### `createUser(username, password)`
Creates a new user account.

**Parameters:**
- `username` (string): Desired username
- `password` (string): Plain text password

**Returns:** `Promise<Object>` - User data (safe JSON format)

**Example:**
```javascript
import { createUser } from './services/authService.js';

try {
    const user = await createUser('newpilot', 'password123');
    console.log(`Created user: ${user.username}`);
} catch (error) {
    console.error(`Registration failed: ${error.message}`);
}
```

#### `authenticateUser(username, password)`
Authenticates a user login attempt.

**Parameters:**
- `username` (string): Username to authenticate
- `password` (string): Plain text password

**Returns:** `Promise<Object>` - User data if authentication succeeds

**Throws:** Error if user not found or password is invalid

**Example:**
```javascript
import { authenticateUser } from './services/authService.js';

try {
    const user = await authenticateUser('pilot123', 'password123');
    console.log(`Login successful for: ${user.username}`);
} catch (error) {
    console.error(`Login failed: ${error.message}`);
}
```

---

### Game Service (`src/services/gameService.js`)

Handles game-related operations and business logic.

#### `getShips()`
Retrieves all available ships.

**Returns:** `Promise<Array>` - Array of ship data

#### `createGame(userId, shipId)`
Creates a new game for a user.

**Parameters:**
- `userId` (number): User ID
- `shipId` (number): Selected ship ID

**Returns:** `Promise<Object>` - New game state data

#### `getGameState(userId)`
Retrieves current game state for a user.

**Parameters:**
- `userId` (number): User ID

**Returns:** `Promise<Object|null>` - Game state or null if no game exists

#### `getPlanets()`
Retrieves all planets.

**Returns:** `Promise<Array>` - Array of planet data

#### `travelToPlanet(gameId, planetId)`
Handles planet travel for a game.

**Parameters:**
- `gameId` (number): Game ID
- `planetId` (number): Destination planet ID

**Returns:** `Promise<void>`

#### `getMarketPrices(planetId)`
Gets market prices for a specific planet.

**Parameters:**
- `planetId` (number): Planet ID

**Returns:** `Promise<Array>` - Market price data

#### `getCargo(gameId)`
Gets cargo inventory for a game.

**Parameters:**
- `gameId` (number): Game ID

**Returns:** `Promise<Array>` - Cargo inventory data

#### `buyCommodity(gameId, commodityId, quantity, pricePerUnit)`
Handles commodity purchases.

**Parameters:**
- `gameId` (number): Game ID
- `commodityId` (number): Commodity ID
- `quantity` (number): Units to buy
- `pricePerUnit` (number): Price per unit

**Returns:** `Promise<void>`

#### `sellCommodity(gameId, commodityId, quantity, pricePerUnit)`
Handles commodity sales.

**Parameters:**
- `gameId` (number): Game ID
- `commodityId` (number): Commodity ID
- `quantity` (number): Units to sell
- `pricePerUnit` (number): Price per unit

**Returns:** `Promise<void>`

**Example:**
```javascript
import { getGameState, buyCommodity } from './services/gameService.js';

const gameState = await getGameState(userId);
if (gameState) {
    await buyCommodity(gameState.id, 1, 5, 150);
    console.log('Purchase completed');
}
```

---

## Backend Controllers

The controllers handle HTTP requests and responses for the API endpoints. They are documented in detail in the existing `API_DOCUMENTATION.md` file, but here are the key controller classes:

### AuthController (`src/controllers/AuthController.js`)

Handles authentication endpoints.

#### `AuthController.register(req, res)`
Handles POST `/auth/register` requests.

#### `AuthController.login(req, res)`
Handles POST `/auth/login` requests.

### GameController (`src/controllers/GameController.js`)

Handles game management endpoints.

#### `GameController.getShips(req, res)`
Handles GET `/ships` requests.

#### `GameController.getPlanets(req, res)`
Handles GET `/planets` requests.

#### `GameController.getGameState(req, res)`
Handles GET `/game/state` requests.

#### `GameController.startGame(req, res)`
Handles POST `/game/start` requests.

#### `GameController.travel(req, res)`
Handles POST `/game/travel` requests.

#### `GameController.getStats(req, res)`
Handles GET `/stats` requests.

### MarketController (`src/controllers/MarketController.js`)

Handles trading and market endpoints.

#### `MarketController.getMarketPrices(req, res)`
Handles GET `/market/:planetId` requests.

#### `MarketController.getCargo(req, res)`
Handles GET `/cargo` requests.

#### `MarketController.buyCommodity(req, res)`
Handles POST `/buy` requests.

#### `MarketController.sellCommodity(req, res)`
Handles POST `/sell` requests.

---

## Backend Utilities

### Display Utilities (`src/utils/display.js`)

Provides CLI display functions and ASCII art for the command-line interface.

**Constants:**

#### `ascii`
Object containing ASCII art for various game elements:
- `ascii.logo`: Main game logo
- `ascii.ship`: Ship artwork
- `ascii.planet`: Planet artwork
- `ascii.credits`: Credits artwork
- `ascii.cargo`: Cargo artwork

#### `icons`
Object containing emoji icons for UI elements:
- Navigation: `location`, `travel`, `planet`
- Trading: `market`, `buy`, `sell`, `cargo`, `credits`
- Game: `stats`, `ship`, `user`, `turns`
- Actions: `view`, `exit`, `login`, `create`, `back`, `cancel`
- Status: `success`, `error`, `warning`, `info`

**Functions:**

#### `displayTitle(title, icon = '')`
Displays a formatted title with border.

**Parameters:**
- `title` (string): Title text to display
- `icon` (string): Optional emoji icon

**Example:**
```javascript
import { displayTitle, icons } from './utils/display.js';

displayTitle('GALACTIC MARKET', icons.market);
```

#### `displayHeader(user, game)`
Displays the main game header with user and game info.

**Parameters:**
- `user` (Object): User data object
- `game` (Object): Game state object

#### `displayGameStats(user, game)`
Displays detailed game statistics.

**Parameters:**
- `user` (Object): User data object
- `game` (Object): Game state object

#### `displayMarketTable(prices, planetName)`
Displays market prices in a formatted table.

**Parameters:**
- `prices` (Array): Market price data
- `planetName` (string): Current planet name

#### `displayCargoTable(cargo, totalCargo, capacity)`
Displays cargo inventory in a formatted table.

**Parameters:**
- `cargo` (Array): Cargo inventory data
- `totalCargo` (number): Total cargo units
- `capacity` (number): Maximum cargo capacity

#### Message Display Functions

- `displaySuccess(message)`: Shows success message with green color
- `displayError(message)`: Shows error message with red color
- `displayWarning(message)`: Shows warning message with yellow color
- `displayInfo(message)`: Shows info message with blue color

#### Menu Helper Functions

- `addBackOption(choices, backText)`: Adds a back option to menu choices
- `addCancelOption(choices, cancelText)`: Adds a cancel option to menu choices
- `displayNavigationHelp()`: Shows navigation instructions

### Database Utilities

#### Database Connection (`src/utils/database.js`)

Provides PostgreSQL connection pool.

**Exports:**
- `query(text, params)`: Execute SQL queries
- `getClient()`: Get a database client for transactions
- `pool`: The connection pool instance

**Example:**
```javascript
import { query } from './utils/database.js';

const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

#### Database Connection Manager (`src/utils/dbConnection.js`)

Manages database connections with support for test/production switching.

**Functions:**
- `useTestDatabase()`: Switch to test database
- `useProductionDatabase()`: Switch to production database

---

## Frontend JavaScript Modules

### API Client (`web/js/api.js`)

Handles all communication with the backend API.

#### `ApiClient` Class

**Constructor:**
```javascript
const api = new ApiClient('http://localhost:3000');
```

**Methods:**

#### `setAuthToken(token)`
Sets the JWT token for authenticated requests.

**Parameters:**
- `token` (string): JWT authentication token

#### `call(endpoint, options)`
Makes HTTP requests to the API.

**Parameters:**
- `endpoint` (string): API endpoint path
- `options` (Object): Fetch options (method, body, headers, etc.)

**Returns:** `Promise<Object>` - Parsed JSON response

#### Authentication Methods

- `register(username, password)`: Register new user
- `login(username, password)`: Login user

#### Game Methods

- `getShips()`: Get available ships
- `getPlanets()`: Get all planets
- `getGameState()`: Get current game state
- `startGame(shipId)`: Start new game
- `travel(planetId)`: Travel to planet
- `getStats()`: Get game statistics

#### Trading Methods

- `getMarketPrices(planetId)`: Get market prices
- `getCargo()`: Get cargo inventory
- `buyCommodity(commodityId, quantity)`: Buy commodity
- `sellCommodity(commodityId, quantity)`: Sell commodity

#### Utility Methods

- `healthCheck()`: Check API health

**Example:**
```javascript
import { ApiClient } from './js/api.js';

const api = new ApiClient();
const loginResult = await api.login('username', 'password');
api.setAuthToken(loginResult.token);

const ships = await api.getShips();
console.log('Available ships:', ships);
```

---

### Authentication Manager (`web/js/auth.js`)

Handles user authentication in the web interface.

#### `AuthManager` Class

**Constructor:**
```javascript
const auth = new AuthManager(apiClient, gameManager);
```

**Methods:**

#### `login()`
Handles login form submission.

**Returns:** `Promise<void>`

#### `register()`
Handles registration form submission.

**Returns:** `Promise<void>`

#### `logout()`
Logs out the current user.

**Returns:** `Promise<void>`

#### `showAuthMessage(message, type)`
Displays authentication messages.

**Parameters:**
- `message` (string): Message to display
- `type` (string): Message type ('success', 'error', 'loading')

#### `setAuthButtonsDisabled(disabled)`
Enables/disables authentication buttons.

**Parameters:**
- `disabled` (boolean): Whether to disable buttons

**Example:**
```javascript
import { AuthManager } from './js/auth.js';

const authManager = new AuthManager(api, game);
// Login form will automatically call authManager.login()
```

---

### Game Manager (`web/js/game.js`)

Manages game state and operations in the web interface.

#### `GameManager` Class

**Constructor:**
```javascript
const game = new GameManager(apiClient);
```

**Properties:**
- `gameState`: Current game state object
- `currentTransaction`: Current trading transaction data

**Methods:**

#### `loadGameState()`
Loads and displays current game state.

**Returns:** `Promise<void>`

#### `showShips()`
Displays available ships for game creation.

**Returns:** `Promise<void>`

#### `startGame(shipId)`
Starts a new game with selected ship.

**Parameters:**
- `shipId` (number): Selected ship ID

**Returns:** `Promise<void>`

#### `showMarket()`
Displays current planet's market.

**Returns:** `Promise<void>`

#### `showCargo()`
Displays cargo inventory.

**Returns:** `Promise<void>`

#### `showPlanets()`
Displays available planets for travel.

**Returns:** `Promise<void>`

#### `travel(planetId)`
Travels to selected planet.

**Parameters:**
- `planetId` (number): Destination planet ID

**Returns:** `Promise<void>`

**Example:**
```javascript
import { GameManager } from './js/game.js';

const gameManager = new GameManager(api);
await gameManager.loadGameState();
await gameManager.showMarket();
```

---

### Trading Manager (`web/js/trading.js`)

Handles trading operations and modal interfaces.

#### `TradingManager` Class

**Constructor:**
```javascript
const trading = new TradingManager(gameManager, apiClient);
```

**Methods:**

#### `openBuyModal(commodityId, name, price, stock)`
Opens the buy commodity modal.

**Parameters:**
- `commodityId` (number): Commodity ID
- `name` (string): Commodity name
- `price` (number): Price per unit
- `stock` (number): Available stock

#### `openSellModal(commodityId, name, ownedQuantity)`
Opens the sell commodity modal.

**Parameters:**
- `commodityId` (number): Commodity ID
- `name` (string): Commodity name
- `ownedQuantity` (number): Units owned

#### `confirmBuyTransaction()`
Confirms and executes buy transaction.

**Returns:** `Promise<void>`

#### `confirmSellTransaction()`
Confirms and executes sell transaction.

**Returns:** `Promise<void>`

#### Quantity Control Methods

- `adjustQuantity(type, amount)`: Adjust transaction quantity
- `setBuyMax()`: Set buy quantity to maximum
- `setSellMax()`: Set sell quantity to maximum
- `validateBuyQuantity()`: Validate buy quantity input
- `validateSellQuantity()`: Validate sell quantity input

#### Preview Methods

- `updateBuyPreview()`: Update buy transaction preview
- `updateSellPreview()`: Update sell transaction preview

**Example:**
```javascript
import { TradingManager } from './js/trading.js';

const tradingManager = new TradingManager(gameManager, api);
// Called automatically from market interface
tradingManager.openBuyModal(1, 'Electronics', 150, 50);
```

---

### UI Utilities (`web/js/ui.js`)

Provides user interface utility functions.

#### `UI` Class (Static Methods)

#### `UI.showMessage(message, type, duration)`
Displays temporary messages.

**Parameters:**
- `message` (string): Message text
- `type` (string): Message type ('success', 'error', 'info', 'warning')
- `duration` (number): Display duration in milliseconds (default: 5000)

#### `UI.showLoading(message)`
Displays loading message.

**Parameters:**
- `message` (string): Loading message (default: 'Loading...')

#### Modal Methods

- `UI.showModal(modalId)`: Show modal by ID
- `UI.closeModal(modalId)`: Close modal by ID
- `UI.closeAllModals()`: Close all open modals

#### `UI.showConfirmation(options)`
Shows confirmation dialog.

**Parameters:**
- `options` (Object): Confirmation options
  - `title` (string): Dialog title
  - `message` (string): Confirmation message
  - `onConfirm` (Function): Callback for confirmation
  - `onCancel` (Function): Callback for cancellation

#### Data Display Methods

- `UI.createTable(headers, rows)`: Create HTML table
- `UI.formatCurrency(amount)`: Format currency display
- `UI.updateGameStats(gameState)`: Update game statistics display
- `UI.showGameButtons(show)`: Show/hide game action buttons

**Example:**
```javascript
import { UI } from './js/ui.js';

UI.showMessage('Transaction completed!', 'success');
UI.showConfirmation({
    title: 'Confirm Purchase',
    message: 'Buy 5 Electronics for 750 credits?',
    onConfirm: () => tradingManager.confirmBuyTransaction()
});
```

---

## CLI Interface

### Main CLI (`src/cli.js`)

Provides the interactive command-line interface.

#### `startCli()`
Main entry point for CLI mode.

**Returns:** `Promise<void>`

#### Menu Functions

- `mainMenu()`: Main game menu
- `authMenu()`: Authentication menu (login/register)
- `gameMenu()`: In-game menu
- `shipSelectionMenu()`: Ship selection for new games
- `marketMenu()`: Market and trading interface
- `cargoMenu()`: Cargo inventory display
- `travelMenu()`: Planet travel interface
- `statsMenu()`: Game statistics display

#### Trading Functions

- `buyMenu()`: Commodity purchase interface
- `sellMenu()`: Commodity selling interface

**Example Usage:**
```bash
# Start CLI mode
npm run play

# Or directly
node src/index.js play
```

### Main Entry Point (`src/index.js`)

Command-line interface using Commander.js.

#### Commands

- `sorstar play`: Start interactive CLI game
- `sorstar server [-p port]`: Start API server
- `sorstar`: Show help and available commands

**Example:**
```bash
# Start CLI game
sorstar play

# Start server on default port (3000)
sorstar server

# Start server on custom port
sorstar server -p 8080
```

---

## Database Scripts

### Setup Scripts

#### `src/scripts/setupDatabase.js`
Sets up the main database schema and initial data.

**Usage:**
```bash
npm run db:setup
```

#### `src/scripts/setupTestDatabase.js`
Sets up test database for running tests.

**Usage:**
```bash
npm run db:setup:test
```

#### `src/scripts/seed.js`
Seeds database with initial game data (ships, planets, commodities).

**Usage:**
```bash
npm run seed
```

### Utility Scripts

#### `src/scripts/showData.js`
Displays current database data for debugging.

#### `src/scripts/showSchema.js`
Shows database schema structure.

#### `src/scripts/showTables.js`
Lists all database tables.

#### `src/scripts/testConnection.js`
Tests database connectivity.

**Example:**
```bash
# Set up database
npm run db:setup

# Seed with initial data
npm run seed

# View current data
node src/scripts/showData.js
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sorstar
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Server Configuration
PORT=3000
```

### Package.json Scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "play": "node src/index.js play",
    "server": "node src/index.js server",
    "dev": "node --watch src/index.js",
    "dev:server": "node --watch src/index.js server",
    "seed": "node src/scripts/seed.js",
    "db:setup": "node src/scripts/setupDatabase.js",
    "db:setup:test": "node src/scripts/setupTestDatabase.js",
    "test": "node test-runner.js",
    "test:jest": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch"
  }
}
```

---

## Usage Examples

### Complete Backend Usage Example

```javascript
import { User } from './src/models/User.js';
import { Game } from './src/models/Game.js';
import { Planet } from './src/models/Planet.js';

// Create user and start game
const user = await User.create('newpilot', 'password123');
const game = await Game.create(user.id, 1); // Ship ID 1

// Travel to different planet
await game.travelToPlanet(2);

// Check market prices
const planet = await Planet.findById(game.currentPlanetId);
const market = await planet.getMarketPrices();

// Buy some commodities
const electronics = market.find(item => item.commodity_name === 'Electronics');
await game.buyCommodity(electronics.commodity_id, 5, electronics.buy_price);

// Check cargo
const cargo = await game.getCargo();
console.log('Current cargo:', cargo);
```

### Complete Frontend Usage Example

```javascript
// Initialize API client and managers
const api = new ApiClient('http://localhost:3000');
const gameManager = new GameManager(api);
const authManager = new AuthManager(api, gameManager);
const tradingManager = new TradingManager(gameManager, api);

// Login user
const loginResult = await api.login('pilot123', 'password');
api.setAuthToken(loginResult.token);

// Load game state
await gameManager.loadGameState();

// Show market and make a purchase
await gameManager.showMarket();
tradingManager.openBuyModal(1, 'Electronics', 150, 50);
```

### Complete CLI Usage Example

```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Seed initial data
npm run seed

# Start CLI game
npm run play

# Or start web server
npm run server
```

### API Usage Example

```bash
# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"pilot123","password":"password"}'

# Login and get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pilot123","password":"password"}'

# Start game (using token from login)
curl -X POST http://localhost:3000/game/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"shipId":1}'

# Check market prices
curl http://localhost:3000/market/1

# Buy commodities
curl -X POST http://localhost:3000/buy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"commodityId":1,"quantity":5}'
```

---

This documentation covers all public APIs, functions, and components in the Sorstar project. Each section includes detailed parameter information, return values, and practical examples to help developers understand and use the codebase effectively.