# x402 Pay An API

Use `@fastxyz/x402-client` when the user is the payer.

## EVM Example

```ts
import { x402Pay } from '@fastxyz/x402-client';

const result = await x402Pay({
  url: 'https://api.example.com/premium',
  wallet: {
    type: 'evm',
    privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
    address: process.env.EVM_ADDRESS as `0x${string}`,
  },
  verbose: true,
});
```

## Auto-Bridge Example

```ts
const result = await x402Pay({
  url: 'https://api.example.com/premium',
  wallet: [fastWallet, evmWallet],
  verbose: true,
});
```

## Flow

1. Make the request
2. Parse `402 Payment Required`
3. Pick a supported network for the available wallet
4. Sign and attach `X-PAYMENT`
5. Retry the request

## Checks

- if both Fast and EVM are accepted, the client prefers Fast
- auto-bridge depends on explicit bridge helper configs, not a generic any-chain path
