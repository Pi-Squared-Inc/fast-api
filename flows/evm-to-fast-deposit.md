# EVM To Fast Deposit

This is an AllSet deposit flow using `@fastxyz/allset-sdk`.

## Preconditions

- supported source chain in the current SDK config
- supported token mapping in the current SDK config
- EVM sender address
- Fast receiver address
- EVM private key and RPC URL

## Example

```ts
import { allsetProvider, createEvmExecutor } from '@fastxyz/allset-sdk';

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
  receiverAddress: 'fast1YourFastAddress',
  evmExecutor,
});
```

## Checks

- `receiverAddress` must be `fast1...`
- `amount` is raw base units
- if approval is needed, the executor will handle it before deposit
- unsupported token mappings should be called out before writing code
