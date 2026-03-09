# Fast To Fast Payment

Use `@fastxyz/sdk` for direct Fast transfers.

## Steps

1. Install `@fastxyz/sdk`
2. Create the client on `testnet` unless the user explicitly asked for mainnet
3. Call `setup()` once
4. Check balance
5. Call `send({ to, amount, token? })`

## Example

```ts
import { fast } from '@fastxyz/sdk';

const f = fast({ network: 'testnet' });

await f.setup();

const before = await f.balance();
const sent = await f.send({
  to: 'fast1recipient...',
  amount: '1.0',
});

console.log(before, sent);
```

## Checks

- recipient must be `fast1...`
- amount is a human-readable string
- do not proceed if the user has not confirmed the recipient
