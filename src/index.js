#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { startCli } from './cli.js';
import { startServer } from './server.js';

const program = new Command();

program
  .name('sorstar')
  .description('A turn-based CLI trading game with API server support')
  .version('1.0.0');

program
  .command('play')
  .description('Start the interactive CLI game')
  .action(async () => {
    console.log(chalk.cyan('🚀 Starting Sorstar CLI Game...'));
    await startCli();
  });

program
  .command('server')
  .description('Start the API server for web frontend')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .action((options) => {
    console.log(chalk.cyan('🚀 Starting Sorstar API Server...'));
    process.env.PORT = options.port;
    startServer();
  });

// Default action when no command is specified
program.action(async () => {
  console.log(chalk.yellow('🚀 Welcome to Sorstar!'));
  console.log(chalk.white('Choose how you want to run the game:'));
  console.log();
  console.log(chalk.cyan('  sorstar play    ') + chalk.gray('- Start the interactive CLI game'));
  console.log(chalk.cyan('  sorstar server  ') + chalk.gray('- Start the API server (default port 3000)'));
  console.log(chalk.cyan('  sorstar server -p 8080  ') + chalk.gray('- Start the API server on port 8080'));
  console.log();
  console.log(chalk.dim('Use --help for more information'));
});

program.parse();