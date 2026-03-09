# Fast To EVM Withdraw

This is an AllSet withdrawal flow using `@fastxyz/allset-sdk`.

## Preconditions

- supported destination chain in the current SDK config
- compatible Fast client
- Fast sender address
- EVM receiver address

## Example

```ts
import { allsetProvider } from '@fastxyz/allset-sdk';

const result = await allsetProvider.bridge({
  fromChain: 'fast',
  toChain: 'arbitrum',
  fromToken: 'fastUSDC',
  toToken: 'USDC',
  fromDecimals: 6,
  amount: '1000000',
  senderAddress: 'fast1YourFastAddress',
  receiverAddress: '0xYourEvmAddress',
  fastClient,
});
```

## Fast Client Contract

The Fast client must provide:

- `submit(...)`
- `evmSign(...)`
- `address`

## Checks

- `receiverAddress` must be `0x...`
- `amount` is raw base units
- withdrawal may fail at the relayer leg even after the Fast-side action is created
