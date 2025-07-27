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
import { 
  displayHeader, 
  displayTitle, 
  displayGameStats, 
  displayMarketTable, 
  displayCargoTable, 
  displaySuccess, 
  displayError, 
  displayWarning,
  icons 
} from './utils/display.js';

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

  displayHeader(currentUser, currentGame);

  const choices = [
    { name: `${icons.market} View Market Prices`, value: 'View Market Prices' },
    { name: `${icons.cargo} View Cargo Hold`, value: 'View Cargo' },
    { name: `${icons.buy} Buy Commodities`, value: 'Buy Commodities' },
    { name: `${icons.sell} Sell Commodities`, value: 'Sell Commodities' },
    { name: `${icons.travel} Travel to Another Planet`, value: 'Travel to Another Planet' },
    { name: `${icons.stats} View Game Statistics`, value: 'View Game Stats' },
    { name: `${icons.exit} Exit Game`, value: 'Exit Game' }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${icons.ship} Command Center - What would you like to do?`,
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
      displaySuccess('Thanks for playing Sorstar! Safe travels, pilot! 🚀');
      process.exit(0);
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  await mainMenu();
};

const authMenu = async () => {
  displayHeader();
  displayTitle('PILOT AUTHENTICATION CENTER', icons.login);
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `${icons.user} Welcome, pilot! Please choose an option:`,
      choices: [
        { name: `${icons.login} Login to Existing Account`, value: 'Login' },
        { name: `${icons.create} Create New Pilot Account`, value: 'Create Account' },
        { name: `${icons.exit} Exit`, value: 'Exit' }
      ]
    }
  ]);

  if (action === 'Exit') {
    process.exit(0);
  }

  const { username, password } = await inquirer.prompt([
    { type: 'input', name: 'username', message: `${icons.user} Enter your pilot name:` },
    { type: 'password', name: 'password', message: `${icons.login} Enter your access code:` }
  ]);

  try {
    if (action === 'Create Account') {
      currentUser = await createUser(username, password);
      displaySuccess(`Account created successfully! Welcome aboard, Commander ${currentUser.username}!`);
    } else {
      currentUser = await authenticateUser(username, password);
      displaySuccess(`Welcome back, Commander ${currentUser.username}!`);
    }
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  } catch (error) {
    displayError(`Authentication failed: ${error.message}`);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to try again...' }]);
    await authMenu();
  }
};

const shipSelection = async () => {
  displayHeader(currentUser);
  displayTitle('STARSHIP SELECTION HANGAR', icons.ship);
  console.log(chalk.yellow(`${icons.info} Choose your starting vessel, Commander:`));
  console.log();
  
  const ships = await getShips();
  
  ships.forEach(ship => {
    console.log(chalk.bold.white(`${icons.ship} ${ship.name}`));
    console.log(chalk.cyan(`   ${icons.cargo} Cargo: ${ship.cargo_capacity} units`));
    console.log(chalk.yellow(`   ${icons.credits} Cost: ${ship.cost} credits`));
    console.log(chalk.gray(`   📝 ${ship.description}`));
    console.log();
  });

  const { selectedShip } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedShip',
      message: `${icons.ship} Select your starship:`,
      choices: ships.map(ship => ({
        name: `${icons.ship} ${ship.name} (${ship.cargo_capacity} cargo, ${ship.cost} credits)`,
        value: ship.id
      }))
    }
  ]);

  await createGame(currentUser.id, selectedShip);
  displaySuccess('Mission initiated! You begin at Terra Nova with 1000 credits. Good luck, pilot!');
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to launch...' }]);
};

const viewMarket = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  
  const prices = await getMarketPrices(currentGame.current_planet_id);
  displayMarketTable(prices, currentGame.planet_name);
};

const viewCargo = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  displayCargoTable(cargo, totalCargo, currentGame.cargo_capacity);
};

const buyMenu = async () => {
  const prices = await getMarketPrices(currentGame.current_planet_id);
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalCargo >= currentGame.cargo_capacity) {
    displayError('Cargo hold is full! Cannot purchase additional commodities.');
    return;
  }

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: `${icons.buy} What commodity would you like to purchase?`,
      choices: prices.map(item => ({
        name: `${icons.credits} ${item.commodity_name} - ${item.buy_price} credits each (Stock: ${item.stock})`,
        value: item
      }))
    }
  ]);

  const maxAffordable = Math.floor(currentGame.credits / commodity.buy_price);
  const maxSpace = currentGame.cargo_capacity - totalCargo;
  const maxPurchase = Math.min(maxAffordable, maxSpace, commodity.stock);

  if (maxPurchase <= 0) {
    displayError('Cannot buy any of this commodity (insufficient credits, space, or stock).');
    return;
  }

  const { quantity } = await inquirer.prompt([
    {
      type: 'number',
      name: 'quantity',
      message: `${icons.cargo} How many units would you like to purchase? (Max: ${maxPurchase})`,
      validate: (input) => input > 0 && input <= maxPurchase
    }
  ]);

  try {
    await buyCommodity(currentGame.id, commodity.commodity_id, quantity, commodity.buy_price);
    currentGame.credits -= quantity * commodity.buy_price;
    displaySuccess(`Purchased ${quantity} units of ${commodity.commodity_name} for ${quantity * commodity.buy_price} credits.`);
  } catch (error) {
    displayError(`Transaction failed: ${error.message}`);
  }
};

const sellMenu = async () => {
  const cargo = await getCargo(currentGame.id);
  
  if (cargo.length === 0) {
    displayError('No cargo to sell! Your cargo hold is empty.');
    return;
  }

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: `${icons.sell} What commodity would you like to sell?`,
      choices: cargo.map(item => ({
        name: `${icons.cargo} ${item.commodity_name} - ${item.quantity} units`,
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
      message: `${icons.credits} How many units would you like to sell? (Max: ${commodity.quantity}, Price: ${marketPrice.sell_price} each)`,
      validate: (input) => input > 0 && input <= commodity.quantity
    }
  ]);

  try {
    await sellCommodity(currentGame.id, commodity.commodity_id, quantity, marketPrice.sell_price);
    currentGame.credits += quantity * marketPrice.sell_price;
    displaySuccess(`Sold ${quantity} units of ${commodity.commodity_name} for ${quantity * marketPrice.sell_price} credits.`);
  } catch (error) {
    displayError(`Transaction failed: ${error.message}`);
  }
};

const travelMenu = async () => {
  const planets = await getPlanets();
  const otherPlanets = planets.filter(p => p.id !== currentGame.current_planet_id);

  const { planet } = await inquirer.prompt([
    {
      type: 'list',
      name: 'planet',
      message: `${icons.travel} Set destination coordinates:`,
      choices: otherPlanets.map(p => ({
        name: `${icons.planet} ${p.name} - ${p.description}`,
        value: p
      }))
    }
  ]);

  await travelToPlanet(currentGame.id, planet.id);
  currentGame.current_planet_id = planet.id;
  currentGame.planet_name = planet.name;
  currentGame.turns_used++;
  
  displaySuccess(`Hyperspace jump complete! Arrived at ${planet.name}. Turn consumed.`);
};

const viewStats = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  displayGameStats(currentUser, currentGame);
};

program.action(async () => {
  await mainMenu();
});

program.parse();