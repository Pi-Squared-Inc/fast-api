# Fast SDK

Use this when the request is purely about Fast network wallets, balances, transfers, signatures, token metadata, or low-level claim submission.

## Install

```bash
npm install @fastxyz/sdk
```

## Public API

```ts
import { fast, FastError } from '@fastxyz/sdk';

const f = fast({ network: 'testnet' });
```

- `fast({ network?, rpcUrl? })`: create a client
- `FastError`: typed operational errors with `code`, `message`, and optional `note`

## Standard Flow

```ts
const f = fast({ network: 'testnet' });

const { address } = await f.setup();
const balance = await f.balance();
const sent = await f.send({ to: 'fast1...', amount: '1.0' });
```

Call `setup()` before everything else. It creates or loads the local wallet and returns the `fast1...` address.

## Methods That Matter

- `setup()`: create or load the wallet
- `balance({ token? })`: get native `SET` or a token by held symbol or token id
- `send({ to, amount, token? })`: send native `SET` or a custom token
- `sign({ message })`: sign with the local Ed25519 key
- `verify({ message, signature, address })`: verify a signature
- `tokens()`: list held tokens and balances
- `tokenInfo({ token })`: fetch metadata for a held symbol or token id
- `submit({ recipient, claim })`: low-level custom claim submission
- `exportKeys()`: return public key and address only
- `address`: current wallet address after setup

## Important Data Rules

- Default network is `testnet`. Only use `mainnet` if the user explicitly asks.
- Transfer amounts are human-readable strings, for example `'1.5'`.
- Fast addresses must be bech32m with `fast` prefix.
- The native token is `SET`.

## Safety Rules

- Never overwrite or delete `~/.fast/keys/`.
- Fast sends are irreversible.
- Confirm the recipient address before calling `send()`.

## Error Handling

The package throws `FastError`. Common codes:

- `CHAIN_NOT_CONFIGURED`: call `setup()` first
- `INSUFFICIENT_BALANCE`: fund the wallet and retry
- `INVALID_ADDRESS`: fix the `fast1...` address
- `TOKEN_NOT_FOUND`: use a held symbol or a valid token id
- `TX_FAILED`: wait, inspect, retry once if appropriate
- `INVALID_PARAMS`: fix the input shape

## Use This Instead Of Other FAST Packages When

- the task is a direct Fast payment or balance check
- the user wants Fast signatures or token metadata
- the user does not need EVM bridging or 402 HTTP payment behavior
