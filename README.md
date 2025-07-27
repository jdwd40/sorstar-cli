# Sorstar - Turn-Based CLI Trading Game

A space trading game where players travel between planets, buying and selling commodities to maximize profit.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database and create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up database tables:
```bash
npm run db:setup
```

4. Seed the database with initial data:
```bash
npm run seed
```

5. Start the game:
```bash
npm start
```

## Game Features

- **Ship Selection**: Choose from 4 different ship types with varying cargo capacities
- **Planet Travel**: Visit 7 unique planets, each with different market conditions
- **Trading**: Buy and sell 15 different commodities
- **Turn System**: Each action (travel, buy, sell) consumes one turn
- **Market Dynamics**: Planets specialize in certain commodities with better prices
- **Persistent Progress**: Game state is saved to database

## Commodities

The game features 15 tradable commodities:
- Metals, Rare Minerals, Gas, Crystals, Water
- Energy Cells, Synthetic Fibers, Food, BioMatter
- Plasma Fuel, Titanium, Neutronium, Antimatter
- Dark Matter, Silicates

## Commands

- `npm start` - Start the game
- `npm run dev` - Start with auto-reload
- `npm run db:setup` - Create database tables
- `npm run seed` - Populate database with initial data