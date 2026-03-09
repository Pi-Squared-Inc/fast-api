# AllSet SDK

Use this when the user wants to move value between Fast and a supported EVM route.

## Install

```bash
npm install @fastxyz/allset-sdk
```

## Public API

```ts
import {
  allsetProvider,
  createEvmExecutor,
  createFastClient,
} from '@fastxyz/allset-sdk';
```

- `allsetProvider.bridge(...)`: perform a bridge leg
- `createEvmExecutor(privateKey, rpcUrl, chainId)`: send approvals and deposit transactions from EVM
- `createFastClient(...)`: create a Fast-side client for withdrawal flows

## Supported Directions

- EVM -> Fast deposit
- Fast -> EVM withdraw

This SDK does not expose a single EVM -> EVM bridge call. Cross-chain EVM movement is composed from two legs through Fast.

## Current Support Limits

- Network posture: testnet-focused
- EVM chains in current bridge config: `arbitrum`, `ethereum`
- Token mapping actually shipped today: Arbitrum Sepolia `USDC` and `fastUSDC`
- Ethereum Sepolia has bridge config but no shipped token mapping yet
- Amounts are raw base-unit strings such as `'1000000'` for 1 USDC

## EVM To Fast Deposit

Use an EVM executor and a Fast bech32m receiver:

```ts
const evmExecutor = createEvmExecutor(
  process.env.EVM_PRIVATE_KEY!,
  process.env.ARBITRUM_SEPOLIA_RPC_URL!,
  421614,
);

const result = await allsetProvider.bridge({
  fromChain: 'arbitrum',
  toChain: 'fast',
  fromToken: 'USDC',
  toToken: 'fastUSDC',
  fromDecimals: 6,
  amount: '1000000',
  senderAddress: '0xYourEvmAddress',
  receiverAddress: 'fast1yourfastaddress',
  evmExecutor,
});
```

## Fast To EVM Withdraw

Use a Fast client and an EVM receiver:

```ts
const result = await allsetProvider.bridge({
  fromChain: 'fast',
  toChain: 'arbitrum',
  fromToken: 'fastUSDC',
  toToken: 'USDC',
  fromDecimals: 6,
  amount: '1000000',
  senderAddress: 'fast1yourfastaddress',
  receiverAddress: '0xYourEvmAddress',
  fastClient,
});
```

The `fastClient` must expose:

- `submit(...)`
- `evmSign(...)`
- `address`

## Failure Modes To Watch

- `INVALID_PARAMS`: missing `evmExecutor` or `fastClient`
- `INVALID_ADDRESS`: wrong Fast or EVM address format for the chosen direction
- `TOKEN_NOT_FOUND`: token mapping not shipped for that route
- `UNSUPPORTED_OPERATION`: route is not Fast <-> EVM
- `TX_FAILED`: approval, deposit, or relayer leg failed

## Use This Instead Of Other FAST Packages When

- the user explicitly wants bridging
- the workflow crosses Fast and an EVM chain
- x402 auto-bridge behavior needs to be explained or debugged
