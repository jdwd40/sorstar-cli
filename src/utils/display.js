import chalk from 'chalk';

export const ascii = {
  logo: `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗ ██████╗ ██████╗ ███████╗████████╗ █████╗ ██████╗   ║
║   ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗  ║
║   ███████╗██║   ██║██████╔╝███████╗   ██║   ███████║██████╔╝  ║
║   ╚════██║██║   ██║██╔══██╗╚════██║   ██║   ██╔══██║██╔══██╗  ║
║   ███████║╚██████╔╝██║  ██║███████║   ██║   ██║  ██║██║  ██║  ║
║   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ║
║                                                               ║
║           🚀  INTERSTELLAR TRADING COMMAND CENTER  🚀         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,

  ship: `
       🚀
    ╭─────╮
   ╱ ▰ ▰ ▰ ╲
  ╱▰ ▰ ▰ ▰ ▰╲
 ╱▰▰▰▰▰▰▰▰▰▰▰╲
 ╲▰▰▰▰▰▰▰▰▰▰▰╱
  ╲▰ ▰ ▰ ▰ ▰╱
   ╲ ▰ ▰ ▰ ╱
    ╰─────╯
       🔥
`,

  planet: `
      🌍
   ╭─────────╮
  ╱  ░░░░░░░  ╲
 ╱ ░░░▓▓▓░░░░░ ╲
│ ░░▓▓▓▓▓▓▓░░░░ │
│ ░▓▓▓▓▓▓▓▓▓░░░ │
│ ░░▓▓▓▓▓▓▓░░░░ │
 ╲ ░░░▓▓▓░░░░░ ╱
  ╲  ░░░░░░░  ╱
   ╰─────────╯
`,

  credits: `
     💰
   ╭─────╮
  ╱   $   ╲
 ╱  $$$$$  ╲
│ $$$ C $$$│
 ╲  $$$$$  ╱
  ╲   $   ╱
   ╰─────╯
`,

  cargo: `
     📦
   ╭─────╮
  ╱▐▀▀▀▀▀▌╲
 ╱ ▐ ■ ■ ▌ ╲
│  ▐ ■ ■ ▌  │
│  ▐ ■ ■ ▌  │
 ╲ ▐▄▄▄▄▄▌ ╱
  ╲▁▁▁▁▁▁▁╱
   ╰─────╯
`
};

export const icons = {
  // Navigation
  location: '📍',
  travel: '🚀',
  planet: '🌍',
  
  // Trading
  market: '🏪',
  buy: '💰',
  sell: '💸',
  cargo: '📦',
  credits: '💎',
  
  // Game
  stats: '📊',
  ship: '🛸',
  user: '👤',
  turns: '⏱️',
  
  // Actions
  view: '👁️',
  exit: '🚪',
  login: '🔑',
  create: '✨',
  back: '🔙',
  cancel: '❌',
  
  // Status
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

export const displayTitle = (title, icon = '') => {
  const totalWidth = 65;
  const iconStr = icon ? `${icon} ` : '';
  const titleStr = `${iconStr}${title}`;
  const padding = Math.max(0, totalWidth - titleStr.length - 4);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log(chalk.cyan('╔' + '═'.repeat(totalWidth - 2) + '╗'));
  console.log(chalk.cyan('║') + ' '.repeat(leftPad) + chalk.bold.white(titleStr) + ' '.repeat(rightPad) + chalk.cyan('║'));
  console.log(chalk.cyan('╚' + '═'.repeat(totalWidth - 2) + '╝'));
  console.log();
};

export const displayHeader = (user, game) => {
  console.clear();
  console.log(chalk.bold.cyan(ascii.logo));
  
  if (user && game) {
    // Define column widths for pilot info table
    const headerWidth = 64; // Total width of the header box
    const leftCol = 50;     // Left column width
    const rightCol = 12;    // Right column width (total - left - 2 for borders)
    
    console.log(chalk.cyan('╔' + '═'.repeat(headerWidth) + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.green(` ${icons.user} Pilot: ${user.username}`.padEnd(leftCol)) + 
                chalk.cyan('║') + chalk.bold.yellow(` ${icons.credits} ${game.credits} Credits`.padEnd(rightCol)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.bold.blue(` ${icons.ship} Ship: ${game.ship_name}`.padEnd(leftCol)) + 
                chalk.cyan('║') + chalk.bold.magenta(` ${icons.turns} Turn ${game.turns_used}`.padEnd(rightCol)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.bold.white(` ${icons.location} Location: ${game.planet_name}`.padEnd(headerWidth)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚' + '═'.repeat(headerWidth) + '╝'));
  }
  console.log();
};

export const displayGameStats = (user, game) => {
  console.log(chalk.cyan(ascii.ship));
  console.log(chalk.bold.yellow('🎮 GAME STATISTICS'));
  console.log(chalk.cyan('─'.repeat(40)));
  console.log(chalk.white(`${icons.user} Pilot: `) + chalk.bold.green(user.username));
  console.log(chalk.white(`${icons.ship} Ship: `) + chalk.bold.blue(game.ship_name));
  console.log(chalk.white(`${icons.location} Location: `) + chalk.bold.cyan(game.planet_name));
  console.log(chalk.white(`${icons.credits} Credits: `) + chalk.bold.yellow(game.credits));
  console.log(chalk.white(`${icons.turns} Turns Used: `) + chalk.bold.magenta(game.turns_used));
  console.log(chalk.white(`${icons.cargo} Cargo Capacity: `) + chalk.bold.white(game.cargo_capacity));
};

export const displayMarketTable = (prices, planetName) => {
  displayTitle('GALACTIC MARKET', icons.market);
  console.log(chalk.bold.yellow(`${icons.planet} Current Location: ${planetName}`));
  console.log();
  
  // Define column widths (including space for content + padding)
  const colWidths = {
    commodity: 22,  // 22 chars for commodity name
    buyPrice: 11,   // 11 chars for buy price  
    sellPrice: 11,  // 11 chars for sell price
    stock: 11       // 11 chars for stock
  };
  
  console.log(chalk.cyan('╔' + '═'.repeat(colWidths.commodity) + '╦' + '═'.repeat(colWidths.buyPrice) + '╦' + '═'.repeat(colWidths.sellPrice) + '╦' + '═'.repeat(colWidths.stock) + '╗'));
  console.log(chalk.cyan('║') + chalk.bold.white(' Commodity'.padEnd(colWidths.commodity)) + 
              chalk.cyan('║') + chalk.bold.green(' Buy Price'.padEnd(colWidths.buyPrice)) + 
              chalk.cyan('║') + chalk.bold.red(' Sell Price'.padEnd(colWidths.sellPrice)) + 
              chalk.cyan('║') + chalk.bold.blue(' Stock'.padEnd(colWidths.stock)) + chalk.cyan('║'));
  console.log(chalk.cyan('╠' + '═'.repeat(colWidths.commodity) + '╬' + '═'.repeat(colWidths.buyPrice) + '╬' + '═'.repeat(colWidths.sellPrice) + '╬' + '═'.repeat(colWidths.stock) + '╣'));
  
  prices.forEach(item => {
    console.log(
      chalk.cyan('║') + chalk.white(` ${item.commodity_name}`.padEnd(colWidths.commodity)) +
      chalk.cyan('║') + chalk.green(` ${item.buy_price}`.padEnd(colWidths.buyPrice)) +
      chalk.cyan('║') + chalk.red(` ${item.sell_price}`.padEnd(colWidths.sellPrice)) +
      chalk.cyan('║') + chalk.blue(` ${item.stock}`.padEnd(colWidths.stock)) + chalk.cyan('║')
    );
  });
  
  console.log(chalk.cyan('╚' + '═'.repeat(colWidths.commodity) + '╩' + '═'.repeat(colWidths.buyPrice) + '╩' + '═'.repeat(colWidths.sellPrice) + '╩' + '═'.repeat(colWidths.stock) + '╝'));
};

export const displayCargoTable = (cargo, totalCargo, capacity) => {
  displayTitle('CARGO HOLD', icons.cargo);
  console.log(chalk.bold.yellow(`${icons.cargo} Cargo Capacity: ${totalCargo}/${capacity}`));
  console.log();
  
  if (cargo.length === 0) {
    console.log(chalk.cyan(ascii.cargo));
    console.log(chalk.gray('📭 Cargo hold is empty.'));
  } else {
    // Define column widths for cargo table
    const colWidths = {
      commodity: 22,  // 22 chars for commodity name
      quantity: 11    // 11 chars for quantity
    };
    
    console.log(chalk.cyan('╔' + '═'.repeat(colWidths.commodity) + '╦' + '═'.repeat(colWidths.quantity) + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(' Commodity'.padEnd(colWidths.commodity)) + 
                chalk.cyan('║') + chalk.bold.yellow(' Quantity'.padEnd(colWidths.quantity)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠' + '═'.repeat(colWidths.commodity) + '╬' + '═'.repeat(colWidths.quantity) + '╣'));
    
    cargo.forEach(item => {
      console.log(
        chalk.cyan('║') + chalk.white(` ${item.commodity_name}`.padEnd(colWidths.commodity)) +
        chalk.cyan('║') + chalk.yellow(` ${item.quantity}`.padEnd(colWidths.quantity)) + chalk.cyan('║')
      );
    });
    
    console.log(chalk.cyan('╚' + '═'.repeat(colWidths.commodity) + '╩' + '═'.repeat(colWidths.quantity) + '╝'));
  }
};

export const displaySuccess = (message) => {
  console.log(chalk.green(`${icons.success} ${message}`));
};

export const displayError = (message) => {
  console.log(chalk.red(`${icons.error} ${message}`));
};

export const displayWarning = (message) => {
  console.log(chalk.yellow(`${icons.warning} ${message}`));
};

export const displayInfo = (message) => {
  console.log(chalk.blue(`${icons.info} ${message}`));
};

export const addBackOption = (choices, backText = 'Back to Main Menu') => {
  return [{ name: `${icons.back} ${backText}`, value: 'BACK' }, ...choices];
};

export const addCancelOption = (choices, cancelText = 'Cancel') => {
  return [{ name: `${icons.cancel} ${cancelText}`, value: 'CANCEL' }, ...choices];
};

export const displayNavigationHelp = () => {
  console.log();
  console.log(chalk.gray(`💡 Navigation: Use arrow keys to select, Enter to confirm, Ctrl+C to exit`));
};