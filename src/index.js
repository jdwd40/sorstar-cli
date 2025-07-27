#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createUser, authenticateUser } from './services/authService.js';
import { 
  getShips, 
  createGame, 
  getGameState, 
  getPlanets, 
  travelToPlanet, 
  getMarketPrices, 
  getCargo, 
  buyCommodity, 
  sellCommodity 
} from './services/gameService.js';

const program = new Command();

program
  .name('sorstar')
  .description('A turn-based CLI trading game')
  .version('1.0.0');

let currentUser = null;
let currentGame = null;

const mainMenu = async () => {
  if (!currentUser) {
    await authMenu();
    if (!currentUser) return;
  }

  currentGame = await getGameState(currentUser.id);
  
  if (!currentGame) {
    await shipSelection();
    currentGame = await getGameState(currentUser.id);
  }

  console.clear();
  console.log(chalk.cyan('=== SORSTAR TRADING GAME ==='));
  console.log(chalk.green(`Welcome back, ${currentUser.username}!`));
  console.log(chalk.yellow(`Ship: ${currentGame.ship_name}`));
  console.log(chalk.yellow(`Location: ${currentGame.planet_name}`));
  console.log(chalk.yellow(`Credits: ${currentGame.credits}`));
  console.log(chalk.yellow(`Turns Used: ${currentGame.turns_used}`));
  console.log();

  const choices = [
    'View Market Prices',
    'View Cargo',
    'Buy Commodities',
    'Sell Commodities',
    'Travel to Another Planet',
    'View Game Stats',
    'Exit Game'
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices
    }
  ]);

  switch (action) {
    case 'View Market Prices':
      await viewMarket();
      break;
    case 'View Cargo':
      await viewCargo();
      break;
    case 'Buy Commodities':
      await buyMenu();
      break;
    case 'Sell Commodities':
      await sellMenu();
      break;
    case 'Travel to Another Planet':
      await travelMenu();
      break;
    case 'View Game Stats':
      await viewStats();
      break;
    case 'Exit Game':
      console.log(chalk.green('Thanks for playing Sorstar!'));
      process.exit(0);
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  await mainMenu();
};

const authMenu = async () => {
  console.clear();
  console.log(chalk.cyan('=== SORSTAR TRADING GAME ==='));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Welcome! Please choose an option:',
      choices: ['Login', 'Create Account', 'Exit']
    }
  ]);

  if (action === 'Exit') {
    process.exit(0);
  }

  const { username, password } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' }
  ]);

  try {
    if (action === 'Create Account') {
      currentUser = await createUser(username, password);
      console.log(chalk.green(`Account created successfully! Welcome, ${currentUser.username}!`));
    } else {
      currentUser = await authenticateUser(username, password);
      console.log(chalk.green(`Welcome back, ${currentUser.username}!`));
    }
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to try again...' }]);
    await authMenu();
  }
};

const shipSelection = async () => {
  console.clear();
  console.log(chalk.cyan('=== SHIP SELECTION ==='));
  console.log(chalk.yellow('Choose your starting ship:'));
  
  const ships = await getShips();
  
  ships.forEach(ship => {
    console.log(chalk.white(`${ship.name} - ${ship.cargo_capacity} cargo - ${ship.cost} credits`));
    console.log(chalk.gray(`  ${ship.description}`));
  });

  const { selectedShip } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedShip',
      message: 'Select your ship:',
      choices: ships.map(ship => ({
        name: `${ship.name} (${ship.cargo_capacity} cargo, ${ship.cost} credits)`,
        value: ship.id
      }))
    }
  ]);

  await createGame(currentUser.id, selectedShip);
  console.log(chalk.green('Game started! You begin at Terra Nova with 1000 credits.'));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const viewMarket = async () => {
  console.clear();
  console.log(chalk.cyan('=== MARKET PRICES ==='));
  console.log(chalk.yellow(`Current Location: ${currentGame.planet_name}`));
  console.log();
  
  const prices = await getMarketPrices(currentGame.current_planet_id);
  
  console.log(chalk.white('Commodity'.padEnd(20) + 'Buy Price'.padEnd(12) + 'Sell Price'.padEnd(12) + 'Stock'));
  console.log('-'.repeat(50));
  
  prices.forEach(item => {
    console.log(
      chalk.white(item.commodity_name.padEnd(20)) +
      chalk.green(item.buy_price.toString().padEnd(12)) +
      chalk.red(item.sell_price.toString().padEnd(12)) +
      chalk.blue(item.stock.toString())
    );
  });
};

const viewCargo = async () => {
  console.clear();
  console.log(chalk.cyan('=== CARGO HOLD ==='));
  
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  console.log(chalk.yellow(`Cargo Capacity: ${totalCargo}/${currentGame.cargo_capacity}`));
  console.log();
  
  if (cargo.length === 0) {
    console.log(chalk.gray('Cargo hold is empty.'));
  } else {
    console.log(chalk.white('Commodity'.padEnd(20) + 'Quantity'));
    console.log('-'.repeat(30));
    
    cargo.forEach(item => {
      console.log(chalk.white(item.commodity_name.padEnd(20) + item.quantity.toString()));
    });
  }
};

const buyMenu = async () => {
  const prices = await getMarketPrices(currentGame.current_planet_id);
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalCargo >= currentGame.cargo_capacity) {
    console.log(chalk.red('Cargo hold is full!'));
    return;
  }

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: 'What would you like to buy?',
      choices: prices.map(item => ({
        name: `${item.commodity_name} - ${item.buy_price} credits each (Stock: ${item.stock})`,
        value: item
      }))
    }
  ]);

  const maxAffordable = Math.floor(currentGame.credits / commodity.buy_price);
  const maxSpace = currentGame.cargo_capacity - totalCargo;
  const maxPurchase = Math.min(maxAffordable, maxSpace, commodity.stock);

  if (maxPurchase <= 0) {
    console.log(chalk.red('Cannot buy any of this commodity (insufficient credits, space, or stock).'));
    return;
  }

  const { quantity } = await inquirer.prompt([
    {
      type: 'number',
      name: 'quantity',
      message: `How many units? (Max: ${maxPurchase})`,
      validate: (input) => input > 0 && input <= maxPurchase
    }
  ]);

  try {
    await buyCommodity(currentGame.id, commodity.commodity_id, quantity, commodity.buy_price);
    currentGame.credits -= quantity * commodity.buy_price;
    console.log(chalk.green(`Purchased ${quantity} units of ${commodity.commodity_name} for ${quantity * commodity.buy_price} credits.`));
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
};

const sellMenu = async () => {
  const cargo = await getCargo(currentGame.id);
  
  if (cargo.length === 0) {
    console.log(chalk.red('No cargo to sell!'));
    return;
  }

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: 'What would you like to sell?',
      choices: cargo.map(item => ({
        name: `${item.commodity_name} - ${item.quantity} units`,
        value: item
      }))
    }
  ]);

  const prices = await getMarketPrices(currentGame.current_planet_id);
  const marketPrice = prices.find(p => p.commodity_id === commodity.commodity_id);

  const { quantity } = await inquirer.prompt([
    {
      type: 'number',
      name: 'quantity',
      message: `How many units? (Max: ${commodity.quantity}, Price: ${marketPrice.sell_price} each)`,
      validate: (input) => input > 0 && input <= commodity.quantity
    }
  ]);

  try {
    await sellCommodity(currentGame.id, commodity.commodity_id, quantity, marketPrice.sell_price);
    currentGame.credits += quantity * marketPrice.sell_price;
    console.log(chalk.green(`Sold ${quantity} units of ${commodity.commodity_name} for ${quantity * marketPrice.sell_price} credits.`));
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
};

const travelMenu = async () => {
  const planets = await getPlanets();
  const otherPlanets = planets.filter(p => p.id !== currentGame.current_planet_id);

  const { planet } = await inquirer.prompt([
    {
      type: 'list',
      name: 'planet',
      message: 'Where would you like to travel?',
      choices: otherPlanets.map(p => ({
        name: `${p.name} - ${p.description}`,
        value: p
      }))
    }
  ]);

  await travelToPlanet(currentGame.id, planet.id);
  currentGame.current_planet_id = planet.id;
  currentGame.planet_name = planet.name;
  currentGame.turns_used++;
  
  console.log(chalk.green(`Traveled to ${planet.name}. Turn used.`));
};

const viewStats = async () => {
  console.clear();
  console.log(chalk.cyan('=== GAME STATISTICS ==='));
  console.log(chalk.yellow(`Player: ${currentUser.username}`));
  console.log(chalk.yellow(`Ship: ${currentGame.ship_name}`));
  console.log(chalk.yellow(`Current Location: ${currentGame.planet_name}`));
  console.log(chalk.yellow(`Credits: ${currentGame.credits}`));
  console.log(chalk.yellow(`Turns Used: ${currentGame.turns_used}`));
  console.log(chalk.yellow(`Cargo Capacity: ${currentGame.cargo_capacity}`));
};

program.action(async () => {
  await mainMenu();
});

program.parse();