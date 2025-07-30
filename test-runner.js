#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Sorstar API Tests...\n');

// Simple test runner that imports and runs our test functions
const runTests = async () => {
  try {
    // Import our test modules
    const { testAuth } = await import('./tests/simple-auth.test.js');
    const { testGame } = await import('./tests/simple-game.test.js');
    const { testGameplay } = await import('./tests/simple-gameplay.test.js');
    const { testTradingWorkflow } = await import('./tests/trading-workflow.test.js');

    let totalTests = 0;
    let passedTests = 0;

    // Run authentication tests
    console.log('🔐 Authentication Tests');
    console.log('=' .repeat(50));
    const authResults = await testAuth();
    totalTests += authResults.total;
    passedTests += authResults.passed;
    console.log(`✅ Passed: ${authResults.passed}/${authResults.total}\n`);

    // Run game management tests
    console.log('🎮 Game Management Tests');
    console.log('=' .repeat(50));
    const gameResults = await testGame();
    totalTests += gameResults.total;
    passedTests += gameResults.passed;
    console.log(`✅ Passed: ${gameResults.passed}/${gameResults.total}\n`);

    // Run gameplay tests
    console.log('🚀 Gameplay Tests');
    console.log('=' .repeat(50));
    const gameplayResults = await testGameplay();
    totalTests += gameplayResults.total;
    passedTests += gameplayResults.passed;
    console.log(`✅ Passed: ${gameplayResults.passed}/${gameplayResults.total}\n`);

    // Run trading workflow tests
    console.log('💰 Trading Workflow Tests');
    console.log('=' .repeat(50));
    const tradingResults = await testTradingWorkflow();
    totalTests += tradingResults.total;
    passedTests += tradingResults.passed;
    console.log(`✅ Passed: ${tradingResults.passed}/${tradingResults.total}\n`);

    // Summary
    console.log('📊 Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
};

runTests();