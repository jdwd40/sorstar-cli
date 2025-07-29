# Sorstar API Documentation

## Overview

The Sorstar API provides RESTful endpoints for the space trading game. It supports user authentication, game management, and gameplay operations including trading, travel, and inventory management.

**Base URL:** `http://localhost:3000` (default)

**Authentication:** JWT Bearer tokens required for protected endpoints

**Content-Type:** `application/json`

---

## Authentication Endpoints

### POST /auth/register

Creates a new user account.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "pilot123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Missing username or password
- `400`: Username already exists

---

### POST /auth/login

Authenticate an existing user.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "pilot123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Missing username or password
- `401`: User not found
- `401`: Invalid password

---

## Game Management Endpoints

### GET /ships

Get list of available ships. No authentication required.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Light Freighter",
    "cargo_capacity": 50,
    "cost": 5000,
    "description": "A small but reliable cargo ship"
  },
  {
    "id": 2,
    "name": "Heavy Hauler",
    "cargo_capacity": 150,
    "cost": 15000,
    "description": "Large capacity vessel for serious traders"
  }
]
```

---

### GET /planets

Get list of all planets. No authentication required.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Terra Nova",
    "description": "A bustling trade hub in the inner system"
  },
  {
    "id": 2,
    "name": "Mars Station",
    "description": "Industrial mining colony on the red planet"
  },
  {
    "id": 3,
    "name": "Europa Base",
    "description": "Research facility in the outer system"
  }
]
```

---

### GET /game/state

Get current game state for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200) - With Game:**
```json
{
  "id": 1,
  "user_id": 1,
  "ship_id": 1,
  "current_planet_id": 1,
  "credits": 850,
  "turns_used": 5,
  "ship_name": "Light Freighter",
  "cargo_capacity": 50,
  "planet_name": "Terra Nova",
  "planet_description": "A bustling trade hub in the inner system",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Success Response (200) - No Game:**
```json
null
```

**Error Responses:**
- `401`: Access token required
- `403`: Invalid or expired token

---

### POST /game/start

Start a new game with selected ship.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shipId": 1
}
```

**Success Response (201):**
```json
{
  "message": "Game started successfully",
  "gameState": {
    "id": 1,
    "user_id": 1,
    "ship_id": 1,
    "current_planet_id": 1,
    "credits": 1000,
    "turns_used": 0,
    "ship_name": "Light Freighter",
    "cargo_capacity": 50,
    "planet_name": "Terra Nova",
    "planet_description": "A bustling trade hub in the inner system",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Ship ID required
- `400`: Game already exists for this user
- `401`: Access token required
- `403`: Invalid or expired token

---

### POST /game/travel

Travel to another planet.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "planetId": 2
}
```

**Success Response (200):**
```json
{
  "message": "Travel successful",
  "gameState": {
    "id": 1,
    "user_id": 1,
    "ship_id": 1,
    "current_planet_id": 2,
    "credits": 850,
    "turns_used": 6,
    "ship_name": "Light Freighter",
    "cargo_capacity": 50,
    "planet_name": "Mars Station",
    "planet_description": "Industrial mining colony on the red planet",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Planet ID required
- `400`: Already at this planet
- `401`: Access token required
- `403`: Invalid or expired token
- `404`: No game found for user

---

## Market and Trading Endpoints

### GET /market/:planetId

Get market prices for a specific planet. No authentication required.

**URL Parameters:**
- `planetId`: Integer ID of the planet

**Success Response (200):**
```json
[
  {
    "commodity_id": 1,
    "commodity_name": "Electronics",
    "buy_price": 150,
    "sell_price": 120,
    "stock": 50
  },
  {
    "commodity_id": 2,
    "commodity_name": "Food",
    "buy_price": 80,
    "sell_price": 60,
    "stock": 100
  },
  {
    "commodity_id": 3,
    "commodity_name": "Minerals",
    "buy_price": 200,
    "sell_price": 180,
    "stock": 25
  }
]
```

**Error Responses:**
- `400`: Invalid planet ID

---

### GET /cargo

Get cargo inventory for authenticated user's game.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "cargo": [
    {
      "commodity_id": 1,
      "commodity_name": "Electronics",
      "quantity": 10
    },
    {
      "commodity_id": 2,
      "commodity_name": "Food",
      "quantity": 5
    }
  ],
  "totalCargo": 15,
  "cargoCapacity": 50
}
```

**Success Response (200) - Empty Cargo:**
```json
{
  "cargo": [],
  "totalCargo": 0,
  "cargoCapacity": 50
}
```

**Error Responses:**
- `401`: Access token required
- `403`: Invalid or expired token
- `404`: No game found for user

---

### POST /buy

Purchase commodities from the current planet's market.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "commodityId": 1,
  "quantity": 5
}
```

**Success Response (200):**
```json
{
  "message": "Purchased 5 units of Electronics",
  "gameState": {
    "id": 1,
    "user_id": 1,
    "ship_id": 1,
    "current_planet_id": 1,
    "credits": 250,
    "turns_used": 6,
    "ship_name": "Light Freighter",
    "cargo_capacity": 50,
    "planet_name": "Terra Nova",
    "planet_description": "A bustling trade hub in the inner system",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "totalCost": 750
}
```

**Error Responses:**
- `400`: Valid commodity ID and quantity required
- `400`: Insufficient credits
- `400`: Insufficient cargo space
- `400`: Insufficient stock
- `401`: Access token required
- `403`: Invalid or expired token
- `404`: No game found for user
- `404`: Commodity not available at this planet

---

### POST /sell

Sell commodities to the current planet's market.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "commodityId": 1,
  "quantity": 3
}
```

**Success Response (200):**
```json
{
  "message": "Sold 3 units of Electronics",
  "gameState": {
    "id": 1,
    "user_id": 1,
    "ship_id": 1,
    "current_planet_id": 1,
    "credits": 1110,
    "turns_used": 7,
    "ship_name": "Light Freighter",
    "cargo_capacity": 50,
    "planet_name": "Terra Nova",
    "planet_description": "A bustling trade hub in the inner system",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "totalEarned": 360
}
```

**Error Responses:**
- `400`: Valid commodity ID and quantity required
- `400`: Insufficient cargo to sell
- `401`: Access token required
- `403`: Invalid or expired token
- `404`: No game found for user
- `404`: Commodity not available at this planet

---

## Statistics and Information Endpoints

### GET /stats

Get comprehensive game statistics for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "user": {
    "username": "pilot123"
  },
  "game": {
    "credits": 1250,
    "turnsUsed": 8,
    "currentPlanet": "Terra Nova",
    "ship": "Light Freighter",
    "cargoCapacity": 50,
    "totalCargo": 12
  }
}
```

**Error Responses:**
- `401`: Access token required
- `403`: Invalid or expired token
- `404`: No game found for user

---

### GET /health

Health check endpoint. No authentication required.

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Rate Limiting

The API implements rate limiting:
- **Limit:** 100 requests per 15-minute window per IP address
- **Headers:** Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when the current window resets

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** BCrypt hashing for password storage
- **CORS Protection:** Cross-Origin Resource Sharing configuration
- **Helmet Security:** Security headers for HTTP responses
- **Input Validation:** Request body and parameter validation
- **SQL Injection Protection:** Parameterized queries

---

## Game Flow Example

1. **Register/Login:**
   ```bash
   POST /auth/register
   # Store the returned token
   ```

2. **View Available Ships:**
   ```bash
   GET /ships
   ```

3. **Start Game:**
   ```bash
   POST /game/start
   # With Authorization header and shipId
   ```

4. **Check Market:**
   ```bash
   GET /market/1
   ```

5. **Buy Commodities:**
   ```bash
   POST /buy
   # With Authorization header, commodityId, and quantity
   ```

6. **Travel to Another Planet:**
   ```bash
   POST /game/travel
   # With Authorization header and planetId
   ```

7. **Sell Commodities:**
   ```bash
   POST /sell
   # With Authorization header, commodityId, and quantity
   ```

8. **Check Statistics:**
   ```bash
   GET /stats
   # With Authorization header
   ```

---

## Development and Testing

- **Test Environment:** Jest test suite included
- **API Testing:** Supertest for endpoint testing
- **Test Coverage:** Comprehensive test coverage for all endpoints
- **Database:** PostgreSQL with transaction support
- **Development Mode:** Hot-reload support with nodemon

**Running Tests:**
```bash
npm test
```

**Starting Development Server:**
```bash
npm run dev:server
```