#!/usr/bin/env node

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
  displayInfo,
  displayNavigationHelp,
  addBackOption,
  addCancelOption,
  icons 
} from './utils/display.js';

let currentUser = null;
let currentGame = null;

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(chalk.cyan('\n\n🚀 Thanks for playing Sorstar! Safe travels, pilot!'));
  process.exit(0);
});

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
  displayNavigationHelp();

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

  let needsContinuePrompt = false;

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
      needsContinuePrompt = await travelMenu();
      break;
    case 'View Game Stats':
      await viewStats();
      break;
    case 'Exit Game':
      displaySuccess('Thanks for playing Sorstar! Safe travels, pilot! 🚀');
      process.exit(0);
  }

  if (needsContinuePrompt) {
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  }
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
    console.log(chalk.cyan(`   ${icons.cargo} Cargo: ${ship.cargoCapacity} units`));
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
        name: `${icons.ship} ${ship.name} (${ship.cargoCapacity} cargo, ${ship.cost} credits)`,
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
  
  const prices = await getMarketPrices(currentGame.currentPlanetId);
  displayMarketTable(prices, currentGame.planetName);
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Market options:',
      choices: addBackOption([
        { name: `${icons.buy} Buy Commodities`, value: 'buy' },
        { name: `${icons.sell} Sell Commodities`, value: 'sell' }
      ], 'Back to Main Menu')
    }
  ]);

  switch (action) {
    case 'buy':
      await buyMenu();
      break;
    case 'sell':
      await sellMenu();
      break;
    case 'BACK':
      return;
  }
};

const viewCargo = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  displayCargoTable(cargo, totalCargo, currentGame.cargoCapacity);
  
  if (cargo.length > 0) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Cargo options:',
        choices: addBackOption([
          { name: `${icons.sell} Sell Commodities`, value: 'sell' }
        ], 'Back to Main Menu')
      }
    ]);

    if (action === 'sell') {
      await sellMenu();
    }
  } else {
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  }
};

const buyMenu = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  displayTitle('COMMODITY PURCHASE CENTER', icons.buy);
  
  const prices = await getMarketPrices(currentGame.currentPlanetId);
  const cargo = await getCargo(currentGame.id);
  const totalCargo = cargo.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalCargo >= currentGame.cargoCapacity) {
    displayError('Cargo hold is full! Cannot purchase additional commodities.');
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  // Display market table with buy options
  displayMarketTable(prices, currentGame.planetName);
  console.log(chalk.bold.cyan(`💰 Available Credits: ${currentGame.credits.toLocaleString()}`));
  console.log(chalk.bold.magenta(`📦 Cargo Space: ${totalCargo}/${currentGame.cargoCapacity} units`));
  console.log();

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: `${icons.buy} Select commodity to purchase:`,
      choices: addBackOption(prices.map((item, index) => ({
        name: `${index + 1}. ${item.commodity_name} - ${item.buy_price} credits each (Stock: ${item.stock})`,
        value: item
      })), 'Back to Main Menu')
    }
  ]);

  if (commodity === 'BACK') {
    return;
  }

  const maxAffordable = Math.floor(currentGame.credits / commodity.buy_price);
  const maxSpace = currentGame.cargoCapacity - totalCargo;
  const maxPurchase = Math.min(maxAffordable, maxSpace, commodity.stock);

  if (maxPurchase <= 0) {
    displayError('Cannot buy any of this commodity (insufficient credits, space, or stock).');
    return;
  }

  const { quantity } = await inquirer.prompt([
    {
      type: 'number',
      name: 'quantity',
      message: `${icons.cargo} How many units would you like to purchase? (Max: ${maxPurchase}, 0 to cancel)`,
      validate: (input) => input >= 0 && input <= maxPurchase,
      default: 0
    }
  ]);

  if (quantity === 0) {
    displayInfo('Purchase cancelled.');
    return;
  }

  try {
    await buyCommodity(currentGame.id, commodity.commodity_id, quantity, commodity.buy_price);
    currentGame.credits -= quantity * commodity.buy_price;
    displaySuccess(`Purchased ${quantity} units of ${commodity.commodity_name} for ${quantity * commodity.buy_price} credits.`);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  } catch (error) {
    displayError(`Transaction failed: ${error.message}`);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  }
};

const sellMenu = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  displayTitle('COMMODITY SALES CENTER', icons.sell);
  
  const cargo = await getCargo(currentGame.id);
  
  if (cargo.length === 0) {
    displayError('No cargo to sell! Your cargo hold is empty.');
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  // Display cargo table with sell options
  displayCargoTable(cargo);
  console.log(chalk.bold.cyan(`💰 Current Credits: ${currentGame.credits.toLocaleString()}`));
  console.log();

  const { commodity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commodity',
      message: `${icons.sell} Select commodity to sell:`,
      choices: addBackOption(cargo.map((item, index) => ({
        name: `${index + 1}. ${item.commodity_name} - ${item.quantity} units owned`,
        value: item
      })), 'Back to Main Menu')
    }
  ]);

  if (commodity === 'BACK') {
    return;
  }

  const prices = await getMarketPrices(currentGame.currentPlanetId);
  const marketPrice = prices.find(p => p.commodity_id === commodity.commodity_id);

  const { quantity } = await inquirer.prompt([
    {
      type: 'number',
      name: 'quantity',
      message: `${icons.credits} How many units would you like to sell? (Max: ${commodity.quantity}, Price: ${marketPrice.sell_price} each, 0 to cancel)`,
      validate: (input) => input >= 0 && input <= commodity.quantity,
      default: 0
    }
  ]);

  if (quantity === 0) {
    displayInfo('Sale cancelled.');
    return;
  }

  try {
    await sellCommodity(currentGame.id, commodity.commodity_id, quantity, marketPrice.sell_price);
    currentGame.credits += quantity * marketPrice.sell_price;
    displaySuccess(`Sold ${quantity} units of ${commodity.commodity_name} for ${quantity * marketPrice.sell_price} credits.`);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  } catch (error) {
    displayError(`Transaction failed: ${error.message}`);
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  }
};

const travelMenu = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  displayTitle('HYPERSPACE NAVIGATION CENTER', icons.travel);
  
  const planets = await getPlanets();
  const otherPlanets = planets.filter(p => p.id !== currentGame.currentPlanetId);

  const { planet } = await inquirer.prompt([
    {
      type: 'list',
      name: 'planet',
      message: `${icons.travel} Set destination coordinates:`,
      choices: addBackOption(otherPlanets.map(p => ({
        name: `${icons.planet} ${p.name} - ${p.description}`,
        value: p
      })), 'Back to Main Menu')
    }
  ]);

  if (planet === 'BACK') {
    return false; // No continue prompt needed
  }

  await travelToPlanet(currentGame.id, planet.id);
  currentGame.currentPlanetId = planet.id;
  currentGame.planetName = planet.name;
  currentGame.turnsUsed++;
  
  displaySuccess(`Hyperspace jump complete! Arrived at ${planet.name}. Turn consumed.`);
  return true; // Show continue prompt for successful travel
};

const viewStats = async () => {
  console.clear();
  displayHeader(currentUser, currentGame);
  displayGameStats(currentUser, currentGame);
  
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

export const startCli = async () => {
  await mainMenu();
};