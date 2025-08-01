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

    // Run Jest tests (fuel system tests)
    console.log('⛽ Fuel System Tests');
    console.log('=' .repeat(50));
    const { execSync } = await import('child_process');
    try {
      const jestOutput = execSync('NODE_OPTIONS=--experimental-vm-modules npx jest tests/fuel-system.test.js --silent', { encoding: 'utf8' });
      const jestPassed = 25; // We know there are 25 fuel system tests
      totalTests += jestPassed;
      passedTests += jestPassed;
      console.log(`✅ Passed: ${jestPassed}/${jestPassed}\n`);
    } catch (error) {
      console.log('❌ Some Jest tests failed\n');
      const jestTotal = 25;
      totalTests += jestTotal;
      // Don't add to passedTests if failed
    }

    // Run Jest tests (planet distance system tests)
    console.log('🌍 Planet Distance & Geography Tests');
    console.log('=' .repeat(50));
    try {
      const jestOutput = execSync('NODE_OPTIONS=--experimental-vm-modules npx jest tests/test-planet-distance.test.js --silent', { encoding: 'utf8' });
      const jestPassed = 27; // Actual number of planet distance tests
      totalTests += jestPassed;
      passedTests += jestPassed;
      console.log(`✅ Passed: ${jestPassed}/${jestPassed}\n`);
    } catch (error) {
      console.log('❌ Some Jest tests failed\n');
      const jestTotal = 27;
      totalTests += jestTotal;
      // Don't add to passedTests if failed
    }

    // Run Jest tests (planet classification system tests)
    console.log('🏷️  Planet Classification Tests');
    console.log('=' .repeat(50));
    try {
      const jestOutput = execSync('NODE_OPTIONS=--experimental-vm-modules npx jest tests/planet-classification.test.js --silent', { encoding: 'utf8' });
      const jestPassed = 27; // Actual number of planet classification tests
      totalTests += jestPassed;
      passedTests += jestPassed;
      console.log(`✅ Passed: ${jestPassed}/${jestPassed}\n`);
    } catch (error) {
      console.log('❌ Some Jest tests failed\n');
      const jestTotal = 27;
      totalTests += jestTotal;
      // Don't add to passedTests if failed
    }

    // Run Jest tests (fuel trading system tests)
    console.log('💰 Fuel Trading System Tests');
    console.log('=' .repeat(50));
    try {
      const jestOutput = execSync('NODE_OPTIONS=--experimental-vm-modules npx jest tests/fuel-trading.test.js --silent', { encoding: 'utf8' });
      const jestPassed = 26; // Actual number of fuel trading tests
      totalTests += jestPassed;
      passedTests += jestPassed;
      console.log(`✅ Passed: ${jestPassed}/${jestPassed}\n`);
    } catch (error) {
      console.log('❌ Some Jest tests failed\n');
      const jestTotal = 26;
      totalTests += jestTotal;
      // Don't add to passedTests if failed
    }

    // Run Jest tests (commodities system tests)
    console.log('📦 Commodities System Tests');
    console.log('=' .repeat(50));
    try {
      const jestOutput = execSync('NODE_OPTIONS=--experimental-vm-modules npx jest tests/commodities-system.test.js --silent', { encoding: 'utf8' });
      const jestPassed = 30; // Actual number of commodities system tests
      totalTests += jestPassed;
      passedTests += jestPassed;
      console.log(`✅ Passed: ${jestPassed}/${jestPassed}\n`);
    } catch (error) {
      console.log('❌ Some Jest tests failed\n');
      const jestTotal = 30;
      totalTests += jestTotal;
      // Don't add to passedTests if failed
    }

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