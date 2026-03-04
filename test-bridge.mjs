/**
 * Quick test for SETUSDC → USDC bridge to Arbitrum Sepolia
 * Tests the updated IntentClaim struct with deadline field
 */
import { money } from './dist/src/index.js';
import * as fs from 'fs';
import { privateKeyToAccount } from 'viem/accounts';

// Load wallets
const fastWallet = JSON.parse(fs.readFileSync('/home/openclaw/.money/keys/fast.json', 'utf8'));
const evmWallet = JSON.parse(fs.readFileSync('/home/openclaw/.money/keys/evm.json', 'utf8'));

// Derive EVM address
const evmAccount = privateKeyToAccount(`0x${evmWallet.privateKey}`);

console.log('=== SETUSDC → USDC Bridge Test (Arbitrum Sepolia) ===\n');
console.log('Fast wallet pubkey:', fastWallet.publicKey.slice(0, 16) + '...');
console.log('EVM wallet:', evmAccount.address);

// Setup SDK
console.log('\nSetting up Fast chain...');
await money.setup({
  chain: 'fast',
  privateKey: fastWallet.privateKey,
  network: 'testnet',
});

console.log('Setting up Arbitrum chain...');
await money.setup({
  chain: 'arbitrum',
  privateKey: evmWallet.privateKey,
  network: 'testnet',
});

// Check balances
console.log('\n--- Balances Before ---');
try {
  const fastBalance = await money.balance({ chain: 'fast', token: 'SETUSDC', network: 'testnet' });
  console.log('Fast SETUSDC:', fastBalance.formatted);
} catch (err) {
  console.log('Fast SETUSDC: Error -', err.message);
}

try {
  const arbBalance = await money.balance({ chain: 'arbitrum', token: 'USDC', network: 'testnet' });
  console.log('Arb USDC:', arbBalance.formatted);
} catch (err) {
  console.log('Arb USDC: Error -', err.message);
}

// Bridge 0.1 SETUSDC → USDC
const amount = 0.1;
console.log(`\n--- Bridging ${amount} SETUSDC → USDC ---`);

try {
  const result = await money.bridge({
    from: { chain: 'fast', token: 'SETUSDC' },
    to: { chain: 'arbitrum', token: 'USDC' },
    amount,
    network: 'testnet',
  });
  
  console.log('\n✅ Bridge result:', JSON.stringify(result, null, 2));
  
  // Check balances after
  console.log('\n--- Balances After ---');
  const fastBalanceAfter = await money.balance({ chain: 'fast', token: 'SETUSDC', network: 'testnet' });
  console.log('Fast SETUSDC:', fastBalanceAfter.formatted);
  
  // Note: USDC may take a moment to arrive
  console.log('(USDC balance may take a few minutes to update on Arbitrum)');
  
} catch (err) {
  console.error('\n❌ Bridge failed:', err.message);
  if (err.details) console.error('Details:', JSON.stringify(err.details, null, 2));
  if (err.note) console.error('Note:', err.note);
}
