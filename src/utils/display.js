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
    console.log(chalk.cyan('╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.green(` ${icons.user} Pilot: ${user.username}`.padEnd(50)) + 
                chalk.cyan('║') + chalk.bold.yellow(` ${icons.credits} ${game.credits} Credits`.padEnd(11)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.bold.blue(` ${icons.ship} Ship: ${game.ship_name}`.padEnd(50)) + 
                chalk.cyan('║') + chalk.bold.magenta(` ${icons.turns} Turn ${game.turns_used}`.padEnd(11)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.bold.white(` ${icons.location} Location: ${game.planet_name}`.padEnd(62)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════╝'));
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
  
  console.log(chalk.cyan('╔══════════════════════╦═══════════╦═══════════╦═══════════╗'));
  console.log(chalk.cyan('║') + chalk.bold.white(' Commodity'.padEnd(20)) + 
              chalk.cyan('║') + chalk.bold.green(' Buy Price'.padEnd(9)) + 
              chalk.cyan('║') + chalk.bold.red(' Sell Price'.padEnd(10)) + 
              chalk.cyan('║') + chalk.bold.blue(' Stock'.padEnd(9)) + chalk.cyan('║'));
  console.log(chalk.cyan('╠══════════════════════╬═══════════╬═══════════╬═══════════╣'));
  
  prices.forEach(item => {
    console.log(
      chalk.cyan('║') + chalk.white(` ${item.commodity_name}`.padEnd(20)) +
      chalk.cyan('║') + chalk.green(` ${item.buy_price}`.padEnd(9)) +
      chalk.cyan('║') + chalk.red(` ${item.sell_price}`.padEnd(10)) +
      chalk.cyan('║') + chalk.blue(` ${item.stock}`.padEnd(9)) + chalk.cyan('║')
    );
  });
  
  console.log(chalk.cyan('╚══════════════════════╩═══════════╩═══════════╩═══════════╝'));
};

export const displayCargoTable = (cargo, totalCargo, capacity) => {
  displayTitle('CARGO HOLD', icons.cargo);
  console.log(chalk.bold.yellow(`${icons.cargo} Cargo Capacity: ${totalCargo}/${capacity}`));
  console.log();
  
  if (cargo.length === 0) {
    console.log(chalk.cyan(ascii.cargo));
    console.log(chalk.gray('📭 Cargo hold is empty.'));
  } else {
    console.log(chalk.cyan('╔══════════════════════╦═══════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(' Commodity'.padEnd(20)) + 
                chalk.cyan('║') + chalk.bold.yellow(' Quantity'.padEnd(9)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠══════════════════════╬═══════════╣'));
    
    cargo.forEach(item => {
      console.log(
        chalk.cyan('║') + chalk.white(` ${item.commodity_name}`.padEnd(20)) +
        chalk.cyan('║') + chalk.yellow(` ${item.quantity}`.padEnd(9)) + chalk.cyan('║')
      );
    });
    
    console.log(chalk.cyan('╚══════════════════════╩═══════════╝'));
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