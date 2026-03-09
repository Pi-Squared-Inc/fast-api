# Chain To Chain Via Fast

This is a composed flow, not one SDK call.

## Structure

1. Deposit from the source EVM chain into Fast using `@fastxyz/allset-sdk`
2. Withdraw from Fast to the destination EVM chain using `@fastxyz/allset-sdk`

## Important Constraint

This only works if both bridge legs are individually supported by the shipped SDK config. Do not describe it as atomic or universally available.

## Skeleton

```ts
const deposit = await allsetProvider.bridge({
  fromChain: 'arbitrum',
  toChain: 'fast',
  fromToken: 'USDC',
  toToken: 'fastUSDC',
  fromDecimals: 6,
  amount: '1000000',
  senderAddress: '0xSourceAddress',
  receiverAddress: 'fast1IntermediateAddress',
  evmExecutor,
});

const withdraw = await allsetProvider.bridge({
  fromChain: 'fast',
  toChain: 'arbitrum',
  fromToken: 'fastUSDC',
  toToken: 'USDC',
  fromDecimals: 6,
  amount: '1000000',
  senderAddress: 'fast1IntermediateAddress',
  receiverAddress: '0xDestinationAddress',
  fastClient,
});
```

## Checks

- explain the two-leg model to the user
- verify support for both legs before implementing
- do not hide timing or relayer risk
